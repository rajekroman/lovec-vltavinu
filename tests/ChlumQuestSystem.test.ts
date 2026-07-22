import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { EventBus } from "../src/core/events/EventBus";
import type { GameEvents } from "../src/core/events/GameEvents";
import { ChlumQuestSystem } from "../src/game/systems/ChlumQuestSystem";
import { World } from "../src/game/world/World";

describe("ChlumQuestSystem", () => {
  it("unlocks the survey spot only after the owner grants permission", () => {
    const world = new World();
    const events = new EventBus<GameEvents>();
    const owner = world.createEntity({
      interactable: {
        kind: "fieldOwner",
        label: "Požádat o povolení",
        radius: 1.5,
        enabled: true,
      },
    });
    const survey = world.createEntity({
      interactable: {
        kind: "surveySpot",
        label: "Prozkoumat",
        radius: 1.5,
        enabled: false,
      },
    });
    const marker = new THREE.Object3D();
    marker.visible = false;
    const quest = new ChlumQuestSystem(
      world,
      events,
      owner.id,
      survey.id,
      marker,
    );

    let requestedEntityId: number | null = null;
    events.on("digging:requested", ({ entityId }) => {
      requestedEntityId = entityId;
    });

    events.emit("interaction:triggered", {
      entityId: owner.id,
      kind: "fieldOwner",
    });
    events.flush();

    expect(quest.permissionGranted).toBe(true);
    expect(survey.components.interactable?.enabled).toBe(true);
    expect(marker.visible).toBe(true);

    events.emit("interaction:triggered", {
      entityId: survey.id,
      kind: "surveySpot",
    });
    events.flush();

    expect(requestedEntityId).toBe(survey.id);
    quest.dispose();
  });
});
