import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "../../vendor/three.module.min.js";
import { parseGlbModel } from "../../src/render/GlbModelLoader.js";
import { ModelFactory } from "../../src/render/ModelFactory.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/manifests/assets.json"), "utf8"));
const EXPECTED_IDS = [
  "player-hunter-walk",
  "npc-farmer-vaclav",
  "finding-vltavin-common",
  "finding-vltavin-rare",
  "finding-vltavin-standard",
  "terrain-chlum-field",
  "terrain-chlum-furrows",
  "model-chlum-tractor-no-driver",
  "model-chlum-hay-bale",
  "model-chlum-field-marker",
  "model-chlum-field-fence-segment"
];
const fileFor = entry => path.join(root, entry.url.slice(2));

function triangleCount(model) {
  let triangles = 0;
  model.traverse(node => {
    const geometry = node.geometry;
    if (!geometry) return;
    triangles += geometry.index
      ? geometry.index.count / 3
      : (geometry.getAttribute("position")?.count ?? 0) / 3;
  });
  return triangles;
}

function firstMesh(model) {
  let result = null;
  model.traverse(node => {
    if (!result && node.isMesh) result = node;
  });
  return result;
}

test("Chlum asset manifest has stable IDs, budgets, relative URLs and dispose ownership", () => {
  assert.equal(manifest.length, EXPECTED_IDS.length);
  assert.deepEqual(manifest.map(entry => entry.id), EXPECTED_IDS);
  assert.equal(new Set(manifest.map(entry => entry.id)).size, manifest.length);
  for (const entry of manifest) {
    assert.match(entry.url, /^\.\/assets\//);
    assert.ok(entry.preload === "common" || entry.preload === "level:chlum");
    assert.equal(typeof entry.disposeOwner, "string");
    assert.ok(entry.disposeOwner.length > 0);
    const file = fileFor(entry);
    assert.equal(fs.existsSync(file), true, entry.url);
    const bytes = fs.statSync(file).size;
    assert.equal(bytes, entry.metrics.bytes, entry.id);
    assert.ok(bytes <= entry.budget.bytes, entry.id);
  }
});

test("Chlum PNG and GLB files match declared technical constraints", () => {
  for (const entry of manifest) {
    const file = fileFor(entry);
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

test("general GLB loader parses every Chlum model and preserves triangle counts", () => {
  for (const entry of manifest.filter(asset => asset.type === "gltf")) {
    const model = parseGlbModel(THREE, fs.readFileSync(fileFor(entry)));
    assert.equal(model.isGroup, true, entry.id);
    assert.ok(firstMesh(model), entry.id);
    assert.equal(triangleCount(model), entry.metrics.triangles, entry.id);
    assert.equal(model.userData.glbAsset.version, "2.0", entry.id);
  }
});

test("ModelFactory clones resources and binds a GLB through the shared renderer", () => {
  const entry = manifest.find(asset => asset.id === "model-chlum-tractor-no-driver");
  const source = parseGlbModel(THREE, fs.readFileSync(fileFor(entry)));
  const bindings = [];
  const renderer = {
    bindEntity(entity, object, layer) {
      bindings.push({ entity, object, layer });
      return object;
    },
    disposeObject() {}
  };
  const factory = new ModelFactory({ renderer });
  const bound = factory.bind(77, source, {
    assetId: entry.id,
    layer: "actors",
    rotationX: Math.PI / 2,
    scale: 44,
    z: 8
  });

  assert.notEqual(bound, source);
  assert.deepEqual(bindings.map(item => ({ entity: item.entity, layer: item.layer })), [{ entity: 77, layer: "actors" }]);
  assert.equal(bound.userData.assetId, entry.id);
  assert.equal(bound.scale.x, 44);
  assert.equal(bound.rotation.x, Math.PI / 2);
  assert.equal(bound.position.z, 8);
  const sourceMesh = firstMesh(source);
  const boundMesh = firstMesh(bound);
  assert.notEqual(boundMesh.geometry, sourceMesh.geometry);
  assert.notEqual(boundMesh.material, sourceMesh.material);
});
