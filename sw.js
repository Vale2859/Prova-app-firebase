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
