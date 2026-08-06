import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// #9: Lost-lead recovery — sends a win-back email to leads marked "lost" 30+ days ago
// POST { lead_id, ping } → sends personalized recovery email

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
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });
    if (!lead.email) return Response.json({ error: 'Lead has no email' }, { status: 400 });

    const subject = `We'd love to revisit your ${lead.floor_type || 'flooring'} project, ${lead.customer_name}`;
    const body_text = `Hi ${lead.customer_name},

A while back we prepared a proposal for your ${lead.space_type || 'space'} at ${lead.project_address || 'your location'}.

We understand the timing wasn't right then — but we'd love to offer you a fresh quote with updated pricing and a 10% win-back discount on any ${lead.floor_type || 'flooring'} system.

Our schedules are opening up and we'd prioritize your project. Would you like us to put together a revised estimate?

Reply to this email or call us — we'll have a new quote to you within 24 hours.

— Visual-X Team`;

    let sent = false;
    try {
      const token = await db.connectors.getConnection('gmail');
      if (token) {
        const mime = [
          `To: ${lead.email}`,
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
        await db.entities.Lead.update(lead_id, {
          last_contacted_date: new Date().toISOString(),
          follow_up_stage: 'final_reminder_sent',
        });
      }
    } catch (e) {
      console.error('Recovery email failed', e);
    }

    return Response.json({
      ok: true,
      sent,
      message: sent ? 'Win-back email sent' : 'Email not sent — Gmail not connected',
    });
  } catch (err) {
    console.error('sendLostLeadRecovery error', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}