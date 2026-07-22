import type * as THREE from "three";

export interface RenderableComponent {
  object: THREE.Object3D;
  verticalOffset: number;
}
