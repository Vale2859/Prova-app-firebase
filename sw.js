const CACHE_NAME = "farmacia-montesano-v7";

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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const accept = req.headers.get("accept") || "";
  const isHtml = req.mode === "navigate" || accept.includes("text/html");

  if (isHtml) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        })
      );
    })
  );
});
