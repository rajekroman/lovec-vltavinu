# V7.3 Blocking Issues Summary

**Date:** 21. srpna 2026  
**Status:** Critical path analysis for launch  
**Target launch:** 1.5-2 weeks (dependent on blocking resolution)

## Overview

V7.3 is **67% complete** with 3 critical blockers preventing launch. All core gameplay is functional (252/252 tests passing), but visual design and asset pipelines need completion.

## Blocking Issues (Must Fix Before Launch)

### 🔴 Issue 1: Grid Level Visual Design (Issue #275 - Phase 2D)
**Severity:** HIGH  
**Impact:** User-facing visual quality  
**Status:** BLOCKED on asset generation

#### Problem
Chlum and other grid levels are missing foreground asset sprites (trees, stones, vegetation). This creates a visual gap between the V7 design system and grid gameplay experience.

#### Current State
- ✅ Phase 2A: Character sprites (NPC atlases) — COMPLETE
- ✅ Phase 2B: Animation sequences — COMPLETE  
- ✅ Phase 2C: UI screens & HUD — COMPLETE
- ❌ Phase 2D: Location foreground assets — **MISSING**

#### Deliverables Needed
```
assets/sprites/foreground/
├── chlum-field.png           (4 sprites: solitary tree, stone, grass, distant tree)
├── nesmen-flora.png          (4 sprites: tall pine, dark bush, fallen log, moss stone)
├── besednice-geology.png     (4 sprites: rock face, stone pile, boulder, quarry wall)
└── slavia-architecture.png   (4 sprites: building, door, flag pole, bench)
```

Total budget: ~185 KB (within performance allowance)

#### Resolution Path
1. Extract Claude Design artboards to PNG sprites
2. Create sprite metadata manifest (atmospheric perspective, collision bounds)
3. Extend GridSceneVisuals with foreground rendering layer
4. Integrate into GridScene lifecycle
5. Test on mobile devices

**Effort:** 3-4 hours (with design assets ready)  
**Blocker for:** Visual parity with design system  
**Reference:** PHASE_2D_FOREGROUND_ASSETS.md

---

### 🔴 Issue 2: Audio Asset Compression (Issue #276)
**Severity:** HIGH  
**Impact:** Performance, file size, gameplay audio feedback  
**Status:** BLOCKED on local tool (ffmpeg)

#### Problem
22 audio files (8.7 MB WAV + 55 KB SFX) need compression to meet performance budget. Current inventory:
- 7 music files (WAV format, 8.7 MB total)
- 12 SFX files (WAV format, 55 KB total)
- 4 existing MP3 files (9.6 KB, already optimized)

#### Current State
- ✅ Inventory complete (22 files catalogued)
- ✅ Conversion strategy documented (192 kbps music, 128 kbps SFX)
- ✅ Manifest entry schema ready
- ❌ Actual MP3 conversion — **REQUIRES LOCAL FFMPEG**

#### Deliverables Needed
```bash
# Convert with ffmpeg (local execution required)
ffmpeg -i audio/music/*.wav -b:a 192k -c:a libmp3lame audio/music/*.mp3
ffmpeg -i audio/sfx/*.wav -b:a 128k -c:a libmp3lame audio/sfx/*.mp3
```

Expected result: 8.76 MB → ~1.93 MB (78% reduction)

#### Resolution Path
1. Run ffmpeg conversion locally (remote environment lacks ffmpeg)
2. Commit compressed MP3 files
3. Update assets.json with all audio entries + SHA256
4. Update service worker cache list
5. Run validation to verify budget

**Effort:** 1-2 hours (with ffmpeg available)  
**Blocker for:** Performance budget compliance  
**Reference:** AUDIO_INTEGRATION_PLAN.md

---

### 🔴 Issue 3: Accessibility Full Audit (Issue #273)
**Severity:** HIGH  
**Impact:** WCAG 2.1 AA compliance verification  
**Status:** SUBSTANTIAL progress, needs verification

#### Problem
47 ARIA attributes are in place, but full audit is pending. Need:
- Lighthouse audit confirmation
- NVDA/VoiceOver testing
- Contrast verification
- Keyboard navigation testing

#### Current State
- ✅ 47 ARIA attributes implemented
- ✅ Semantic HTML (role="dialog", aria-modal)
- ✅ Keyboard support (Tab, Enter, Escape)
- ✅ Focus management
- ✅ High contrast mode available
- ✅ Large text mode available
- ✅ Colorblind modes (4 variants)
- ❌ Full Lighthouse audit — **NEEDS VERIFICATION**
- ❌ NVDA/VoiceOver testing — **NEEDS DEVICE**

#### Resolution Path
1. Run Lighthouse audit (Performance, Accessibility, Best Practices, SEO)
2. Test on screen reader (NVDA on Windows, VoiceOver on Mac/iOS)
3. Verify WCAG 2.1 AA contrast ratios
4. Test keyboard-only navigation
5. Document audit results

**Effort:** 2-3 hours (with proper tools/devices)  
**Blocker for:** Launch confidence, legal compliance  
**Reference:** V73_STATUS.md §Accessibility

---

## Secondary Blockers (Important, Not Critical)

### 🟡 Issue 4: Mobile QA Matrix (Issue #280)
**Status:** Not started  
**Impact:** Cross-device compatibility  
**Effort:** 4-6 hours

Test plan across:
- iPhone (portrait + landscape)
- Android (portrait + landscape)
- Desktop (Chrome, Firefox, Safari)

### 🟡 Issue 5: Documentation (Issue #279)
**Status:** Partially complete  
**Impact:** Launch communication  
**Effort:** 2-3 hours

- [ ] README update
- [ ] CHANGELOG generation
- [ ] Deployment guide
- [ ] Release notes

### 🟡 Issue 6: Launch & Monitoring (Issue #281)
**Status:** Planning only  
**Impact:** Deployment success  
**Effort:** 2-3 hours

- [ ] GitHub Pages deployment
- [ ] Analytics setup
- [ ] Error monitoring
- [ ] Hotfix protocol

---

## Critical Path to Launch

```
Week 1 (This week):
├── Resolve Issue #275 (Phase 2D) — 3-4 hours
├── Resolve Issue #276 (Audio) — 1-2 hours (local execution)
└── Resolve Issue #273 (Accessibility audit) — 2-3 hours
    └── Target: All blockers resolved by end of week

Week 2:
├── Mobile QA (Issue #280) — 4-6 hours
├── Documentation (Issue #279) — 2-3 hours
└── Launch prep (Issue #281) — 2-3 hours
    └── Target: Launch ready

Week 3:
└── Soft launch on GitHub Pages with monitoring
```

## Dependency Graph

```
Phase 2D (Foreground Assets)
  ├── needs: Design asset extraction
  └── enables: Visual parity with design system

Audio Compression
  ├── needs: ffmpeg (local execution)
  └── enables: Performance budget compliance

Accessibility Audit
  ├── needs: Lighthouse + screen reader testing
  └── enables: WCAG 2.1 AA verification

Mobile QA
  ├── depends on: Phase 2D assets (visual testing)
  ├── depends on: Audio compression (playback testing)
  └── enables: Launch confidence

Documentation
  ├── depends on: All features complete
  └── enables: Release communication

Launch
  ├── depends on: All blockers resolved
  ├── depends on: Mobile QA passed
  └── enables: v7.3 release
```

## Current Metrics

| Item | Status | Value |
|------|--------|-------|
| Tests passing | ✅ | 252/252 |
| Validation errors | ✅ | 0 |
| Validation warnings | ✅ | 0 |
| Levels implemented | ✅ | 4/4 |
| NPC animations | ✅ | 5 characters |
| ARIA attributes | ✅ | 47 |
| PWA support | ✅ | Complete |
| Phase 2D assets | ❌ | 0/4 locations |
| Audio compression | ❌ | 0/22 files |
| Accessibility audit | ⚠️ | Needs verification |

## Action Items

### Immediate (Next 24 hours)
- [ ] Confirm Phase 2D asset requirements with design team
- [ ] Schedule local audio compression session
- [ ] Plan accessibility audit (tools + devices)

### This week
- [ ] Complete Phase 2D foreground asset generation
- [ ] Compress all audio files to MP3
- [ ] Run Lighthouse audit + screen reader testing
- [ ] Update assets.json with all new entries
- [ ] Verify all tests still pass

### Next week
- [ ] Complete mobile QA matrix
- [ ] Finalize documentation
- [ ] Deploy to GitHub Pages
- [ ] Configure monitoring & analytics

## Risk Assessment

### No-Go Blockers
None identified — all issues are solvable with available resources

### High Risk
- 🔴 **Phase 2D asset generation** — Depends on design asset availability
- 🔴 **Audio compression timeline** — Requires local ffmpeg session
- 🔴 **Accessibility verification** — Needs proper testing devices/software

### Medium Risk
- 🟡 **Mobile QA completion** — Time-intensive manual testing
- 🟡 **Launch window** — 1.5-2 week target is aggressive

## Launch Readiness

**Current:** 67% complete  
**Minimum for launch:** 90% (all blockers + QA resolved)  
**Estimated after blockers:** 85-90%  
**Launch confidence:** 💚 GREEN (if blockers resolved on schedule)

---

**Prepared by:** Claude (Haiku 4.5)  
**Date:** 21. srpna 2026  
**Branch:** claude/v73-accessibility-pwa-dokončit  
**PR:** #289 (draft)
