import test from "node:test";
import assert from "node:assert/strict";

import { GameApp } from "../../src/core/GameApp.js";

function createApp({ transitionTo, fadeOut, fadeIn, calls }) {
  const loop = {
    addSystem() { return () => {}; },
    addRenderer() { return () => {}; },
    start() { return true; },
    stop() { return true; }
  };
  const input = {
    snapshot() { return {}; },
    endFrame() {},
    reset(reason) { calls.push(`reset:${reason}`); },
    dispose() {}
  };
  const scenes = {
    transitioning: false,
    activeScene: null,
    render() {},
    transitionTo,
    async dispose() {}
  };
  const transition = { fadeOut, fadeIn };

  return new GameApp({
    loop,
    input,
    scenes,
    transition,
    events: { emit() {}, clear() {} },
    world: { clear() {} },
    assets: { clear() {} },
    collisions: { reset() {} },
    animations: {},
    renderer: { render() {}, dispose() {} }
  });
}

test("GameApp fades back in after a failed scene transition and preserves the original error", async () => {
  const calls = [];
  const expectedError = new Error("next scene failed to enter");
  const app = createApp({
    calls,
    async fadeOut(duration) { calls.push(`fadeOut:${duration}`); },
    async fadeIn(duration) { calls.push(`fadeIn:${duration}`); },
    async transitionTo(id) {
      calls.push(`transitionTo:${id}`);
      throw expectedError;
    }
  });

  await assert.rejects(app.changeScene("nesmen"), error => error === expectedError);
  assert.deepEqual(calls, [
    "reset:scene-transition",
    "fadeOut:300",
    "transitionTo:nesmen",
    "fadeIn:300"
  ]);
});

test("GameApp does not let fade recovery mask a scene transition error", async () => {
  const calls = [];
  const expectedError = new Error("scene rollback error source");
  const app = createApp({
    calls,
    async fadeOut() { calls.push("fadeOut"); },
    async fadeIn() {
      calls.push("fadeIn");
      throw new Error("fade recovery failed");
    },
    async transitionTo() {
      calls.push("transitionTo");
      throw expectedError;
    }
  });

  await assert.rejects(app.changeScene("slavia"), error => error === expectedError);
  assert.deepEqual(calls, ["reset:scene-transition", "fadeOut", "transitionTo", "fadeIn"]);
});
