import type * as THREE from "three";
import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";
import type { EntityId } from "../world/Entity";
import type { World } from "../world/World";

export class ChlumQuestSystem {
  permissionGranted = false;
  completed = false;

  private readonly unsubscribers: Array<() => void> = [];

  constructor(
    private readonly world: World,
    private readonly events: EventBus<GameEvents>,
    private readonly ownerId: EntityId,
    private readonly surveyId: EntityId,
    private readonly surveyMarker: THREE.Object3D,
  ) {
    this.unsubscribers.push(
      events.on("interaction:triggered", ({ entityId, kind }) => {
        if (entityId === this.ownerId && kind === "fieldOwner") {
          this.handleOwnerInteraction();
          return;
        }

        if (entityId === this.surveyId && kind === "surveySpot") {
          this.handleSurveyInteraction();
        }
      }),
      events.on("digging:completed", () => {
        this.completed = true;
      }),
    );
  }

  dispose(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  private handleOwnerInteraction(): void {
    if (this.permissionGranted) {
      this.events.emit("dialog:shown", {
        speaker: "Karel, majitel pole",
        text: "Povolení platí. Držte se označeného místa a díru po sobě zase zakryjte.",
        durationMs: 3800,
      });
      return;
    }

    this.permissionGranted = true;
    const survey = this.world.get(this.surveyId);
    const owner = this.world.get(this.ownerId);

    if (survey?.components.interactable) {
      survey.components.interactable.enabled = true;
    }

    if (owner?.components.interactable) {
      owner.components.interactable.label = "Promluvit znovu s Karlem";
    }

    this.surveyMarker.visible = true;
    this.events.emit("permission:changed", { granted: true });
    this.events.emit("dialog:shown", {
      speaker: "Karel, majitel pole",
      text: "Dobře. Můžete prozkoumat označené místo uprostřed pole. Nic dalšího nerozkopávejte.",
      durationMs: 4700,
    });
    this.events.emit("objective:changed", {
      text: "Najděte označené místo průzkumu",
    });
  }

  private handleSurveyInteraction(): void {
    if (!this.permissionGranted) {
      this.events.emit("ui:toastRequested", {
        text: "Nejprve potřebujete souhlas majitele pole.",
      });
      return;
    }

    this.events.emit("digging:requested", { entityId: this.surveyId });
  }
}
