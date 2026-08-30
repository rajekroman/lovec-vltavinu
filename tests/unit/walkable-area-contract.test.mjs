import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { LEVEL_DEFINITIONS } from "../../src/data/levels.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const inside = (point, area) => (
  point.x >= area.x && point.x <= area.x + area.width &&
  point.y >= area.y && point.y <= area.y + area.height
);

function movementBlock(source, scene) {
  const start = source.indexOf("  updateMovement(");
  const end = source.indexOf("  updateCollisions(", start);
  assert.ok(start >= 0 && end > start, `${scene} must expose updateMovement before updateCollisions`);
  return source.slice(start, end);
}

test("every spawn and mandatory target stays inside its environment-specific walkable area", () => {
  for (const level of LEVEL_DEFINITIONS) {
    assert.ok(level.walkable, `${level.id} must define walkable bounds`);
    assert.ok(inside(level.spawn, level.walkable), `${level.id} spawn`);
    for (const target of level.targets) {
      for (const position of target.positions) {
        assert.ok(inside(position, level.walkable), `${level.id}:${target.id}`);
      }
    }
  }
});

test("GameApp owns canonical walkability resolution after exactly one scene movement integration", () => {
  const source = fs.readFileSync(path.join(root, "src/core/GameApp.js"), "utf8");
  assert.match(source, /resolveSceneWalkability\(scene\)/);
  assert.match(source, /resolveWalkablePosition\(scene\.level, previous, desired, clearance\)/);
  assert.match(source, /const desired = \{ x: transform\.x, y: transform\.y \}/);
  assert.match(source, /if \(name === "updateMovement"\) this\.resolveSceneWalkability\(scene\)/);
  assert.match(source, /scene\.setCameraToPlayer\?\.\(\)/);
  assert.doesNotMatch(source, /previous\.x \+ .*speed \* dt/);
  assert.doesNotMatch(source, /previous\.y \+ .*speed \* dt/);
});

test("production scenes integrate player input once without local bounds or movement camera authority", () => {
  for (const scene of ["ChlumScene.js", "NesmenScene.js", "BesedniceScene.js", "SlaviaScene.js"]) {
    const source = fs.readFileSync(path.join(root, "src/scenes", scene), "utf8");
    const movement = movementBlock(source, scene);
    assert.doesNotMatch(source, /resolveWalkablePosition/);
    assert.doesNotMatch(source, /from ["']\.\.\/gameplay\/Walkability\.js["']/);
    assert.match(movement, /\.x \+= \(move\.x \?\? 0\) \* speed \* dt/);
    assert.match(movement, /\.y \+= \(move\.y \?\? 0\) \* speed \* dt/);
    assert.doesNotMatch(movement, /walkable/);
    assert.doesNotMatch(movement, /clamp\(/);
    assert.doesNotMatch(movement, /setCameraToPlayer/);
  }
});

test("Slavia walkable area keeps the player out of the river", () => {
  const slavia = LEVEL_DEFINITIONS.find(level => level.id === "slavia");
  assert.ok(slavia.walkable.x >= 340);
  assert.ok(slavia.spawn.x >= slavia.walkable.x);
  assert.ok(slavia.targets.every(target => target.positions.every(position => inside(position, slavia.walkable))));
});
