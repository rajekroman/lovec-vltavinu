const deepFreeze = value => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const definitions = [
  {
    order: 0,
    id: "chlum",
    name: "Chlum",
    title: "Chlum po bouřce",
    theme: "field",
    music: "field",
    text: "Déšť omyl tmavou ornici. V brázdách leží první zelené záblesky, ale traktor už znovu vyráží do pole.",
    goal: "Získej souhlas Václava a odnes 4 pravé kameny.",
    objectives: [
      { id: "permission", type: "dialog", target: "farmer-vaclav", required: 1 },
      { id: "collect-stones", type: "collect", target: "moldavite", required: 4 }
    ],
    hazards: ["tractor", "field-alert"]
  },
  {
    order: 1,
    id: "locenice",
    name: "Ločenice",
    title: "Štěrková hrana",
    theme: "meadow",
    music: "meadow",
    text: "Erozní rýha odkryla vltavíny i lahvové střepy. Tentokrát rozhoduje rychlé oko, ne síla lopaty.",
    goal: "Správně urči 5 vzorků a najdi 3 pravé kusy.",
    objectives: [
      { id: "identify-samples", type: "identify", target: "sample", required: 5 },
      { id: "collect-real-stones", type: "collect", target: "moldavite", required: 3 }
    ],
    hazards: ["patrol", "false-samples"]
  },
  {
    order: 2,
    id: "nesmen",
    name: "Nesměň",
    title: "Lesní profily",
    theme: "forest",
    music: "forest",
    text: "Mělké jílové profily jsou povolené, pokud po sobě nezůstane ani jedna otevřená jáma.",
    goal: "Vykopej a zasyp 3 profily bez zbytečného hluku.",
    objectives: [
      { id: "dig-profiles", type: "dig", target: "profile", required: 3 },
      { id: "fill-holes", type: "restore", target: "hole", required: 3 }
    ],
    hazards: ["forester", "noise-alert"]
  },
  {
    order: 3,
    id: "besednice",
    name: "Besednice",
    title: "Ježková noc",
    theme: "night",
    music: "night",
    text: "Tři stopy vedou k ježkové vrstvě. Ve tmě se ale pohybuje rival, který čeká na cizí nález.",
    goal: "Najdi 3 stopy, vykopej ježek a dostaň ho zpět od Karla.",
    objectives: [
      { id: "find-traces", type: "discover", target: "trace", required: 3 },
      { id: "dig-hedgehog", type: "dig", target: "besednice-hedgehog", required: 1 },
      { id: "recover-hedgehog", type: "boss", target: "crystal-karel", required: 1 }
    ],
    hazards: ["crystal-karel", "darkness"]
  },
  {
    order: 4,
    id: "malse",
    name: "Malše",
    title: "Cesta ke Slávii",
    theme: "city",
    music: "city",
    text: "Podél Malše vede poslední úsek. Dokumentace se rozsypala mezi promenádou, lávkou a provozem před Slávií.",
    goal: "Seber 3 složky, dožeň Frantu a vstup do Slávie.",
    objectives: [
      { id: "collect-documents", type: "collect", target: "documentation-folder", required: 3 },
      { id: "catch-franta", type: "chase", target: "franta", required: 1 },
      { id: "enter-slavia", type: "destination", target: "kd-slavia", required: 1 }
    ],
    hazards: ["traffic", "franta"],
    final: true
  }
];

export const LEVEL_DEFINITIONS = deepFreeze(definitions);
export const LEVEL_ORDER = Object.freeze(LEVEL_DEFINITIONS.map(level => level.id));
const levelById = new Map(LEVEL_DEFINITIONS.map(level => [level.id, level]));

export function getLevelDefinition(id) {
  return levelById.get(id) ?? null;
}

export function getNextLevelId(id) {
  const index = LEVEL_ORDER.indexOf(id);
  return index >= 0 && index < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[index + 1] : null;
}
