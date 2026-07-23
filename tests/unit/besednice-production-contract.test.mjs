import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const bootstrap = read("src/bootstrap.js");
const scene = read("src/scenes/BesedniceScene.js");
const bridge = read("src/scenes/NesmenBesedniceBridgeScene.js");
const serviceWorker = read("sw.js");
const mobileSmoke = read("tests/mobile-smoke.spec.mjs");
const manifest = JSON.parse(read("assets/manifests/assets.json"));

const expectedAssets = Object.freeze([
  "npc-rival-karel",
  "finding-vltavin-besednice-hedgehog",
  "terrain-besednice-quarry",
  "model-besednice-trace-marker",
  "model-besednice-hedgehog-marker",
  "model-besednice-rock"
]);

test("bootstrap registers one production Besednice scene without registering Slavia", () => {
  assert.match(bootstrap, /import \{ BesedniceScene \} from "\.\/scenes\/BesedniceScene\.js"/);
  assert.match(bootstrap, /app\.scenes\.register\("besednice", besednice\)/);
  assert.match(bootstrap, /besednice: app\.scenes\.activeId === "besednice" \? besednice\.snapshot\(\) : null/);
  assert.doesNotMatch(bootstrap, /app\.scenes\.register\("slavia"/);
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

test("service worker includes Besednice production modules", () => {
  for (const path of [
    "./src/data/besednice.js",
    "./src/gameplay/BossSystem.js",
    "./src/scenes/NesmenBesedniceBridgeScene.js",
    "./src/scenes/BesedniceScene.js"
  ]) assert.ok(serviceWorker.includes(path), `service worker missing ${path}`);
});

test("canonical mobile smoke reaches Besednice without a parallel Slavia scene", () => {
  assert.match(mobileSmoke, /Chlum → Nesměň → Besednice flow completes hedgehog recovery/);
  assert.match(mobileSmoke, /openBootstrap\(page, "\/"\)/);
  assert.match(mobileSmoke, /enterBesedniceFromResult/);
  assert.match(mobileSmoke, /verifyBesedniceLifecycle/);
  assert.match(mobileSmoke, /waitForInteraction\(page, "recover", 15_000\)/);
  assert.match(mobileSmoke, /nextLevelId: "slavia"/);
  assert.match(mobileSmoke, /app\.scenes\.has\("slavia"\)/);
  assert.doesNotMatch(mobileSmoke, /changeScene\("slavia"\)/);
  assert.match(mobileSmoke, /window\.dispatchEvent\(new KeyboardEvent\("keydown"/);
  assert.match(mobileSmoke, /code: "KeyE"/);
  assert.match(mobileSmoke, /actions\.action\?\.down/);
  assert.match(mobileSmoke, /page\.waitForTimeout\(100\)/);
  assert.match(mobileSmoke, /window\.dispatchEvent\(new KeyboardEvent\("keyup"/);
  assert.doesNotMatch(mobileSmoke, /page\.keyboard\.press\("Space"\)/);
  assert.doesNotMatch(mobileSmoke, /action\.evaluate\(element => element\.click\(\)\)/);
  assert.match(mobileSmoke, /beforeDuplicate[\s\S]*aria-disabled", "true"[\s\S]*toBe\(beforeDuplicate\)/);
  assert.match(mobileSmoke, /Math\.hypot\([\s\S]*player\.x - 120[\s\S]*player\.y - 380[\s\S]*toBeLessThan\(110\)/);
  assert.match(mobileSmoke, /return "triggered"/);
  assert.match(mobileSmoke, /Number\(currentTotal\) >= total/);
  assert.match(mobileSmoke, /timeout: 2_000/);
});
