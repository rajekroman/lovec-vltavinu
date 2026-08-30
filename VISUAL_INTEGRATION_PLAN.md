# Visual Asset Integration Plan — Claude Design Phase 2

**Status:** Ready for Implementation  
**Date:** 21. srpna 2026  
**Branch:** `claude/podklady-claude-design-038llg`

## 1. Visual Assets Reference Complete ✅

All four Claude Design artboards published and available:
- **NPC Character Sheets** — 5-pose variations for Václav, Lesník, Znalec (+ Eva, Franta reference)
- **Location Foreground Assets** — 16 environmental elements across 4 locations with atmospheric perspective specs
- **Advanced Animation States** — Interact (4 frames @ 8fps) + Success (6 frames @ 8fps) sequences
- **UI Secondary Screens** — Inventory, Story & Lore, Settings, Location Journal mockups

**Resource:** https://claude.ai/code/artifact/8e4d8702-a29f-448b-a25d-a255bc5c15b3

---

## 2. Implementation Phases

### Phase 2A: Character Sprite Sheet Generation
**Goal:** Convert Claude Design NPC poses into game-ready sprite sheets

**Tasks:**
- [ ] Extract SVG-to-PNG conversion specs from NPCSheets artboard
  - Each character: 120px height, color scheme (#d4a574 primary, #8b9d6f accent, #5a6b4a shadow)
  - Output format: 4-character-wide sprite atlas (Václav, Lesník, Znalec, + guide slot)
  - Frames per character: 5 poses (neutral, talking, concern, welcome, action)
  
- [ ] Generate sprite atlases
  - `assets/sprites/npcs/characters-atlas.png` (4×5 grid, each frame 120×160px)
  - Metadata: `assets/sprites/npcs/characters-atlas.json` (frame indices, collision bounds)

- [ ] Update DialogueSystem to reference new sprite coordinates

### Phase 2B: Animation Frame Integration
**Goal:** Hook up Interact & Success animations to gameplay events

**Tasks:**
- [ ] Create animation frame sequence handlers in `GridSceneVisuals.js`
  - Interact animation (shoulder shrug): trigger on NPC interaction
  - Success animation (celebration): trigger on finding completion
  
- [ ] Frame timing specs from AdvancedAnimations:
  - Interact: 4 frames @ 8fps = 500ms, plays once
  - Success: 6 frames @ 8fps = 750ms, plays once
  
- [ ] Sprite sheet: `assets/sprites/animations/interactions.png`
  - Row 1: Interact frames 0-3
  - Row 2: Success frames 0-5

### Phase 2C: UI Screen Implementation
**Goal:** Polish secondary screens per UIScreens design

**Tasks:**
- [ ] Inventory Screen
  - Item grid: 3×4 layout with rarity color coding
  - Details panel: selected item name, location found, description
  - Reference: UIScreens artboard, Inventory section
  
- [ ] Story & Lore Screen
  - Expandable discovery tree (Václav's Farm, Forest Mystery, Slávie Secret)
  - Locked state indicator for unavailable entries
  
- [ ] Settings & Accessibility
  - Brightness slider, colorblind mode selector
  - Large text toggle, high contrast, controller support indicators
  - Volume controls (music 80%, SFX 100%)
  
- [ ] Location Journal
  - Visited locations with completion percentage
  - NPC encounter tracking (1/2, etc.)
  - Time spent per location
  
- [ ] Visual style consistency
  - Match colors: primary #d4a574, accent #8b9d6f
  - Modal pattern: dark overlay, centered panel, ESC to close
  - Responsive: 44px minimum touch target height

### Phase 2D: Location Asset Sprites
**Goal:** Create environmental element sprites from LocationAssets design

**Tasks:**
- [ ] Generate sprite sheets per location
  
  **Nesměň (Forest):** `assets/sprites/foreground/nesmen-flora.png`
  - Tall Pine (120×140px)
  - Dark Bush (100×100px)
  - Fallen Log (120×60px)
  - Moss Stone (80×80px)
  
  **Besednice (Quarry):** `assets/sprites/foreground/besednice-geology.png`
  - Rock Face (100×120px)
  - Stone Pile (90×100px)
  - Rough Boulder (100×90px)
  - Quarry Wall (110×100px)
  
  **Slávie (Cultural House):** `assets/sprites/foreground/slavia-architecture.png`
  - Building Facade (100×120px)
  - Door Frame (70×110px)
  - Flag Pole (60×140px)
  - Bench (100×70px)
  
  **Ločenice (Bare Field):** `assets/sprites/foreground/locenice-sparse.png`
  - Solitary Tree (80×130px)
  - Small Stone (80×70px)
  - Grass Clump (70×90px)
  - Distant Tree (60×100px)

- [ ] Metadata per sheet: layer depth, collision zones, interaction points

### Phase 2E: Color Palette & Theming
**Goal:** Extract and implement color schemes from design materials

**Tasks:**
- [ ] Analyze color values from each design artboard
- [ ] Update `EnvironmentTheme.js` with extracted palettes
- [ ] Verify consistency with existing theme definitions
- [ ] Test colorblind mode accessibility (deuteranopia, protanopia, tritanopia)

---

## 3. File Structure After Integration

```
assets/
├── sprites/
│   ├── npcs/
│   │   ├── characters-atlas.png          ← NEW
│   │   ├── characters-atlas.json         ← NEW
│   │   ├── farmer-vaclav-v7.png          (existing)
│   │   └── ...
│   ├── animations/
│   │   ├── interactions.png              ← NEW (Interact + Success)
│   │   └── interactions.json             ← NEW
│   ├── foreground/
│   │   ├── nesmen-flora.png              ← NEW
│   │   ├── besednice-geology.png         ← NEW
│   │   ├── slavia-architecture.png       ← NEW
│   │   ├── locenice-sparse.png           ← NEW
│   │   └── ...
│   └── ui/
│       └── ...
└── ...

src/
├── ui/
│   ├── InventoryScreen.js                ← NEW
│   ├── StoryScreen.js                    ← NEW
│   ├── SettingsScreen.js                 ← NEW
│   ├── LocationJournalScreen.js          ← NEW
│   └── ScreenController.js               (updated)
├── render/
│   ├── EnvironmentTheme.js               (updated with new palettes)
│   └── SpriteAtlas.js                    ← NEW (sprite sheet manager)
└── ...
```

---

## 4. Design Specifications — Quick Reference

### Character Proportions
- 116px baseline (shoulder width)
- 160px height
- Head: 30px diameter
- Body: 80px tall
- Arms: 90px reach
- Legs: 60px

### Color Palette
```
Primary:    #d4a574 (tan/gold)
Accent:     #8b9d6f (sage green)
Shadow:     #5a6b4a (dark olive)
Success:    #22c55e (bright green)
Warning:    #ff6b6b (red)
```

### Animation Timing
- Interact: 4 frames @ 8 fps = 500ms
- Success: 6 frames @ 8 fps = 750ms
- Idle/idle-talking: ~200ms per pose (if looping)

### Atmospheric Perspective
- Foreground (Y > 600): 100% opacity, 1.0x scale
- Midground (Y 300–600): 85–95% opacity, 0.85–0.95x scale
- Background (Y < 300): 70% opacity, 0.7–0.8x scale

### UI Constants
- Modal padding: 20px
- Button height: 44px minimum
- Text size: 12–16px (with large-text variant)
- Colorblind modes: deuteranopia, protanopia, tritanopia

---

## 5. Testing Checklist

- [ ] Sprite sheets render correctly (no transparency issues)
- [ ] Animation frames advance at correct timing (8 fps)
- [ ] Character proportions match game world scale (116px = player width)
- [ ] Location assets layer correctly with atmospheric perspective
- [ ] UI screens align with design mockups
- [ ] Colorblind modes display correctly
- [ ] Touch targets meet 44px minimum (mobile testing)
- [ ] Performance: no FPS drops with new sprite counts
- [ ] Accessibility: keyboard navigation, screen reader support

---

## 6. Definition of Done

A phase is complete when:
1. **Code:** All implementation merged to branch
2. **Tests:** Unit + visual tests passing
3. **Mobile:** Touch controls tested on iPhone (portrait + landscape)
4. **QA:** Visual audit against design artboards passed
5. **Docs:** README updated with new assets
6. **PR Ready:** Branch passes validation, ready for merge to `main`

---

## 7. Next Steps (Immediate)

1. **Extract sprite specifications** from Claude Design artboards
   - Frame sizes, timing, color exact values
   
2. **Generate sprite assets**
   - Convert SVG to PNG from design canvas if needed
   - Or use existing sprites and catalog them per design
   
3. **Start Phase 2A** — Character sprite integration
   - Simplest phase, fast feedback loop
   
4. **Gather feedback** from mobile device testing
   - Touch responsiveness, button sizing
   
5. **Sequence remaining phases** based on validation results

---

**Owner:** Claude Design × Claude Code  
**Branch:** `claude/podklady-claude-design-038llg`  
**Release target:** Feature PR to `main` for post-v7.0.0 polish phase
