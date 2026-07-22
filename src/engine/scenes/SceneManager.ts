import type { IGameScene, SceneFactory } from "./IGameScene";

export class SceneManager {
  private readonly factories = new Map<string, SceneFactory>();
  private activeScene: IGameScene | null = null;

  register(sceneId: string, factory: SceneFactory): void {
    this.factories.set(sceneId, factory);
  }

  async changeTo(sceneId: string): Promise<void> {
    const factory = this.factories.get(sceneId);
    if (!factory) {
      throw new Error(`Scéna ${sceneId} není registrovaná.`);
    }

    const nextScene = factory();
    try {
      await nextScene.load();
    } catch (error) {
      try {
        nextScene.dispose();
      } catch {
        // A partially loaded scene is best-effort cleanup during error recovery.
      }
      throw error;
    }

    this.activeScene?.exit();
    this.activeScene?.dispose();
    this.activeScene = nextScene;
    this.activeScene.enter();
  }

  fixedUpdate(dt: number): void {
    this.requireActive().fixedUpdate(dt);
  }

  renderUpdate(frameDt: number, alpha: number): void {
    this.requireActive().renderUpdate(frameDt, alpha);
  }

  getActive(): IGameScene {
    return this.requireActive();
  }

  dispose(): void {
    this.activeScene?.exit();
    this.activeScene?.dispose();
    this.activeScene = null;
    this.factories.clear();
  }

  private requireActive(): IGameScene {
    if (!this.activeScene) {
      throw new Error("Není aktivní žádná herní scéna.");
    }

    return this.activeScene;
  }
}
