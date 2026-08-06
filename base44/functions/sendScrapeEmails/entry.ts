import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GMAIL_CONNECTOR_ID = '69db200274332486fd28dd7e';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { leads, subject, body: emailBody, company_name, use_ai } = body;
    if (!leads?.length || !subject) return Response.json({ error: 'leads and subject are required' }, { status: 400 });

    let accessToken: string | null = null;
    try {
      const c = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);
      accessToken = c.accessToken;
    } catch {}
    if (!accessToken) return Response.json({ error: 'Gmail not connected. Connect Gmail in Settings to send emails.' }, { status: 400 });

    const results: any[] = [];
    for (const lead of leads) {
      if (!lead.email) { results.push({ lead, sent: false, error: 'no email' }); continue; }
      let finalSubject = subject;
      let finalBody = emailBody || '';
      if (use_ai) {
        try {
          const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Personalize this cold outreach email for the business "${lead.business_name}". Keep it professional, concise, and natural — use the business name in the greeting. Remove any placeholders. Sign as ${company_name || 'our team'}.\n\nSubject: ${subject}\n\nBody:\n${emailBody}\n\nReturn JSON {subject, body}.`,
            response_json_schema: { type: 'object', properties: { subject: { type: 'string' }, body: { type: 'string' } } },
          });
          if (ai?.subject) finalSubject = ai.subject;
          if (ai?.body) finalBody = ai.body;
        } catch {}
      } else {
        finalBody = (emailBody || '').replace(/{business_name}/g, lead.business_name || '').replace(/{company_name}/g, company_name || '');
      }

      let sent = false;
      let error: string | null = null;
      try {
        const lines = [`To: ${lead.email}`, `Subject: ${finalSubject}`, 'Content-Type: text/plain; charset=utf-8', 'MIME-Version: 1.0', '', finalBody];
        const raw = btoa(unescape(encodeURIComponent(lines.join('\r\n'))));
        const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw }),
        });
        sent = r.ok;
        if (!r.ok) error = (await r.json().catch(() => ({}))).error?.message || 'send failed';
      } catch (e) {
        error = (e as Error).message;
      }
      results.push({ lead, sent, error });
    }

    return Response.json({ results, sent: results.filter((r) => r.sent).length });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}