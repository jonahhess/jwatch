const CACHE_NAME = "sjw-shell-v1";
const OFFLINE_URL = "/";
const ASSETS = [
  "/", // index.html
  "/index.html",
  "/manifest.json",
  "/sw.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  // Add additional local assets you want cached, e.g. CSS, local images
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        // if some files are missing, still continue
        console.warn("Cache addAll error", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    // clean up old caches
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// fetch handler: serve shell from cache, fallback to network. For navigation, try network then fallback to cache.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore cross-origin requests (like Google Forms/My Maps) — let the browser handle them
  if (url.origin !== location.origin) {
    return; // don't intercept
  }

  // For navigation requests, prefer network then fallback to cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // store a copy in cache
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => {
          return caches.match("/index.html");
        })
    );
    return;
  }

  // For other same-origin requests: cache-first strategy
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((networkRes) => {
          // optionally cache it
          if (req.method === "GET") {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(req, networkRes.clone()));
          }
          return networkRes;
        })
        .catch(() => {
          // final fallback: offline page or index
          return caches.match("/index.html");
        });
    })
  );
});
