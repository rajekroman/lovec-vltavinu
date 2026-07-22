export type DigRevealStage = "soil" | "opening" | "reward" | "complete";

export interface DigRevealState {
  progress: number;
  stage: DigRevealStage;
  completed: boolean;
}

/**
 * Deterministic timing for the visual result of a completed dig.
 * Rendering consumes this state; the timeline itself has no Three.js code.
 */
export class DigRevealTimeline {
  readonly duration: number = 0.96;
  private elapsed = 0;

  get state(): DigRevealState {
    const progress = this.duration === 0
      ? 1
      : this.elapsed / this.duration;

    return {
      progress,
      stage: progress < 0.18
        ? "soil"
        : progress < 0.52
          ? "opening"
          : progress < 0.86
            ? "reward"
            : "complete",
      completed: progress >= 1,
    };
  }

  update(dt: number): DigRevealState {
    this.elapsed = Math.min(
      this.duration,
      this.elapsed + Math.max(0, dt),
    );
    return this.state;
  }
}
