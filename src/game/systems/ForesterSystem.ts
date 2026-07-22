import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";
import type { EntityId } from "../world/Entity";

/**
 * Dialog gate for the static forester NPC.
 *
 * The forester deliberately has no movement component. This system owns only
 * the interaction side so the NPC remains a cheap, deterministic scene prop
 * while still participating in the shared event flow.
 */
export class ForesterSystem {
  private readonly unsubscribers: Array<() => void> = [];
  private hasSpoken = false;

  constructor(
    private readonly events: EventBus<GameEvents>,
    private readonly foresterId: EntityId,
  ) {
    this.unsubscribers.push(
      events.on("interaction:triggered", ({ entityId, kind }) => {
        if (entityId === this.foresterId && kind === "forester") {
          this.handleInteraction();
        }
      }),
    );
  }

  dispose(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  private handleInteraction(): void {
    if (this.hasSpoken) {
      this.events.emit("dialog:shown", {
        speaker: "Milan, lesník",
        text: "Hranice lesa je za cestou. V poli pracujte jen s povolením majitele.",
        durationMs: 3600,
      });
      return;
    }

    this.hasSpoken = true;
    this.events.emit("dialog:shown", {
      speaker: "Milan, lesník",
      text: "Dobrý den. Po dešti se v okolí objevují nové kusy skla, ale držte se polí a respektujte vlastníky.",
      durationMs: 4500,
    });
    this.events.emit("ui:toastRequested", {
      text: "Lesník upozorňuje: pracujte jen na povolených místech.",
      durationMs: 3000,
    });
  }
}
