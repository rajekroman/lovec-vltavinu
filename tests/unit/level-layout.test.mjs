import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_DEFINITIONS } from "../../src/data/levels.js";
import {
  LEVEL_ENVIRONMENT_LAYOUTS,
  createObstacleComponents,
  getLevelEnvironmentLayout,
  resolveCircleMovement
} from "../../src/data/levelLayout.js";

const pointInside = (point, obstacle, radius = 28) => (
  point.x > obstacle.x - radius && point.x < obstacle.x + obstacle.width + radius &&
  point.y > obstacle.y - radius && point.y < obstacle.y + obstacle.height + radius
);

test("each canonical level has authored props and collider-backed obstacles", () => {
  assert.deepEqual(Object.keys(LEVEL_ENVIRONMENT_LAYOUTS), ["chlum", "nesmen", "besednice", "slavia"]);
  for (const level of LEVEL_DEFINITIONS) {
    const layout = getLevelEnvironmentLayout(level.id);
    assert.ok(layout.props.length >= 8, `${level.id} needs several recognizable landmarks`);
    assert.ok(layout.obstacles.length >= 4, `${level.id} needs physical environment bounds`);
    for (const obstacle of layout.obstacles) {
      const components = createObstacleComponents(obstacle);
      assert.equal(components.collider.layer, "obstacle");
      assert.deepEqual(components.collider.mask, ["player"]);
      assert.equal(pointInside(level.spawn, obstacle), false, `${level.id} spawn is blocked by ${obstacle.id}`);
      for (const target of level.targets) {
        for (const position of target.positions) assert.equal(pointInside(position, obstacle), false, `${level.id} target ${target.id} is blocked by ${obstacle.id}`);
      }
    }
  }
});

test("circle movement stops at visible obstacle edges and preserves a route around them", () => {
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
});
