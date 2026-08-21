import { LEVEL_DEFINITIONS, getLevelDefinition } from "../data/levels.js";

/**
 * Shapes GameSession state into generic { summary, items } view data for the
 * inventory screen. Keeps gameplay vocabulary (finding rarity/locality) out
 * of ScreenController, which only renders pre-built display strings.
 */
export function buildInventoryView(session) {
  const findings = session?.state?.findings ?? [];
  const totalScore = findings.reduce((sum, entry) => sum + (Number(entry.score) || 0), 0);
  const summary = findings.length
    ? `Nalezeno kamenů: ${findings.length} · Skóre: ${totalScore}`
    : "Zatím nic. Vyraz do terénu.";

  const items = findings.map(entry => ({
    title: `${getLevelDefinition(entry.locality)?.name ?? entry.locality} · ${entry.rarity}`,
    detail: `${Number(entry.weight).toFixed(1)} g · ${entry.score} bodů`
  }));

  return { summary, items };
}

/**
 * Shapes GameSession state + level order into generic { entries } view data
 * for the location journal screen.
 */
export function buildJournalView(session) {
  const levelId = session?.state?.levelId ?? null;
  const currentOrder = levelId ? getLevelDefinition(levelId)?.order ?? -1 : -1;
  const findings = session?.state?.findings ?? [];

  const entries = LEVEL_DEFINITIONS.map(level => {
    const foundCount = findings.filter(entry => entry.locality === level.id).length;
    const statusText = level.order < currentOrder ? "Dokončeno" : level.order === currentOrder ? "Právě zde" : "Čeká";
    return {
      badge: String(level.order + 1),
      title: level.name,
      status: foundCount > 0 ? `${statusText} · nalezeno kamenů: ${foundCount}` : statusText
    };
  });

  return { entries };
}
