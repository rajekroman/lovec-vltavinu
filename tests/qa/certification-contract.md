# A6 certification contract

This file defines the early QA infrastructure contract. It does not certify a release head.

## Playwright matrix

- `desktop-chromium`: 1440 × 900 keyboard baseline.
- `iphone-portrait`: 390 × 844 touch baseline.
- `iphone-landscape`: 844 × 390 touch baseline.

## Certification gate

1. A0 identifies and confirms the final release candidate head SHA.
2. The first complete matrix run on that exact SHA is treated as a warm-up and does not count.
3. Two subsequent complete green workflow runs must use the same confirmed SHA.
4. Any code, asset, manifest, workflow, or test change resets the certification sequence.
5. The evidence must include unit validation, static validation, all three Playwright projects, page-error and HTTP-error checks, and retained failure artifacts.

Until A0 confirms the final head, workflow runs are infrastructure validation only and must not be described as certification runs.
