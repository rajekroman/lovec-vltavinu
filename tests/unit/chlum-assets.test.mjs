import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/manifests/assets.json"), "utf8"));
const EXPECTED_IDS = ["player-hunter-walk", "npc-farmer-vaclav", "finding-vltavin-common", "finding-vltavin-rare", "finding-vltavin-standard", "terrain-chlum-field", "terrain-chlum-furrows", "model-chlum-tractor-no-driver", "model-chlum-hay-bale", "model-chlum-field-marker", "model-chlum-field-fence-segment"];

test("Chlum asset manifest has stable IDs, budgets, relative URLs and dispose ownership", () => {
  assert.equal(manifest.length, EXPECTED_IDS.length);
  assert.deepEqual(manifest.map(entry => entry.id), EXPECTED_IDS);
  assert.equal(new Set(manifest.map(entry => entry.id)).size, manifest.length);
  for (const entry of manifest) {
    assert.match(entry.url, /^\.\/assets\//);
    assert.ok(entry.preload === "common" || entry.preload === "level:chlum");
    assert.equal(typeof entry.disposeOwner, "string");
    assert.ok(entry.disposeOwner.length > 0);
    const file = path.join(root, entry.url.slice(2));
    assert.equal(fs.existsSync(file), true, entry.url);
    const bytes = fs.statSync(file).size;
    assert.equal(bytes, entry.metrics.bytes, entry.id);
    assert.ok(bytes <= entry.budget.bytes, entry.id);
  }
});

test("Chlum PNG and GLB files match declared technical constraints", () => {
  for (const entry of manifest) {
    const file = path.join(root, entry.url.slice(2));
    const buffer = fs.readFileSync(file);
    if (entry.url.endsWith(".png")) {
      assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", entry.id);
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      assert.deepEqual({ width, height }, entry.dimensions, entry.id);
      assert.ok(Math.max(width, height) <= entry.budget.textureMax, entry.id);
    } else if (entry.url.endsWith(".glb")) {
      assert.equal(buffer.subarray(0, 4).toString("ascii"), "glTF", entry.id);
      assert.equal(buffer.readUInt32LE(4), 2, entry.id);
      assert.equal(buffer.readUInt32LE(8), buffer.length, entry.id);
      assert.ok(entry.pivot && entry.boundsMeters, entry.id);
      assert.ok(entry.metrics.triangles <= entry.budget.triangles, entry.id);
      if (entry.id === "model-chlum-tractor-no-driver") assert.equal(entry.requirements.visibleDriver, false);
    }
  }
});
