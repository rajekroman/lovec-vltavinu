# Chat 2 — Browser matrix status

Updated: 2026-08-30

## Current clean candidate

Base: `main@8b2794692caa82e08d2541e0763b9ff5da569c22`

Branch: `fix/v73-mobile-pr-matrix-8b279`

Scope is CI-only:
- full `iphone-portrait` and `iphone-landscape` jobs execute on pull requests;
- existing Firefox Xvfb/software-GL fix already merged via #332 is preserved unchanged;
- Playwright report upload runs for all non-cancelled matrix jobs;
- no runtime, input, gameplay, UI, session, findings, evaluator, or assertion changes.

Historical context:
- #332 proved Firefox CI can execute successfully, but portrait/landscape PR jobs were false-green because substantive steps were skipped;
- #339/#343/#346 demonstrated the corrected full mobile PR matrix;
- #344 is the current production mobile input solution on main;
- #345 is historical stacked evidence only and its click-suppression implementation must not be reintroduced.

Required exact-head gate:
- static/unit PASS;
- desktop Chromium PASS;
- desktop Firefox PASS;
- iPhone portrait 390×844 full flow executes and PASS;
- iPhone landscape 844×390 full flow executes and PASS;
- portrait smoke PASS;
- offline PASS;
- audio lifecycle PASS.

Terminology:
- Playwright WebKit, if added in a separate scoped PR, is `WebKit CI PASS` only;
- it is never `real Safari PASS` or `real iOS Safari PASS`;
- green CI is not A6 visual PASS.
