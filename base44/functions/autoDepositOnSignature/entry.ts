import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CONSTRUCT_URL = "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct";

// Auto-deposit on proposal acceptance.
// Called by the "Auto Deposit" workflow when a Lead's signature_url transitions from empty to set.
// 1. Finds or creates a WorkOrder for the lead
// 2. Creates a deposit invoice (30% of proposal_total)
// 3. Creates a Wix checkout session
// 4. Saves the checkout URL on the invoice
// 5. Returns the checkout URL so the workflow / UI can use it

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { lead_id, ping } = body;

    if (ping) return Response.json({ ok: true });

    if (!lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const db = base44.asServiceRole;

    // 1. Load the lead
    const leadMatches = await db.entities.Lead.filter({ id: lead_id });
    const lead = leadMatches?.[0];
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Only proceed if the proposal was actually signed
    if (!lead.signature_url) return Response.json({ ok: true, skipped: true, reason: 'proposal not signed' });

    const proposalTotal = lead.proposal_total || lead.estimate_low || 0;
    if (proposalTotal <= 0) return Response.json({ error: 'No proposal total on lead' }, { status: 400 });

    // 2. Find or create a WorkOrder for this lead
    let woMatches = await db.entities.WorkOrder.filter({ lead_id: lead_id });
    let wo = woMatches?.[0];
    if (!wo) {
      wo = await db.entities.WorkOrder.create({
        project_id: lead_id,
        lead_id: lead_id,
        customer_name: lead.customer_name,
        customer_email: lead.email,
        customer_phone: lead.phone,
        project_address: lead.project_address,
        scope_items: lead.specifications || [],
        status: 'draft',
      });
    }

    // 3. Check for existing deposit invoice (idempotent)
    const existingInvoices = await db.entities.Invoice.filter({ work_order_id: wo.id, type: 'deposit' });
    const existingUnpaid = existingInvoices?.find((i: any) => i.status === 'draft' || i.status === 'pending');
    if (existingUnpaid?.checkout_url) {
      return Response.json({ ok: true, skipped: true, reason: 'checkout already exists', checkout_url: existingUnpaid.checkout_url, invoice_id: existingUnpaid.id });
    }
    if (existingUnpaid) {
      // Has an invoice but no checkout URL yet — create checkout for it
      return await createCheckoutForInvoice(base44, existingUnpaid, db);
    }

    // 4. Create deposit invoice
    const depositAmount = Math.round(proposalTotal * 0.3 * 100) / 100;
    if (depositAmount < 0.5) return Response.json({ error: 'Deposit amount below $0.50 minimum' }, { status: 400 });

    const invoice = await db.entities.Invoice.create({
      lead_id: lead_id,
      work_order_id: wo.id,
      customer_name: lead.customer_name,
      customer_email: lead.email || '',
      type: 'deposit',
      description: `Project deposit (30% of $${proposalTotal.toLocaleString()})`,
      amount: depositAmount,
      currency: 'USD',
      status: 'draft',
    });

    // 5. Create checkout session for this invoice
    return await createCheckoutForInvoice(base44, invoice, db);
  } catch (err) {
    console.error('autoDepositOnSignature error', err);
    return Response.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}

async function createCheckoutForInvoice(base44: any, invoice: any, db: any): Promise<Response> {
  const WIX_API_KEY = Deno.env.get('WIX_CHECKOUT_API_KEY');
  const WIX_SITE_ID = Deno.env.get('WIX_CHECKOUT_SITE_ID');
  const appUrl = req_headers_appUrl();

  if (!WIX_API_KEY || !WIX_SITE_ID || !appUrl) {
    console.error('autoDepositOnSignature: Wix payment config not set');
    // Still return ok — the invoice was created, checkout can be initiated from Billing page
    return Response.json({ ok: true, invoice_id: invoice.id, checkout_url: null, error: 'Payments not configured — initiate checkout from Billing page' });
  }

  const productName = `Deposit — ${invoice.customer_name}`;
  const price = Number(invoice.amount).toFixed(2);
  const customerEmail = invoice.customer_email || null;

  const constructBody = {
    cart: {
      items: [{ name: productName, quantity: 1, price }],
      ...(customerEmail ? { customerInfo: { email: customerEmail } } : {}),
    },
    callbackUrls: {
      thankYouPageUrl: `${appUrl}/ThankYou?invoice=${invoice.id}`,
      postFlowUrl: `${appUrl}/`,
    },
  };

  const wixRes = await fetch(CONSTRUCT_URL, {
    method: 'POST',
    headers: { 'Authorization': WIX_API_KEY, 'wix-site-id': WIX_SITE_ID, 'Content-Type': 'application/json' },
    body: JSON.stringify(constructBody),
  });

  if (!wixRes.ok) {
    const errText = await wixRes.text();
    console.error('autoDepositOnSignature: Wix construct failed', { status: wixRes.status, errText });
    return Response.json({ ok: true, invoice_id: invoice.id, checkout_url: null, error: 'Checkout creation failed' });
  }

  const { checkoutSession } = await wixRes.json();
  const checkoutSessionId: string = checkoutSession?.id;
  const redirectUrl: string = checkoutSession?.redirectUrl;

  if (!checkoutSessionId || !redirectUrl) {
    console.error('autoDepositOnSignature: missing checkout session data', checkoutSession);
    return Response.json({ ok: true, invoice_id: invoice.id, checkout_url: null, error: 'Checkout creation failed' });
  }

  // Persist the purchase
  const purchase = await db.entities.Base44Purchase.create({
    checkoutSessionId,
    status: 'pending',
    appUserId: null,
    buyerEmail: customerEmail,
    productId: 'deposit',
    productName,
    quantity: 1,
    amount: price,
    currency: invoice.currency || 'USD',
  });

  // Update the invoice with checkout info
  await db.entities.Invoice.update(invoice.id, {
    status: 'pending',
    checkout_session_id: checkoutSessionId,
    purchase_id: purchase.id,
    checkout_url: redirectUrl,
  });

  console.log(`autoDepositOnSignature: checkout created for invoice ${invoice.id}, url: ${redirectUrl}`);
  return Response.json({ ok: true, invoice_id: invoice.id, checkout_url: redirectUrl });
}

// Resolve app URL the same way create-checkout does
function req_headers_appUrl(): string {
  // In Deno, we can't access the original request headers from here easily.
  // Fall back to the env secret, which is always set for a connected payments app.
  return Deno.env.get('WIX_CHECKOUT_APP_URL') || '';
}