import test from "node:test";
import assert from "node:assert/strict";

import { GameApp } from "../../src/core/GameApp.js";
import { AssetLoader } from "../../src/core/AssetLoader.js";

function createLoop() {
  return {
    addSystem() { return () => {}; },
    addRenderer() { return () => {}; },
    start() { return true; },
    stop() { return true; }
  };
}

test("GameApp.dispose preserves registered AssetLoader type disposers", async () => {
  const disposal = [];
  const assets = new AssetLoader();
  assets.register(
    "gltf",
    async entry => ({
      id: entry.id,
      dispose() { disposal.push("generic-asset-dispose"); }
    }),
    (asset, entry) => disposal.push(`registered:${entry.type}:${asset.id}`)
  );
  assets.setManifest([
    { id: "fixture-model", type: "gltf", url: "./fixture.glb", preload: "test" }
  ]);
  await assets.preloadGroups("test");

  const inputResets = [];
  const app = new GameApp({
    assets,
    loop: createLoop(),
    input: {
      reset(reason) { inputResets.push(reason); },
      dispose() {},
      snapshot() { return {}; },
      endFrame() {}
    },
    scenes: {
      transitioning: false,
      activeScene: null,
      render() {},
      async dispose() {}
    },
    events: { emit() {}, clear() {} },
    world: { clear() {} },
    collisions: { reset() {} },
    animations: {}
  });

  await app.dispose();
  await Promise.resolve();

  assert.deepEqual(inputResets, ["app-stop"]);
  assert.deepEqual(disposal, ["registered:gltf:fixture-model"]);
  assert.equal(assets.has("fixture-model"), false);
});
