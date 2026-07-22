import { describe, expect, it } from "vitest";
import { EventBus } from "../src/core/events/EventBus";
import type { GameEvents } from "../src/core/events/GameEvents";
import { getLevelDefinition } from "../src/game/levels/LevelData";
import { LevelQuestSystem } from "../src/game/systems/LevelQuestSystem";
import { createTransform } from "../src/game/components/TransformComponent";
import { World } from "../src/game/world/World";

describe("LevelQuestSystem", () => {
  it("requires each Nesměň hole to be filled before the next one", () => {
    const world = new World();
    const events = new EventBus<GameEvents>();
    const permission = world.createEntity({ interactable: {
      kind: "permissionNpc", label: "Povolení", radius: 1.5, enabled: true,
    } });
    const first = world.createEntity({ transform: createTransform(), interactable: {
      kind: "digSite", label: "První", radius: 1.5, enabled: false,
    } });
    const second = world.createEntity({ transform: createTransform(2, 0, 0), interactable: {
      kind: "digSite", label: "Druhá", radius: 1.5, enabled: false,
    } });
    const exit = world.createEntity({ interactable: {
      kind: "exit", label: "Odchod", radius: 1.5, enabled: false,
    } });
    const quest = new LevelQuestSystem(world, events, getLevelDefinition("nesmen"), {
      permissionEntityId: permission.id,
      digSiteIds: [first.id, second.id],
      opponentEntityId: null,
      exitEntityId: exit.id,
    });

    events.emit("interaction:triggered", { entityId: permission.id, kind: "permissionNpc" });
    events.flush();
    expect(first.components.interactable?.enabled).toBe(true);
    expect(second.components.interactable?.enabled).toBe(false);

    events.emit("digging:completed", { entityId: first.id, quality: "A", score: 950, misses: 0 });
    events.flush();
    expect(first.components.interactable?.kind).toBe("fillHole");
    expect(second.components.interactable?.enabled).toBe(false);

    events.emit("interaction:triggered", { entityId: first.id, kind: "fillHole" });
    events.flush();
    expect(second.components.interactable?.enabled).toBe(true);

    events.emit("digging:completed", { entityId: second.id, quality: "B", score: 850, misses: 1 });
    events.flush();
    events.emit("interaction:triggered", { entityId: second.id, kind: "fillHole" });
    events.flush();
    expect(exit.components.interactable?.enabled).toBe(true);
    quest.dispose();
  });

  it("requires certification after resolving Franta in the Slavia finale", () => {
    const world = new World();
    const events = new EventBus<GameEvents>();
    const expert = world.createEntity({ interactable: {
      kind: "permissionNpc", label: "Expertka", radius: 1.5, enabled: true,
    } });
    const opponent = world.createEntity({ interactable: {
      kind: "opponent", label: "Franta", radius: 1.5, enabled: false,
    } });
    const exit = world.createEntity({ interactable: {
      kind: "exit", label: "Akce", radius: 1.5, enabled: false,
    } });
    const certificates: Array<GameEvents["collection:certified"]> = [];
    const completions: Array<GameEvents["game:completed"]> = [];
    events.on("collection:certified", (payload) => certificates.push(payload));
    events.on("game:completed", (payload) => completions.push(payload));

    const quest = new LevelQuestSystem(world, events, getLevelDefinition("slavia"), {
      permissionEntityId: expert.id,
      digSiteIds: [],
      opponentEntityId: opponent.id,
      exitEntityId: exit.id,
      collectionSnapshot: () => ({ stoneCount: 3, localityCount: 3 }),
    });

    events.emit("interaction:triggered", { entityId: expert.id, kind: "permissionNpc" });
    events.flush();
    expect(opponent.components.interactable?.enabled).toBe(true);
    expect(exit.components.interactable?.enabled).toBe(false);

    events.emit("interaction:triggered", { entityId: opponent.id, kind: "opponent" });
    events.flush();
    expect(opponent.components.interactable?.enabled).toBe(false);
    expect(exit.components.interactable?.enabled).toBe(false);

    events.emit("interaction:triggered", { entityId: expert.id, kind: "permissionNpc" });
    events.flush();
    expect(certificates).toEqual([{ stoneCount: 3, localityCount: 3 }]);
    expect(exit.components.interactable?.enabled).toBe(true);

    events.emit("interaction:triggered", { entityId: exit.id, kind: "exit" });
    events.flush();
    expect(completions).toEqual([{ score: 0, foundCount: 0 }]);
    expect(quest.completed).toBe(true);
    quest.dispose();
  });
});
