import { describe, expect, it } from "vitest";
import { EventBus } from "../src/core/events/EventBus";
import type { GameEvents } from "../src/core/events/GameEvents";
import { createTransform } from "../src/game/components/TransformComponent";
import { getLevelDefinition } from "../src/game/levels/LevelData";
import { generateMoldavite } from "../src/game/mechanics/Moldavite";
import { LevelQuestSystem } from "../src/game/systems/LevelQuestSystem";
import { World } from "../src/game/world/World";

function createQuest(
  levelId: "chlum" | "besednice",
): {
  world: World;
  events: EventBus<GameEvents>;
  quest: LevelQuestSystem;
  permissionId: number;
  digIds: number[];
  opponentId: number | null;
  exitId: number;
} {
  const world = new World();
  const events = new EventBus<GameEvents>();
  const level = getLevelDefinition(levelId);
  const permission = world.createEntity({
    interactable: {
      kind: "permissionNpc",
      label: "Povolení",
      radius: 1.5,
      enabled: true,
    },
  });
  const digIds = Array.from({ length: level.digCount }, (_, index) =>
    world.createEntity({
      transform: createTransform(index + 1, 0, 0),
      interactable: {
        kind: "digSite",
        label: "Nález",
        radius: 1.5,
        enabled: false,
      },
    }).id,
  );
  const opponent = level.requiresOpponent
    ? world.createEntity({
        interactable: {
          kind: "opponent",
          label: "Rival",
          radius: 1.5,
          enabled: false,
        },
      })
    : null;
  const exit = world.createEntity({
    interactable: {
      kind: "exit",
      label: "Odchod",
      radius: 1.5,
      enabled: false,
    },
  });

  const quest = new LevelQuestSystem(world, events, level, {
    permissionEntityId: permission.id,
    digSiteIds: digIds,
    opponentEntityId: opponent?.id ?? null,
    exitEntityId: exit.id,
  });

  return {
    world,
    events,
    quest,
    permissionId: permission.id,
    digIds,
    opponentId: opponent?.id ?? null,
    exitId: exit.id,
  };
}

describe("full level flow", () => {
  it("completes Chlum only after permission, digging and exit", () => {
    const flow = createQuest("chlum");
    const completions: Array<GameEvents["level:completed"]> = [];
    flow.events.on("level:completed", (payload) => completions.push(payload));

    flow.events.emit("interaction:triggered", {
      entityId: flow.digIds[0] ?? -1,
      kind: "digSite",
    });
    flow.events.flush();
    expect(flow.world.get(flow.digIds[0] ?? -1)?.components.interactable?.enabled).toBe(false);

    flow.events.emit("interaction:triggered", {
      entityId: flow.permissionId,
      kind: "permissionNpc",
    });
    flow.events.flush();
    expect(flow.world.get(flow.digIds[0] ?? -1)?.components.interactable?.enabled).toBe(true);

    flow.events.emit("digging:completed", {
      entityId: flow.digIds[0] ?? -1,
      quality: "A",
      score: 1400,
      misses: 0,
    });
    flow.events.flush();
    const stone = generateMoldavite({
      id: "chlum-flow-stone",
      name: "Chlumský vltavín",
      locality: "Chlum",
      quality: "A",
      misses: 0,
      baseScore: 950,
      siteIndex: 0,
      provenanceDocumented: true,
    });
    flow.events.emit("collectible:found", {
      name: stone.name,
      quality: stone.quality,
      score: stone.score,
      stone,
    });
    flow.events.flush();
    expect(flow.world.get(flow.exitId)?.components.interactable?.enabled).toBe(true);

    flow.events.emit("interaction:triggered", {
      entityId: flow.exitId,
      kind: "exit",
    });
    flow.events.flush();
    expect(completions).toEqual([{
      levelId: "chlum",
      score: stone.score,
      final: false,
    }]);
    expect(flow.quest.completed).toBe(true);
    flow.quest.dispose();
  });

  it("activates and resolves the Besednice rival after the dig", () => {
    const flow = createQuest("besednice");
    const rival = flow.opponentId;
    expect(rival).not.toBeNull();

    flow.events.emit("interaction:triggered", {
      entityId: flow.permissionId,
      kind: "permissionNpc",
    });
    flow.events.flush();
    flow.events.emit("digging:completed", {
      entityId: flow.digIds[0] ?? -1,
      quality: "B",
      score: 1250,
      misses: 1,
    });
    flow.events.flush();

    expect(flow.world.get(rival ?? -1)?.components.interactable?.enabled).toBe(true);
    expect(flow.world.get(flow.exitId)?.components.interactable?.enabled).toBe(false);

    flow.events.emit("interaction:triggered", {
      entityId: rival ?? -1,
      kind: "opponent",
    });
    flow.events.flush();
    expect(flow.world.get(rival ?? -1)?.components.interactable?.enabled).toBe(false);
    expect(flow.world.get(flow.exitId)?.components.interactable?.enabled).toBe(true);
    flow.quest.dispose();
  });
});
