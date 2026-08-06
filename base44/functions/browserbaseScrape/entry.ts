import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

const SKIP = ['google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'yelp.com', 'twitter.com', 'x.com', 'pinterest.com', 'bing.com', 'duckduckgo.com'];

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

const LINKS_EXPR = `(() => {
  const skip = ${JSON.stringify(SKIP)};
  const seen = new Set(); const out = [];
  document.querySelectorAll('a[href]').forEach(a => {
    let h = a.href; const m = h.match(/[?&](?:url|q)=([^&]+)/);
    if (m) h = decodeURIComponent(m[1]);
    try { const u = new URL(h); const host = u.hostname.replace(/^www\\./, '');
      if (skip.some(s => host.includes(s))) return;
      if (h.startsWith('http') && !seen.has(h)) { seen.add(h); out.push(h); }
    } catch {}
  });
  return out.slice(0, 20);
})()`;

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
    await cdp.waitForEvent('Page.loadEventFired', sessionId, 12000).catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
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

    const apiKey = secrets.get('BROWSERBASE_API_KEY');
    const projectId = secrets.get('BROWSERBASE_PROJECT_ID');
    if (!apiKey || !projectId) return Response.json({ error: 'Browserbase API key or Project ID not set' }, { status: 500 });

    const caps: Record<string, number> = { quick: 6, mid: 10, deep: 8 };
    const cap = caps[depth] || 6;

    const sessionRes = await fetch('https://www.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-bb-api-key': apiKey },
      body: JSON.stringify({ projectId }),
    });
    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      return Response.json({ error: 'Browserbase session creation failed', detail: err }, { status: 502 });
    }
    const session = await sessionRes.json();
    const sessionId = session.id;
    const connectUrl = session.connectUrl || `wss://connect.browserbase.com?session=${sessionId}`;

    const ws: any = new WebSocket(connectUrl);
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('WebSocket connect timeout')), 20000);
      ws.onopen = () => { clearTimeout(t); resolve(null); };
      ws.onerror = () => { clearTimeout(t); reject(new Error('WebSocket connection failed')); };
    });

    const cdp = makeCDP(ws);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId: psid } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, psid);
    await cdp.send('Runtime.enable', {}, psid);

    const q = `${category} ${city || ''} ${state || ''}`.trim();
    const links: string[] = (await evalAt(cdp, psid, `https://www.google.com/search?q=${encodeURIComponent(q)}&num=20`, LINKS_EXPR)) || [];

    const results: any[] = [];
    for (const url of links.slice(0, cap)) {
      const data = await evalAt(cdp, psid, url, EXTRACT_EXPR);
      if (!data) continue;
      const businessName = (data.title || '').replace(/\s*[|\-–—].*$/, '').trim() || (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
      let email = data.emails[0] || '';
      if (depth === 'deep' && !email) {
        for (const path of ['/contact', '/contact-us', '/about']) {
          let cu = '';
          try { cu = new URL(path, url).href; } catch { continue; }
          const cdata = await evalAt(cdp, psid, cu, EXTRACT_EXPR);
          if (cdata?.emails[0]) { email = cdata.emails[0]; break; }
        }
      }
      results.push({ business_name: businessName, address: data.address || '', phone: data.phones[0] || '', website: url, email, source_url: url });
    }

    try { await cdp.send('Target.closeTarget', { targetId }); } catch {}
    try { ws.close(); } catch {}

    return Response.json({ results, count: results.length });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}