const CACHE = "lovec-vltavinu-nesmen-v6-0";
const CORE = [
  "./", "./index.html", "./style.css", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./vendor/three.module.min.js", "./vendor/three.core.min.js", "./src/bootstrap.js",
  "./src/core/EventBus.js", "./src/core/GameEvents.js", "./src/core/GameApp.js", "./src/core/GameLoop.js", "./src/core/SceneManager.js", "./src/core/InputManager.js", "./src/core/AssetLoader.js",
  "./src/ecs/World.js", "./src/systems/CollisionSystem.js", "./src/systems/AnimationSystem.js",
  "./src/data/levels.js", "./src/data/chlum.js", "./src/data/nesmen.js", "./src/data/dialogues.js",
  "./src/gameplay/GameSession.js", "./src/gameplay/Objectives.js", "./src/gameplay/InteractionSystem.js", "./src/gameplay/DigSystem.js", "./src/gameplay/DangerSystem.js", "./src/gameplay/ObjectiveSystem.js",
  "./src/render/HybridRenderer.js", "./src/render/ThreeRenderer.js", "./src/render/GltfAssetLoader.js", "./src/render/AssetDisposal.js", "./src/render/ModelFactory.js",
  "./vendor/three/addons/loaders/GLTFLoader.js", "./vendor/three/addons/utils/BufferGeometryUtils.js", "./vendor/three/addons/utils/SkeletonUtils.js",
  "./src/input/DomInputAdapter.js", "./src/ui/ScreenController.js", "./src/ui/HudController.js", "./src/scenes/TitleScene.js", "./src/scenes/ChlumScene.js", "./src/scenes/ChlumNesmenBridgeScene.js", "./src/scenes/NesmenScene.js", "./src/scenes/NesmenRestorationScene.js",
  "./assets/manifests/assets.json", "./assets/sprites/player/hunter-walk-sheet.png", "./assets/sprites/npcs/farmer-vaclav.png", "./assets/sprites/npcs/forester-jan.png",
  "./assets/sprites/findings/vltavin-common.png", "./assets/sprites/findings/vltavin-rare.png", "./assets/sprites/findings/vltavin-standard.png", "./assets/sprites/findings/vltavin-nesmen.png",
  "./assets/textures/terrain/chlum-field.png", "./assets/textures/terrain/chlum-furrows.png", "./assets/textures/terrain/nesmen-forest-floor.png", "./assets/textures/terrain/nesmen-sand-profile.png",
  "./assets/models/chlum/tractor-no-driver.glb", "./assets/models/chlum/hay-bale.glb", "./assets/models/chlum/field-marker.glb", "./assets/models/chlum/field-fence-segment.glb",
  "./assets/models/nesmen/profile-marker.glb", "./assets/models/nesmen/tree-stump.glb"
];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => { const clone = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, clone)); return response; }).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(fetch(event.request).then(response => { const clone = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, clone)); return response; }).catch(() => caches.match(event.request)));
});
