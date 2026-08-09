import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const manifest = JSON.parse(read("assets/manifests/assets.json"));

test("production environment plates are not obscured by legacy decorative overlays", () => {
  const nesmen = read("src/scenes/NesmenScene.js");
  const besednice = read("src/scenes/BesedniceScene.js");
  const slavia = read("src/scenes/SlaviaScene.js");

  assert.match(nesmen, /terrain-nesmen-reference-clearing-v2/);
  assert.match(nesmen, /REFERENCE_CLEARING = Object\.freeze\(\{ width: 1800, height: 1200, cameraZoom: 0\.75 \}\)/);
  assert.match(nesmen, /new THREE\.PlaneGeometry\(REFERENCE_CLEARING\.width, REFERENCE_CLEARING\.height\)/);
  assert.match(nesmen, /REFERENCE_CLEARING\.cameraZoom/);
  assert.doesNotMatch(nesmen, /environmentTexture\.repeat\.set/);
  assert.doesNotMatch(nesmen, /const trail = new THREE\.Mesh/);
  assert.doesNotMatch(nesmen, /addDecorModel\(root, "model-nesmen-tree-stump"/);

  const clearing = manifest.find(entry => entry.id === "terrain-nesmen-reference-clearing-v2");
  assert.deepEqual(clearing?.dimensions, { width: 1536, height: 1024 });
  assert.equal(clearing?.url, "./assets/textures/terrain/nesmen-reference-clearing-v2.png");
  assert.ok(clearing?.budget.bytes >= clearing?.metrics.bytes);

  assert.match(besednice, /terrain-besednice-clay-quarry-v1/);
  assert.doesNotMatch(besednice, /addDecorModel\(root, "model-besednice-rock"/);

  assert.match(slavia, /terrain-slavia-malse-exterior-v1/);
  assert.match(slavia, /building\.visible = false/);
});
