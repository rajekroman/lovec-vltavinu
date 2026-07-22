import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";
import type { InputManager } from "../../engine/input/InputManager";
import type { EntityId } from "../world/Entity";
import type { World } from "../world/World";

export class InteractionSystem {
  private focusedEntityId: EntityId | null = null;
  private focusedLabel: string | null = null;

  constructor(
    private readonly world: World,
    private readonly input: InputManager,
    private readonly events: EventBus<GameEvents>,
  ) {}

  update(): void {
    const player = this.world
      .query("transform")
      .find((entity) => entity.tags.has("player"));

    if (!player) {
      return;
    }

    let nearestId: EntityId | null = null;
    let nearestLabel: string | null = null;
    let nearestDistanceSq = Infinity;

    for (const entity of this.world.query("transform", "interactable")) {
      const interactable = entity.components.interactable;
      if (!interactable.enabled) {
        continue;
      }

      const dx = entity.components.transform.position.x - player.components.transform.position.x;
      const dz = entity.components.transform.position.z - player.components.transform.position.z;
      const distanceSq = dx * dx + dz * dz;

      if (distanceSq <= interactable.radius * interactable.radius && distanceSq < nearestDistanceSq) {
        nearestId = entity.id;
        nearestLabel = interactable.label;
        nearestDistanceSq = distanceSq;
      }
    }

    if (nearestId !== this.focusedEntityId || nearestLabel !== this.focusedLabel) {
      this.focusedEntityId = nearestId;
      this.focusedLabel = nearestLabel;
      this.events.emit("interaction:focusChanged", {
        entityId: nearestId,
        label: nearestLabel,
      });
    }

    if (!this.input.consumePressed("interact")) {
      return;
    }

    if (nearestId === null) {
      this.events.emit("ui:toastRequested", {
        text: "V dosahu není nic, s čím lze pracovat.",
        durationMs: 1700,
      });
      return;
    }

    const target = this.world.get(nearestId);
    const interactable = target?.components.interactable;

    if (interactable?.enabled) {
      this.events.emit("interaction:triggered", {
        entityId: nearestId,
        kind: interactable.kind,
      });
    }
  }
}
