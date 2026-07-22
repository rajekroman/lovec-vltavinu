import { describe, expect, it } from "vitest";
import {
  calculateMoldaviteScore,
  type MoldaviteStone,
} from "../src/game/mechanics/Moldavite";
import { evaluateFinalCollection } from "../src/game/systems/FinalJury";

describe("FinalJury", () => {
  it("ranks by stone parameters and presents only the three best finds", () => {
    const stones = [
      createStone("chlum-a", "Chlum", 4.2, 96, 88, 82, 0, true),
      createStone("nesmen-b", "Nesměň", 2.4, 82, 70, 63, 15, true),
      createStone("besednice-a", "Besednice", 5.1, 98, 95, 94, 0, true),
      createStone("damaged", "Chlum", 7.8, 35, 22, 30, 60, false),
    ];

    const result = evaluateFinalCollection(stones);

    expect(result.ranked.map((entry) => entry.stone.id)).toEqual([
      "besednice-a",
      "chlum-a",
      "nesmen-b",
      "damaged",
    ]);
    expect(result.ranked.map((entry) => entry.rank)).toEqual([1, 2, 3, 4]);
    expect(result.selected).toHaveLength(3);
    expect(result.selected.map((entry) => entry.stone.id)).not.toContain("damaged");
    expect(result.totalScore).toBe(
      result.selected.reduce((sum, entry) => sum + calculateMoldaviteScore(entry.stone), 0),
    );
  });

  it("uses weight as a deterministic tie-breaker and handles an empty collection", () => {
    const tied = [
      createStone("light", "Chlum", 1.2, 90, 80, 70, 0, true),
      createStone("heavy", "Chlum", 2.8, 90, 80, 70, 0, true),
    ];

    const tiedResult = evaluateFinalCollection(tied);
    expect(tiedResult.ranked.map((entry) => entry.stone.id)).toEqual(["heavy", "light"]);

    const emptyResult = evaluateFinalCollection([]);
    expect(emptyResult).toMatchObject({
      ranked: [],
      selected: [],
      totalScore: 0,
      rating: "Bez hodnocení",
    });
  });
});

function createStone(
  id: string,
  locality: string,
  weightGrams: number,
  preservation: number,
  sculpture: number,
  rarity: number,
  damage: number,
  provenanceDocumented: boolean,
): MoldaviteStone {
  const stone = {
    id,
    name: id,
    locality,
    quality: "A" as const,
    weightGrams,
    preservation,
    sculpture,
    rarity,
    damage,
    provenanceDocumented,
  };

  return {
    ...stone,
    score: calculateMoldaviteScore(stone),
  };
}
