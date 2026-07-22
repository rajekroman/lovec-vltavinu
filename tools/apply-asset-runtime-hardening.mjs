import fs from "node:fs";

const scenePath = "src/scenes/ChlumScene.js";
let scene = fs.readFileSync(scenePath, "utf8");
scene = scene.replace(/const TEXTURE_IDS = Object\.freeze\(\[[\s\S]*?\]\);\nconst MODEL_IDS = Object\.freeze\(\[[\s\S]*?\]\);\n/, "");
scene = scene.replace(
  "    this.assetEntries.clear();\n    this.loadedModels.clear();",
  "    this.assetEntries.clear();\n    this.loadedTextureIds.clear();\n    this.loadedModelIds.clear();\n    this.loadedModels.clear();"
);
scene = scene.replace(
`  async loadAssets() {
    const manifest = await this.app.assets.load(MANIFEST_ENTRY);
    if (!Array.isArray(manifest)) throw new Error("Chlum asset manifest must be an array.");
    for (const entry of manifest) this.assetEntries.set(entry.id, Object.freeze({ ...entry }));
    await Promise.all(TEXTURE_IDS.map(id => this.loadTexture(id)));
    await Promise.all(MODEL_IDS.map(id => this.loadModel(id)));
  }
`,
`  async loadAssets() {
    const manifest = await this.app.assets.load(MANIFEST_ENTRY);
    if (!Array.isArray(manifest)) throw new Error("Chlum asset manifest must be an array.");
    this.app.assets.setManifest(manifest);
    const selected = this.app.assets.selectPreload(this.level.assetGroups);
    this.assetEntries = new Map(selected.map(entry => [entry.id, entry]));
    const loaded = await this.app.assets.loadAll(selected);
    for (const [id, asset] of loaded) {
      const entry = this.requireAsset(id);
      if (entry.type === "texture" || entry.type === "spritesheet") {
        this.configureTexture(entry, asset);
        this.loadedTextureIds.add(id);
      } else if (entry.type === "gltf") {
        asset.userData.assetId = id;
        this.loadedModelIds.add(id);
        this.loadedModels.set(id, asset);
      }
    }
  }
`
);
scene = scene.replace(
/  async loadTexture\(id\) \{[\s\S]*?\n  texture\(id\) \{ return this\.app\.assets\.get\(id, "texture"\); \}\n/,
`  configureTexture(entry, texture) {
    texture.colorSpace = this.THREE.SRGBColorSpace;
    if (entry.wrap === "repeat") {
      texture.wrapS = this.THREE.RepeatWrapping;
      texture.wrapT = this.THREE.RepeatWrapping;
    }
    texture.needsUpdate = true;
    return texture;
  }

  texture(id) {
    const entry = this.requireAsset(id);
    if (entry.type !== "texture" && entry.type !== "spritesheet") throw new Error(\`Asset \${id} is not a texture.\`);
    const texture = this.app.assets.get(id, entry.type);
    if (!texture) throw new Error(\`Texture is not loaded: \${id}\`);
    return texture;
  }
`
);
if (scene.includes("TEXTURE_IDS") || scene.includes("MODEL_IDS") || scene.includes("type: \"texture\"")) {
  throw new Error("ChlumScene migration did not remove manual asset/type overrides.");
}
fs.writeFileSync(scenePath, scene);

const swPath = "sw.js";
let sw = fs.readFileSync(swPath, "utf8");
sw = sw.replace('const CACHE = "lovec-vltavinu-chlum-v6-0";', 'const CACHE = "lovec-vltavinu-asset-runtime-v6-0";');
sw = sw.replace(
  '"./src/render/HybridRenderer.js", "./src/render/ThreeRenderer.js", "./src/render/GlbModelLoader.js", "./src/render/ModelFactory.js",',
  '"./src/render/HybridRenderer.js", "./src/render/ThreeRenderer.js", "./src/render/GltfAssetLoader.js", "./src/render/AssetDisposal.js", "./src/render/ModelFactory.js",\n  "./vendor/three/addons/loaders/GLTFLoader.js", "./vendor/three/addons/utils/BufferGeometryUtils.js", "./vendor/three/addons/utils/SkeletonUtils.js",'
);
fs.writeFileSync(swPath, sw);
