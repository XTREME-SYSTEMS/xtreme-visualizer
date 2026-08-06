// Base44 Payments checkout starter — base44/functions/create-checkout/entry.ts
//
// Provided by the platform. Do NOT rewrite the plumbing (session construct + persisting the
// join key + return-URL resolution). Edit only the region marked `// ===== APP-SPECIFIC =====`
// to resolve — SERVER-SIDE — what the buyer is purchasing and its price.
//
// PUBLIC by default: a buyer does NOT need to be logged in to check out. Backend function routes
// are callable anonymously, and storefront buyers often have no account — requiring login here is
// what blocks real purchases. If a buyer IS signed in we record their app-user id as the
// fulfillment target; otherwise the webhook grants by the buyer's email. Never 401 here.
//
// CRITICAL: Wix's checkout has NO custom-metadata field, so the returned `checkoutSession.id` is
// the ONLY thing that ties this payment back to this purchase. We persist it on a pending
// Base44Purchase BEFORE redirecting; the webhook resolves the purchase by that same id
// (order.checkoutId === checkoutSession.id). Skipping this write makes fulfillment impossible.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const CONSTRUCT_URL = "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct";

// The app's public base URL for the buyer's return links. Use the platform-injected
// `X-Base44-App-Url` header (server-set from app state — correct behind custom domains), then the
// server-owned `WIX_CHECKOUT_APP_URL` secret. We do NOT fall back to the request `Origin`: it's
// caller-controlled, so a spoofed Origin would make Wix send the paid buyer to an attacker page
// (open redirect). Both sources above are always present for a connected payments app.
function resolveAppUrl(req: Request): string {
  return (
    req.headers.get("x-base44-app-url") ||
    Deno.env.get("WIX_CHECKOUT_APP_URL") ||
    ""
  );
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    // Read per request, never at module scope: disconnecting payments blanks these, and a warm
    // isolate that captured them at startup would keep charging with the old credentials.
    const WIX_API_KEY = Deno.env.get("WIX_CHECKOUT_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_CHECKOUT_SITE_ID");
    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error("create-checkout: Wix payment config not set");
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500 });
    }

    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      // Fail closed: with no server-owned app URL (both the X-Base44-App-Url header AND the
      // WIX_CHECKOUT_APP_URL secret are absent — e.g. a slug-less or partially-wired app) we'd build
      // relative return links like `/ThankYou` and strand the paid buyer. Never fall back to the
      // caller-controlled Origin (open redirect). Reconnecting payments repopulates the secret.
      console.error("create-checkout: no app URL (X-Base44-App-Url header and WIX_CHECKOUT_APP_URL both empty)");
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500 });
    }
    const base44 = createClientFromRequest(req);

    // Capture the buyer's app-user id IF signed in — but never REQUIRE it. This is the
    // fulfillment target the webhook grants to; when absent (anonymous buyer) the webhook grants
    // by the email the buyer enters on Wix's checkout page.
    let appUser = null;
    try {
      appUser = await base44.auth.me();
    } catch (_) {
      appUser = null;
    }

    const body = await req.json().catch(() => ({}));

    // ===== APP-SPECIFIC =====
    // Visual-X billing: the client sends an Invoice id as `productId` (one-time charge) or
    // a MaintenanceSubscription id with `productType: "maintenance"` (recurring subscription).
    // We resolve SERVER-SIDE so a buyer can't tamper the amount.
    const db = base44.asServiceRole;
    const productType = body.productType ?? "invoice";
    let quantity = 1;
    let productName = "";
    let price = "0";
    let currency = "USD";
    let subscriptionInfo: any = null;
    let customerEmail: string | null = null;
    let thankYouPath = "/ThankYou";
    let postFlowPath = "/";
    let purchaseProductId = "";
    let maintenanceSub: any = null;

    if (productType === "maintenance") {
      // #8: Recurring maintenance subscription via Wix Payments
      const subId = String(body.productId ?? "");
      if (!subId) {
        return new Response(JSON.stringify({ error: "Missing subscription id" }), { status: 400 });
      }
      try {
        const subs = await db.entities.MaintenanceSubscription.filter({ id: subId });
        maintenanceSub = subs?.[0] ?? null;
      } catch (_) {
        return new Response(JSON.stringify({ error: "Unknown subscription" }), { status: 400 });
      }
      if (!maintenanceSub) {
        return new Response(JSON.stringify({ error: "Unknown subscription" }), { status: 400 });
      }
      if (maintenanceSub.status === "active") {
        return new Response(JSON.stringify({ error: "Subscription already active" }), { status: 400 });
      }
      productName = maintenanceSub.plan_name || "Maintenance Plan";
      price = Number(maintenanceSub.price).toFixed(2);
      if (parseFloat(price) < 0.5) {
        return new Response(JSON.stringify({ error: "Amount must be at least 0.50" }), { status: 400 });
      }
      currency = "USD";
      customerEmail = maintenanceSub.customer_email || appUser?.email || null;
      purchaseProductId = "maintenance";
      // Build subscriptionInfo for recurring billing
      const freq = maintenanceSub.frequency || "YEAR";
      subscriptionInfo = {
        subscriptionSettings: {
          frequency: freq,
          autoRenewal: true,
        },
        title: maintenanceSub.plan_name,
        description: `Annual maintenance and sealer coat service for ${maintenanceSub.customer_name}`,
      };
      thankYouPath = "/ThankYou";
      postFlowPath = "/billing";
    } else {
      // Default: one-time invoice payment
      const invoiceId = String(body.productId ?? "");
      if (!invoiceId) {
        return new Response(JSON.stringify({ error: "Missing invoice id" }), { status: 400 });
      }
      let invoice: any = null;
      try {
        const invoices = await db.entities.Invoice.filter({ id: invoiceId });
        invoice = invoices?.[0] ?? null;
      } catch (_) {
        return new Response(JSON.stringify({ error: "Unknown invoice" }), { status: 400 });
      }
      if (!invoice) {
        return new Response(JSON.stringify({ error: "Unknown invoice" }), { status: 400 });
      }
      if (invoice.status === "paid") {
        return new Response(JSON.stringify({ error: "Invoice already paid" }), { status: 400 });
      }
      productName = `${invoice.type === "final" ? "Final Invoice" : "Deposit"} — ${invoice.customer_name}`;
      price = Number(invoice.amount).toFixed(2);
      if (parseFloat(price) < 0.5) {
        return new Response(JSON.stringify({ error: "Amount must be at least 0.50" }), { status: 400 });
      }
      currency = invoice.currency || "USD";
      customerEmail = invoice.customer_email || appUser?.email || null;
      purchaseProductId = invoice.type;
      thankYouPath = "/ThankYou";
      postFlowPath = "/";
    }
    // ===== END APP-SPECIFIC =====

    const total = parseFloat(price) * quantity;
    if (!(total >= 0.5)) {
      // Wix rejects charges under 0.50 in the charged currency (major units, not cents).
      return new Response(JSON.stringify({ error: "Amount must be at least 0.50" }), { status: 400 });
    }

    const constructBody = {
      cart: {
        items: [{ name: productName, quantity, price, ...(subscriptionInfo ? { subscriptionInfo } : {}) }],
        ...(customerEmail ? { customerInfo: { email: customerEmail } } : {}),
      },
      callbackUrls: {
        thankYouPageUrl: `${appUrl}${thankYouPath}${productType === "maintenance" ? `?sub=${body.productId}` : `?invoice=${body.productId}`}`,
        postFlowUrl: `${appUrl}${postFlowPath}`,
      },
    };

    const wixRes = await fetch(CONSTRUCT_URL, {
      method: "POST",
      headers: {
        "Authorization": WIX_API_KEY,
        "wix-site-id": WIX_SITE_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(constructBody),
    });

    if (!wixRes.ok) {
      const errText = await wixRes.text();
      console.error("create-checkout: Wix construct failed", { status: wixRes.status, errText });
      return new Response(JSON.stringify({ error: "Could not start checkout" }), { status: 502 });
    }

    const { checkoutSession } = await wixRes.json();
    const checkoutSessionId: string = checkoutSession?.id;
    const redirectUrl: string = checkoutSession?.redirectUrl;

    if (!checkoutSessionId || !redirectUrl) {
      console.error("create-checkout: missing checkoutSession id/redirectUrl", checkoutSession);
      return new Response(JSON.stringify({ error: "Could not start checkout" }), { status: 502 });
    }

    // PERSIST THE JOIN KEY (the whole point). Pending until the webhook flips it to "paid".
    const purchase = await base44.asServiceRole.entities.Base44Purchase.create({
      checkoutSessionId,
      status: "pending",
      appUserId: appUser?.id ?? null,
      buyerEmail: customerEmail ?? appUser?.email ?? null,
      productId: purchaseProductId, // "deposit" | "final" | "maintenance" — the webhook reads this
      productName,
      quantity,
      amount: total.toFixed(2),
      currency,
    });

    // Link the product to this checkout session so the webhook can fulfill it.
    if (productType === "maintenance" && maintenanceSub) {
      await db.entities.MaintenanceSubscription.update(maintenanceSub.id, {
        checkout_session_id: checkoutSessionId,
        purchase_id: purchase.id,
        status: "pending",
      });
    } else {
      await db.entities.Invoice.update(String(body.productId), {
        status: "pending",
        checkout_session_id: checkoutSessionId,
        purchase_id: purchase.id,
      });
    }

    return new Response(JSON.stringify({ redirectUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout: unhandled error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});