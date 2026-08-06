// Visual-X service worker — network-first for JS/CSS so changes appear immediately.
const CACHE_VERSION = 'vx-net-v2';
const CACHE_NAME = `visualx-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Network-first for navigations, JS, CSS, and same-origin assets
  const isNavigation = req.mode === 'navigate';
  const isJS = url.pathname.endsWith('.js') || url.pathname.endsWith('.jsx') || url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx');
  const isCSS = url.pathname.endsWith('.css');
  const isSameOrigin = url.origin === self.location.origin;

  if (isNavigation || isJS || isCSS || isSameOrigin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || new Response('Offline', { status: 503 })))
    );
  } else {
    // Cache-first for images, fonts, etc.
    event.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
      )
    );
  }
});
