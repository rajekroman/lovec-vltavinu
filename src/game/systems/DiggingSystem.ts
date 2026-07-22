import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";
import type { InputManager } from "../../engine/input/InputManager";
import { RhythmChallenge } from "../mechanics/RhythmChallenge";
import { generateMoldavite } from "../mechanics/Moldavite";
import type { EntityId } from "../world/Entity";
import type { World } from "../world/World";

export class DiggingSystem {
  private readonly challenge = new RhythmChallenge();
  private readonly unsubscribe: () => void;
  private readonly completedTargetIds = new Set<EntityId>();
  private targetEntityId: EntityId | null = null;

  constructor(
    private readonly world: World,
    private readonly input: InputManager,
    private readonly events: EventBus<GameEvents>,
  ) {
    this.unsubscribe = events.on("digging:requested", ({ entityId }) => {
      if (this.challenge.active || this.completedTargetIds.has(entityId)) {
        return;
      }

      this.targetEntityId = entityId;
      this.challenge.start();
      this.events.emit("objective:changed", {
        text: "Trefte se třikrát do světlého středu rytmu",
      });
      this.emitState();
    });
  }

  get active(): boolean {
    return this.challenge.active;
  }

  get completed(): boolean {
    return this.completedTargetIds.size > 0;
  }

  update(dt: number): void {
    if (!this.challenge.active) {
      return;
    }

    this.challenge.update(dt);

    if (this.input.consumePressed("interact")) {
      const result = this.challenge.attempt();

      if (result === "completed") {
        this.finish();
        return;
      }
    }

    this.emitState();
  }

  dispose(): void {
    this.unsubscribe();
  }

  private finish(): void {
    if (this.targetEntityId !== null) {
      const target = this.world.get(this.targetEntityId);
      if (target?.components.interactable) {
        target.components.interactable.enabled = false;
      }
      this.completedTargetIds.add(this.targetEntityId);
    }

    const misses = this.challenge.misses;
    const quality = misses === 0 ? "A" : misses <= 2 ? "B" : "C";
    const target = this.targetEntityId === null ? undefined : this.world.get(this.targetEntityId);
    const payload = target?.components.interactable?.payload;
    const baseScore = payload?.baseScore ?? 1000;
    const stoneName = payload?.stoneName ?? "Vltavín";
    const stone = generateMoldavite({
      id: "stone-" + (this.targetEntityId ?? "unknown"),
      name: stoneName,
      locality: payload?.locality ?? "Neznámá lokalita",
      quality,
      misses,
      baseScore,
      siteIndex: payload?.siteIndex ?? 0,
      provenanceDocumented: payload?.provenanceDocumented ?? true,
    });
    const score = stone.score;

    this.emitState();
    this.events.emit("digging:completed", {
      entityId: this.targetEntityId ?? -1,
      quality,
      score,
      misses,
    });
    this.events.emit("collectible:found", {
      name: stoneName,
      quality,
      score,
      stone,
    });
    this.events.emit("objective:changed", {
      text: `Vltavín nalezen – kvalita ${quality}`,
    });
    this.events.emit("ui:toastRequested", {
      text: `Nález potvrzen: ${stoneName}, kvalita ${quality}, ${score} bodů.`,
      durationMs: 5200,
    });
  }

  private emitState(): void {
    this.events.emit("digging:stateChanged", this.challenge.getState());
  }
}
