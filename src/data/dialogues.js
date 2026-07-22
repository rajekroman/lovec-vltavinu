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
  }
];

export const DIALOGUE_DEFINITIONS = deepFreeze(definitions);
const dialogueById = new Map(DIALOGUE_DEFINITIONS.map(dialogue => [dialogue.id, dialogue]));

export function getDialogueDefinition(id) {
  return dialogueById.get(id) ?? null;
}
