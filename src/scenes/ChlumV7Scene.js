import { ChlumNesmenBridgeScene } from "./ChlumNesmenBridgeScene.js";

const V7_PLATE_ASSET = "terrain-chlum-plate-v7";
const FALLBACK_PLATE_ASSET = "terrain-chlum-field";

export class ChlumV7Scene extends ChlumNesmenBridgeScene {
  constructor(options) {
    super(options);
    this.foregroundRoot = null;
    this.visualMode = "uninitialized";
  }

  async createVisualWorld() {
    const THREE = this.THREE;
    const root = new THREE.Group();
    root.name = "chlum-v7-terrain-plate";

    const plateAssetId = this.assetEntries.has(V7_PLATE_ASSET) ? V7_PLATE_ASSET : FALLBACK_PLATE_ASSET;
    this.visualMode = plateAssetId === V7_PLATE_ASSET ? "terrain-plate-v7" : "terrain-plate-fallback";

    const [plateTexture, playerTexture, farmerTexture] = await Promise.all([
      this.texture(plateAssetId),
      this.texture("player-hunter-walk"),
      this.texture("npc-farmer-vaclav")
    ]);

    const plate = this.renderer.createTerrainPlate(plateTexture, {
      x: this.level.bounds.x,
      y: this.level.bounds.y,
      width: this.level.bounds.width,
      height: this.level.bounds.height,
      z: -12,
      assetId: plateAssetId
    });
    plate.name = "chlum-v7-main-plate";
    root.add(plate);

    // Lighting is intentionally reserved for 3D props/vehicles. The authored plate
    // already contains its final environmental light and must not be re-lit.
    const hemisphere = new THREE.HemisphereLight(0xfff2cf, 0x263b2b, 1.7);
    const sun = new THREE.DirectionalLight(0xffe3ad, 2.1);
    sun.position.set(-260, 420, 520);
    root.add(hemisphere, sun);

    // Secondary props remain sparse: the authored terrain plate owns the scene identity.
    this.addDecorModel(root, "model-chlum-hay-bale", { x: 1280, y: 925, scale: 42, rotationZ: 0.35, z: 2 });

    this.visualRoot = root;
    this.renderer.add(root, "ground");

    playerTexture.repeat.set(0.25, 0.25);
    playerTexture.offset.set(0, 0.75);
    const player = this.renderer.createSprite(playerTexture, {
      width: 86,
      height: 116,
      z: 12,
      anchorX: 0.5,
      anchorY: 0.08,
      assetId: "player-hunter-walk"
    });
    const farmer = this.renderer.createSprite(farmerTexture, {
      width: 84,
      height: 114,
      z: 12,
      anchorX: 0.5,
      anchorY: 0.08,
      assetId: "npc-farmer-vaclav"
    });
    this.renderer.bindEntity(this.playerEntity, player, "actors");
    this.renderer.bindEntity(this.farmerEntity, farmer, "actors");

    const marker = this.modelFactory.bind(this.searchEntity, this.model("model-chlum-field-marker"), {
      assetId: "model-chlum-field-marker",
      layer: "props",
      rotationX: Math.PI / 2,
      scale: 42,
      z: 3
    });
    marker.visible = false;

    this.modelFactory.bind(this.tractorEntity, this.model("model-chlum-tractor-no-driver"), {
      assetId: "model-chlum-tractor-no-driver",
      layer: "actors",
      rotationX: Math.PI / 2,
      scale: 42,
      z: 8
    });

    // Foreground occlusion is a dedicated render layer. These elements can cover
    // the lower part of actors and create depth without affecting collisions.
    const foreground = new THREE.Group();
    foreground.name = "chlum-v7-foreground-occlusion";
    foreground.add(this.modelFactory.clone(this.model("model-chlum-field-fence-segment"), {
      assetId: "model-chlum-field-fence-segment",
      x: 250,
      y: 270,
      z: 30,
      rotationX: Math.PI / 2,
      rotationZ: -0.08,
      scale: 54
    }));
    foreground.add(this.modelFactory.clone(this.model("model-chlum-field-fence-segment"), {
      assetId: "model-chlum-field-fence-segment",
      x: 490,
      y: 285,
      z: 30,
      rotationX: Math.PI / 2,
      rotationZ: 0.04,
      scale: 54
    }));
    this.foregroundRoot = foreground;
    this.renderer.add(foreground, "foreground");
  }

  destroyVisualWorld() {
    if (this.foregroundRoot) {
      this.renderer.remove(this.foregroundRoot);
      this.renderer.disposeObject(this.foregroundRoot);
      this.foregroundRoot = null;
    }
    super.destroyVisualWorld();
  }

  snapshot() {
    const snapshot = super.snapshot();
    return {
      ...snapshot,
      runtime: {
        ...snapshot.runtime,
        visualMode: this.visualMode
      }
    };
  }
}
