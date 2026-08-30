import test from "node:test";
import assert from "node:assert/strict";
import { createGameSession } from "../../src/gameplay/GameSession.js";
import { evaluateObjective } from "../../src/gameplay/Objectives.js";
import {
  NESMEN_ENTITY_DEFINITIONS,
  NESMEN_FINDING_VARIANTS,
  NESMEN_PROFILE_IDS,
  createNesmenFinding,
  getNesmenEntityDefinition
} from "../../src/data/nesmen.js";

const EXPECTED_PROFILE_IDS = ["nesmen-profile-1", "nesmen-profile-2", "nesmen-profile-3"];

test("Nesměň level keeps the canonical three-profile progression contract", () => {
  assert.deepEqual(NESMEN_PROFILE_IDS, EXPECTED_PROFILE_IDS);
  assert.equal(NESMEN_PROFILE_IDS.length, 3);
  assert.equal(new Set(NESMEN_PROFILE_IDS).size, 3);
});

test("Nesměň entity data contains one player, one forester and exactly three disabled profiles", () => {
  const players = NESMEN_ENTITY_DEFINITIONS.filter(entity => entity.kind === "player");
  const foresters = NESMEN_ENTITY_DEFINITIONS.filter(entity => entity.kind === "npc");
  const profiles = NESMEN_ENTITY_DEFINITIONS.filter(entity => entity.kind === "dig-spot");

  assert.equal(players.length, 1);
  assert.equal(foresters.length, 1);
  assert.equal(profiles.length, 3);
  assert.deepEqual(profiles.map(profile => profile.id), EXPECTED_PROFILE_IDS);
  assert.equal(profiles.every(profile => profile.components.digSpot.enabled === false), true);
});

test("all Nesměň transforms are reachable inside canonical level bounds", () => {
  for (const entity of NESMEN_ENTITY_DEFINITIONS) {
    assert.ok(Number.isFinite(entity.position.x));
    assert.ok(Number.isFinite(entity.position.y));
    assert.ok(entity.position.x >= 0 && entity.position.x <= 1600, `${entity.id} x=${entity.position.x}`);
    assert.ok(entity.position.y >= 0 && entity.position.y <= 1200, `${entity.id} y=${entity.position.y}`);
  }
});

test("Nesměň permission dialogue and finding payload obey session-only contracts", () => {
  const forester = NESMEN_ENTITY_DEFINITIONS.find(entity => entity.kind === "npc");
  assert.equal(forester.components.interaction.actionId, "permission");

  for (const profileId of NESMEN_PROFILE_IDS) {
    const profile = getNesmenEntityDefinition(profileId);
    assert.ok(profile);
    assert.ok(profile.components.digSpot.findingId);
    assert.ok(profile.components.digSpot.variantId);
  }

  const findingIds = NESMEN_PROFILE_IDS.map(id => getNesmenEntityDefinition(id).components.digSpot.findingId);
  assert.equal(new Set(findingIds).size, 3);

  for (const variant of NESMEN_FINDING_VARIANTS) {
    const finding = createNesmenFinding(variant.id, findingIds[0]);
    assert.deepEqual(Object.keys(finding), ["findingId", "locality", "rarity", "weight", "score"]);
    assert.equal(finding.locality, "nesmen");
    assert.ok(["A", "B", "C"].includes(finding.rarity));
    assert.ok(finding.weight >= 0);
    assert.ok(finding.score >= 0);
  }
});

test("Nesměň canonical definitions are deeply frozen serializable data", () => {
  assert.equal(Object.isFrozen(NESMEN_ENTITY_DEFINITIONS), true);
  assert.equal(Object.isFrozen(NESMEN_FINDING_VARIANTS), true);
  assert.equal(Object.isFrozen(NESMEN_ENTITY_DEFINITIONS.at(-1)), true);
  assert.equal(Object.isFrozen(NESMEN_ENTITY_DEFINITIONS.at(-1).components), true);
  assert.equal(Object.isFrozen(NESMEN_ENTITY_DEFINITIONS.at(-1).components.digSpot), true);

  const serialized = JSON.stringify({
    entities: NESMEN_ENTITY_DEFINITIONS,
    findings: NESMEN_FINDING_VARIANTS
  });
  const parsed = JSON.parse(serialized);
  assert.equal(parsed.entities.length, 5);
  assert.equal(parsed.findings.length, 3);
});

test("all three Nesměň profiles can be collected into one session", () => {
  const session = createGameSession();
  const ids = NESMEN_PROFILE_IDS.map(id => getNesmenEntityDefinition(id).components.digSpot.findingId);

  // recordFinding throws on duplicate findingId, so all three profiles must own
  // distinct IDs and all three must be recordable into one authoritative session.
  for (const findingId of ids) session.recordFinding(createNesmenFinding("nesmen-standard", findingId));

  const state = session.state;
  assert.equal(state.findings.length, 3);
  assert.deepEqual(state.findings.map(entry => entry.findingId), ids);
  assert.equal(state.findings.every(entry => entry.locality === "nesmen"), true);
  assert.equal(state.score, state.findings.reduce((total, entry) => total + entry.score, 0));

  const one = evaluateObjective("nesmen", { permit: true, dug: 3, filled: 3, findings: 1 });
  assert.equal(one.complete, false);
  const two = evaluateObjective("nesmen", { permit: true, dug: 3, filled: 3, findings: 2 });
  assert.equal(two.complete, false);
  const three = evaluateObjective("nesmen", { permit: true, dug: 3, filled: 3, findings: 3 });
  assert.equal(three.complete, true);
});
