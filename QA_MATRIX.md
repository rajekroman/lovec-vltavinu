# QA Matrix — Production Testing

## Test Platforms & Devices

### Desktop
- **Chrome/Chromium** (Windows 10/11, macOS)
  - Latest stable version
  - Verify: Audio lifecycle, HUD animations, smoke tests pass
  - Load time target: < 3s
  
- **Safari** (macOS, iOS)
  - Latest version
  - Verify: Audio requires gesture (iOS policy), reduced-motion support
  - Performance: 60fps on iPhone 12+
  
- **Firefox** (Windows, macOS)
  - Latest version
  - Verify: All animations smooth, no jank
  - Load time target: < 3.5s

- **Edge** (Windows)
  - Latest Chromium-based version
  - Parity with Chrome

### Mobile (Portrait + Landscape)

#### iOS
- **iPhone SE (3rd gen)** — 375×667 (small screen test)
- **iPhone 14 Pro** — 390×844 (standard)
- **iPhone 14 Pro Max** — 430×932 (large screen)
- **iPad (10th gen)** — 820×1180 (tablet, landscape)

#### Android
- **Pixel 6** — 412×915 (standard)
- **Galaxy S21** — 360×800 (smaller Android)
- **Galaxy Tab S7** — 1280×800 (tablet, landscape)

## Test Scenarios

### Scenario 1: Complete Game Flow

**Setup**: Fresh session, no prior gameplay

**Steps**:
```
1. Load game (record load time)
2. See title screen with logo/animations
3. Start new game → Brief screen animates in
4. Play Chlum level (5 minutes):
   - Move player with arrow keys/touch
   - Interact with dig site
   - See dig screen with HUD animations
   - Dig successfully: Score popup + finding animation
   - See finding result with smooth animations
5. Complete Chlum → Results screen animates in
6. Progress to Nesměň
7. Repeat for Besednice and Slavia
8. Final results screen with score breakdown
```

**Pass Criteria**:
- ✅ No console errors
- ✅ All animations smooth (no jank)
- ✅ Audio plays when enabled
- ✅ UI responsive to input
- ✅ Score/progress updates correctly
- ✅ All 4 levels playable end-to-end

### Scenario 2: Audio Lifecycle

**Setup**: Game with audio gesture handling

**Steps**:
```
1. Load game → Audio locked (requires gesture)
2. Tap/click screen (any target) → Audio unlocks, ambient plays
3. Play first dig → SFX plays (pick impact)
4. Find item → Finding SFX plays + score popup
5. Trigger danger → Danger warning plays
6. Pause game → Audio fades/mutes
7. Resume → Audio resumes/unmutes
8. Switch app/tab → Audio stops
9. Return to app/tab → Audio ready (may need re-gesture on iOS)
```

**Pass Criteria**:
- ✅ Audio only after first gesture
- ✅ SFX volume appropriate
- ✅ No audio popping/clipping
- ✅ Pause/resume lifecycle correct
- ✅ Background/foreground handling works
- ✅ On iOS: Second gesture not required after first

### Scenario 3: Orientation Changes (Mobile)

**Setup**: Mobile device, any level in progress

**Steps**:
```
1. Start in Portrait mode (player visible, HUD correct)
2. Play for 30 seconds
3. Rotate to Landscape (HUD adapts, game continues)
4. Play for 30 seconds
5. Rotate back to Portrait (layout corrects)
6. Rotate 5+ times total (memory/performance check)
7. Verify no crashes/freezes
```

**Pass Criteria**:
- ✅ HUD repositions correctly in each rotation
- ✅ Game continues playing through rotation
- ✅ No black flashing or redraw artifacts
- ✅ Memory stays stable (no leaks detected)
- ✅ Touch controls work in both orientations

### Scenario 4: UI Animations & Polish

**Setup**: Play through Chlum level normally

**Expected Animations**:
- ✅ Screen fade-in when entering menus
- ✅ Score popup pop+fade on finding
- ✅ Finding pulse animation on counter
- ✅ Health shake on danger damage
- ✅ Mission panel slide-in from top
- ✅ Danger meter slide-in
- ✅ Radar panel slide-in
- ✅ Button hover lift effect (desktop)
- ✅ Pause menu slide-in with backdrop blur
- ✅ Result stats stagger animation

**Pass Criteria**:
- ✅ All animations @ 60fps (desktop), 30fps+ (mobile)
- ✅ No animation jank or stuttering
- ✅ Animations respect prefers-reduced-motion (test via DevTools)
- ✅ Smooth easing on all transitions
- ✅ Backdrop blur performant on mobile

### Scenario 5: Accessibility

**Desktop Keyboard Only**:
```
1. Arrow keys: Move player
2. Enter/Space: Action button
3. Escape: Pause menu
4. Tab: Navigate menus
5. Screen reader: Read all text correctly
```

**Mobile/Tablet Touch**:
```
1. D-Pad controls: All directions work
2. Action button: Large, responsive
3. Menu buttons: 44×44px minimum
4. No keyboard traps
```

**Settings**:
- ✅ High contrast mode: Text readable
- ✅ Large text mode: Layout doesn't break
- ✅ Colorblind modes: Danger indicators clear
- ✅ Reduced motion: Animations disabled gracefully

**Pass Criteria**:
- ✅ Full playthrough with keyboard only
- ✅ All interactive elements reachable
- ✅ Focus visible on all elements
- ✅ Screen reader announces key events
- ✅ No semantic errors in HTML

### Scenario 6: Network Conditions

**Setup**: DevTools throttling enabled

**Offline Mode**:
```
1. Enable offline in DevTools
2. Game already loaded (cached)
3. Play normally → No errors
4. Reload page → Game loads from cache
```

**Slow Network (3G)**: 
```
1. Set DevTools to slow 3G (400ms latency)
2. Load game → Shows loading indicator
3. Play normally after assets load
4. Verify no lag/stutter during gameplay
```

**Pass Criteria**:
- ✅ Works fully offline (PWA cache)
- ✅ Loading spinner shows on slow network
- ✅ Assets load without timeouts
- ✅ Gameplay smooth after load

### Scenario 7: Performance Baseline

**Setup**: DevTools Performance tab open

**Recording Steps**:
```
1. Start recording (Performance tab)
2. Load game page
3. Play for 2 minutes (standard level)
4. Stop recording
5. Analyze metrics:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)
   - Memory heap size
   - FPS during gameplay
```

**Pass Criteria**:
- ✅ FCP: < 2.0s
- ✅ LCP: < 3.0s
- ✅ CLS: < 0.1 (no unexpected layout shifts)
- ✅ Memory: Stable after 2 min (no runaway growth)
- ✅ FPS: 60fps desktop, 30fps+ mobile (no long tasks)
- ✅ No console errors/warnings

## Desktop QA Matrix

| Browser | OS | Title | Gameplay | Audio | Results | Animations | Status |
|---------|-----|--------|----------|-------|---------|------------|--------|
| Chrome | Windows | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Chrome | macOS | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Safari | macOS | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Firefox | Windows | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Firefox | macOS | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Edge | Windows | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |

## Mobile QA Matrix

### Portrait Mode (375-430px)

| Device | OS | Title | Gameplay | Touch | Audio | HUD | Animations | Status |
|--------|-----|--------|----------|-------|-------|-----|------------|--------|
| iPhone SE | iOS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| iPhone 14 | iOS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| iPhone 14+ | iOS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Pixel 6 | Android | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Galaxy S21 | Android | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |

### Landscape Mode (800-932px)

| Device | OS | Title | Gameplay | Touch | HUD | Animations | Status |
|--------|-----|--------|----------|-------|-----|------------|--------|
| iPhone SE | iOS | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| iPhone 14+ | iOS | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Galaxy S21 | Android | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| iPad | iPadOS | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Galaxy Tab S7 | Android | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |

## Bug Severity Classification

### P0 — Blocker
**Game unplayable, crash, loss of progress**
- Game won't load
- Crash during level
- Can't interact with game
- All audio fails
- Infinite loop/freeze

**Action**: Fix immediately, deploy hotfix

### P1 — Major
**Core feature broken, critical visual/audio glitch**
- Missing audio SFX
- HUD doesn't update
- Finding not recorded
- Accessibility broken
- Performance < 20fps

**Action**: Fix before launch

### P2 — Minor
**Polish issue, slight visual glitch, missing animation**
- Button doesn't have hover effect
- Animation timing off
- Text overflow on edge case
- Minor audio quality issue

**Action**: Fix if time allows

### P3 — Trivial
**Cosmetic only, doesn't affect gameplay**
- Typo in text
- Color slightly off brand
- Extra whitespace

**Action**: Track for v7.1

## Testing Checklist

- [ ] **Pre-Launch QA**
  - [ ] Desktop: All 6 browsers tested
  - [ ] Mobile: All devices tested (portrait + landscape)
  - [ ] Scenarios 1-7 completed
  - [ ] No P0 or P1 bugs
  - [ ] Performance baseline recorded
  - [ ] Accessibility verified

- [ ] **Automated Testing**
  - [ ] `npm run validate` — 0 errors, 0 warnings
  - [ ] `npm run test:unit` — All 307 tests pass
  - [ ] `npm run test:smoke` — All Playwright tests pass (CI)

- [ ] **Manual Sign-Off**
  - [ ] QA tester: Full playthrough complete
  - [ ] Designer: Animations & UX approved
  - [ ] Accessibility: Screen reader tested
  - [ ] Performance: Metrics within targets

## Launch Decision

**Game is "Launch Ready" when**:
- ✅ QA Matrix 100% filled (all PASS)
- ✅ Automated tests all pass
- ✅ No P0 or P1 bugs outstanding
- ✅ Performance baseline met
- ✅ Accessibility verified
- ✅ All manual sign-offs complete

**Date Started**: 2026-08-30  
**Target Launch**: 2026-09-06 (pending QA completion)

---

**Test Report Template** (copy for each test run):

```
## QA Test Run — [Date]

**Tester**: [Name]  
**Environment**: [Device/Browser]  
**Session Duration**: [Minutes]

### Scenarios Completed
- [x] Scenario 1: Complete Flow
- [x] Scenario 2: Audio Lifecycle
- [x] Scenario 3: Orientation (if mobile)
- [x] Scenario 4: Animations
- [x] Scenario 5: Accessibility
- [x] Scenario 6: Network (if tested)
- [x] Scenario 7: Performance

### Issues Found
- [ ] Issue 1: [P0/P1/P2/P3] [Description]
- [ ] Issue 2: [P0/P1/P2/P3] [Description]

### Notes
[Any device-specific observations, quirks, or positive feedback]

### Overall Status
**🟢 PASS** / **🟡 PASS with issues** / **🔴 FAIL**
```
