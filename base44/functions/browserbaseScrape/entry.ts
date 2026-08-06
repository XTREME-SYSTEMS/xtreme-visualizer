import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

function makeCDP(ws: any) {
  let id = 0;
  const pending = new Map<number, any>();
  const events: any[] = [];
  ws.onmessage = (e: MessageEvent) => {
    let msg: any;
    try { msg = JSON.parse(typeof e.data === 'string' ? e.data : ''); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  };
  return {
    send(method: string, params: any = {}, sessionId?: string) {
      return new Promise((resolve, reject) => {
        const mid = ++id;
        pending.set(mid, { resolve, reject });
        const payload: any = { id: mid, method, params };
        if (sessionId) payload.sessionId = sessionId;
        ws.send(JSON.stringify(payload));
      });
    },
    waitForEvent(method: string, sessionId: string, timeout = 15000) {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout: ' + method)), timeout);
        const check = () => {
          const i = events.findIndex((ev) => ev.method === method && ev.sessionId === sessionId);
          if (i >= 0) { clearTimeout(t); resolve(events.splice(i, 1)[0]); }
          else setTimeout(check, 60);
        };
        check();
      });
    },
  };
}

const EXTRACT_EXPR = `(() => {
  const text = document.body ? document.body.innerText : '';
  const title = document.title || '';
  const emailRe = /[\\w.+-]+@[\\w-]+\\.[\\w.-]+/g;
  const phoneRe = /\\(?\\d{3}\\)?[-.\\s]\\d{3}[-.\\s]\\d{4}/g;
  const mailto = [...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.href.replace('mailto:','').split('?')[0]);
  const emails = [...new Set([...mailto, ...(text.match(emailRe) || [])])].filter(e => !/(sentry|wixpress|example|\\.png|\\.jpg|\\.svg|domain\\.com|sentry\\.io|wix\\.com)/i.test(e));
  const phones = [...new Set((text.match(phoneRe) || []))];
  const addr = text.match(/\\d+\\s+[A-Z][\\w\\s.,#-]{6,40}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Way|Pkwy|Parkway|Ct|Court|Pl|Place)\\b[\\w\\s.,#-]{0,30}/);
  return { title, emails: emails.slice(0,3), phones: phones.slice(0,2), address: addr ? addr[0].trim() : '' };
})()`;

async function evalAt(cdp: any, sessionId: string, url: string, expr: string) {
  try {
    await cdp.send('Page.navigate', { url }, sessionId);
    await cdp.waitForEvent('Page.loadEventFired', sessionId, 7000).catch(() => {});
    await new Promise((r) => setTimeout(r, 400));
    const { result } = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    return result?.value || null;
  } catch {
    return null;
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { category, city, state, depth } = body;
    if (!category) return Response.json({ error: 'category is required' }, { status: 400 });

    const caps: Record<string, number> = { quick: 6, mid: 10, deep: 8 };
    const cap = caps[depth] || 6;
    const locationStr = [city, state].filter(Boolean).join(', ');

    // 1. Find local businesses via LLM web search (reliable — no search-engine bot wall)
    const prompt = `Find up to ${cap} real local businesses matching "${category}"${locationStr ? ` located in ${locationStr}` : ''}. For each business return: business_name, website (full https URL, or empty string if none), phone (E.164 or local format, or empty string), email (publicly listed contact email, or empty string), address (street address, or empty string). Only include actual local businesses — not directories like Yelp/Angi/Houzz, and not national chains unless they have a local branch. Return JSON.`;
    let businesses: any[] = [];
    try {
      const llmRes: any = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            businesses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  business_name: { type: 'string' },
                  website: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  address: { type: 'string' },
                },
              },
            },
          },
        },
      });
      businesses = (llmRes && Array.isArray(llmRes.businesses)) ? llmRes.businesses : [];
    } catch (e) {
      return Response.json({ error: 'Business search failed', detail: (e as Error).message }, { status: 502 });
    }

    const results: any[] = businesses.slice(0, cap).map((b: any) => ({
      business_name: (b.business_name || '').toString().trim(),
      address: (b.address || '').toString().trim(),
      phone: (b.phone || '').toString().trim(),
      website: (b.website || '').toString().trim(),
      email: (b.email || '').toString().trim(),
      source_url: (b.website || '').toString().trim(),
    }));

    // 2. Enrich missing emails (and phones/addresses) by visiting each business's own site
    const needEmail = results.filter((r) => r.website && !r.email);
    if (needEmail.length > 0) {
      const apiKey = secrets.get('BROWSERBASE_API_KEY');
      const projectId = secrets.get('BROWSERBASE_PROJECT_ID');
      if (apiKey && projectId) {
        let cdp: any = null;
        let ws: any = null;
        let targetId: string | null = null;
        try {
          const sessionRes = await fetch('https://www.browserbase.com/v1/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-bb-api-key': apiKey },
            body: JSON.stringify({ projectId }),
          });
          if (sessionRes.ok) {
            const session = await sessionRes.json();
            const sessionId = session.id;
            const connectUrl = session.connectUrl || `wss://connect.browserbase.com?session=${sessionId}`;
            ws = new WebSocket(connectUrl);
            await new Promise((resolve, reject) => {
              const t = setTimeout(() => reject(new Error('WebSocket connect timeout')), 20000);
              ws.onopen = () => { clearTimeout(t); resolve(null); };
              ws.onerror = () => { clearTimeout(t); reject(new Error('WebSocket connection failed')); };
            });
            cdp = makeCDP(ws);
            const tgt = await cdp.send('Target.createTarget', { url: 'about:blank' });
            targetId = tgt.targetId;
            const { sessionId: psid } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
            await cdp.send('Page.enable', {}, psid);
            await cdp.send('Runtime.enable', {}, psid);

            for (const r of needEmail) {
              const data = await evalAt(cdp, psid, r.website, EXTRACT_EXPR);
              if (data?.emails?.[0]) r.email = data.emails[0];
              if (!r.phone && data?.phones?.[0]) r.phone = data.phones[0];
              if (!r.address && data?.address) r.address = data.address;
              if ((depth === 'deep') && !r.email) {
                for (const path of ['/contact', '/contact-us', '/about']) {
                  let cu = '';
                  try { cu = new URL(path, r.website).href; } catch { continue; }
                  const cdata = await evalAt(cdp, psid, cu, EXTRACT_EXPR);
                  if (cdata?.emails?.[0]) { r.email = cdata.emails[0]; break; }
                }
              }
            }
          }
        } catch { /* enrichment is best-effort */ }
        finally {
          try { if (targetId && cdp) await cdp.send('Target.closeTarget', { targetId }); } catch {}
          try { if (ws) ws.close(); } catch {}
        }
      }
    }

    return Response.json({ results, count: results.length });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}