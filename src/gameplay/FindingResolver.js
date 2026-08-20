const RARITY_RANK = { C: 0, B: 1, A: 2 };

export function resolveVariant(variants, quality, rng) {
  if (!Array.isArray(variants) || !variants.length) throw new Error("No finding variants available.");
  if (variants.length === 1) return variants[0];

  const sorted = [...variants].sort((a, b) => (RARITY_RANK[a.rarity] ?? 0) - (RARITY_RANK[b.rarity] ?? 0));
  const jitter = rng ? (rng() - 0.5) * 0.08 : 0;
  const q = Math.max(0, Math.min(1, quality + jitter));

  if (sorted.length === 2) return q >= 0.5 ? sorted[1] : sorted[0];
  if (q >= 0.67) return sorted[2];
  if (q >= 0.33) return sorted[1];
  return sorted[0];
}

export function scaleScore(baseScore, quality, perfect = false) {
  const base = Math.round(baseScore * (0.7 + 0.6 * quality));
  return perfect ? Math.round(base + base * 0.15) : base;
}

export function createFinding(variant, findingId, locality, quality, perfect = false) {
  return Object.freeze({
    findingId,
    locality,
    rarity: variant.rarity,
    weight: variant.weight,
    score: scaleScore(variant.score, quality, perfect)
  });
}
