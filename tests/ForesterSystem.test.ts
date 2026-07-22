import { describe, expect, it } from "vitest";
import { EventBus } from "../src/core/events/EventBus";
import type { GameEvents } from "../src/core/events/GameEvents";
import { ForesterSystem } from "../src/game/systems/ForesterSystem";

describe("ForesterSystem", () => {
  it("emits a first-contact dialog and keeps the NPC repeatable", () => {
    const events = new EventBus<GameEvents>();
    const forester = new ForesterSystem(events, 7);
    const dialogs: string[] = [];
    const toasts: string[] = [];

    events.on("dialog:shown", ({ text }) => dialogs.push(text));
    events.on("ui:toastRequested", ({ text }) => toasts.push(text));

    events.emit("interaction:triggered", {
      entityId: 7,
      kind: "forester",
    });
    events.flush();

    expect(dialogs).toHaveLength(1);
    expect(dialogs[0]).toContain("Po dešti");
    expect(toasts).toHaveLength(1);

    events.emit("interaction:triggered", {
      entityId: 7,
      kind: "forester",
    });
    events.flush();

    expect(dialogs).toHaveLength(2);
    expect(toasts).toHaveLength(1);
    forester.dispose();
  });
});
