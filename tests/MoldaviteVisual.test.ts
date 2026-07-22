import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createDigHole } from "../src/game/scenes/DemoEnvironment";

describe("moldavite reward visual", () => {
  it("uses a textured sprite when a quality asset is available", () => {
    const texture = new THREE.Texture();
    const hole = createDigHole(texture, "A");
    const sprite = hole.getObjectByName("moldavite-reward");

    expect(sprite).toBeInstanceOf(THREE.Sprite);
    expect(sprite?.scale.x).toBeGreaterThan(0.8);
    expect(sprite?.scale.y).toBeGreaterThan(0.8);
    expect(hole.getObjectByName("dig-reveal-dust")).toBeInstanceOf(THREE.Group);
    expect(sprite?.visible).toBe(false);
    texture.dispose();
  });
});
