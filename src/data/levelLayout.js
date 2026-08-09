const deepFreeze = value => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

// These are deliberately authored placements, not random decoration.  Every
// blocker has a matching visible prop in LevelEnvironment so the playable
// route is explained by the landscape rather than by invisible walls.
export const LEVEL_ENVIRONMENT_LAYOUTS = deepFreeze({
  chlum: {
    props: [
      { kind: "hedgerow", x: 210, y: 180, width: 330, height: 82 },
      { kind: "hedgerow", x: 1040, y: 156, width: 390, height: 96 },
      { kind: "tree", x: 164, y: 236, scale: 1.2 }, { kind: "tree", x: 1380, y: 252, scale: 1.5 },
      { kind: "tree", x: 1460, y: 340, scale: 1.05 }, { kind: "tree", x: 208, y: 1020, scale: 1.1 },
      { kind: "tree", x: 1450, y: 1050, scale: 1.35 },
      { kind: "wetPatch", x: 700, y: 800, width: 280, height: 120 },
      { kind: "wetPatch", x: 1160, y: 500, width: 180, height: 84 },
      { kind: "fieldStone", x: 840, y: 1010, scale: 1.15 }, { kind: "fieldStone", x: 1490, y: 700, scale: 0.9 }
    ],
    obstacles: [
      { id: "chlum-north-remizek", x: 210, y: 180, width: 330, height: 82 },
      { id: "chlum-east-remizek", x: 1040, y: 156, width: 390, height: 96 },
      { id: "chlum-south-tree", x: 166, y: 978, width: 84, height: 86 },
      { id: "chlum-east-tree", x: 1408, y: 1004, width: 86, height: 92 }
    ]
  },
  nesmen: {
    props: [
      { kind: "treeCluster", x: 350, y: 570, width: 110, height: 230 },
      { kind: "treeCluster", x: 1220, y: 760, width: 190, height: 310 },
      { kind: "treeCluster", x: 1080, y: 200, width: 270, height: 130 },
      { kind: "tree", x: 490, y: 240, scale: 1.6 }, { kind: "tree", x: 790, y: 980, scale: 1.35 },
      { kind: "tree", x: 1040, y: 900, scale: 1.2 }, { kind: "stump", x: 460, y: 730, scale: 1.05 },
      { kind: "stump", x: 1170, y: 500, scale: 1.2 }, { kind: "root", x: 650, y: 820, width: 150, height: 42 },
      { kind: "sandMound", x: 590, y: 430, scale: 1.2 }, { kind: "sandMound", x: 930, y: 690, scale: 1.15 },
      { kind: "sandMound", x: 1210, y: 360, scale: 1.2 }
    ],
    obstacles: [
      { id: "nesmen-west-growth", x: 350, y: 570, width: 110, height: 230 },
      { id: "nesmen-east-growth", x: 1220, y: 760, width: 190, height: 310 },
      { id: "nesmen-north-growth", x: 1080, y: 200, width: 270, height: 130 },
      { id: "nesmen-root", x: 650, y: 820, width: 150, height: 42 }
    ]
  },
  besednice: {
    props: [
      { kind: "embankment", x: 250, y: 270, width: 280, height: 110 },
      { kind: "embankment", x: 720, y: 220, width: 280, height: 92 },
      { kind: "embankment", x: 1110, y: 800, width: 220, height: 120 },
      { kind: "quarryPit", x: 620, y: 1020, width: 260, height: 105 },
      { kind: "rockCluster", x: 320, y: 640, width: 150, height: 120 },
      { kind: "rockCluster", x: 980, y: 420, width: 140, height: 105 },
      { kind: "rock", x: 1320, y: 640, scale: 1.45 }, { kind: "rock", x: 1460, y: 270, scale: 1.25 },
      { kind: "scrub", x: 180, y: 360, scale: 1.2 }, { kind: "scrub", x: 1510, y: 1100, scale: 1.4 }
    ],
    obstacles: [
      { id: "besednice-north-west-val", x: 250, y: 270, width: 280, height: 110 },
      { id: "besednice-north-val", x: 720, y: 220, width: 280, height: 92 },
      { id: "besednice-east-val", x: 1110, y: 800, width: 220, height: 120 },
      { id: "besednice-south-pit", x: 620, y: 1020, width: 260, height: 105 },
      { id: "besednice-west-rocks", x: 320, y: 640, width: 150, height: 120 },
      { id: "besednice-central-rocks", x: 980, y: 420, width: 140, height: 105 }
    ]
  },
  slavia: {
    props: [
      { kind: "plaza", x: 960, y: 520, width: 760, height: 460 },
      { kind: "buildingWing", x: 1510, y: 120, width: 230, height: 130 },
      { kind: "buildingWing", x: 1510, y: 850, width: 230, height: 110 },
      { kind: "eventTent", x: 590, y: 160, width: 150, height: 92 },
      { kind: "eventTent", x: 860, y: 850, width: 150, height: 80 },
      { kind: "displayTable", x: 650, y: 650, width: 105, height: 58 },
      { kind: "displayTable", x: 920, y: 470, width: 105, height: 58 },
      { kind: "lamp", x: 560, y: 320, scale: 1.1 }, { kind: "lamp", x: 1280, y: 290, scale: 1.05 },
      { kind: "cityTree", x: 430, y: 270, scale: 1.15 }, { kind: "cityTree", x: 470, y: 930, scale: 1.25 }
    ],
    obstacles: [
      { id: "slavia-north-wing", x: 1510, y: 120, width: 230, height: 130 },
      { id: "slavia-south-wing", x: 1510, y: 850, width: 230, height: 110 },
      { id: "slavia-registration-tent", x: 590, y: 160, width: 150, height: 92 },
      { id: "slavia-exhibit-tent", x: 860, y: 850, width: 150, height: 80 }
    ]
  }
});

export function getLevelEnvironmentLayout(levelId) {
  const layout = LEVEL_ENVIRONMENT_LAYOUTS[levelId];
  if (!layout) throw new Error(`Missing authored environment layout: ${levelId}`);
  return layout;
}

export function createObstacleComponents(obstacle) {
  return {
    transform: { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2, rotation: 0, scale: 1 },
    collider: { shape: "aabb", width: obstacle.width, height: obstacle.height, layer: "obstacle", mask: ["player"] },
    environmentObstacle: { id: obstacle.id }
  };
}

export function resolveCircleMovement({ position, movement, radius, walkable, obstacles }) {
  const minX = walkable.x + radius;
  const maxX = walkable.x + walkable.width - radius;
  const minY = walkable.y + radius;
  const maxY = walkable.y + walkable.height - radius;
  let x = Math.max(minX, Math.min(maxX, position.x + movement.x));
  let y = Math.max(minY, Math.min(maxY, position.y));
  for (const obstacle of obstacles) {
    if (y < obstacle.y - radius || y > obstacle.y + obstacle.height + radius) continue;
    if (x > position.x && position.x <= obstacle.x - radius && x > obstacle.x - radius) x = obstacle.x - radius;
    if (x < position.x && position.x >= obstacle.x + obstacle.width + radius && x < obstacle.x + obstacle.width + radius) x = obstacle.x + obstacle.width + radius;
  }
  y = Math.max(minY, Math.min(maxY, position.y + movement.y));
  for (const obstacle of obstacles) {
    if (x < obstacle.x - radius || x > obstacle.x + obstacle.width + radius) continue;
    if (y > position.y && position.y <= obstacle.y - radius && y > obstacle.y - radius) y = obstacle.y - radius;
    if (y < position.y && position.y >= obstacle.y + obstacle.height + radius && y < obstacle.y + obstacle.height + radius) y = obstacle.y + obstacle.height + radius;
  }
  return { x, y };
}
