const CACHE_NAME = 'slowdesk-v2';

// Assets to pre-cache on install (app shell)
const PRECACHE_URLS = [
  '/',
  '/tasks',
  '/habits',
  '/projects',
  '/notes',
  '/calendar',
];

// ── Install: pre-cache the app shell ────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API/auth, cache-first for assets ─
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Skip API routes, Supabase, and Next.js internals — always network
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/auth/')
  ) return;

  // Pages: stale-while-revalidate
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then(res => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => null);

        // Return cached immediately, update in background
        return cached ?? await networkFetch ?? new Response(
          '<h1 style="font-family:sans-serif;text-align:center;padding:60px">You\'re offline</h1><p style="text-align:center;color:#888">SlowDesk needs a connection to load. Please reconnect.</p>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then(cached =>
      cached ?? fetch(request).then(res => {
        if (res.ok) {
          caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
        }
        return res;
      })
    )
  );
});
