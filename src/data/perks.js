const freezePerk = perk => Object.freeze({ ...perk });

export const PERKS = Object.freeze([
  freezePerk({ id: "boots", icon: "↟", name: "Lehké boty", text: "+12 % rychlost pohybu", max: 3 }),
  freezePerk({ id: "scanner", icon: "◉", name: "Bystrý rozhled", text: "větší dosah rozhlédnutí a kratší čekání", max: 3 }),
  freezePerk({ id: "shovel", icon: "⛏", name: "Přesná lopatka", text: "širší zelené pole při kopání", max: 3 }),
  freezePerk({ id: "quiet", icon: "◌", name: "Tichý postup", text: "méně pozornosti za chyby", max: 3 }),
  freezePerk({ id: "case", icon: "▣", name: "Pevné pouzdro", text: "při dopadení neztratíš nejlepší kus", max: 2 }),
  freezePerk({ id: "eye", icon: "◉", name: "Zkušené oko", text: "vyšší kvalita správně určených kusů", max: 3 })
]);

export const PERK_BY_ID = new Map(PERKS.map(perk => [perk.id, perk]));

export function getPerk(id) {
  return PERK_BY_ID.get(id) ?? null;
}

export function requirePerk(id) {
  const perk = getPerk(id);
  if (!perk) throw new Error(`Unknown perk: ${id}`);
  return perk;
}

export function createEmptyPerks() {
  return Object.fromEntries(PERKS.map(perk => [perk.id, 0]));
}

export function normalizePerks(input = {}) {
  const result = createEmptyPerks();
  for (const perk of PERKS) {
    const value = Number(input?.[perk.id]);
    result[perk.id] = Number.isFinite(value)
      ? Math.max(0, Math.min(perk.max, Math.floor(value)))
      : 0;
  }
  return result;
}
