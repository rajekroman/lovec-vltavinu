# Audio Assets Integration Plan
**Issue:** #276  
**Status:** PLANNING → IMPLEMENTATION

## Current Inventory

### Existing Compressed Audio (in manifest)
| File | Type | Size | Duration | Preload |
|------|------|------|----------|---------|
| journey-loop.mp3 | Music (loop) | 4.3 KB | ~30s | audio:gesture |
| dig-hit.mp3 | Effect | 1 KB | 100ms | audio:gesture |
| finding-chime.mp3 | Effect | 2.1 KB | 200ms | audio:gesture |
| danger-pulse.mp3 | Effect | 2.2 KB | 400ms | audio:gesture |
| **Total** | | **9.6 KB** | | |

### Uncompressed Source Audio (Not yet integrated)
**Music (WAV format, must convert to MP3):**
| File | Purpose | Size | Target size @192kbps |
|------|---------|------|---------------------|
| city.wav | Slavia theme | 1.3 MB | ~300 KB |
| forest.wav | Nesměň theme | 2.1 MB | ~400 KB |
| field.wav | Chlum theme | 1.9 MB | ~400 KB |
| meadow.wav | Besednice theme | 932 KB | ~200 KB |
| expo.wav | Finale scene | 247 KB | ~60 KB |
| boss.wav | Boss encounter | 190 KB | ~50 KB |
| night.wav | Ambient night | 2.4 MB | ~500 KB |
| **Subtotal** | | **8.7 MB** | ~1.9 MB (MP3) |

**Sound Effects (WAV format, must convert to MP3):**
| File | Purpose | Size | Target size @128kbps |
|------|---------|------|---------------------|
| wrong.wav | Error feedback | 4 KB | 1 KB |
| step.wav | Footstep | 926 B | 500 B |
| menu.wav | Menu select | 1.4 KB | 800 B |
| police.wav | Police siren | 7.8 KB | 2 KB |
| hit.wav | Damage/hit | 2.5 KB | 1 KB |
| rare.wav | Rare finding | 6.8 KB | 2 KB |
| collect.wav | Item collect | 2.7 KB | 1 KB |
| dig.wav | Digging sound | 2.2 KB | 1 KB |
| cash.wav | Points/money | 4.6 KB | 1.5 KB |
| fill.wav | Hole fill sound | 3.1 KB | 1 KB |
| boss.wav | Boss special | 7.6 KB | 2 KB |
| win.wav | Victory sound | 12 KB | 3 KB |
| **Subtotal** | | **55.3 KB** | ~18 KB (MP3) |

**Total current:** 8.7 MB WAV + 9.6 KB MP3 = **8.71 MB**  
**Target after MP3 conversion:** 1.9 MB + 18 KB + 10 KB = **~1.93 MB** (78% reduction)

## Implementation Plan

### Phase 1: Audio Conversion (LOCAL)
**Goal:** Convert all WAV files to MP3 128/192kbps using `ffmpeg`

```bash
# Music files: 192kbps (higher quality for ambient)
for file in assets/audio/music/*.wav; do
  ffmpeg -i "$file" -q:a 2 -codec:a libmp3lame -b:a 192k "${file%.wav}.mp3"
  rm "$file"  # Remove WAV after successful conversion
done

# SFX files: 128kbps (sufficient quality for effects)
for file in assets/audio/sfx/*.wav; do
  ffmpeg -i "$file" -q:a 4 -codec:a libmp3lame -b:a 128k "${file%.wav}.mp3"
  rm "$file"
done
```

### Phase 2: Manifest Entry Creation
**Goal:** Add all audio entries to `assets/manifests/assets.json`

**Entry structure:**
```json
{
  "id": "music-chlum-field",
  "type": "audio",
  "url": "./assets/audio/music/field.mp3",
  "preload": "level:chlum",
  "role": "music",
  "loop": true,
  "volume": 0.34,
  "metrics": {
    "bytes": 400000
  },
  "budget": {
    "bytes": 500000
  },
  "sha256": "[calculate via script]",
  "disposeOwner": "AudioEngine",
  "license": {
    "spdx": "CC0-1.0",
    "source": "Project-original procedural synthesis; no external samples.",
    "notice": "./assets/audio/LICENSE.md"
  }
}
```

### Phase 3: Preload Strategy
**Goal:** Assign proper preload groups to minimize initial load

**Preload groups:**
- `"audio:gesture"` — Must load before first user interaction (4 core sounds)
- `"level:chlum"` — Load with Chlum level (field.mp3 music)
- `"level:nesmen"` — Load with Nesměň level (forest.mp3 music)
- `"level:besednice"` — Load with Besednice level (meadow.mp3 music)
- `"level:slavia"` — Load with Slavia level (city.mp3 + expo.mp3 music)
- `"audio:effect-common"` — Common effects (wrong, hit, collect, fill)
- `"audio:boss"` — Boss encounter music + sounds (boss.wav, boss.mp3)
- `"audio:ambient"` — Optional ambient (night.wav, step sounds)

### Phase 4: Audio Licensing
**Goal:** Ensure all audio has proper licensing metadata

Current assumption: All are CC0-1.0 (original project synthesis)
- Verify with `LICENSE.md` in assets/audio/
- If using external samples, document source + license

### Phase 5: Service Worker Cache Update
**Goal:** Ensure all audio files are cached offline

Update `sw.js` CORE array:
```javascript
// Add to CORE array
"./assets/audio/music/field.mp3",    // Level-specific will be lazy-loaded
"./assets/audio/music/forest.mp3",
"./assets/audio/music/meadow.mp3",
"./assets/audio/music/city.mp3",
// SFX can stay lazy-loaded or add essential ones
```

### Phase 6: Validation Updates
**Goal:** Update validation rules to verify audio budget

Update `tools/validate.mjs`:
```javascript
const expectedAudioCount = 26;  // 4 core + 7 music + 12 SFX + 3 bonus
if (audioRegistry.snapshot().length !== expectedAudioCount) {
  fail(`Audio registry must have ${expectedAudioCount} entries; found: ${audioRegistry.snapshot().length}`);
}
const totalAudioBytes = audioRegistry.snapshot().reduce((sum, entry) => sum + entry.metrics.bytes, 0);
if (totalAudioBytes > 2_000_000) {  // 2 MB budget
  fail(`Total audio size exceeds 2 MB budget: ${(totalAudioBytes / 1_000_000).toFixed(2)} MB`);
}
```

## Wiring into Gameplay

### AudioEngine Integration
```javascript
// In GameSession or scene initialization
const audioSystem = {
  playDig: () => audio.play("sfx-dig"),
  playRare: () => audio.play("sfx-rare"),
  playCollect: () => audio.play("sfx-collect"),
  playFill: () => audio.play("sfx-fill"),
  playHit: () => audio.play("sfx-hit"),
  playWrong: () => audio.play("sfx-wrong"),
  playWin: () => audio.play("sfx-win"),
  playBoss: () => audio.play("music-boss"),
  playLevelMusic: (levelId) => {
    const tracks = {
      chlum: "music-chlum-field",
      nesmen: "music-nesmen-forest",
      besednice: "music-besednice-meadow",
      slavia: "music-slavia-city"
    };
    audio.play(tracks[levelId], { loop: true, fade: true });
  }
};
```

### Dialogue System
```javascript
// Trigger audio on dialogue events
dialogueSystem.on("start", () => audio.play("sfx-menu"));
dialogueSystem.on("choice", () => audio.play("sfx-menu"));
```

## Testing Checklist

- [ ] All 22 audio files converted to MP3 (128/192 kbps)
- [ ] All entries added to assets.json with SHA256
- [ ] Audio size < 2 MB total
- [ ] Service worker CORE includes essential audio
- [ ] Validation passes (audio budget check)
- [ ] Manual audio testing in browser (headphones)
  - [ ] Menu sounds play
  - [ ] Dig sounds play on action
  - [ ] Finding sounds play on collection
  - [ ] Level music plays (looping)
  - [ ] Danger sounds trigger
  - [ ] Boss music plays on encounter
  - [ ] Volume controls work
  - [ ] Mute toggle works
  - [ ] No popping/clipping at transitions
- [ ] Mobile testing (speaker + headphones)
- [ ] Offline mode: Audio still plays from cache
- [ ] npm test: 252/252 passing

## Deployment Readiness

- [ ] All audio files compressed and committed
- [ ] Manifest validated
- [ ] Service worker cache updated
- [ ] Audio budget: < 2 MB ✓
- [ ] No broken links in manifest
- [ ] Git history clean (large files managed)

## Tools Required

- `ffmpeg` (for MP3 conversion)
- Node.js script for SHA256 calculation
- Manifest validation (`npm run validate`)

## References

- **AudioEngine:** `src/audio/AudioEngine.js`
- **AudioRegistry:** `src/audio/AudioRegistry.js`
- **Current manifest:** `assets/manifests/assets.json`
- **Service worker:** `sw.js`
- **Validation:** `tools/validate.mjs`
- **Licensing:** `assets/audio/LICENSE.md`

---

**Priority:** HIGH (gameplay feedback critical for UX)  
**Complexity:** MEDIUM (conversion + manifest updates)  
**Time estimate:** 2-3 hours (including testing)
