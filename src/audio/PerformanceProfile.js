export const PERFORMANCE_BUDGET = Object.freeze({
  maxDpr: 2,
  targetInternalPixels: 1_800_000,
  longFrameMs: 50,
  sampleWindow: 120,
  textureMax: 1024,
  actorAtlasMax: 2048,
});

const PROFILES = Object.freeze({
  low: Object.freeze({
    id: "low",
    particleScale: 0.35,
    shadowMapSize: 0,
    lod: Object.freeze({ near: 180, medium: 380, far: 650 }),
    maxAnimatedActors: 8,
    maxDynamicLights: 0,
  }),
  medium: Object.freeze({
    id: "medium",
    particleScale: 0.65,
    shadowMapSize: 512,
    lod: Object.freeze({ near: 240, medium: 520, far: 820 }),
    maxAnimatedActors: 14,
    maxDynamicLights: 1,
  }),
  high: Object.freeze({
    id: "high",
    particleScale: 1,
    shadowMapSize: 1024,
    lod: Object.freeze({ near: 320, medium: 680, far: 1050 }),
    maxAnimatedActors: 22,
    maxDynamicLights: 2,
  }),
});

function positive(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function calculateAdaptiveDpr(options = {}) {
  const width = positive(options.width, 1);
  const height = positive(options.height, 1);
  const deviceDpr = positive(options.deviceDpr, 1);
  const maxDpr = positive(options.maxDpr, PERFORMANCE_BUDGET.maxDpr);
  const pixelBudget = positive(options.pixelBudget, PERFORMANCE_BUDGET.targetInternalPixels);
  const budgetDpr = Math.sqrt(pixelBudget / (width * height));
  return Math.max(1, Math.min(deviceDpr, maxDpr, budgetDpr));
}

export function selectPerformanceTier(options = {}) {
  const memory = positive(options.deviceMemory, 4);
  const cores = positive(options.hardwareConcurrency, 4);
  const reducedMotion = Boolean(options.reducedMotion);
  const saveData = Boolean(options.saveData);

  if (reducedMotion || saveData || memory <= 2 || cores <= 2) return "low";
  if (memory >= 6 && cores >= 6) return "high";
  return "medium";
}

export function createPerformanceProfile(options = {}) {
  const tier = options.tier ?? selectPerformanceTier(options);
  const base = PROFILES[tier] ?? PROFILES.medium;
  const dpr = calculateAdaptiveDpr(options);
  const width = positive(options.width, 1);
  const height = positive(options.height, 1);

  return Object.freeze({
    ...base,
    dpr,
    internalWidth: Math.max(1, Math.round(width * dpr)),
    internalHeight: Math.max(1, Math.round(height * dpr)),
    internalPixels: Math.max(1, Math.round(width * height * dpr * dpr)),
    textureMax: PERFORMANCE_BUDGET.textureMax,
    actorAtlasMax: PERFORMANCE_BUDGET.actorAtlasMax,
  });
}

export class PerformanceMonitor {
  constructor(options = {}) {
    this.longFrameMs = positive(options.longFrameMs, PERFORMANCE_BUDGET.longFrameMs);
    this.sampleWindow = Math.max(10, Math.round(positive(options.sampleWindow, PERFORMANCE_BUDGET.sampleWindow)));
    this.onSample = options.onSample ?? null;
    this.samples = [];
    this.totalFrames = 0;
    this.longFrames = 0;
    this.previousTimestamp = null;
  }

  frame(timestamp) {
    const current = Number(timestamp);
    if (!Number.isFinite(current)) return null;
    if (this.previousTimestamp === null) {
      this.previousTimestamp = current;
      return null;
    }

    const duration = Math.max(0, current - this.previousTimestamp);
    this.previousTimestamp = current;
    this.totalFrames += 1;
    if (duration >= this.longFrameMs) this.longFrames += 1;
    this.samples.push(duration);
    if (this.samples.length > this.sampleWindow) this.samples.shift();

    const sample = this.snapshot();
    this.onSample?.(sample);
    return sample;
  }

  snapshot() {
    const count = this.samples.length;
    const total = this.samples.reduce((sum, value) => sum + value, 0);
    const averageFrameMs = count ? total / count : 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p95Index = count ? Math.min(count - 1, Math.ceil(count * 0.95) - 1) : 0;
    const p95FrameMs = count ? sorted[p95Index] : 0;

    return Object.freeze({
      averageFrameMs,
      p95FrameMs,
      estimatedFps: averageFrameMs > 0 ? 1000 / averageFrameMs : 0,
      totalFrames: this.totalFrames,
      longFrames: this.longFrames,
      longFrameRatio: this.totalFrames ? this.longFrames / this.totalFrames : 0,
    });
  }

  reset() {
    this.samples.length = 0;
    this.totalFrames = 0;
    this.longFrames = 0;
    this.previousTimestamp = null;
  }
}
