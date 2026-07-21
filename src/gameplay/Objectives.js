import { requireLevel } from "../data/levels.js";

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const count = value => Math.max(0, Math.floor(Number(value) || 0));

function chlum(runtime) {
  const collected = count(runtime.collected);
  const permit = runtime.permit === true;
  return {
    text: permit ? `Kameny ${collected}/4` : "Promluv s Václavem",
    complete: permit && collected >= 4,
    progress: clamp01((permit ? 0.2 : 0) + clamp01(collected / 4) * 0.8),
    current: { permit, collected },
    target: { permit: true, collected: 4 }
  };
}

function locenice(runtime) {
  const correct = count(runtime.correct);
  const real = count(runtime.real);
  return {
    text: `Správně ${correct}/5 · pravé ${real}/3`,
    complete: correct >= 5 && real >= 3,
    progress: (clamp01(correct / 5) + clamp01(real / 3)) / 2,
    current: { correct, real },
    target: { correct: 5, real: 3 }
  };
}

function nesmen(runtime) {
  const permit = runtime.permit === true;
  const dug = count(runtime.dug);
  const filled = count(runtime.filled);
  return {
    text: permit ? `Profily ${dug}/3 · zahrabáno ${filled}/3` : "Získej souhlas lesníka",
    complete: permit && dug >= 3 && filled >= 3,
    progress: clamp01((permit ? 0.1 : 0) + clamp01(dug / 3) * 0.45 + clamp01(filled / 3) * 0.45),
    current: { permit, dug, filled },
    target: { permit: true, dug: 3, filled: 3 }
  };
}

function besednice(runtime) {
  const clues = count(runtime.clues);
  const hedgehog = runtime.hedgehog === true;
  const bossStarted = runtime.bossStarted === true;
  const bossDefeated = runtime.bossDefeated === true;
  const text = bossStarted
    ? (bossDefeated ? "Ježek je v bezpečí" : "Dostaň ježek zpět")
    : clues < 3
      ? `Stopy ${clues}/3`
      : "Vykopej ježkový profil";
  return {
    text,
    complete: bossDefeated,
    progress: clamp01(clamp01(clues / 3) * 0.45 + (hedgehog ? 0.15 : 0) + (bossStarted ? 0.1 : 0) + (bossDefeated ? 0.3 : 0)),
    current: { clues, hedgehog, bossStarted, bossDefeated },
    target: { clues: 3, hedgehog: true, bossStarted: true, bossDefeated: true }
  };
}

function malse(runtime) {
  const papers = count(runtime.papers);
  const bossStarted = runtime.bossStarted === true;
  const bossDefeated = runtime.bossDefeated === true;
  const text = bossStarted
    ? (bossDefeated ? "Vstup do Slávie" : "Dožeň Frantu")
    : `Dokumenty ${papers}/3`;
  return {
    text,
    complete: papers >= 3 && bossDefeated,
    progress: clamp01(clamp01(papers / 3) * 0.6 + (bossStarted ? 0.1 : 0) + (bossDefeated ? 0.3 : 0)),
    current: { papers, bossStarted, bossDefeated },
    target: { papers: 3, bossStarted: true, bossDefeated: true }
  };
}

const evaluators = Object.freeze({ chlum, locenice, nesmen, besednice, malse });

export function evaluateObjective(levelId, runtime = {}) {
  const level = requireLevel(levelId);
  const evaluator = evaluators[level.id];
  if (!evaluator) throw new Error(`No objective evaluator for level: ${level.id}`);
  return {
    levelId: level.id,
    levelName: level.name,
    ...evaluator(runtime ?? {})
  };
}

export function isObjectiveComplete(levelId, runtime = {}) {
  return evaluateObjective(levelId, runtime).complete;
}
