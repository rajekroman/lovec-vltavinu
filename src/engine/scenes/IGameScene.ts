import type * as THREE from "three";

export interface IGameScene {
  load(): Promise<void>;
  enter(): void;
  fixedUpdate(dt: number): void;
  renderUpdate(frameDt: number, alpha: number): void;
  exit(): void;
  dispose(): void;
  getThreeScene(): THREE.Scene;
  getCamera(): THREE.PerspectiveCamera;
}

export type SceneFactory = () => IGameScene;
