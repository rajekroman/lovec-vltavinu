import test from "node:test";
import assert from "node:assert/strict";
import { LEVEL_DEFINITIONS } from "../../src/data/levels.js";
import { isWalkablePoint } from "../../src/gameplay/Walkability.js";

const CLEARANCE = 18;
const STEP = 40;
const MAX_VISITED = 6000;
const keyOf = point => `${Math.round(point.x)},${Math.round(point.y)}`;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function edgeIsWalkable(level, from, to) {
  for (let sample = 1; sample <= 4; sample++) {
    const t = sample / 4;
    const point = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t
    };
    if (!isWalkablePoint(level, point, CLEARANCE)) return false;
  }
  return true;
}

function canReach(level, target) {
  if (!isWalkablePoint(level, level.spawn, CLEARANCE)) return false;
  if (!isWalkablePoint(level, target, CLEARANCE)) return false;

  const queue = [{ ...level.spawn }];
  const visited = new Set([keyOf(level.spawn)]);
  let cursor = 0;

  while (cursor < queue.length && visited.size <= MAX_VISITED) {
    const current = queue[cursor++];
    if (distance(current, target) <= STEP * 1.25 && edgeIsWalkable(level, current, target)) return true;

    for (const [dx, dy] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = keyOf(next);
      if (visited.has(key)) continue;
      if (!isWalkablePoint(level, next, CLEARANCE)) continue;
      if (!edgeIsWalkable(level, current, next)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  return false;
}

test("every mandatory level target has a real walkable path from spawn", () => {
  for (const level of LEVEL_DEFINITIONS) {
    assert.equal(isWalkablePoint(level, level.spawn, CLEARANCE), true, `${level.id} spawn must be walkable`);
    for (const target of level.targets) {
      for (const [index, position] of target.positions.entries()) {
        assert.equal(
          canReach(level, position),
          true,
          `${level.id}:${target.id}[${index}] must have a walkable path from spawn`
        );
      }
    }
  }
});
