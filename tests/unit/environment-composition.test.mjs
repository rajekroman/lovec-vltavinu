import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const manifest = JSON.parse(read("assets/manifests/assets.json"));

test("production environment plates are complemented by authored low-poly landmark geometry", () => {
  const nesmen = read("src/scenes/NesmenScene.js");
  const besednice = read("src/scenes/BesedniceScene.js");
  const slavia = read("src/scenes/SlaviaScene.js");
  const chlum = read("src/scenes/ChlumScene.js");

  assert.match(nesmen, /terrain-nesmen-green-wave-v1/);
  assert.match(nesmen, /REFERENCE_CLEARING = Object\.freeze\(\{ width: 1800, height: 1200, cameraZoom: 0\.75 \}\)/);
  assert.match(nesmen, /new THREE\.PlaneGeometry\(REFERENCE_CLEARING\.width, REFERENCE_CLEARING\.height\)/);
  assert.match(nesmen, /REFERENCE_CLEARING\.cameraZoom/);
  assert.doesNotMatch(nesmen, /environmentTexture\.repeat\.set/);
  assert.match(nesmen, /createAuthoredEnvironment/);
  assert.match(nesmen, /getLevelEnvironmentLayout\("nesmen"\)/);

  const clearing = manifest.find(entry => entry.id === "terrain-nesmen-green-wave-v1");
  assert.deepEqual(clearing?.dimensions, { width: 1500, height: 1200 });
  assert.equal(clearing?.url, "./assets/textures/terrain/nesmen-green-wave-v1.svg");
  assert.ok(clearing?.budget.bytes >= clearing?.metrics.bytes);

  assert.match(besednice, /terrain-besednice-green-wave-v1/);
  assert.match(besednice, /createAuthoredEnvironment/);
  assert.match(besednice, /getLevelEnvironmentLayout\("besednice"\)/);

  assert.match(slavia, /terrain-slavia-green-wave-v1/);
  assert.match(slavia, /createAuthoredEnvironment/);
  assert.doesNotMatch(slavia, /building\.visible = false/);
  assert.match(chlum, /createAuthoredEnvironment/);
});
