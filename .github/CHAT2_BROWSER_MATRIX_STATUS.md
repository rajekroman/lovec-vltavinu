# Chat 2 — Browser matrix status

A0 reporting note for the CI/browser workstream.

## Current integration candidate

- Base: `main@8b2794692caa82e08d2541e0763b9ff5da569c22`.
- Branch: `fix/v73-browser-matrix-main-refresh` (PR #343).
- Purpose: execute the full iPhone portrait and landscape journeys on pull requests instead of returning wrapper-only skipped success.
- Firefox CI stabilization from #332 is already part of the base and remains unchanged.
- The mobile activation lifecycle from merged #344 is already part of the base as `main@f9ff4799bb55f5839f6014b610568523b6b28641` and remains unchanged.
- The obsolete `suppressPointerClick` implementation and its unit-test stack previously merged into this PR branch by #345 are intentionally removed from the candidate.

## Required browser gate

A candidate is PASS only when the same exact SHA has all of the following executed successfully:

- static/unit validation;
- desktop Chromium;
- desktop Firefox;
- full iPhone portrait (`390×844` Chromium emulation) — actual `Run iphone-portrait` execution, never wrapper-only skipped success;
- iPhone portrait smoke;
- full iPhone landscape (`844×390` Chromium emulation) — actual `Run iphone-landscape` execution, never wrapper-only skipped success;
- offline Chromium;
- audio lifecycle Chromium.

## Integration history

- #339 removed the pull-request skip guards and exposed a real portrait touch defect.
- #344 replaced the earlier pointerup-based approaches with the tested browser activation order and merged as `f9ff4799bb55f5839f6014b610568523b6b28641`.
- #332 subsequently merged the headed Firefox/Xvfb/software-GL gate as `8b2794692caa82e08d2541e0763b9ff5da569c22`.
- PR #343 is therefore refreshed directly from `8b279469…` and changes no production input code or unit tests.

## WebKit / Safari terminology

WebKit is out of this integration candidate. If pursued, it must be a separate scoped PR.

- Playwright WebKit may only be reported as **WebKit CI PASS**.
- It must never be reported as **real Safari PASS** or **real iOS Safari PASS**.
- Real Safari requires separate evidence from actual Safari/device execution.
