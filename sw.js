const CACHE_NAME = "farmacia-montesano-v11";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./dashboard-admin.html",
  "./operatori.html",
  "./profilo.html",
  "./fortuna.html",
  "./style.css",
  "./mobile.css",
  "./script.js",
  "./firebase.js",
  "./notification-utils.js",
  "./push-config.js",
  "./manifest.json",
  "./logo.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("Errore cache:", asset);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Per le pagine HTML importanti: sempre rete prima, cache solo come riserva
  if (
    url.pathname.endsWith("/turno.html") ||
    url.pathname.endsWith("/giornate.html") ||
    url.pathname.endsWith("/fortuna.html") ||
    url.pathname.endsWith("/calendario.html") ||
    url.pathname.endsWith("/index.html") ||
    request.mode === "navigate"
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Per tutto il resto: cache prima
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
      );
    })
  );
});

// 🔔 NOTIFICHE PUSH
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    data = {
      title: "Notifica",
      body: event.data.text()
    };
  }

  const title = data.title || "Farmacia Montesano";

  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: data.url || "https://farmaciamontesano.web.app"
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    renotify: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 👉 CLICK NOTIFICA
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
