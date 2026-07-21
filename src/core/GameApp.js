import { EventBus } from "./EventBus.js";
import { GameLoop } from "./GameLoop.js";
import { SceneManager } from "./SceneManager.js";
import { InputManager } from "./InputManager.js";
import { AssetLoader } from "./AssetLoader.js";
import { World } from "../ecs/World.js";
import { CollisionSystem } from "../systems/CollisionSystem.js";
import { AnimationSystem } from "../systems/AnimationSystem.js";

export class GameApp {
  constructor(options = {}) {
    this.events = options.events ?? new EventBus();
    this.world = options.world ?? new World({ events: this.events });
    this.input = options.input ?? new InputManager({ events: this.events });
    this.assets = options.assets ?? new AssetLoader({ events: this.events });
    this.scenes = options.scenes ?? new SceneManager({ events: this.events });
    this.collisions = options.collisions ?? new CollisionSystem({ events: this.events });
    this.animations = options.animations ?? new AnimationSystem({ events: this.events });
    this.renderer = options.renderer ?? null;
    this.disposed = false;

    this.loop = options.loop ?? new GameLoop({
      events: this.events,
      fixedStep: options.fixedStep ?? 1 / 60,
      maxFrameDelta: options.maxFrameDelta ?? 0.1,
      maxSubSteps: options.maxSubSteps ?? 5
    });

    this.removeCoreSystems = [
      this.loop.addSystem((dt, time) => this.scenes.update(dt, time), 0),
      this.loop.addSystem(dt => this.animations.update(this.world, dt), 100),
      this.loop.addSystem(() => this.collisions.update(this.world), 200),
      this.loop.addSystem(() => this.input.endFrame(), 1000)
    ];

    this.removeCoreRenderer = this.loop.addRenderer((alpha, metrics) => {
      this.scenes.render(alpha, metrics);
      this.renderer?.render?.(alpha, metrics);
    });
  }

  async boot(initialScene, context = {}) {
    if (this.disposed) throw new Error("Cannot boot a disposed GameApp.");
    this.events.emit("app:boot:start", { initialScene, context });
    if (initialScene) await this.scenes.transitionTo(initialScene, context);
    this.events.emit("app:boot:complete", { initialScene, context });
    return this;
  }

  start() {
    if (this.disposed) throw new Error("Cannot start a disposed GameApp.");
    return this.loop.start();
  }

  stop() {
    this.input.reset("app-stop");
    return this.loop.stop();
  }

  async changeScene(id, context = {}) {
    if (this.disposed) throw new Error("Cannot change scene on a disposed GameApp.");
    this.input.reset("scene-transition");
    return this.scenes.transitionTo(id, context);
  }

  async dispose() {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    for (const remove of this.removeCoreSystems.splice(0)) remove();
    this.removeCoreRenderer?.();
    this.removeCoreRenderer = null;
    await this.scenes.dispose();
    this.input.dispose();
    this.assets.clear(asset => asset?.dispose?.());
    this.world.clear();
    this.collisions.reset();
    this.renderer?.dispose?.();
    this.events.emit("app:dispose", {});
    this.events.clear();
  }
}
