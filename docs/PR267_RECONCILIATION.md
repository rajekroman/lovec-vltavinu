# PR #267 reconciliation

This branch reapplies the useful visual-feedback parts of PR #267 on top of the current `main` instead of merging the stale branch.

## Preserved / corrected

- Nesměň: dust feedback now resolves the canonical `dig:hit.spot` event to the active profile position; sparkle feedback is emitted when the finding is collected.
- Besednice: dust feedback uses the hedgehog profile position; clean-dig and collection sparkle feedback are retained.
- Chlum V7: particle effects live in `ChlumV7Scene`, where the active V7 visual implementation actually runs; search completion emits dust and collection emits sparkle.
- Slavia: keeps the current NPC atlas animators and existing water/foreground implementation; reward sparkle feedback is added for recovering the finding and receiving the certificate.

## Cleanup

- Removed duplicate `DigSystem` initializations in Nesměň and Besednice.
- Removed the obsolete duplicate `collectHedgehog()` implementation in Besednice.
- Scene-local particle event listeners are aborted on visual teardown to avoid accumulating listeners across repeated scene entries.

PR #267 should remain unmerged and can be closed once the replacement PR is validated and merged.
