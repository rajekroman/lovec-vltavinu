#!/usr/bin/env python3
"""Apply generated v7.3 audio audit data to runtime metadata/offline cache."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUDIO = ROOT / "assets" / "audio"
AUDIT = AUDIO / "v73-audio-build-audit.json"
MANIFEST = ROOT / "assets" / "manifests" / "assets.json"
LICENSE = AUDIO / "LICENSE.md"
SERVICE_WORKER = ROOT / "sw.js"

OLD_IDS = {
    "audio-music-journey",
    "audio-sfx-dig-hit",
    "audio-sfx-finding",
    "audio-sfx-danger",
}
OLD_FILES = {
    "journey-loop.mp3",
    "dig-hit.mp3",
    "finding-chime.mp3",
    "danger-pulse.mp3",
}

SPEC = {
    "dig-impact-hard.mp3": ("audio-sfx-dig-hard", "effect", False, 0.72),
    "dig-impact-wet.mp3": ("audio-sfx-dig-wet", "effect", False, 0.72),
    "dig-impact-stone.mp3": ("audio-sfx-dig-stone", "effect", False, 0.72),
    "dig-miss.mp3": ("audio-sfx-dig-miss", "effect", False, 0.62),
    "finding-c.mp3": ("audio-sfx-finding-c", "effect", False, 0.58),
    "finding-b.mp3": ("audio-sfx-finding-b", "effect", False, 0.64),
    "finding-a.mp3": ("audio-sfx-finding-a", "effect", False, 0.70),
    "dig-perfect.mp3": ("audio-sfx-dig-perfect", "effect", False, 0.68),
    "danger-chlum.mp3": ("audio-sfx-danger-chlum", "effect", False, 0.58),
    "danger-nesmen.mp3": ("audio-sfx-danger-nesmen", "effect", False, 0.58),
    "danger-besednice.mp3": ("audio-sfx-danger-besednice", "effect", False, 0.58),
    "danger-slavia.mp3": ("audio-sfx-danger-slavia", "effect", False, 0.58),
    "danger-caught.mp3": ("audio-sfx-danger-caught", "effect", False, 0.68),
    "ui-click.mp3": ("audio-ui-click", "effect", False, 0.45),
    "ui-open.mp3": ("audio-ui-open", "effect", False, 0.48),
    "ui-close.mp3": ("audio-ui-close", "effect", False, 0.48),
    "ui-result.mp3": ("audio-ui-result", "effect", False, 0.62),
    "ambient-chlum.mp3": ("audio-ambient-chlum", "ambient", True, 0.28),
    "ambient-nesmen.mp3": ("audio-ambient-nesmen", "ambient", True, 0.28),
    "ambient-besednice.mp3": ("audio-ambient-besednice", "ambient", True, 0.28),
    "ambient-slavia.mp3": ("audio-ambient-slavia", "ambient", True, 0.28),
}


def budget_for(size: int, role: str) -> int:
    if role == "ambient":
        return 160_000
    if size <= 4_096:
        return 4_096
    if size <= 8_192:
        return 8_192
    return 16_384


def manifest_entry(row: dict[str, object]) -> dict[str, object]:
    filename = str(row["file"])
    asset_id, role, loop, volume = SPEC[filename]
    size = int(row["bytes"])
    return {
        "id": asset_id,
        "type": "audio",
        "url": f"./assets/audio/{filename}",
        "preload": "audio:gesture",
        "role": role,
        "loop": loop,
        "volume": volume,
        "metrics": {"bytes": size},
        "budget": {"bytes": budget_for(size, role)},
        "sha256": str(row["sha256"]),
        "disposeOwner": "AudioEngine",
        "license": {
            "spdx": "CC0-1.0",
            "source": "Project-original procedural synthesis; no external samples.",
            "notice": "./assets/audio/LICENSE.md",
        },
    }


def update_manifest(audit: dict[str, object]) -> None:
    rows = list(audit["files"])
    by_file = {str(row["file"]): row for row in rows}
    if set(by_file) != set(SPEC):
        missing = sorted(set(SPEC) - set(by_file))
        extra = sorted(set(by_file) - set(SPEC))
        raise SystemExit(f"audit/spec mismatch: missing={missing}, extra={extra}")
    if int(audit["total_bytes"]) >= 5_000_000:
        raise SystemExit("total audio budget exceeds 5 MB")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    new_ids = {spec[0] for spec in SPEC.values()}
    manifest = [
        entry for entry in manifest
        if entry.get("id") not in OLD_IDS and entry.get("id") not in new_ids
    ]
    manifest.extend(manifest_entry(by_file[name]) for name in SPEC)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_license(audit: dict[str, object]) -> None:
    total = int(audit["total_bytes"])
    text = f"""# Audio asset provenance and license

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

Encoding: MPEG-1 Layer III, mono, 44.1 kHz. SFX use 128 kbit/s target encoding; ambience uses 192 kbit/s target encoding. Current generated production payload: {total} bytes, below the 5 MB project audio budget.

The four ambience candidates are approximately 6 seconds each. This is an explicit v7.3 re-scope of the contradictory legacy #276 pair of requirements (four 60-second 192 kbit/s loops while keeping the entire audio payload below 5 MB). Loop quality still requires manual listen-through before the issue can be called COMPLETE.

License: CC0-1.0. These project-original files may be used, modified, redistributed, and included in released builds of this repository without attribution.

The authoritative byte sizes and SHA-256 checksums are stored in `assets/manifests/assets.json` and independently recorded in `assets/audio/v73-audio-build-audit.json`.
"""
    LICENSE.write_text(text, encoding="utf-8")


def update_service_worker() -> None:
    text = SERVICE_WORKER.read_text(encoding="utf-8")
    # Drop all old and current v7.3 audio file tokens before adding the canonical set once.
    filenames = OLD_FILES | set(SPEC)
    for filename in filenames:
        token = f'"./assets/audio/{filename}", '
        text = text.replace(token, "")
        token = f', "./assets/audio/{filename}"'
        text = text.replace(token, "")
        token = f'"./assets/audio/{filename}"'
        text = text.replace(token, "")

    anchor = '"./assets/audio/LICENSE.md"'
    if anchor not in text:
        raise SystemExit("service worker audio LICENSE anchor not found")
    paths = [f'"./assets/audio/{filename}"' for filename in SPEC]
    replacement = ", ".join(paths + [anchor])
    text = text.replace(anchor, replacement, 1)
    SERVICE_WORKER.write_text(text, encoding="utf-8")


def remove_superseded_files() -> None:
    for filename in OLD_FILES:
        path = AUDIO / filename
        if path.exists():
            path.unlink()


def main() -> None:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    update_manifest(audit)
    update_license(audit)
    update_service_worker()
    remove_superseded_files()
    print(f"Registered {len(SPEC)} v7.3 audio assets; total={audit['total_bytes']} bytes")


if __name__ == "__main__":
    main()
