/* AURA // DAILY OS — offline shell */
/* SHELL_VERSION must match the ?v= queries on the script/style tags in
   index.html. Bump it (and those queries) whenever a shell file changes: the
   versioned URL is what guarantees a new HTML can never pair with an older
   cached app.js, which is exactly how the account gate once failed to appear. */
const SHELL_VERSION = '42';
const CACHE_NAME = 'aura-v' + SHELL_VERSION;
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css?v=' + SHELL_VERSION,
  './supabase-client.js?v=' + SHELL_VERSION,
  './app.js?v=' + SHELL_VERSION,
  './manifest.json',
  './assets/aura-mark.png',
  './icons/favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    /* cache: 'reload' bypasses the HTTP cache (GitHub Pages sends max-age=600),
       so the precache holds the bytes of this deploy, not a stale copy. */
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(
        CORE_ASSETS.map((url) => new Request(url, { cache: 'reload' }))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/* A page that loaded a newer shell can ask this worker to take over at once. */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* Navigations: always ask the network first, fall back to the cached shell
     offline. That keeps the HTML current even when the worker is mid-update. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./')))
    );
    return;
  }

  /* Assets are cache-first, which is safe because every shell asset carries
     the ?v=<SHELL_VERSION> query: a new version is a new URL, so it can never
     resolve to an older cached file. Matching is exact — ignoreSearch would
     hand back the previous version's copy again. */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.destination === 'document') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
