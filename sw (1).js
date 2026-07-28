// A Kilenc Pecsét — service worker
// Célja: telepíthetőség (PWA) + alap offline működés. Nem szerver, csak a böngésző
// saját cache-ét használja ezen az eszközön belül.
const CACHE_NAME = 'kilencpecset-cache-v2';
const PRECACHE = [
  './',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))).catch(()=>{});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégia: hálózat előnyben (friss tartalom), ha nincs net, cache-ből szolgál ki —
// így fejlesztés közben mindig a legfrissebbet látod, offline pedig még mindig működik.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return resp;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('./')))
  );
});
