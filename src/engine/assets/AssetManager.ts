import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";
import { assetUrl } from "./AssetUrl";

type AssetType = "texture" | "gltf" | "json";

interface AssetDefinition {
  type: AssetType;
  url: string;
}

interface AssetManifest {
  assets: Record<string, AssetDefinition>;
  bundles: Record<string, string[]>;
}

type LoadedAsset = THREE.Texture | GLTF | unknown;

export class AssetManager {
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly gltfLoader = new GLTFLoader();
  private readonly cache = new Map<string, LoadedAsset>();
  private readonly pending = new Map<string, Promise<LoadedAsset>>();
  private manifest: AssetManifest | null = null;

  constructor(private readonly events: EventBus<GameEvents>) {}

  async initialize(manifestPath = "assets/manifest.json"): Promise<void> {
    const response = await fetch(assetUrl(manifestPath));

    if (!response.ok) {
      throw new Error(`Manifest assetů se nepodařilo načíst (${response.status}).`);
    }

    this.manifest = (await response.json()) as AssetManifest;
  }

  async acquireBundle(bundleId: string): Promise<void> {
    const manifest = this.requireManifest();
    const assetIds = manifest.bundles[bundleId];

    if (!assetIds) {
      throw new Error(`Neznámý asset bundle: ${bundleId}`);
    }

    let loaded = 0;
    const total = assetIds.length;

    await Promise.all(
      assetIds.map(async (assetId) => {
        await this.load(assetId);
        loaded += 1;
        this.events.emit("assets:progress", { loaded, total, assetId });
      }),
    );
  }

  getTexture(assetId: string): THREE.Texture {
    const asset = this.cache.get(assetId);

    if (!(asset instanceof THREE.Texture)) {
      throw new Error(`Asset ${assetId} není načtená textura.`);
    }

    return asset;
  }

  has(assetId: string): boolean {
    return this.cache.has(assetId);
  }

  getJson<TValue>(assetId: string): TValue {
    const asset = this.cache.get(assetId);

    if (asset === undefined || asset instanceof THREE.Texture) {
      throw new Error(`Asset ${assetId} není načtený JSON.`);
    }

    return asset as TValue;
  }

  cloneModel(assetId: string): THREE.Object3D {
    const asset = this.cache.get(assetId) as GLTF | undefined;

    if (!asset?.scene) {
      throw new Error(`Asset ${assetId} není načtený GLB model.`);
    }

    const instance = cloneSkeleton(asset.scene);
    instance.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) {
        return;
      }

      node.material = Array.isArray(node.material)
        ? node.material.map((material) => material.clone())
        : node.material.clone();
    });
    return instance;
  }

  dispose(): void {
    for (const asset of this.cache.values()) {
      if (asset instanceof THREE.Texture) {
        asset.dispose();
      }
    }

    this.cache.clear();
    this.pending.clear();
  }

  private load(assetId: string): Promise<LoadedAsset> {
    const cached = this.cache.get(assetId);
    if (cached !== undefined) {
      return Promise.resolve(cached);
    }

    const activeRequest = this.pending.get(assetId);
    if (activeRequest) {
      return activeRequest;
    }

    const definition = this.requireManifest().assets[assetId];
    if (!definition) {
      return Promise.reject(new Error(`Neznámý asset: ${assetId}`));
    }

    const request = this.loadDefinition(definition)
      .then((asset) => {
        this.cache.set(assetId, asset);
        this.pending.delete(assetId);
        return asset;
      })
      .catch((error: unknown) => {
        this.pending.delete(assetId);
        throw error;
      });

    this.pending.set(assetId, request);
    return request;
  }

  private async loadDefinition(definition: AssetDefinition): Promise<LoadedAsset> {
    const url = assetUrl(definition.url);

    switch (definition.type) {
      case "texture": {
        const texture = await this.textureLoader.loadAsync(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        return texture;
      }
      case "gltf":
        return this.gltfLoader.loadAsync(url);
      case "json": {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`JSON asset se nepodařilo načíst (${response.status}).`);
        }
        return response.json() as Promise<unknown>;
      }
    }
  }

  private requireManifest(): AssetManifest {
    if (!this.manifest) {
      throw new Error("AssetManager nebyl inicializován.");
    }

    return this.manifest;
  }
}
