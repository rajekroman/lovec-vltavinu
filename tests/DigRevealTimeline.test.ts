import { describe, expect, it } from "vitest";
import { DigRevealTimeline } from "../src/game/mechanics/DigRevealTimeline";

describe("DigRevealTimeline", () => {
  it("progresses from soil to opening, reward and completion", () => {
    const timeline = new DigRevealTimeline();

    expect(timeline.state).toMatchObject({ progress: 0, stage: "soil", completed: false });

    timeline.update(0.2);
    expect(timeline.state.stage).toBe("opening");

    timeline.update(0.35);
    expect(timeline.state.stage).toBe("reward");

    timeline.update(0.6);
    expect(timeline.state).toMatchObject({ progress: 1, stage: "complete", completed: true });
  });

  it("clamps negative time and overshoot", () => {
    const timeline = new DigRevealTimeline();

    timeline.update(-10);
    expect(timeline.state.progress).toBe(0);

    timeline.update(10);
    expect(timeline.state.progress).toBe(1);
  });
});
