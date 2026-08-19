// Pure payment webhook logic — shared by payments-webhook/entry.ts and unit tests.
// NO Deno or npm: imports. Uses only standard globals (Response, console, JSON, Date).
// Extracted verbatim from the original entry.ts to enable testing without the Deno runtime.
// Production semantics are preserved exactly — the entry.ts imports and calls these functions.

// Wix event types — byte-for-byte match with the live Wix webhook registration.
export const ORDER_APPROVED = "wix.ecom.v1.order_approved";
export const SUBSCRIPTION_CANCELED = "wix.ecom.subscription_contracts.v1.subscription_contract_canceled";
export const SUBSCRIPTION_EXPIRED = "wix.ecom.subscription_contracts.v1.subscription_contract_expired";

// Unwrap Wix's triple-nested envelope: the JWT payload has a `data` JSON string;
// that parses to an envelope with `eventType` and another `data` JSON string;
// that parses to the event data holding the order.
export function parseWixEnvelope(payload: Record<string, unknown>): { eventType: string; eventData: any } {
  const outer = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
  const eventType: string = outer?.eventType ?? (payload.eventType as string) ?? "";
  const eventData = typeof outer?.data === "string" ? JSON.parse(outer.data) : outer?.data;
  return { eventType, eventData };
}

export function extractOrder(eventData: any): any | null {
  return eventData?.order ?? null;
}

export function extractBuyerEmail(order: any): string | null {
  return (
    order?.buyerInfo?.email ??
    order?.billingInfo?.contactDetails?.email ??
    order?.billingInfo?.email ??
    null
  );
}

export function extractSubscriptionId(order: any): string | undefined {
  return (order?.lineItems ?? [])
    .map((li: any) => li?.subscriptionInfo?.id)
    .find((id: any) => !!id);
}

// JWT verification factory — receives jose functions via dependency injection so
// this module has no npm: import (Deno) or package import (Node) incompatibility.
// The entry.ts passes the real jose functions; tests pass the same functions from the dev dep.
export function createJwtVerifier(importSPKI: any, jwtVerify: any) {
  return async function verifyWebhookToken(token: string, publicKey: string): Promise<Record<string, unknown>> {
    const key = await importSPKI(publicKey, "RS256");
    const verified = await jwtVerify(token, key);
    return verified.payload as Record<string, unknown>;
  };
}

// DB shape the handlers depend on. entry.ts passes base44.asServiceRole; tests pass a mock.
export interface PaymentDb {
  entities: {
    Base44Purchase: {
      filter: (q: Record<string, string>) => Promise<any[]>;
      update: (id: string, data: Record<string, any>) => Promise<any>;
    };
    Invoice: {
      filter: (q: Record<string, string>) => Promise<any[]>;
      update: (id: string, data: Record<string, any>) => Promise<any>;
    };
    MaintenanceSubscription: {
      filter: (q: Record<string, string>) => Promise<any[]>;
      update: (id: string, data: Record<string, any>) => Promise<any>;
    };
    WorkOrder: {
      filter: (q: Record<string, string>) => Promise<any[]>;
      update: (id: string, data: Record<string, any>) => Promise<any>;
    };
  };
}

// Route an event to the correct handler. Returns the handler result or an "ignored" Response.
// Extracted so tests can verify routing without Deno.serve.
export async function routePaymentEvent(
  db: PaymentDb,
  eventType: string,
  eventData: any
): Promise<Response> {
  if (eventType === ORDER_APPROVED) {
    return await handleOrderApproved(db, eventData);
  }
  if (eventType === SUBSCRIPTION_CANCELED || eventType === SUBSCRIPTION_EXPIRED) {
    return await handleSubscriptionEnded(db, eventData, eventType);
  }
  console.log(`payments-webhook: ignoring event ${eventType}`);
  return new Response("OK", { status: 200 });
}

export async function handleOrderApproved(db: PaymentDb, eventData: any): Promise<Response> {
  const order = extractOrder(eventData);
  const checkoutId: string | undefined = order?.checkoutId;
  const orderId: string | undefined = order?.id;
  const subscriptionId: string | undefined = extractSubscriptionId(order);

  if (!checkoutId) {
    console.error("payments-webhook: ORDER_APPROVED missing order.checkoutId", { orderId });
    return new Response("OK", { status: 200 });
  }

  const matches = await db.entities.Base44Purchase.filter({ checkoutSessionId: checkoutId });
  const purchase = matches?.[0];

  if (!purchase) {
    console.warn("payments-webhook: no Base44Purchase for checkoutId yet, asking Wix to retry", { checkoutId, orderId });
    return new Response("Purchase not found yet", { status: 500 });
  }

  // IDEMPOTENCY + terminal states: Wix delivers ORDER_APPROVED more than once, and may deliver
  // a stale approval after a cancellation. Skip if already "paid" or "canceled".
  if (purchase.status === "paid" || purchase.status === "canceled") {
    console.log("payments-webhook: purchase already terminal, skipping", { checkoutId, status: purchase.status });
    return new Response("OK", { status: 200 });
  }

  const buyerEmail: string | null = purchase.buyerEmail ?? extractBuyerEmail(order);

  // ===== APP-SPECIFIC =====
  try {
    if (purchase.productId === "maintenance") {
      const subMatches = await db.entities.MaintenanceSubscription.filter({ checkout_session_id: checkoutId });
      const sub = subMatches?.[0];
      if (sub && sub.status !== "active") {
        await db.entities.MaintenanceSubscription.update(sub.id, {
          status: "active",
          subscription_id: subscriptionId ?? null,
          activated_at: new Date().toISOString(),
        });
        console.log("payments-webhook: maintenance subscription activated", { subId: sub.id, subscriptionId });
      }
    } else {
      const invMatches = await db.entities.Invoice.filter({ checkout_session_id: checkoutId });
      const invoice = invMatches?.[0];
      if (invoice && invoice.status !== "paid") {
        await db.entities.Invoice.update(invoice.id, {
          status: "paid",
          paid_at: new Date().toISOString(),
        });
        if (invoice.type === "final" && invoice.work_order_id) {
          const wo = await db.entities.WorkOrder.filter({ id: invoice.work_order_id });
          if (wo?.[0] && wo[0].status !== "completed") {
            await db.entities.WorkOrder.update(wo[0].id, { status: "completed" });
          }
        }
        console.log("payments-webhook: invoice marked paid", { invoiceId: invoice.id, type: invoice.type });
      }
    }
  } catch (err) {
    console.error("payments-webhook: grant failed", err);
    throw err; // stay "pending" so Wix retries
  }
  // ===== END APP-SPECIFIC =====

  await db.entities.Base44Purchase.update(purchase.id, {
    status: "paid",
    orderId: orderId ?? purchase.orderId ?? null,
    subscriptionId: subscriptionId ?? purchase.subscriptionId ?? null,
    buyerEmail: buyerEmail ?? purchase.buyerEmail ?? null,
    paidAt: new Date().toISOString(),
  });

  console.log("payments-webhook: fulfilled purchase", { purchaseId: purchase.id, checkoutId, orderId });
  return new Response("OK", { status: 200 });
}

export async function handleSubscriptionEnded(db: PaymentDb, eventData: any, eventType: string): Promise<Response> {
  const contract = eventData?.subscriptionContract ?? eventData?.entity ?? null;
  const subscriptionId: string | undefined = contract?.id;

  if (!subscriptionId) {
    console.error("payments-webhook: subscription event missing contract id");
    return new Response("OK", { status: 200 });
  }

  const matches = await db.entities.Base44Purchase.filter({ subscriptionId });
  const purchase = matches?.[0];
  if (!purchase) {
    console.warn("payments-webhook: no Purchase for subscription yet, asking Wix to retry", { subscriptionId });
    return new Response("Purchase not linkable yet", { status: 500 });
  }

  if (purchase.status === "canceled") {
    return new Response("OK", { status: 200 }); // Idempotent.
  }

  // ===== APP-SPECIFIC =====
  // Revoke runs BEFORE marking canceled: if it throws, the status stays as-is so
  // Wix's retry re-runs the revoke rather than hitting the "already canceled" short-circuit.
  try {
    if (purchase.productId === "maintenance") {
      const subMatches = await db.entities.MaintenanceSubscription.filter({ subscription_id: subscriptionId });
      const sub = subMatches?.[0];
      if (sub && sub.status === "active") {
        await db.entities.MaintenanceSubscription.update(sub.id, {
          status: eventType === SUBSCRIPTION_CANCELED ? "canceled" : "expired",
          canceled_at: new Date().toISOString(),
        });
        console.log("payments-webhook: maintenance subscription revoked", { subId: sub.id, subscriptionId });
      }
    }
  } catch (err) {
    console.error("payments-webhook: subscription revoke failed", err);
    throw err;
  }
  // ===== END APP-SPECIFIC =====

  await db.entities.Base44Purchase.update(purchase.id, {
    status: "canceled",
    canceledAt: new Date().toISOString(),
  });

  console.log("payments-webhook: revoked subscription", { purchaseId: purchase.id, subscriptionId });
  return new Response("OK", { status: 200 });
}