import test from "node:test";
import assert from "node:assert/strict";
import {
  EVENT_CONTRACTS,
  GAME_EVENT_NAMES,
  EventBus,
  GameApp,
  createGameSession,
  evaluateObjective,
  validateEventPayload
} from "../../src/index.js";

test("event catalog matches the architecture contract", () => {
  assert.equal(GAME_EVENT_NAMES.length, 33);
  assert.ok(GAME_EVENT_NAMES.includes("finding:collected"));
  assert.ok(GAME_EVENT_NAMES.includes("hud:model:changed"));
});

test("strict EventBus rejects unknown events and invalid payload fields", () => {
  const events = new EventBus({
    contracts: EVENT_CONTRACTS,
    strict: true,
    validatePayload: validateEventPayload
  });

  assert.throws(() => events.emit("unknown:event", {}), /Unknown event type/);
  assert.throws(
    () => events.emit("app:boot:start", { initialScene: "title", context: {} }),
    /Unexpected payload field/
  );
  assert.throws(
    () => events.emit("finding:collected", { id: "legacy-id", locality: "chlum", rarity: "B", weight: 1, score: 10 }),
    /Unexpected payload field|Missing payload field/
  );
  assert.doesNotThrow(() => events.emit("finding:collected", {
    findingId: "finding-1",
    locality: "chlum",
    rarity: "B",
    weight: 1,
    score: 10
  }));
});

test("bootstrap integration uses canonical GameSession and objective evaluator", () => {
  const session = createGameSession();
  session.enterLevel("chlum");
  session.recordFinding({
    findingId: "finding-1",
    locality: "chlum",
    rarity: "B",
    weight: 2.4,
    score: 120
  });

  assert.equal(session.state.findings[0].findingId, "finding-1");
  assert.equal(session.state.score, 120);
  const objective = evaluateObjective("chlum", { permit: true, digHits: 3, findings: 1 });
  assert.equal(objective.complete, true);
});

test("GameApp invokes fixed-step scene phases in contract order", async () => {
  const calls = [];
  const app = new GameApp();
  app.scenes.register("pipeline", {
    beginFixed: () => calls.push("beginFixed"),
    updateControl: () => calls.push("updateControl"),
    updateMovement: () => calls.push("updateMovement"),
    updateCollisions: () => calls.push("updateCollisions"),
    updateGameplay: () => calls.push("updateGameplay"),
    updateObjectives: () => calls.push("updateObjectives"),
    updateAnimations: () => calls.push("updateAnimations"),
    updateLifetime: () => calls.push("updateLifetime"),
    updateHud: () => calls.push("updateHud")
  });

  await app.boot("pipeline");
  app.loop.advance(1 / 60);
  assert.deepEqual(calls, [
    "beginFixed",
    "updateControl",
    "updateMovement",
    "updateCollisions",
    "updateGameplay",
    "updateObjectives",
    "updateAnimations",
    "updateLifetime",
    "updateHud"
  ]);
  await app.dispose();
});
