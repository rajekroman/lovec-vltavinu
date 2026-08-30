# Chat 2 — Browser matrix status

A0 reporting note for the CI/browser workstream.

## Current integration candidate

- Base: `main@f9ff4799bb55f5839f6014b610568523b6b28641`
- Branch: `fix/v73-browser-matrix-f9ff`
- Purpose: clean consolidation of the Firefox CI gate and full mobile PR matrix on top of the corrective #344 input lifecycle.
- No historical #341 click-suppression patch is carried.
- Runtime/gameplay/input code is unchanged by this branch.

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

- #332 proved desktop Firefox could pass under headed Xvfb/software GL, while PR mobile jobs were still false-green skips.
- #339 removed those PR skip guards and exposed the mobile action lifecycle defect.
- #341 was merged only into the historical stacked CI branch and must not reach main.
- #340 moved mobile action commit from pointerdown to pointerup, but later exact full portrait evidence showed pointerup was still too early.
- #344 corrects the shared lifecycle by committing the touch action on the following browser click activation; validation-only #342 proved full portrait and landscape PASS on that exact production candidate.
- This branch therefore starts fresh from post-#344 main and carries CI-only changes.

## WebKit / Safari terminology

WebKit is out of this integration candidate. If pursued, it must be a separate scoped PR.

- Playwright WebKit may only be reported as **WebKit CI PASS**.
- It must never be reported as **real Safari PASS** or **real iOS Safari PASS**.
- Real Safari requires separate evidence from actual Safari/device execution.
