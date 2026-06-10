/*
 * OurMoment service worker — makes the PWA installable and resilient offline.
 *
 * Strategy (deliberately conservative so a deploy can never strand users on a
 * stale JS bundle):
 *  - Hashed build artifacts (/_expo/, /assets/, /icons/) -> cache-first; their
 *    filenames change on every build, so cached entries can never go stale.
 *  - Navigations -> network-first, falling back to the cached app shell when
 *    offline.
 *  - Everything else (Firebase APIs, Storage, Stripe) -> network only.
 */

const CACHE = 'ourmoment-v4';
const SHELL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([SHELL, '/manifest.json'])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never intercept Firebase/Stripe

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }

  const isStatic =
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json';
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
