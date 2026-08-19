import { describe, it, expect, vi, beforeAll } from "vitest";
import { SignJWT, generateKeyPair, exportSPKI, importSPKI, jwtVerify } from "jose";
import {
  ORDER_APPROVED,
  SUBSCRIPTION_CANCELED,
  SUBSCRIPTION_EXPIRED,
  parseWixEnvelope,
  createJwtVerifier,
  routePaymentEvent,
  handleOrderApproved,
  handleSubscriptionEnded,
} from "../base44/shared/paymentsCore.ts";
import { resolveAppUrl, resolveCheckoutProduct } from "../base44/shared/checkoutCore.ts";

// ── Mock DB ──────────────────────────────────────────────────────────────────
// In-memory mock that simulates the Base44 SDK's filter/update calls.
// No real network, no real charges, no real emails — pure state mutation.
function makeMockDb(initial: {
  purchases?: any[];
  invoices?: any[];
  subs?: any[];
  workOrders?: any[];
} = {}) {
  const state = {
    purchases: initial.purchases || [],
    invoices: initial.invoices || [],
    subs: initial.subs || [],
    workOrders: initial.workOrders || [],
  };

  const filterArray = (arr: any[], q: Record<string, string>) =>
    arr.filter((item) => Object.entries(q).every(([key, val]) => item[key] === val));

  const updateItem = (arr: any[], id: string, data: any) => {
    const item = arr.find((x) => x.id === id);
    if (item) Object.assign(item, data);
    return item;
  };

  const db = {
    entities: {
      Base44Purchase: {
        filter: async (q: Record<string, string>) => filterArray(state.purchases, q),
        update: async (id: string, data: any) => updateItem(state.purchases, id, data),
      },
      Invoice: {
        filter: async (q: Record<string, string>) => filterArray(state.invoices, q),
        update: async (id: string, data: any) => updateItem(state.invoices, id, data),
      },
      MaintenanceSubscription: {
        filter: async (q: Record<string, string>) => filterArray(state.subs, q),
        update: async (id: string, data: any) => updateItem(state.subs, id, data),
      },
      WorkOrder: {
        filter: async (q: Record<string, string>) => filterArray(state.workOrders, q),
        update: async (id: string, data: any) => updateItem(state.workOrders, id, data),
      },
    },
  };

  return { db, state };
}

// ── JWT test keys ─────────────────────────────────────────────────────────────
let testKeys: { publicKey: any; privateKey: any; spki: string };
let wrongKeys: { publicKey: any; spki: string };

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  const wrong = await generateKeyPair("RS256");
  testKeys = { publicKey: pair.publicKey, privateKey: pair.privateKey, spki: await exportSPKI(pair.publicKey) };
  wrongKeys = { publicKey: wrong.publicKey, spki: await exportSPKI(wrong.publicKey) };
});

// ── A. Wix envelope parsing ────────────────────────────────────────────────────
describe("parseWixEnvelope", () => {
  it("A: parses a valid triple-nested Wix envelope", () => {
    const innerData = JSON.stringify({ order: { id: "o1", checkoutId: "cs1" } });
    const envelope = JSON.stringify({ eventType: ORDER_APPROVED, data: innerData });
    const payload = { data: envelope };
    const { eventType, eventData } = parseWixEnvelope(payload);
    expect(eventType).toBe(ORDER_APPROVED);
    expect(eventData.order.id).toBe("o1");
    expect(eventData.order.checkoutId).toBe("cs1");
  });

  it("A: falls back to top-level eventType claim when envelope lacks it", () => {
    const innerData = JSON.stringify({ order: { id: "o2" } });
    const envelope = JSON.stringify({ data: innerData });
    const payload = { data: envelope, eventType: ORDER_APPROVED };
    const { eventType } = parseWixEnvelope(payload);
    expect(eventType).toBe(ORDER_APPROVED);
  });

  // B. malformed envelope
  it("B: throws on malformed (non-JSON) envelope data", () => {
    const payload = { data: "{not valid json" };
    expect(() => parseWixEnvelope(payload)).toThrow();
  });

  it("B: throws on malformed inner data string", () => {
    const envelope = JSON.stringify({ eventType: ORDER_APPROVED, data: "{broken" });
    const payload = { data: envelope };
    expect(() => parseWixEnvelope(payload)).toThrow();
  });

  // C. missing event type
  it("C: returns empty eventType when neither envelope nor payload has it", () => {
    const payload = { data: JSON.stringify({ data: JSON.stringify({ order: {} }) }) };
    const { eventType } = parseWixEnvelope(payload);
    expect(eventType).toBe("");
  });
});

// ── D. invalid JWT / signature rejection ───────────────────────────────────────
describe("JWT verification (createJwtVerifier)", () => {
  const verify = createJwtVerifier(importSPKI, jwtVerify);

  it("D: rejects a JWT signed with the wrong key (invalid signature)", async () => {
    const token = await new SignJWT({ data: JSON.stringify({ eventType: "x", data: "{}" }) })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .sign(testKeys.privateKey);
    await expect(verify(token, wrongKeys.spki)).rejects.toThrow();
  });

  it("D: rejects a malformed (non-JWT) token", async () => {
    await expect(verify("not.a.jwt", testKeys.spki)).rejects.toThrow();
  });

  it("D: accepts a JWT signed with the correct key", async () => {
    const token = await new SignJWT({ data: JSON.stringify({ eventType: "x", data: "{}" }) })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .sign(testKeys.privateKey);
    const payload = await verify(token, testKeys.spki);
    expect(payload).toBeDefined();
    expect(payload.data).toBeDefined();
  });
});

// ── E-I. ORDER_APPROVED routing & idempotency ──────────────────────────────────
describe("ORDER_APPROVED routing", () => {
  it("E: routes ORDER_APPROVED to handleOrderApproved and fulfills the purchase", async () => {
    const { db, state } = makeMockDb({
      purchases: [{ id: "p1", checkoutSessionId: "cs1", status: "pending", productId: "deposit" }],
      invoices: [{ id: "inv1", checkout_session_id: "cs1", status: "draft", type: "deposit", amount: 500 }],
    });
    const res = await routePaymentEvent(db, ORDER_APPROVED, { order: { id: "o1", checkoutId: "cs1" } });
    expect(res.status).toBe(200);
    expect(state.purchases[0].status).toBe("paid");
    expect(state.invoices[0].status).toBe("paid");
  });

  // F. duplicate ORDER_APPROVED idempotency
  it("F: is idempotent on duplicate ORDER_APPROVED (already paid → skip)", async () => {
    const { db, state } = makeMockDb({
      purchases: [{ id: "p1", checkoutSessionId: "cs1", status: "paid", productId: "deposit", paidAt: "original" }],
      invoices: [{ id: "inv1", checkout_session_id: "cs1", status: "paid", type: "deposit" }],
    });
    const res = await routePaymentEvent(db, ORDER_APPROVED, { order: { id: "o1", checkoutId: "cs1" } });
    expect(res.status).toBe(200);
    expect(state.purchases[0].status).toBe("paid");
    expect(state.purchases[0].paidAt).toBe("original"); // unchanged
    expect(state.invoices[0].status).toBe("paid"); // unchanged
  });

  // G. already-paid terminal-state protection
  it("G: does not double-grant on a paid purchase (terminal-state protection)", async () => {
    const { db, state } = makeMockDb({
      purchases: [{ id: "p1", checkoutSessionId: "cs1", status: "paid", productId: "maintenance" }],
      subs: [{ id: "s1", checkout_session_id: "cs1", status: "active" }],
    });
    const res = await routePaymentEvent(db, ORDER_APPROVED, {
      order: { id: "o1", checkoutId: "cs1", lineItems: [{ subscriptionInfo: { id: "sub1" } }] },
    });
    expect(res.status).toBe(200);
    expect(state.subs[0].status).toBe("active"); // not re-activated
  });

  // H. already-canceled terminal-state protection
  it("H: does not resurrect a canceled purchase on late ORDER_APPROVED", async () => {
    const { db, state } = makeMockDb({
      purchases: [{ id: "p1", checkoutSessionId: "cs1", status: "canceled", productId: "maintenance" }],
      subs: [{ id: "s1", checkout_session_id: "cs1", status: "canceled" }],
    });
    const res = await routePaymentEvent(db, ORDER_APPROVED, {
      order: { id: "o1", checkoutId: "cs1", lineItems: [{ subscriptionInfo: { id: "sub1" } }] },
    });
    expect(res.status).toBe(200);
    expect(state.subs[0].status).toBe("canceled"); // not reactivated
    expect(state.purchases[0].status).toBe("canceled"); // unchanged
  });

  // I. missing purchase retry behavior
  it("I: returns 500 when no Base44Purchase found (asks Wix to retry)", async () => {
    const { db } = makeMockDb({});
    const res = await routePaymentEvent(db, ORDER_APPROVED, { order: { id: "o1", checkoutId: "cs_unknown" } });
    expect(res.status).toBe(500);
  });

  it("I: returns 200 when order has no checkoutId (nothing to correlate, ack to stop retries)", async () => {
    const { db } = makeMockDb({});
    const res = await routePaymentEvent(db, ORDER_APPROVED, { order: { id: "o1" } });
    expect(res.status).toBe(200);
  });
});

// ── J-M. SUBSCRIPTION_CANCELED / EXPIRED routing ───────────────────────────────
describe("SUBSCRIPTION_CANCELED / EXPIRED routing", () => {
  // J. SUBSCRIPTION_CANCELED routing
  it("J: routes SUBSCRIPTION_CANCELED to revoke with 'canceled' status", async () => {
    const { db, state } = makeMockDb({
      purchases: [{ id: "p1", subscriptionId: "sub1", status: "paid", productId: "maintenance" }],
      subs: [{ id: "s1", subscription_id: "sub1", status: "active" }],
    });
    const res = await routePaymentEvent(db, SUBSCRIPTION_CANCELED, { subscriptionContract: { id: "sub1" } });
    expect(res.status).toBe(200);
    expect(state.subs[0].status).toBe("canceled");
    expect(state.purchases[0].status).toBe("canceled");
  });

  // K. subscription lifecycle end/expire routing
  it("K: routes SUBSCRIPTION_EXPIRED to revoke with 'expired' status", async () => {
    const { db, state } = makeMockDb({
      purchases: [{ id: "p1", subscriptionId: "sub1", status: "paid", productId: "maintenance" }],
      subs: [{ id: "s1", subscription_id: "sub1", status: "active" }],
    });
    const res = await routePaymentEvent(db, SUBSCRIPTION_EXPIRED, { subscriptionContract: { id: "sub1" } });
    expect(res.status).toBe(200);
    expect(state.subs[0].status).toBe("expired");
    expect(state.purchases[0].status).toBe("canceled");
  });

  // L. duplicate cancellation idempotency
  it("L: is idempotent on duplicate SUBSCRIPTION_CANCELED (already canceled → skip)", async () => {
    const { db, state } = makeMockDb({
      purchases: [{ id: "p1", subscriptionId: "sub1", status: "canceled", productId: "maintenance" }],
      subs: [{ id: "s1", subscription_id: "sub1", status: "canceled" }],
    });
    const res = await routePaymentEvent(db, SUBSCRIPTION_CANCELED, { subscriptionContract: { id: "sub1" } });
    expect(res.status).toBe(200);
    expect(state.subs[0].status).toBe("canceled"); // unchanged
  });

  // M. failed revoke does not prematurely mark purchase canceled
  it("M: does not mark purchase canceled if revoke throws (stays paid for retry)", async () => {
    const { db, state } = makeMockDb({
      purchases: [{ id: "p1", subscriptionId: "sub1", status: "paid", productId: "maintenance" }],
      subs: [{ id: "s1", subscription_id: "sub1", status: "active" }],
    });
    // Force the MaintenanceSubscription.update to throw (simulates DB outage)
    db.entities.MaintenanceSubscription.update = async () => {
      throw new Error("DB down");
    };
    await expect(
      routePaymentEvent(db, SUBSCRIPTION_CANCELED, { subscriptionContract: { id: "sub1" } })
    ).rejects.toThrow("DB down");
    expect(state.purchases[0].status).toBe("paid"); // NOT prematurely canceled
  });

  it("returns 500 when no Purchase matches subscriptionId yet (asks Wix to retry)", async () => {
    const { db } = makeMockDb({});
    const res = await routePaymentEvent(db, SUBSCRIPTION_CANCELED, { subscriptionContract: { id: "sub_orphan" } });
    expect(res.status).toBe(500);
  });
});

// ── Unknown event routing ──────────────────────────────────────────────────────
describe("unknown event routing", () => {
  it("acknowledges unknown events with 200 (stops Wix retries)", async () => {
    const { db } = makeMockDb({});
    const res = await routePaymentEvent(db, "wix.some.unknown.event", {});
    expect(res.status).toBe(200);
  });
});

// ── N-Q. create-checkout validation ────────────────────────────────────────────
describe("resolveCheckoutProduct", () => {
  // N. rejects malformed input
  it("N: rejects missing invoice id (default productType)", async () => {
    const { db } = makeMockDb({});
    const res = await resolveCheckoutProduct(db, {}, null);
    expect(res.status).toBe(400);
    expect(res.error).toBe("Missing invoice id");
  });

  it("N: rejects missing subscription id (maintenance productType)", async () => {
    const { db } = makeMockDb({});
    const res = await resolveCheckoutProduct(db, { productType: "maintenance" }, null);
    expect(res.status).toBe(400);
    expect(res.error).toBe("Missing subscription id");
  });

  it("N: rejects unknown invoice id", async () => {
    const { db } = makeMockDb({});
    const res = await resolveCheckoutProduct(db, { productId: "nonexistent" }, null);
    expect(res.status).toBe(400);
    expect(res.error).toBe("Unknown invoice");
  });

  it("N: rejects already-paid invoice", async () => {
    const { db } = makeMockDb({
      invoices: [{ id: "inv1", status: "paid", type: "deposit", amount: 500, customer_name: "Test" }],
    });
    const res = await resolveCheckoutProduct(db, { productId: "inv1" }, null);
    expect(res.status).toBe(400);
    expect(res.error).toBe("Invoice already paid");
  });

  it("N: rejects already-active subscription", async () => {
    const { db } = makeMockDb({
      subs: [{ id: "sub1", status: "active", plan_name: "Plan", price: 100, customer_name: "Test" }],
    });
    const res = await resolveCheckoutProduct(db, { productType: "maintenance", productId: "sub1" }, null);
    expect(res.status).toBe(400);
    expect(res.error).toBe("Subscription already active");
  });

  // O. server-side price resolution cannot be overridden by buyer amount
  it("O: uses server-side invoice amount, ignoring buyer-supplied amount in body", async () => {
    const { db } = makeMockDb({
      invoices: [{ id: "inv1", status: "draft", type: "deposit", amount: 500, customer_name: "Test", currency: "USD" }],
    });
    // Buyer tries to send amount: 1 in the body — must be ignored
    const res = await resolveCheckoutProduct(db, { productId: "inv1", amount: 1 }, null);
    expect(res.status).toBe(200);
    expect(res.product!.price).toBe("500.00"); // from DB, not body.amount
  });

  it("O: uses server-side subscription price, ignoring buyer-supplied amount", async () => {
    const { db } = makeMockDb({
      subs: [{ id: "sub1", status: "pending", plan_name: "Annual", price: 299, customer_name: "Test", frequency: "YEAR" }],
    });
    const res = await resolveCheckoutProduct(db, { productType: "maintenance", productId: "sub1", amount: 1 }, null);
    expect(res.status).toBe(200);
    expect(res.product!.price).toBe("299.00"); // from DB, not body.amount
  });

  // Q. anonymous checkout remains permitted
  it("Q: resolves product with null appUser (anonymous buyer permitted)", async () => {
    const { db } = makeMockDb({
      invoices: [{ id: "inv1", status: "draft", type: "deposit", amount: 500, customer_name: "Test", customer_email: "cust@test.com" }],
    });
    const res = await resolveCheckoutProduct(db, { productId: "inv1" }, null);
    expect(res.status).toBe(200);
    expect(res.product!.customerEmail).toBe("cust@test.com"); // from invoice, not appUser
  });

  it("Q: resolves subscription with null appUser (anonymous buyer permitted)", async () => {
    const { db } = makeMockDb({
      subs: [{ id: "sub1", status: "pending", plan_name: "Annual", price: 299, customer_name: "Test", customer_email: "cust@test.com", frequency: "YEAR" }],
    });
    const res = await resolveCheckoutProduct(db, { productType: "maintenance", productId: "sub1" }, null);
    expect(res.status).toBe(200);
    expect(res.product!.customerEmail).toBe("cust@test.com");
  });
});

// ── P. open redirect protection ────────────────────────────────────────────────
describe("resolveAppUrl (open redirect protection)", () => {
  it("P: uses server header value and ignores caller-controlled Origin", () => {
    // The function signature does NOT accept Origin — it cannot influence the result.
    const url = resolveAppUrl("https://xtremevisualizer.base44.app", undefined);
    expect(url).toBe("https://xtremevisualizer.base44.app");
    expect(url).not.toContain("evil");
  });

  it("P: falls back to server-owned env when header is absent", () => {
    const url = resolveAppUrl(null, "https://xtremevisualizer.base44.app");
    expect(url).toBe("https://xtremevisualizer.base44.app");
  });

  it("P: returns empty string when both header and env are absent (fails closed)", () => {
    const url = resolveAppUrl(null, undefined);
    expect(url).toBe("");
  });

  it("P: empty header falls back to env", () => {
    const url = resolveAppUrl("", "https://xtremevisualizer.base44.app");
    expect(url).toBe("https://xtremevisualizer.base44.app");
  });
});

// ── R. no real side effects during testing ─────────────────────────────────────
describe("no real side effects", () => {
  it("R: payment routing does not invoke fetch or any real network API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const { db } = makeMockDb({
      purchases: [{ id: "p1", checkoutSessionId: "cs1", status: "pending", productId: "deposit" }],
      invoices: [{ id: "inv1", checkout_session_id: "cs1", status: "draft", type: "deposit", amount: 500 }],
    });
    await routePaymentEvent(db, ORDER_APPROVED, { order: { id: "o1", checkoutId: "cs1" } });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("R: checkout resolution does not invoke fetch or any real network API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const { db } = makeMockDb({
      invoices: [{ id: "inv1", status: "draft", type: "deposit", amount: 500, customer_name: "Test" }],
    });
    await resolveCheckoutProduct(db, { productId: "inv1" }, null);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});