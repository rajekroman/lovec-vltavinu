import test from "node:test";
import assert from "node:assert/strict";
import { PerformanceMonitor } from "../../src/core/PerformanceMonitor.js";

test("PerformanceMonitor tracks frame time and FPS", () => {
  const monitor = new PerformanceMonitor();

  // Simulate 60 frames at 16.67ms each (60 FPS)
  for (let i = 0; i < 60; i++) {
    monitor.updateFrame(16.67);
  }

  const metrics = monitor.getMetrics();
  assert.ok(metrics.avgFps > 58, "Average FPS should be close to 60");
  assert.equal(metrics.frameCount, 60);
  assert.equal(metrics.frameDrops, 0, "No frame drops at target framerate");
});

test("PerformanceMonitor detects frame drops", () => {
  const monitor = new PerformanceMonitor();

  // Simulate normal frames
  for (let i = 0; i < 59; i++) {
    monitor.updateFrame(16.67);
  }

  // Simulate a frame drop (>25ms)
  monitor.updateFrame(33.34);

  const metrics = monitor.getMetrics();
  assert.equal(metrics.frameDrops, 1, "Should detect one frame drop");
});

test("PerformanceMonitor marks and measures events", () => {
  const monitor = new PerformanceMonitor();

  monitor.mark("levelStart");
  monitor.mark("levelStart", { scene: "chlum" });
  monitor.mark("levelStart", { scene: "nesmen" });
  monitor.mark("playerSpawn");

  const metrics = monitor.getMetrics();
  assert.equal(metrics.markCounts.levelStart, 3, "Should have 3 levelStart marks");
  assert.equal(metrics.markCounts.playerSpawn, 1, "Should have 1 playerSpawn mark");
});

test("PerformanceMonitor tracks load time phase", () => {
  const monitor = new PerformanceMonitor();

  monitor.recordLoadTime("bootstrap");
  const metrics = monitor.getMetrics();

  assert.ok(metrics.loadTime.phase === "bootstrap");
  assert.ok(metrics.loadTime.elapsed > 0);
});

test("PerformanceMonitor returns snapshot with all data", () => {
  const monitor = new PerformanceMonitor();

  monitor.updateFrame(16.67);
  monitor.mark("test");
  monitor.recordLoadTime("init");

  const snapshot = monitor.snapshot();
  assert.ok(snapshot.timestamp);
  assert.ok(snapshot.metrics);
  assert.ok(snapshot.performanceEntries);
  assert.ok(Array.isArray(snapshot.performanceEntries.marks));
});

test("PerformanceMonitor reset clears metrics", () => {
  const monitor = new PerformanceMonitor();

  monitor.updateFrame(16.67);
  monitor.updateFrame(16.67);
  assert.equal(monitor.getMetrics().frameCount, 2);

  monitor.reset();
  assert.equal(monitor.getMetrics().frameCount, 0);
  assert.equal(monitor.getMetrics().avgFps, 60);
  assert.equal(monitor.getMetrics().frameDrops, 0);
});
