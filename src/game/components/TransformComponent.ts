import * as THREE from "three";

export interface TransformComponent {
  position: THREE.Vector3;
  previousPosition: THREE.Vector3;
  rotationY: number;
  previousRotationY: number;
  scale: THREE.Vector3;
}

export function createTransform(
  x = 0,
  y = 0,
  z = 0,
  rotationY = 0,
): TransformComponent {
  const position = new THREE.Vector3(x, y, z);

  return {
    position,
    previousPosition: position.clone(),
    rotationY,
    previousRotationY: rotationY,
    scale: new THREE.Vector3(1, 1, 1),
  };
}
