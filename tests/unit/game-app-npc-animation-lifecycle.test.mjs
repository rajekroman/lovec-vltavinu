import test from "node:test";
import assert from "node:assert/strict";

import { GameApp } from "../../src/core/GameApp.js";
import {
  createAnimatedNPC,
  endActiveDialogueAnimations,
  playDialogueAnimation,
  setNpcAnimationsPaused
} from "../../src/render/NPCAnimationSystem.js";

function createNpc(characterKey) {
  const texture = {
    source: { data: { width: 600 } },
    offset: { x: 0 },
    repeat: { x: 1 },
    needsUpdate: false
  };
  const renderer = {
    createSprite(map) {
      return { material: { map, needsUpdate: false } };
    }
  };
  return createAnimatedNPC(
    {},
    renderer,
    characterKey,
    { assetId: `test-${characterKey}`, width: 120, height: 160, texture },
    { width: 120, height: 160 }
  );
}

function createApp(scene) {
  const loop = {
    addSystem() { return () => {}; },
    addRenderer() { return () => {}; },
    start() { return true; },
    stop() { return true; }
  };
  const input = {
    snapshot() { return {}; },
    endFrame() {},
    reset() {},
    dispose() {}
  };
  const scenes = {
    transitioning: false,
    activeScene: scene,
    render() {},
    async transitionTo() {},
    async dispose() {}
  };
  return new GameApp({
    loop,
    input,
    scenes,
    events: { emit() {}, clear() {} },
    world: { clear() {} },
    assets: { clear() {} },
    collisions: { reset() {} },
    animations: {},
    renderer: { render() {}, dispose() {} }
  });
}

test.afterEach(() => {
  setNpcAnimationsPaused(false);
  endActiveDialogueAnimations();
});

test("GameApp advances an active dialogue exactly once per fixed step", () => {
  const jan = createNpc("forester_jan");
  jan.playAnimation("idle");
  playDialogueAnimation(jan, "start");

  const scene = {
    modal: "dialog",
    session: { state: { phase: "playing" } },
    updateAnimations(dt) {
      // Existing Nesměň/other scene code may call update locally. The wrapper
      // must suppress this while GameApp owns the active dialogue tick.
      jan.update(dt * 1000);
    }
  };
  const app = createApp(scene);

  assert.equal(jan.getState().currentFrame, 1);
  app.updateFixed(0.4, 0);
  assert.equal(jan.getState().animation, "talk");
  assert.equal(jan.getState().currentFrame, 2, "dialogue must advance once, not zero or twice");
});

test("GameApp returns the active speaker to idle within one fixed tick after dialog closes", () => {
  const jan = createNpc("forester_jan");
  playDialogueAnimation(jan, "start");

  const scene = {
    modal: "dialog",
    session: { state: { phase: "playing" } },
    updateAnimations(dt) {
      jan.update(dt * 1000);
    }
  };
  const app = createApp(scene);

  app.updateFixed(1 / 60, 0);
  assert.equal(jan.getState().animation, "talk");

  scene.modal = null;
  app.updateFixed(1 / 60, 1 / 60);
  assert.equal(jan.getState().animation, "idle");
  assert.equal(jan.getState().currentFrame, 2);
});

test("GameApp freezes scene-owned NPC animation while session is paused", () => {
  const karel = createNpc("rival_karel");
  karel.playAnimation("action_back_away");

  const scene = {
    modal: null,
    session: { state: { phase: "paused" } },
    updateAnimations(dt) {
      karel.update(dt * 1000);
    }
  };
  const app = createApp(scene);
  const before = karel.getState();

  app.updateFixed(1, 0);
  assert.deepEqual(karel.getState(), before, "pause must freeze frame, clip and playback state");

  scene.session.state.phase = "playing";
  app.updateFixed(0.26, 0.26);
  assert.equal(karel.getState().animation, "action_back_away");
  assert.notEqual(karel.getState().currentFrame, before.currentFrame, "resume must continue without restarting the clip");
});
