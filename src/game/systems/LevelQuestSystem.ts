import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";
import type { LevelDefinition } from "../levels/LevelData";
import type { EntityId } from "../world/Entity";
import type { World } from "../world/World";

export interface LevelQuestSetup {
  permissionEntityId: EntityId | null;
  digSiteIds: readonly EntityId[];
  opponentEntityId: EntityId | null;
  exitEntityId: EntityId;
  collectionSnapshot?: () => CollectionSnapshot;
}

export interface CollectionSnapshot {
  stoneCount: number;
  localityCount: number;
}

/**
 * Data-driven quest state for the four-level MVP.
 *
 * The system deliberately has no inventory or dialogue tree. It tracks
 * permission, completed rhythm digs, filled holes, the opponent, final
 * collection certification and the exit.
 */
export class LevelQuestSystem {
  permissionGranted = false;
  completed = false;

  private readonly dugIds = new Set<EntityId>();
  private readonly filledIds = new Set<EntityId>();
  private opponentResolved = false;
  private opponentActivated = false;
  private collectionCertified = false;
  private levelScore = 0;
  private readonly unsubscribers: Array<() => void> = [];

  constructor(
    private readonly world: World,
    private readonly events: EventBus<GameEvents>,
    private readonly level: LevelDefinition,
    private readonly setup: LevelQuestSetup,
  ) {
    this.unsubscribers.push(
      events.on("interaction:triggered", ({ entityId, kind }) => {
        this.handleInteraction(entityId, kind);
      }),
      events.on("digging:completed", ({ entityId }) => {
        this.handleDiggingCompleted(entityId);
      }),
      events.on("collectible:found", ({ score }) => {
        this.levelScore += score;
      }),
    );
  }

  dispose(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  isDug(entityId: EntityId): boolean {
    return this.dugIds.has(entityId);
  }

  isFilled(entityId: EntityId): boolean {
    return this.filledIds.has(entityId);
  }

  private handleInteraction(entityId: EntityId, kind: string): void {
    if (this.completed) {
      return;
    }

    if (entityId === this.setup.permissionEntityId && kind === "permissionNpc") {
      if (this.level.final && this.permissionGranted && this.opponentResolved) {
        this.certifyCollection();
      } else {
        this.grantPermission();
      }
      return;
    }

    if (this.setup.digSiteIds.includes(entityId) && kind === "digSite") {
      if (!this.permissionGranted && this.level.requiresPermission) {
        this.events.emit("ui:toastRequested", {
          text: "Nejdříve si vyžádejte povolení u místního správce.",
          durationMs: 2200,
        });
        return;
      }

      this.events.emit("digging:requested", { entityId });
      return;
    }

    if (this.setup.digSiteIds.includes(entityId) && kind === "fillHole") {
      this.fillHole(entityId);
      return;
    }

    if (entityId === this.setup.opponentEntityId && kind === "opponent") {
      this.resolveOpponent();
      return;
    }

    if (entityId === this.setup.exitEntityId && kind === "exit") {
      this.completeLevel();
    }
  }

  private grantPermission(): void {
    if (this.permissionGranted) {
      this.events.emit("dialog:shown", {
        speaker: this.level.id === "slavia" ? "Expertka výstavy" : "Správce lokality",
        text: "Povolení stále platí. Dodržte označený postup a po sobě uklidíte.",
        durationMs: 3300,
      });
      return;
    }

    this.permissionGranted = true;
    this.enableDigSites();
    this.events.emit("permission:changed", { granted: true });
    this.events.emit("dialog:shown", {
      speaker: this.level.id === "slavia" ? "Expertka výstavy" : "Správce lokality",
      text:
        this.level.id === "slavia"
          ? "Vstup máte povolený. Přineste mi sbírku, ale dávejte pozor na Frantu."
          : "Souhlasím. Pracujte jen na vyznačených místech a respektujte okolí.",
      durationMs: 4300,
    });
    this.updateObjective();
    this.checkProgress();
  }

  private certifyCollection(): void {
    if (this.collectionCertified) {
      this.events.emit("dialog:shown", {
        speaker: "Expertka výstavy",
        text: "Certifikace sbírky už byla vystavena. Můžete ji představit porotě.",
        durationMs: 3300,
      });
      return;
    }

    const snapshot = this.setup.collectionSnapshot?.() ?? {
      stoneCount: 0,
      localityCount: 0,
    };
    this.collectionCertified = true;
    this.events.emit("collection:certified", {
      stoneCount: Math.max(0, Math.floor(snapshot.stoneCount)),
      localityCount: Math.max(0, Math.floor(snapshot.localityCount)),
    });
    this.events.emit("dialog:shown", {
      speaker: "Expertka výstavy",
      text: "Sbírka je převzatá. Potvrzuji lokality a vystavuji certifikaci pro porotu.",
      durationMs: 4300,
    });
    this.events.emit("ui:toastRequested", {
      text: "Certifikace sbírky vystavena. Můžete vstoupit na akci.",
      durationMs: 3200,
    });
    this.updateObjective();
    this.checkProgress();
  }

  private enableDigSites(): void {
    let firstUnfinished = true;
    for (const entityId of this.setup.digSiteIds) {
      const entity = this.world.get(entityId);
      if (entity?.components.interactable && !this.dugIds.has(entityId)) {
        entity.components.interactable.enabled = !this.level.requiresFill || firstUnfinished;
        firstUnfinished = false;
      }
    }
  }

  private handleDiggingCompleted(entityId: EntityId): void {
    if (!this.setup.digSiteIds.includes(entityId) || this.dugIds.has(entityId)) {
      return;
    }

    this.dugIds.add(entityId);
    const target = this.world.get(entityId);

    if (target?.components.interactable) {
      if (this.level.requiresFill) {
        target.components.interactable.kind = "fillHole";
        target.components.interactable.label = "Zasypat díru";
        target.components.interactable.enabled = true;
        for (const otherId of this.setup.digSiteIds) {
          if (otherId === entityId || this.dugIds.has(otherId)) {
            continue;
          }
          const other = this.world.get(otherId);
          if (other?.components.interactable) {
            other.components.interactable.enabled = false;
          }
        }
      } else {
        target.components.interactable.enabled = false;
      }
    }

    this.updateObjective();
    this.checkProgress();
  }

  private fillHole(entityId: EntityId): void {
    if (!this.dugIds.has(entityId) || this.filledIds.has(entityId)) {
      return;
    }

    this.filledIds.add(entityId);
    const target = this.world.get(entityId);
    if (target?.components.interactable) {
      target.components.interactable.enabled = false;
    }

    this.events.emit("hole:filled", { entityId });
    if (this.level.requiresFill) {
      const nextId = this.setup.digSiteIds.find(
        (candidate) => !this.dugIds.has(candidate),
      );
      if (nextId !== undefined) {
        const next = this.world.get(nextId);
        if (next?.components.interactable) {
          next.components.interactable.kind = "digSite";
          next.components.interactable.label = "Hledat označené místo";
          next.components.interactable.enabled = true;
        }
      }
    }
    this.events.emit("ui:toastRequested", {
      text: "Díra je zasypaná. Les zůstává bezpečný.",
      durationMs: 2200,
    });
    this.updateObjective();
    this.checkProgress();
  }

  private activateOpponent(): void {
    if (this.opponentActivated || this.setup.opponentEntityId === null) {
      return;
    }

    this.opponentActivated = true;
    const opponent = this.world.get(this.setup.opponentEntityId);
    if (opponent?.components.interactable) {
      opponent.components.interactable.enabled = true;
      opponent.components.interactable.label =
        this.level.id === "slavia" ? "Zastavit Frantu" : "Zastavit rivala";
    }

    this.events.emit("ui:toastRequested", {
      text:
        this.level.id === "slavia"
          ? "Franta se objevil u nejlepšího nálezu. Najděte ho."
          : "Rival je na nalezišti. Najděte ho dříve, než odejde.",
      durationMs: 3300,
    });
    this.updateObjective();
  }

  private resolveOpponent(): void {
    if (!this.opponentActivated || this.opponentResolved) {
      return;
    }

    this.opponentResolved = true;
    const opponent = this.setup.opponentEntityId === null
      ? undefined
      : this.world.get(this.setup.opponentEntityId);
    if (opponent?.components.interactable) {
      opponent.components.interactable.enabled = false;
    }

    this.events.emit("dialog:shown", {
      speaker: this.level.id === "slavia" ? "Franta" : "Rival",
      text:
        this.level.id === "slavia"
          ? "Dobře, dobře… kámen zůstane vám."
          : "Dneska máte štěstí. Tenhle nález zůstává u vás.",
      durationMs: 3000,
    });
    this.events.emit("ui:toastRequested", {
      text: "Střet vyřešen jedinou rychlou akcí.",
      durationMs: 2200,
    });
    this.updateObjective();
    this.checkProgress();
  }

  private checkProgress(): void {
    const digsReady = this.dugIds.size >= this.level.digCount;
    const fillsReady = !this.level.requiresFill || this.filledIds.size >= this.level.digCount;

    if (
      !this.opponentResolved &&
      this.level.requiresOpponent &&
      this.permissionGranted &&
      digsReady
    ) {
      this.activateOpponent();
      return;
    }

    if (
      this.permissionGranted === this.level.requiresPermission &&
      digsReady &&
      fillsReady &&
      (!this.level.requiresOpponent || this.opponentResolved) &&
      (!this.level.final || this.collectionCertified)
    ) {
      const exit = this.world.get(this.setup.exitEntityId);
      if (exit?.components.interactable) {
        exit.components.interactable.enabled = true;
      }
      this.events.emit("objective:changed", {
        text: "Dojděte k označenému východu.",
      });
    }
  }

  private updateObjective(): void {
    if (!this.permissionGranted && this.level.requiresPermission) {
      this.events.emit("objective:changed", {
        text: "Najděte správce a získejte povolení.",
      });
      return;
    }

    if (this.level.requiresFill && this.filledIds.size < this.dugIds.size) {
      this.events.emit("objective:changed", {
        text: `Zasypte díry ${this.filledIds.size}/${this.level.digCount}.`,
      });
      return;
    }

    if (this.level.digCount > this.dugIds.size) {
      this.events.emit("objective:changed", {
        text: `Najděte a vykopejte nález ${this.dugIds.size + 1}/${this.level.digCount}.`,
      });
      return;
    }

    if (this.level.requiresFill && this.filledIds.size < this.level.digCount) {
      this.events.emit("objective:changed", {
        text: `Zasypte díry ${this.filledIds.size}/${this.level.digCount}.`,
      });
      return;
    }

    if (this.level.requiresOpponent && !this.opponentResolved) {
      this.events.emit("objective:changed", {
        text: "Najděte protivníka a stiskněte akci v jeho dosahu.",
      });
      return;
    }

    if (this.level.final && !this.collectionCertified) {
      this.events.emit("objective:changed", {
        text: "Vraťte se k expertce pro certifikaci sbírky.",
      });
      return;
    }

    this.events.emit("objective:changed", {
      text: "Dojděte k označenému východu.",
    });
  }

  private completeLevel(): void {
    if (this.completed || !this.canComplete()) {
      return;
    }

    this.completed = true;
    this.events.emit("ui:toastRequested", {
      text: `${this.level.location} dokončen. Připravuji další část výpravy.`,
      durationMs: 2600,
    });

    if (this.level.final) {
      this.events.emit("game:completed", {
        score: this.levelScore,
        foundCount: this.dugIds.size,
      });
      return;
    }

    this.events.emit("level:completed", {
      levelId: this.level.id,
      score: this.levelScore,
      final: false,
    });
  }

  private canComplete(): boolean {
    const permissionReady = !this.level.requiresPermission || this.permissionGranted;
    const digsReady = this.dugIds.size >= this.level.digCount;
    const fillsReady = !this.level.requiresFill || this.filledIds.size >= this.level.digCount;
    const opponentReady = !this.level.requiresOpponent || this.opponentResolved;
    const certificationReady = !this.level.final || this.collectionCertified;
    return permissionReady && digsReady && fillsReady && opponentReady && certificationReady;
  }
}
