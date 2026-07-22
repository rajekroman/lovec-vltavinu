import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { CAMERA_ZOOM, CameraRig } from "../src/engine/rendering/CameraRig";

describe("CameraRig", () => {
  it("keeps the camera 50 percent closer than the prototype framing", () => {
    const rig = new CameraRig();
    rig.update(new THREE.Vector3(0, 0, 0), 1 / 60);

    const originalDistance = Math.hypot(9.5, 10.5, 11.5);
    expect(CAMERA_ZOOM).toBe(1.5);
    expect(rig.camera.position.length()).toBeCloseTo(originalDistance / CAMERA_ZOOM, 5);
  });
});
