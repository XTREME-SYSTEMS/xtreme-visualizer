import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

const GATEWAY_BASE = 'https://ai-gateway.vercel.sh';

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mode, ping } = body;

    if (ping) return Response.json({ ok: true, service: 'vercel-ai-gateway' });

    const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY');
    if (!apiKey) {
      console.error('vercel-ai-gateway: VERCEL_AI_GATEWAY_API_KEY secret not set');
      return Response.json({ error: 'VERCEL_AI_GATEWAY_API_KEY secret not set. Add it in dashboard Settings → Secrets.' }, { status: 500 });
    }

    if (!mode) return Response.json({ error: 'mode is required (image|text|speech|transcribe)' }, { status: 400 });

    const startTime = Date.now();

    // ── IMAGE MODE ──
    if (mode === 'image') {
      const { prompt, model = 'openai/gpt-image-2', size, n = 1 } = body;
      if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });

      let image = null;
      let textContent = null;

      // Image-only models use /v1/images/generations; multimodal LLMs use /v1/chat/completions
      const isImageOnly = model.includes('gpt-image') || model.includes('flux') || model.includes('grok-imagine');

      if (isImageOnly) {
        const payload = { model, prompt, n, response_format: 'b64_json' };
        if (size) payload.size = size;
        const resp = await fetch(`${GATEWAY_BASE}/v1/images/generations`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.error('vercel-ai-gateway image error', resp.status, errText);
          return Response.json({ error: `Gateway ${resp.status}: ${errText}` }, { status: 502 });
        }
        const data = await resp.json();
        const b64 = data.data?.[0]?.b64_json;
        if (b64) image = `data:image/png;base64,${b64}`;
      } else {
        const resp = await fetch(`${GATEWAY_BASE}/v1/chat/completions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            modalities: ['text', 'image'],
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.error('vercel-ai-gateway image error', resp.status, errText);
          return Response.json({ error: `Gateway ${resp.status}: ${errText}` }, { status: 502 });
        }
        const data = await resp.json();
        const msg = data.choices?.[0]?.message;
        textContent = msg?.content || null;
        const img = msg?.images?.[0];
        if (img?.image_url?.url) image = img.image_url.url;
      }

      return Response.json({ ok: true, mode: 'image', model, image, text: textContent, latencyMs: Date.now() - startTime });
    }

    // ── TEXT MODE ──
    if (mode === 'text') {
      const { prompt, model = 'openai/gpt-6-astra', systemMessage, response_json_schema, temperature, max_tokens } = body;
      if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });

      const messages = [];
      if (systemMessage) messages.push({ role: 'system', content: systemMessage });
      messages.push({ role: 'user', content: prompt });

      const payload = { model, messages };
      if (temperature !== undefined && temperature !== null) payload.temperature = temperature;
      if (max_tokens !== undefined && max_tokens !== null) payload.max_tokens = max_tokens;
      if (response_json_schema) {
        payload.response_format = { type: 'json_schema', json_schema: { name: 'response', schema: response_json_schema } };
      }

      const resp = await fetch(`${GATEWAY_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('vercel-ai-gateway text error', resp.status, errText);
        return Response.json({ error: `Gateway ${resp.status}: ${errText}` }, { status: 502 });
      }
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '';
      let parsed = null;
      if (response_json_schema) {
        try { parsed = JSON.parse(text); } catch (e) { console.warn('JSON parse failed', e); }
      }

      return Response.json({ ok: true, mode: 'text', model, text, parsed, usage: data.usage, latencyMs: Date.now() - startTime });
    }

    // ── SPEECH MODE ──
    if (mode === 'speech') {
      const { text, model = 'openai/tts-1', voice = 'alloy', outputFormat = 'mp3' } = body;
      if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

      const resp = await fetch(`${GATEWAY_BASE}/v4/ai/speech-model`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'ai-gateway-protocol-version': '0.0.1',
          'ai-speech-model-specification-version': '4',
          'ai-model-id': model,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice, outputFormat }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('vercel-ai-gateway speech error', resp.status, errText);
        return Response.json({ error: `Gateway ${resp.status}: ${errText}` }, { status: 502 });
      }
      const data = await resp.json();
      const audioBase64 = data.audio;
      const mime = outputFormat === 'wav' ? 'audio/wav' : 'audio/mpeg';
      const audio = audioBase64 ? `data:${mime};base64,${audioBase64}` : null;

      return Response.json({ ok: true, mode: 'speech', model, voice, audio, warnings: data.warnings || [], latencyMs: Date.now() - startTime });
    }

    // ── TRANSCRIBE MODE ──
    if (mode === 'transcribe') {
      const { audio, mediaType = 'audio/mpeg', model = 'openai/whisper-1' } = body;
      if (!audio) return Response.json({ error: 'audio (base64 string) is required' }, { status: 400 });

      const resp = await fetch(`${GATEWAY_BASE}/v4/ai/transcription-model`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'ai-gateway-protocol-version': '0.0.1',
          'ai-transcription-model-specification-version': '4',
          'ai-model-id': model,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio, mediaType }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('vercel-ai-gateway transcribe error', resp.status, errText);
        return Response.json({ error: `Gateway ${resp.status}: ${errText}` }, { status: 502 });
      }
      const data = await resp.json();

      return Response.json({
        ok: true, mode: 'transcribe', model,
        text: data.text || '',
        language: data.language || null,
        durationInSeconds: data.durationInSeconds || null,
        segments: data.segments || [],
        warnings: data.warnings || [],
        latencyMs: Date.now() - startTime,
      });
    }

    return Response.json({ error: 'Invalid mode. Use image|text|speech|transcribe' }, { status: 400 });
  } catch (err) {
    console.error('vercel-ai-gateway error', err);
    return Response.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}