import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GMAIL_CONNECTOR_ID = '69db200274332486fd28dd7e';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const now = new Date().toISOString();

    const plans = await base44.asServiceRole.entities.FollowupPlan.filter({ active: true });
    const due = plans.filter((p: any) => p.next_send_date && p.next_send_date <= now && (p.followups_sent || 0) < (p.max_followups || 4));
    if (due.length === 0) return Response.json({ ok: true, sent: 0, message: 'no due plans' });

    let accessToken: string | null = null;
    try {
      if (user) {
        const c = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);
        accessToken = c.accessToken;
      } else {
        const c = await base44.asServiceRole.connectors.getConnection('gmail');
        accessToken = c.accessToken;
      }
    } catch {}

    const tally = { ok: 0, failed: 0, skipped: 0 };
    for (const plan of due) {
      for (const leadId of (plan.lead_ids || [])) {
        const lead = await base44.asServiceRole.entities.Lead.get(leadId).catch(() => null);
        if (!lead || !lead.email) { tally.skipped++; continue; }
        if (lead.status === 'won' || lead.status === 'lost') { tally.skipped++; continue; }

        let subject = plan.subject_template || `Following up on your flooring project, ${lead.customer_name}`;
        let emailBody = plan.body_template || '';
        if (plan.use_ai) {
          try {
            const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `Write a brief, friendly follow-up email #${(plan.followups_sent || 0) + 1} to ${lead.customer_name} about their flooring project. Don't be pushy. Keep it 3-4 sentences. Return JSON {subject, body}.`,
              response_json_schema: { type: 'object', properties: { subject: { type: 'string' }, body: { type: 'string' } } },
            });
            if (ai?.subject) subject = ai.subject;
            if (ai?.body) emailBody = ai.body;
          } catch {}
        }

        let sent = false;
        if (accessToken) {
          try {
            const lines = [`To: ${lead.email}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset=utf-8', 'MIME-Version: 1.0', '', emailBody];
            const raw = btoa(unescape(encodeURIComponent(lines.join('\r\n'))));
            const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ raw }),
            });
            sent = r.ok;
          } catch {}
        }
        if (sent) tally.ok++; else tally.failed++;

        await base44.asServiceRole.entities.MessageTemplate.create({
          lead_id: leadId,
          template_type: 'reminder',
          subject,
          body: emailBody,
          status: sent ? 'sent' : 'draft',
        }).catch(() => {});
      }
      const newCount = (plan.followups_sent || 0) + 1;
      const nextDate = new Date(Date.now() + (plan.interval_days || 3) * 86400000).toISOString();
      await base44.asServiceRole.entities.FollowupPlan.update(plan.id, {
        followups_sent: newCount,
        last_sent_date: now,
        next_send_date: nextDate,
        active: newCount < (plan.max_followups || 4),
      });
    }

    return Response.json({ ok: true, ...tally, gmail_connected: !!accessToken });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}