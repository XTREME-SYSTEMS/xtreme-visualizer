import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// #9: Finds leads marked "lost" 30+ days ago and sends win-back recovery emails
// Called by the "Lost Lead Recovery" workflow (daily)

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    const leads = await db.entities.Lead.filter({ status: 'lost' });
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;

    const eligible = leads.filter((l: any) => {
      if (!l.email) return false;
      const updated = new Date(l.updated_date || l.created_date).getTime();
      return updated < thirtyDaysAgo && l.follow_up_stage !== 'final_reminder_sent';
    });

    let sent = 0;
    for (const lead of eligible) {
      try {
        const token = await db.connectors.getConnection('gmail');
        if (!token) break;

        const subject = `We'd love to revisit your ${lead.floor_type || 'flooring'} project, ${lead.customer_name}`;
        const body_text = `Hi ${lead.customer_name},

A while back we prepared a proposal for your ${lead.space_type || 'space'} at ${lead.project_address || 'your location'}.

We understand the timing wasn't right then — but we'd love to offer you a fresh quote with updated pricing and a 10% win-back discount on any ${lead.floor_type || 'flooring'} system.

Our schedules are opening up and we'd prioritize your project. Would you like us to put together a revised estimate?

Reply to this email or call us — we'll have a new quote to you within 24 hours.

— Visual-X Team`;

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
        await db.entities.Lead.update(lead.id, {
          last_contacted_date: new Date().toISOString(),
          follow_up_stage: 'final_reminder_sent',
        });
        sent++;
      } catch (e) {
        console.error('Recovery email failed for lead', lead.id, e);
      }
    }

    return Response.json({ ok: true, eligible: eligible.length, sent });
  } catch (err) {
    console.error('runLostLeadRecovery error', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}