# v7.3 Release Checklist

> **Status:** BLOCK until one final `RELEASE_SHA` passes the functional gate and the independent A6 visual gate.
>
> The authoritative acceptance contract is `docs/FINAL_GAME_GOALS.md`. Green CI alone is not a release approval.

## 1. Scope freeze prerequisites

Before nominating a release candidate, all code, tests, CSS, assets, manifests and release documentation intended for v7.3 must already be merged to `main`.

Required product invariants:

- one canonical Three.js runtime, renderer and fixed-step loop;
- one in-memory `GameSession`;
- no gameplay save system, inventory UI, `localStorage`, `sessionStorage` or IndexedDB persistence;
- exactly 10 unique findings per run: Chlum 3, Nesměň 3, Besednice 4;
- Slavia displays all 10 and accepts exactly 4 unique known findings for final evaluation;
- the evaluator receives only the chosen 4 while the session retains all 10;
- real walkability/blockers remain compatible with all mandatory interaction pockets;
- player/NPC animation lifecycle remains compatible with pause, dialogue, background/resume and dispose.

Do not create a release tag while any release-blocking issue or acceptance item above is unresolved.

## 2. Functional candidate gate

For the exact candidate SHA require:

- [ ] `npm run validate` — 0 errors;
- [ ] module graph validation PASS;
- [ ] full unit suite PASS;
- [ ] walkability/reachability tests PASS;
- [ ] desktop Chromium full-flow PASS at `1280×720`;
- [ ] desktop Firefox smoke/full-flow PASS;
- [ ] iPhone portrait full-flow PASS at `390×844`;
- [ ] iPhone landscape full-flow PASS at `844×390`;
- [ ] portrait touch/orientation/background smoke PASS;
- [ ] offline smoke PASS;
- [ ] audio lifecycle smoke PASS;
- [ ] full-flow proves 3 → 6 → 10 finding snapshots preserve `findingId`, `locality`, `rarity`, `weight` and `score`;
- [ ] jury UI identities equal the 10 session findings;
- [ ] 0–3 selections disable submit, exactly 4 enable it, a fifth is rejected, deselect/replacement works;
- [ ] final submitted IDs equal the independently expected four IDs;
- [ ] final jury score equals the sum of those four findings, not a value derived from evaluator output;
- [ ] session still contains the original 10 findings after evaluation;
- [ ] new expedition and reload produce a clean in-memory session;
- [ ] gameplay `localStorage` and `sessionStorage` remain empty.

A pull-request job whose execution steps are `skipped` is not evidence that the corresponding viewport passed. Use an actual executed job on the candidate/main SHA.

## 3. Nominate and freeze `RELEASE_SHA`

After the functional gate is green:

1. record the exact full 40-character commit SHA as `RELEASE_SHA`;
2. verify the deployment being reviewed is built from that SHA;
3. stop all code/CSS/asset/manifest/documentation changes while A6 capture is in progress;
4. bind every screenshot, video, runtime snapshot and review artifact to that same SHA.

Any source change after capture begins invalidates the A6 evidence set. Start A6 again on the new SHA.

## 4. Independent A6 visual gate

A6 is independent from CI and must review the real rendered game at all three canonical viewports:

- desktop `1280×720`;
- iPhone portrait `390×844`;
- iPhone landscape `844×390`.

For **Chlum, Nesměň, Besednice and Slavia**, capture and review at minimum:

- canonical environment/art composition;
- HUD legibility and safe-area behavior;
- player rendering and movement;
- contextual action;
- visible blockers versus genuinely free paths;
- touch behavior where applicable;
- orientation handling;
- pause;
- background/resume;
- transition to the next gameplay state/locality.

Additional mandatory evidence:

### Chlum
- radar/search flow;
- all 3 findings;
- hunter special actions, including visible multi-frame `pick-up`, `caught`, `dig` and `celebration` behavior.

### Nesměň
- all 3 profiles/findings;
- dig flow and interaction reachability.

### Besednice
- traces/digging and all 4 findings;
- Milan and Karel visually distinguishable with correct animation states.

### Slavia
- documents, Eva, František and certification;
- jury showing all 10 session findings;
- 0/4 state;
- exactly 4/4 selected;
- protection against a fifth selection;
- final evaluation based only on the selected four while GameSession still contains all 10.

A6 verdict is either `PASS` or `BLOCK` for the exact `RELEASE_SHA`. Green CI cannot override an A6 BLOCK.

## 5. Release authorization

Create `v7.3.0` and promote the deployment only when all of the following refer to the identical SHA:

- [ ] source `RELEASE_SHA`;
- [ ] deployed build;
- [ ] functional CI PASS;
- [ ] full portrait PASS;
- [ ] full landscape PASS;
- [ ] independent A6 PASS.

If any item is missing, the release remains BLOCKED.

## 6. Launch-day verification

Only after release authorization:

- [ ] create the annotated `v7.3.0` release/tag from `RELEASE_SHA`;
- [ ] verify GitHub Pages serves the expected commit/build;
- [ ] verify title → gameplay → Slavia jury → result → restart on the deployed URL;
- [ ] verify service worker/offline behavior after a clean load;
- [ ] verify audio begins only after an allowed user gesture and survives lifecycle transitions;
- [ ] check browser console for release-impacting errors;
- [ ] record any discovered regression as a GitHub issue with severity and the affected SHA.

## 7. Non-blocking follow-up work

Features explicitly moved to a later release must remain visible in their own open issues and must not be described as implemented in v7.3 release notes. Examples may include expanded audio variants/ambient/UI sounds or promotional marketing artwork when those items have not been delivered.

Do not use future-roadmap items to claim completion of their original broader issue scope.
