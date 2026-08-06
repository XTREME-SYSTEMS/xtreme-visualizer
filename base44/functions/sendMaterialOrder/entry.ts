import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// #11: Generate a material order email from WorkOrder.materials_list
// POST { work_order_id, supplier_email } → sends email with material list

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { work_order_id, supplier_email, ping } = body;

    if (ping) return Response.json({ ok: true });
    if (!work_order_id) return Response.json({ error: 'work_order_id is required' }, { status: 400 });

    const db = base44.asServiceRole;
    const woMatches = await db.entities.WorkOrder.filter({ id: work_order_id });
    const wo = woMatches?.[0];
    if (!wo) return Response.json({ error: 'Work order not found' }, { status: 404 });

    const materials = wo.materials_list || [];
    if (materials.length === 0) return Response.json({ error: 'No materials on this work order' }, { status: 400 });

    // Build material table
    const rows = materials.map((m: any, i: number) =>
      `${i + 1}. ${m.name || '—'} | Qty: ${m.qty || 1} ${m.unit || ''} | Est. Cost: $${(m.cost || 0).toFixed(2)}`
    ).join('\n');

    const totalCost = materials.reduce((s: number, m: any) => s + (m.cost || 0) * (m.qty || 1), 0);

    const subject = `Material Order — ${wo.customer_name || 'Work Order'} — ${wo.project_address || ''}`;
    const body_text = `MATERIAL ORDER REQUEST

Job: ${wo.customer_name || '—'}
Address: ${wo.project_address || '—'}
Scheduled: ${wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString() : 'TBD'}
Crew Leader: ${wo.crew_leader_name || 'TBD'}

MATERIALS:
${rows}

Estimated Total: $${totalCost.toFixed(2)}

Please confirm availability and pricing. Reply to this email with pickup/delivery details.

— Visual-X Operations`;

    // Send email via Gmail connector
    let sent = false;
    try {
      const token = await base44.asServiceRole.connectors.getConnection('gmail');
      if (token) {
        const mime = [
          `To: ${supplier_email || 'supplier@example.com'}`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset=utf-8',
          '',
          body_text,
        ].join('\r\n');
        const encoded = btoa(unescape(encodeURIComponent(mime)));
        await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: encoded }),
        });
        sent = true;
      }
    } catch (e) {
      console.error('Material order email failed', e);
    }

    return Response.json({
      ok: true,
      sent,
      material_count: materials.length,
      total_cost: totalCost,
      message: sent ? 'Email sent to supplier' : 'Email not sent — Gmail not connected. Material list generated.',
    });
  } catch (err) {
    console.error('sendMaterialOrder error', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}