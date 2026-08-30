#!/usr/bin/env python3
"""Synchronize canonical v7.3 audio integrity/provenance metadata."""
from __future__ import annotations

import json
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
    """Use explicit payload ceilings while keeping the global 5 MB gate authoritative."""
    if role == "ambient":
        if size > 750_000:
            raise SystemExit(f"ambient asset exceeds 750 KB ceiling: {size}")
        return 750_000
    if size <= 16_384:
        return 16_384
    if size <= 32_768:
        return 32_768
    if size <= 131_072:
        return 131_072
    raise SystemExit(f"effect asset exceeds 128 KiB ceiling: {size}")


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
            "spdx": str(row["license_spdx"]),
            "source": str(row["license_source"]),
            "notice": "./assets/audio/LICENSE.md",
        },
    }


def load_audit() -> dict[str, object]:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    rows = list(audit["files"])
    by_file = {str(row["file"]): row for row in rows}
    if set(by_file) != set(SPEC):
        missing = sorted(set(SPEC) - set(by_file))
        extra = sorted(set(by_file) - set(SPEC))
        raise SystemExit(f"audit/spec mismatch: missing={missing}, extra={extra}")
    measured_total = sum(int(row["bytes"]) for row in rows)
    if measured_total != int(audit["total_bytes"]):
        raise SystemExit(f"audit total mismatch: {audit['total_bytes']}/{measured_total}")
    if measured_total >= 5_000_000:
        raise SystemExit("total canonical audio payload exceeds 5 MB")
    return audit


def update_manifest(audit: dict[str, object]) -> None:
    rows = list(audit["files"])
    by_file = {str(row["file"]): row for row in rows}
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    new_ids = {spec[0] for spec in SPEC.values()}
    manifest = [
        entry for entry in manifest
        if entry.get("id") not in OLD_IDS and entry.get("id") not in new_ids
    ]
    manifest.extend(manifest_entry(by_file[name]) for name in SPEC)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_license(audit: dict[str, object]) -> None:
    rows = list(audit["files"])
    cc0 = sorted(str(row["file"]) for row in rows if row["license_spdx"] == "CC0-1.0")
    unasserted = sorted(str(row["file"]) for row in rows if row["license_spdx"] == "NOASSERTION")
    total = int(audit["total_bytes"])
    text = """# Audio asset provenance and license

The canonical v7.3 production audio set is the 21 files listed in
`assets/audio/v73-audio-build-audit.json` and registered in
`assets/manifests/assets.json`.

This directory now contains **mixed provenance**. A blanket CC0 statement no
longer applies to every MP3 after the direct production-audio replacements.

## Project-original procedural / CC0-1.0

The following unchanged binaries retain the repository's original procedural
synthesis provenance and CC0-1.0 declaration:

""" + "\n".join(f"- `{name}`" for name in cc0) + """

## User-supplied production replacements / NOASSERTION

The following canonical binaries were supplied as production replacements. The
repository records their exact bytes and SHA-256 for integrity, but does **not**
assert an upstream license or origin for them. The release owner must confirm
that the project has the right to redistribute/use them before publishing the
release:

""" + "\n".join(f"- `{name}`" for name in unasserted) + f"""

Canonical production payload: **{total} bytes**, below the project-wide 5 MB
audio ceiling.

Technical codec/bitrate/duration fields are asserted only for binaries whose
`technical_metadata_verified` field is `true` in the audit. Replaced binaries
remain integrity-verified by byte size and SHA-256 until their technical audio
metadata is independently measured.

## Unregistered alternates

`ambient-nesmen2.mp3` and `ambient-slavia2.mp3` are currently unregistered
alternates. They are not part of the canonical 21-file manifest/offline set and
no license assertion is made for them here.

Manual speaker/headphones listen-through remains mandatory before release.
"""
    LICENSE.write_text(text, encoding="utf-8")


def update_service_worker() -> None:
    text = SERVICE_WORKER.read_text(encoding="utf-8")
    filenames = OLD_FILES | set(SPEC)
    for filename in filenames:
        text = text.replace(f'"./assets/audio/{filename}", ', "")
        text = text.replace(f', "./assets/audio/{filename}"', "")
        text = text.replace(f'"./assets/audio/{filename}"', "")

    anchor = '"./assets/audio/LICENSE.md"'
    if anchor not in text:
        raise SystemExit("service worker audio LICENSE anchor not found")
    paths = [f'"./assets/audio/{filename}"' for filename in SPEC]
    text = text.replace(anchor, ", ".join(paths + [anchor]), 1)
    SERVICE_WORKER.write_text(text, encoding="utf-8")


def remove_superseded_files() -> None:
    for filename in OLD_FILES:
        path = AUDIO / filename
        if path.exists():
            path.unlink()


def main() -> None:
    audit = load_audit()
    update_manifest(audit)
    update_license(audit)
    update_service_worker()
    remove_superseded_files()
    print(f"Registered {len(SPEC)} canonical v7.3 audio assets; total={audit['total_bytes']} bytes")


if __name__ == "__main__":
    main()
