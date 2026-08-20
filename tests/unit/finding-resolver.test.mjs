import test from "node:test";
import assert from "node:assert/strict";
import { resolveVariant, scaleScore, createFinding } from "../../src/gameplay/FindingResolver.js";
import { createRng } from "../../src/gameplay/SessionRng.js";

const VARIANTS = [
  { id: "small", rarity: "C", weight: 0.8, score: 50 },
  { id: "standard", rarity: "B", weight: 1.2, score: 90 },
  { id: "rare", rarity: "A", weight: 1.7, score: 150 }
];

test("resolveVariant returns C for low quality", () => {
  const v = resolveVariant(VARIANTS, 0.1, null);
  assert.equal(v.rarity, "C");
});

test("resolveVariant returns B for medium quality", () => {
  const v = resolveVariant(VARIANTS, 0.5, null);
  assert.equal(v.rarity, "B");
});

test("resolveVariant returns A for high quality", () => {
  const v = resolveVariant(VARIANTS, 0.9, null);
  assert.equal(v.rarity, "A");
});

test("resolveVariant with RNG jitter stays within expected range", () => {
  const rng = createRng(99);
  const counts = { A: 0, B: 0, C: 0 };
  for (let i = 0; i < 100; i++) {
    const r = createRng(99 + i);
    const v = resolveVariant(VARIANTS, 0.5, r);
    counts[v.rarity]++;
  }
  assert.ok(counts.B > 50, `B should dominate at quality 0.5, got ${counts.B}`);
});

test("resolveVariant with single variant always returns it", () => {
  const single = [{ id: "only", rarity: "A", weight: 2.8, score: 240 }];
  assert.equal(resolveVariant(single, 0.0, null).id, "only");
  assert.equal(resolveVariant(single, 1.0, null).id, "only");
});

test("resolveVariant throws on empty array", () => {
  assert.throws(() => resolveVariant([], 0.5, null), /No finding variants/);
});

test("scaleScore scales from 70% to 130%", () => {
  assert.equal(scaleScore(100, 0), 70);
  assert.equal(scaleScore(100, 0.5), 100);
  assert.equal(scaleScore(100, 1), 130);
});

test("createFinding produces frozen object with scaled score", () => {
  const variant = { rarity: "B", weight: 1.2, score: 90 };
  const f = createFinding(variant, "test-1", "chlum", 0.8);
  assert.equal(f.findingId, "test-1");
  assert.equal(f.locality, "chlum");
  assert.equal(f.rarity, "B");
  assert.equal(f.weight, 1.2);
  assert.equal(f.score, scaleScore(90, 0.8));
  assert.ok(Object.isFrozen(f));
});
