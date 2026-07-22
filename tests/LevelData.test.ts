import { describe, expect, it } from "vitest";
import {
  getLevelDefinition,
  getNextLevel,
  LEVELS,
} from "../src/game/levels/LevelData";

describe("level progression data", () => {
  it("keeps the playable journey in the intended four-level order", () => {
    expect(LEVELS.map((level) => level.id)).toEqual([
      "chlum",
      "nesmen",
      "besednice",
      "slavia",
    ]);
    expect(LEVELS.map((level) => level.final)).toEqual([false, false, false, true]);
    expect(LEVELS.map((level) => level.requiresPermission)).toEqual([true, true, true, true]);
  });

  it("has a single terminal level and valid next-level links", () => {
    expect(getNextLevel("chlum")?.id).toBe("nesmen");
    expect(getNextLevel("nesmen")?.id).toBe("besednice");
    expect(getNextLevel("besednice")?.id).toBe("slavia");
    expect(getNextLevel("slavia")).toBeNull();
    expect(getLevelDefinition("slavia").final).toBe(true);
  });
});
