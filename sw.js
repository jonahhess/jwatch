const CACHE_NAME = "sjw-shell-v2";

const GHPATH = "/jwatch";

const APP_PREFIX = "sjw_";

const ASSETS = [
  `${GHPATH}/`,
  `${GHPATH}//index.html`,
  `${GHPATH}//manifest.json`,
  `${GHPATH}//icons/icon-192.png`,
  `${GHPATH}//icons/icon-512.png`,
  // add CSS / JS files here if separate
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore cross-origin requests (Google Maps, Forms, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation: network first, fallback to cached shell
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req);
    })
  );
});
