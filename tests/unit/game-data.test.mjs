import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVEL_DEFINITIONS,
  LEVEL_ORDER,
  PERK_DEFINITIONS,
  SAMPLE_DEFINITIONS,
  getLevelDefinition,
  getNextLevelId,
  getPerkDefinition,
  getSampleDefinition,
  validateGameData,
  assertValidGameData
} from "../../src/index.js";

const gameData = {
  levels: LEVEL_DEFINITIONS,
  perks: PERK_DEFINITIONS,
  samples: SAMPLE_DEFINITIONS
};

test("game data registry contains the five ordered production levels", () => {
  assert.deepEqual(LEVEL_ORDER, ["chlum", "locenice", "nesmen", "besednice", "malse"]);
  assert.equal(LEVEL_DEFINITIONS.length, 5);
  assert.equal(LEVEL_DEFINITIONS.at(-1).final, true);
  assert.equal(LEVEL_DEFINITIONS.filter(level => level.final).length, 1);
  assert.equal(getNextLevelId("chlum"), "locenice");
  assert.equal(getNextLevelId("malse"), null);
  assert.equal(getLevelDefinition("besednice").objectives.at(-1).target, "crystal-karel");
});

test("level, perk and sample definitions are immutable", () => {
  assert.equal(Object.isFrozen(LEVEL_DEFINITIONS), true);
  assert.equal(Object.isFrozen(LEVEL_DEFINITIONS[0]), true);
  assert.equal(Object.isFrozen(LEVEL_DEFINITIONS[0].objectives), true);
  assert.equal(Object.isFrozen(LEVEL_DEFINITIONS[0].objectives[0]), true);
  assert.equal(Object.isFrozen(PERK_DEFINITIONS), true);
  assert.equal(Object.isFrozen(PERK_DEFINITIONS[0]), true);
  assert.equal(Object.isFrozen(SAMPLE_DEFINITIONS), true);
  assert.equal(Object.isFrozen(SAMPLE_DEFINITIONS[0]), true);
});

test("content lookups return stable definitions and null for unknown ids", () => {
  assert.equal(getPerkDefinition("shovel").max, 3);
  assert.equal(getSampleDefinition("bottle-glass").real, false);
  assert.equal(getLevelDefinition("unknown"), null);
  assert.equal(getPerkDefinition("unknown"), null);
  assert.equal(getSampleDefinition("unknown"), null);
});

test("production game data passes the validation contract", () => {
  const result = validateGameData(gameData);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.strictEqual(assertValidGameData(gameData), gameData);
});

test("validation rejects duplicate ids, broken order and invalid targets", () => {
  const brokenLevels = LEVEL_DEFINITIONS.map(level => ({
    ...level,
    objectives: level.objectives.map(objective => ({ ...objective })),
    hazards: [...level.hazards]
  }));
  brokenLevels[1].id = "chlum";
  brokenLevels[2].order = 8;
  brokenLevels[0].objectives[0].required = 0;
  brokenLevels[4].final = false;

  const result = validateGameData({
    levels: brokenLevels,
    perks: PERK_DEFINITIONS,
    samples: SAMPLE_DEFINITIONS
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("Duplicate level ids")));
  assert.ok(result.errors.some(error => error.includes("Level order")));
  assert.ok(result.errors.some(error => error.includes("positive integer")));
  assert.ok(result.errors.some(error => error.includes("Exactly one level")));
  assert.throws(() => assertValidGameData({ levels: brokenLevels, perks: PERK_DEFINITIONS, samples: SAMPLE_DEFINITIONS }), {
    name: "GameDataValidationError"
  });
});
