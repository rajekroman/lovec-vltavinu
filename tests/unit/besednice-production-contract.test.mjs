import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const rootUrl = new URL("../../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, rootUrl), "utf8");
const bootstrap = read("src/bootstrap.js");
const scene = read("src/scenes/BesedniceScene.js");
const bridge = read("src/scenes/NesmenBesedniceBridgeScene.js");
const slaviaBridge = read("src/scenes/BesedniceSlaviaBridgeScene.js");
const productionSlavia = read("src/scenes/ProductionSlaviaScene.js");
const hybridRenderer = read("src/render/HybridRenderer.js");
const serviceWorker = read("sw.js");
const mobileSmoke = read("tests/mobile-smoke.spec.mjs");
const slaviaSmoke = read("tests/slavia-smoke.spec.mjs");
const validationWorkflow = read(".github/workflows/validate.yml");
const manifest = JSON.parse(read("assets/manifests/assets.json"));

const forbiddenWorkflowFiles = Object.freeze([
  ".github/workflows/patch-besednice-action-transient.yml",
  ".github/workflows/revert-besednice-known-regression.yml",
  ".github/workflows/finalize-besednice-mobile-e2e.yml",
  ".github/workflows/finalize-besednice-touch-hold.yml",
  ".github/workflows/finalize-besednice-tractor-e2e.yml"
]);

const expectedAssets = Object.freeze([
  "npc-rival-karel",
  "finding-vltavin-besednice-hedgehog",
  "terrain-besednice-quarry",
  "model-besednice-trace-marker",
  "model-besednice-hedgehog-marker",
  "model-besednice-rock"
]);

test("bootstrap exposes one lazy production Slavia registration gate", () => {
  assert.match(bootstrap, /import \{ BesedniceSlaviaBridgeScene \} from "\.\/scenes\/BesedniceSlaviaBridgeScene\.js"/);
  assert.match(bootstrap, /import \{ ProductionSlaviaScene \} from "\.\/scenes\/ProductionSlaviaScene\.js"/);
  assert.match(bootstrap, /function ensureSlaviaRegistered\(\)/);
  assert.match(bootstrap, /if \(!app\.scenes\.has\("slavia"\)\) app\.scenes\.register\("slavia", slavia\)/);
  assert.match(bootstrap, /app\.scenes\.register\("besednice", besednice\)/);
  assert.doesNotMatch(bootstrap, /^app\.scenes\.register\("slavia", slavia\);$/m);
  assert.match(bootstrap, /slavia: app\.scenes\.activeId === "slavia" \? slavia\.snapshot\(\) : null/);
  assert.equal((bootstrap.match(/app\.scenes\.register\("slavia", slavia\)/g) ?? []).length, 1);
});

test("Besednice production result continues through the canonical Slavia bridge", () => {
  assert.match(slaviaBridge, /extends BesedniceScene/);
  assert.match(slaviaBridge, /nextLevelId: "slavia"/);
  assert.match(slaviaBridge, /buttonLabel: "POKRAČOVAT DO SLAVIE"/);
  assert.match(slaviaBridge, /this\.ensureSlaviaRegistered\(\)/);
  assert.match(slaviaBridge, /changeScene\("slavia"\)/);
});

test("Nesměň production result continues only into Besednice", () => {
  assert.match(bridge, /nextLevelId: "besednice"/);
  assert.match(bridge, /changeScene\("besednice"\)/);
  assert.doesNotMatch(bridge, /changeScene\("slavia"\)/);
});

test("Besednice scene uses manifest-driven preload and canonical objective phases", () => {
  assert.match(scene, /selectPreload\(this\.level\.assetGroups\)/);
  assert.doesNotMatch(scene, /TEXTURE_IDS|MODEL_IDS/);
  assert.match(scene, /clues: this\.clueCount\(\)/);
  assert.match(scene, /hedgehog: this\.hasHedgehog\(\)/);
  assert.match(scene, /bossStarted: boss\.started === true/);
  assert.match(scene, /bossDefeated: boss\.defeated === true/);
  assert.match(scene, /nextLevelId: "slavia"/);
  assert.match(scene, /DIG_REQUIRED_HITS/);
});

test("production Slavia resolves textures and binds canonical assets", () => {
  assert.match(productionSlavia, /await Promise\.all\(textures\.map/);
  assert.match(productionSlavia, /npc-thief-franta/);
  assert.doesNotMatch(productionSlavia, /npc-rival-franta/);
  assert.match(productionSlavia, /model-slavia-document-folder/);
  assert.doesNotMatch(productionSlavia, /BoxGeometry\(34, 24, 6\)/);
});

test("sprite rendering resolves promised manifest textures before binding the material map", () => {
  assert.match(hybridRenderer, /prepareSpriteTexture/);
  assert.match(hybridRenderer, /textureSource\?\.then instanceof Function/);
  assert.match(hybridRenderer, /sprite\.userData\.textureReady = Promise\.resolve\(textureSource\)\.then\(applyTexture\)/);
});

test("Besednice manifest pack has stable IDs, budgets and lifecycle owners", () => {
  const byId = new Map(manifest.map(entry => [entry.id, entry]));
  assert.equal(new Set(manifest.map(entry => entry.id)).size, manifest.length);
  for (const id of expectedAssets) {
    const entry = byId.get(id);
    assert.ok(entry, `missing ${id}`);
    assert.equal(entry.preload, "level:besednice");
    assert.match(entry.url, /^\.\/assets\//);
    assert.ok(entry.budget?.bytes > 0);
    assert.equal(entry.disposeOwner, "LevelScene:besednice");
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  }
});

test("service worker includes production scene modules", () => {
  for (const path of [
    "./src/data/besednice.js",
    "./src/gameplay/BossSystem.js",
    "./src/scenes/NesmenBesedniceBridgeScene.js",
    "./src/scenes/BesedniceScene.js",
    "./src/scenes/BesedniceSlaviaBridgeScene.js",
    "./src/scenes/SlaviaScene.js",
    "./src/scenes/ProductionSlaviaScene.js"
  ]) assert.ok(serviceWorker.includes(path), `service worker missing ${path}`);
});

test("validation remains read-only and temporary write workflows do not exist", () => {
  assert.match(validationWorkflow, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(validationWorkflow, /contents: write|internal-tree-sha|git push origin/);
  for (const path of forbiddenWorkflowFiles) {
    assert.equal(fs.existsSync(new URL(path, rootUrl)), false, `temporary workflow must not exist: ${path}`);
  }
});

test("canonical mobile smoke preserves the input-driven Chlum through Besednice regression path", () => {
  assert.match(mobileSmoke, /Chlum → Nesměň → Besednice flow completes hedgehog recovery/);
  assert.match(mobileSmoke, /enterBesedniceFromResult/);
  assert.match(mobileSmoke, /verifyBesedniceLifecycle/);
  assert.match(mobileSmoke, /waitForInteraction\(page, "recover", 15_000\)/);
  assert.match(mobileSmoke, /nextLevelId: "slavia"/);
  assert.match(mobileSmoke, /app\.scenes\.has\("slavia"\)/);
  assert.match(mobileSmoke, /newCDPSession\(page\)/);
  assert.match(mobileSmoke, /Input\.dispatchTouchEvent/);
  assert.doesNotMatch(mobileSmoke, /code: "KeyE"|page\.keyboard\.press\("Space"\)/);
});

test("Slavia smoke covers arrival, certification, final result and clean restart", () => {
  assert.match(slaviaSmoke, /ensureSlaviaRegistered/);
  assert.match(slaviaSmoke, /slavia-arrival/);
  assert.match(slaviaSmoke, /slavia-certification/);
  assert.match(slaviaSmoke, /slavia-final-result/);
  assert.match(slaviaSmoke, /collect-document/);
  assert.match(slaviaSmoke, /register-collection/);
  assert.match(slaviaSmoke, /recover-best-finding/);
  assert.match(slaviaSmoke, /receive-certificate/);
  assert.match(slaviaSmoke, /enter-event/);
  assert.match(slaviaSmoke, /session\.findings\)\.toEqual\(\[\]\)/);
  assert.match(slaviaSmoke, /localStorage\.length/);
  assert.doesNotMatch(slaviaSmoke, /KeyE|keyboard\.press\("Space"\)|element\.click\(\)/);
});
