import * as THREE from "three";

/** 1.5 means the camera is 50% closer than the original prototype framing. */
export const CAMERA_ZOOM = 1.5;

export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);

  private readonly offset = new THREE.Vector3(
    9.5 / CAMERA_ZOOM,
    10.5 / CAMERA_ZOOM,
    11.5 / CAMERA_ZOOM,
  );
  private readonly smoothedTarget = new THREE.Vector3();
  private initialized = false;

  update(target: THREE.Vector3, frameDt: number): void {
    if (!this.initialized) {
      this.smoothedTarget.copy(target);
      this.initialized = true;
    }

    const factor = 1 - Math.exp(-5.5 * frameDt);
    this.smoothedTarget.lerp(target, factor);
    this.camera.position.copy(this.smoothedTarget).add(this.offset);
    this.camera.lookAt(
      this.smoothedTarget.x,
      this.smoothedTarget.y + 0.7,
      this.smoothedTarget.z,
    );
  }
}
