import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { CollisionWorld } from "../src/engine/collision/CollisionWorld";

const PLAYER = 1 << 0;
const NPC = 1 << 1;
const WORLD = 1 << 2;
const HAZARD = 1 << 3;

describe("CollisionWorld", () => {
  it("stops a moving circle before a static obstacle", () => {
    const world = new CollisionWorld();
    world.setBounds({ minX: -10, maxX: 10, minZ: -10, maxZ: 10 });
    world.addStatic({
      id: "obstacle",
      layer: WORLD,
      mask: PLAYER,
      minX: 1,
      maxX: 2,
      minZ: -1,
      maxZ: 1,
    });

    const position = new THREE.Vector3(0, 0, 0);
    world.moveCircle(
      position,
      new THREE.Vector2(2, 0),
      0.4,
      { layer: PLAYER, mask: WORLD },
    );

    expect(position.x).toBeCloseTo(0.6, 5);
    expect(position.z).toBe(0);
  });

  it("keeps the player circle inside level boundaries", () => {
    const world = new CollisionWorld();
    world.setBounds({ minX: -2, maxX: 2, minZ: -2, maxZ: 2 });
    const position = new THREE.Vector3(0, 0, 0);

    world.moveCircle(
      position,
      new THREE.Vector2(8, -8),
      0.5,
      { layer: PLAYER, mask: WORLD },
    );

    expect(position.x).toBe(1.5);
    expect(position.z).toBe(-1.5);
  });

  it("ignores a collider whose layer is absent from the moving mask", () => {
    const world = new CollisionWorld();
    world.setBounds({ minX: -10, maxX: 10, minZ: -10, maxZ: 10 });
    world.addStatic({
      id: "hazard-trigger",
      layer: HAZARD,
      mask: PLAYER,
      minX: 1,
      maxX: 2,
      minZ: -1,
      maxZ: 1,
    });

    const position = new THREE.Vector3(0, 0, 0);
    world.moveCircle(
      position,
      new THREE.Vector2(2, 0),
      0.4,
      { layer: PLAYER, mask: WORLD },
    );

    expect(position.x).toBe(2);
  });

  it("requires the static collider mask to accept the moving layer", () => {
    const world = new CollisionWorld();
    world.setBounds({ minX: -10, maxX: 10, minZ: -10, maxZ: 10 });
    world.addStatic({
      id: "npc-only-obstacle",
      layer: WORLD,
      mask: NPC,
      minX: 1,
      maxX: 2,
      minZ: -1,
      maxZ: 1,
    });

    const position = new THREE.Vector3(0, 0, 0);
    world.moveCircle(
      position,
      new THREE.Vector2(2, 0),
      0.4,
      { layer: PLAYER, mask: WORLD },
    );

    expect(position.x).toBe(2);
  });
});
