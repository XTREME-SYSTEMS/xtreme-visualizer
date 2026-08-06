import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// #20: Finds work orders completed 7 days ago and sends Google review requests to customers
// Called by the "Review Request" workflow (daily)

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    const orders = await db.entities.WorkOrder.filter({ status: 'completed' });
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const eightDaysAgo = Date.now() - 8 * 24 * 3600 * 1000;

    // Eligible: completed between 7 and 8 days ago (to catch the daily window)
    const eligible = orders.filter((o: any) => {
      if (!o.customer_email) return false;
      const updated = new Date(o.updated_date).getTime();
      return updated < sevenDaysAgo && updated > eightDaysAgo;
    });

    let sent = 0;
    const reviewUrl = 'https://g.page/r/visual-x/review';

    for (const wo of eligible) {
      try {
        const token = await db.connectors.getConnection('gmail');
        if (!token) break;

        const subject = `How was your new floor, ${wo.customer_name}?`;
        const body_text = `Hi ${wo.customer_name},

We hope you're loving your new floor! Your project at ${wo.project_address || 'your location'} was completed recently, and we'd be honored if you shared your experience.

Taking 30 seconds to leave a Google review helps other homeowners find quality flooring contractors — and it means the world to small businesses like ours.

👉 Leave a review: ${reviewUrl}

If anything isn't perfect, reply to this email and we'll make it right.

Thank you for choosing Visual-X!

— The Visual-X Team`;

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
        sent++;
      } catch (e) {
        console.error('Review request failed for work order', wo.id, e);
      }
    }

    return Response.json({ ok: true, eligible: eligible.length, sent });
  } catch (err) {
    console.error('runReviewRequests error', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}