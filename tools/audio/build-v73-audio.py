#!/usr/bin/env python3
"""Build deterministic project-original v7.3 audio candidates.

No external samples are used. The script writes mono 44.1 kHz PCM masters,
encodes SFX at 128 kbps and ambience at 192 kbps with FFmpeg, removes the
masters, and writes byte/SHA/ffprobe evidence for manifest integration.
"""
from __future__ import annotations

import hashlib
import json
import math
import random
import shutil
import struct
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "audio"
SR = 44_100
PEAK = 0.62


def clamp(value: float) -> float:
    return max(-1.0, min(1.0, value))


def normalize(samples: list[float], peak: float = PEAK) -> list[float]:
    maximum = max((abs(value) for value in samples), default=1.0) or 1.0
    scale = peak / maximum
    return [value * scale for value in samples]


def fade(samples: list[float], milliseconds: float = 20.0) -> list[float]:
    count = min(len(samples) // 2, int(SR * milliseconds / 1000))
    if count <= 0:
        return samples
    for index in range(count):
        amount = index / max(1, count - 1)
        samples[index] *= amount
        samples[-1 - index] *= amount
    return samples


def tone(duration: float, frequencies: list[float], amplitudes: list[float] | None = None,
         decay: float = 4.0, noise: float = 0.0, seed: int = 0) -> list[float]:
    count = int(SR * duration)
    amplitudes = amplitudes or [1.0] * len(frequencies)
    rng = random.Random(seed)
    samples: list[float] = []
    for index in range(count):
        time = index / SR
        value = sum(amp * math.sin(2 * math.pi * freq * time)
                    for freq, amp in zip(frequencies, amplitudes))
        if noise:
            value += noise * rng.uniform(-1.0, 1.0)
        samples.append(value * math.exp(-decay * time))
    return normalize(fade(samples))


def chirp(duration: float, start_hz: float, end_hz: float) -> list[float]:
    count = int(SR * duration)
    rate = (end_hz - start_hz) / duration
    samples = []
    for index in range(count):
        time = index / SR
        phase = 2 * math.pi * (start_hz * time + 0.5 * rate * time * time)
        samples.append(math.sin(phase) * math.exp(-4.0 * time))
    return normalize(fade(samples))


def pulse(duration: float, base: float, wobble: float = 0.0, seed: int = 0,
          noise: float = 0.02) -> list[float]:
    count = int(SR * duration)
    rng = random.Random(seed)
    phase = 0.0
    samples = []
    for index in range(count):
        time = index / SR
        frequency = base + wobble * math.sin(2 * math.pi * 2 * time)
        phase += 2 * math.pi * frequency / SR
        envelope = 0.75 + 0.2 * math.sin(2 * math.pi * 4 * time)
        samples.append(math.sin(phase) * envelope + noise * rng.uniform(-1.0, 1.0))
    return normalize(fade(samples))


def ambience(duration: float, seed: int, frequencies: list[float], noise: float) -> list[float]:
    count = int(SR * duration)
    rng = random.Random(seed)
    raw_noise = [rng.uniform(-1.0, 1.0) for _ in range(count)]
    window = 700
    rolling = 0.0
    filtered = [0.0] * count
    for index, value in enumerate(raw_noise):
        rolling += value
        if index >= window:
            rolling -= raw_noise[index - window]
        filtered[index] = rolling / min(index + 1, window)

    samples = []
    for index in range(count):
        time = index / SR
        tonal = sum(0.12 * math.sin(2 * math.pi * freq * time + offset)
                    for offset, freq in enumerate(frequencies))
        envelope = (0.72
                    + 0.16 * math.sin(2 * math.pi * time / duration)
                    + 0.07 * math.sin(4 * math.pi * time / duration + 1.0))
        samples.append((tonal + noise * filtered[index] * 8.0) * envelope)

    # Cross-blend the tail into the head to minimize loop discontinuity.
    cross = min(int(SR * 0.4), count // 4)
    head = samples[:cross]
    tail = samples[-cross:]
    for index in range(cross):
        amount = index / max(1, cross - 1)
        samples[-cross + index] = tail[index] * (1.0 - amount) + head[index] * amount
    return normalize(samples, 0.42)


def write_wav(path: Path, samples: list[float]) -> None:
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        frames = b"".join(struct.pack("<h", int(clamp(value) * 32767)) for value in samples)
        handle.writeframes(frames)


def encode(name: str, samples: list[float], bitrate: str) -> Path:
    wav_path = OUT / f".{name}.wav"
    mp3_path = OUT / f"{name}.mp3"
    write_wav(wav_path, samples)
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(wav_path), "-map_metadata", "-1",
        "-ar", str(SR), "-ac", "1", "-b:a", bitrate, str(mp3_path)
    ], check=True)
    wav_path.unlink()
    return mp3_path


def probe(path: Path) -> dict[str, object]:
    result = subprocess.run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=codec_name,sample_rate,bit_rate,duration",
        "-of", "json", str(path)
    ], check=True, capture_output=True, text=True)
    stream = json.loads(result.stdout)["streams"][0]
    return {
        "codec": stream.get("codec_name"),
        "sample_rate_hz": int(stream.get("sample_rate", 0)),
        "bit_rate": int(stream.get("bit_rate", 0)),
        "duration_seconds": round(float(stream.get("duration", 0.0)), 3),
    }


def main() -> None:
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg and ffprobe are required")
    OUT.mkdir(parents=True, exist_ok=True)

    sfx = {
        "dig-impact-hard": tone(0.12, [85, 170, 310], [1, 0.45, 0.2], 14, 0.16, 1),
        "dig-impact-wet": tone(0.14, [62, 124], [1, 0.35], 10, 0.25, 2),
        "dig-impact-stone": tone(0.13, [520, 820, 1240], [1, 0.55, 0.25], 18, 0.04, 3),
        "dig-miss": tone(0.16, [105, 92], [1, 0.8], 8, 0.025, 4),
        "finding-c": tone(0.22, [523, 659], [1, 0.55], 5),
        "finding-b": tone(0.30, [659, 784, 988], [1, 0.6, 0.35], 4),
        "finding-a": tone(0.42, [784, 988, 1319], [1, 0.7, 0.45], 3),
        "dig-perfect": tone(0.34, [988, 1319, 1568], [1, 0.55, 0.3], 4),
        "danger-chlum": pulse(0.42, 170, 14, 10),
        "danger-nesmen": tone(0.34, [1800, 2350], [1, 0.6], 5),
        "danger-besednice": tone(0.38, [110, 165], [1, 0.5], 3, 0.12, 12),
        "danger-slavia": pulse(0.50, 690, 180, 13),
        "danger-caught": tone(0.22, [72, 145, 260], [1, 0.5, 0.25], 12, 0.12, 14),
        "ui-click": tone(0.085, [900, 1250], [1, 0.35], 18),
        "ui-open": chirp(0.15, 420, 980),
        "ui-close": chirp(0.15, 980, 420),
        "ui-result": tone(0.72, [523, 659, 784, 1047], [0.4, 0.55, 0.7, 1], 2.2),
    }
    ambience_specs = {
        "ambient-chlum": (21, [83, 127, 191], 0.035),
        "ambient-nesmen": (22, [72, 108, 164], 0.045),
        "ambient-besednice": (23, [54, 81, 122], 0.055),
        "ambient-slavia": (24, [98, 147, 220], 0.032),
    }

    outputs: list[Path] = []
    for name, samples in sfx.items():
        outputs.append(encode(name, samples, "128k"))
    for name, (seed, frequencies, noise) in ambience_specs.items():
        outputs.append(encode(name, ambience(6.0, seed, frequencies, noise), "192k"))

    rows = []
    total = 0
    for path in sorted(outputs):
        data = path.read_bytes()
        total += len(data)
        info = probe(path)
        rows.append({
            "file": path.name,
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            **info,
        })

    by_name = {row["file"]: row for row in rows}
    if by_name["ui-open.mp3"]["sha256"] == by_name["ui-close.mp3"]["sha256"]:
        raise SystemExit("ui-open and ui-close must be distinct")
    if len({row["sha256"] for row in rows}) != len(rows):
        raise SystemExit("all v7.3 candidate assets must have distinct encoded content")
    if total >= 5_000_000:
        raise SystemExit(f"audio budget exceeded: {total} bytes")
    for row in rows:
        expected = 192_000 if str(row["file"]).startswith("ambient-") else 128_000
        if row["codec"] != "mp3" or row["sample_rate_hz"] != SR:
            raise SystemExit(f"invalid codec/sample rate for {row['file']}: {row}")
        if abs(int(row["bit_rate"]) - expected) > 8_000:
            raise SystemExit(f"unexpected bitrate for {row['file']}: {row['bit_rate']}")

    audit = {
        "generator": "tools/audio/build-v73-audio.py",
        "source": "project-original procedural synthesis; no external samples",
        "sample_rate_hz": SR,
        "total_bytes": total,
        "files": rows,
    }
    (OUT / "v73-audio-build-audit.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Generated {len(rows)} MP3 files, {total} bytes total")


if __name__ == "__main__":
    main()
