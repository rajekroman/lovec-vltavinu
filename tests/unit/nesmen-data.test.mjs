import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTEXT_ACTION,
  DIG_REQUIRED_HITS,
  getLevelDefinition,
  getLevelTarget,
  isLevelTargetReachable
} from "../../src/data/levels.js";
import { getDialogueDefinition } from "../../src/data/dialogues.js";
import { createGameSession } from "../../src/gameplay/GameSession.js";
import { evaluateObjective } from "../../src/gameplay/Objectives.js";
import {
  NESMEN_ENTITY_DEFINITIONS,
  NESMEN_FINDING_VARIANTS,
  NESMEN_PROFILE_IDS,
  createNesmenFinding,
  getNesmenEntityDefinition
} from "../../src/data/nesmen.js";

test("Nesměň level keeps the canonical three-profile progression contract", () => {
  const level = getLevelDefinition("nesmen");
  assert.ok(level);
  assert.equal(level.next, "besednice");
  assert.deepEqual(level.assetGroups, ["common", "level:nesmen"]);
  assert.deepEqual(level.objective, {
    id: "nesmen-dig-and-restore",
    type: "nesmen-dig-and-restore",
    required: 3
  });

  const permission = level.objectives.find(entry => entry.id === "permission");
  const digProfiles = level.objectives.find(entry => entry.id === "dig-profiles");
  const fillHoles = level.objectives.find(entry => entry.id === "fill-holes");
  assert.deepEqual(permission, {
    id: "permission",
    type: "dialog",
    target: "forester",
    required: 1,
    action: CONTEXT_ACTION
  });
  assert.equal(digProfiles.required, 3);
  assert.equal(digProfiles.requiredHits, DIG_REQUIRED_HITS);
  assert.equal(DIG_REQUIRED_HITS, 3);
  assert.equal(fillHoles.required, 3);
  assert.equal(fillHoles.type, "restore");

  const profileTarget = getLevelTarget("nesmen", "forest-profile");
  assert.equal(profileTarget.positions.length, 3);
  assert.equal(isLevelTargetReachable("nesmen", "forester", 1), true);
  assert.equal(isLevelTargetReachable("nesmen", "forest-profile", 3), true);
});

test("Nesměň entity data contains one player, one forester and exactly three disabled profiles", () => {
  const ids = NESMEN_ENTITY_DEFINITIONS.map(entity => entity.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ["player", "forester", ...NESMEN_PROFILE_IDS]);
  assert.equal(NESMEN_PROFILE_IDS.length, 3);

  const forester = getNesmenEntityDefinition("forester");
  assert.equal(forester.components.npc.dialogueId, "nesmen-permission");
  assert.equal(forester.components.interaction.kind, "permission");
  assert.equal(forester.components.interaction.action, CONTEXT_ACTION);
  assert.equal(forester.components.interaction.enabled, true);

  const seededFindings = [];
  for (const [index, profileId] of NESMEN_PROFILE_IDS.entries()) {
    const profile = getNesmenEntityDefinition(profileId);
    assert.ok(profile, profileId);
    assert.equal(profile.components.interaction.kind, "dig");
    assert.equal(profile.components.interaction.action, CONTEXT_ACTION);
    assert.equal(profile.components.interaction.enabled, false);
    assert.equal(profile.components.model.assetId, "model-nesmen-profile-marker");
    assert.equal(profile.components.digSpot.profileIndex, index);
    assert.equal(profile.components.digSpot.dug, false);
    assert.equal(profile.components.digSpot.filled, false);
    assert.equal(profile.components.digSpot.variantId, "nesmen-standard");
    seededFindings.push(profile.components.digSpot.findingId);
  }
  // Every profile yields its own moldavite: recordFinding rejects duplicate
  // findingId values, so these must stay distinct.
  assert.deepEqual(seededFindings, ["nesmen-finding-1", "nesmen-finding-2", "nesmen-finding-3"]);
  assert.equal(new Set(seededFindings).size, seededFindings.length);
});

test("all Nesměň transforms are reachable inside canonical level bounds", () => {
  const { bounds } = getLevelDefinition("nesmen");
  for (const entity of NESMEN_ENTITY_DEFINITIONS) {
    const { x, y } = entity.components.transform;
    assert.equal(x >= bounds.x && x <= bounds.x + bounds.width, true, entity.id);
    assert.equal(y >= bounds.y && y <= bounds.y + bounds.height, true, entity.id);
  }
});

test("Nesměň permission dialogue and finding payload obey session-only contracts", () => {
  const dialogue = getDialogueDefinition("nesmen-permission");
  assert.ok(dialogue);
  assert.equal(dialogue.speaker.entityId, "forester");
  assert.equal(dialogue.grantsFlag, "nesmenPermission");
  assert.equal(dialogue.lines.length, 2);
  assert.match(dialogue.lines.join(" "), /třech|tři/i);
  assert.match(dialogue.lines.join(" "), /zasyp/i);

  assert.equal(NESMEN_FINDING_VARIANTS.length, 3);
  assert.equal(Object.isFrozen(NESMEN_FINDING_VARIANTS), true);
  assert.deepEqual(createNesmenFinding("nesmen-standard", " finding-nesmen "), {
    findingId: "finding-nesmen",
    locality: "nesmen",
    rarity: "B",
    weight: 1.5,
    score: 120
  });
  assert.throws(() => createNesmenFinding("unknown"), /Unknown Nesměň finding variant/);
  assert.throws(() => createNesmenFinding("nesmen-standard", "   "), /findingId must be a non-empty string/);
});

test("Nesměň canonical definitions are deeply frozen serializable data", () => {
  assert.equal(Object.isFrozen(NESMEN_ENTITY_DEFINITIONS), true);
  assert.equal(Object.isFrozen(NESMEN_ENTITY_DEFINITIONS[0].components), true);
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

  // recordFinding rejects duplicate findingId values, so the three profiles
  // must remain distinct and all three are required by the objective contract.
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
