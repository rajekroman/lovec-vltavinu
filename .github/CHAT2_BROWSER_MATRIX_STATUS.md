# Chat 2 browser matrix status

Current clean CI-policy branch: `fix/v73-pr-mobile-matrix-8b279`.

Baseline: `main@8b2794692caa82e08d2541e0763b9ff5da569c22`, which already contains the Firefox/Xvfb fix from merged PR #332 and the mobile input correction from #344.

This branch changes CI policy only: full `iphone-portrait` and `iphone-landscape` Playwright journeys execute on pull requests instead of producing skipped/false-green wrappers. It does not modify runtime, gameplay, UI, input, findings, session, evaluator, or test assertions.

Required exact-head gate before merge:
- Static and unit validation PASS;
- desktop Chromium PASS;
- desktop Firefox PASS;
- full iPhone portrait 390×844 executes and PASS;
- iPhone portrait smoke PASS;
- full iPhone landscape 844×390 executes and PASS;
- offline Chromium PASS;
- audio lifecycle Chromium PASS.

`skipped` or `cancelled` is not PASS. Playwright browser evidence is not a substitute for real Safari/iOS Safari or independent A6 visual evidence.

Historical #339, #343 and #346 are superseded for integration purposes; their runs remain audit evidence.
