import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const rootUrl = new URL("../../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, rootUrl), "utf8");
const manifest = JSON.parse(read("assets/manifests/assets.json"));
const serviceWorker = read("sw.js");

const expectedAssets = Object.freeze([
  "model-slavia-kd-building",
  "texture-slavia-kd-facade",
  "texture-slavia-event-banner",
  "npc-expert-eva",
  "npc-rival-franta"
]);

const sha256 = buffer => crypto.createHash("sha256").update(buffer).digest("hex");

const localPath = url => {
  assert.match(url, /^\.\/assets\//);
  return url.slice(2);
};

test("Slavia asset pack has stable IDs, budgets and lifecycle ownership", () => {
  const byId = new Map(manifest.map(entry => [entry.id, entry]));
  assert.equal(new Set(manifest.map(entry => entry.id)).size, manifest.length);

  for (const id of expectedAssets) {
    const entry = byId.get(id);
    assert.ok(entry, `missing ${id}`);
    assert.equal(entry.preload, "level:slavia");
    assert.equal(entry.disposeOwner, "LevelScene:slavia");
    assert.ok(entry.budget?.bytes > 0, `${id} missing byte budget`);
    assert.ok(entry.metrics?.bytes > 0, `${id} missing byte metric`);
    assert.ok(entry.metrics.bytes <= entry.budget.bytes, `${id} exceeds byte budget`);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  }
});

test("Slavia manifest integrity matches physical asset files", () => {
  const byId = new Map(manifest.map(entry => [entry.id, entry]));

  for (const id of expectedAssets) {
    const entry = byId.get(id);
    const path = localPath(entry.url);
    const fileUrl = new URL(path, rootUrl);
    assert.equal(fs.existsSync(fileUrl), true, `missing file for ${id}: ${path}`);
    const buffer = fs.readFileSync(fileUrl);
    assert.equal(buffer.byteLength, entry.metrics.bytes, `${id} byte metric mismatch`);
    assert.equal(sha256(buffer), entry.sha256, `${id} SHA-256 mismatch`);
  }
});

test("KD Slavia model declares meter scale, ground pivot and bounded geometry", () => {
  const entry = manifest.find(candidate => candidate.id === "model-slavia-kd-building");
  assert.equal(entry.type, "gltf");
  assert.deepEqual(entry.scale, { unit: "meter", upAxis: "Y", forwardAxis: "-Z" });
  assert.equal(entry.pivot?.kind, "ground-center");
  assert.ok(entry.pivot?.toleranceMeters > 0);
  assert.deepEqual(entry.boundsMeters?.min, [-6, 0, -2.5]);
  assert.deepEqual(entry.boundsMeters?.max, [6, 5, 2.5]);
  assert.ok(entry.metrics.triangles > 0);
  assert.ok(entry.metrics.triangles <= entry.budget.triangles);
});

test("service worker pre-caches every Slavia asset path", () => {
  const byId = new Map(manifest.map(entry => [entry.id, entry]));
  for (const id of expectedAssets) {
    const path = byId.get(id).url;
    assert.ok(serviceWorker.includes(`"${path}"`), `service worker missing ${path}`);
  }
  assert.match(serviceWorker, /lovec-vltavinu-slavia-v6-0/);
});