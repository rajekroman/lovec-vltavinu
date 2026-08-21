#!/usr/bin/env node

/**
 * Generate NPC sprite atlases from SVG pose files
 * Converts individual SVG poses → PNG frames → combined horizontal atlases
 * Outputs metrics (file size, SHA256) for manifest integration
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import crypto from "crypto";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Frame dimensions
const FRAME_WIDTH = 120;
const FRAME_HEIGHT = 160;
const FRAMES_PER_CHARACTER = 5;
const ATLAS_WIDTH = FRAME_WIDTH * FRAMES_PER_CHARACTER; // 600px

// Character definitions: ID → [pose files in order]
const CHARACTERS = {
  farmer_vaclav: [
    "vaclav-neutral.svg",
    "vaclav-talking.svg",
    "vaclav-concerned.svg",
    "vaclav-welcoming.svg",
    "vaclav-pointing.svg",
  ],
  forester_jan: [
    "jan-alert.svg",
    "jan-serious.svg",
    "jan-relaxed.svg",
    "jan-warning.svg",
    "jan-beckoning.svg",
  ],
  expert_eva: [
    "eva-explaining.svg",
    "eva-curious.svg",
    "eva-pondering.svg",
    "eva-affirming.svg",
    "eva-skeptical.svg",
  ],
  rival_karel: [
    "karel-neutral.svg",
    "karel-aggressive.svg",
    "karel-smug.svg",
    "karel-warning.svg",
    "karel-backing_away.svg",
  ],
  thief_franta: [
    "franta-neutral.svg",
    "franta-mysterious.svg",
    "franta-scheming.svg",
    "franta-friendly.svg",
    "franta-warning.svg",
  ],
};

// Output paths
const SVG_INPUT_DIR = path.join(PROJECT_ROOT, "podklady-claude-design/npcs");
const PNG_OUTPUT_DIR = path.join(PROJECT_ROOT, "assets/sprites/npcs");
const TEMP_FRAMES_DIR = path.join(PROJECT_ROOT, ".tmp/sprite-frames");

// Ensure output directory exists
if (!fs.existsSync(PNG_OUTPUT_DIR)) {
  fs.mkdirSync(PNG_OUTPUT_DIR, { recursive: true });
}

/**
 * Convert SVG file to PNG buffer using Playwright
 */
async function svgToPng(browser, svgPath, width, height) {
  const svgContent = fs.readFileSync(svgPath, "utf-8");
  const page = await browser.newPage();

  try {
    // Set viewport to frame size
    await page.setViewportSize({ width, height });

    // Load SVG with proper HTML wrapper
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${width}px;
              height: ${height}px;
            }
            svg {
              width: 100%;
              height: 100%;
              display: block;
            }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.waitForLoadState('networkidle');

    // Take screenshot with exact size (not fullPage)
    const pngBuffer = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: { x: 0, y: 0, width, height }
    });
    return pngBuffer;
  } finally {
    await page.close();
  }
}

/**
 * Create a horizontal sprite atlas from individual frame PNGs
 */
async function createAtlas(framePngBuffers, outputPath) {
  if (framePngBuffers.length !== FRAMES_PER_CHARACTER) {
    throw new Error(
      `Expected ${FRAMES_PER_CHARACTER} frames, got ${framePngBuffers.length}`
    );
  }

  // Create transparent canvas
  const atlasBuffer = await sharp({
    create: {
      width: ATLAS_WIDTH,
      height: FRAME_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  // Compose all frames horizontally
  let canvas = sharp(atlasBuffer);

  for (let i = 0; i < framePngBuffers.length; i++) {
    canvas = canvas.composite([
      {
        input: framePngBuffers[i],
        left: i * FRAME_WIDTH,
        top: 0,
      },
    ]);
  }

  await canvas.png().toFile(outputPath);
}

/**
 * Calculate SHA256 hash of a file
 */
function calculateSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Generate atlas for a single character
 */
async function generateCharacterAtlas(browser, characterId, poseFiles) {
  console.log(`\nGenerating atlas for ${characterId}...`);

  const framePngBuffers = [];

  // Convert each SVG pose to PNG
  for (let i = 0; i < poseFiles.length; i++) {
    const poseFile = poseFiles[i];
    const svgPath = path.join(SVG_INPUT_DIR, poseFile);

    if (!fs.existsSync(svgPath)) {
      throw new Error(`SVG file not found: ${svgPath}`);
    }

    console.log(`  Frame ${i + 1}/5: Converting ${poseFile}...`);

    const pngBuffer = await svgToPng(browser, svgPath, FRAME_WIDTH, FRAME_HEIGHT);
    framePngBuffers.push(pngBuffer);
  }

  // Create horizontal atlas
  const atlasFilename = `${characterId}-atlas.png`;
  const atlasPath = path.join(PNG_OUTPUT_DIR, atlasFilename);

  console.log(`  Creating atlas: ${atlasFilename}`);
  await createAtlas(framePngBuffers, atlasPath);

  // Calculate metrics
  const stats = fs.statSync(atlasPath);
  const fileSize = stats.size;
  const sha256 = calculateSha256(atlasPath);

  console.log(`  ✓ Generated: ${atlasFilename}`);
  console.log(`  Size: ${fileSize} bytes (${(fileSize / 1024).toFixed(2)} KB)`);
  console.log(`  SHA256: ${sha256}`);

  return {
    characterId,
    filename: atlasFilename,
    filepath: atlasPath,
    fileSize,
    sha256,
  };
}

/**
 * Generate manifest entry for a character atlas
 */
function generateManifestEntry(characterId, metrics, primaryLevel) {
  const levelMap = {
    farmer_vaclav: "chlum",
    forester_jan: "nesmen",
    expert_eva: "slavia",
    rival_karel: "besednice",
    thief_franta: "slavia",
  };

  const level = levelMap[characterId];

  return {
    id: `npc-${characterId}-atlas`,
    type: "spritesheet",
    url: `./assets/sprites/npcs/${metrics.filename}`,
    preload: `level:${level}`,
    dimensions: {
      width: ATLAS_WIDTH,
      height: FRAME_HEIGHT,
    },
    frames: {
      columns: FRAMES_PER_CHARACTER,
      rows: 1,
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
    },
    transparent: true,
    alphaTest: 0.02,
    metrics: {
      bytes: metrics.fileSize,
    },
    budget: {
      bytes: 100000,
      triangles: 0,
      textureMax: 1024,
    },
    disposeOwner: `LevelScene:${level}`,
    sha256: metrics.sha256,
  };
}

/**
 * Main execution
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  NPC Sprite Atlas Generator");
  console.log("═══════════════════════════════════════════════════════════");

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
  });

  try {
    const allMetrics = [];
    const manifestEntries = [];

    // Generate atlas for each character
    for (const [characterId, poseFiles] of Object.entries(CHARACTERS)) {
      const metrics = await generateCharacterAtlas(browser, characterId, poseFiles);
      allMetrics.push(metrics);
      const entry = generateManifestEntry(characterId, metrics);
      manifestEntries.push(entry);
    }

    // Summary report
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  Generation Summary");
    console.log("═══════════════════════════════════════════════════════════");

    let totalBytes = 0;
    for (const m of allMetrics) {
      totalBytes += m.fileSize;
      console.log(
        `${m.characterId.padEnd(20)} ${m.fileSize.toString().padStart(8)} bytes`
      );
    }

    console.log("───────────────────────────────────────────────────────────");
    console.log(
      `${"TOTAL".padEnd(20)} ${totalBytes.toString().padStart(8)} bytes (${(totalBytes / 1024).toFixed(2)} KB)`
    );

    // Verify budget
    const budgetPerAtlas = 100000;
    const totalBudget = budgetPerAtlas * Object.keys(CHARACTERS).length;
    const isBudgetOK = totalBytes <= totalBudget;
    console.log(
      `Budget: ${totalBytes} / ${totalBudget} bytes ${isBudgetOK ? "✓ OK" : "✗ EXCEEDED"}`
    );

    // Write manifest JSON to file
    const manifestPath = path.join(PROJECT_ROOT, "SPRITE_ATLAS_MANIFEST.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ spriteSheets: manifestEntries }, null, 2)
    );

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log(`✓ Manifest entries written to: ${manifestPath}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    // Output manifest entries for assets.json
    console.log("Add these entries to assets/manifests/assets.json:\n");
    console.log(JSON.stringify(manifestEntries, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("\n✗ Generation failed:", error.message);
  process.exit(1);
});
