# Phase 2A: Asset Manifest Updates for NPC Sprite Atlases

## New Manifest Entries Required

These entries should be added to `assets/manifests/assets.json` after sprite atlases are generated.

### Structure Template
```json
{
  "id": "npc-{character}-atlas",
  "type": "spritesheet",
  "url": "./assets/sprites/npcs/{character}-atlas.png",
  "preload": "level:{primary_level}",
  "dimensions": {
    "width": 600,
    "height": 160
  },
  "frames": {
    "columns": 5,
    "rows": 1,
    "width": 120,
    "height": 160
  },
  "transparent": true,
  "alphaTest": 0.02,
  "metrics": {
    "bytes": 0
  },
  "budget": {
    "bytes": 100000,
    "triangles": 0,
    "textureMax": 1024
  },
  "disposeOwner": "LevelScene:{primary_level}",
  "sha256": "0000000000000000000000000000000000000000000000000000000000000000"
}
```

## Per-Character Entries

### 1. Farmer Václav (Chlum)
```json
{
  "id": "npc-farmer-vaclav-atlas",
  "type": "spritesheet",
  "url": "./assets/sprites/npcs/farmer-vaclav-atlas.png",
  "preload": "level:chlum",
  "dimensions": {
    "width": 600,
    "height": 160
  },
  "frames": {
    "columns": 5,
    "rows": 1,
    "width": 120,
    "height": 160
  },
  "transparent": true,
  "alphaTest": 0.02,
  "metrics": {
    "bytes": "TO_BE_CALCULATED"
  },
  "budget": {
    "bytes": 100000,
    "triangles": 0,
    "textureMax": 1024
  },
  "disposeOwner": "LevelScene:chlum",
  "sha256": "TO_BE_CALCULATED"
}
```

### 2. Forester Jan (Nesměň)
```json
{
  "id": "npc-forester-jan-atlas",
  "type": "spritesheet",
  "url": "./assets/sprites/npcs/forester-jan-atlas.png",
  "preload": "level:nesmen",
  "dimensions": {
    "width": 600,
    "height": 160
  },
  "frames": {
    "columns": 5,
    "rows": 1,
    "width": 120,
    "height": 160
  },
  "transparent": true,
  "alphaTest": 0.02,
  "metrics": {
    "bytes": "TO_BE_CALCULATED"
  },
  "budget": {
    "bytes": 100000,
    "triangles": 0,
    "textureMax": 1024
  },
  "disposeOwner": "LevelScene:nesmen",
  "sha256": "TO_BE_CALCULATED"
}
```

### 3. Expert Eva (Slavia, Besednice)
```json
{
  "id": "npc-expert-eva-atlas",
  "type": "spritesheet",
  "url": "./assets/sprites/npcs/expert-eva-atlas.png",
  "preload": "level:slavia",
  "dimensions": {
    "width": 600,
    "height": 160
  },
  "frames": {
    "columns": 5,
    "rows": 1,
    "width": 120,
    "height": 160
  },
  "transparent": true,
  "alphaTest": 0.02,
  "metrics": {
    "bytes": "TO_BE_CALCULATED"
  },
  "budget": {
    "bytes": 100000,
    "triangles": 0,
    "textureMax": 1024
  },
  "disposeOwner": "LevelScene:slavia",
  "sha256": "TO_BE_CALCULATED"
}
```

### 4. Rival Karel (Besednice)
```json
{
  "id": "npc-rival-karel-atlas",
  "type": "spritesheet",
  "url": "./assets/sprites/npcs/rival-karel-atlas.png",
  "preload": "level:besednice",
  "dimensions": {
    "width": 600,
    "height": 160
  },
  "frames": {
    "columns": 5,
    "rows": 1,
    "width": 120,
    "height": 160
  },
  "transparent": true,
  "alphaTest": 0.02,
  "metrics": {
    "bytes": "TO_BE_CALCULATED"
  },
  "budget": {
    "bytes": 100000,
    "triangles": 0,
    "textureMax": 1024
  },
  "disposeOwner": "LevelScene:besednice",
  "sha256": "TO_BE_CALCULATED"
}
```

### 5. Thief František (Slavia)
```json
{
  "id": "npc-thief-franta-atlas",
  "type": "spritesheet",
  "url": "./assets/sprites/npcs/thief-franta-atlas.png",
  "preload": "level:slavia",
  "dimensions": {
    "width": 600,
    "height": 160
  },
  "frames": {
    "columns": 5,
    "rows": 1,
    "width": 120,
    "height": 160
  },
  "transparent": true,
  "alphaTest": 0.02,
  "metrics": {
    "bytes": "TO_BE_CALCULATED"
  },
  "budget": {
    "bytes": 100000,
    "triangles": 0,
    "textureMax": 1024
  },
  "disposeOwner": "LevelScene:slavia",
  "sha256": "TO_BE_CALCULATED"
}
```

## Migration Path

After sprite atlas PNGs are generated:

1. **Update metrics** — Calculate actual file sizes
2. **Update sha256** — Run `sha256sum` on each PNG
3. **Add to manifest** — Insert entries into `assets.json`
4. **Verify preload** — Ensure correct level preload timing
5. **Budget check** — Validate each asset fits within byte budget
6. **Test rendering** — Verify sprite frame display in game

## Implementation

Entries can be added via:

```bash
# After generating sprites
node tools/generate-npc-atlas.mjs --character farmer_vaclav --frames-dir frames/vaclav --output assets/sprites/npcs/farmer-vaclav-atlas.png

# Update manifest with new entries
node tools/update-manifest.mjs --add-entry PHASE_2A_MANIFEST_UPDATES.md
```

## Backward Compatibility

Old entries (`npc-farmer-vaclav`, `npc-forester-jan`, etc.) should **remain** in manifest for compatibility with existing code until all references are updated to use the new atlas versions.

Deprecation timeline:
- Phase 2A: Add new atlas entries
- Phase 2A+1: Update scenes to reference new atlases
- Phase 2A+2: Remove old single-frame entries (after verification)
