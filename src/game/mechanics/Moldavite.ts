export type MoldaviteQuality = "A" | "B" | "C";

export interface MoldaviteStone {
  readonly id: string;
  readonly name: string;
  readonly locality: string;
  readonly quality: MoldaviteQuality;
  readonly weightGrams: number;
  readonly preservation: number;
  readonly sculpture: number;
  readonly rarity: number;
  readonly damage: number;
  readonly provenanceDocumented: boolean;
  readonly score: number;
}

export interface MoldaviteGenerationInput {
  readonly id: string;
  readonly name: string;
  readonly locality: string;
  readonly quality: MoldaviteQuality;
  readonly misses: number;
  readonly baseScore: number;
  readonly siteIndex: number;
  readonly provenanceDocumented: boolean;
}

interface QualityProfile {
  readonly weightMultiplier: number;
  readonly preservation: number;
  readonly sculpture: number;
  readonly rarity: number;
}

const QUALITY_PROFILES: Readonly<Record<MoldaviteQuality, QualityProfile>> = {
  A: {
    weightMultiplier: 1.12,
    preservation: 96,
    sculpture: 88,
    rarity: 82,
  },
  B: {
    weightMultiplier: 0.92,
    preservation: 82,
    sculpture: 70,
    rarity: 63,
  },
  C: {
    weightMultiplier: 0.74,
    preservation: 65,
    sculpture: 53,
    rarity: 46,
  },
};

const LOCALITY_WEIGHTS: Readonly<Record<string, number>> = {
  Chlum: 2.55,
  Nesměň: 2.15,
  Besednice: 4.25,
};

export function generateMoldavite(input: MoldaviteGenerationInput): MoldaviteStone {
  const profile = QUALITY_PROFILES[input.quality];
  const localityWeight = LOCALITY_WEIGHTS[input.locality] ?? 2.4;
  const siteVariation = 1 + (input.siteIndex % 3) * 0.11;
  const baseFactor = Math.max(0.8, input.baseScore / 1000);
  const misses = Math.max(0, Math.floor(input.misses));
  const localRarityBonus = Math.round((baseFactor - 0.95) * 18);

  const stone: Omit<MoldaviteStone, "score"> = {
    id: input.id,
    name: input.name,
    locality: input.locality,
    quality: input.quality,
    weightGrams: round(localityWeight * profile.weightMultiplier * siteVariation, 2),
    preservation: clamp(profile.preservation - misses * 3, 0, 100),
    sculpture: clamp(
      profile.sculpture +
      (input.locality === "Besednice" ? 7 : 0) -
      misses * 2,
      0,
      100,
    ),
    rarity: clamp(
      profile.rarity +
      localRarityBonus +
      (input.locality === "Besednice" ? 8 : 0),
      0,
      100,
    ),
    damage: clamp(misses * 15, 0, 100),
    provenanceDocumented: input.provenanceDocumented,
  };

  return {
    ...stone,
    score: calculateMoldaviteScore(stone),
  };
}

export function calculateMoldaviteScore(stone: Omit<MoldaviteStone, "score"> | MoldaviteStone): number {
  const provenanceBonus = stone.provenanceDocumented ? 260 : -180;
  return Math.max(
    0,
    Math.round(
      stone.weightGrams * 150 +
      stone.preservation * 4.5 +
      stone.sculpture * 3 +
      stone.rarity * 2.7 -
      stone.damage * 4 +
      provenanceBonus,
    ),
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
