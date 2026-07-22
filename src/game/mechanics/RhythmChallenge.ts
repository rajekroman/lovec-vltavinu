export type RhythmAttemptResult = "ignored" | "hit" | "miss" | "completed";
export type RhythmFeedback = "none" | "hit" | "miss";

export interface RhythmChallengeState {
  active: boolean;
  cursor: number;
  targetStart: number;
  targetEnd: number;
  hits: number;
  requiredHits: number;
  misses: number;
  feedback: RhythmFeedback;
}

export class RhythmChallenge {
  readonly requiredHits = 3;
  readonly targetStart = 0.42;
  readonly targetEnd = 0.58;

  active = false;
  cursor = 0;
  hits = 0;
  misses = 0;
  feedback: RhythmFeedback = "none";

  private phase = 0;
  private speed = 0.82;
  private attemptCooldown = 0;
  private feedbackTime = 0;

  start(): void {
    this.active = true;
    this.cursor = 0;
    this.hits = 0;
    this.misses = 0;
    this.feedback = "none";
    this.phase = 0;
    this.speed = 0.82;
    this.attemptCooldown = 0;
    this.feedbackTime = 0;
  }

  update(dt: number): void {
    if (!this.active) {
      return;
    }

    this.phase = (this.phase + dt * this.speed) % 2;
    this.cursor = this.phase <= 1 ? this.phase : 2 - this.phase;
    this.attemptCooldown = Math.max(0, this.attemptCooldown - dt);
    this.feedbackTime = Math.max(0, this.feedbackTime - dt);

    if (this.feedbackTime === 0) {
      this.feedback = "none";
    }
  }

  attempt(): RhythmAttemptResult {
    if (!this.active || this.attemptCooldown > 0) {
      return "ignored";
    }

    this.attemptCooldown = 0.34;
    this.feedbackTime = 0.42;

    if (this.cursor < this.targetStart || this.cursor > this.targetEnd) {
      this.misses += 1;
      this.feedback = "miss";
      return "miss";
    }

    this.hits += 1;
    this.speed += 0.09;
    this.feedback = "hit";

    if (this.hits >= this.requiredHits) {
      this.active = false;
      return "completed";
    }

    return "hit";
  }

  getState(): RhythmChallengeState {
    return {
      active: this.active,
      cursor: this.cursor,
      targetStart: this.targetStart,
      targetEnd: this.targetEnd,
      hits: this.hits,
      requiredHits: this.requiredHits,
      misses: this.misses,
      feedback: this.feedback,
    };
  }
}
