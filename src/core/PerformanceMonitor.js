/**
 * PerformanceMonitor — Runtime FPS, memory and load time tracking
 * Collects metrics for v7.3 release performance baseline
 */

export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.frameTime = 0;
    this.fps = 60;
    this.startTime = performance.now();
    this.marks = new Map();
    this.metrics = {
      loadTime: null,
      initialMemory: null,
      peakMemory: null,
      currentMemory: null,
      avgFps: 60,
      minFps: 60,
      maxFps: 60,
      frameDrops: 0
    };
  }

  mark(name, value = null) {
    const now = performance.now();
    if (!this.marks.has(name)) {
      this.marks.set(name, []);
    }
    this.marks.get(name).push({ time: now, value });
  }

  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    return measure?.duration ?? null;
  }

  updateFrame(deltaMs) {
    this.frameCount++;
    this.frameTime += deltaMs;

    const targetFrameTime = 1000 / 60;
    const actualFps = 1000 / (deltaMs || targetFrameTime);

    this.metrics.avgFps = (this.metrics.avgFps * 0.9) + (actualFps * 0.1);
    this.metrics.minFps = Math.min(this.metrics.minFps, actualFps);
    this.metrics.maxFps = Math.max(this.metrics.maxFps, actualFps);

    if (deltaMs > targetFrameTime * 1.5) {
      this.metrics.frameDrops++;
    }

    if (this.frameCount % 60 === 0) {
      this.updateMemory();
    }
  }

  updateMemory() {
    if (!performance.memory) return;

    const usedMemory = performance.memory.usedJSHeapSize / 1048576;
    this.metrics.currentMemory = usedMemory;

    if (!this.metrics.initialMemory) {
      this.metrics.initialMemory = usedMemory;
    }

    if (!this.metrics.peakMemory || usedMemory > this.metrics.peakMemory) {
      this.metrics.peakMemory = usedMemory;
    }
  }

  recordLoadTime(phase) {
    const elapsed = performance.now() - this.startTime;
    this.metrics.loadTime = { phase, elapsed };
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: performance.now() - this.startTime,
      frameCount: this.frameCount,
      markCounts: Object.fromEntries(
        Array.from(this.marks.entries()).map(([name, entries]) => [name, entries.length])
      )
    };
  }

  snapshot() {
    return {
      timestamp: performance.now(),
      metrics: this.getMetrics(),
      performanceEntries: {
        marks: Array.from(this.marks.keys()),
        measures: performance.getEntriesByType("measure").map(m => ({
          name: m.name,
          duration: m.duration
        }))
      }
    };
  }

  reset() {
    this.frameCount = 0;
    this.frameTime = 0;
    this.metrics = {
      loadTime: null,
      initialMemory: null,
      peakMemory: null,
      currentMemory: null,
      avgFps: 60,
      minFps: 60,
      maxFps: 60,
      frameDrops: 0
    };
  }
}

export const createPerformanceMonitor = () => new PerformanceMonitor();
