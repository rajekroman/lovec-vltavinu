# Performance Baseline v7.3

**Date:** 2026-08-30  
**Version:** 7.3.0  
**Measurement Type:** Automated runtime profiling via PerformanceMonitor  

## Test Environment

- Node.js 24
- Single-threaded unit test execution
- No external network
- Deterministic random seed for moldavite generation

## Baseline Metrics

### FPS / Frame Timing

| Metric | Target | Status | Notes |
|--------|--------|--------|-------|
| Average FPS | ≥60 desktop, ≥30 mobile | Baseline | Monitored via PerformanceMonitor.updateFrame() |
| Min FPS | >30 | TBD | Device testing required |
| Max frame time | <16.67ms (60 FPS target) | TBD | Device testing required |
| Frame drops (>25ms) | Count tracked | TBD | Mobile device profiling needed |

### Memory Profile

| Metric | Target | Status | Notes |
|--------|--------|--------|-------|
| Initial load | <30MB | TBD | Requires browser DevTools measurement |
| Peak memory | <50MB | TBD | After level transition cycle |
| Memory churn | <5MB/s | TBD | During active gameplay |
| Leak detection | No crescendo | TBD | 10min continuous play test |

### Load Times

| Phase | Target | Status | Notes |
|--------|--------|--------|-------|
| Initial load | <3s | TBD | HTML + assets download |
| Level transition | <500ms | TBD | Asset swap and scene setup |
| Offline mode | <2s | TBD | Service worker cache hit |

## Profiling Infrastructure

### PerformanceMonitor Class

Located in `src/core/PerformanceMonitor.js`

**Features:**
- Frame-by-frame FPS tracking with rolling average
- Min/Max FPS detection and frame drop counting
- JavaScript heap memory monitoring (via `performance.memory`)
- Custom performance marks and measures
- Phase-based load time recording
- Snapshot export for analysis

**API:**
```javascript
const monitor = new PerformanceMonitor();

// Track frame updates
monitor.updateFrame(deltaMs);

// Mark events
monitor.mark("levelStart");
monitor.mark("playerSpawn", { x: 120, y: 380 });

// Record load phase
monitor.recordLoadTime("bootstrap");

// Get current metrics
const metrics = monitor.getMetrics();

// Export full snapshot
const snapshot = monitor.snapshot();
```

**Unit Tests:** 6 tests in `tests/unit/performance-monitor.test.mjs`

## Manual Testing Checklist

### Desktop (1280×720)
- [ ] Chrome DevTools Performance tab: Full level playthrough
- [ ] Lighthouse Performance audit (target ≥75)
- [ ] Identify any frame drops during dig action
- [ ] Memory profile shows stable usage post-transition

### iPhone Portrait (390×844)
- [ ] 60 FPS stable during walk
- [ ] <30MB initial memory
- [ ] Smooth dig animation at 30+ FPS
- [ ] Orientation change doesn't spike memory

### iPhone Landscape (844×390)
- [ ] 30+ FPS maintained
- [ ] HUD doesn't cause layout thrashing
- [ ] Camera zoom smooth
- [ ] Memory stable after 5min play

### Performance Hotspots (to investigate if needed)

1. **Dig animation** — SpriteAnimator updates + particle system
2. **Level transitions** — Asset disposal and scene setup
3. **Walkability resolution** — Polygon point-in-polygon tests
4. **Dialogue animation** — Central GameApp coordination on fixed-step

## Integration Path

1. ✅ Create PerformanceMonitor class
2. ✅ Add unit tests (6 tests passing)
3. ⏳ Integrate into bootstrap.js (optional: runtime profiling)
4. ⏳ Run Lighthouse audit on deployed site
5. ⏳ Manual device profiling with Chrome DevTools
6. ⏳ Document findings and optimization targets

## Notes

- Automated memory profiling requires browser environment (`performance.memory`)
- Unit tests verify infrastructure but not real-world performance
- Device testing is the authoritative source for FPS/memory metrics
- Service worker caching effectiveness should be measured via Network tab
