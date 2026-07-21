import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  getLevel,
  PERKS,
  createEmptyPerks,
  normalizePerks,
  SAMPLES,
  createGameState,
  cloneGameState,
  validateGameState,
  CURRENT_SAVE_KEY,
  LEGACY_SAVE_KEYS,
  parseLegacySave,
  serializeLegacySave,
  readLegacySave,
  migrateLegacySave,
  evaluateObjective,
  isObjectiveComplete
} from "../../src/index.js";

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }
  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }
  setItem(key, value) {
    this.values.set(key, String(value));
  }
  removeItem(key) {
    this.values.delete(key);
  }
}

test("kanonické levely mají stabilní pořadí a unikátní ID", () => {
  assert.deepEqual(LEVELS.map(level => level.id), ["chlum", "locenice", "nesmen", "besednice", "malse"]);
  assert.equal(new Set(LEVELS.map(level => level.id)).size, LEVELS.length);
  assert.equal(getLevel(0)?.id, "chlum");
  assert.equal(getLevel("malse")?.order, 4);
  assert.equal(Object.isFrozen(LEVELS), true);
  assert.equal(Object.isFrozen(LEVELS[0]), true);
  assert.equal(Object.isFrozen(LEVELS[0].objective), true);
});

test("perky mají nulový výchozí stav a normalizují vlastní maxima", () => {
  assert.deepEqual(createEmptyPerks(), { boots: 0, scanner: 0, shovel: 0, quiet: 0, case: 0, eye: 0 });
  assert.deepEqual(normalizePerks({ boots: 99, scanner: 2.9, shovel: -2, quiet: "2", case: 8, eye: null }), {
    boots: 3,
    scanner: 2,
    shovel: 0,
    quiet: 2,
    case: 2,
    eye: 0
  });
  assert.equal(PERKS.find(perk => perk.id === "case")?.max, 2);
});

test("určovací sada obsahuje vyvážené skutečné a falešné vzorky", () => {
  assert.equal(SAMPLES.length, 6);
  assert.equal(SAMPLES.filter(sample => sample.real).length, 3);
  assert.equal(SAMPLES.filter(sample => !sample.real).length, 3);
  assert.equal(new Set(SAMPLES.map(sample => sample.id)).size, SAMPLES.length);
});

test("GameState normalizuje staré a poškozené hodnoty", () => {
  const state = createGameState({
    levelIndex: 99,
    score: -200,
    heat: 140,
    combo: 50,
    comboTimer: -3,
    caught: -2,
    sound: false,
    perks: { boots: 20, case: 1 },
    stats: { digs: "4", misses: -3 },
    stones: [
      { id: "a", weight: "2.5", quality: 180, value: -20, documented: false },
      null
    ]
  });

  assert.equal(state.levelIndex, 4);
  assert.equal(state.score, 0);
  assert.equal(state.heat, 100);
  assert.equal(state.combo, 6);
  assert.equal(state.comboTimer, 0);
  assert.equal(state.caught, 0);
  assert.equal(state.sound, false);
  assert.equal(state.perks.boots, 3);
  assert.equal(state.perks.case, 1);
  assert.equal(state.stats.digs, 4);
  assert.equal(state.stats.misses, 0);
  assert.equal(state.stones.length, 1);
  assert.equal(state.stones[0].weight, 2.5);
  assert.equal(state.stones[0].quality, 100);
  assert.equal(state.stones[0].value, 0);
  assert.equal(state.stones[0].documented, false);
  assert.equal(validateGameState(state).valid, true);
});

test("cloneGameState nevytváří sdílené mutable vnořené struktury", () => {
  const original = createGameState({ stones: [{ id: "x", weight: 1 }], perks: { boots: 1 }, stats: { digs: 1 } });
  const copy = cloneGameState(original);
  copy.stones[0].weight = 9;
  copy.perks.boots = 2;
  copy.stats.digs = 5;
  assert.equal(original.stones[0].weight, 1);
  assert.equal(original.perks.boots, 1);
  assert.equal(original.stats.digs, 1);
});

test("validateGameState odmítá strukturálně neplatný stav", () => {
  const result = validateGameState({ levelIndex: -1, score: -1, heat: 200, combo: 0 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 6);
});

test("save serializace zachová kompatibilní 5.1 schema", () => {
  const serialized = serializeLegacySave(createGameState({ score: 1200, stones: [{ id: "one", weight: 1.25 }] }));
  const parsed = parseLegacySave(serialized);
  assert.equal(parsed.version, "5.1.0");
  assert.equal(parsed.schemaVersion, "5.1");
  assert.equal(parsed.score, 1200);
  assert.equal(parsed.stones[0].weight, 1.25);
});

test("readLegacySave upřednostní aktuální klíč před starší verzí", () => {
  const storage = new MemoryStorage({
    [CURRENT_SAVE_KEY]: JSON.stringify({ ...createGameState({ score: 500 }), stones: [] }),
    [LEGACY_SAVE_KEYS[0]]: JSON.stringify({ ...createGameState({ score: 100 }), stones: [] })
  });
  const found = readLegacySave(storage);
  assert.equal(found.key, CURRENT_SAVE_KEY);
  assert.equal(found.state.score, 500);
  assert.equal(found.migrated, false);
});

test("migrateLegacySave převede starší klíč a standardně zachová zdroj", () => {
  const sourceKey = LEGACY_SAVE_KEYS[2];
  const storage = new MemoryStorage({
    [sourceKey]: JSON.stringify({
      version: "4.8.0",
      levelIndex: 2,
      score: 900,
      stones: [],
      heat: 20,
      combo: 2,
      comboTimer: 3,
      caught: 1,
      perks: { boots: 1 },
      stats: { digs: 2 },
      sound: true
    })
  });

  const result = migrateLegacySave(storage);
  assert.equal(result.sourceKey, sourceKey);
  assert.equal(result.key, CURRENT_SAVE_KEY);
  assert.equal(result.migrated, true);
  assert.equal(result.written, true);
  assert.ok(storage.getItem(CURRENT_SAVE_KEY));
  assert.ok(storage.getItem(sourceKey));
  assert.equal(parseLegacySave(storage.getItem(CURRENT_SAVE_KEY)).score, 900);
});

test("migrateLegacySave může po úspěšném převodu odstranit zdroj", () => {
  const sourceKey = LEGACY_SAVE_KEYS.at(-1);
  const storage = new MemoryStorage({
    [sourceKey]: JSON.stringify({ ...createGameState({ score: 77 }), stones: [] })
  });
  migrateLegacySave(storage, { removeSource: true });
  assert.equal(storage.getItem(sourceKey), null);
  assert.ok(storage.getItem(CURRENT_SAVE_KEY));
});

test("objektiv Chlumu vyžaduje povolení i čtyři kameny", () => {
  assert.equal(evaluateObjective("chlum", { permit: false, collected: 4 }).text, "Promluv s Václavem");
  assert.equal(isObjectiveComplete("chlum", { permit: false, collected: 4 }), false);
  assert.equal(isObjectiveComplete("chlum", { permit: true, collected: 4 }), true);
});

test("objektiv Ločenice vyžaduje správná určení i tři pravé kusy", () => {
  assert.equal(evaluateObjective("locenice", { correct: 4, real: 3 }).text, "Správně 4/5 · pravé 3/3");
  assert.equal(isObjectiveComplete("locenice", { correct: 5, real: 2 }), false);
  assert.equal(isObjectiveComplete("locenice", { correct: 5, real: 3 }), true);
});

test("objektiv Nesměně vyžaduje povolení, kopání i zahrabání", () => {
  assert.equal(evaluateObjective("nesmen", { permit: false }).text, "Získej souhlas lesníka");
  assert.equal(isObjectiveComplete("nesmen", { permit: true, dug: 3, filled: 2 }), false);
  assert.equal(isObjectiveComplete("nesmen", { permit: true, dug: 3, filled: 3 }), true);
});

test("objektiv Besednice odpovídá jednotlivým fázím bosse", () => {
  assert.equal(evaluateObjective("besednice", { clues: 2 }).text, "Stopy 2/3");
  assert.equal(evaluateObjective("besednice", { clues: 3 }).text, "Vykopej ježkový profil");
  assert.equal(evaluateObjective("besednice", { bossStarted: true }).text, "Dostaň ježek zpět");
  assert.equal(evaluateObjective("besednice", { bossStarted: true, bossDefeated: true }).text, "Ježek je v bezpečí");
  assert.equal(isObjectiveComplete("besednice", { bossDefeated: true }), true);
});

test("objektiv Malše vyžaduje dokumenty i porážku Franty", () => {
  assert.equal(evaluateObjective("malse", { papers: 2 }).text, "Dokumenty 2/3");
  assert.equal(evaluateObjective("malse", { papers: 3, bossStarted: true }).text, "Dožeň Frantu");
  assert.equal(evaluateObjective("malse", { papers: 3, bossStarted: true, bossDefeated: true }).text, "Vstup do Slávie");
  assert.equal(isObjectiveComplete("malse", { papers: 2, bossDefeated: true }), false);
  assert.equal(isObjectiveComplete("malse", { papers: 3, bossDefeated: true }), true);
});

test("progress každého cíle zůstává v rozsahu 0 až 1", () => {
  const cases = [
    ["chlum", { permit: true, collected: 999 }],
    ["locenice", { correct: 999, real: 999 }],
    ["nesmen", { permit: true, dug: 999, filled: 999 }],
    ["besednice", { clues: 999, hedgehog: true, bossStarted: true, bossDefeated: true }],
    ["malse", { papers: 999, bossStarted: true, bossDefeated: true }]
  ];
  for (const [level, runtime] of cases) {
    const progress = evaluateObjective(level, runtime).progress;
    assert.ok(progress >= 0 && progress <= 1, `${level}: ${progress}`);
  }
});
