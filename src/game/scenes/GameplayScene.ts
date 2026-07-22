import * as THREE from "three";
import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";
import type { AssetManager } from "../../engine/assets/AssetManager";
import {
  SpriteAnimator,
  type SpriteAtlasDefinition,
  type SpriteDirection,
} from "../../engine/animation/SpriteAnimator";
import { CollisionWorld } from "../../engine/collision/CollisionWorld";
import type { InputManager } from "../../engine/input/InputManager";
import { CameraRig } from "../../engine/rendering/CameraRig";
import { RenderSyncSystem } from "../../engine/rendering/RenderSyncSystem";
import type { IGameScene } from "../../engine/scenes/IGameScene";
import { CollisionLayer } from "../components/ColliderComponent";
import { createMovement } from "../components/MovementComponent";
import { createTransform } from "../components/TransformComponent";
import { getLevelDefinition, type LevelDefinition } from "../levels/LevelData";
import { AnimationSystem } from "../systems/AnimationSystem";
import { AlertSystem } from "../systems/AlertSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { DiggingSystem } from "../systems/DiggingSystem";
import { DigRevealTimeline } from "../mechanics/DigRevealTimeline";
import { ForesterSystem } from "../systems/ForesterSystem";
import { InteractionSystem } from "../systems/InteractionSystem";
import {
  LevelQuestSystem,
  type CollectionSnapshot,
  type LevelQuestSetup,
} from "../systems/LevelQuestSystem";
import { MovementSystem } from "../systems/MovementSystem";
import { PlayerControlSystem } from "../systems/PlayerControlSystem";
import { SafePositionTracker } from "../systems/SafePositionTracker";
import { World } from "../world/World";
import type { EntityId } from "../world/Entity";
import { createSpriteCharacter } from "../world/SpriteCharacterFactory";
import {
  buildLevelEnvironment,
  createDigHole,
  createExitMarker,
  createHazardVisual,
  createTractorHazardVisual,
  createSurveyMarker,
  type MoldaviteQuality,
  type HazardVisual,
} from "./DemoEnvironment";

export class GameplayScene implements IGameScene {
  private readonly scene = new THREE.Scene();
  private readonly cameraRig = new CameraRig();
  private readonly world = new World();
  private readonly collisionWorld = new CollisionWorld();
  private readonly level: LevelDefinition;

  private readonly playerControlSystem: PlayerControlSystem;
  private readonly movementSystem: MovementSystem;
  private readonly collisionSystem: CollisionSystem;
  private readonly interactionSystem: InteractionSystem;
  private readonly animationSystem: AnimationSystem;
  private readonly alertSystem: AlertSystem;
  private readonly renderSyncSystem: RenderSyncSystem;
  private readonly diggingSystem: DiggingSystem;
  private questSystem: LevelQuestSystem | null = null;
  private foresterSystem: ForesterSystem | null = null;

  private playerObject: THREE.Object3D | null = null;
  private playerEntityId: EntityId | null = null;
  private playerDigAnimator: SpriteAnimator | null = null;
  private playerDigging = false;
  private playerDigDirection: SpriteDirection = "south";
  private readonly ownedAnimators: SpriteAnimator[] = [];
  private readonly sceneUnsubscribers: Array<() => void> = [];
  private readonly surveyMarkers = new Map<EntityId, THREE.Group>();
  private readonly digHoles = new Map<EntityId, THREE.Group>();
  private readonly digRevealTimelines = new Map<EntityId, DigRevealTimeline>();
  private exitMarker: THREE.Group | null = null;
  private safePositionTracker: SafePositionTracker | null = null;
  private alarmLockRemaining = 0;
  private hazard: {
    root: THREE.Group;
    points: THREE.Vector3[];
    nextPoint: number;
    speed: number;
    radius: number;
    label: string;
    cooldown: number;
  } | null = null;
  private elapsed = 0;

  constructor(
    private readonly assets: AssetManager,
    input: InputManager,
    private readonly events: EventBus<GameEvents>,
    levelId: string,
    private readonly collectionSnapshot: () => CollectionSnapshot = () => ({
      stoneCount: 0,
      localityCount: 0,
    }),
  ) {
    this.level = getLevelDefinition(levelId);
    this.playerControlSystem = new PlayerControlSystem(this.world, input);
    this.movementSystem = new MovementSystem(this.world);
    this.collisionSystem = new CollisionSystem(this.world, this.collisionWorld);
    this.interactionSystem = new InteractionSystem(this.world, input, events);
    this.animationSystem = new AnimationSystem(this.world);
    this.alertSystem = new AlertSystem(events);
    this.renderSyncSystem = new RenderSyncSystem(this.world);
    this.diggingSystem = new DiggingSystem(this.world, input, events);
    this.sceneUnsubscribers.push(
      events.on("digging:stateChanged", ({ active }) => this.syncPlayerDiggingVisual(active)),
      events.on("digging:completed", ({ entityId, quality }) => this.revealDigHole(entityId, quality)),
      events.on("hole:filled", ({ entityId }) => this.hideDigHole(entityId)),
      events.on("danger:critical", ({ label }) => this.handleCriticalDanger(label)),
    );
  }

  async load(): Promise<void> {
    await Promise.all([
      this.assets.acquireBundle("common"),
      this.assets.acquireBundle(`level.${this.level.id}`),
    ]);

    this.collisionWorld.setBounds({ minX: -19, maxX: 19, minZ: -19, maxZ: 19 });
    const environment = buildLevelEnvironment(
      this.scene,
      this.collisionWorld,
      this.level.id,
      (assetId) => this.assets.has(assetId)
        ? this.assets.cloneModel(assetId)
        : undefined,
    );
    this.createPlayer(environment.playerSpawn);

    const setup = this.createLevelEntities();
    const foresterId = this.level.id === "chlum" || this.level.id === "nesmen"
      ? this.createForester()
      : null;
    this.questSystem = new LevelQuestSystem(this.world, this.events, this.level, setup);
    this.foresterSystem = foresterId === null
      ? null
      : new ForesterSystem(this.events, foresterId);
    this.createHazard();
  }

  enter(): void {
    this.events.emit("objective:changed", {
      text: this.level.objective,
    });
    this.events.emit("permission:changed", { granted: false });
  }

  fixedUpdate(dt: number): void {
    if (this.diggingSystem.active || this.alarmLockRemaining > 0) {
      this.playerControlSystem.stop();
    } else {
      this.playerControlSystem.update();
    }

    this.alarmLockRemaining = Math.max(0, this.alarmLockRemaining - dt);

    this.movementSystem.update(dt);
    this.collisionSystem.update(dt);
    this.updateHazard(dt);

    if (this.diggingSystem.active) {
      this.diggingSystem.update(dt);
    } else {
      this.interactionSystem.update();
    }

    this.animationSystem.update(dt);
    if (this.playerDigging) {
      this.playerDigAnimator?.update(dt);
    }
    this.updateDigRevealVisuals(dt);
    this.world.flushCommands();
  }

  renderUpdate(frameDt: number, alpha: number): void {
    this.elapsed += frameDt;
    this.renderSyncSystem.update(alpha);

    if (this.playerObject) {
      this.cameraRig.update(this.playerObject.position, frameDt);
    }

    this.surveyMarkers.forEach((marker, entityId) => {
      const entity = this.world.get(entityId);
      const interactable = entity?.components.interactable;
      const isVisible = Boolean(interactable?.enabled) && !this.questSystem?.isDug(entityId);
      marker.visible = isVisible;
      if (isVisible) {
        marker.rotation.y += frameDt * 0.32;
        const pulse = 1 + Math.sin(this.elapsed * 3.2 + entityId) * 0.045;
        marker.scale.setScalar(pulse);
      }
    });

    this.digHoles.forEach((hole, entityId) => {
      hole.visible = !this.questSystem?.isFilled(entityId);
    });
    if (this.exitMarker) {
      const exitEntity = this.world
        .query("renderable", "interactable")
        .find((entity) => entity.components.renderable.object === this.exitMarker);
      this.exitMarker.visible = Boolean(exitEntity?.components.interactable.enabled);
      if (this.exitMarker.visible) {
        this.exitMarker.rotation.y -= frameDt * 0.45;
        this.exitMarker.scale.setScalar(1 + Math.sin(this.elapsed * 3.4) * 0.055);
      }
    }
  }

  exit(): void {}

  dispose(): void {
    this.diggingSystem.dispose();
    this.questSystem?.dispose();
    this.foresterSystem?.dispose();
    this.alertSystem.reset();
    this.sceneUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.ownedAnimators.forEach((animator) => animator.dispose());
    this.world.clear();
    this.collisionWorld.clear();

    this.scene.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
      }

      if (node instanceof THREE.Mesh || node instanceof THREE.Sprite) {
        this.disposeMaterial(node.material);
      }
    });

    this.scene.clear();
    this.surveyMarkers.clear();
    this.digHoles.clear();
    this.digRevealTimelines.clear();
    this.hazard = null;
    this.safePositionTracker = null;
    this.alarmLockRemaining = 0;
    this.playerEntityId = null;
    this.playerDigAnimator = null;
    this.playerDigging = false;
  }

  getThreeScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.cameraRig.camera;
  }

  private createHazard(): void {
    const configuration: {
      visual: HazardVisual;
      points: readonly (readonly [number, number, number])[];
      speed: number;
      radius: number;
      label: string;
    } = this.level.id === "chlum"
      ? {
          visual: "tractor",
          points: [[-14, 0, -8], [14, 0, -8], [14, 0, -2], [-14, 0, -2]],
          speed: 4.8,
          radius: 1.45,
          label: "TRAKTOR V DRÁZE",
        }
      : this.level.id === "nesmen"
        ? {
            visual: "boar",
            points: [[-10, 0, -10], [10, 0, -10], [10, 0, 7], [-10, 0, 7]],
            speed: 2.55,
            radius: 1.15,
            label: "DIVOKÉ PRASE",
          }
        : this.level.id === "besednice"
          ? {
              visual: "rockfall",
              points: [[-3, 0, -10], [3, 0, -10], [3, 0, -5], [-3, 0, -5]],
              speed: 1.8,
              radius: 1.1,
              label: "NESTABILNÍ VAL",
            }
          : {
              visual: "city-cart",
              points: [[-5, 0, 6], [12, 0, 6]],
              speed: 2.2,
              radius: 0.95,
              label: "PROVOZ U NÁBŘEŽÍ",
            };

    const root = configuration.visual === "tractor"
      ? createTractorHazardVisual(
        this.assets.getTexture("sprite.hazard.tractor"),
        this.assets.has("model.hazard.tractor")
          ? this.assets.cloneModel("model.hazard.tractor")
          : undefined,
      )
      : createHazardVisual(configuration.visual);
    const start = configuration.points[0] ?? [0, 0, 0];
    root.position.set(start[0], start[1], start[2]);
    root.scale.setScalar(this.level.id === "chlum" ? 1.1 : 0.9);
    this.scene.add(root);
    this.hazard = {
      root,
      points: configuration.points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      nextPoint: 1,
      speed: configuration.speed,
      radius: configuration.radius,
      label: configuration.label,
      cooldown: 0,
    };
  }

  private updateHazard(dt: number): void {
    if (!this.hazard) {
      return;
    }

    const hazard = this.hazard;
    hazard.cooldown = Math.max(0, hazard.cooldown - dt);
    const target = hazard.points[hazard.nextPoint];
    if (target) {
      const delta = target.clone().sub(hazard.root.position);
      delta.y = 0;
      const distance = delta.length();
      if (distance <= hazard.speed * dt) {
        hazard.root.position.copy(target);
        hazard.nextPoint = (hazard.nextPoint + 1) % hazard.points.length;
      } else if (distance > 0) {
        hazard.root.position.addScaledVector(delta.normalize(), hazard.speed * dt);
      }
    }

    const player = this.world.findByTag("player");
    const playerPosition = player?.components.transform?.position;
    if (!playerPosition) {
      return;
    }

    const distanceToPlayer = Math.hypot(
      hazard.root.position.x - playerPosition.x,
      hazard.root.position.z - playerPosition.z,
    );
    const active = distanceToPlayer <= hazard.radius * 2.2;
    const alarmValue = this.alertSystem.update(dt, active, hazard.label);

    if (!active && alarmValue <= 0.28) {
      this.safePositionTracker?.remember(
        { x: playerPosition.x, z: playerPosition.z },
        alarmValue,
      );
    }

    if (active && distanceToPlayer <= hazard.radius && hazard.cooldown <= 0) {
      hazard.cooldown = 1.2;
      player?.components.movement?.velocity.set(0, 0);
      this.events.emit("ui:toastRequested", {
        text: `${hazard.label}: ustupte z dráhy.`,
        durationMs: 1800,
      });
    }
  }

  private createPlayer(position: readonly [number, number, number]): void {
    const player = createSpriteCharacter(this.scene, this.world, this.assets, {
      textureId: "sprite.player.walk",
      atlasId: "atlas.player.walk",
      position,
      tags: ["player"],
      components: {
        movement: createMovement(),
        collider: {
          shape: "circle",
          radius: 0.43,
          layer: CollisionLayer.PLAYER,
          mask: CollisionLayer.WORLD | CollisionLayer.NPC,
          isTrigger: false,
        },
      },
    });

    this.playerObject = player.root;
    this.playerEntityId = player.entity.id;

    const diggingAnimator = new SpriteAnimator(
      this.assets.getTexture("sprite.player.dig"),
      this.assets.getJson<SpriteAtlasDefinition>("atlas.player.dig"),
    );
    diggingAnimator.sprite.scale.setScalar(3.05);
    diggingAnimator.sprite.renderOrder = 4;
    diggingAnimator.sprite.visible = false;
    player.root.add(diggingAnimator.sprite);
    this.playerDigAnimator = diggingAnimator;

    this.safePositionTracker = new SafePositionTracker({
      x: position[0],
      z: position[2],
    });
    this.ownedAnimators.push(player.animator);
    this.ownedAnimators.push(diggingAnimator);
  }

  private syncPlayerDiggingVisual(active: boolean): void {
    const player = this.playerEntityId === null
      ? undefined
      : this.world.get(this.playerEntityId);
    const walkAnimator = player?.components.animator?.animator;
    const diggingAnimator = this.playerDigAnimator;

    if (!walkAnimator || !diggingAnimator) {
      return;
    }

    if (active) {
      this.playerDigging = true;
      this.playerDigDirection = this.playerEntityId === null
        ? this.playerDigDirection
        : this.animationSystem.getDirection(this.playerEntityId);
      diggingAnimator.setState("dig", this.playerDigDirection);
      diggingAnimator.update(0);
      walkAnimator.sprite.visible = false;
      diggingAnimator.sprite.visible = true;
      return;
    }

    this.playerDigging = false;
    diggingAnimator.sprite.visible = false;
    walkAnimator.sprite.visible = true;
  }

  private handleCriticalDanger(label: string): void {
    this.alarmLockRemaining = Math.max(this.alarmLockRemaining, 1.15);
    const player = this.world.findByTag("player");
    const transform = player?.components.transform;

    if (transform) {
      this.safePositionTracker?.restore(transform.position);
      transform.previousPosition.copy(transform.position);
    }

    player?.components.movement?.velocity.set(0, 0);
    player?.components.movement?.desiredDirection.set(0, 0);
    this.events.emit("ui:toastRequested", {
      text: `${label}: jste zahlédnuti. Vrací vás to na poslední bezpečné místo.`,
      durationMs: 2200,
    });
  }

  private createLevelEntities(): LevelQuestSetup {
    const permissionEntityId = this.createPermissionNpc();
    const digSiteIds = this.createDigSites();
    const opponentEntityId = this.level.requiresOpponent ? this.createOpponent() : null;
    const exitEntityId = this.createExit();

    return {
      permissionEntityId,
      digSiteIds,
      opponentEntityId,
      exitEntityId,
      collectionSnapshot: this.collectionSnapshot,
    };
  }

  private createPermissionNpc(): EntityId {
    const position = this.level.id === "chlum"
      ? ([-3.5, 0, 4.1] as const)
      : this.level.id === "nesmen"
        ? ([-12.5, 0, 10.5] as const)
        : this.level.id === "besednice"
          ? ([-12, 0, 11] as const)
          : ([0, 0, 10.5] as const);

    const name = this.level.id === "slavia"
      ? "Expertka výstavy"
      : this.level.id === "besednice"
        ? "Strážce naleziště"
        : this.level.id === "nesmen"
          ? "Lesník"
          : "Karel – hospodář";

    const textureId = this.level.id === "besednice"
      ? "sprite.npc.guard.quarry"
      : this.level.id === "slavia"
        ? "sprite.npc.expert.walk"
        : "sprite.npc.farmer.walk";
    const atlasId = this.level.id === "besednice"
      ? "atlas.npc.guard.quarry"
      : this.level.id === "slavia"
        ? "atlas.npc.expert.walk"
        : "atlas.npc.farmer.walk";

    const npc = createSpriteCharacter(this.scene, this.world, this.assets, {
      textureId,
      atlasId,
      position,
      tags: ["npc", "permissionNpc"],
      spriteScale: this.level.id === "slavia" ? 3.12 : 2.95,
      shadowRadius: 0.42,
      nameLabel: name,
      tint: undefined,
      components: {
        interactable: {
          kind: "permissionNpc",
          label: this.level.id === "slavia" ? "Promluvit s expertkou" : "Požádat o povolení",
          radius: 1.75,
          enabled: true,
        },
      },
    });

    this.addCharacterCollider(position, `permission-${this.level.id}`);
    this.ownedAnimators.push(npc.animator);
    return npc.entity.id;
  }

  private createForester(): EntityId {
    const position = this.level.id === "nesmen"
      ? ([-7.5, 0, 11] as const)
      : ([8.2, 0, 3.6] as const);
    const forester = createSpriteCharacter(this.scene, this.world, this.assets, {
      textureId: "sprite.npc.forester.static",
      atlasId: "atlas.npc.forester.static",
      position,
      tags: ["npc", "forester", "static"],
      spriteScale: 2.92,
      shadowRadius: 0.43,
      nameLabel: "Milan – lesník",
      components: {
        interactable: {
          kind: "forester",
          label: "Promluvit s lesníkem",
          radius: 1.8,
          enabled: true,
        },
      },
    });

    this.addCharacterCollider(position, `forester-${this.level.id}`);
    this.ownedAnimators.push(forester.animator);
    return forester.entity.id;
  }

  private createDigSites(): EntityId[] {
    if (this.level.digCount === 0) {
      return [];
    }

    const positions: ReadonlyArray<readonly [number, number, number]> = this.level.id === "nesmen"
      ? [[-4.5, 0, 3.5], [6.5, 0, -4.2]]
      : this.level.id === "besednice"
        ? [[4.8, 0, -3.8]]
        : [[4, 0, -3]];
    const names = this.level.id === "nesmen"
      ? ["Nesměňský lesní nález", "Nesměňský hlubší nález"]
      : this.level.id === "besednice"
        ? ["Besednický ježek"]
        : ["Chlumský vltavín"];
    const ids: EntityId[] = [];

    for (let index = 0; index < this.level.digCount; index += 1) {
      const position = positions[index] ?? positions[positions.length - 1];
      const stoneName = names[index] ?? names[names.length - 1] ?? "Vltavín";
      if (!position) {
        throw new Error(`Level ${this.level.id} nemá pozici pro naleziště ${index}.`);
      }
      const marker = createSurveyMarker();
      marker.visible = false;
      marker.position.set(position[0], position[1], position[2]);
      this.scene.add(marker);

      const entity = this.world.createEntity({
        transform: createTransform(...position),
        renderable: { object: marker, verticalOffset: 0 },
        interactable: {
          kind: "digSite",
          label: "Hledat označené místo",
          radius: 1.8,
          enabled: false,
          payload: {
            stoneName,
            baseScore: this.level.id === "besednice" ? 1250 : 950,
            locality: this.level.location,
            siteIndex: index,
            provenanceDocumented: true,
          },
        },
      });
      this.surveyMarkers.set(entity.id, marker);
      ids.push(entity.id);
    }

    return ids;
  }

  private createOpponent(): EntityId {
    const position = this.level.id === "slavia"
      ? ([7, 0, 5.5] as const)
      : ([10.5, 0, -8.5] as const);
    const name = this.level.id === "slavia" ? "Franta – zloděj" : "Rival – hledač";
    const textureId = this.level.id === "slavia"
      ? "sprite.npc.thief.walk"
      : "sprite.npc.rival.walk";
    const atlasId = this.level.id === "slavia"
      ? "atlas.npc.thief.walk"
      : "atlas.npc.rival.walk";
    const opponent = createSpriteCharacter(this.scene, this.world, this.assets, {
      textureId,
      atlasId,
      position,
      tags: ["npc", "opponent"],
      spriteScale: 3.2,
      shadowRadius: 0.46,
      nameLabel: name,
      tint: undefined,
      components: {
        interactable: {
          kind: "opponent",
          label: "Najít protivníka",
          radius: 1.7,
          enabled: false,
        },
      },
    });
    this.addCharacterCollider(position, `opponent-${this.level.id}`);
    this.ownedAnimators.push(opponent.animator);
    return opponent.entity.id;
  }

  private createExit(): EntityId {
    const position = this.level.id === "slavia"
      ? ([15, 0, 13] as const)
      : ([15, 0, 15] as const);
    const marker = createExitMarker();
    marker.position.set(position[0], position[1], position[2]);
    marker.visible = false;
    this.scene.add(marker);
    this.exitMarker = marker;

    const entity = this.world.createEntity({
      transform: createTransform(...position),
      renderable: { object: marker, verticalOffset: 0 },
      interactable: {
        kind: "exit",
        label: this.level.id === "slavia" ? "Vstoupit na akci" : "Opustit lokalitu",
        radius: 1.7,
        enabled: false,
      },
    });

    return entity.id;
  }

  private addCharacterCollider(position: readonly [number, number, number], id: string): void {
    this.collisionWorld.addStatic({
      id,
      layer: CollisionLayer.NPC,
      mask: CollisionLayer.PLAYER,
      minX: position[0] - 0.48,
      maxX: position[0] + 0.48,
      minZ: position[2] - 0.38,
      maxZ: position[2] + 0.38,
    });
  }

  private revealDigHole(entityId: EntityId, quality: MoldaviteQuality): void {
    if (this.digHoles.has(entityId)) {
      return;
    }

    const entity = this.world.get(entityId);
    const position = entity?.components.transform?.position;
    if (!position) {
      return;
    }

    const marker = this.surveyMarkers.get(entityId);
    if (marker) {
      marker.visible = false;
    }

    const collectibleTexture = this.assets.getTexture(
      `sprite.collectible.moldavite.${quality.toLowerCase()}`,
    );
    const hole = createDigHole(collectibleTexture, quality);
    hole.position.copy(position);
    hole.scale.setScalar(0.72);
    this.scene.add(hole);
    this.digHoles.set(entityId, hole);
    this.digRevealTimelines.set(entityId, new DigRevealTimeline());
  }

  private hideDigHole(entityId: EntityId): void {
    const hole = this.digHoles.get(entityId);
    if (hole) {
      hole.visible = false;
    }
    this.digRevealTimelines.delete(entityId);
  }

  private updateDigRevealVisuals(frameDt: number): void {
    for (const [entityId, timeline] of this.digRevealTimelines) {
      const hole = this.digHoles.get(entityId);
      if (!hole) {
        this.digRevealTimelines.delete(entityId);
        continue;
      }

      const state = timeline.update(frameDt);
      const progress = state.progress;
      const openingProgress = easeOutCubic(clamp01((progress - 0.04) / 0.48));
      hole.scale.setScalar(0.72 + openingProgress * 0.28);

      const reward = hole.getObjectByName("moldavite-reward");
      if (reward) {
        const rewardProgress = easeOutCubic(clamp01((progress - 0.42) / 0.44));
        reward.visible = rewardProgress > 0;
        const baseScale = reward.userData.revealBaseScale as THREE.Vector3 | undefined;
        const baseY = typeof reward.userData.revealBaseY === "number"
          ? reward.userData.revealBaseY
          : reward.position.y;

        if (baseScale) {
          reward.scale.copy(baseScale).multiplyScalar(0.68 + rewardProgress * 0.32);
        }
        reward.position.y = baseY + rewardProgress * 0.28;
        reward.rotation.y += frameDt * (0.75 + rewardProgress * 0.45);
      }

      const dust = hole.getObjectByName("dig-reveal-dust");
      if (dust) {
        const dustProgress = clamp01((progress - 0.12) / 0.58);
        dust.visible = dustProgress > 0 && dustProgress < 1;
        dust.children.forEach((particle, index) => {
          const angle = (index / Math.max(1, dust.children.length)) * Math.PI * 2;
          const radius = 0.18 + dustProgress * (0.38 + (index % 2) * 0.12);
          particle.position.set(
            Math.cos(angle) * radius,
            0.095 + dustProgress * (0.14 + (index % 3) * 0.04),
            Math.sin(angle) * radius * 0.72,
          );
          particle.scale.setScalar(0.65 + dustProgress * 1.4);
          const material = particle instanceof THREE.Mesh
            ? particle.material
            : undefined;
          if (material instanceof THREE.Material) {
            material.opacity = (1 - dustProgress) * 0.68;
          }
        });
      }

      if (state.completed) {
        hole.scale.setScalar(1);
        if (reward) {
          reward.visible = true;
          const baseScale = reward.userData.revealBaseScale as THREE.Vector3 | undefined;
          if (baseScale) {
            reward.scale.copy(baseScale);
          }
          if (typeof reward.userData.revealBaseY === "number") {
            reward.position.y = reward.userData.revealBaseY;
          }
        }
        if (dust) {
          dust.visible = false;
        }
        this.digRevealTimelines.delete(entityId);
      }
    }
  }

  private disposeMaterial(material: THREE.Material | THREE.Material[]): void {
    if (Array.isArray(material)) {
      material.forEach((entry) => {
        this.disposeMaterialMap(entry);
        entry.dispose();
      });
    } else {
      this.disposeMaterialMap(material);
      material.dispose();
    }
  }

  private disposeMaterialMap(material: THREE.Material): void {
    if (material instanceof THREE.SpriteMaterial) {
      material.map?.dispose();
    }
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value: number): number {
  const inverse = 1 - clamp01(value);
  return 1 - inverse * inverse * inverse;
}
