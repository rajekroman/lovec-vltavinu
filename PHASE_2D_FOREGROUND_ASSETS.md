# Phase 2D: Location Foreground Assets Implementation Guide

**Issue:** #275 (UI/UX Refinement)  
**Status:** BLOCKING v7.3 launch  
**Priority:** HIGH  
**Estimated effort:** 3-4 hours (asset creation + integration)

## Overview

Phase 2D completes the visual design system for grid-based levels by adding location-specific foreground assets. These are environmental elements that render on top of the terrain tiles, providing visual depth and atmospheric perspective.

## Required Assets

### 1. Chlum Field (`assets/sprites/foreground/chlum-field.png`)

**Location:** Southern Bohemia field after rain  
**Sprites:** 4 elements, sprite sheet layout

| Name | Size | Position | Perspective | Usage |
|------|------|----------|------------|-------|
| Solitary Tree | 80×130px | (0,0) in sheet | Foreground | Village edge marker |
| Small Stone | 80×70px | (80,0) | Midground | Scattered field rocks |
| Grass Clump | 70×90px | (160,0) | Foreground | Vegetation tufts |
| Distant Tree | 60×100px | (230,0) | Background | Far edge tree line |

**Color scheme (from VISUAL_INTEGRATION_PLAN §4):**
- Grass green: #2D5016
- Soil brown: #5C4033
- Sky: #87CEEB

**Atmospheric perspective values:**
- Solitary Tree: 100% opacity, 1.0x scale, Y > 600
- Grass Clump: 95% opacity, 0.95x scale, Y > 600
- Small Stone: 85% opacity, 0.85x scale, Y 300-600
- Distant Tree: 70% opacity, 0.7x scale, Y < 300

### 2. Nesměň Forest (`assets/sprites/foreground/nesmen-flora.png`)

**Location:** South Bohemian forest with geological profiles  
**Sprites:** 4 elements

| Name | Size | Position | Description |
|------|------|----------|-------------|
| Tall Pine | 120×140px | (0,0) | Prominent forest tree |
| Dark Bush | 100×100px | (120,0) | Dense underbrush |
| Fallen Log | 120×60px | (220,0) | Ground-level log |
| Moss Stone | 80×80px | (340,0) | Lichen-covered rock |

**Color scheme:**
- Dark green: #1B4D1B
- Mid green: #2D5016
- Brown: #3E2B20

### 3. Besednice Quarry (`assets/sprites/foreground/besednice-geology.png`)

**Location:** Clay/stone quarry with geological interest  
**Sprites:** 4 elements

| Name | Size | Position | Description |
|------|------|----------|-------------|
| Rock Face | 100×120px | (0,0) | Quarry wall |
| Stone Pile | 90×100px | (100,0) | Extracted stone |
| Rough Boulder | 100×90px | (190,0) | Large stone fragment |
| Quarry Wall | 110×100px | (290,0) | Background formation |

**Color scheme:**
- Clay: #C19A6B
- Dark clay: #8B6914
- Stone: #696969

### 4. Slavia Plaza (`assets/sprites/foreground/slavia-architecture.png`)

**Location:** Historic cultural house and public space  
**Sprites:** 4 elements

| Name | Size | Position | Description |
|------|------|----------|-------------|
| Building Facade | 100×120px | (0,0) | Cultural house |
| Door Frame | 70×110px | (100,0) | Entrance detail |
| Flag Pole | 60×140px | (170,0) | Memorial or landmark |
| Bench | 100×70px | (230,0) | Public seating |

**Color scheme:**
- Stone: #D4A574
- Shadow: #5a6b4a
- Door: #8b9d6f

## Implementation Steps

### Step 1: Create Sprite Sheets (Design Phase)

**Input:** Claude Design artboards from VISUAL_INTEGRATION_PLAN.md reference  
**Output:** 4 × PNG sprite sheets (400×200px minimum)

```bash
# File structure after generation
assets/sprites/foreground/
├── chlum-field.png          (400×200px, 4 sprites)
├── nesmen-flora.png         (400×200px, 4 sprites)
├── besednice-geology.png    (400×200px, 4 sprites)
├── slavia-architecture.png  (400×200px, 4 sprites)
├── manifest.json            (sprite metadata)
└── LICENSE.md               (attribution/license)
```

### Step 2: Create Sprite Metadata

**File:** `assets/sprites/foreground/manifest.json`

```json
{
  "chlum-field": {
    "sheet": "./chlum-field.png",
    "sprites": [
      {
        "id": "chlum-solitary-tree",
        "rect": { "x": 0, "y": 0, "width": 80, "height": 130 },
        "depth": "foreground",
        "opacity": 1.0,
        "scale": 1.0,
        "collision": { "x": 0, "y": 100, "width": 40, "height": 30 }
      },
      {
        "id": "chlum-small-stone",
        "rect": { "x": 80, "y": 0, "width": 80, "height": 70 },
        "depth": "midground",
        "opacity": 0.85,
        "scale": 0.85,
        "collision": { "x": 30, "y": 50, "width": 20, "height": 20 }
      },
      {
        "id": "chlum-grass-clump",
        "rect": { "x": 160, "y": 0, "width": 70, "height": 90 },
        "depth": "foreground",
        "opacity": 0.95,
        "scale": 0.95,
        "collision": null
      },
      {
        "id": "chlum-distant-tree",
        "rect": { "x": 230, "y": 0, "width": 60, "height": 100 },
        "depth": "background",
        "opacity": 0.7,
        "scale": 0.7,
        "collision": null
      }
    ]
  },
  "nesmen-flora": { /* ... */ },
  "besednice-geology": { /* ... */ },
  "slavia-architecture": { /* ... */ }
}
```

### Step 3: Extend GridSceneVisuals

**File:** `src/grid/GridSceneVisuals.js`

Add foreground rendering layer:

```javascript
class GridSceneVisuals {
  constructor(THREE, isometricRenderer) {
    // ... existing code ...
    this.foregroundLayer = new THREE.Group();
    this.foregroundLayer.name = "foreground-assets";
  }

  // Load and render foreground assets for a level
  async loadForegroundAssets(levelId, gridSize) {
    const manifest = await this.loadManifest('assets/sprites/foreground/manifest.json');
    const levelAssets = manifest[levelId];
    if (!levelAssets) return;

    // Load sprite sheet
    const texture = await this.loadTexture(levelAssets.sheet);
    
    // Create a limited number of foreground sprites
    // Place them based on level-specific positions
    for (const sprite of levelAssets.sprites) {
      if (Math.random() > 0.3) continue; // Scatter placement
      
      const mesh = this.createSprite(texture, sprite, levelId);
      this.applyAtmosphericPerspective(mesh, sprite.depth);
      this.foregroundLayer.add(mesh);
    }
  }

  createSprite(texture, spriteConfig, levelId) {
    const { x, y, width, height } = spriteConfig.rect;
    
    // Create plane with cropped texture
    const geometry = new THREE.PlaneGeometry(width / 32, height / 32);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: spriteConfig.opacity,
      depthTest: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Random placement within level bounds
    mesh.position.z = this.getDepthLayer(spriteConfig.depth);
    mesh.scale.set(spriteConfig.scale, spriteConfig.scale, 1);
    
    return mesh;
  }

  getDepthLayer(depthType) {
    const layers = {
      "background": 0,
      "midground": 2,
      "foreground": 4
    };
    return layers[depthType] || 2;
  }

  applyAtmosphericPerspective(mesh, depthType) {
    // Slight desaturation for distant objects
    const saturation = {
      "background": 0.7,
      "midground": 0.85,
      "foreground": 1.0
    };
    mesh.material.toneMapped = false;
    // Optional: adjust color saturation per depth
  }
}
```

### Step 4: Integrate into GridScene

**File:** `src/grid/GridScene.js`

Update `createVisualWorld()` method:

```javascript
async createVisualWorld() {
  // ... existing code ...
  
  this.visuals = new GridSceneVisuals(THREE, this.isometricRenderer);
  this.visuals.addToScene(root);
  
  // NEW: Load foreground assets
  await this.visuals.loadForegroundAssets(this.levelId, this.grid.width);
  
  // ... rest of method ...
}
```

### Step 5: Update Asset Manifest

**File:** `assets/manifests/assets.json`

Add entries for new foreground assets:

```json
{
  "id": "foreground-chlum-field",
  "type": "sprite-sheet",
  "url": "./assets/sprites/foreground/chlum-field.png",
  "preload": "level:chlum",
  "role": "visual",
  "metrics": { "bytes": 45000 },
  "budget": { "bytes": 50000 }
}
```

### Step 6: Testing Checklist

- [ ] All 4 sprite sheets created with correct dimensions
- [ ] Metadata JSON validates with schema
- [ ] GridSceneVisuals.loadForegroundAssets() loads textures correctly
- [ ] Sprites render with correct atmospheric perspective
- [ ] Collision detection works (if applicable)
- [ ] Mobile viewport scales assets appropriately
- [ ] Sprite budget < 500 KB total
- [ ] All tests still pass (252/252)
- [ ] Validation passes (0 errors)
- [ ] npm run validate includes sprite budget check

## Asset Size Budget

```
Current: 0 KB (no foreground assets)
Target:  
  - Chlum field: 45 KB
  - Nesměň flora: 50 KB
  - Besednice geology: 48 KB
  - Slavia architecture: 42 KB
  ─────────────────────
  Total: ~185 KB (allowable within performance budget)
```

## Deployment Readiness

Phase 2D complete when:
- [ ] All 4 sprite sheets generated and committed
- [ ] Sprite metadata JSON created and validated
- [ ] GridSceneVisuals extended with foreground rendering
- [ ] GridScene integration complete
- [ ] Asset manifest updated with foreground entries
- [ ] All visual tests passing
- [ ] Mobile device testing (iPhone, Android) confirms correct scaling

## Related Files

- **VISUAL_INTEGRATION_PLAN.md** — Overall design system plan
- **GridSceneVisuals.js** — Visual effects and rendering
- **GridScene.js** — Level scene orchestration
- **TileDefinitions.js** — Terrain system reference
- **EnvironmentTheme.js** — Level-specific theming

## Notes

- Sprite assets should be PNG with transparency (RGBA)
- All colors should match EnvironmentTheme.js palette definitions
- Atmospheric perspective opacity should follow VISUAL_INTEGRATION_PLAN §4 spec
- Consider performance: limit foreground sprites to 8-12 per level
- Foreground layer should not interfere with interactive dig sites

---

**Owner:** Visual Design System  
**Blocks:** v7.3 launch (full visual parity)  
**Estimated time:** 3-4 hours (with design assets ready)
