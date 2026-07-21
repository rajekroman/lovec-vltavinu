const freezeLevel = level => Object.freeze({
  ...level,
  objective: Object.freeze({ ...level.objective })
});

export const LEVELS = Object.freeze([
  freezeLevel({
    id: "chlum",
    order: 0,
    name: "Chlum",
    title: "Chlum po bouřce",
    theme: "field",
    music: "field",
    intro: "Déšť omyl tmavou ornici. V brázdách leží první zelené záblesky, ale traktor už znovu vyráží do pole.",
    goal: "Získej souhlas Václava a odnes 4 pravé kameny.",
    objective: { type: "permission-and-collect", permit: true, collected: 4 }
  }),
  freezeLevel({
    id: "locenice",
    order: 1,
    name: "Ločenice",
    title: "Štěrková hrana",
    theme: "meadow",
    music: "meadow",
    intro: "Erozní rýha odkryla vltavíny i lahvové střepy. Tentokrát rozhoduje rychlé oko, ne síla lopaty.",
    goal: "Správně urči 5 vzorků a najdi 3 pravé kusy.",
    objective: { type: "identify", correct: 5, real: 3 }
  }),
  freezeLevel({
    id: "nesmen",
    order: 2,
    name: "Nesměň",
    title: "Lesní profily",
    theme: "forest",
    music: "forest",
    intro: "Mělké jílové profily jsou povolené, pokud po sobě nezůstane ani jedna otevřená jáma.",
    goal: "Vykopej a zasyp 3 profily bez zbytečného hluku.",
    objective: { type: "dig-and-fill", permit: true, dug: 3, filled: 3 }
  }),
  freezeLevel({
    id: "besednice",
    order: 3,
    name: "Besednice",
    title: "Ježková noc",
    theme: "night",
    music: "night",
    intro: "Tři stopy vedou k ježkové vrstvě. Ve tmě se ale pohybuje rival, který čeká na cizí nález.",
    goal: "Najdi 3 stopy, vykopej ježek a dostaň ho zpět od Karla.",
    objective: { type: "clues-and-boss", clues: 3, bossDefeated: true }
  }),
  freezeLevel({
    id: "malse",
    order: 4,
    name: "Malše",
    title: "Cesta ke Slávii",
    theme: "city",
    music: "city",
    intro: "Podél Malše vede poslední úsek. Dokumentace se rozsypala mezi promenádou, lávkou a provozem před Slávií.",
    goal: "Seber 3 složky, dožeň Frantu a vstup do Slávie.",
    objective: { type: "papers-and-boss", papers: 3, bossDefeated: true }
  })
]);

export const LEVEL_BY_ID = new Map(LEVELS.map(level => [level.id, level]));

export function getLevel(idOrIndex) {
  if (Number.isInteger(idOrIndex)) return LEVELS[idOrIndex] ?? null;
  return LEVEL_BY_ID.get(idOrIndex) ?? null;
}

export function requireLevel(idOrIndex) {
  const level = getLevel(idOrIndex);
  if (!level) throw new Error(`Unknown level: ${idOrIndex}`);
  return level;
}
