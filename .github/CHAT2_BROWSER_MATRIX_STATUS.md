# Chat 2 — Browser matrix status

A0 reporting note for the CI/browser workstream.

## Current scope

- Firefox hotfix: PR #332
- Cross-browser QA tracking: issues #272 and #280
- PR mobile false-green follow-up: branch `fix/v73-pr-mobile-browser-matrix`
- WebKit is explicitly out of this change and must use a separate scoped PR if pursued.

## Verified evidence

### PR #332

- Head: `7e802ce45a8d1ab27cda2e4ae91952d70f7e4c25`
- Validate game: run `33318392211`
- Firefox job `99275911684`: executed PASS
- iPhone portrait job `99275911604`: false green; substantive steps skipped on pull_request
- iPhone landscape job `99275911664`: false green; substantive steps skipped on pull_request

## Mobile matrix remediation

Commit `759d34c3a58cc4da11ba08e939e2b4ab51be8b9e` removes the pull_request skip guards from `iphone-portrait` and `iphone-landscape` by making every browser-matrix project execute checkout, setup, install, run and report steps on PRs.

No WebKit project is introduced here.

## Reporting terminology

- Playwright WebKit CI, if added later, may only be called **WebKit CI PASS**.
- It must never be reported as **real Safari PASS** or **real iOS Safari PASS**.
- Real Safari requires separate physical/actual Safari evidence.
