import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const rootUrl = new URL("../../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, rootUrl), "utf8");
const bootstrap = read("src/bootstrap.js");
const scene = read("src/scenes/BesedniceScene.js");
const slavia = read("src/scenes/SlaviaScene.js");
const bridge = read("src/scenes/NesmenBesedniceBridgeScene.js");
const serviceWorker = read("sw.js");
const mobileSmoke = read("tests/mobile-smoke.spec.mjs");
const slaviaSmoke = read("tests/slavia-smoke.spec.mjs");
const validationWorkflow = read(".github/workflows/validate.yml");
const manifest = JSON.parse(read("assets/manifests/assets.json"));

const expectedAssets = Object.freeze([
  "npc-rival-karel",
  "finding-vltavin-besednice-hedgehog",
  "terrain-besednice-quarry",
  "model-besednice-trace-marker",
  "model-besednice-hedgehog-marker",
  "model-besednice-rock"
]);

test("bootstrap registers one canonical instance of every production scene", () => {
  assert.match(bootstrap, /import \{ BesedniceScene \} from "\.\/scenes\/BesedniceScene\.js"/);
  assert.match(bootstrap, /import \{ SlaviaScene \} from "\.\/scenes\/SlaviaScene\.js"/);
  assert.doesNotMatch(bootstrap, /BesedniceSlaviaBridgeScene|ProductionSlaviaScene|ensureSlaviaRegistered/);
  for (const id of ["title", "chlum", "nesmen", "besednice", "slavia"]) {
    assert.equal((bootstrap.match(new RegExp(`app\\.scenes\\.register\\("${id}"`, "g")) ?? []).length, 1);
  }
});

test("Besednice result directly continues into canonical Slavia", () => {
  assert.match(scene, /nextLevelId: "slavia"/);
  assert.match(scene, /buttonLabel: "POKRAČOVAT DO SLAVIE"/);
  assert.match(scene, /changeScene\("slavia"\)/);
  assert.doesNotMatch(scene, /ensureSlaviaRegistered|BesedniceSlaviaBridgeScene/);
});

test("Nesměň production result continues only into Besednice", () => {
  assert.match(bridge, /nextLevelId: "besednice"/);
  assert.match(bridge, /changeScene\("besednice"\)/);
  assert.doesNotMatch(bridge, /changeScene\("slavia"\)/);
});

test("canonical Slavia resolves textures and binds canonical assets", () => {
  assert.match(slavia, /loadedTextures = new Map/);
  assert.match(slavia, /npc-thief-franta/);
  assert.doesNotMatch(slavia, /npc-rival-franta|ProductionSlaviaScene/);
  assert.match(slavia, /model-slavia-document-folder/);
  assert.doesNotMatch(slavia, /BoxGeometry\(34, 24, 6\)/);
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

test("service worker includes only canonical production scene modules", () => {
  for (const path of [
    "./src/data/besednice.js",
    "./src/gameplay/BossSystem.js",
    "./src/scenes/NesmenBesedniceBridgeScene.js",
    "./src/scenes/BesedniceScene.js",
    "./src/scenes/SlaviaScene.js"
  ]) assert.ok(serviceWorker.includes(path), `service worker missing ${path}`);
  assert.doesNotMatch(serviceWorker, /BesedniceSlaviaBridgeScene|ProductionSlaviaScene/);
  assert.equal(fs.existsSync(new URL("src/scenes/BesedniceSlaviaBridgeScene.js", rootUrl)), false);
  assert.equal(fs.existsSync(new URL("src/scenes/ProductionSlaviaScene.js", rootUrl)), false);
});

test("validation remains read-only", () => {
  assert.match(validationWorkflow, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(validationWorkflow, /contents: write|internal-tree-sha|git push origin/);
});

test("mobile and Slavia smoke use normalized touch input", () => {
  for (const source of [mobileSmoke, slaviaSmoke]) {
    assert.match(source, /newCDPSession\(page\)/);
    assert.match(source, /Input\.dispatchTouchEvent/);
    assert.doesNotMatch(source, /code: "KeyE"|keyboard\.press\("Space"\)|element\.click\(\)/);
  }
  assert.match(slaviaSmoke, /input-driven Chlum → Nesměň → Besednice → Slavia flow/);
  for (const artifact of ["slavia-arrival", "slavia-certification", "slavia-final-result"]) assert.ok(slaviaSmoke.includes(artifact));
  assert.doesNotMatch(slaviaSmoke, /recordFinding|ensureSlaviaRegistered|changeScene\("slavia"\)|session\.reset\(\)/);
});
