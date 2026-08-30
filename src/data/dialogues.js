const deepFreeze = value => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const definitions = [
  {
    id: "chlum-permission",
    speaker: { entityId: "farmer-vaclav", name: "Václav", role: "farmer" },
    lines: [
      "Po dešti můžeš projít označenou část pole.",
      "Drž se mimo dráhu traktoru a odnes jen nález z vyznačeného místa."
    ],
    actionLabel: "MÁM POVOLENÍ",
    grantsFlag: "chlumPermission"
  },
  {
    id: "nesmen-permission",
    speaker: { entityId: "forester", name: "Jan", role: "forester" },
    lines: [
      "Pracuj jen na třech vyznačených profilech.",
      "Každý profil po prohlédnutí hned zasyp a nenechávej v lese otevřenou díru."
    ],
    actionLabel: "ROZUMÍM",
    grantsFlag: "nesmenPermission"
  },
  {
    id: "besednice-guide",
    speaker: { entityId: "besednice-guide", name: "Milan", role: "quarry-guide" },
    lines: [
      "Ježková vrstva se neukáže hned. Nejdřív projdi tři stopy v odkryté hlíně.",
      "Až všechny přečteš, poznáš správný profil. Vykopej ho přesně a hlídej si Karla — na dobrý nález čeká."
    ],
    actionLabel: "JDU PO STOPÁCH"
  },
  {
    id: "besednice-karel-defeated",
    speaker: { entityId: "crystal-karel", name: "Karel", role: "rival" },
    lines: [
      "Tenhle kousek měl být můj.",
      "Vezmi si ho — příště budu rychlejší."
    ],
    actionLabel: "MÁM JEŽKA ZPĚT"
  },
  {
    id: "slavia-expert-consultation",
    speaker: { entityId: "expert-eva", name: "Eva — znalkyně", role: "expert" },
    lines: [
      "Dokumentace sedí.",
      "Franta se ale pokusil odnést nejlepší kus; zastav ho a vrať se pro certifikát."
    ],
    actionLabel: "ZASTAVIT FRANTU"
  },
  {
    id: "slavia-franta-defeated",
    speaker: { entityId: "thief-franta", name: "František", role: "thief" },
    lines: [
      "Dobře, dobře — nikdo se nezraní.",
      "Nález je tvůj. Jen si pamatuj, kdo ti ho skoro vzal."
    ],
    actionLabel: "NÁLEZ ZAJIŠTĚN"
  },
  {
    id: "slavia-certification",
    speaker: { entityId: "expert-eva", name: "Eva — porota", role: "expert" },
    lines: [
      "Sbírka je ověřena a může do finálního hodnocení akce Na Zelené Vlně."
    ],
    actionLabel: "KE VSTUPU"
  }
];

export const DIALOGUE_DEFINITIONS = deepFreeze(definitions);
const dialogueById = new Map(DIALOGUE_DEFINITIONS.map(dialogue => [dialogue.id, dialogue]));

export function getDialogueDefinition(id) {
  return dialogueById.get(id) ?? null;
}
