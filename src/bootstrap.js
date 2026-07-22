import * as THREE from "../vendor/three.module.min.js";
import { EventBus } from "./core/EventBus.js";
import { EVENT_CONTRACTS, validateEventPayload } from "./core/GameEvents.js";
import { GameApp } from "./core/GameApp.js";
import { createGameSession } from "./gameplay/GameSession.js";
import { ThreeRenderer } from "./render/ThreeRenderer.js";
import { ScreenController } from "./ui/ScreenController.js";
import { HudController } from "./ui/HudController.js";
import { DomInputAdapter } from "./input/DomInputAdapter.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { ChlumScene } from "./scenes/ChlumScene.js";

const documentRef = globalThis.document;
const windowRef = globalThis.window;
const canvas = documentRef.getElementById("game");
if (!canvas) throw new Error("Missing #game canvas.");
documentRef.getElementById("soundButton")?.classList.add("hidden");

const events = new EventBus({
  contracts: EVENT_CONTRACTS,
  strict: true,
  validatePayload: validateEventPayload
});
const renderer = new ThreeRenderer({
  three: THREE,
  canvas,
  viewHeight: 720,
  pixelRatioCap: 2,
  maxInternalPixels: 1_800_000,
  clearColor: 0x17150f,
  antialias: true
});
const app = new GameApp({ events, renderer });
const session = createGameSession();
const screens = new ScreenController(documentRef);
const hud = new HudController({ document: documentRef, events });
const lifecycle = new AbortController();

function resize() {
  renderer.resizeToElement(canvas);
}

const inputAdapter = new DomInputAdapter({
  input: app.input,
  document: documentRef,
  window: windowRef,
  onResize: resize
});

app.assets.register("json", async entry => {
  const response = await fetch(entry.url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${entry.url}`);
  return response.json();
});
app.assets.register("texture", entry => new Promise((resolve, reject) => {
  new THREE.TextureLoader().load(entry.url, resolve, undefined, reject);
}));

const chlum = new ChlumScene({
  app,
  events,
  renderer,
  three: THREE,
  screens,
  session
});
const title = new TitleScene({
  document: documentRef,
  screens,
  onStart: () => startNewRun().catch(showFatalError)
});
app.scenes.register("title", title);
app.scenes.register("chlum", chlum);

async function startNewRun() {
  session.reset();
  await app.changeScene("chlum");
}

function showFatalError(error) {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  screens.showFatal({
    title: "Hru se nepodařilo spustit",
    text: message,
    onRetry: () => windowRef.location.reload()
  });
}

function installLifecycleHandlers() {
  const { signal } = lifecycle;
  documentRef.addEventListener("visibilitychange", () => {
    if (documentRef.hidden) app.stop();
    else if (!app.disposed) app.start();
  }, { signal });
  windowRef.addEventListener("pagehide", () => app.input.reset("page-hide"), { signal });
  windowRef.addEventListener("beforeunload", () => {
    lifecycle.abort();
    inputAdapter.dispose();
    hud.dispose();
    screens.dispose();
    void app.dispose();
  }, { signal });
}

function installDebugApi() {
  windowRef.__lovecRuntime = Object.freeze({
    snapshot: () => ({
      stable: !app.disposed,
      scene: app.scenes.activeId,
      running: app.loop.running,
      screen: screens.activeId ?? "playing",
      renderer: {
        width: renderer.width,
        height: renderer.height,
        pixelRatio: renderer.pixelRatio,
        type: "three-webgl-orthographic"
      },
      session: session.state,
      chlum: app.scenes.activeId === "chlum" ? chlum.snapshot() : null
    }),
    resetInput: reason => inputAdapter.reset(reason),
    resize
  });
}

async function boot() {
  resize();
  installLifecycleHandlers();
  installDebugApi();
  await app.boot("title");
  app.start();
  if ("serviceWorker" in navigator && !windowRef.location.search.includes("debug")) {
    navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker:", error));
  }
}

boot().catch(showFatalError);

export { app, events, renderer, session, title, chlum, startNewRun };
