# Chat 2 — Browser matrix status

A0 reporting note for the CI/browser workstream.

## Current integration candidate

- Base: `main@e601cf60f77c0fe43a7ad29208303bb3c7586bd4`
- Branch: `fix/v73-browser-matrix-main-refresh`
- Purpose: clean consolidation of the Firefox gate from #332 and full mobile PR matrix from #339.
- The old #341 `DomInputAdapter` patch is intentionally not carried: current main already contains the newer tested mobile action fix from merged #340.

## Required browser gate

A candidate is PASS only when the same exact SHA has all of the following executed successfully:

- static/unit validation
- desktop Chromium
- desktop Firefox
- full iPhone portrait (`390×844` Chromium emulation) — actual test execution, never wrapper-only skipped SUCCESS
- iPhone portrait smoke
- full iPhone landscape (`844×390` Chromium emulation) — actual test execution, never wrapper-only skipped SUCCESS
- offline Chromium
- audio lifecycle Chromium

## Historical evidence

- #332 proved desktop Firefox could pass under headed Xvfb/software GL, but its PR mobile jobs were false-green because substantive steps were skipped.
- #339 removed those PR skip guards and exposed a real portrait jury touch defect.
- #341 supplied one fix and passed the stacked matrix, but was merged only into the #339 branch.
- #340 independently supplied a newer pointerup-based mobile action fix with unit coverage and was merged to main as `e601cf60f77c0fe43a7ad29208303bb3c7586bd4`.
- Therefore the integration path is refreshed directly from current main rather than carrying the conflicted #332 → #339 → #341 stack.

## WebKit / Safari terminology

WebKit is out of this integration candidate. If pursued, it must be a separate scoped PR.

- Playwright WebKit may only be reported as **WebKit CI PASS**.
- It must never be reported as **real Safari PASS** or **real iOS Safari PASS**.
- Real Safari requires separate evidence from actual Safari/device execution.
