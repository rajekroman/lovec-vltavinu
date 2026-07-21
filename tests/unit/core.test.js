import test from "node:test";
import assert from "node:assert/strict";

import { EventBus } from "../../src/core/EventBus.js";
import { GameLoop } from "../../src/core/GameLoop.js";
import { SceneManager } from "../../src/core/SceneManager.js";
import { World } from "../../src/ecs/World.js";
import { CollisionSystem } from "../../src/systems/CollisionSystem.js";
import { AnimationSystem, createAnimation } from "../../src/systems/AnimationSystem.js";

test("EventBus supports once listeners and abort-driven cleanup", () => {
  const events = new EventBus();
  const controller = new AbortController();
  const received = [];

  events.once("stone:found", value => received.push(value));
  events.on("stone:found", value => received.push(value * 10), { signal: controller.signal });

  assert.equal(events.emit("stone:found", 2), 2);
  assert.equal(events.emit("stone:found", 3), 1);
  controller.abort();
  assert.equal(events.emit("stone:found", 4), 0);
  assert.deepEqual(received, [2, 20, 30]);
  assert.equal(events.listenerCount("stone:found"), 0);
});

test("GameLoop runs fixed steps in priority order and limits catch-up", () => {
  const updates = [];
  const rendered = [];
  const loop = new GameLoop({ fixedStep: 0.01, maxFrameDelta: 0.1, maxSubSteps: 3 });

  loop.addSystem(() => updates.push("late"), 20);
  loop.addSystem(() => updates.push("early"), -10);
  loop.addRenderer((alpha, metrics) => rendered.push({ alpha, steps: metrics.steps }));

  const first = loop.advance(0.025);
  assert.equal(first.steps, 2);
  assert.deepEqual(updates, ["early", "late", "early", "late"]);
  assert.equal(rendered.at(-1).steps, 2);
  assert.ok(first.alpha > 0 && first.alpha < 1);

  updates.length = 0;
  const overloaded = loop.advance(0.1);
  assert.equal(overloaded.steps, 3);
  assert.equal(updates.length, 6);
  assert.ok(overloaded.droppedTime > 0);
});

test("SceneManager rolls back to the previous scene when enter fails", async () => {
  const calls = [];
  const manager = new SceneManager();
  const field = {
    async enter(payload) { calls.push(["field:enter", payload.context]); },
    async exit(payload) { calls.push(["field:exit", payload.context]); }
  };
  const forest = {
    async enter() {
      calls.push(["forest:enter"]);
      throw new Error("asset failed");
    },
    async exit(payload) { calls.push(["forest:exit", payload.context]); }
  };

  manager.register("field", field);
  manager.register("forest", forest);
  await manager.transitionTo("field", { initial: true });

  await assert.rejects(manager.transitionTo("forest"), /asset failed/);
  assert.equal(manager.activeId, "field");
  assert.equal(manager.activeScene, field);
  assert.equal(manager.transitioning, false);
  assert.deepEqual(calls.map(([name]) => name), [
    "field:enter",
    "field:exit",
    "forest:enter",
    "forest:exit",
    "field:enter"
  ]);
  assert.equal(calls.at(-1)[1].rollback, true);
});

test("World queries only entities that own every requested component", () => {
  const world = new World();
  const player = world.createEntity({
    transform: { x: 10, y: 20 },
    velocity: { x: 1, y: 0 },
    tag: "player"
  });
  world.createEntity({ transform: { x: 30, y: 40 }, tag: "npc" });

  const moving = [...world.query("transform", "velocity")];
  assert.equal(moving.length, 1);
  assert.equal(moving[0][0], player);
  assert.deepEqual(moving[0][1], { x: 10, y: 20 });
  assert.equal(world.count("transform"), 2);

  world.patch(player, "transform", { x: 12 });
  assert.equal(world.get(player, "transform").x, 12);
  assert.equal(world.destroyEntity(player), true);
  assert.equal(world.count(), 1);
});

test("CollisionSystem emits enter, stay and exit phases", () => {
  const events = new EventBus();
  const phases = [];
  for (const phase of ["enter", "stay", "exit"]) {
    events.on(`collision:${phase}`, collision => phases.push([phase, collision.key]));
  }

  const world = new World();
  const a = world.createEntity({
    transform: { x: 0, y: 0 },
    collider: { shape: "circle", radius: 10 }
  });
  const b = world.createEntity({
    transform: { x: 15, y: 0 },
    collider: { shape: "circle", radius: 10 }
  });
  const collisions = new CollisionSystem({ events, cellSize: 32 });

  assert.equal(collisions.update(world)[0].phase, "enter");
  assert.equal(collisions.update(world)[0].phase, "stay");
  world.patch(b, "transform", { x: 100 });
  assert.equal(collisions.update(world).length, 0);

  assert.deepEqual(phases, [
    ["enter", `${a}:${b}`],
    ["stay", `${a}:${b}`],
    ["exit", `${a}:${b}`]
  ]);
});

test("AnimationSystem completes a non-looping animation on its last frame", () => {
  const events = new EventBus();
  let completed = 0;
  events.on("animation:complete", () => completed++);

  const animation = createAnimation({ frames: ["idle-0", "idle-1", "idle-2"], fps: 10, loop: false });
  const system = new AnimationSystem({ events });
  const changed = system.updateAnimation(animation, 0.35, 7);

  assert.equal(changed, true);
  assert.equal(animation.frame, "idle-2");
  assert.equal(animation.index, 2);
  assert.equal(animation.playing, false);
  assert.equal(animation.completed, true);
  assert.equal(completed, 1);
});
