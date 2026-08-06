import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// #19: Digital warranty certificate — generates a warranty PDF and emails to customer on work order completion
// POST { work_order_id, ping } → generates warranty + emails customer

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { work_order_id, ping } = body;

    if (ping) return Response.json({ ok: true });
    if (!work_order_id) return Response.json({ error: 'work_order_id is required' }, { status: 400 });

    const db = base44.asServiceRole;
    const woMatches = await db.entities.WorkOrder.filter({ id: work_order_id });
    const wo = woMatches?.[0];
    if (!wo) return Response.json({ error: 'Work order not found' }, { status: 404 });
    if (!wo.customer_email) return Response.json({ error: 'No customer email on work order' }, { status: 400 });

    const warrantyId = `VX-WAR-${Date.now().toString(36).toUpperCase()}`;
    const issuedDate = new Date().toLocaleDateString();
    const expiryDate = new Date(Date.now() + 365 * 2 * 24 * 3600 * 1000).toLocaleDateString();

    const subject = `Your Warranty Certificate — ${wo.customer_name}`;
    const body_text = `WARRANTY CERTIFICATE
${'='.repeat(40)}

Warranty ID: ${warrantyId}
Issued: ${issuedDate}
Valid Until: ${expiryDate}

Customer: ${wo.customer_name}
Project Address: ${wo.project_address || '—'}
Floor System: ${wo.scope_items?.[0]?.label || 'Custom Flooring System'}

COVERAGE:
This warranty covers delamination, peeling, and adhesion failure of the
applied flooring system for a period of 2 years from the installation date
listed above, under normal use conditions.

WHAT IS COVERED:
- Delamination or peeling of the coating
- Adhesion failure due to installation workmanship
- Cracking of the installed system under normal traffic

WHAT IS NOT COVERED:
- Damage from chemical spills or improper cleaning
- Moisture intrusion from underlying substrate
- Normal wear from heavy industrial traffic
- Damage from moving heavy equipment without protection

TO FILE A CLAIM:
Email your warranty ID (${warrantyId}) and photos of the issue to:
support@visual-x.com

This certificate is electronically issued and valid without signature.

— Visual-X Operations`;

    let sent = false;
    try {
      const token = await db.connectors.getConnection('gmail');
      if (token) {
        const mime = [
          `To: ${wo.customer_email}`,
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
      console.error('Warranty email failed', e);
    }

    return Response.json({
      ok: true,
      sent,
      warranty_id: warrantyId,
      expiry_date: expiryDate,
      message: sent ? 'Warranty certificate emailed to customer' : 'Warranty generated but email not sent — Gmail not connected',
    });
  } catch (err) {
    console.error('generateWarranty error', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}