# v7.3 Launch Readiness Audit

Audit date: 2026-08-30
Branch: `claude/pokracovani-v-praci-xtyzsg`
PR: #328

## Decision

**BLOCK — not 100% launch-ready.**

The previous launch report treated partial/MVP work, unchecked manual acceptance criteria and unverified QA rows as completed. Green unit/smoke tests alone are not sufficient evidence for the original v7.3 issue definitions of done.

## Issue audit

| Issue | Audit status | Reason |
|---|---|---|
| #269 Audio event integration | PARTIAL / OPEN | Core event wiring exists, but the original checklist requires multiple dig variants, rarity-specific success/finding audio, location-specific danger/ambient sounds, UI sounds, fades and manual/full-flow evidence. |
| #270 Mobile stability | PROVISIONAL PASS | Existing implementation/test claims are consistent with the mobile smoke coverage; keep subject to final device evidence. |
| #271 Performance profiling | FAIL / REOPENED | Original DoD requires documented baseline screenshots, Lighthouse/mobile profiling, memory graphs and a measured/fixed bottleneck. No such evidence justified `completed`. |
| #272 Cross-browser | PARTIAL / REOPENED | Chromium works; Firefox CI was failing. PR #328 now uses Xvfb/llvmpipe and adds WebKit desktop+iPhone regression coverage. Original issue still explicitly requires real Safari macOS/iOS manual testing and completed compatibility matrix. |
| #273 Accessibility | FAIL / REOPENED | Original DoD requires Lighthouse >=90, WAVE 0 critical errors, NVDA/VoiceOver testing and keyboard-only playthrough evidence. No evidence was attached when closed. |
| #274 PWA/offline | PARTIAL / OPEN | Cache/version strategy exists, but original DoD also requires Lighthouse PWA >=90, real iOS/Android installability, offline playthrough, cache <20MB and 0 console warnings. |
| #275 UI/UX polish | PARTIAL / OPEN | Animation work exists, but original issue also requires loading/progress/error states, full HUD/dialogue polish, Lighthouse metrics and manual desktop/mobile/retina review. |
| #276 Audio assets | FAIL / REOPENED | Issue asks for the complete SFX/ambient/UI asset set and QA. Only four core files were supplied and the closure comment explicitly deferred most required assets to v7.4. |
| #277 Localization | FAIL / REOPENED | Original issue requires complete `cs`/`en` translation sets, i18n APIs, language UI, both-language playthrough and persistence. Repository search did not find the specified i18n implementation; persistence requirement also conflicts with the current no-persistence product contract and must be explicitly re-scoped rather than silently marked complete. |
| #278 Marketing assets | PARTIAL / OPEN | Metadata exists, but screenshots, social image, full icon set/style exports and release assets required by the issue are missing/deferred. |
| #279 Documentation/release notes | FAIL / REOPENED | Definition of Done includes published v7.3 release notes and updated screenshots; that cannot be complete while PR #328 is an unmerged draft and v7.3 has not been released. |
| #280 Production QA matrix | FAIL / REOPENED | `QA_MATRIX.md` contains PASS rows for platforms/devices without attached manual evidence and cited an incorrect `8/8` Playwright state. |
| #281 Soft launch/monitoring | FAIL / REOPENED | Closure claimed all pre-flight items and CI ready although current PR CI was failing and deployment/release had not occurred. |
| #286 NPC atlas + secondary UI | PASS / CLOSED | Acceptance criteria are implementation-bound and reference existing merged PRs/tests; no conflicting deferred acceptance item was identified in this audit. |

## CI correction in PR #328

The browser matrix now contains nine projects:

1. `desktop-chromium`
2. `desktop-firefox`
3. `desktop-webkit`
4. `offline-chromium`
5. `audio-lifecycle-chromium`
6. `iphone-portrait`
7. `iphone-portrait-smoke`
8. `iphone-landscape`
9. `iphone-webkit`

Firefox is run headed under Xvfb with Mesa/llvmpipe software rendering on the GPU-less GitHub runner. WebKit provides automated Safari-engine regression coverage but **does not replace the real-device Safari acceptance criteria** in #272/#274.

## Remaining hard release blockers

- Current head CI must be fully green; no claim of launch readiness while any validation/Playwright job is red.
- Complete or explicitly re-scope the original acceptance criteria in #269/#271/#272/#273/#274/#275/#276/#277/#278/#279/#280/#281.
- Produce the required binary/manual evidence that cannot be inferred from source code: complete audio asset set + listen-through, promotional screenshots, Lighthouse/WAVE/performance reports, real Safari/iOS and PWA install/offline tests, manual UI/accessibility/device sign-offs.
- Replace fabricated/unverified PASS cells in `QA_MATRIX.md` with evidence-linked results before release sign-off.
- Do not merge #328 solely because automated CI turns green.

## Governance actions performed by this audit

- Reopened #271, #272, #273, #276, #277, #279, #280 and #281.
- Kept #269, #274, #275 and #278 open.
- Removed `Closes` semantics and false `8/8 launch-ready` assertions from PR #328 description.
- Added Firefox Xvfb/llvmpipe CI and desktop/mobile WebKit projects.
- Restored full mobile projects on pull-request CI instead of silently skipping them.
