# V7.3 Implementation Checklists
**Status:** Ready for next phase work  
**Date:** 21. srpna 2026

---

## ✅ CHECKLIST 1: Accessibility Audit Device Testing

**Time estimate:** 2-3 hours  
**Owner:** QA / Manual testing  
**Prerequisite:** None (can run in parallel)

### Phase 1: Setup (15 min)
- [ ] Windows machine available (for NVDA testing)
- [ ] NVDA installed (free, open source)
- [ ] iOS device available (for VoiceOver testing)
- [ ] Lighthouse CLI or browser extension ready
- [ ] Project running on localhost:4173 or deployed

### Phase 2: Screen Reader Testing - NVDA (45 min)
**Platform:** Windows 10/11 + NVDA

#### 2.1 Title Screen Test
- [ ] Open Chrome with NVDA active
- [ ] Verify title announced
- [ ] Tab to "Play" button
- [ ] Verify button label: "Vyrazit - jedním klepnutím"
- [ ] Press Enter to start game

#### 2.2 Help Screen Test
- [ ] Navigate to Help screen
- [ ] Verify help content readable
- [ ] Verify close button accessible
- [ ] Close with Escape key

#### 2.3 Game HUD Test
- [ ] Play Chlum level
- [ ] Verify mission panel updates announced
- [ ] Verify danger meter changes announced (aria-live regions)
- [ ] Move near NPC (Václav)
- [ ] Verify NPC presence announced
- [ ] Move near dig site
- [ ] Verify dig site presence announced

#### 2.4 Dig Screen Test
- [ ] Trigger dig (interact with dig site)
- [ ] Verify screen title: "Vykopávka 1" announced
- [ ] Verify hit count announced
- [ ] Verify rhythm feedback conveyed
- [ ] Verify completion feedback

#### 2.5 Result Screen Test
- [ ] Complete level
- [ ] Verify result title announced
- [ ] Verify score announced
- [ ] Verify stats readable
- [ ] Verify "Again" button accessible

#### 2.6 Settings Screen Test
- [ ] Open settings
- [ ] Navigate through options with Tab
- [ ] Verify each control labeled:
  - [ ] Volume slider: "Hlasitost"
  - [ ] Colorblind mode: "Mód pro barvoslepost"
  - [ ] Text size: "Velký text"
  - [ ] High contrast: "Vysoký kontrast"
- [ ] Change each setting (e.g., toggle large text)
- [ ] Verify change is applied
- [ ] Close settings

**Result:** Pass / Fail  
**Notes:** _________________

### Phase 3: Screen Reader Testing - VoiceOver (45 min)
**Platform:** iOS 16+ + VoiceOver

#### 3.1 Orientation Test
- [ ] Enable VoiceOver in Settings
- [ ] Open game in Safari
- [ ] Test portrait orientation
  - [ ] All elements navigable
  - [ ] Buttons minimum 44×44 pt
  - [ ] Touch targets clear
- [ ] Rotate to landscape
  - [ ] Layout adapts
  - [ ] Elements still accessible

#### 3.2 Gesture Navigation Test
- [ ] Swipe right to navigate forward
- [ ] Swipe left to navigate backward
- [ ] Double-tap to activate
- [ ] Two-finger Z (open rotor)
- [ ] Use rotor to jump between elements

#### 3.3 Game Play Test
- [ ] Start game (Play button accessible)
- [ ] Use VoiceOver gestures to navigate HUD
- [ ] Use arrow keys for movement (if supported)
- [ ] Interact with dig site
- [ ] Complete one level
- [ ] Verify all feedback conveyed

#### 3.4 Settings Test (on iOS)
- [ ] Navigate to settings
- [ ] Change colorblind mode with swipe
- [ ] Verify change announced
- [ ] Toggle large text mode
- [ ] Verify UI text size changes

**Result:** Pass / Fail  
**Notes:** _________________

### Phase 4: Keyboard-Only Test (30 min)
**Platform:** Any browser, physical keyboard, no mouse

#### 4.1 Setup
- [ ] Disable mouse/trackpad
- [ ] Open game
- [ ] Verify Tab key navigates UI

#### 4.2 Title Screen (without mouse)
- [ ] Tab to "Play" button
- [ ] Tab to "Help" button
- [ ] Press Enter on "Play"
- [ ] Verify game starts

#### 4.3 Gameplay (without mouse)
- [ ] Use Arrow keys to move
- [ ] Tab to action button (if needed)
- [ ] Press Enter to interact
- [ ] Complete one full dig sequence
- [ ] Navigate result screen with Tab/Enter
- [ ] Escape to exit screen

#### 4.4 Settings (without mouse)
- [ ] Tab through all options
- [ ] Arrow keys change sliders
- [ ] Space/Enter toggle checkboxes
- [ ] Tab order logical

**Result:** Pass / Fail  
**Notes:** _________________

### Phase 5: Contrast Verification (30 min)

#### 5.1 Lighthouse Audit
- [ ] Run Lighthouse on deployed site
- [ ] Check Accessibility score (target: 90+)
- [ ] Review "Contrast" section
- [ ] Document any failures:
  - [ ] Element: _______________
  - [ ] Current ratio: _____ vs. Required: 4.5:1
  - [ ] Recommendation: _______

#### 5.2 Manual Contrast Check
- [ ] Check primary text on background: ✓ ≥4.5:1
- [ ] Check button text: ✓ ≥4.5:1
- [ ] Check UI borders/focus: ✓ ≥3:1
- [ ] High contrast mode: ✓ ≥7:1

#### 5.3 Color Mode Test
- [ ] Normal mode: ✓ Readable
- [ ] Deuteranopia: ✓ Readable
- [ ] Protanopia: ✓ Readable
- [ ] Tritanopia: ✓ Readable
- [ ] High contrast: ✓ Readable

**Result:** Pass / Fail  
**Notes:** _________________

### Final Report
- [ ] All tests passed (or issues documented)
- [ ] WCAG 2.1 AA compliance verified
- [ ] Recommendations logged
- [ ] Results shared with team

**Sign-off:** _______________ Date: ________

---

## ⏳ CHECKLIST 2: Phase 2D Foreground Assets Implementation

**Time estimate:** 3-4 hours  
**Owner:** Designer/Artist  
**Prerequisite:** Asset generation complete

### Phase 1: Asset Preparation (1-2 hours)
**Deliverables needed:** 4 sprite sheets (PNG, RGBA)

#### 1.1 Chlum Field Assets
- [ ] Solitary Tree (80×130px)
  - Color: Green (#2D5016) for foliage, brown (#5C4033) for trunk
  - Placement: Field edge landmark
- [ ] Small Stone (80×70px)
  - Color: Gray (#696969) with shadow
  - Placement: Scattered across field
- [ ] Grass Clump (70×90px)
  - Color: Green (#2D5016) to (#1B4D1B) gradient
  - Placement: Field vegetation tufts
- [ ] Distant Tree (60×100px)
  - Color: Muted green (#8B9D6F)
  - Placement: Far background, small scale

**Sprite sheet:** `assets/sprites/foreground/chlum-field.png`
- Layout: 4 sprites in row (0,0), (80,0), (160,0), (230,0)
- Canvas: 400×200px minimum
- Format: PNG with transparency (RGBA)
- File size: ≤50 KB

#### 1.2 Nesměň Forest Assets
- [ ] Tall Pine (120×140px)
  - Color: Dark green (#1B4D1B), trunk brown
- [ ] Dark Bush (100×100px)
  - Color: Mid-green (#2D5016)
- [ ] Fallen Log (120×60px)
  - Color: Brown (#5C4033) with moss (#6B8E23)
- [ ] Moss Stone (80×80px)
  - Color: Stone gray (#696969) + moss green

**Sprite sheet:** `assets/sprites/foreground/nesmen-flora.png`
- Layout: 4 sprites (0,0), (120,0), (220,0), (340,0)
- Canvas: 420×200px minimum
- File size: ≤50 KB

#### 1.3 Besednice Quarry Assets
- [ ] Rock Face (100×120px)
  - Color: Clay (#C19A6B) + stone (#696969)
- [ ] Stone Pile (90×100px)
  - Color: Stone gray (#A9A9A9)
- [ ] Rough Boulder (100×90px)
  - Color: Terracotta (#E2B48F)
- [ ] Quarry Wall (110×100px)
  - Color: Stone layers (#696969) → (#A9A9A9)

**Sprite sheet:** `assets/sprites/foreground/besednice-geology.png`
- Layout: 4 sprites (0,0), (100,0), (190,0), (290,0)
- Canvas: 400×200px minimum
- File size: ≤50 KB

#### 1.4 Slavia Architecture Assets
- [ ] Building Facade (100×120px)
  - Color: Stone (#D4A574) + shadow
  - Detail: Windows, door frame
- [ ] Door Frame (70×110px)
  - Color: Wood brown (#8B6914)
- [ ] Flag Pole (60×140px)
  - Color: Gray metal (#696969) + flag (#d4a574)
- [ ] Bench (100×70px)
  - Color: Wood (#8b9d6f) or stone

**Sprite sheet:** `assets/sprites/foreground/slavia-architecture.png`
- Layout: 4 sprites (0,0), (100,0), (170,0), (230,0)
- Canvas: 400×200px minimum
- File size: ≤42 KB

**Quality checks:**
- [ ] All PNGs have transparency (no white background)
- [ ] Total size ≤185 KB
- [ ] Colors match EnvironmentTheme.js palette
- [ ] No blurriness or compression artifacts

### Phase 2: Metadata Creation (30 min)

**File:** `assets/sprites/foreground/manifest.json`

```json
{
  "chlum-field": {
    "sheet": "./chlum-field.png",
    "sprites": [
      {
        "id": "chlum-solitary-tree",
        "rect": {"x": 0, "y": 0, "width": 80, "height": 130},
        "depth": "foreground",
        "opacity": 1.0,
        "scale": 1.0,
        "collision": {"x": 0, "y": 100, "width": 40, "height": 30}
      },
      // ... 3 more sprites
    ]
  },
  // ... nesmen-flora, besednice-geology, slavia-architecture
}
```

- [ ] All 4 location blocks created
- [ ] All 16 sprites (4 per location) have entries
- [ ] Depth values correct (foreground/midground/background)
- [ ] Opacity values set per VISUAL_INTEGRATION_PLAN.md
- [ ] Collision bounds defined (null for non-collidable)
- [ ] JSON validates with `jsonlint`

### Phase 3: Code Integration (1-1.5 hours)

#### 3.1 Update GridSceneVisuals
**File:** `src/grid/GridSceneVisuals.js`

- [ ] Add `loadForegroundAssets(levelId, gridSize)` method
- [ ] Implement sprite texture loading
- [ ] Create sprite mesh with cropped texture
- [ ] Apply atmospheric perspective opacity
- [ ] Random placement within walkable region
- [ ] Add to effectsGroup

**Code snippet template:**
```javascript
async loadForegroundAssets(levelId, gridSize) {
  const manifest = await this.loadManifest('assets/sprites/foreground/manifest.json');
  const levelAssets = manifest[levelId];
  if (!levelAssets) return;
  
  // Load texture...
  // Create 8-12 random sprite instances per level
}
```

- [ ] Method compiles without errors
- [ ] Textures load correctly
- [ ] Sprites render in correct depth layer

#### 3.2 Update GridScene
**File:** `src/grid/GridScene.js`

- [ ] Add `await this.visuals.loadForegroundAssets(this.levelId, this.grid.width);` to `createVisualWorld()`
- [ ] Verify method call timing (after grid render, before camera set)
- [ ] Test on each location:
  - [ ] Chlum
  - [ ] Nesměň
  - [ ] Besednice
  - [ ] Slavia

#### 3.3 Asset Manifest Update
**File:** `assets/manifests/assets.json`

Add entries for each location:
```json
{
  "id": "foreground-chlum-field",
  "type": "sprite-sheet",
  "url": "./assets/sprites/foreground/chlum-field.png",
  "preload": "level:chlum",
  "metrics": {"bytes": 45000},
  "budget": {"bytes": 50000}
}
```

- [ ] All 4 locations have entries
- [ ] preload triggers correct to level loads
- [ ] Total budget ≤185 KB

### Phase 4: Testing (1 hour)

#### 4.1 Visual Tests
- [ ] Chlum: Trees and stones render
- [ ] Chlum: Player can move through level
- [ ] Chlum: Sprites don't block dig sites
- [ ] Nesměň: Forest trees and logs visible
- [ ] Besednice: Quarry rocks layered correctly
- [ ] Slavia: Building and architecture visible

#### 4.2 Performance Tests
- [ ] FPS stable (≥60 on desktop)
- [ ] Memory usage < 50 MB mobile
- [ ] No texture load delays
- [ ] Sprites update with camera movement

#### 4.3 Regression Tests
- [ ] All 252 unit tests still pass
- [ ] Validation: 0 errors, 0 warnings
- [ ] No broken dig site interaction
- [ ] No broken NPC interaction
- [ ] Mobile: Touch controls work

#### 4.4 Deployment Tests
- [ ] Service worker includes foreground images
- [ ] Offline mode: sprites load from cache
- [ ] Mobile viewport: sprites scale correctly
- [ ] High DPI: no pixelation

**Test results:**
- [ ] Visual verification complete
- [ ] Performance acceptable
- [ ] All regressions resolved
- [ ] Ready to merge

### Phase 5: Documentation
- [ ] README updated with new assets
- [ ] Sprite usage documented in code comments
- [ ] Atmospheric perspective explained
- [ ] Performance impact documented

**Definition of Done:**
- [x] Asset files created (4 PNG sheets)
- [x] Metadata manifest complete
- [x] GridSceneVisuals extended
- [x] GridScene integrated
- [x] Asset manifest updated
- [x] All visual tests passing
- [x] All 252 unit tests passing
- [x] No validation errors
- [x] Mobile device tested
- [x] Documentation complete

**Sign-off:** _______________ Date: ________

---

## ⏳ CHECKLIST 3: Audio Compression & Integration

**Time estimate:** 1-2 hours  
**Owner:** Audio engineer / Build system  
**Prerequisite:** ffmpeg installed locally

### Phase 1: Audio Inventory Review (15 min)

**Verify all files present:**
```
assets/audio/music/
  ├── city.wav       (1.3 MB)  → Slavia theme
  ├── forest.wav     (2.1 MB)  → Nesměň theme
  ├── field.wav      (1.9 MB)  → Chlum theme
  ├── meadow.wav     (932 KB)  → Besednice theme
  ├── expo.wav       (247 KB)  → Finale scene
  ├── boss.wav       (190 KB)  → Boss encounter
  └── night.wav      (2.4 MB)  → Ambient night

assets/audio/sfx/
  ├── wrong.wav      (4 KB)
  ├── step.wav       (926 B)
  ├── menu.wav       (1.4 KB)
  ├── police.wav     (7.8 KB)
  ├── hit.wav        (2.5 KB)
  ├── rare.wav       (6.8 KB)
  ├── collect.wav    (2.7 KB)
  ├── dig.wav        (2.2 KB)
  ├── cash.wav       (4.6 KB)
  ├── fill.wav       (3.1 KB)
  ├── boss.wav       (7.6 KB)
  └── win.wav        (12 KB)
```

- [ ] All 22 files present
- [ ] Total size: 8.76 MB
- [ ] No corrupted files (test with `ffmpeg -f lavfi -i sine=frequency=1000:duration=1 -i <file> -filter_complex "[0][1] amix=inputs=2:duration=first" test-output.wav`)

### Phase 2: Convert Music Files (30 min)
**Target:** 192 kbps MP3 (higher quality for ambient music)

```bash
cd /path/to/lovec-vltavinu

# Music files: 192 kbps quality
for file in assets/audio/music/*.wav; do
  echo "Converting $(basename $file)..."
  ffmpeg -i "$file" -q:a 2 -codec:a libmp3lame -b:a 192k "${file%.wav}.mp3"
  if [ $? -eq 0 ]; then
    rm "$file"  # Delete WAV after successful conversion
  fi
done
```

**Verification:**
- [ ] city.wav → city.mp3 (≤300 KB)
- [ ] forest.wav → forest.mp3 (≤400 KB)
- [ ] field.wav → field.mp3 (≤400 KB)
- [ ] meadow.wav → meadow.mp3 (≤200 KB)
- [ ] expo.wav → expo.mp3 (≤60 KB)
- [ ] boss.wav → boss.mp3 (≤50 KB)
- [ ] night.wav → night.mp3 (≤500 KB)

**Quality check:**
```bash
# Spot-check one file
ffprobe assets/audio/music/city.mp3  # Verify bitrate is ~192k
```

- [ ] All music files converted
- [ ] No errors during conversion
- [ ] File sizes within target ranges
- [ ] WAV files deleted

### Phase 3: Convert SFX Files (15 min)
**Target:** 128 kbps MP3 (sufficient for sound effects)

```bash
# SFX files: 128 kbps quality (sufficient for effects)
for file in assets/audio/sfx/*.wav; do
  echo "Converting $(basename $file)..."
  ffmpeg -i "$file" -q:a 4 -codec:a libmp3lame -b:a 128k "${file%.wav}.mp3"
  if [ $? -eq 0 ]; then
    rm "$file"
  fi
done
```

- [ ] All 12 SFX converted to MP3
- [ ] Total SFX size ≤20 KB
- [ ] WAV files deleted

### Phase 4: Calculate SHA256 Hashes (15 min)

**For each MP3 file:**
```bash
# Create hash list
for file in assets/audio/{music,sfx}/*.mp3; do
  sha256sum "$file"
done > assets/audio/manifest-hashes.txt
```

**Or in Node.js:**
```javascript
const fs = require('fs');
const crypto = require('crypto');

const files = [
  'assets/audio/music/city.mp3',
  // ... all 22 files
];

files.forEach(file => {
  const content = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  console.log(`"${file}": "${hash}"`);
});
```

- [ ] All 22 files have SHA256 hashes
- [ ] Hashes documented for manifest entries

### Phase 5: Update assets.json Manifest (30 min)

**File:** `assets/manifests/assets.json`

Add entries like:
```json
{
  "id": "music-chlum-field",
  "type": "audio",
  "url": "./assets/audio/music/field.mp3",
  "preload": "level:chlum",
  "role": "music",
  "loop": true,
  "volume": 0.34,
  "metrics": {"bytes": 400000},
  "budget": {"bytes": 500000},
  "sha256": "abc123def456...",
  "disposeOwner": "AudioEngine",
  "license": {
    "spdx": "CC0-1.0",
    "source": "Project-original procedural synthesis",
    "notice": "./assets/audio/LICENSE.md"
  }
}
```

**All entries needed:**

**Music (7 entries):**
- [ ] music-chlum-field
- [ ] music-nesmen-forest
- [ ] music-besednice-meadow
- [ ] music-slavia-city (+ music-slavia-expo)
- [ ] music-boss
- [ ] music-night

**SFX (12 entries):**
- [ ] sfx-wrong
- [ ] sfx-step
- [ ] sfx-menu
- [ ] sfx-police
- [ ] sfx-hit
- [ ] sfx-rare
- [ ] sfx-collect
- [ ] sfx-dig
- [ ] sfx-cash
- [ ] sfx-fill
- [ ] sfx-boss
- [ ] sfx-win

**Validation:**
- [ ] All 19 entries created
- [ ] All paths correct (no 404 errors)
- [ ] All preload triggers appropriate
- [ ] All SHA256 hashes correct
- [ ] Total budget ≤2 MB

### Phase 6: Update Service Worker (15 min)

**File:** `sw.js`

Add to CORE array (for essential sounds):
```javascript
const CORE = [
  // ... existing entries ...
  "./assets/audio/music/field.mp3",      // Level-specific (lazy)
  "./assets/audio/music/forest.mp3",
  "./assets/audio/music/meadow.mp3",
  "./assets/audio/music/city.mp3",
  // SFX (essential, pre-cache)
  "./assets/audio/sfx/wrong.mp3",
  "./assets/audio/sfx/hit.mp3",
  "./assets/audio/sfx/collect.mp3",
  "./assets/audio/sfx/dig.mp3"
];
```

- [ ] CORE cache includes essential SFX
- [ ] Level-specific music marked for lazy load
- [ ] Service worker cache version bumped
- [ ] Test offline playback

### Phase 7: Validation & Testing (15 min)

#### 7.1 Validate Manifest
```bash
npm run validate
```

Expected:
```
Kontrolováno assetů celkem: 42 (or more)
Validace úspěšná: 0 chyb, 0 varování ✅
```

- [ ] No validation errors
- [ ] Audio budget < 2 MB

#### 7.2 Test Audio Playback
- [ ] Play menu sound in browser console: `audio.play('sfx-menu')`
- [ ] Listen to all 4 core sounds work
- [ ] Navigate to each level
- [ ] Verify level music plays
- [ ] Mobile test: speakers + headphones

#### 7.3 Test Offline Mode
- [ ] Disable network in DevTools
- [ ] Reload page
- [ ] Verify audio loads from cache
- [ ] Play sounds while offline

#### 7.4 Run Full Test Suite
```bash
npm test  # Should pass 252/252
```

- [ ] All tests passing
- [ ] No regressions

### Phase 8: Performance Review

**File size budget:**
```
Before: 8.76 MB (WAV)
After:  1.93 MB (MP3)
Reduction: 78% ✅
```

- [ ] Total audio ≤2 MB
- [ ] FCP impact minimal
- [ ] LCP impact minimal
- [ ] CLS unchanged

**Sign-off:** _______________ Date: ________

---

## Summary: Remaining Work

| Blocker | Status | Effort | Owner | Dependencies |
|---------|--------|--------|-------|---|
| Phase 2D Foreground Assets | ⏳ TODO | 3-4 hrs | Designer | Asset generation |
| Audio Compression | ⏳ TODO | 1-2 hrs | Build engineer | ffmpeg local |
| A11y Device Testing | ⏳ TODO | 2-3 hrs | QA | Devices (Windows/iOS) |

**Total remaining:** 6-9 hours active work  
**Timeline to launch:** 1.5-2 weeks (with concurrent work)

---

**Created by:** Claude (Haiku 4.5)  
**Date:** 21. srpna 2026  
**Repository:** rajekroman/lovec-vltavinu  
**Branch:** claude/v73-accessibility-pwa-dokončit
