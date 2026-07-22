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

function readPngHeader(relativePath: string): {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
} {
  const data = readFileSync(resolve(projectRoot, relativePath));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(data.subarray(0, 8)).toEqual(signature);
  expect(data.subarray(12, 16).toString("ascii")).toBe("IHDR");

  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    bitDepth: data.readUInt8(24),
    colorType: data.readUInt8(25),
  };
}

describe("Asset manifest", () => {
  it("registers each significant character in its level bundle", () => {
    expect(manifest.bundles["level.besednice"]).toEqual(
      expect.arrayContaining([
        "sprite.npc.guard.quarry",
        "atlas.npc.guard.quarry",
        "sprite.npc.rival.walk",
        "atlas.npc.rival.walk",
      ]),
    );
    expect(manifest.bundles["level.slavia"]).toEqual(
      expect.arrayContaining([
        "sprite.npc.expert.walk",
        "atlas.npc.expert.walk",
        "sprite.npc.thief.walk",
        "atlas.npc.thief.walk",
      ]),
    );
  });

  it("keeps all three character atlases on the production 4 by 4 RGBA grid", () => {
    const characterAssets = [
      ["sprite.npc.guard.quarry", "atlas.npc.guard.quarry"],
      ["sprite.npc.rival.walk", "atlas.npc.rival.walk"],
      ["sprite.npc.thief.walk", "atlas.npc.thief.walk"],
      ["sprite.npc.expert.walk", "atlas.npc.expert.walk"],
    ] as const;

    for (const [textureId, atlasId] of characterAssets) {
      const texture = manifest.assets[textureId];
      const atlas = manifest.assets[atlasId];
      expect(texture?.type).toBe("texture");
      expect(atlas?.type).toBe("json");

      const header = readPngHeader(`public/${texture?.url}`);
      expect(header).toMatchObject({
        width: 1256,
        height: 1256,
        bitDepth: 8,
        colorType: 6,
      });

      const atlasData = JSON.parse(
        readFileSync(resolve(projectRoot, `public/${atlas?.url}`), "utf8"),
      ) as { columns: number; rows: number; clips: { idle: number[]; walk: number[] } };
      expect(atlasData).toMatchObject({
        columns: 4,
        rows: 4,
        clips: { idle: [0], walk: [0, 1, 2, 3] },
      });
    }
  });

  it("registers the dedicated 4 by 4 digging atlas in the common bundle", () => {
    expect(manifest.bundles.common).toEqual(
      expect.arrayContaining([
        "sprite.player.dig",
        "atlas.player.dig",
      ]),
    );

    const texture = manifest.assets["sprite.player.dig"];
    const atlas = manifest.assets["atlas.player.dig"];
    expect(texture?.type).toBe("texture");
    expect(atlas?.type).toBe("json");

    expect(readPngHeader(`public/${texture?.url}`)).toMatchObject({
      width: 1256,
      height: 1256,
      bitDepth: 8,
      colorType: 6,
    });

    const atlasData = JSON.parse(
      readFileSync(resolve(projectRoot, `public/${atlas?.url}`), "utf8"),
    ) as {
      columns: number;
      rows: number;
      clips: { idle: number[]; walk: number[]; dig: number[] };
    };
    expect(atlasData).toMatchObject({
      columns: 4,
      rows: 4,
      clips: {
        idle: [0],
        walk: [0, 1, 2, 3],
        dig: [0, 1, 2, 3],
      },
    });
  });
});
