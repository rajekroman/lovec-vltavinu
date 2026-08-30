# Audio asset provenance and license

The production audio files in this directory were created specifically for the Lovec vltavínů v7.3 project using deterministic procedural synthesis only. They contain mathematical waveforms and deterministic noise components; no external recordings, samples, melodies, or third-party sound libraries were used.

The repository-owned source pipeline is `tools/audio/build-v73-audio.py`. Its encoded-output evidence is `assets/audio/v73-audio-build-audit.json`.

Production set:
- 3 deterministic dig impact characters: hard / wet / stone;
- dig miss and perfect-dig cues;
- finding reward cues for rarity C / B / A;
- location-specific danger cues for Chlum, Nesměň, Besednice and Malše/KD Slavia;
- caught/impact cue;
- UI click / open / close / result cues;
- separate loopable ambience for Chlum, Nesměň, Besednice and Malše/KD Slavia.

Encoding: MPEG-1 Layer III, mono, 44.1 kHz. SFX use 128 kbit/s target encoding; ambience uses 192 kbit/s target encoding. Current generated production payload: 678006 bytes, below the 5 MB project audio budget.

The four ambience candidates are approximately 6 seconds each. This is an explicit v7.3 re-scope of the contradictory legacy #276 pair of requirements (four 60-second 192 kbit/s loops while keeping the entire audio payload below 5 MB). Loop quality still requires manual listen-through before the issue can be called COMPLETE.

License: CC0-1.0. These project-original files may be used, modified, redistributed, and included in released builds of this repository without attribution.

The authoritative byte sizes and SHA-256 checksums are stored in `assets/manifests/assets.json` and independently recorded in `assets/audio/v73-audio-build-audit.json`.
