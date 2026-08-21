# NPC Sprite Generation Workflow

**Source:** Claude Design NPCSheets artboard  
**Target:** Game sprite atlases in `assets/sprites/npcs/`  
**Output format:** PNG, 600×160px per character (5 frames × 120×160px)

## Characters & Poses

All characters: 120px width × 160px height per frame

### 1. Václav (Farmer) — Chlum
- Frame 0: Neutral (standing, relaxed)
- Frame 1: Talking (arms raised, animated)
- Frame 2: Concerned (arms folded, tilted posture)
- Frame 3: Welcoming (arms wide, open posture)
- Frame 4: Pointing (right arm extended, action pose)

### 2. Lesník (Forester) — Nesměň
- Frame 0: Alert (raised arms, watchful)
- Frame 1: Serious (straight arms, stern)
- Frame 2: Relaxed (lowered arms, casual)
- Frame 3: Warning (extended arms, cautionary)
- Frame 4: Beckoning (curved arm, inviting)

### 3. Znalec (Expert) — Slavia/Besednice
- Frame 0: Explaining (gesturing, teaching)
- Frame 1: Curious (questioning posture)
- Frame 2: Pondering (thoughtful pose)
- Frame 3: Affirming (welcoming arms)
- Frame 4: Skeptical (crossed arms, doubting)

### 4. Karel (Rival) — Besednice
- Frame 0: Neutral (standing, cool)
- Frame 1: Aggressive (threatening posture)
- Frame 2: Smug (confident, arrogant)
- Frame 3: Warning (cautionary)
- Frame 4: Backing Away (retreat pose)

### 5. František (Thief/Guide) — Slavia
- Frame 0: Neutral (mysterious)
- Frame 1: Mysterious (scheming)
- Frame 2: Scheming (plotting)
- Frame 3: Friendly (welcoming)
- Frame 4: Warning (alert)

## Generation Method

### Option A: Using Inkscape (Recommended)

1. **Extract SVG files** from `podklady-claude-design/npcs/*.svg`
2. **Open in Inkscape:**
   ```bash
   inkscape --export-type=png \
     --export-width=120 \
     --export-height=160 \
     --export-filename=vaclav-frame0.png \
     npcs/vaclav-neutral.svg
   ```
3. **Convert all 5 frames per character**
4. **Combine horizontally** using ImageMagick or Pillow

### Option B: Using ImageMagick (If Inkscape unavailable)

```bash
# Convert single SVG to PNG
convert -density 150 -resize 120x160 \
  npcs/vaclav-neutral.svg \
  vaclav-frame0.png

# Combine 5 frames into horizontal atlas
convert vaclav-frame*.png +append \
  farmer-vaclav-atlas.png

# Optimize
optipng -o2 farmer-vaclav-atlas.png
```

### Option C: Online SVG Converter (Quick method)

1. Visit: https://cloudconvert.com/svg-to-png
2. Upload each character's 5 SVG poses
3. Set resolution to 120×160px
4. Download all 5 frames
5. Combine locally using ImageMagick or Pillow

### Option D: Using Python with svglib

```bash
# Install requirements
pip install svglib pillow cairosvg

# Run sprite generation script
python tools/generate-npc-sprites.py \
  --input podklady-claude-design/npcs/ \
  --output assets/sprites/npcs/ \
  --width 120 --height 160
```

## Frame Specifications

| Property | Value |
|----------|-------|
| **Frame Width** | 120px |
| **Frame Height** | 160px |
| **Atlas Width** | 600px (5 frames) |
| **Atlas Height** | 160px |
| **Format** | PNG (RGBA) |
| **Color Space** | sRGB |
| **DPI** | 96 |
| **Transparency** | Yes (alpha channel) |

## Color Specs (from design)

```
Primary:  #d4a574 (tan/gold) — used for clothing, skin
Accent:   #8b9d6f (sage green) — hair, details
Shadow:   #5a6b4a (dark olive) — outlines, shadows
```

Verify colors in generated PNGs match design source (±5% tolerance).

## SVG Source Extraction

SVGs are embedded in `NPCSheets.dc.html`. To extract them:

```bash
# Extract Václav SVG frames (run from podklady-claude-design/)
python3 extract-npcs-svg.py --character vaclav --output npcs/

# Output:
# npcs/vaclav-neutral.svg
# npcs/vaclav-talking.svg
# npcs/vaclav-concerned.svg
# npcs/vaclav-welcoming.svg
# npcs/vaclav-pointing.svg
```

*Script provided at: `tools/extract-npcs-svg.mjs`*

## Quality Checklist

After generation, verify:

- [ ] All 5 frames render clearly at 120×160px
- [ ] Colors match design palette (use color picker)
- [ ] No anti-aliasing artifacts at edges
- [ ] Transparent areas are truly transparent (alpha = 0)
- [ ] File size ≤ 100KB per atlas (max 500KB total)
- [ ] SHA256 matches manifest entry

## Optimization

```bash
# Reduce file size while preserving quality
optipng -o2 farmer-vaclav-atlas.png

# Or use pngquant for further reduction
pngquant --speed 1 --quality 85-95 \
  farmer-vaclav-atlas.png \
  -o farmer-vaclav-atlas-opt.png
```

## Testing in Game

After adding to manifest:

1. **Run game:** `npm start`
2. **Navigate to Chlum** (first level)
3. **Approach NPC** (Václav)
4. **Verify sprite displays** with correct poses
5. **Check animation transitions** (idle → talk → reaction)

## Manifest Integration

Once PNGs are generated, run:

```bash
# Calculate file properties
sha256sum assets/sprites/npcs/*.png

# Update manifest with:
# - url: ./assets/sprites/npcs/{character}-atlas.png
# - dimensions: { width: 600, height: 160 }
# - metrics.bytes: (actual size)
# - sha256: (calculated hash)

# Validate manifest
node tools/validate-manifest.mjs
```

## Timeline

| Task | Time | Tools |
|------|------|-------|
| Extract SVGs | 5 min | Python/Node |
| Generate PNGs (5 chars × 5 frames) | 15-30 min | Inkscape or ImageMagick |
| Combine into atlases | 5-10 min | ImageMagick or Pillow |
| Optimize | 5 min | optipng |
| Test in game | 10-15 min | npm start |
| **Total** | **45-75 min** | — |

## Next Steps

1. ✅ **Design complete** → NPCSheets.dc.html with SVG poses
2. ⏳ **Generate PNGs** → Create sprite sheet files
3. ⏳ **Update manifest** → Add atlas entries
4. ⏳ **Integrate in scenes** → Use SpriteAtlas system (already implemented)
5. ⏳ **Test animations** → Verify in-game rendering
6. ⏳ **Proceed to Phase 2B** → Animation frame sequences

---

**Resources:**
- Design artboard: https://claude.ai/code/artifact/8e4d8702-a29f-448b-a25d-a255bc5c15b3
- SpriteAtlas system: `src/render/SpriteAtlas.js`
- Animation system: `src/render/NPCAnimationSystem.js`
- Manifest template: `PHASE_2A_MANIFEST_UPDATES.md`
