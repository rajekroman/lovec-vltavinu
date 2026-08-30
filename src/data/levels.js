const deepFreeze = value => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

export const DIG_REQUIRED_HITS = 3;
export const CONTEXT_ACTION = "action";

const target = (id, kind, positions) => ({
  id,
  kind,
  reachable: true,
  positions,
  interaction: { action: CONTEXT_ACTION, enabled: true }
});

const objective = (id, type, targetId, required, options = {}) => ({
  id,
  type,
  target: targetId,
  required,
  action: CONTEXT_ACTION,
  ...options
});

const definitions = [
  {
    order: 0,
    id: "chlum",
    name: "Chlum",
    title: "Pole po dešti",
    scene: "level",
    theme: "field",
    music: "field",
    text: "Déšť omyl tmavou ornici. Nejdříve je nutné získat souhlas hospodáře a teprve potom hledat mimo dráhu traktoru.",
    goal: "Získej povolení, prohledej povrch pole a najdi tři vltavíny.",
    briefing: {
      context: "Majitel pole Václav je přímo na místě a traktor už znovu vyráží do brázd.",
      goal: "Promluv s Václavem, prohledej tři místa a odnes všechny povrchové nálezy."
    },
    spawn: { x: 120, y: 380 },
    bounds: { x: 0, y: 0, width: 1600, height: 1200 },
    walkable: { x: 40, y: 40, width: 1520, height: 1120 },
    blockedZones: [
      {
        id: "chlum-west-field-edge",
        kind: "verge-fence",
        shape: "polygon",
        points: [
          { x: 180, y: 210 },
          { x: 500, y: 210 },
          { x: 470, y: 285 },
          { x: 330, y: 330 },
          { x: 180, y: 300 }
        ],
        probe: { x: 330, y: 260 }
      },
      { id: "chlum-hay-bale-west", kind: "prop", shape: "circle", x: 1280, y: 925, radius: 42, probe: { x: 1280, y: 925 } },
      { id: "chlum-hay-bale-east", kind: "prop", shape: "circle", x: 1360, y: 860, radius: 36, probe: { x: 1360, y: 860 } },
      { id: "chlum-far-verge", kind: "vegetation", shape: "rect", x: 1210, y: 990, width: 300, height: 120, probe: { x: 1350, y: 1030 } }
    ],
    objective: { id: "chlum-permission-and-find", type: "chlum-permission-and-find", required: 1 },
    objectives: [
      objective("permission", "dialog", "farmer-vaclav", 1),
      objective("search-surface", "discover", "chlum-search-site", 3),
      objective("record-finding", "collect", "chlum-search-site", 3)
    ],
    targets: [
      target("farmer-vaclav", "npc", [{ x: 560, y: 410 }]),
      target("chlum-search-site", "surface-search", [
        { x: 1020, y: 720 },
        { x: 760, y: 920 },
        { x: 1240, y: 820 }
      ])
    ],
    hazards: ["tractor"],
    assetGroups: ["common", "level:chlum"],
    next: "nesmen"
  },
  {
    order: 1,
    id: "nesmen",
    name: "Nesměň",
    title: "Lesní profily",
    scene: "level",
    theme: "forest",
    music: "forest",
    text: "V lese lze pracovat jen na vyznačených místech. Každá odkrytá díra musí být bezprostředně zasypaná.",
    goal: "Získej souhlas lesníka, vykopej a zasyp 3 profily.",
    briefing: {
      context: "Lesník povolí průzkum pouze tehdy, když po výpravě nezůstane žádná otevřená díra.",
      goal: "Promluv s lesníkem, dokonči tři profily a všechny vrať do původního stavu."
    },
    spawn: { x: 180, y: 980 },
    bounds: { x: 0, y: 0, width: 1500, height: 1200 },
    walkable: { x: 120, y: 140, width: 1260, height: 940 },
    blockedZones: [
      { id: "nesmen-tree-west", kind: "tree", shape: "circle", x: 330, y: 520, radius: 52, probe: { x: 330, y: 520 } },
      { id: "nesmen-tree-northwest", kind: "tree", shape: "circle", x: 520, y: 280, radius: 44, probe: { x: 520, y: 280 } },
      { id: "nesmen-tree-north", kind: "tree", shape: "circle", x: 760, y: 330, radius: 50, probe: { x: 760, y: 330 } },
      { id: "nesmen-tree-east", kind: "tree", shape: "circle", x: 1080, y: 520, radius: 56, probe: { x: 1080, y: 520 } },
      { id: "nesmen-lower-forest-edge", kind: "roots-vegetation", shape: "rect", x: 1040, y: 1010, width: 320, height: 70, probe: { x: 1200, y: 1040 } }
    ],
    objective: { id: "nesmen-dig-and-restore", type: "nesmen-dig-and-restore", required: 3 },
    objectives: [
      objective("permission", "dialog", "forester", 1),
      objective("dig-profiles", "dig", "forest-profile", 3, { requiredHits: DIG_REQUIRED_HITS }),
      objective("fill-holes", "restore", "forest-profile", 3)
    ],
    targets: [
      target("forester", "npc", [{ x: 280, y: 240 }]),
      target("forest-profile", "dig-site", [
        { x: 610, y: 430 },
        { x: 930, y: 690 },
        { x: 1210, y: 360 }
      ])
    ],
    hazards: ["forester", "noise-alert"],
    assetGroups: ["common", "level:nesmen"],
    next: "besednice"
  },
  {
    order: 2,
    id: "besednice",
    name: "Besednice",
    title: "Ježková vrstva",
    scene: "level",
    theme: "quarry",
    music: "quarry",
    text: "Tři stopy vedou k ježkové vrstvě. Konkurenční hledač čeká, až nález vytáhne někdo jiný.",
    goal: "Promluv s místním znalcem, najdi 3 stopy, vykopej ježek a získej jej zpět od Karla.",
    briefing: {
      context: "Na starém nalezišti čeká místní znalec. Nejdřív vysvětlí, jak číst tři stopy vedoucí k ježkové vrstvě; rival Karel mezitím sleduje každý kvalitní nález.",
      goal: "Promluv se znalcem, prozkoumej všechny stopy, zvládni kopání a nenech Karla s nálezem utéct."
    },
    spawn: { x: 140, y: 1040 },
    bounds: { x: 0, y: 0, width: 1680, height: 1280 },
    walkable: { x: 100, y: 180, width: 1480, height: 980 },
    blockedZones: [
      {
        id: "besednice-west-slope",
        kind: "cliff",
        shape: "polygon",
        points: [
          { x: 120, y: 200 },
          { x: 430, y: 200 },
          { x: 380, y: 390 },
          { x: 120, y: 500 }
        ],
        probe: { x: 260, y: 300 }
      },
      {
        id: "besednice-north-cut",
        kind: "cliff",
        shape: "polygon",
        points: [
          { x: 540, y: 220 },
          { x: 980, y: 220 },
          { x: 880, y: 390 },
          { x: 610, y: 450 }
        ],
        probe: { x: 760, y: 300 }
      },
      { id: "besednice-puddle", kind: "water", shape: "circle", x: 720, y: 840, radius: 58, probe: { x: 720, y: 840 } },
      {
        id: "besednice-south-cut",
        kind: "quarry-edge",
        shape: "polygon",
        points: [
          { x: 980, y: 930 },
          { x: 1240, y: 960 },
          { x: 1190, y: 1120 },
          { x: 930, y: 1120 }
        ],
        probe: { x: 1080, y: 1020 }
      }
    ],
    objective: { id: "besednice-hedgehog-recovery", type: "besednice-hedgehog-recovery", required: 1 },
    objectives: [
      objective("local-briefing", "dialog", "besednice-guide", 1),
      objective("find-traces", "discover", "besednice-trace", 3),
      objective("dig-hedgehog", "dig", "besednice-hedgehog", 1, { requiredHits: DIG_REQUIRED_HITS }),
      objective("recover-hedgehog", "boss", "crystal-karel", 1)
    ],
    targets: [
      target("besednice-guide", "npc", [{ x: 260, y: 980 }]),
      target("besednice-trace", "clue", [
        { x: 470, y: 890 },
        { x: 880, y: 620 },
        { x: 1240, y: 420 }
      ]),
      target("besednice-hedgehog", "dig-site", [{ x: 1430, y: 260 }]),
      target("crystal-karel", "boss", [{ x: 1510, y: 900 }])
    ],
    hazards: ["crystal-karel", "quarry-edge"],
    assetGroups: ["common", "level:besednice"],
    next: "slavia"
  },
  {
    order: 3,
    id: "slavia",
    name: "KD Slavia",
    title: "Na Zelené Vlně",
    scene: "finale",
    theme: "city",
    music: "finale",
    text: "Před KD Slavia čeká znalkyně i zloděj Franta. Sbírka se na akci dostane až po certifikaci.",
    goal: "Dolož původ sbírky, zastav Frantu, získej certifikát a vstup na akci.",
    briefing: {
      context: "Expertka čeká na dokumentaci nálezů, zatímco Franta se pokouší získat nejlepší kámen.",
      goal: "Seber tři složky, promluv se znalkyní, zastav Frantu a nech sbírku certifikovat."
    },
    spawn: { x: 380, y: 860 },
    bounds: { x: 0, y: 0, width: 1800, height: 1100 },
    walkable: { x: 340, y: 120, width: 1360, height: 860 },
    blockedZones: [
      { id: "slavia-river-edge", kind: "water", shape: "rect", x: 360, y: 140, width: 120, height: 300, probe: { x: 410, y: 260 } },
      { id: "slavia-building-wing", kind: "building", shape: "rect", x: 1500, y: 140, width: 180, height: 230, probe: { x: 1580, y: 240 } },
      { id: "slavia-traffic-fringe", kind: "traffic", shape: "rect", x: 520, y: 910, width: 620, height: 50, probe: { x: 800, y: 930 } },
      { id: "slavia-event-barrier", kind: "barrier", shape: "rect", x: 900, y: 560, width: 150, height: 46, probe: { x: 970, y: 580 } },
      { id: "slavia-tree-bed", kind: "vegetation", shape: "circle", x: 1280, y: 670, radius: 55, probe: { x: 1280, y: 670 } }
    ],
    objective: { id: "slavia-certification", type: "slavia-certification", required: 1 },
    objectives: [
      objective("collect-documents", "collect", "documentation-folder", 3),
      objective("consult-expert", "dialog", "expert-eva", 1),
      objective("recover-best-finding", "boss", "thief-franta", 1),
      objective("receive-certificate", "dialog", "expert-eva", 1),
      objective("enter-event", "destination", "kd-slavia", 1)
    ],
    targets: [
      target("documentation-folder", "document", [
        { x: 410, y: 760 },
        { x: 790, y: 460 },
        { x: 1130, y: 780 }
      ]),
      target("expert-eva", "npc", [{ x: 1450, y: 430 }]),
      target("thief-franta", "boss", [{ x: 1020, y: 260 }]),
      target("kd-slavia", "destination", [{ x: 1630, y: 520 }])
    ],
    hazards: ["thief-franta", "traffic"],
    assetGroups: ["common", "level:slavia"],
    next: null,
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
  return getLevelDefinition(id)?.next ?? null;
}

export function getLevelTarget(levelId, targetId) {
  const level = getLevelDefinition(levelId);
  return level?.targets.find(entry => entry.id === targetId) ?? null;
}

export function isLevelTargetReachable(levelId, targetId, required = 1) {
  const level = getLevelDefinition(levelId);
  const entry = getLevelTarget(levelId, targetId);
  if (!level || !entry || entry.reachable !== true || entry.interaction?.enabled !== true) return false;
  if (entry.interaction.action !== CONTEXT_ACTION || entry.positions.length < required) return false;

  const { x, y, width, height } = level.walkable ?? level.bounds;
  return entry.positions.every(position => (
    position.x >= x && position.x <= x + width &&
    position.y >= y && position.y <= y + height
  ));
}
