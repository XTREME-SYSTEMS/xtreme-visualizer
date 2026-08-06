import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// Public endpoint: returns customer-facing portal data for a lead.
// No auth required — customers access this via a shareable link.
// POST { lead_id } → { lead, photos, invoices, workOrders }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { lead_id, ping } = body;

    if (ping) return Response.json({ ok: true });
    if (!lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const db = base44.asServiceRole;

    const leadMatches = await db.entities.Lead.filter({ id: lead_id });
    const lead = leadMatches?.[0];
    if (!lead) return Response.json({ error: 'Not found' }, { status: 404 });

    const publicLead = {
      customer_name: lead.customer_name,
      project_address: lead.project_address,
      space_type: lead.space_type,
      system_name: lead.system_name,
      floor_type: lead.floor_type,
      color_name: lead.color_name,
      square_feet: lead.square_feet,
      estimate_low: lead.estimate_low,
      estimate_high: lead.estimate_high,
      proposal_total: lead.proposal_total,
      status: lead.status,
      specifications: lead.specifications || [],
      signature_url: lead.signature_url,
      signed_date: lead.signed_date,
      discount_amount: lead.discount_amount,
      discount_expires: lead.discount_expires,
    };

    const workOrders = await db.entities.WorkOrder.filter({ lead_id }).catch(() => []);
    const woIds = workOrders.map((w) => w.id);
    let photos = [];
    if (woIds.length > 0) {
      const allPhotos = await db.entities.FieldPhoto.list("-created_date", 100).catch(() => []);
      photos = allPhotos.filter((p) => woIds.includes(p.work_order_id));
    }

    const invoices = await db.entities.Invoice.filter({ lead_id }).catch(() => []);

    return Response.json({
      lead: publicLead,
      workOrders: workOrders.map((w) => ({
        id: w.id,
        status: w.status,
        scheduled_date: w.scheduled_date,
        scope_items: w.scope_items || [],
      })),
      photos: photos.map((p) => ({
        category: p.category,
        file_url: p.file_url,
        taken_at: p.taken_at,
      })),
      invoices: invoices.map((i) => ({
        id: i.id,
        type: i.type,
        amount: i.amount,
        status: i.status,
        description: i.description,
        checkout_url: i.checkout_url,
        due_date: i.due_date,
      })),
    });
  } catch (err) {
    console.error('getCustomerPortal error', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}