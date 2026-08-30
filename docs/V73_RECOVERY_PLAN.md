# v7.3 Recovery Plan

Date: 2026-08-30
Branch: `claude/pokracovani-v-praci-xtyzsg`
PR: #328
Status: **BLOCKED — not launch-ready**

## Goal

Bring the original v7.3 issue scope to a defensible 100% state. An issue may be closed only when every original acceptance criterion is either:

1. implemented and backed by reproducible evidence, or
2. explicitly re-scoped in the issue with the removed criterion clearly documented and accepted.

Green CI alone is not sufficient for launch readiness where an issue explicitly requires manual device, visual, accessibility, audio, Lighthouse, or release evidence.

---

## Release gate

PR #328 must remain **draft / BLOCKED** until all of the following are true:

- [ ] `npm run validate` passes with 0 errors and 0 warnings.
- [ ] Full unit suite passes.
- [ ] All Playwright projects required by the release matrix pass on the same frozen head SHA.
- [ ] No P0/P1 issues remain open.
- [ ] All v7.3 issues are either 100% complete or explicitly re-scoped.
- [ ] Required manual evidence is attached to the relevant issue or release evidence document.
- [ ] QA matrix contains only measured PASS values; untested combinations are marked `NOT TESTED` / `BLOCKED`.
- [ ] Performance, accessibility and PWA Lighthouse evidence is recorded on the same candidate SHA.
- [ ] Safari macOS and Safari iOS requirements are satisfied with real-device evidence where the original issue requires it.
- [ ] Marketing/release artifacts required by #278/#279 exist in the repository/release.
- [ ] Final launch checklist is re-run against the frozen candidate SHA.

---

# Phase 0 — Restore truthful governance

## #280 Production QA matrix — P0 governance blocker

### Current gap
`QA_MATRIX.md` currently contains PASS values for browsers/devices without attached execution evidence while its own manual sign-off checklist remains incomplete.

### Fix
- Replace unsupported PASS cells with `NOT TESTED` or `BLOCKED`.
- Add columns/links for evidence: run ID, browser/device, OS, tester, date, screenshot/video/report.
- Separate automated engine coverage from real-device coverage.
- Require all final PASS rows to reference an evidence artifact.

### Files
- `QA_MATRIX.md`
- optional `docs/evidence/v7.3/README.md`

### DoD
- Matrix contains no unproven PASS values.
- Every PASS points to reproducible evidence.
- Manual sign-off section matches the matrix state.

## #281 Soft launch / monitoring — P0 governance blocker

### Current gap
The issue was previously closed while launch preconditions were not met.

### Fix
- Convert checklist claims from assumed PASS to evidence-backed state.
- Add frozen candidate SHA field.
- Add explicit release decision: PASS/BLOCK.
- Do not mark deployment, release creation, monitoring or first-hour checks complete before they happen.

### Files
- `LAUNCH_CHECKLIST.md`

### DoD
- Checklist distinguishes pre-launch preparation from executed launch evidence.
- Final release decision references one frozen SHA and complete QA evidence.

---

# Phase 1 — Make CI deterministically green

## #272 Cross-browser automation — P0 code/CI blocker

### Current gaps
- Historical `desktop-firefox` failures on GPU-less GitHub runners.
- Current expanded WebKit coverage exposed failures that must be debugged, not ignored.
- Real Safari coverage is still separate manual evidence.

### Work
1. Fix current failing unit/static tests on PR #328 head.
2. Stabilize `desktop-firefox` using Xvfb + Mesa/llvmpipe without weakening assertions.
3. Stabilize `desktop-webkit` and `iphone-webkit`.
4. Keep full `iphone-portrait` and `iphone-landscape` active on PRs.
5. Ensure all browser projects use the same gameplay assertions where technically applicable.
6. Capture console errors and fail tests on unexpected runtime errors.

### Files
- `.github/workflows/validate.yml`
- `playwright.config.mjs`
- affected tests under `tests/`
- runtime files identified by failures

### Required automated matrix
- desktop-chromium
- desktop-firefox
- desktop-webkit
- offline-chromium
- audio-lifecycle-chromium
- iphone-portrait
- iphone-portrait-smoke
- iphone-landscape
- iphone-webkit

### DoD
- All required projects green on one candidate SHA.
- No skipped release-critical project on pull requests.
- Unexpected console errors fail the relevant smoke test.

---

# Phase 2 — Audio completion

## #276 Audio assets — P0 scope blocker

### Original gaps to close

#### Dig
- hard soil impact
- wet soil impact
- stone impact
- C/B/A success chimes
- failed dig/miss

#### Danger
- Chlum tractor warning
- Nesměň forester warning
- Besednice drought warning
- Slavia guard warning
- damage taken

#### Ambient
- Chlum loop
- Nesměň loop
- Besednice loop
- Slavia loop

#### UI
- button click
- menu open
- menu close
- tutorial beep
- level complete
- game over

### Pipeline requirements
- Correct MP3 bitrate/sample rate according to issue.
- Normalized level / no clipping.
- Gentle fades where required.
- Total audio budget <5 MB.
- Registry metadata complete.
- Async decode/no mobile lag.

### Files / areas
- `assets/audio/**`
- `assets/manifests/assets.json`
- audio registry/engine modules
- `sw.js`
- audio tests

### Evidence
- codec/bitrate/duration/size table
- automated registry validation
- desktop headphones manual listen-through
- mobile speaker + headphones listen-through
- loop transition test
- no pop/clipping confirmation

### DoD
All non-optional assets listed in #276 exist, validate, play correctly, fit budget, and have manual QA evidence.

## #269 Audio event integration — follows #276

### Remaining gaps
- Correct context-sensitive selection for dig variants.
- Rarity-specific success/finding audio.
- Location-specific danger sound.
- Location-specific ambient loop.
- Fade out → scene switch → fade in behavior.
- UI audio hooks in `ScreenController`.
- Full-flow gesture/lifecycle proof including mobile/iOS behavior.

### Files / areas
- `src/grid/GridScene.js`
- `src/audio/**`
- `src/ui/ScreenController.js`
- scene transition orchestration
- Playwright audio lifecycle tests

### DoD
Every hook in #269 maps to the correct sound with context payload, scene cleanup is clean, and smoke/manual tests show no lag or warnings.

---

# Phase 3 — PWA and offline completion

## #274 PWA manifest & offline support — P0/P1 launch blocker

### Remaining implementation gaps
- Install UX on Android Chrome.
- iOS Add-to-Home-Screen guidance.
- Splash/app-mode behavior.
- Verify complete static asset coverage.
- Graceful mid-game network loss.
- Cache size measurement and enforcement (<20 MB).

### Required evidence
- Lighthouse PWA score >=90.
- Real Android install → launch → offline replay.
- Real iPhone install → launch → offline replay.
- Manifest validation.
- Correct manifest Content-Type on deployed URL.
- Service worker registration evidence.
- Cached audio playback evidence.
- 0 relevant console warnings.

### Files / areas
- `manifest.webmanifest`
- `sw.js`
- `index.html`
- install UX module/UI
- `tests/offline-smoke.spec.mjs`
- CI validation script for cache budget

### DoD
Game is installable and fully playable offline on both iOS and Android with documented proof and Lighthouse target met.

---

# Phase 4 — UI/UX, accessibility, performance

## #275 UI/UX polish — P1

### Remaining gaps
- Objective progress animation.
- timer typography verification.
- minimap/radar smoothness proof.
- dialogue entrance/portrait/text readability requirements.
- loading spinner/progress state.
- >10 s timeout/error handling.
- complete mobile safe-area / target-size proof.
- manual desktop/mobile/tablet/retina review.
- measurable CLS/performance evidence.

### Automated checks
- CSS/DOM contract tests for touch target sizes and focus states.
- reduced-motion smoke test.
- visual overflow assertions at 390×844 and 844×390.
- loading timeout behavior test.

### Manual evidence
- 1280×720 desktop.
- 390×844 portrait.
- 844×390 landscape.
- small phone/tablet/retina review.

### DoD
All original UI checklist items are implemented or explicitly re-scoped, with no clipped controls and verified motion/accessibility behavior.

## #273 Accessibility — P0/P1

### Required work/evidence
- Audit all required ARIA labels/roles/live regions.
- Keyboard-only full playthrough.
- Focus visibility and no keyboard traps.
- WCAG AA contrast validation.
- Lighthouse accessibility >=90.
- WAVE 0 critical errors.
- axe automated pass for applicable screens.
- VoiceOver macOS/iOS and/or NVDA Windows manual sign-off as required by issue.
- Screen-reader announcements for level intro, dialogue, findings, danger and results.

### Files / areas
- `index.html`
- `src/ui/**`
- screen controller and dialogue/HUD components
- accessibility smoke tests
- evidence document

### DoD
Original #273 Definition of Done is fully evidenced.

## #271 Performance — P0/P1

### Measurements
- Desktop FPS full-flow.
- Mobile FPS.
- FCP/LCP/CLS.
- initial load <3 s.
- level transition <500 ms.
- memory at start, after each transition, after 10 min.
- draw calls / hotspots.
- event-listener and asset disposal audit.

### Required fix
At least one measured major bottleneck must be identified and fixed, as explicitly required by the issue.

### Evidence
- before/after performance report
- screenshots or exported traces
- Lighthouse report
- memory graph showing no crescendo

### DoD
Targets in #271 are measured, documented and met on candidate SHA.

---

# Phase 5 — Localization

## #277 Czech/English i18n — P0 scope/governance decision

### Conflict requiring explicit decision
The original issue requires `localStorage` persistence for language choice, while the current architecture/governance forbids new runtime persistence for gameplay/session state. Do not silently implement persistence in violation of the architecture contract.

### Required resolution
Choose and document one of these paths in #277:

**A. Re-scope persistence only**
- Keep language selection session-only/in-memory.
- Explicitly amend #277 acceptance criteria.

**B. Permit preference-only persistence**
- Amend architecture contract to explicitly allow non-gameplay UI preference persistence while continuing to prohibit save/gameplay persistence.
- Then implement locale preference storage.

### Implementation still required either way
- `src/i18n/i18n.js`
- complete Czech and English resource files
- title, level intros, all NPC dialogue, HUD, objectives, settings, gameplay feedback, results
- immediate language switching
- overflow checks
- UTF-8 validation
- full playthrough in both languages
- Czech and English language review

### DoD
No hard-coded player-facing string remains outside approved exceptions; both languages complete a full flow and the persistence decision is governance-consistent.

---

# Phase 6 — Marketing and release documentation

## #278 Marketing assets & metadata — P1

### Remaining assets
- 192×192 icon verified.
- 512×512 icon verified.
- 16×16 favicon + `favicon.ico`.
- 180×180 Apple Touch Icon.
- 4–5 desktop screenshots 1280×720.
- 4–5 mobile portrait screenshots 1080×1920.
- landscape marketing screenshots 1920×1080.
- dedicated 1200×630 Open Graph image.
- logo variants and documented palette/typography.
- high-DPI exports.

### Folder structure
- `assets/marketing/icons/`
- `assets/marketing/screenshots/`
- `assets/marketing/social/`

### Release evidence
GitHub Release must include the required screenshots and metadata when release is actually created.

### DoD
Every mandatory asset in #278 exists at the required dimensions, is visually reviewed, linked correctly, and included in release evidence.

## #279 Documentation & release notes — P1

### Required work
- README playable link + v7.3 screenshots.
- current gameplay/control description.
- PWA/offline/audio instructions.
- accessibility/localization/mobile feature documentation.
- credits.
- complete `CHANGELOG.md` v7.3 entry.
- tested `DEPLOYMENT_GUIDE.md`.
- updated `CONTRIBUTING.md`.
- architecture/project-control updates where required.
- in-game help coverage including language/accessibility.
- final v7.3 GitHub Release notes published only at release time.

### DoD
Documentation can be followed from scratch, contains no broken links or false feature claims, and release notes exist on GitHub for the actual released SHA.

---

# Phase 7 — Cross-browser real-device certification

## #272 manual certification

Automation with WebKit is regression coverage, **not proof of Safari acceptance criteria**.

### Required manual runs
- Safari latest on macOS: WebGL, audio initialization, CSS/layout, trackpad interaction, console.
- Safari iOS real device: full playthrough, gesture audio, viewport, safe area, orientation, no iOS-specific blocker.
- Chrome latest desktop.
- Firefox latest desktop.
- Android Chrome full mobile flow.
- Android Firefox/Samsung Internet when available; if unavailable, explicitly mark and re-scope the `if possible` item.

### Evidence template
For every manual run record:
- candidate SHA
- date/time
- device
- OS version
- browser/version
- scenarios completed
- console result
- screenshots/video
- PASS/BLOCK

### DoD
Compatibility matrix is fully evidenced and no P0 remains; all P1 defects have separate issues and release disposition.

---

# Phase 8 — Final release certification

1. Freeze candidate SHA.
2. Re-run complete static/unit/browser CI on that exact SHA.
3. Run Lighthouse performance/PWA/accessibility against candidate/deployed preview.
4. Complete real-device matrix.
5. Complete audio listen-through.
6. Complete visual review.
7. Complete both-language full flow.
8. Verify no open P0/P1.
9. Update all issues with evidence links and close only those that satisfy/re-scope every criterion.
10. Update `QA_MATRIX.md` and `LAUNCH_CHECKLIST.md` to final evidence-backed state.
11. Mark PR #328 ready for review only after the gate is green.
12. Merge only after explicit approval.
13. Verify GitHub Pages deployment.
14. Run production 5-minute smoke.
15. Create `v7.3.0` release/tag and attach required release notes/screenshots.
16. Record production SHA and deployment evidence.

---

# Recommended execution order

1. **Fix current CI failures** (#272 + unit/static regression).
2. **Correct QA/launch documents** (#280/#281) so they stop overstating status.
3. **Complete audio assets + hooks** (#276 → #269).
4. **Complete PWA/install/offline** (#274).
5. **Finish accessibility + UI polish + performance** (#273/#275/#271).
6. **Resolve localization governance and implement i18n** (#277).
7. **Generate marketing assets and finish docs** (#278/#279).
8. **Run real-device/browser/manual evidence matrix** (#272 and dependent DoDs).
9. **Freeze SHA and execute final release certification**.

---

# Issue status policy

Until the corresponding DoD above is met:

- #269 — OPEN / PARTIAL
- #270 — verify evidence before final release sign-off
- #271 — OPEN / BLOCKED
- #272 — OPEN / IN PROGRESS
- #273 — OPEN / BLOCKED
- #274 — OPEN / PARTIAL
- #275 — OPEN / PARTIAL
- #276 — OPEN / BLOCKED
- #277 — OPEN / BLOCKED pending governance decision
- #278 — OPEN / PARTIAL
- #279 — OPEN / BLOCKED
- #280 — OPEN / BLOCKED until matrix is evidence-backed
- #281 — OPEN / BLOCKED until final release gate is complete
- #286 — CLOSED / PASS unless regression is found

## Non-negotiable rule

Do **not** convert missing manual evidence into PASS merely because CI is green. Do **not** defer original mandatory acceptance criteria to v7.4 while closing the v7.3 issue as `completed`; instead either finish the work or explicitly re-scope the issue before closure.
