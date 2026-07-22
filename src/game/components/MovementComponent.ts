import * as THREE from "three";

export interface MovementComponent {
  desiredDirection: THREE.Vector2;
  velocity: THREE.Vector2;
  maxSpeed: number;
  acceleration: number;
}

export function createMovement(maxSpeed = 4.2, acceleration = 22): MovementComponent {
  return {
    desiredDirection: new THREE.Vector2(),
    velocity: new THREE.Vector2(),
    maxSpeed,
    acceleration,
  };
}
