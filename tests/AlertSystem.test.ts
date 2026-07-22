import { describe, expect, it } from "vitest";
import { EventBus } from "../src/core/events/EventBus";
import type { GameEvents } from "../src/core/events/GameEvents";
import { AlertSystem } from "../src/game/systems/AlertSystem";

describe("AlertSystem", () => {
  it("raises and then decays a proximity alarm", () => {
    const events = new EventBus<GameEvents>();
    const dangerEvents: Array<GameEvents["danger:changed"]> = [];
    events.on("danger:changed", (payload) => dangerEvents.push(payload));
    const alert = new AlertSystem(events, {
      risePerSecond: 0.5,
      decayPerSecond: 0.25,
      publishStep: 0.1,
    });

    alert.update(1, true, "TRAKTOR V DRÁZE");
    events.flush();
    expect(alert.getValue()).toBeCloseTo(0.5);
    expect(dangerEvents.at(-1)).toMatchObject({ active: true, value: 0.5 });

    alert.update(1, false, "TRAKTOR V DRÁZE");
    events.flush();
    expect(alert.getValue()).toBeCloseTo(0.25);
    expect(dangerEvents.at(-1)).toMatchObject({ active: true, value: 0.25 });

    alert.update(2, false, "TRAKTOR V DRÁZE");
    events.flush();
    expect(alert.getValue()).toBe(0);
    expect(dangerEvents.at(-1)).toMatchObject({ active: false, value: 0 });
  });

  it("emits one critical warning per alarm cycle", () => {
    const events = new EventBus<GameEvents>();
    const toasts: Array<GameEvents["ui:toastRequested"]> = [];
    const critical: Array<GameEvents["danger:critical"]> = [];
    events.on("ui:toastRequested", (payload) => toasts.push(payload));
    events.on("danger:critical", (payload) => critical.push(payload));
    const alert = new AlertSystem(events, {
      risePerSecond: 1,
      decayPerSecond: 1,
      criticalThreshold: 0.8,
    });

    alert.update(1, true, "DIVOKÉ PRASE");
    events.flush();
    alert.update(1, true, "DIVOKÉ PRASE");
    events.flush();
    expect(toasts).toHaveLength(1);
    expect(critical).toEqual([{ label: "DIVOKÉ PRASE" }]);

    alert.update(1, false, "DIVOKÉ PRASE");
    events.flush();
    alert.update(1, true, "DIVOKÉ PRASE");
    events.flush();
    expect(toasts).toHaveLength(2);
    expect(critical).toHaveLength(2);
  });
});
