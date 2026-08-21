import { LEVEL_DEFINITIONS, getLevelDefinition } from "../data/levels.js";

/**
 * Shapes GameSession state + level order into generic { entries } view data
 * for the location journal screen. Only ever surfaces an aggregate
 * per-locality count (the same kind of number the HUD's bag-pill already
 * shows), never a browsable per-finding list — this repo's architecture
 * contract explicitly forbids an inventory UI over individual findings.
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
