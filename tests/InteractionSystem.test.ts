import { describe, expect, it } from "vitest";
import { EventBus } from "../src/core/events/EventBus";
import type { GameEvents } from "../src/core/events/GameEvents";
import type { InputManager } from "../src/engine/input/InputManager";
import { InteractionSystem } from "../src/game/systems/InteractionSystem";
import { createTransform } from "../src/game/components/TransformComponent";
import { World } from "../src/game/world/World";

describe("InteractionSystem", () => {
  it("refreshes the HUD label when the focused entity changes interaction kind", () => {
    const world = new World();
    const events = new EventBus<GameEvents>();
    const input = {
      consumePressed: () => false,
    } as unknown as InputManager;
    const player = world.createEntity({ transform: createTransform(0, 0, 0) }, ["player"]);
    const site = world.createEntity({
      transform: createTransform(0.5, 0, 0),
      interactable: {
        kind: "digSite",
        label: "Hledat označené místo",
        radius: 1.5,
        enabled: true,
      },
    });
    const focusEvents: Array<GameEvents["interaction:focusChanged"]> = [];
    events.on("interaction:focusChanged", (payload) => focusEvents.push(payload));
    const system = new InteractionSystem(world, input, events);

    system.update();
    events.flush();
    expect(focusEvents).toEqual([{ entityId: site.id, label: "Hledat označené místo" }]);

    site.components.interactable!.kind = "fillHole";
    site.components.interactable!.label = "Zasypat díru";
    system.update();
    events.flush();

    expect(focusEvents.at(-1)).toEqual({ entityId: site.id, label: "Zasypat díru" });
    expect(player.tags.has("player")).toBe(true);
  });
});
