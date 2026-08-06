import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildMime, base64Url } from '../../shared/gmailMime.ts';

const GMAIL_CONNECTOR_ID = '69db200274332486fd28dd7e';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { action } = body;

    let accessToken: string;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Gmail not connected' }, { status: 403 });
    }

    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // ---- LIST ----
    if (action === 'list') {
      const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20', { headers: authHeader });
      const listData = await listRes.json();
      if (!listRes.ok) return Response.json({ error: 'Gmail list failed', detail: listData }, { status: 502 });
      const messages = listData.messages || [];
      const items = [];
      for (const m of messages) {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers: authHeader });
        const msg = await msgRes.json();
        if (!msgRes.ok) continue;
        const headers = msg.payload?.headers || [];
        const from = headers.find((h: any) => h.name === 'From')?.value || '';
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';
        const snippet = msg.snippet || '';
        items.push({ id: m.id, from, subject, snippet, date, unread: (msg.labelIds || []).includes('UNREAD') });
      }
      return Response.json({ items });
    }

    // ---- READ ----
    if (action === 'read') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: authHeader });
      const msg = await msgRes.json();
      if (!msgRes.ok) return Response.json({ error: 'Gmail read failed', detail: msg }, { status: 502 });
      const headers = msg.payload?.headers || [];
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      // Extract plain text body
      let textBody = '';
      function extractBody(payload: any) {
        if (payload.body?.data) {
          const decoded = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          try { return decodeURIComponent(escape(decoded)); } catch { return decoded; }
        }
        if (payload.parts) {
          for (const part of payload.parts) {
            if (part.mimeType === 'text/plain') return extractBody(part);
          }
          return extractBody(payload.parts[0]);
        }
        return '';
      }
      textBody = extractBody(msg.payload);
      return Response.json({ from, subject, body: textBody, snippet: msg.snippet });
    }

    // ---- MARK READ ----
    if (action === 'markRead') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
      const modRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
      });
      if (!modRes.ok) { const d = await modRes.json(); return Response.json({ error: 'markRead failed', detail: d }, { status: 502 }); }
      return Response.json({ ok: true });
    }

    // ---- SEND ----
    if (action === 'send') {
      const { to, subject, text } = body;
      if (!to || !subject) return Response.json({ error: 'to and subject are required' }, { status: 400 });
      const mimeBytes = buildMime({ from: user.email || '', to, subject, text: text || '' });
      const raw = base64Url(mimeBytes);
      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw }),
      });
      const result = await sendRes.json();
      if (!sendRes.ok) return Response.json({ error: 'Gmail send failed', detail: result }, { status: 502 });
      return Response.json({ ok: true, messageId: result.id, threadId: result.threadId });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}