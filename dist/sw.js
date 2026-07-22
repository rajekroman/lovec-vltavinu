const CACHE_NAME = "lovec-vltavinu-v0.15.0";
const CORE_ASSETS = [
  "./",
  "./site.webmanifest",
  "./icon.svg",
  "./assets/app.js",
  "./assets/app.css",
  "./assets/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("lovec-vltavinu-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          event.waitUntil(cacheResponse(event.request, response));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached ?? (event.request.mode === "navigate" ? caches.match("./") : Response.error());
      }),
  );
});

async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch {
    // A full or unavailable cache must never turn a successful network fetch
    // into a failed game request.
  }
}
