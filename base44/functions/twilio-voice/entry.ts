import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Twilio Voice Agent webhook endpoint.
// Returns TwiML that greets the caller using the active VoiceScript.
//
// Twilio calls this endpoint on incoming voice calls. It must be PUBLIC (no auth)
// because Twilio has no Base44 session. The function reads the active script via
// the service role and returns TwiML XML.
//
// GET  /api/functions/twilio-voice          → health check / TwiML test
// POST /api/functions/twilio-voice          → Twilio voice webhook (callSid, From, To)
// POST /api/functions/twilio-voice?ping=true → health check without side effects
//
// TwiML reference: https://www.twilio.com/docs/voice/twiml

export default async function (req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const isPing = url.searchParams.get('ping') === 'true' || (req.method === 'POST' && await safeJson(req).then((b: any) => b?.ping === true).catch(() => false));

    // Health check — no TwiML, just confirms the function is alive.
    if (isPing) {
      return Response.json({ ok: true, service: 'twilio-voice' });
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    // Load the active intake script
    const scripts = await db.entities.VoiceScript.filter({ active: true, category: 'intake' }, '-created_date', 1);
    const script = scripts?.[0];

    if (!script) {
      return twimlResponse('<Say voice="alice">Thank you for calling. Our team will be with you shortly. Please leave a message after the tone.</Say><Record maxLength="120" />');
    }

    // Build TwiML: greet with the script, then gather input for qualification
    const scriptText = (script.script_text || 'Thank you for calling. How can we help you today?').slice(0, 600);
    const gatherPrompt = (script.intake_fields || []).slice(0, 3).map((f: string, i: number) => `Question ${i + 1}: ${f}`).join('. ');
    const fullGreeting = `${scriptText}${gatherPrompt ? '. ' + gatherPrompt : ''}`;

    const twiml = `
      <Gather input="speech" action="${url.origin}/api/functions/twilio-voice" method="POST" speechTimeout="auto" speechModel="phone_call">
        <Say voice="alice">${escapeXml(fullGreeting)}</Say>
      </Gather>
      <Say voice="alice">Thank you for your response. We will get back to you shortly. Goodbye.</Say>
      <Hangup />
    `;

    return twimlResponse(twiml);
  } catch (err) {
    console.error('twilio-voice error', err);
    return twimlResponse('<Say voice="alice">We are experiencing technical difficulties. Please call back later.</Say><Hangup />');
  }
}

function twimlResponse(inner: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function safeJson(req: Request): Promise<any> {
  try { return await req.json(); } catch { return {}; }
}