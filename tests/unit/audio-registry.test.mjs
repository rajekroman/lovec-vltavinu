import test from "node:test";
import assert from "node:assert/strict";
import { AudioRegistry } from "../../src/audio/AudioRegistry.js";

function entry(overrides = {}) {
  return {
    id: "audio-music-journey",
    type: "audio",
    url: "./assets/audio/journey-loop.mp3",
    preload: "audio:gesture",
    role: "music",
    loop: true,
    volume: 0.34,
    metrics: { bytes: 4354 },
    budget: { bytes: 8192 },
    sha256: "79bbca2ade8875a767cbcca1baec2e66384aa3c75e4c8887066dc531bab21d04",
    disposeOwner: "AudioEngine",
    license: {
      spdx: "CC0-1.0",
      source: "Project-original procedural synthesis; no external samples.",
      notice: "./assets/audio/LICENSE.md"
    },
    ...overrides
  };
}

test("AudioRegistry imports only audio manifest entries", () => {
  const registry = AudioRegistry.fromManifest([
    entry(),
    { id: "texture", type: "texture", url: "./assets/x.png" }
  ]);
  assert.equal(registry.snapshot().length, 1);
  assert.equal(registry.require("audio-music-journey").role, "music");
});

test("AudioRegistry rejects duplicate ids and non-relative URLs", () => {
  assert.throws(() => new AudioRegistry([entry(), entry()]), /Duplicate audio asset id/);
  assert.throws(() => new AudioRegistry([entry({ url: "https://example.com/audio.mp3" })]), /must be relative/);
});

test("AudioRegistry enforces bytes, budget, checksum, owner and license", () => {
  assert.throws(() => new AudioRegistry([entry({ metrics: {} })]), /metrics.bytes/);
  assert.throws(() => new AudioRegistry([entry({ budget: { bytes: 1000 } })]), /exceeds or lacks budget.bytes/);
  assert.throws(() => new AudioRegistry([entry({ sha256: "abc123" })]), /64 lowercase hex/);
  assert.throws(() => new AudioRegistry([entry({ disposeOwner: "" })]), /disposeOwner/);
  assert.throws(() => new AudioRegistry([entry({ license: null })]), /license metadata/);
  assert.throws(() => new AudioRegistry([entry({ license: { spdx: "CC0-1.0", source: "project" } })]), /license.notice/);
});

test("AudioRegistry groups entries by preload and role", () => {
  const registry = new AudioRegistry([
    entry(),
    entry({
      id: "audio-sfx-dig-hit",
      url: "./assets/audio/dig-hit.mp3",
      role: "effect",
      loop: false,
      metrics: { bytes: 1010 },
      budget: { bytes: 4096 },
      sha256: "32cd46cd2d1e509fb1e162e9eb005f2bbf9b6bf6542fdbd64dcab2ac08197ea3"
    })
  ]);
  assert.deepEqual(registry.byPreload("audio:gesture").map(item => item.id), ["audio-music-journey", "audio-sfx-dig-hit"]);
  assert.deepEqual(registry.byRole("music").map(item => item.id), ["audio-music-journey"]);
});
