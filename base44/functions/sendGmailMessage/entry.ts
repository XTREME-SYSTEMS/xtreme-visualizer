import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GMAIL_CONNECTOR_ID = '69db200274332486fd28dd7e';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { to, subject, body: emailBody } = body;
    if (!to || !subject) return Response.json({ error: 'to and subject are required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);

    // Build RFC 2822 message with UTF-8 safe base64 encoding
    const lines = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset=utf-8', 'MIME-Version: 1.0', '', emailBody || ''];
    const raw = lines.join('\r\n');
    const encoded = btoa(unescape(encodeURIComponent(raw)));

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    const result = await res.json();
    if (!res.ok) return Response.json({ error: 'Gmail send failed', detail: result }, { status: 502 });

    return Response.json({ messageId: result.id, threadId: result.threadId });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}