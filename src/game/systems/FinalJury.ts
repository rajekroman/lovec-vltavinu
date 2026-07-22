import {
  calculateMoldaviteScore,
  type MoldaviteStone,
} from "../mechanics/Moldavite";

export interface JuryEntry {
  readonly rank: number;
  readonly stone: MoldaviteStone;
  readonly score: number;
}

export interface JuryResult {
  readonly ranked: readonly JuryEntry[];
  readonly selected: readonly JuryEntry[];
  readonly totalScore: number;
  readonly rating: string;
}

export function evaluateFinalCollection(stones: readonly MoldaviteStone[]): JuryResult {
  const ranked = stones
    .map((stone) => ({
      rank: 0,
      stone,
      score: calculateMoldaviteScore(stone),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.stone.weightGrams - left.stone.weightGrams;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const selected = ranked.slice(0, 3);
  const totalScore = selected.reduce((sum, entry) => sum + entry.score, 0);

  return {
    ranked,
    selected,
    totalScore,
    rating: getRating(totalScore, selected.length),
  };
}

function getRating(score: number, selectedCount: number): string {
  if (selectedCount === 0) {
    return "Bez hodnocení";
  }

  if (score >= 5200) {
    return "Mimořádná sbírka";
  }

  if (score >= 3800) {
    return "Velmi dobrá sbírka";
  }

  if (score >= 2400) {
    return "Solidní sbírka";
  }

  return "Začínající sbírka";
}
