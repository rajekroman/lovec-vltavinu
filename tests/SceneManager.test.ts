import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { SceneManager } from "../src/engine/scenes/SceneManager";
import type { IGameScene } from "../src/engine/scenes/IGameScene";

describe("SceneManager", () => {
  it("disposes a partially loaded scene and keeps the old scene active on failure", async () => {
    const manager = new SceneManager();
    const active = createScene();
    let failedDisposeCount = 0;
    const failed = createScene({
      load: async () => {
        throw new Error("asset load failed");
      },
      dispose: () => {
        failedDisposeCount += 1;
      },
    });

    manager.register("active", () => active);
    manager.register("failed", () => failed);
    await manager.changeTo("active");

    await expect(manager.changeTo("failed")).rejects.toThrow("asset load failed");
    expect(failedDisposeCount).toBe(1);
    expect(manager.getActive()).toBe(active);

    manager.dispose();
  });
});

function createScene(overrides: Partial<IGameScene> = {}): IGameScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  return {
    load: async () => undefined,
    enter: () => undefined,
    fixedUpdate: () => undefined,
    renderUpdate: () => undefined,
    exit: () => undefined,
    dispose: () => undefined,
    getThreeScene: () => scene,
    getCamera: () => camera,
    ...overrides,
  };
}
