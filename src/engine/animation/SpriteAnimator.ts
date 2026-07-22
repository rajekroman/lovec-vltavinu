import * as THREE from "three";

export type SpriteDirection = "south" | "west" | "east" | "north";
export type SpriteClip = "idle" | "walk" | "dig";

export interface SpriteAtlasDefinition {
  columns: number;
  rows: number;
  frameRate: number;
  directions: Record<SpriteDirection, number>;
  clips: Record<SpriteClip, number[]>;
}

export class SpriteAnimator {
  readonly sprite: THREE.Sprite;

  private readonly texture: THREE.Texture;
  private clip: SpriteClip = "idle";
  private direction: SpriteDirection = "south";
  private frameIndex = 0;
  private elapsed = 0;

  constructor(baseTexture: THREE.Texture, private readonly atlas: SpriteAtlasDefinition) {
    this.texture = baseTexture.clone();
    this.texture.needsUpdate = true;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.repeat.set(1 / atlas.columns, 1 / atlas.rows);

    const material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: true,
      toneMapped: false,
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.center.set(0.5, 0.06);
    this.sprite.scale.set(3.05, 3.05, 1);
    this.applyFrame();
  }

  setState(clip: SpriteClip, direction: SpriteDirection): void {
    const changed = clip !== this.clip || direction !== this.direction;
    this.clip = clip;
    this.direction = direction;

    if (changed) {
      this.frameIndex = 0;
      this.elapsed = 0;
      this.applyFrame();
    }
  }

  update(dt: number): void {
    const frames = this.atlas.clips[this.clip];

    if (frames.length <= 1) {
      return;
    }

    this.elapsed += dt;
    const frameDuration = 1 / this.atlas.frameRate;

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex = (this.frameIndex + 1) % frames.length;
      this.applyFrame();
    }
  }

  dispose(): void {
    this.texture.dispose();
    this.sprite.material.dispose();
  }

  private applyFrame(): void {
    const frames = this.atlas.clips[this.clip];
    const frame = frames[this.frameIndex] ?? 0;
    const row = this.atlas.directions[this.direction];

    this.texture.offset.set(
      frame / this.atlas.columns,
      1 - (row + 1) / this.atlas.rows,
    );
  }
}
