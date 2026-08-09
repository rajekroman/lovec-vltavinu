const deepFreeze = value => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

// Authored, deterministic environment composition. `obstacleId` links a visible
// ground-contact prop to its serializable gameplay footprint. Soft decoration
// (puddles, scrub and dig mounds) intentionally has no collider.
export const LEVEL_ENVIRONMENT_LAYOUTS = deepFreeze({
  chlum: {
    props: [
      { kind: "hedgerow", x: 180, y: 120, width: 320, height: 76, obstacleId: "chlum-north-remizek" },
      { kind: "hedgerow", x: 1180, y: 140, width: 300, height: 80, obstacleId: "chlum-east-remizek" },
      { kind: "tree", x: 157, y: 999, scale: 1.08, obstacleId: "chlum-west-tree" },
      { kind: "tree", x: 1442, y: 972, scale: 1.28, obstacleId: "chlum-east-tree" },
      { kind: "externalModel", assetId: "model-chlum-field-fence-segment", x: 310, y: 300, obstacleId: "chlum-fence-a" },
      { kind: "externalModel", assetId: "model-chlum-field-fence-segment", x: 570, y: 300, obstacleId: "chlum-fence-b" },
      { kind: "externalModel", assetId: "model-chlum-hay-bale", x: 1270, y: 930, obstacleId: "chlum-hay-a" },
      { kind: "externalModel", assetId: "model-chlum-hay-bale", x: 1360, y: 860, obstacleId: "chlum-hay-b" },
      { kind: "wetPatch", x: 650, y: 790, width: 255, height: 92 },
      { kind: "wetPatch", x: 1085, y: 480, width: 170, height: 68 },
      { kind: "wetPatch", x: 420, y: 640, width: 135, height: 48 },
      { kind: "fieldStone", x: 835, y: 1010, scale: 0.78 },
      { kind: "fieldStone", x: 1490, y: 690, scale: 0.58 }
    ],
    obstacles: [
      { id: "chlum-north-remizek", x: 180, y: 120, width: 320, height: 76 },
      { id: "chlum-east-remizek", x: 1180, y: 140, width: 300, height: 80 },
      { id: "chlum-west-tree", x: 120, y: 960, width: 74, height: 78 },
      { id: "chlum-east-tree", x: 1400, y: 930, width: 84, height: 88 },
      { id: "chlum-fence-a", x: 242, y: 288, width: 136, height: 24 },
      { id: "chlum-fence-b", x: 502, y: 288, width: 136, height: 24 },
      { id: "chlum-hay-a", x: 1238, y: 897, width: 64, height: 64 },
      { id: "chlum-hay-b", x: 1330, y: 830, width: 60, height: 60 }
    ]
  },
  nesmen: {
    props: [
      { kind: "treeCluster", x: 120, y: 520, width: 110, height: 230, obstacleId: "nesmen-west-growth" },
      { kind: "treeCluster", x: 760, y: 150, width: 180, height: 95, obstacleId: "nesmen-north-mid-growth" },
      { kind: "treeCluster", x: 1080, y: 150, width: 250, height: 95, obstacleId: "nesmen-north-east-growth" },
      { kind: "treeCluster", x: 1260, y: 650, width: 105, height: 300, obstacleId: "nesmen-east-growth" },
      { kind: "treeCluster", x: 720, y: 965, width: 250, height: 90, obstacleId: "nesmen-south-growth" },
      { kind: "tree", x: 466, y: 336, scale: 1.45, obstacleId: "nesmen-landmark-tree" },
      { kind: "root", x: 520, y: 790, width: 145, height: 30, rotation: -0.16, obstacleId: "nesmen-root" },
      { kind: "stump", x: 455, y: 735, scale: 0.88, obstacleId: "nesmen-stump-west" },
      { kind: "stump", x: 1130, y: 530, scale: 0.94, obstacleId: "nesmen-stump-east" },
      { kind: "sandMound", x: 610, y: 430, scale: 1.0 },
      { kind: "sandMound", x: 930, y: 690, scale: 1.0 },
      { kind: "sandMound", x: 1210, y: 360, scale: 1.0 },
      { kind: "rock", x: 845, y: 315, scale: 0.62 },
      { kind: "rock", x: 1045, y: 915, scale: 0.55 }
    ],
    obstacles: [
      { id: "nesmen-west-growth", x: 120, y: 520, width: 110, height: 230 },
      { id: "nesmen-north-mid-growth", x: 760, y: 150, width: 180, height: 95 },
      { id: "nesmen-north-east-growth", x: 1080, y: 150, width: 250, height: 95 },
      { id: "nesmen-east-growth", x: 1260, y: 650, width: 105, height: 300 },
      { id: "nesmen-south-growth", x: 720, y: 965, width: 250, height: 90 },
      { id: "nesmen-landmark-tree", x: 430, y: 300, width: 72, height: 72 },
      { id: "nesmen-root", x: 520, y: 790, width: 145, height: 30 },
      { id: "nesmen-stump-west", x: 433, y: 713, width: 44, height: 44 },
      { id: "nesmen-stump-east", x: 1107, y: 507, width: 46, height: 46 }
    ]
  },
  besednice: {
    props: [
      { kind: "embankment", x: 170, y: 240, width: 280, height: 95, obstacleId: "besednice-north-west-val" },
      { kind: "embankment", x: 590, y: 190, width: 280, height: 88, obstacleId: "besednice-north-val" },
      { kind: "profileWall", x: 1510, y: 180, width: 90, height: 160, obstacleId: "besednice-hedgehog-wall" },
      { kind: "rockCluster", x: 280, y: 600, width: 125, height: 120, obstacleId: "besednice-west-rocks" },
      { kind: "quarryPit", x: 560, y: 700, width: 220, height: 105, obstacleId: "besednice-mid-pit" },
      { kind: "quarryPit", x: 720, y: 1060, width: 260, height: 70, obstacleId: "besednice-south-pit" },
      { kind: "embankment", x: 1250, y: 620, width: 175, height: 110, obstacleId: "besednice-east-val" },
      { kind: "rockCluster", x: 1010, y: 480, width: 120, height: 100, obstacleId: "besednice-central-rocks" },
      { kind: "rock", x: 1380, y: 710, scale: 1.12, obstacleId: "besednice-east-rock" },
      { kind: "scrub", x: 170, y: 400, scale: 1.05 },
      { kind: "scrub", x: 1540, y: 1080, scale: 1.2 },
      { kind: "scrub", x: 1120, y: 1090, scale: 0.86 },
      { kind: "rock", x: 560, y: 450, scale: 0.58 },
      { kind: "rock", x: 1220, y: 1030, scale: 0.64 }
    ],
    obstacles: [
      { id: "besednice-north-west-val", x: 170, y: 240, width: 280, height: 95 },
      { id: "besednice-north-val", x: 590, y: 190, width: 280, height: 88 },
      { id: "besednice-hedgehog-wall", x: 1510, y: 180, width: 90, height: 160 },
      { id: "besednice-west-rocks", x: 280, y: 600, width: 125, height: 120 },
      { id: "besednice-mid-pit", x: 560, y: 700, width: 220, height: 105 },
      { id: "besednice-south-pit", x: 720, y: 1060, width: 260, height: 70 },
      { id: "besednice-east-val", x: 1250, y: 620, width: 175, height: 110 },
      { id: "besednice-central-rocks", x: 1010, y: 480, width: 120, height: 100 },
      { id: "besednice-east-rock", x: 1348, y: 678, width: 64, height: 64 }
    ]
  },
  slavia: {
    props: [
      { kind: "plaza", x: 470, y: 190, width: 1030, height: 720 },
      { kind: "buildingWing", x: 1540, y: 120, width: 220, height: 270, obstacleId: "slavia-north-wing" },
      { kind: "buildingWing", x: 1540, y: 650, width: 220, height: 270, obstacleId: "slavia-south-wing" },
      { kind: "entrance", x: 1555, y: 455, width: 195, height: 115 },
      { kind: "eventTent", x: 570, y: 180, width: 150, height: 86, obstacleId: "slavia-registration-tent" },
      { kind: "eventTent", x: 860, y: 835, width: 150, height: 80, obstacleId: "slavia-exhibit-tent" },
      { kind: "displayTable", x: 610, y: 625, width: 105, height: 56, obstacleId: "slavia-table-a" },
      { kind: "displayTable", x: 930, y: 510, width: 105, height: 56, obstacleId: "slavia-table-b" },
      { kind: "glassCase", x: 1180, y: 620, width: 110, height: 60, obstacleId: "slavia-vitrine" },
      { kind: "juryDais", x: 1320, y: 350, width: 95, height: 50, obstacleId: "slavia-jury-dais" },
      { kind: "cityTree", x: 425, y: 215, scale: 1.0, obstacleId: "slavia-city-tree-north" },
      { kind: "cityTree", x: 458, y: 978, scale: 1.08, obstacleId: "slavia-city-tree-south" },
      { kind: "bench", x: 730, y: 210, width: 92, height: 26, obstacleId: "slavia-bench" },
      { kind: "lamp", x: 535, y: 330, scale: 1.05 },
      { kind: "lamp", x: 1280, y: 275, scale: 1.05 },
      { kind: "lamp", x: 1340, y: 860, scale: 1.0 }
    ],
    obstacles: [
      { id: "slavia-north-wing", x: 1540, y: 120, width: 220, height: 270 },
      { id: "slavia-south-wing", x: 1540, y: 650, width: 220, height: 270 },
      { id: "slavia-registration-tent", x: 570, y: 180, width: 150, height: 86 },
      { id: "slavia-exhibit-tent", x: 860, y: 835, width: 150, height: 80 },
      { id: "slavia-table-a", x: 610, y: 625, width: 105, height: 56 },
      { id: "slavia-table-b", x: 930, y: 510, width: 105, height: 56 },
      { id: "slavia-vitrine", x: 1180, y: 620, width: 110, height: 60 },
      { id: "slavia-jury-dais", x: 1320, y: 350, width: 95, height: 50 },
      { id: "slavia-city-tree-north", x: 390, y: 180, width: 70, height: 70 },
      { id: "slavia-city-tree-south", x: 420, y: 940, width: 78, height: 78 },
      { id: "slavia-bench", x: 730, y: 210, width: 92, height: 26 }
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

export function pointBlockedByObstacle(point, obstacle, radius = 28) {
  return point.x > obstacle.x - radius && point.x < obstacle.x + obstacle.width + radius &&
    point.y > obstacle.y - radius && point.y < obstacle.y + obstacle.height + radius;
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
