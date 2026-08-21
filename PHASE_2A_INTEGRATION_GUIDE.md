# Phase 2A Integration Guide: Animated NPC Sprites

## Overview

All 5 NPC sprite atlases have been generated, optimized, and added to the asset manifest. This guide shows how to update scene files to use the new animated sprite system.

## Key Changes

### Before (Static Texture)
```javascript
// Old approach: single static texture
const farmerTexture = await this.texture("npc-farmer-vaclav");
const farmer = this.renderer.createSprite(farmerTexture, {
  width: 86,
  height: 116,
  z: 12,
  assetId: "npc-farmer-vaclav"
});
```

### After (Animated Sprite Atlas)
```javascript
// New approach: animated sprite atlas
import { createAnimatedNPC } from "../render/NPCAnimationSystem.js";

const spriteSpec = {
  assetId: "npc-farmer-vaclav-atlas",
  width: 600,  // Full atlas width
  height: 160
};

const { sprite, playAnimation, setFrame, update } = createAnimatedNPC(
  THREE,
  this.renderer,
  "farmer_vaclav",
  spriteSpec,
  { width: 120, height: 160, z: 12, anchorX: 0.5, anchorY: 0.08 }
);

// Play animations
playAnimation("idle");      // Static neutral pose
playAnimation("talk");      // Alternating talking frames
playAnimation("react_welcome"); // Reaction animation
```

## Generated Assets

| Character | Asset ID | File | Size | Preload |
|-----------|----------|------|------|---------|
| Václav (Farmer) | `npc-farmer-vaclav-atlas` | `farmer-vaclav-atlas.png` | 3.5 KB | `level:chlum` |
| Jan (Forester) | `npc-forester-jan-atlas` | `forester-jan-atlas.png` | 3.4 KB | `level:nesmen` |
| Eva (Expert) | `npc-expert-eva-atlas` | `expert-eva-atlas.png` | 3.3 KB | `level:slavia` |
| Karel (Rival) | `npc-rival-karel-atlas` | `rival-karel-atlas.png` | 3.6 KB | `level:besednice` |
| František (Thief) | `npc-thief-franta-atlas` | `thief-franta-atlas.png` | 3.6 KB | `level:slavia` |

**Total:** 17.2 KB (well within 500 KB budget)

## Integration Steps

### Step 1: Import Animation System
Add to scene file imports:
```javascript
import { createAnimatedNPC } from "../render/NPCAnimationSystem.js";
```

### Step 2: Create Animated NPC
In `createVisualWorld()` method, replace static sprite creation:

```javascript
// Define sprite specification from SpriteAtlas metadata
const spriteSpec = {
  assetId: "npc-farmer-vaclav-atlas",
  width: 600,   // From PHASE_2A_MANIFEST_UPDATES.md
  height: 160
};

// Create animated NPC with controller
const npcSprite = createAnimatedNPC(
  THREE,
  this.renderer,
  "farmer_vaclav",  // Key from NPC_SPRITES
  spriteSpec,
  {
    width: 120,
    height: 160,
    z: 12,
    anchorX: 0.5,
    anchorY: 0.08
  }
);

// Store reference for animation control
this.farmerAnimator = npcSprite;

// Bind to entity system
this.renderer.bindEntity(this.farmerEntity, npcSprite.sprite, "actors");
```

### Step 3: Update Animation Loop
In `updateScene()` method, call animator update each frame:

```javascript
updateScene(deltaMs) {
  // ... existing code ...
  
  // Update NPC animations
  if (this.farmerAnimator) {
    this.farmerAnimator.update(deltaMs);
  }
  
  // ... rest of scene update ...
}
```

### Step 4: Trigger Animations
In dialogue or interaction handlers:

```javascript
// When NPC starts talking
this.farmerAnimator.playAnimation("talk");

// When NPC reacts to player choice
this.farmerAnimator.playAnimation("react_welcome");

// When idle/default
this.farmerAnimator.playAnimation("idle");
```

## Animation Names by Character

### Václav (Farmer)
- `idle` — neutral standing pose
- `talk` — talking animation (alternating frames)
- `react_concern` — concerned reaction
- `react_welcome` — welcoming reaction
- `action_point` — pointing gesture

### Jan (Forester)
- `idle` — relaxed standing
- `talk` — talking animation
- `react_alert` — alert reaction
- `react_warning` — warning reaction
- `action_beckon` — beckoning gesture

### Eva (Expert)
- `idle` — affirming pose
- `talk` — teaching/explaining animation
- `react_curious` — curious reaction
- `react_pondering` — thinking animation
- `react_skeptical` — skeptical reaction

### Karel (Rival)
- `idle` — neutral confrontational pose
- `talk` — talking animation
- `react_aggressive` — aggressive reaction
- `react_warning` — warning reaction
- `action_back_away` — retreat animation

### František (Thief)
- `idle` — mysterious neutral pose
- `talk` — talking animation
- `react_mysterious` — mysterious reaction
- `react_friendly` — friendly reaction
- `action_warning` — warning gesture

## Scenes to Update

Priority order for integration:

1. **ChlumV7Scene.js** — Václav (Farmer)
   - Replace static farmer sprite with animated atlas
   - Remove idle wrapper effect (built into animation)
   - Wire talk/reaction animations to dialogue system

2. **NesmenScene.js** — Jan (Forester)
   - Animated NPC system ready
   - Connect to interaction triggers

3. **BesednicScene.js** — Karel (Rival)
   - High-stakes interactions benefit from facial expressions
   - Threat level animations important for gameplay

4. **SlaviaScene.js** — Eva (Expert) & František (Thief)
   - Two NPCs in same scene
   - Use NPCAnimationGroup for synchronized animations if needed

5. **DialogueSystem.js** — Dialogue-Triggered Animations
   - Hook animation playback to dialogue phases:
     - `start` → play "talk" animation
     - `middle` → continue "talk" or switch based on emotion
     - `end` → return to "idle"
   - Use `playDialogueAnimation()` helper function

## Integration Example: ChlumV7Scene

```javascript
// At top of file
import { createAnimatedNPC } from "../render/NPCAnimationSystem.js";

export class ChlumV7Scene extends ChlumNesmenBridgeScene {
  constructor(options) {
    super(options);
    this.farmerAnimator = null;
    // ... other properties ...
  }

  async createVisualWorld() {
    const THREE = this.THREE;
    // ... existing plate/player setup ...

    // Create animated farmer sprite
    const spriteSpec = {
      assetId: "npc-farmer-vaclav-atlas",
      width: 600,
      height: 160
    };

    const farmerSprite = createAnimatedNPC(
      THREE,
      this.renderer,
      "farmer_vaclav",
      spriteSpec,
      {
        width: 120,
        height: 160,
        z: 12,
        anchorX: 0.5,
        anchorY: 0.08
      }
    );

    this.farmerAnimator = farmerSprite;

    // Start with idle animation
    farmerSprite.playAnimation("idle");

    // Bind to renderer (no idle wrapper needed now)
    this.renderer.bindEntity(this.farmerEntity, farmerSprite.sprite, "actors");
  }

  updateScene(deltaMs) {
    super.updateScene(deltaMs);

    // Update farmer animation each frame
    if (this.farmerAnimator) {
      this.farmerAnimator.update(deltaMs);
    }
  }
}
```

## Dialogue Integration

Wire animations to dialogue system in DialogueSystem.js:

```javascript
import { playDialogueAnimation, playReactionAnimation } from "../render/NPCAnimationSystem.js";

export function handleDialogueStart(npcSprite, npcData) {
  playDialogueAnimation(npcSprite, "start");
}

export function handlePlayerChoice(npcSprite, choiceType) {
  if (choiceType === "positive") {
    playReactionAnimation(npcSprite, "welcome");
  } else if (choiceType === "negative") {
    playReactionAnimation(npcSprite, "concern");
  }
}

export function handleDialogueEnd(npcSprite) {
  playDialogueAnimation(npcSprite, "end");
}
```

## Performance Notes

- **Atlas size:** 600×160px per character = minimal overhead
- **PNG compression:** ~3-4 KB per atlas (uses RGBA with transparency)
- **Frame switching:** O(1) texture coordinate update (no rebinding)
- **Animation timing:** Frame-based with configurable FPS per animation
- **Memory:** Single 600×160 texture per character (vs. old 256×384 single texture)

## Testing Checklist

- [ ] Sprite displays correctly at designed 120×160 size
- [ ] All 5 frame poses render correctly
- [ ] Animation transitions are smooth (no frame glitches)
- [ ] Idle animation loops smoothly
- [ ] Dialogue animations sync with text
- [ ] Reaction animations play on player choices
- [ ] No texture bleeding between frames
- [ ] Performance stable at 60 FPS
- [ ] Mobile/low-res scaling works correctly

## Rollback Plan

If issues arise, revert to static textures:
1. Keep old asset entries in manifest (not deleted)
2. Can switch scene back to old `createSprite(texture)` approach
3. Deprecation timeline allows gradual migration

## Next Steps

1. Update ChlumV7Scene.js to use animated farmer
2. Integrate dialogue system animations
3. Test all scene interactions with animations
4. Proceed to Phase 2B: Animation frame sequences refinement
