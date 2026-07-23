import { SLAVIA_DOCUMENT_IDS } from "../data/slavia.js";
import { SlaviaScene } from "./SlaviaScene.js";

export class ProductionSlaviaScene extends SlaviaScene {
  resetRuntime() {
    super.resetRuntime();
    this.loadedTextures = new Map();
  }

  async loadAssets() {
    await super.loadAssets();
    const textures = [...this.assetEntries.values()].filter(entry => entry.type === "texture" || entry.type === "spritesheet");
    const resolved = await Promise.all(textures.map(async entry => [entry.id, await this.app.assets.get(entry.id, entry.type)]));
    this.loadedTextures = new Map(resolved);
  }

  texture(id) {
    const texture = this.loadedTextures.get(id);
    if (!texture) throw new Error(`Texture is not loaded: ${id}`);
    return texture;
  }

  async createVisualWorld() {
    const THREE = this.THREE;
    const root = new THREE.Group();
    root.name = "slavia-vertical-slice";
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.level.bounds.width, this.level.bounds.height),
      new THREE.MeshBasicMaterial({ color: 0x6d765f })
    );
    ground.position.set(this.level.bounds.x + this.level.bounds.width / 2, this.level.bounds.y + this.level.bounds.height / 2, -5);
    root.add(ground, new THREE.HemisphereLight(0xffedd0, 0x27302a, 1.55));

    const buildingEntity = this.entityByExternalId.get("kd-slavia");
    const building = this.modelFactory.clone(this.model("model-slavia-kd-building"), {
      assetId: "model-slavia-kd-building",
      rotationX: Math.PI / 2,
      scale: 62,
      z: 2
    });
    this.renderer.bindEntity(buildingEntity, building, "props");

    const playerTexture = this.texture("player-hunter-walk");
    playerTexture.repeat.set(0.25, 0.25);
    playerTexture.offset.set(0, 0.75);
    this.renderer.bindEntity(this.playerEntity, this.renderer.createSprite(playerTexture, {
      width: 72,
      height: 82,
      z: 12,
      anchorX: 0.5,
      anchorY: 0.16,
      assetId: "player-hunter-walk"
    }), "actors");

    for (const [entityId, assetId] of [["expert-eva", "npc-expert-eva"], ["thief-franta", "npc-thief-franta"]]) {
      const entity = this.entityByExternalId.get(entityId);
      const sprite = this.renderer.createSprite(this.texture(assetId), {
        width: 76,
        height: 108,
        z: 12,
        anchorX: 0.5,
        anchorY: 0.08,
        assetId
      });
      this.renderer.bindEntity(entity, sprite, "actors");
    }

    for (const documentId of SLAVIA_DOCUMENT_IDS) {
      const entity = this.entityByExternalId.get(documentId);
      const folder = this.modelFactory.clone(this.model("model-slavia-document-folder"), {
        assetId: "model-slavia-document-folder",
        rotationX: Math.PI / 2,
        scale: 18,
        z: 5
      });
      this.renderer.bindEntity(entity, folder, "props");
    }

    this.visualRoot = root;
    this.renderer.add(root, "ground");
  }

  unloadAssets() {
    this.loadedTextures.clear();
    super.unloadAssets();
  }
}
