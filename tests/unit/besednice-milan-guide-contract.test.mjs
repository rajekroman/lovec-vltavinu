import test from "node:test";
import assert from "node:assert/strict";

import { NPC_SPRITES } from "../../src/render/SpriteAtlas.js";

test("guide_milan asset exists and is distinct from rival_karel", () => {
  const milan = NPC_SPRITES.guide_milan;
  const karel = NPC_SPRITES.rival_karel;

  assert(milan, "guide_milan must exist in NPC_SPRITES");
  assert(karel, "rival_karel must still exist in NPC_SPRITES");
  assert.notStrictEqual(milan.assetId, karel.assetId, "Milan and Karel must have different asset IDs");
  assert.equal(milan.assetId, "npc-guide-milan-atlas");
  assert.equal(karel.assetId, "npc-rival-karel-atlas");
});

test("guide_milan atlas meets contract: 600×160, 5 frames @ 120×160", () => {
  const milan = NPC_SPRITES.guide_milan;

  assert.equal(milan.width, 120, "frame width must be 120px");
  assert.equal(milan.height, 160, "frame height must be 160px");
  assert.equal(Object.keys(milan.frames).length, 5, "must have exactly 5 frame keys");
  assert.deepEqual(Object.keys(milan.frames), [
    "neutral",
    "talking",
    "concerned",
    "welcoming",
    "pointing"
  ]);
});

test("guide_milan frameBounds exist and apply to all 5 frames", () => {
  const milan = NPC_SPRITES.guide_milan;

  assert(Array.isArray(milan.frameBounds), "frameBounds must be an array");
  assert.equal(milan.frameBounds.length, 5, "frameBounds must have 5 entries");

  // Verify structure
  for (let i = 0; i < 5; i++) {
    const bound = milan.frameBounds[i];
    assert(bound, `frameBounds[${i}] must exist`);
    assert.equal(bound.slot, i, `frameBounds[${i}].slot must equal ${i}`);
    assert(Number.isInteger(bound.x0), `frameBounds[${i}].x0 must be integer`);
    assert(Number.isInteger(bound.x1), `frameBounds[${i}].x1 must be integer`);
    assert(bound.x0 >= 0, `frameBounds[${i}].x0 must be >= 0`);
    assert(bound.x1 > bound.x0, `frameBounds[${i}].x1 must be > x0`);
    assert(bound.x1 <= 600, `frameBounds[${i}].x1 must be <= atlas width 600`);
  }
});

test("guide_milan animations include talk and action sequences", () => {
  const milan = NPC_SPRITES.guide_milan;

  assert(milan.animations.idle, "must have idle animation");
  assert(milan.animations.talk, "must have talk animation");
  assert(milan.animations.react_concerned, "must have react_concerned animation");
  assert(milan.animations.react_welcoming, "must have react_welcoming animation");
  assert(milan.animations.action_point, "must have action_point animation");

  assert.equal(milan.animations.idle.frames.length, 1, "idle must have ≥1 frame");
  assert.equal(milan.animations.talk.frames.length, 4, "talk must have ≥1 frame");
  assert.equal(milan.animations.action_point.frames.length, 3, "action_point must have ≥1 frame");
});

test("rival_karel remains unchanged in NPC_SPRITES", () => {
  const karel = NPC_SPRITES.rival_karel;

  assert.equal(karel.name, "Karel (Rival)");
  assert.equal(karel.assetId, "npc-rival-karel-atlas");
  assert.equal(karel.width, 120);
  assert.equal(karel.height, 160);
  assert(!karel.frameBounds, "Karel must NOT have frameBounds (standard grid)");
  assert.deepEqual(Object.keys(karel.frames), [
    "neutral",
    "aggressive",
    "smug",
    "warning",
    "backing_away"
  ]);
});
