import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const manifestPath = join(root, "assets", "manifests", "assets.json");
const auditPath = join(root, "assets", "audio", "v73-audio-build-audit.json");
const swPath = join(root, "sw.js");

const EXPECTED_IDS = new Set([
  "audio-sfx-dig-hard", "audio-sfx-dig-wet", "audio-sfx-dig-stone", "audio-sfx-dig-miss",
  "audio-sfx-finding-c", "audio-sfx-finding-b", "audio-sfx-finding-a", "audio-sfx-dig-perfect",
  "audio-sfx-danger-chlum", "audio-sfx-danger-nesmen", "audio-sfx-danger-besednice", "audio-sfx-danger-slavia",
  "audio-sfx-danger-caught", "audio-ui-click", "audio-ui-open", "audio-ui-close", "audio-ui-result",
  "audio-ambient-chlum", "audio-ambient-nesmen", "audio-ambient-besednice", "audio-ambient-slavia"
]);
const SUPERSEDED_IDS = new Set(["audio-music-journey", "audio-sfx-dig-hit", "audio-sfx-finding", "audio-sfx-danger"]);
const SUPERSEDED_FILES = ["journey-loop.mp3", "dig-hit.mp3", "finding-chime.mp3", "danger-pulse.mp3"];

async function loadState() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const audit = JSON.parse(await readFile(auditPath, "utf8"));
  return { manifest, audit };
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

test("v7.3 production audio manifest exactly covers the 21 canonical assets", async () => {
  const { manifest, audit } = await loadState();
  const entries = manifest.filter(entry => EXPECTED_IDS.has(entry.id));
  assert.equal(entries.length, EXPECTED_IDS.size);
  assert.deepEqual(new Set(entries.map(entry => entry.id)), EXPECTED_IDS);
  assert.equal(manifest.some(entry => SUPERSEDED_IDS.has(entry.id)), false);

  const auditByFile = new Map(audit.files.map(row => [row.file, row]));
  assert.equal(audit.schema_version, 2);
  assert.equal(audit.files.length, 21);
  assert.equal(audit.total_bytes < 5_000_000, true);

  let total = 0;
  for (const entry of entries) {
    assert.equal(entry.type, "audio");
    assert.equal(entry.preload, "audio:gesture");
    assert.equal(entry.disposeOwner, "AudioEngine");
    assert.equal(entry.license?.notice, "./assets/audio/LICENSE.md");
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    assert.equal(entry.budget.bytes >= entry.metrics.bytes, true);

    const filename = entry.url.split("/").at(-1);
    const row = auditByFile.get(filename);
    assert.ok(row, `missing audit row for ${filename}`);
    assert.equal(entry.metrics.bytes, row.bytes);
    assert.equal(entry.sha256, row.sha256);
    assert.equal(entry.license?.spdx, row.license_spdx);
    assert.equal(entry.license?.source, row.license_source);
    assert.ok(["CC0-1.0", "NOASSERTION"].includes(row.license_spdx));

    const path = join(root, "assets", "audio", filename);
    assert.equal((await stat(path)).size, row.bytes);
    assert.equal(await sha256(path), row.sha256);
    total += row.bytes;
  }
  assert.equal(total, audit.total_bytes);
});

test("technical encoding claims exist only where independently verified", async () => {
  const { audit } = await loadState();
  let verified = 0;
  let integrityOnly = 0;

  for (const row of audit.files) {
    if (row.technical_metadata_verified === true) {
      verified += 1;
      assert.equal(row.codec, "mp3");
      assert.equal(row.sample_rate_hz, 44_100);
      assert.equal(row.bit_rate, 128_000);
      assert.equal(typeof row.duration_seconds, "number");
      assert.equal(row.duration_seconds > 0, true);
    } else {
      integrityOnly += 1;
      assert.equal(row.technical_metadata_verified, false);
      assert.equal("codec" in row, false);
      assert.equal("sample_rate_hz" in row, false);
      assert.equal("bit_rate" in row, false);
      assert.equal("duration_seconds" in row, false);
      assert.equal(row.license_spdx, "NOASSERTION");
    }
  }

  assert.equal(verified > 0, true);
  assert.equal(integrityOnly > 0, true);
});

test("offline core contains every canonical v7.3 audio asset and no superseded generic MP3", async () => {
  const { audit } = await loadState();
  const sw = await readFile(swPath, "utf8");
  for (const row of audit.files) {
    assert.equal(sw.includes(`./assets/audio/${row.file}`), true, `offline cache missing ${row.file}`);
  }
  for (const filename of SUPERSEDED_FILES) {
    assert.equal(sw.includes(`./assets/audio/${filename}`), false, `offline cache retains ${filename}`);
    await assert.rejects(stat(join(root, "assets", "audio", filename)), { code: "ENOENT" });
  }

  assert.equal(sw.includes("./assets/audio/ambient-nesmen2.mp3"), false);
  assert.equal(sw.includes("./assets/audio/ambient-slavia2.mp3"), false);
});
