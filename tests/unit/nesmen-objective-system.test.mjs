import test from "node:test";
import assert from "node:assert/strict";
import { EventBus } from "../../src/core/EventBus.js";
import { EVENT_CONTRACTS, validateEventPayload } from "../../src/core/GameEvents.js";
import { createGameSession } from "../../src/gameplay/GameSession.js";
import { ObjectiveSystem } from "../../src/gameplay/ObjectiveSystem.js";
import { createNesmenFinding } from "../../src/data/nesmen.js";

const strictEvents = () => new EventBus({ contracts: EVENT_CONTRACTS, validatePayload: validateEventPayload });

test("Nesměň ObjectiveSystem requires permission, three dug and filled profiles, and three findings", () => {
  const events = strictEvents();
  const progress = [];
  const completed = [];
  const levels = [];
  const findings = [];
  events.on("objective:progress", payload => progress.push(payload));
  events.on("objective:complete", payload => completed.push(payload));
  events.on("level:complete", payload => levels.push(payload));
  events.on("finding:collected", payload => findings.push(payload));

  const session = createGameSession();
  session.enterLevel("nesmen");
  const objective = new ObjectiveSystem({ events, session, levelId: "nesmen" });

  assert.equal(objective.update({ dug: 3, filled: 3 }).complete, false);
  assert.equal(objective.grantPermission(), true);
  assert.equal(objective.grantPermission(), false);
  assert.equal(session.state.flags.nesmenPermission, true);

  const withoutFinding = objective.update({ dug: 3, filled: 3 });
  assert.equal(withoutFinding.complete, false);
  assert.equal(withoutFinding.text, "Nálezy 0/3");

  const first = createNesmenFinding("nesmen-standard", "nesmen-finding-1");
  const second = createNesmenFinding("nesmen-standard", "nesmen-finding-2");
  const third = createNesmenFinding("nesmen-standard", "nesmen-finding-3");

  objective.recordFinding(first);
  assert.equal(objective.update({ dug: 3, filled: 3 }).complete, false);
  assert.equal(objective.update({ dug: 3, filled: 3 }).text, "Nálezy 1/3");

  objective.recordFinding(second);
  assert.equal(objective.update({ dug: 3, filled: 3 }).complete, false);
  assert.equal(objective.update({ dug: 3, filled: 3 }).text, "Nálezy 2/3");

  objective.recordFinding(third);
  const result = objective.update({ dug: 3, filled: 3 });
  objective.update({ dug: 3, filled: 3 });

  assert.equal(result.complete, true);
  assert.equal(session.state.findings.length, 3);
  assert.equal(session.state.score, 360);
  assert.deepEqual(session.state.objective, {
    id: "nesmen-dig-and-restore",
    current: 3,
    required: 3,
    complete: true
  });
  assert.deepEqual(progress.at(-1), {
    id: "nesmen-dig-and-restore",
    current: 3,
    required: 3
  });
  assert.deepEqual(findings.map(finding => finding.findingId), [
    "nesmen-finding-1",
    "nesmen-finding-2",
    "nesmen-finding-3"
  ]);
  assert.deepEqual(completed, [{ id: "nesmen-dig-and-restore", levelId: "nesmen" }]);
  assert.deepEqual(levels, [{ levelId: "nesmen", nextLevelId: "besednice", score: 360 }]);
  assert.throws(() => objective.recordFinding(first), /already recorded/);
});
