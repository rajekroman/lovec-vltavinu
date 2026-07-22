import { describe, expect, it } from "vitest";
import { SafePositionTracker } from "../src/game/systems/SafePositionTracker";

describe("SafePositionTracker", () => {
  it("remembers only positions below the residual alarm threshold", () => {
    const tracker = new SafePositionTracker({ x: 0, z: 6 });

    tracker.remember({ x: 2, z: 4 }, 0.2);
    tracker.remember({ x: 8, z: -1 }, 0.4);

    expect(tracker.get()).toEqual({ x: 2, z: 4 });
  });

  it("restores only the gameplay plane and leaves height untouched", () => {
    const tracker = new SafePositionTracker({ x: -3, z: 5 });
    const position = { x: 12, y: 1.25, z: -8 };

    tracker.restore(position);

    expect(position).toEqual({ x: -3, y: 1.25, z: 5 });
  });
});
