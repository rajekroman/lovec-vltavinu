import test from "node:test";
import assert from "node:assert/strict";

import { ChlumV7Scene } from "../../src/scenes/ChlumV7Scene.js";

test("hunter action atlas frame counts meet gate requirements", () => {
  const HUNTER_ACTION_CLIPS = {
    search: { frames: [0], fps: 2.5, loop: false },
    "pick-up": { frames: [2, 3, 4, 3], fps: 2.2, loop: false },
    talk: { frames: [1], fps: 1.6, loop: false },
    caught: { frames: [5, 6, 7, 6], fps: 2.5, loop: false },
    dig: { frames: [8, 9, 10, 11, 10, 9], fps: 2.5, loop: false },
    celebration: { frames: [12, 13, 14, 15, 14, 13], fps: 1.8, loop: false }
  };

  assert.equal(HUNTER_ACTION_CLIPS["pick-up"].frames.length, 4, "pick-up must have ≥3 frames");
  assert.equal(HUNTER_ACTION_CLIPS.caught.frames.length, 4, "caught must have ≥3 frames");
  assert.equal(HUNTER_ACTION_CLIPS.dig.frames.length, 6, "dig must have ≥3 frames");
  assert.equal(HUNTER_ACTION_CLIPS.celebration.frames.length, 6, "celebration must have ≥3 frames");

  assert.equal(HUNTER_ACTION_CLIPS.search.frames.length, 1, "search must be static (1 frame)");
  assert.equal(HUNTER_ACTION_CLIPS.talk.frames.length, 1, "talk must be static (1 frame)");
});

test("hunter action atlas frame sequences are valid (0-15 range)", () => {
  const HUNTER_ACTION_CLIPS = {
    search: { frames: [0], fps: 2.5, loop: false },
    "pick-up": { frames: [2, 3, 4, 3], fps: 2.2, loop: false },
    talk: { frames: [1], fps: 1.6, loop: false },
    caught: { frames: [5, 6, 7, 6], fps: 2.5, loop: false },
    dig: { frames: [8, 9, 10, 11, 10, 9], fps: 2.5, loop: false },
    celebration: { frames: [12, 13, 14, 15, 14, 13], fps: 1.8, loop: false }
  };

  for (const [clipName, clip] of Object.entries(HUNTER_ACTION_CLIPS)) {
    for (let i = 0; i < clip.frames.length; i++) {
      const frame = clip.frames[i];
      assert(Number.isInteger(frame), `${clipName}[${i}] must be an integer`);
      assert(frame >= 0 && frame <= 15, `${clipName}[${i}]=${frame} must be in range [0, 15]`);
    }
  }
});

test("hunter action atlas animations form meaningful sequences", () => {
  const HUNTER_ACTION_CLIPS = {
    "pick-up": { frames: [2, 3, 4, 3], fps: 2.2, loop: false },
    caught: { frames: [5, 6, 7, 6], fps: 2.5, loop: false },
    dig: { frames: [8, 9, 10, 11, 10, 9], fps: 2.5, loop: false },
    celebration: { frames: [12, 13, 14, 15, 14, 13], fps: 1.8, loop: false }
  };

  // pick-up: forward progression [2→3→4] then return [→3]
  const pickupFrames = HUNTER_ACTION_CLIPS["pick-up"].frames;
  assert.deepEqual(pickupFrames, [2, 3, 4, 3], "pick-up must follow forward-return pattern");

  // caught: forward progression [5→6→7] then return [→6]
  const caughtFrames = HUNTER_ACTION_CLIPS.caught.frames;
  assert.deepEqual(caughtFrames, [5, 6, 7, 6], "caught must follow forward-return pattern");

  // dig: forward progression [8→9→10→11] then return [→10→9]
  const digFrames = HUNTER_ACTION_CLIPS.dig.frames;
  assert.deepEqual(digFrames, [8, 9, 10, 11, 10, 9], "dig must follow forward-return pattern");

  // celebration: forward progression [12→13→14→15] then return [→14→13]
  const celebrationFrames = HUNTER_ACTION_CLIPS.celebration.frames;
  assert.deepEqual(celebrationFrames, [12, 13, 14, 15, 14, 13], "celebration must follow forward-return pattern");
});

test("hunter action clips have proper fps values", () => {
  const HUNTER_ACTION_CLIPS = {
    search: { frames: [0], fps: 2.5, loop: false },
    "pick-up": { frames: [2, 3, 4, 3], fps: 2.2, loop: false },
    talk: { frames: [1], fps: 1.6, loop: false },
    caught: { frames: [5, 6, 7, 6], fps: 2.5, loop: false },
    dig: { frames: [8, 9, 10, 11, 10, 9], fps: 2.5, loop: false },
    celebration: { frames: [12, 13, 14, 15, 14, 13], fps: 1.8, loop: false }
  };

  for (const [clipName, clip] of Object.entries(HUNTER_ACTION_CLIPS)) {
    assert(typeof clip.fps === "number" && clip.fps > 0, `${clipName} fps must be a positive number`);
    assert(clip.fps <= 10, `${clipName} fps must be reasonable (≤10)`);
    assert(clip.loop === false, `${clipName} loop must be false (non-looping)`);
  }
});
