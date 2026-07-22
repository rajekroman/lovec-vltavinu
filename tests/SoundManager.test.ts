import { describe, expect, it } from "vitest";
import {
  AMBIENT_PROFILES,
  cueForDigFeedback,
  SOUND_CUE_DEFINITIONS,
} from "../src/engine/audio/SoundManager";

describe("SoundManager cue definitions", () => {
  it("defines a non-empty, bounded cue for every gameplay feedback stage", () => {
    const cueNames = Object.keys(SOUND_CUE_DEFINITIONS);

    expect(cueNames).toEqual(expect.arrayContaining([
      "briefing",
      "action",
      "permission",
      "digStart",
      "digHit",
      "digMiss",
      "reward",
      "certification",
      "alarm",
      "levelComplete",
      "finale",
    ]));

    for (const tones of Object.values(SOUND_CUE_DEFINITIONS)) {
      expect(tones.length).toBeGreaterThan(0);
      for (const tone of tones) {
        expect(tone.frequency).toBeGreaterThan(0);
        expect(tone.duration).toBeGreaterThan(0);
        expect(tone.duration).toBeLessThanOrEqual(0.5);
        expect(tone.volume).toBeGreaterThan(0);
        expect(tone.volume).toBeLessThanOrEqual(0.1);
      }
    }
  });

  it("emits a digging cue only when feedback changes", () => {
    expect(cueForDigFeedback("none", "none")).toBeNull();
    expect(cueForDigFeedback("hit", "none")).toBe("digHit");
    expect(cueForDigFeedback("hit", "hit")).toBeNull();
    expect(cueForDigFeedback("miss", "hit")).toBe("digMiss");
    expect(cueForDigFeedback("none", "miss")).toBeNull();
  });

  it("defines a distinct ambient bed for every location", () => {
    expect(Object.keys(AMBIENT_PROFILES)).toEqual([
      "chlum",
      "nesmen",
      "besednice",
      "slavia",
    ]);

    for (const profile of Object.values(AMBIENT_PROFILES)) {
      expect(profile.rootFrequency).toBeGreaterThan(20);
      expect(profile.fifthFrequency).toBeGreaterThan(profile.rootFrequency);
      expect(profile.upperFrequency).toBeGreaterThan(profile.fifthFrequency);
      expect(["sine", "triangle"]).toContain(profile.waveform);
    }
  });
});
