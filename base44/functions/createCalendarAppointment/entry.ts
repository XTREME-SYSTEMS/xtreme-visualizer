import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CALENDAR_CONNECTOR_ID = '69ddcb305a599e0b4a1b3cff';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { summary, description, startDateTime, endDateTime, location, leadId, ping } = body;
    // Ping mode: test the connector connection without creating an event
    if (ping) {
      await base44.asServiceRole.connectors.getCurrentAppUserConnection(CALENDAR_CONNECTOR_ID);
      return Response.json({ ok: true });
    }
    if (!startDateTime || !endDateTime) return Response.json({ error: 'startDateTime and endDateTime are required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CALENDAR_CONNECTOR_ID);

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: summary || 'Site Visit — Visual X',
        description: description || '',
        location: location || '',
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
        reminders: { useDefault: true },
      }),
    });
    const event = await res.json();
    if (!res.ok) return Response.json({ error: 'Calendar event creation failed', detail: event }, { status: 502 });

    if (leadId) {
      try {
        await base44.entities.Lead.update(leadId, { visit_date: startDateTime });
      } catch { /* non-fatal */ }
    }

    return Response.json({ eventId: event.id, htmlLink: event.htmlLink });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}