import test from "node:test";
import assert from "node:assert/strict";

import { CHLUM_ENTITY_DEFINITIONS } from "../../src/data/chlum.js";
import { NESMEN_ENTITY_DEFINITIONS } from "../../src/data/nesmen.js";
import { BESEDNICE_ENTITY_DEFINITIONS } from "../../src/data/besednice.js";
import { SLAVIA_ENTITY_DEFINITIONS } from "../../src/data/slavia.js";
import { AnimationSystem, createAnimation } from "../../src/systems/AnimationSystem.js";

const DIRECTION_FRAMES = Object.freeze({
  down: Object.freeze([0, 1, 2, 3]),
  left: Object.freeze([4, 5, 6, 7]),
  right: Object.freeze([8, 9, 10, 11]),
  up: Object.freeze([12, 13, 14, 15])
});

const IDLE_FRAMES = Object.freeze({
  down: Object.freeze([0]),
  left: Object.freeze([4]),
  right: Object.freeze([8]),
  up: Object.freeze([12])
});

function createPlayerAnimation() {
  return createAnimation({
    clip: "idle",
    frames: [0],
    fps: 8,
    playing: false,
    direction: "down",
    clips: {
      idle: { directionFrames: IDLE_FRAMES, fps: 1, loop: true },
      walk: { directionFrames: DIRECTION_FRAMES, fps: 8, loop: true }
    },
    motionClip: "walk",
    idleClip: "idle",
    resetOnIdle: true
  });
}

const cases = [
  { name: "right", move: { x: 1, y: 0 }, direction: "right", idleFrame: 8 },
  { name: "left", move: { x: -1, y: 0 }, direction: "left", idleFrame: 4 },
  { name: "up", move: { x: 0, y: 1 }, direction: "up", idleFrame: 12 },
  { name: "down", move: { x: 0, y: -1 }, direction: "down", idleFrame: 0 }
];

for (const entry of cases) {
  test(`movement ${entry.name} enters walk immediately and release returns to idle in the same facing`, () => {
    const system = new AnimationSystem();
    const animation = createPlayerAnimation();
    const sprite = { frame: 0, flipX: false };

    const moving = system.setMotion(animation, sprite, entry.move);
    assert.equal(moving, true);
    assert.equal(animation.clip, "walk");
    assert.equal(animation.direction, entry.direction);
    assert.equal(animation.playing, true);
    assert.ok(DIRECTION_FRAMES[entry.direction].includes(sprite.frame));

    system.updateAnimation(animation, 0.13);
    const movedFrame = animation.frame;
    assert.ok(DIRECTION_FRAMES[entry.direction].includes(movedFrame));

    const stopped = system.setMotion(animation, sprite, { x: 0, y: 0 });
    assert.equal(stopped, false);
    assert.equal(animation.clip, "idle");
    assert.equal(animation.direction, entry.direction, "idle must preserve the last facing");
    assert.equal(animation.playing, false);
    assert.equal(animation.index, 0);
    assert.equal(animation.elapsed, 0);
    assert.equal(sprite.frame, entry.idleFrame);
  });
}

test("rapid idle/walk direction changes never leave a stale direction or clip", () => {
  const system = new AnimationSystem();
  const animation = createPlayerAnimation();
  const sprite = { frame: 0, flipX: false };
  const sequence = [
    { move: { x: 1, y: 0 }, direction: "right" },
    { move: { x: 0, y: 0 }, direction: "right", idle: true },
    { move: { x: 0, y: 1 }, direction: "up" },
    { move: { x: 0, y: 0 }, direction: "up", idle: true },
    { move: { x: -1, y: 0 }, direction: "left" },
    { move: { x: 0, y: 0 }, direction: "left", idle: true },
    { move: { x: 0, y: -1 }, direction: "down" }
  ];

  for (const step of sequence) {
    const moving = system.setMotion(animation, sprite, step.move);
    assert.equal(animation.direction, step.direction);
    assert.equal(animation.clip, step.idle ? "idle" : "walk");
    assert.equal(animation.playing, !step.idle);
    assert.equal(moving, !step.idle);
    const validFrames = step.idle ? IDLE_FRAMES[step.direction] : DIRECTION_FRAMES[step.direction];
    assert.ok(validFrames.includes(sprite.frame));
  }
});

test("stationary ticks cannot advance a walk frame and moving ticks cannot remain idle", () => {
  const system = new AnimationSystem();
  const animation = createPlayerAnimation();
  const sprite = { frame: 0, flipX: false };
  let movingButIdleTicks = 0;
  let stationaryButWalkingTicks = 0;

  for (let tick = 0; tick < 60; tick++) {
    const moving = tick >= 10 && tick < 40;
    system.setMotion(animation, sprite, moving ? { x: 1, y: 0 } : { x: 0, y: 0 });
    if (moving && (animation.clip !== "walk" || !animation.playing)) movingButIdleTicks++;
    if (!moving && (animation.clip !== "idle" || animation.playing)) stationaryButWalkingTicks++;
    system.updateAnimation(animation, 1 / 60);
  }

  assert.equal(movingButIdleTicks, 0);
  assert.equal(stationaryButWalkingTicks, 0);
});

test("walk frame pacing remains coherent at 60 Hz fixed-step", () => {
  const system = new AnimationSystem();
  const animation = createPlayerAnimation();
  const sprite = { frame: 0, flipX: false };
  system.setMotion(animation, sprite, { x: 1, y: 0 });

  let transitions = 0;
  let previousFrame = animation.frame;
  for (let tick = 0; tick < 120; tick++) {
    system.updateAnimation(animation, 1 / 60);
    if (animation.frame !== previousFrame) {
      transitions++;
      previousFrame = animation.frame;
    }
  }

  assert.ok(transitions >= 15 && transitions <= 16, `expected about 16 transitions over 2s at 8fps, got ${transitions}`);
  assert.equal(animation.direction, "right");
  assert.equal(animation.clip, "walk");
});

test("all four production player datasets use the certified walk cadence", () => {
  const localities = [
    ["chlum", CHLUM_ENTITY_DEFINITIONS],
    ["nesmen", NESMEN_ENTITY_DEFINITIONS],
    ["besednice", BESEDNICE_ENTITY_DEFINITIONS],
    ["slavia", SLAVIA_ENTITY_DEFINITIONS]
  ];

  for (const [locality, definitions] of localities) {
    const player = definitions.find(entity => entity.id === "player")?.components;
    assert.ok(player, `${locality} must define a player`);
    const walk = player.animation.clips?.walk ?? player.animation;
    assert.equal(walk.fps, 8, `${locality} walk cadence must be 8 fps`);
    assert.equal(player.player.speed, 220, `${locality} movement speed must remain unchanged`);
    assert.deepEqual(walk.directionFrames ?? player.animation.directionFrames, DIRECTION_FRAMES, `${locality} must use the canonical 4x4 direction rows`);

    const framesPerCycle = 4;
    const distancePerCycle = player.player.speed * framesPerCycle / walk.fps;
    assert.ok(distancePerCycle <= 135, `${locality} stride cycle ${distancePerCycle} exceeds anti-sliding limit`);
  }
});
