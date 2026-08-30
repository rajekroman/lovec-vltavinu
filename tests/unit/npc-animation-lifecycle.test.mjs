import test from "node:test";
import assert from "node:assert/strict";

import {
  areNpcAnimationsPaused,
  createAnimatedNPC,
  endActiveDialogueAnimations,
  getActiveDialogueAnimationCount,
  playDialogueAnimation,
  setNpcAnimationsPaused,
  updateActiveDialogueAnimations
} from "../../src/render/NPCAnimationSystem.js";

function createTexture(width = 600) {
  return {
    source: { data: { width } },
    offset: { x: 0 },
    repeat: { x: 1 },
    needsUpdate: false
  };
}

function createNpc(characterKey) {
  const texture = createTexture();
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

function runUntilAnimation(npc, expected, { stepMs = 250, maxSteps = 20 } = {}) {
  for (let index = 0; index < maxSteps; index++) {
    npc.update(stepMs);
    if (npc.getState().animation === expected) return npc.getState();
  }
  return npc.getState();
}

test.afterEach(() => {
  setNpcAnimationsPaused(false);
  endActiveDialogueAnimations();
});

test("NPC state reports the requested animation name", () => {
  const npc = createNpc("farmer_vaclav");
  assert.equal(npc.playAnimation("idle"), true);
  assert.equal(npc.getState().animation, "idle");
  assert.equal(npc.playAnimation("talk"), true);
  assert.equal(npc.getState().animation, "talk");
  assert.equal(npc.playAnimation("missing-animation"), false);
  assert.equal(npc.getState().animation, "talk");
});

test("non-looping reactions return to idle after completion", () => {
  const npc = createNpc("thief_franta");
  npc.playAnimation("idle");
  npc.playAnimation("react_warning");
  assert.equal(npc.getState().animation, "react_warning");

  const state = runUntilAnimation(npc, "idle");
  assert.equal(state.animation, "idle");
  assert.equal(state.currentFrame, 3);
});

test("non-looping actions return to idle after completion", () => {
  const npc = createNpc("rival_karel");
  npc.playAnimation("action_back_away");
  assert.equal(npc.getState().animation, "action_back_away");

  const state = runUntilAnimation(npc, "idle");
  assert.equal(state.animation, "idle");
  assert.equal(state.currentFrame, 0);
});

test("active dialogue is advanced only by the central fixed-step coordinator", () => {
  const npc = createNpc("forester_jan");
  npc.playAnimation("idle");
  playDialogueAnimation(npc, "start");
  assert.equal(getActiveDialogueAnimationCount(), 1);
  assert.equal(npc.getState().animation, "talk");

  const initialFrame = npc.getState().currentFrame;
  npc.update(400);
  assert.equal(npc.getState().currentFrame, initialFrame, "scene-level update must not double-tick active dialogue");

  updateActiveDialogueAnimations(400);
  assert.notEqual(npc.getState().currentFrame, initialFrame, "fixed-step coordinator must advance the dialogue clip");
  assert.equal(npc.getState().animation, "talk");
});

test("looping dialogue stays active until an explicit end phase", () => {
  const npc = createNpc("forester_jan");
  npc.playAnimation("idle");
  playDialogueAnimation(npc, "start");

  for (let index = 0; index < 12; index++) updateActiveDialogueAnimations(250);
  assert.equal(npc.getState().animation, "talk");
  assert.equal(getActiveDialogueAnimationCount(), 1);

  playDialogueAnimation(npc, "end");
  assert.equal(getActiveDialogueAnimationCount(), 0);
  assert.equal(npc.getState().animation, "idle");
  assert.equal(npc.getState().currentFrame, 2);
});

test("global dialogue end returns every registered speaker to idle", () => {
  const jan = createNpc("forester_jan");
  const eva = createNpc("expert_eva");
  playDialogueAnimation(jan, "start");
  playDialogueAnimation(eva, "start");
  assert.equal(getActiveDialogueAnimationCount(), 2);

  endActiveDialogueAnimations();
  assert.equal(getActiveDialogueAnimationCount(), 0);
  assert.equal(jan.getState().animation, "idle");
  assert.equal(eva.getState().animation, "idle");
});

test("pause freezes NPC action frame and resumes without reset", () => {
  const npc = createNpc("rival_karel");
  npc.playAnimation("action_back_away");
  const before = npc.getState();

  setNpcAnimationsPaused(true);
  assert.equal(areNpcAnimationsPaused(), true);
  npc.update(1000);
  const paused = npc.getState();
  assert.deepEqual(paused, before);

  setNpcAnimationsPaused(false);
  npc.update(260);
  const resumed = npc.getState();
  assert.equal(resumed.animation, "action_back_away");
  assert.notEqual(resumed.currentFrame, before.currentFrame);
});

test("pause also freezes centrally coordinated dialogue", () => {
  const npc = createNpc("expert_eva");
  playDialogueAnimation(npc, "start");
  const before = npc.getState();

  setNpcAnimationsPaused(true);
  updateActiveDialogueAnimations(1000);
  assert.deepEqual(npc.getState(), before);

  setNpcAnimationsPaused(false);
  updateActiveDialogueAnimations(400);
  assert.notEqual(npc.getState().currentFrame, before.currentFrame);
  assert.equal(npc.getState().animation, "talk");
});

test("automatic idle recovery can be disabled for a scripted hold", () => {
  const npc = createNpc("farmer_vaclav");
  npc.playAnimation("action_point", { returnToIdle: false });

  for (let index = 0; index < 10; index++) npc.update(250);
  const state = npc.getState();
  assert.equal(state.animation, "action_point");
  assert.equal(state.isPlaying, false);
  assert.equal(state.currentFrame, 4);
});
