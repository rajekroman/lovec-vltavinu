import * as THREE from "three";
import type { AssetManager } from "../../engine/assets/AssetManager";
import { SpriteAnimator, type SpriteAtlasDefinition } from "../../engine/animation/SpriteAnimator";
import type { ComponentMap } from "../components/ComponentMap";
import { createTransform } from "../components/TransformComponent";
import type { Entity } from "./Entity";
import type { World } from "./World";

type CharacterComponents = Pick<
  Partial<ComponentMap>,
  "movement" | "collider" | "interactable"
>;

export interface SpriteCharacterOptions {
  textureId: string;
  atlasId: string;
  position: readonly [number, number, number];
  tags?: string[];
  spriteScale?: number;
  shadowRadius?: number;
  nameLabel?: string;
  tint?: number;
  components?: CharacterComponents;
}

export interface CreatedSpriteCharacter {
  entity: Entity;
  root: THREE.Group;
  animator: SpriteAnimator;
}

export function createSpriteCharacter(
  scene: THREE.Scene,
  world: World,
  assets: AssetManager,
  options: SpriteCharacterOptions,
): CreatedSpriteCharacter {
  const texture = assets.getTexture(options.textureId);
  const atlas = assets.getJson<SpriteAtlasDefinition>(options.atlasId);
  const animator = new SpriteAnimator(texture, atlas);
  const root = new THREE.Group();

  if (options.tint !== undefined) {
    animator.sprite.material.color.setHex(options.tint);
  }

  animator.sprite.scale.setScalar(options.spriteScale ?? 3.05);
  animator.sprite.renderOrder = 4;
  root.add(animator.sprite);
  root.add(createShadow(options.shadowRadius ?? 0.44));

  if (options.nameLabel) {
    root.add(createNameLabel(options.nameLabel));
  }

  scene.add(root);

  const entity = world.createEntity(
    {
      transform: createTransform(...options.position),
      renderable: {
        object: root,
        verticalOffset: 0,
      },
      animator: {
        animator,
      },
      ...options.components,
    },
    options.tags ?? [],
  );

  return { entity, root, animator };
}

function createShadow(radius: number): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({
    color: 0x10130f,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(radius, 18), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.028;
  shadow.scale.set(1, 0.64, 1);
  return shadow;
}

function createNameLabel(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 92;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas pro jmenovku NPC není dostupný.");
  }

  context.fillStyle = "rgba(12, 18, 14, 0.88)";
  context.beginPath();
  context.roundRect(4, 4, 504, 84, 22);
  context.fill();
  context.strokeStyle = "rgba(218, 202, 145, 0.55)";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#f3ecd7";
  context.font = "700 30px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 47);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const label = new THREE.Sprite(material);
  label.position.y = 2.78;
  label.scale.set(3.9, 0.7, 1);
  label.renderOrder = 6;
  return label;
}
