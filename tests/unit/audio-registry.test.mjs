import test from "node:test";
import assert from "node:assert/strict";
import { AudioRegistry } from "../../src/audio/AudioRegistry.js";

function entry(overrides = {}) {
  return {
    id: "music-chlum",
    type: "audio",
    url: "./assets/audio/music-chlum.ogg",
    preload: "level:chlum",
    role: "music",
    loop: true,
    volume: 0.7,
    metrics: { bytes: 1200 },
    budget: { bytes: 1500 },
    sha256: "abc123",
    disposeOwner: "AudioEngine",
    license: { source: "project", license: "CC0-1.0" },
    ...overrides
  };
}

test("AudioRegistry imports only audio manifest entries", () => {
  const registry = AudioRegistry.fromManifest([
    entry(),
    { id: "texture", type: "texture", url: "./assets/x.png" }
  ]);
  assert.equal(registry.snapshot().length, 1);
  assert.equal(registry.require("music-chlum").role, "music");
});

test("AudioRegistry rejects duplicate ids and non-relative URLs", () => {
  assert.throws(() => new AudioRegistry([entry(), entry()]), /Duplicate audio asset id/);
  assert.throws(() => new AudioRegistry([entry({ url: "https://example.com/audio.ogg" })]), /must be relative/);
});

test("AudioRegistry enforces bytes, budget, checksum and dispose owner", () => {
  assert.throws(() => new AudioRegistry([entry({ metrics: {} })]), /metrics.bytes/);
  assert.throws(() => new AudioRegistry([entry({ budget: { bytes: 1000 } })]), /exceeds or lacks budget.bytes/);
  assert.throws(() => new AudioRegistry([entry({ sha256: "" })]), /sha256/);
  assert.throws(() => new AudioRegistry([entry({ disposeOwner: "" })]), /disposeOwner/);
});

test("AudioRegistry groups entries by preload and role", () => {
  const registry = new AudioRegistry([
    entry(),
    entry({ id: "dig-hit", url: "./assets/audio/dig-hit.ogg", preload: "common", role: "effect", loop: false })
  ]);
  assert.deepEqual(registry.byPreload("common").map(item => item.id), ["dig-hit"]);
  assert.deepEqual(registry.byRole("music").map(item => item.id), ["music-chlum"]);
});
