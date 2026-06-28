const STATIC_CACHE = "saccos-static-v5";
const RUNTIME_CACHE = "saccos-runtime-v5";
const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-ilboru.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isProtectedPath(url) {
  return url.pathname.startsWith("/api/");
}

function isRuntimeAsset(request, url) {
  if (request.method !== "GET" || url.origin !== self.location.origin || isProtectedPath(url)) {
    return false;
  }

  if (url.pathname === "/sw.js") {
    return false;
  }

  if (["style", "script", "worker", "font", "image"].includes(request.destination)) {
    return true;
  }

  return /\.(?:css|js|mjs|woff2?|png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || isProtectedPath(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        return (await caches.match("/offline.html")) || Response.error();
      })
    );
    return;
  }

  if (!isRuntimeAsset(request, url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            void caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }

          return response;
        })
        .catch(() => cached || Response.error());

      return cached || networkFetch;
    })
  );
});
