import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSlaviaCollection, selectJuryFindings } from "../../src/gameplay/SlaviaEvaluation.js";

const finding = (findingId, locality, rarity, weight, score) => ({ findingId, locality, rarity, weight, score });

test("Slavia evaluation deterministically ranks the complete collection", () => {
  const result = evaluateSlaviaCollection({
    score: 570,
    findings: [
      finding("chlum-finding-1", "chlum", "B", 1.2, 90),
      finding("nesmen-finding-1", "nesmen", "B", 1.5, 120),
      finding("besednice-hedgehog-1", "besednice", "A", 2.8, 240)
    ]
  });

  assert.deepEqual(result, {
    findingCount: 3,
    localityCount: 3,
    localities: ["besednice", "chlum", "nesmen"],
    totalWeight: 5.5,
    rarityPoints: 7,
    score: 570,
    bestFindingId: "besednice-hedgehog-1",
    submittedFindingIds: ["chlum-finding-1", "nesmen-finding-1", "besednice-hedgehog-1"],
    award: "grand-prize"
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.localities), true);
  assert.equal(Object.isFrozen(result.submittedFindingIds), true);
});

test("jury submission evaluates exactly four selected findings without mutating the session", () => {
  const findings = [
    finding("a", "chlum", "C", 1, 50),
    finding("b", "chlum", "B", 1.2, 90),
    finding("c", "nesmen", "B", 1.5, 120),
    finding("d", "besednice", "A", 2.8, 240),
    finding("e", "besednice", "C", 0.8, 40)
  ];
  const before = structuredClone(findings);
  const state = { score: 540, findings };
  const selectedIds = ["b", "c", "d", "e"];
  const projected = selectJuryFindings(findings, selectedIds);
  const result = evaluateSlaviaCollection(state, selectedIds);

  assert.equal(result.findingCount, 4);
  assert.equal(result.score, 490);
  assert.equal(result.totalWeight, 6.3);
  assert.equal(result.rarityPoints, 8);
  assert.deepEqual(result.submittedFindingIds, selectedIds);
  assert.deepEqual(projected, before.filter(entry => selectedIds.includes(entry.findingId)));
  for (const selected of projected) {
    const original = before.find(entry => entry.findingId === selected.findingId);
    assert.deepEqual(selected, original);
    assert.deepEqual(Object.keys(selected).sort(), ["findingId", "locality", "rarity", "score", "weight"]);
  }
  assert.equal(state.findings, findings);
  assert.deepEqual(state.findings, before);
  assert.equal(state.findings.length, 5);
  assert.equal(state.score, 540);
});

test("jury selection requires four distinct known IDs only when the collection exceeds four", () => {
  const findings = ["a", "b", "c", "d", "e"].map((id, index) => finding(id, "chlum", "C", 1, 10 + index));
  assert.throws(() => selectJuryFindings(findings), /exactly 4/);
  assert.throws(() => selectJuryFindings(findings, ["a", "a", "b", "c"]), /unique/);
  assert.throws(() => selectJuryFindings(findings, ["a", "b", "c", "missing"]), /Unknown jury finding ID/);
  assert.deepEqual(selectJuryFindings(findings.slice(0, 4)).map(entry => entry.findingId), ["a", "b", "c", "d"]);
});

test("Slavia evaluation has deterministic lower award thresholds", () => {
  assert.equal(evaluateSlaviaCollection({
    score: 260,
    findings: [
      finding("a", "chlum", "B", 1, 120),
      finding("b", "nesmen", "C", 1, 140)
    ]
  }).award, "jury-recognition");

  assert.equal(evaluateSlaviaCollection({ score: 0, findings: [] }).award, "participant");
});

test("Slavia evaluation rejects malformed or duplicate session findings", () => {
  assert.throws(() => evaluateSlaviaCollection(null), /Session state must be an object/);
  assert.throws(() => evaluateSlaviaCollection({ score: -1, findings: [] }), /score must be a non-negative/);
  assert.throws(() => evaluateSlaviaCollection({
    score: 10,
    findings: [finding("same", "chlum", "B", 1, 10), finding("same", "nesmen", "A", 2, 20)]
  }), /unique findingId/);
  assert.throws(() => evaluateSlaviaCollection({
    score: 10,
    findings: [finding("x", "chlum", "Z", 1, 10)]
  }), /Unknown finding rarity/);
});
