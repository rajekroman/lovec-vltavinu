import { EventBus } from "./EventBus.js";
import { GameLoop } from "./GameLoop.js";
import { SceneManager } from "./SceneManager.js";
import { InputManager } from "./InputManager.js";
import { AssetLoader } from "./AssetLoader.js";
import { World } from "../ecs/World.js";
import { CollisionSystem } from "../systems/CollisionSystem.js";
import { AnimationSystem } from "../systems/AnimationSystem.js";
import { resolveWalkablePosition } from "../gameplay/Walkability.js";
import {
  endActiveDialogueAnimations,
  setNpcAnimationsPaused,
  updateActiveDialogueAnimations
} from "../render/NPCAnimationSystem.js";
import { SceneTransition } from "../ui/SceneTransition.js";

export class GameApp {
  constructor(options = {}) {
    this.events = options.events ?? new EventBus();
    this.world = options.world ?? new World();
    this.input = options.input ?? new InputManager({ events: this.events });
    this.assets = options.assets ?? new AssetLoader({ events: this.events });
    this.scenes = options.scenes ?? new SceneManager({ events: this.events });
    this.collisions = options.collisions ?? new CollisionSystem({ events: this.events });
    this.animations = options.animations ?? new AnimationSystem({ events: this.events });
    this.renderer = options.renderer ?? null;
    this.transition = options.transition ?? null;
    this.disposed = false;

    this.loop = options.loop ?? new GameLoop({
      fixedStep: options.fixedStep ?? 1 / 60,
      maxFrameDelta: options.maxFrameDelta ?? 0.1,
      maxSubSteps: options.maxSubSteps ?? 5
    });

    this.removeCoreSystems = [this.loop.addSystem((dt, time) => this.updateFixed(dt, time), 0)];
    this.removeCoreRenderer = this.loop.addRenderer((alpha, metrics) => {
      this.scenes.render(alpha, metrics);
      this.renderer?.render?.(alpha, metrics);
    });
  }

  async boot(initialScene, context = {}) {
    if (this.disposed) throw new Error("Cannot boot a disposed GameApp.");
    this.events.emit("app:boot:start", { initialScene });
    if (initialScene) await this.scenes.transitionTo(initialScene, context);
    this.events.emit("app:boot:complete", { initialScene });
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
    endActiveDialogueAnimations();
    setNpcAnimationsPaused(false);
    this.input.reset("scene-transition");
    if (this.transition) {
      await this.transition.fadeOut(300);
      const result = await this.scenes.transitionTo(id, context);
      await this.transition.fadeIn(300);
      return result;
    }
    return this.scenes.transitionTo(id, context);
  }

  resolveSceneWalkability(scene, dt, input) {
    if (!scene?.level) return false;
    if (!Number.isInteger(scene.playerEntity)) return false;
    const transform = this.world.get(scene.playerEntity, "transform");
    const previous = this.world.get(scene.playerEntity, "previousTransform");
    if (!transform || !previous) return false;

    const player = this.world.get(scene.playerEntity, "player");
    const collider = this.world.get(scene.playerEntity, "collider");
    const clearance = collider?.shape === "circle" ? Math.max(0, Number(collider.radius) || 0) : 0;
    const move = input?.axes?.move ?? { x: 0, y: 0 };
    const speed = Number(player?.speed) || 0;
    const canMove = scene.session?.state?.phase === "playing"
      && !scene.modal
      && !scene.resultShown;
    const desired = canMove
      ? {
          x: previous.x + (Number(move.x) || 0) * speed * dt,
          y: previous.y + (Number(move.y) || 0) * speed * dt
        }
      : { x: transform.x, y: transform.y };

    const resolved = resolveWalkablePosition(scene.level, previous, desired, clearance);
    const changed = resolved.x !== transform.x || resolved.y !== transform.y;
    transform.x = resolved.x;
    transform.y = resolved.y;
    scene.setCameraToPlayer?.();
    return changed;
  }

  updateFixed(dt, time) {
    if (this.scenes.transitioning) {
      setNpcAnimationsPaused(false);
      this.input.endFrame();
      return;
    }

    const scene = this.scenes.activeScene;
    const input = this.input.snapshot();
    if (!scene) {
      setNpcAnimationsPaused(false);
      this.input.endFrame();
      return;
    }

    const phases = [
      "beginFixed",
      "updateControl",
      "updateMovement",
      "updateCollisions",
      "updateGameplay",
      "updateObjectives",
      "updateAnimations",
      "updateLifetime",
      "updateHud"
    ];
    const hasPipeline = phases.some(name => typeof scene[name] === "function");
    if (hasPipeline) {
      for (const name of phases) {
        if (name === "updateAnimations") {
          setNpcAnimationsPaused(scene.session?.state?.phase === "paused");
        }
        scene[name]?.(dt, time, input);
        if (name === "updateMovement") this.resolveSceneWalkability(scene, dt, input);
      }
    } else {
      setNpcAnimationsPaused(scene.session?.state?.phase === "paused");
      scene.update?.(dt, time, input);
    }

    if (scene.modal === "dialog") {
      updateActiveDialogueAnimations(Math.max(0, Number(dt) || 0) * 1000);
    } else {
      endActiveDialogueAnimations();
    }
    setNpcAnimationsPaused(false);
    this.input.endFrame();
  }

  async dispose() {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    endActiveDialogueAnimations();
    setNpcAnimationsPaused(false);
    for (const remove of this.removeCoreSystems.splice(0)) remove();
    this.removeCoreRenderer?.();
    this.removeCoreRenderer = null;
    await this.scenes.dispose();
    this.input.dispose();
    this.assets.clear(asset => asset?.dispose?.());
    this.world.clear();
    this.collisions.reset();
    this.renderer?.dispose?.();
    this.transition?.dispose?.();
    this.events.emit("app:dispose", {});
    this.events.clear();
  }
}
