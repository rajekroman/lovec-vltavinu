import test from "node:test";
import assert from "node:assert/strict";
import { isBlockedByZone, isWalkablePoint, resolveWalkablePosition } from "../../src/gameplay/Walkability.js";

const level = {
  walkable: { x: 0, y: 0, width: 400, height: 300 },
  blockedZones: [
    { id: "shed", shape: "rect", x: 80, y: 40, width: 120, height: 80 },
    { id: "tree", shape: "circle", x: 300, y: 200, radius: 24 },
    {
      id: "cliff",
      shape: "polygon",
      points: [
        { x: 220, y: 20 },
        { x: 360, y: 20 },
        { x: 360, y: 80 },
        { x: 250, y: 100 }
      ]
    }
  ]
};

test("rect, circle and polygon blocked zones reject points", () => {
  assert.equal(isBlockedByZone({ x: 100, y: 60 }, level.blockedZones[0]), true);
  assert.equal(isBlockedByZone({ x: 300, y: 200 }, level.blockedZones[1]), true);
  assert.equal(isBlockedByZone({ x: 300, y: 50 }, level.blockedZones[2]), true);
  assert.equal(isBlockedByZone({ x: 40, y: 180 }, level.blockedZones[0]), false);
});

test("player clearance expands obstacles and insets outer walkable bounds", () => {
  assert.equal(isWalkablePoint(level, { x: 65, y: 60 }, 16), false, "rectangle clearance should block near edge");
  assert.equal(isWalkablePoint(level, { x: 258, y: 200 }, 16), true, "point outside expanded circle remains walkable");
  assert.equal(isWalkablePoint(level, { x: 8, y: 150 }, 16), false, "outer bounds respect player clearance");
  assert.equal(isWalkablePoint(level, { x: 40, y: 180 }, 16), true);
});

test("resolveWalkablePosition accepts a direct free move", () => {
  assert.deepEqual(
    resolveWalkablePosition(level, { x: 40, y: 180 }, { x: 60, y: 190 }, 12),
    { x: 60, y: 190 }
  );
});

test("resolveWalkablePosition slides along a blocked obstacle edge", () => {
  const from = { x: 60, y: 140 };
  const resolved = resolveWalkablePosition(level, from, { x: 110, y: 100 }, 12);
  assert.deepEqual(resolved, { x: 110, y: 140 });
  assert.equal(isWalkablePoint(level, resolved, 12), true);
});

test("resolveWalkablePosition keeps the previous position if both axes are blocked", () => {
  const cornerLevel = {
    walkable: { x: 0, y: 0, width: 240, height: 240 },
    blockedZones: [
      { shape: "rect", x: 80, y: 0, width: 80, height: 240 },
      { shape: "rect", x: 0, y: 80, width: 240, height: 80 }
    ]
  };
  const from = { x: 40, y: 40 };
  assert.deepEqual(resolveWalkablePosition(cornerLevel, from, { x: 120, y: 120 }, 10), from);
});

test("polygon clearance blocks points close to an edge", () => {
  const polygon = {
    shape: "polygon",
    points: [
      { x: 100, y: 100 },
      { x: 180, y: 100 },
      { x: 180, y: 180 },
      { x: 100, y: 180 }
    ]
  };
  assert.equal(isBlockedByZone({ x: 92, y: 140 }, polygon, 10), true);
  assert.equal(isBlockedByZone({ x: 80, y: 140 }, polygon, 10), false);
});
