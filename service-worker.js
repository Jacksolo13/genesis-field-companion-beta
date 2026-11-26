const CACHE_PREFIX = `genesis-field-companion:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}0.9.0-beta`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './aurebesh-rodian.otf',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html', { cacheName: CACHE_NAME }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { cacheName: CACHE_NAME }).then(cached => {
      const refreshed = fetch(event.request)
        .then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || refreshed;
    })
  );
});
