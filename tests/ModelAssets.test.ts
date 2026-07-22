import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface AssetDefinition {
  type: "texture" | "json" | "gltf";
  url: string;
}

interface AssetManifest {
  assets: Record<string, AssetDefinition>;
  bundles: Record<string, string[]>;
}

const projectRoot = process.cwd();
const manifest = JSON.parse(
  readFileSync(resolve(projectRoot, "public/assets/manifest.json"), "utf8"),
) as AssetManifest;

function readGlb(relativePath: string): {
  version: number;
  length: number;
  jsonLength: number;
  binaryLength: number;
  json: { asset?: { version?: string }; meshes?: unknown[]; nodes?: unknown[] };
} {
  const data = readFileSync(resolve(projectRoot, relativePath));
  expect(data.toString("ascii", 0, 4)).toBe("glTF");

  const version = data.readUInt32LE(4);
  const length = data.readUInt32LE(8);
  const jsonLength = data.readUInt32LE(12);
  const jsonType = data.readUInt32LE(16);
  expect(jsonType).toBe(0x4e4f534a);

  const json = JSON.parse(data.toString("utf8", 20, 20 + jsonLength)) as {
    asset?: { version?: string };
    meshes?: unknown[];
    nodes?: unknown[];
  };

  const binaryHeaderOffset = 20 + jsonLength;
  const binaryLength = data.readUInt32LE(binaryHeaderOffset);
  expect(data.readUInt32LE(binaryHeaderOffset + 4)).toBe(0x004e4942);

  return { version, length, jsonLength, binaryLength, json };
}

describe("GLB model assets", () => {
  it("registers the production models in the owning level bundles", () => {
    expect(manifest.bundles["level.chlum"]).toContain("model.hazard.tractor");
    expect(manifest.bundles["level.besednice"]).toContain("model.environment.excavator");
    expect(manifest.bundles["level.slavia"]).toContain("model.environment.slavia");
  });

  it("contains valid GLB headers, JSON chunks and binary payloads", () => {
    const modelIds = [
      "model.hazard.tractor",
      "model.environment.excavator",
      "model.environment.slavia",
    ] as const;

    for (const modelId of modelIds) {
      const definition = manifest.assets[modelId];
      expect(definition?.type).toBe("gltf");
      const relativePath = `public/${definition?.url}`;
      const data = readFileSync(resolve(projectRoot, relativePath));
      const glb = readGlb(relativePath);

      expect(glb.version).toBe(2);
      expect(glb.length).toBe(data.length);
      expect(glb.json.asset?.version).toBe("2.0");
      expect(glb.json.meshes?.length).toBeGreaterThan(0);
      expect(glb.json.nodes?.length).toBeGreaterThan(0);
      expect(glb.binaryLength).toBeGreaterThan(0);
      expect(20 + glb.jsonLength + 8 + glb.binaryLength).toBe(glb.length);
    }
  });
});
