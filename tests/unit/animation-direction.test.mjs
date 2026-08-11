import assert from "node:assert/strict";
import test from "node:test";
import {
  AnimationSystem,
  resolveCardinalDirection,
  resolveEightWayDirection,
  setAnimationClip
} from "../../src/systems/AnimationSystem.js";

test("cardinal resolver preserves legacy four-direction behavior", () => {
  assert.equal(resolveCardinalDirection(1, 0), "right");
  assert.equal(resolveCardinalDirection(-1, 0), "left");
  assert.equal(resolveCardinalDirection(0, 1), "up");
  assert.equal(resolveCardinalDirection(0, -1), "down");
});

test("eight-way resolver selects diagonals for balanced movement", () => {
  assert.equal(resolveEightWayDirection(1, 1), "upRight");
  assert.equal(resolveEightWayDirection(-1, 1), "upLeft");
  assert.equal(resolveEightWayDirection(1, -1), "downRight");
  assert.equal(resolveEightWayDirection(-1, -1), "downLeft");
});

test("eight-way resolver keeps strongly axial movement cardinal", () => {
  assert.equal(resolveEightWayDirection(1, 0.1), "right");
  assert.equal(resolveEightWayDirection(-0.1, 1), "up");
  assert.equal(resolveEightWayDirection(0.1, -1), "down");
});

test("motion animation uses diagonal frames when the asset provides them", () => {
  const system = new AnimationSystem();
  const animation = {
    clip: "walk",
    frames: [0, 1],
    fps: 8,
    loop: true,
    playing: false,
    index: 0,
    elapsed: 0,
    completed: false,
    frame: 0,
    direction: "down",
    directionFrames: {
      down: [0, 1],
      right: [2, 3],
      upRight: [4, 5]
    }
  };
  const sprite = { frame: 0, flipX: false };

  system.setMotion(animation, sprite, { x: 1, y: 1 });

  assert.equal(animation.direction, "upRight");
  assert.deepEqual(animation.frames, [4, 5]);
  assert.equal(animation.playing, true);
});

test("four-direction sheets remain valid when a diagonal is requested", () => {
  const system = new AnimationSystem();
  const animation = {
    clip: "walk",
    frames: [0, 1],
    fps: 8,
    loop: true,
    playing: false,
    index: 0,
    elapsed: 0,
    completed: false,
    frame: 0,
    direction: "down",
    directionFrames: {
      down: [0, 1],
      left: [2, 3],
      right: [4, 5],
      up: [6, 7]
    }
  };
  const sprite = { frame: 0, flipX: false };

  system.setMotion(animation, sprite, { x: 1, y: 1 });

  assert.equal(animation.direction, "up");
  assert.deepEqual(animation.frames, [6, 7]);
});

test("clip registry switches between directional walk and idle poses", () => {
  const system = new AnimationSystem();
  const animation = {
    clip: "idle",
    frames: [0],
    fps: 1,
    loop: true,
    playing: false,
    index: 0,
    elapsed: 0,
    completed: false,
    frame: 0,
    direction: "down",
    directionFrames: { down: [0], right: [8] },
    motionClip: "walk",
    idleClip: "idle",
    clips: {
      idle: {
        frames: [0],
        fps: 1,
        loop: true,
        directionFrames: { down: [0], right: [8] }
      },
      walk: {
        frames: [0, 1, 2, 3],
        fps: 6,
        loop: true,
        directionFrames: { down: [0, 1, 2, 3], right: [8, 9, 10, 11] }
      }
    }
  };
  const sprite = { frame: 0, flipX: false };

  system.setMotion(animation, sprite, { x: 1, y: 0 });
  assert.equal(animation.clip, "walk");
  assert.equal(animation.direction, "right");
  assert.deepEqual(animation.frames, [8, 9, 10, 11]);
  assert.equal(animation.playing, true);

  system.setMotion(animation, sprite, { x: 0, y: 0 });
  assert.equal(animation.clip, "idle");
  assert.equal(animation.direction, "right");
  assert.deepEqual(animation.frames, [8]);
  assert.equal(animation.frame, 8);
  assert.equal(animation.playing, false);
});

test("unknown optional clip leaves the current animation untouched", () => {
  const animation = {
    clip: "idle",
    frames: [0],
    fps: 1,
    loop: true,
    playing: false,
    index: 0,
    elapsed: 0,
    completed: false,
    frame: 0,
    clips: { idle: { frames: [0], fps: 1, loop: true } }
  };

  assert.equal(setAnimationClip(animation, "search"), false);
  assert.equal(animation.clip, "idle");
  assert.deepEqual(animation.frames, [0]);
});
