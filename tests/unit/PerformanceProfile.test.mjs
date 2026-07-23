import test from "node:test";
import assert from "node:assert/strict";
import {
  PERFORMANCE_BUDGET,
  PerformanceMonitor,
  calculateAdaptiveDpr,
  createPerformanceProfile,
  selectPerformanceTier,
} from "../../src/audio/PerformanceProfile.js";

test("adaptive DPR never exceeds device, contract or internal pixel limits", () => {
  const dpr = calculateAdaptiveDpr({ width: 1179, height: 2556, deviceDpr: 3 });
  assert.ok(dpr >= 1);
  assert.ok(dpr <= PERFORMANCE_BUDGET.maxDpr);
  assert.ok(1179 * 2556 * dpr * dpr <= PERFORMANCE_BUDGET.targetInternalPixels + 1);
});

test("performance tier reacts to constrained hardware and accessibility preferences", () => {
  assert.equal(selectPerformanceTier({ deviceMemory: 2, hardwareConcurrency: 8 }), "low");
  assert.equal(selectPerformanceTier({ deviceMemory: 8, hardwareConcurrency: 8 }), "high");
  assert.equal(selectPerformanceTier({ reducedMotion: true, deviceMemory: 8, hardwareConcurrency: 8 }), "low");
  assert.equal(selectPerformanceTier({ deviceMemory: 4, hardwareConcurrency: 4 }), "medium");
});

test("created profile exposes renderer-ready dimensions and LOD limits", () => {
  const profile = createPerformanceProfile({
    width: 844,
    height: 390,
    deviceDpr: 3,
    deviceMemory: 4,
    hardwareConcurrency: 4,
  });

  assert.equal(profile.id, "medium");
  assert.ok(profile.dpr <= 2);
  assert.equal(profile.internalWidth, Math.round(844 * profile.dpr));
  assert.equal(profile.internalHeight, Math.round(390 * profile.dpr));
  assert.ok(profile.internalPixels <= PERFORMANCE_BUDGET.targetInternalPixels + 1);
  assert.ok(profile.lod.near < profile.lod.medium);
  assert.ok(profile.lod.medium < profile.lod.far);
});

test("PerformanceMonitor reports average FPS and long-frame ratio", () => {
  const monitor = new PerformanceMonitor({ longFrameMs: 40, sampleWindow: 10 });
  monitor.frame(0);
  monitor.frame(16);
  monitor.frame(32);
  const sample = monitor.frame(82);

  assert.equal(sample.totalFrames, 3);
  assert.equal(sample.longFrames, 1);
  assert.equal(sample.longFrameRatio, 1 / 3);
  assert.ok(sample.averageFrameMs > 0);
  assert.ok(sample.estimatedFps > 0);
  assert.equal(sample.p95FrameMs, 50);
});
