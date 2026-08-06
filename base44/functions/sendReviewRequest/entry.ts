import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// #20: Review request automation — sends a Google review request to customer 7 days after completion
// POST { work_order_id, ping } → sends review request email

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
    if (!wo.customer_email) return Response.json({ error: 'No customer email' }, { status: 400 });

    const reviewUrl = 'https://g.page/r/visual-x/review';
    const subject = `How was your new floor, ${wo.customer_name}?`;
    const body_text = `Hi ${wo.customer_name},

We hope you're loving your new floor! Your project at ${wo.project_address || 'your location'} was completed recently, and we'd be honored if you shared your experience.

Taking 30 seconds to leave a Google review helps other homeowners find quality flooring contractors — and it means the world to small businesses like ours.

👉 Leave a review: ${reviewUrl}

If anything isn't perfect, reply to this email and we'll make it right.

Thank you for choosing Visual-X!

— The Visual-X Team`;

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
      console.error('Review request email failed', e);
    }

    return Response.json({
      ok: true,
      sent,
      message: sent ? 'Review request sent to customer' : 'Email not sent — Gmail not connected',
    });
  } catch (err) {
    console.error('sendReviewRequest error', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}