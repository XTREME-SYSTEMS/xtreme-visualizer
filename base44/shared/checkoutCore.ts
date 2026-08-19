// Pure checkout logic — shared by create-checkout/entry.ts and unit tests.
// NO Deno or npm: imports. Uses only standard globals.

// Resolve the app's public base URL for return links. Header (server-set) takes priority,
// then the server-owned env secret. NEVER falls back to caller-controlled Origin (open redirect).
// The function signature intentionally does NOT accept Origin — proving it cannot influence the result.
export function resolveAppUrl(headerValue: string | null, envValue: string | undefined): string {
  return headerValue || envValue || "";
}

export interface CheckoutDb {
  entities: {
    Invoice: {
      filter: (q: Record<string, string>) => Promise<any[]>;
      update: (id: string, data: Record<string, any>) => Promise<any>;
    };
    MaintenanceSubscription: {
      filter: (q: Record<string, string>) => Promise<any[]>;
      update: (id: string, data: Record<string, any>) => Promise<any>;
    };
  };
}

export interface ResolvedProduct {
  status: number;
  error?: string;
  product?: {
    purchaseProductId: string;
    productName: string;
    price: string;
    currency: string;
    customerEmail: string | null;
    quantity: number;
    subscriptionInfo: any;
    thankYouPath: string;
    postFlowPath: string;
    maintenanceSub?: any;
  };
}

// Resolve the product and its price SERVER-SIDE. The buyer cannot override the amount —
// the price comes from the DB record, not from the request body.
export async function resolveCheckoutProduct(
  db: CheckoutDb,
  body: { productType?: string; productId?: string; amount?: number },
  appUser: { id: string; email?: string } | null
): Promise<ResolvedProduct> {
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
    const subId = String(body.productId ?? "");
    if (!subId) return { status: 400, error: "Missing subscription id" };
    try {
      const subs = await db.entities.MaintenanceSubscription.filter({ id: subId });
      maintenanceSub = subs?.[0] ?? null;
    } catch {
      return { status: 400, error: "Unknown subscription" };
    }
    if (!maintenanceSub) return { status: 400, error: "Unknown subscription" };
    if (maintenanceSub.status === "active") return { status: 400, error: "Subscription already active" };
    productName = maintenanceSub.plan_name || "Maintenance Plan";
    price = Number(maintenanceSub.price).toFixed(2);
    if (parseFloat(price) < 0.5) return { status: 400, error: "Amount must be at least 0.50" };
    currency = "USD";
    customerEmail = maintenanceSub.customer_email || appUser?.email || null;
    purchaseProductId = "maintenance";
    const freq = maintenanceSub.frequency || "YEAR";
    subscriptionInfo = {
      subscriptionSettings: { frequency: freq, autoRenewal: true },
      title: maintenanceSub.plan_name,
      description: `Annual maintenance and sealer coat service for ${maintenanceSub.customer_name}`,
    };
    thankYouPath = "/ThankYou";
    postFlowPath = "/billing";
  } else {
    const invoiceId = String(body.productId ?? "");
    if (!invoiceId) return { status: 400, error: "Missing invoice id" };
    let invoice: any = null;
    try {
      const invoices = await db.entities.Invoice.filter({ id: invoiceId });
      invoice = invoices?.[0] ?? null;
    } catch {
      return { status: 400, error: "Unknown invoice" };
    }
    if (!invoice) return { status: 400, error: "Unknown invoice" };
    if (invoice.status === "paid") return { status: 400, error: "Invoice already paid" };
    productName = `${invoice.type === "final" ? "Final Invoice" : "Deposit"} — ${invoice.customer_name}`;
    price = Number(invoice.amount).toFixed(2);
    if (parseFloat(price) < 0.5) return { status: 400, error: "Amount must be at least 0.50" };
    currency = invoice.currency || "USD";
    customerEmail = invoice.customer_email || appUser?.email || null;
    purchaseProductId = invoice.type;
    thankYouPath = "/ThankYou";
    postFlowPath = "/";
  }

  return {
    status: 200,
    product: {
      purchaseProductId,
      productName,
      price,
      currency,
      customerEmail,
      quantity,
      subscriptionInfo,
      thankYouPath,
      postFlowPath,
      maintenanceSub,
    },
  };
}