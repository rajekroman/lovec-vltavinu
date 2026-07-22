const CACHE = "lovec-vltavinu-v6-0";
const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./vendor/three.module.min.js",
  "./vendor/three.core.min.js",
  "./src/bootstrap.js",
  "./src/core/EventBus.js",
  "./src/core/GameEvents.js",
  "./src/core/GameApp.js",
  "./src/core/GameLoop.js",
  "./src/core/SceneManager.js",
  "./src/core/InputManager.js",
  "./src/core/AssetLoader.js",
  "./src/ecs/World.js",
  "./src/systems/CollisionSystem.js",
  "./src/systems/AnimationSystem.js",
  "./src/data/levels.js",
  "./src/gameplay/GameSession.js",
  "./src/gameplay/Objectives.js",
  "./src/render/HybridRenderer.js",
  "./src/render/ThreeRenderer.js",
  "./src/input/DomInputAdapter.js",
  "./src/ui/ScreenController.js",
  "./src/ui/HudController.js",
  "./src/scenes/TitleScene.js",
  "./src/scenes/ChlumScene.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE).map(key => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
