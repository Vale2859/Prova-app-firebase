const CACHE_NAME = "farmacia-montesano-v6";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./mobile.css",
  "./mobile-only.css",
  "./app-fixes.css",
  "./app-fixes.js",
  "./mobile-only.js",
  "./mobile-preview.js",
  "./script.js",
  "./season-background.js",

  "./fidelity.html",
  "./fortuna.html",
  "./premi.html",
  "./profilo.html",
  "./turno.html",
  "./servizi.html",
  "./promo.html",
  "./giornate.html",
  "./assistente.html",
  "./login.html",
  "./register.html",

  "./operatori.html",
  "./carica-badge.html",
  "./firebase.js",

  "./manifest.json",
  "./logo.png",
  "./icon-192.png",
  "./icon-512.png",

  "./farmacia2.jpg",
  "./farmacia3.jpg",
  "./farmacia4.jpg",

  "./images/fidelity.jpg",
  "./images/fortuna.jpg",
  "./images/premi.jpg",
  "./images/profilo.jpg",
  "./images/servizi.jpg",
  "./images/promo.jpg",
  "./images/beauty.jpg",
  "./images/turno.jpg",
  "./images/mia.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { title: 'Farmacia Montesano', body: event.data ? event.data.text() : '' }; }
  const title = payload.title || 'Farmacia Montesano';
  const options = {
    body: payload.body || 'Hai un nuovo aggiornamento.',
    icon: payload.icon || './icon-192.png',
    badge: payload.badge || './icon-192.png',
    data: { url: payload.url || './index.html' },
    tag: payload.tag || 'montesano-notification',
    renotify: Boolean(payload.renotify)
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || './index.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    for (const client of windowClients) {
      if ('focus' in client && client.url.includes(self.location.origin)) {
        client.navigate(url);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
