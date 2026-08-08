import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Twilio Voice Agent webhook endpoint.
// Returns TwiML that greets the caller, gathers speech, extracts lead data via LLM,
// creates a Lead + Appointment, and confirms a callback — all hands-free.
//
// Twilio calls this endpoint on incoming voice calls. It must be PUBLIC (no auth)
// because Twilio has no Base44 session. Entity writes use the service role.
//
// GET  /api/functions/twilio-voice          → health check
// POST /api/functions/twilio-voice          → initial call (greet + gather)
//        Twilio posts back here with SpeechResult after the Gather completes
// POST /api/functions/twilio-voice?ping=true → health check without side effects
//
// TwiML reference: https://www.twilio.com/docs/voice/twiml

export default async function (req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const isQueryPing = url.searchParams.get('ping') === 'true';

    // Read the body once — Twilio sends form-encoded, the test tool sends JSON
    const form = await safeForm(req);
    const isBodyPing = form.ping === 'true' || form.ping === true;

    // UI "Test Voice Endpoint" button sends { ping: true }
    if (isQueryPing || isBodyPing) {
      return Response.json({ ok: true, service: 'twilio-voice' });
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    const speechResult = (form.SpeechResult || '').toString().trim();
    const fromNumber = (form.From || '').toString().trim();
    const toNumber = (form.To || '').toString().trim();
    const callSid = (form.CallSid || '').toString().trim();

    // ===== Gather result: caller spoke, now extract + persist =====
    if (speechResult) {
      return await handleGatherResult(db, speechResult, fromNumber, toNumber, callSid);
    }

    // ===== Initial call: greet + gather =====
    const scripts = await db.entities.VoiceScript.filter({ active: true, category: 'intake' }, '-created_date', 1);
    const script = scripts?.[0];

    const greeting = script
      ? (script.script_text || 'Thank you for calling. How can we help you today?').slice(0, 600)
      : 'Thank you for calling Xtreme Polishing Systems. We can\'t take your call right now, but I can help. In a few words, please tell me your name, what kind of floor project you\'re calling about, and the best time for our team to call you back.';

    const gatherPrompt = 'Please tell me your name, what kind of project you have, and the best time to call you back.';

    const twiml = `
      <Gather input="speech" action="${url.origin}/api/functions/twilio-voice" method="POST" speechTimeout="auto" speechModel="phone_call" hints="epoxy, polished concrete, garage, basement, commercial, resin">
        <Say voice="alice">${escapeXml(greeting)}</Say>
        <Say voice="alice">${escapeXml(gatherPrompt)}</Say>
      </Gather>
      <Say voice="alice">I didn't catch that. No worries — please leave a message after the tone and we'll call you back shortly.</Say>
      <Record maxLength="120" transcribe="true" playBeep="true" />
      <Hangup />
    `;

    return twimlResponse(twiml);
  } catch (err) {
    console.error('twilio-voice error', err);
    return twimlResponse('<Say voice="alice">We are experiencing technical difficulties. Please call back later or text us.</Say><Hangup />');
  }
}

// ===== Handle the caller's spoken response =====
async function handleGatherResult(db: any, speech: string, fromNumber: string, toNumber: string, callSid: string): Promise<Response> {
  // Extract structured lead data from the speech
  let extracted: any = {};
  try {
    const prompt = 'Extract lead information from this phone call transcript for a surface coating contractor (epoxy, polished concrete, polyurea, etc). ' +
      'Return a JSON object with: customer_name (best guess from speech, or "Unknown Caller" if none), intent (one of: quote, consultation, site_visit, appointment, general, other), ' +
      'project_type (e.g. garage floor, warehouse, patio), space_type (one of: garage, basement, warehouse, showroom, patio, commercial_kitchen, retail, other), ' +
      'preferred_callback_time (e.g. "tomorrow morning", "after 3pm"), and a short summary.\n\nTranscript: "' + speech + '"';

    const schema = {
      type: 'object',
      properties: {
        customer_name: { type: 'string' },
        intent: { type: 'string' },
        project_type: { type: 'string' },
        space_type: { type: 'string' },
        preferred_callback_time: { type: 'string' },
        summary: { type: 'string' }
      },
      required: ['customer_name', 'intent', 'summary']
    };

    extracted = await db.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
  } catch (err) {
    console.error('LLM extraction failed', err);
    extracted = { customer_name: 'Unknown Caller', intent: 'general', summary: speech.slice(0, 200) };
  }

  const customerName = (extracted.customer_name || 'Unknown Caller').slice(0, 80);
  const intent = (extracted.intent || 'general').slice(0, 40);
  const projectType = (extracted.project_type || '').slice(0, 120);
  const spaceType = normalizeSpaceType(extracted.space_type);
  const callbackTime = (extracted.preferred_callback_time || '').slice(0, 120);
  const summary = (extracted.summary || speech.slice(0, 200)).slice(0, 500);

  // Create the Lead (source: phone)
  let lead: any = null;
  try {
    lead = await db.entities.Lead.create({
      customer_name: customerName,
      phone: fromNumber,
      floor_type: projectType,
      space_type: spaceType,
      source: 'phone',
      status: 'new',
      notes: `AI Voice Attendant call (CallSid: ${callSid || 'n/a'})\nIntent: ${intent}\nPreferred callback: ${callbackTime || 'as soon as possible'}\nTranscript: "${speech}"\nSummary: ${summary}`
    });
  } catch (err) {
    console.error('Lead creation failed', err);
  }

  // Create an Appointment request if the intent implies scheduling
  const schedulingIntents = ['consultation', 'site_visit', 'appointment', 'quote'];
  if (schedulingIntents.includes(intent.toLowerCase()) && lead) {
    try {
      await db.entities.Appointment.create({
        lead_id: lead.id,
        customer_name: customerName,
        customer_phone: fromNumber,
        type: intent.toLowerCase() === 'site_visit' ? 'site_visit' : 'consultation',
        status: 'requested',
        message: `Requested via AI Voice Attendant. Preferred callback: ${callbackTime || 'as soon as possible'}. Summary: ${summary}`
      });
    } catch (err) {
      console.error('Appointment creation failed', err);
    }
  }

  // Build a personalized confirmation message
  const firstName = customerName !== 'Unknown Caller' ? customerName.split(' ')[0] : '';
  const namePart = firstName ? `Thanks, ${firstName}. ` : '';
  const callbackPart = callbackTime ? `Our team will call you back ${callbackTime}. ` : 'Our team will call you back as soon as possible. ';
  const textPart = 'You can also text us at this number anytime. ';
  const closing = 'Thanks for calling, and have a great day.';

  const confirmMsg = `${namePart}I've captured your request for a ${intent === 'general' ? 'callback' : intent.replace(/_/g, ' ')}. ${callbackPart}${textPart}${closing}`;

  const twiml = `
    <Say voice="alice">${escapeXml(confirmMsg)}</Say>
    <Hangup />
  `;

  return twimlResponse(twiml);
}

function normalizeSpaceType(raw: string): string {
  const valid = ['garage', 'basement', 'warehouse', 'showroom', 'patio', 'commercial_kitchen', 'retail', 'other'];
  const v = (raw || '').toLowerCase().trim();
  if (valid.includes(v)) return v;
  return 'other';
}

function twimlResponse(inner: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

function escapeXml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function safeForm(req: Request): Promise<Record<string, string>> {
  // Twilio sends form-encoded; the test tool sends JSON — handle both
  try {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await req.json();
      const obj: Record<string, string> = {};
      if (body && typeof body === 'object') {
        Object.keys(body).forEach((k) => { obj[k] = String(body[k]); });
      }
      return obj;
    }
    const formData = await req.formData();
    const obj: Record<string, string> = {};
    formData.forEach((value, key) => {
      obj[key] = value.toString();
    });
    return obj;
  } catch {
    return {};
  }
}