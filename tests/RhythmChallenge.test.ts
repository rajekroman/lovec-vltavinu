import { describe, expect, it } from "vitest";
import {
  RhythmChallenge,
  type RhythmAttemptResult,
} from "../src/game/mechanics/RhythmChallenge";

describe("RhythmChallenge", () => {
  it("requires exactly three successful rhythm hits", () => {
    const challenge = new RhythmChallenge();
    challenge.start();

    expect(hitNextTarget(challenge)).toBe("hit");
    expect(challenge.hits).toBe(1);
    expect(hitNextTarget(challenge)).toBe("hit");
    expect(challenge.hits).toBe(2);
    expect(hitNextTarget(challenge)).toBe("completed");
    expect(challenge.hits).toBe(3);
    expect(challenge.active).toBe(false);
  });

  it("counts an action outside the target as a miss", () => {
    const challenge = new RhythmChallenge();
    challenge.start();

    expect(challenge.cursor).toBe(0);
    expect(challenge.attempt()).toBe("miss");
    expect(challenge.misses).toBe(1);
    expect(challenge.attempt()).toBe("ignored");
  });

  it("keeps its cursor normalized while moving in both directions", () => {
    const challenge = new RhythmChallenge();
    challenge.start();

    for (let index = 0; index < 600; index += 1) {
      challenge.update(1 / 60);
      expect(challenge.cursor).toBeGreaterThanOrEqual(0);
      expect(challenge.cursor).toBeLessThanOrEqual(1);
    }
  });
});

function hitNextTarget(challenge: RhythmChallenge): RhythmAttemptResult {
  for (let index = 0; index < 2000; index += 1) {
    challenge.update(1 / 240);

    if (
      challenge.cursor >= challenge.targetStart &&
      challenge.cursor <= challenge.targetEnd
    ) {
      const result = challenge.attempt();
      if (result !== "ignored") {
        return result;
      }
    }
  }

  throw new Error("Rytmický cíl nebyl dosažen v očekávaném čase.");
}
