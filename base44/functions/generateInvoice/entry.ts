import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generates a deposit or final invoice for a work order.
// POST { workOrderId, type: "deposit"|"final" }
// - deposit: 30% of the lead's proposal_total (or estimate_low fallback)
// - final:   proposal_total - sum of paid deposits
// Idempotent: skips if an unpaid invoice of the same type already exists for this WO.

export default async function (req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { workOrderId, type, ping } = body;

    if (ping) return Response.json({ ok: true });

    if (!workOrderId) return Response.json({ error: 'workOrderId is required' }, { status: 400 });
    if (type !== 'deposit' && type !== 'final') return Response.json({ error: 'type must be deposit or final' }, { status: 400 });

    const db = base44.asServiceRole;

    // Load work order
    const woMatches = await db.entities.WorkOrder.filter({ id: workOrderId });
    const wo = woMatches?.[0];
    if (!wo) return Response.json({ error: 'Work order not found' }, { status: 404 });

    // Load linked lead for pricing
    let lead = null;
    if (wo.lead_id) {
      const leadMatches = await db.entities.Lead.filter({ id: wo.lead_id });
      lead = leadMatches?.[0];
    }

    const proposalTotal = lead?.proposal_total || lead?.estimate_low || 0;
    if (proposalTotal <= 0) {
      return Response.json({ error: 'No proposal total or estimate found on the linked lead. Set a price before generating an invoice.' }, { status: 400 });
    }

    // Check for existing invoices of this type on this WO
    const existing = await db.entities.Invoice.filter({ work_order_id: workOrderId, type });
    const hasUnpaid = existing?.some((i: any) => i.status === 'draft' || i.status === 'pending');
    if (hasUnpaid) {
      return Response.json({ error: `An unpaid ${type} invoice already exists for this work order.`, invoiceId: existing.find((i: any) => i.status !== 'paid' && i.status !== 'void')?.id }, { status: 409 });
    }

    let amount: number;
    let description: string;
    if (type === 'deposit') {
      amount = Math.round(proposalTotal * 0.3 * 100) / 100;
      description = `Project deposit (30% of $${proposalTotal.toLocaleString()})`;
    } else {
      // Final = total - paid deposits
      const paidDeposits = (existing || []).filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.amount || 0), 0);
      amount = Math.max(0, Math.round((proposalTotal - paidDeposits) * 100) / 100);
      description = `Final payment (balance of $${proposalTotal.toLocaleString()})`;
    }

    if (amount < 0.5) {
      return Response.json({ error: `Calculated amount ($${amount}) is below the $0.50 minimum.` }, { status: 400 });
    }

    const invoice = await db.entities.Invoice.create({
      lead_id: wo.lead_id || null,
      work_order_id: workOrderId,
      customer_name: wo.customer_name || lead?.customer_name || 'Customer',
      customer_email: wo.customer_email || lead?.email || '',
      type,
      description,
      amount,
      currency: 'USD',
      status: 'draft',
    });

    console.log(`generateInvoice: created ${type} invoice ${invoice.id} for WO ${workOrderId}, amount $${amount}`);
    return Response.json({ ok: true, invoice });
  } catch (err) {
    console.error('generateInvoice error', err);
    return Response.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}