const CACHE = "lovec-vltavinu-full-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./data.js",
  "./audio.js",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/audio/music/field.wav",
  "./assets/audio/music/meadow.wav",
  "./assets/audio/music/forest.wav",
  "./assets/audio/music/night.wav",
  "./assets/audio/music/boss.wav",
  "./assets/audio/music/city.wav",
  "./assets/audio/music/expo.wav",
  "./assets/audio/sfx/menu.wav",
  "./assets/audio/sfx/collect.wav",
  "./assets/audio/sfx/rare.wav",
  "./assets/audio/sfx/dig.wav",
  "./assets/audio/sfx/fill.wav",
  "./assets/audio/sfx/hit.wav",
  "./assets/audio/sfx/police.wav",
  "./assets/audio/sfx/cash.wav",
  "./assets/audio/sfx/boss.wav",
  "./assets/audio/sfx/win.wav",
  "./assets/audio/sfx/wrong.wav",
  "./assets/audio/sfx/step.wav",
  "./vendor/three.module.min.js",
  "./vendor/THREE-LICENSE.txt"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(ASSETS.map(url => cache.add(url).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && (response.ok || response.type === "opaque")) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
