import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_DEFINITIONS } from "../../src/data/levels.js";
import {
  LEVEL_ENVIRONMENT_LAYOUTS,
  createObstacleComponents,
  getLevelEnvironmentLayout,
  pointBlockedByObstacle,
  resolveCircleMovement
} from "../../src/data/levelLayout.js";

const PLAYER_RADIUS = 28;
const GRID_STEP = 20;

function reachableOnGrid(level, layout, target, range = 72) {
  const walkable = level.walkable ?? level.bounds;
  const minX = walkable.x + PLAYER_RADIUS;
  const maxX = walkable.x + walkable.width - PLAYER_RADIUS;
  const minY = walkable.y + PLAYER_RADIUS;
  const maxY = walkable.y + walkable.height - PLAYER_RADIUS;
  const key = (x, y) => `${x}:${y}`;
  const blocked = point => layout.obstacles.some(obstacle => pointBlockedByObstacle(point, obstacle, PLAYER_RADIUS));
  const clampGrid = value => Math.round(value / GRID_STEP) * GRID_STEP;
  const start = { x: clampGrid(level.spawn.x), y: clampGrid(level.spawn.y) };
  const queue = [start];
  const visited = new Set([key(start.x, start.y)]);

  while (queue.length) {
    const point = queue.shift();
    if (Math.hypot(point.x - target.x, point.y - target.y) <= range) return true;
    for (const [dx, dy] of [[GRID_STEP, 0], [-GRID_STEP, 0], [0, GRID_STEP], [0, -GRID_STEP]]) {
      const next = { x: point.x + dx, y: point.y + dy };
      if (next.x < minX || next.x > maxX || next.y < minY || next.y > maxY || blocked(next)) continue;
      const id = key(next.x, next.y);
      if (visited.has(id)) continue;
      visited.add(id);
      queue.push(next);
    }
  }
  return false;
}

test("each canonical level has authored props and visually explained collider-backed obstacles", () => {
  assert.deepEqual(Object.keys(LEVEL_ENVIRONMENT_LAYOUTS), ["chlum", "nesmen", "besednice", "slavia"]);
  for (const level of LEVEL_DEFINITIONS) {
    const layout = getLevelEnvironmentLayout(level.id);
    assert.ok(layout.props.length >= 12, `${level.id} needs a deliberate landmark/decoration composition`);
    assert.ok(layout.obstacles.length >= 8, `${level.id} needs authored physical blockers`);
    const visibleObstacleIds = new Set(layout.props.map(prop => prop.obstacleId).filter(Boolean));
    assert.deepEqual(
      [...layout.obstacles.map(obstacle => obstacle.id)].sort(),
      [...visibleObstacleIds].sort(),
      `${level.id} every invisible footprint must be explained by a visible prop`
    );

    for (const obstacle of layout.obstacles) {
      const components = createObstacleComponents(obstacle);
      assert.equal(components.collider.layer, "obstacle");
      assert.deepEqual(components.collider.mask, ["player"]);
      assert.equal(pointBlockedByObstacle(level.spawn, obstacle), false, `${level.id} spawn is blocked by ${obstacle.id}`);
      for (const target of level.targets) {
        for (const position of target.positions) {
          assert.equal(pointBlockedByObstacle(position, obstacle), false, `${level.id} target ${target.id} is blocked by ${obstacle.id}`);
        }
      }
    }
  }
});

test("all mandatory objective positions remain reachable from spawn with a mobile-safe player radius", () => {
  for (const level of LEVEL_DEFINITIONS) {
    const layout = getLevelEnvironmentLayout(level.id);
    for (const target of level.targets) {
      for (const position of target.positions) {
        assert.equal(
          reachableOnGrid(level, layout, position),
          true,
          `${level.id} target ${target.id} at ${position.x},${position.y} is not reachable`
        );
      }
    }
  }
});

test("circle movement stops at visible obstacle edges and still slides around corners", () => {
  const obstacle = { x: 100, y: 100, width: 80, height: 80 };
  const stopped = resolveCircleMovement({
    position: { x: 40, y: 140 }, movement: { x: 200, y: 0 }, radius: 20,
    walkable: { x: 0, y: 0, width: 400, height: 400 }, obstacles: [obstacle]
  });
  assert.deepEqual(stopped, { x: 80, y: 140 });

  const around = resolveCircleMovement({
    position: { x: 70, y: 70 }, movement: { x: 0, y: 40 }, radius: 20,
    walkable: { x: 0, y: 0, width: 400, height: 400 }, obstacles: [obstacle]
  });
  assert.deepEqual(around, { x: 70, y: 110 });

  const diagonal = resolveCircleMovement({
    position: { x: 70, y: 70 }, movement: { x: 80, y: 80 }, radius: 20,
    walkable: { x: 0, y: 0, width: 400, height: 400 }, obstacles: [obstacle]
  });
  assert.deepEqual(diagonal, { x: 150, y: 80 });

  const escaped = resolveCircleMovement({
    position: diagonal, movement: { x: 0, y: -50 }, radius: 20,
    walkable: { x: 0, y: 0, width: 400, height: 400 }, obstacles: [obstacle]
  });
  assert.ok(escaped.y < diagonal.y, "player must be able to slide away from a collider corner");
});
