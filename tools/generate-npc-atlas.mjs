#!/usr/bin/env node
/**
 * Generate NPC sprite atlases from SVG sources
 *
 * Usage:
 *   node tools/generate-npc-atlas.mjs --character farmer_vaclav --output assets/sprites/npcs/farmer-vaclav-atlas.png
 *
 * Requires: ImageMagick (convert), optipng
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ATLAS_SPECS = {
  farmer_vaclav: {
    frames: 5,
    width: 120,
    height: 160,
    colors: {
      primary: "#d4a574",
      accent: "#8b9d6f",
      shadow: "#5a6b4a"
    },
    poses: ["neutral", "talking", "concerned", "welcoming", "pointing"]
  },
  forester_jan: {
    frames: 5,
    width: 120,
    height: 160,
    colors: {
      primary: "#d4a574",
      accent: "#8b9d6f",
      shadow: "#5a6b4a"
    },
    poses: ["alert", "serious", "relaxed", "warning", "beckoning"]
  },
  expert_eva: {
    frames: 5,
    width: 120,
    height: 160,
    colors: {
      primary: "#d4a574",
      accent: "#8b9d6f",
      shadow: "#5a6b4a"
    },
    poses: ["explaining", "curious", "pondering", "affirming", "skeptical"]
  },
  rival_karel: {
    frames: 5,
    width: 120,
    height: 160,
    colors: {
      primary: "#d4a574",
      accent: "#8b9d6f",
      shadow: "#5a6b4a"
    },
    poses: ["neutral", "aggressive", "smug", "warning", "backing_away"]
  },
  thief_franta: {
    frames: 5,
    width: 120,
    height: 160,
    colors: {
      primary: "#d4a574",
      accent: "#8b9d6f",
      shadow: "#5a6b4a"
    },
    poses: ["neutral", "mysterious", "scheming", "friendly", "warning"]
  }
};

function generateFromSVG(character, svgPath, outputPath) {
  const spec = ATLAS_SPECS[character];
  if (!spec) {
    throw new Error(`Unknown character: ${character}`);
  }

  console.log(`Generating sprite atlas for ${character}...`);
  console.log(`  Input: ${svgPath}`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Frames: ${spec.frames} × ${spec.width}×${spec.height}px`);

  const atlasWidth = spec.width * spec.frames;
  const atlasHeight = spec.height;

  try {
    // Convert SVG to PNG (5 frames horizontally)
    // This is a template command — actual implementation depends on the SVG structure
    const cmd = `convert \
      -size ${atlasWidth}x${atlasHeight} xc:transparent \
      -gravity NorthWest \
      ${svgPath} \
      -composite \
      ${outputPath}`;

    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: "inherit" });

    // Optimize PNG
    console.log(`Optimizing PNG...`);
    execSync(`optipng -o2 ${outputPath}`, { stdio: "inherit" });

    console.log(`✓ Generated ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate atlas: ${error.message}`);
    return false;
  }
}

function generateFromPNGs(character, framesDir, outputPath) {
  const spec = ATLAS_SPECS[character];
  if (!spec) {
    throw new Error(`Unknown character: ${character}`);
  }

  console.log(`Generating sprite atlas for ${character} from individual frames...`);
  console.log(`  Input frames: ${framesDir}/*.png`);
  console.log(`  Output: ${outputPath}`);

  const frames = spec.poses
    .map(pose => path.join(framesDir, `${pose}.png`))
    .filter(f => fs.existsSync(f));

  if (frames.length !== spec.frames) {
    throw new Error(
      `Expected ${spec.frames} frames, found ${frames.length}. Missing: ${spec.poses
        .filter((p, i) => !fs.existsSync(path.join(framesDir, `${p}.png`)))
        .join(", ")}`
    );
  }

  try {
    // Combine frames horizontally using ImageMagick
    const cmd = `convert \
      ${frames.join(" ")} \
      -gravity NorthWest \
      -background transparent \
      +append \
      ${outputPath}`;

    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: "inherit" });

    // Optimize
    console.log(`Optimizing PNG...`);
    execSync(`optipng -o2 ${outputPath}`, { stdio: "inherit" });

    console.log(`✓ Generated ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate atlas: ${error.message}`);
    return false;
  }
}

// CLI parsing
const args = process.argv.slice(2);
const character = args[args.indexOf("--character") + 1];
const output = args[args.indexOf("--output") + 1];
const framesDir = args[args.indexOf("--frames-dir") + 1];
const svgInput = args[args.indexOf("--svg") + 1];

if (!character || !output) {
  console.log(`
Usage:
  # From individual PNG files (one per pose)
  node tools/generate-npc-atlas.mjs \\
    --character farmer_vaclav \\
    --frames-dir frames/vaclav \\
    --output assets/sprites/npcs/farmer-vaclav-atlas.png

  # From SVG (requires ImageMagick)
  node tools/generate-npc-atlas.mjs \\
    --character farmer_vaclav \\
    --svg frames/vaclav.svg \\
    --output assets/sprites/npcs/farmer-vaclav-atlas.png

Available characters:
  ${Object.keys(ATLAS_SPECS).join(", ")}
  `);
  process.exit(1);
}

try {
  if (framesDir) {
    generateFromPNGs(character, framesDir, output);
  } else if (svgInput) {
    generateFromSVG(character, svgInput, output);
  } else {
    throw new Error("Provide either --frames-dir or --svg");
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
