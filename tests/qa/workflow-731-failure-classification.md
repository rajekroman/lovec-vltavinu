# Workflow 731 failure classification

Workflow `731` on head `b6d58970744cb24ff5907c23cc786b66075862d3` was an infrastructure validation run only. It was not a warm-up and does not count toward certification.

## Classified failures

1. **Desktop `locator.tap()` failures** — QA project configuration defect. The desktop project incorrectly executed the touch-oriented canonical suite. Resolution: desktop now runs `desktop-smoke.spec.mjs`, which uses mouse and keyboard only. No global `hasTouch: true` is applied.
2. **Landscape joystick transform expectation** — invalid portrait-specific test assumption. Resolution: landscape now has a dedicated suite that validates touch targets, released input state and viewport containment instead of a literal inline transform string.
3. **Landscape screenshot dimensions** — invalid portrait-first lifecycle assumption. Resolution: the dedicated landscape suite starts at 844 × 390 and verifies the corresponding 2532 × 1170 device-scale screenshot.
4. **Remaining desktop/landscape failures in the report** — consequences of executing one portrait-oriented suite across incompatible input profiles, not independently reproduced runtime regressions.

## Certification state

- final integration SHA confirmed by A0: no;
- warm-up runs: 0;
- counting green runs: 0;
- PR #66 must remain draft and must not be merged or marked ready.
