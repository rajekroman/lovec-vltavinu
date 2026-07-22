export type LevelId = "chlum" | "nesmen" | "besednice" | "slavia";

export interface LevelDefinition {
  id: LevelId;
  chapter: string;
  location: string;
  title: string;
  briefing: string;
  objective: string;
  goal: string;
  requiresPermission: boolean;
  digCount: number;
  requiresFill: boolean;
  requiresOpponent: boolean;
  final: boolean;
}

export const LEVELS: readonly LevelDefinition[] = [
  {
    id: "chlum",
    chapter: "LOKALITA 1 / 4",
    location: "Chlum",
    title: "Pole po dešti",
    briefing:
      "Majitel pole je přímo na místě. Nejdříve si vyžádejte povolení, potom hledejte jediný označený nález a držte se mimo dráhu traktoru.",
    objective: "Získejte povolení a najděte první vltavín.",
    goal: "Promluvte s hospodářem, vykopejte označené místo a odejděte k cestě.",
    requiresPermission: true,
    digCount: 1,
    requiresFill: false,
    requiresOpponent: false,
    final: false,
  },
  {
    id: "nesmen",
    chapter: "LOKALITA 2 / 4",
    location: "Nesměň",
    title: "Lesní profily",
    briefing:
      "V lese lze pracovat pouze na vyznačených místech. Po každém nálezu musí být díra zasypaná, jinak lesník výpravu ukončí.",
    objective: "Vykopejte dva nálezy a zasypte obě díry.",
    goal: "Požádejte lesníka o souhlas, dokončete oba profily a vraťte les do pořádku.",
    requiresPermission: true,
    digCount: 2,
    requiresFill: true,
    requiresOpponent: false,
    final: false,
  },
  {
    id: "besednice",
    chapter: "LOKALITA 3 / 4",
    location: "Besednice",
    title: "Ježková vrstva",
    briefing:
      "Na okraji starého naleziště čeká strážce. Povolení získáte vysvětlením svého záměru, ale o kvalitní nález se zajímá také konkurenční hledač.",
    objective: "Získejte povolení, vykopejte nález a zastavte rivala.",
    goal: "Promluvte se strážcem, zvládněte rytmus kopání a najděte rivala dříve, než vám nález vezme.",
    requiresPermission: true,
    digCount: 1,
    requiresFill: false,
    requiresOpponent: true,
    final: false,
  },
  {
    id: "slavia",
    chapter: "FINÁLE 4 / 4",
    location: "KD Slavia",
    title: "Na Zelené Vlně",
    briefing:
      "Dorazili jste před KD Slavia. Expertka čeká na vaše nálezy, ale zloděj Franta se pokusí nejlepší kámen získat pro sebe.",
    objective: "Zastavte zloděje a získejte certifikaci sbírky.",
    goal: "Promluvte s expertkou, zastavte Frantu, vraťte se pro certifikaci a vstupte na akci.",
    requiresPermission: true,
    digCount: 0,
    requiresFill: false,
    requiresOpponent: true,
    final: true,
  },
];

export function getLevelDefinition(levelId: string): LevelDefinition {
  const level = LEVELS.find((entry) => entry.id === levelId);

  if (!level) {
    throw new Error(`Neznámý level: ${levelId}`);
  }

  return level;
}

export function getNextLevel(levelId: LevelId): LevelDefinition | null {
  const index = LEVELS.findIndex((entry) => entry.id === levelId);
  return index >= 0 ? LEVELS[index + 1] ?? null : null;
}
