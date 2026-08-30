import test from "node:test";
import assert from "node:assert/strict";
import {
  V73AudioEngine,
  DIG_IMPACT_IDS,
  FINDING_IDS,
  DANGER_IDS,
  AMBIENCE_IDS,
  UI_IDS,
  DIG_MISS_ID,
  DIG_CLEAN_ID,
  CAUGHT_ID,
  resolveDigImpactId,
  resolveFindingEffectId,
  resolveDangerEffectId,
  resolveAmbienceId
} from "../../src/audio/V73AudioEngine.js";
import { AudioEngine } from "../../src/audio/AudioEngine.js";

const events = { on() {}, emit() {} };

function createEngine() {
  const engine = new V73AudioEngine({ events, document: null, window: null });
  const played = [];
  engine.playEffect = async id => {
    played.push(id);
    return true;
  };
  return { engine, played };
}

test("v7.3 audio keeps one canonical AudioEngine ownership path", () => {
  const engine = new V73AudioEngine({ events, document: null, window: null });
  assert.ok(engine instanceof AudioEngine);
  assert.equal(Object.getPrototypeOf(V73AudioEngine.prototype), AudioEngine.prototype);
});

test("dig impact routing is deterministic and limited to three real variants", () => {
  assert.equal(new Set(DIG_IMPACT_IDS).size, 3);
  for (const id of DIG_IMPACT_IDS) assert.match(id, /^audio-sfx-dig-/);

  const payloads = [
    { spot: "chlum-search-1", hit: 1 },
    { spot: "chlum-search-1", hit: 2 },
    { spot: "nesmen-profile-2", hit: 3 },
    { spot: "besednice-trace-3", hit: 1 }
  ];
  for (const payload of payloads) {
    const first = resolveDigImpactId(payload);
    const second = resolveDigImpactId({ ...payload });
    assert.equal(first, second);
    assert.ok(DIG_IMPACT_IDS.includes(first));
  }
});

test("finding reward routing preserves exact A/B/C distinction", () => {
  assert.equal(new Set(Object.values(FINDING_IDS)).size, 3);
  assert.equal(resolveFindingEffectId("A"), FINDING_IDS.A);
  assert.equal(resolveFindingEffectId("B"), FINDING_IDS.B);
  assert.equal(resolveFindingEffectId("C"), FINDING_IDS.C);
  assert.equal(resolveFindingEffectId("unknown"), FINDING_IDS.C);
});

test("danger and ambience routing cover exactly four canonical runtime scene ids", () => {
  const scenes = ["chlum", "nesmen", "besednice", "slavia"];
  assert.equal(new Set(Object.values(DANGER_IDS)).size, 4);
  assert.equal(new Set(Object.values(AMBIENCE_IDS)).size, 4);
  for (const scene of scenes) {
    assert.equal(resolveDangerEffectId(scene), DANGER_IDS[scene]);
    assert.equal(resolveAmbienceId(scene), AMBIENCE_IDS[scene]);
  }
  assert.equal(resolveDangerEffectId("title"), null);
  assert.equal(resolveAmbienceId("title"), null);
});

test("event handlers route miss, clean, rarity, caught and rising danger exactly", async () => {
  const { engine, played } = createEngine();
  engine.currentScene = "nesmen";

  engine.handleDigMiss();
  engine.handleDigClean();
  engine.handleFinding({ rarity: "A" });
  engine.handleCaught();
  engine.handleDanger({ previous: 10, current: 20 });
  engine.handleDanger({ previous: 20, current: 20 });

  await Promise.resolve();
  assert.deepEqual(played, [
    DIG_MISS_ID,
    DIG_CLEAN_ID,
    FINDING_IDS.A,
    CAUGHT_ID,
    DANGER_IDS.nesmen
  ]);
});

test("scene completion selects location ambience and title clears ownership", () => {
  const { engine } = createEngine();
  engine.handleSceneTransition({ to: "chlum" });
  assert.equal(engine.currentScene, "chlum");
  assert.equal(engine.pendingMusicId, AMBIENCE_IDS.chlum);

  engine.handleSceneTransition({ to: "slavia" });
  assert.equal(engine.currentScene, "slavia");
  assert.equal(engine.pendingMusicId, AMBIENCE_IDS.slavia);

  engine.handleSceneTransition({ to: "title" });
  assert.equal(engine.currentScene, "title");
  assert.equal(engine.pendingMusicId, null);
});

test("UI routing exposes four distinct functional sound ids", () => {
  assert.equal(new Set(Object.values(UI_IDS)).size, 4);
  assert.deepEqual(Object.keys(UI_IDS).sort(), ["click", "close", "open", "result"]);
});
