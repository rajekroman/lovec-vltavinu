const PALETTE = Object.freeze({
  trunk: 0x5b3b28,
  barkDark: 0x3e2c22,
  spruce: 0x254735,
  spruceLight: 0x386047,
  leaf: 0x3e653f,
  leafLight: 0x66804c,
  moss: 0x607a43,
  grass: 0x667947,
  wet: 0x405662,
  mud: 0x5a4132,
  stone: 0x6f655b,
  stoneLight: 0x9b8c76,
  clay: 0x936044,
  clayLight: 0xb57a50,
  clayDark: 0x6a4536,
  sand: 0xc19b67,
  cityStone: 0xbca98d,
  cityStoneLight: 0xd5c7ae,
  facade: 0xc8af83,
  facadeLight: 0xe0cfaa,
  roof: 0x68463d,
  canvas: 0x426e59,
  canvasLight: 0x679078,
  timber: 0x765038,
  metal: 0x354149,
  glass: 0x7fa1a6,
  lamp: 0xffd58a
});

const materialKey = (color, opacity) => `${color}:${opacity}`;

function material(group, color, opacity = 1) {
  const key = materialKey(color, opacity);
  let value = group.userData.materials.get(key);
  if (!value) {
    value = new group.userData.THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1
    });
    group.userData.materials.set(key, value);
  }
  return value;
}

function addMesh(group, geometry, color, x, y, z, name, opacity = 1) {
  const THREE = group.userData.THREE;
  const mesh = new THREE.Mesh(geometry, material(group, color, opacity));
  mesh.position.set(x, y, z);
  mesh.name = name;
  group.add(mesh);
  return mesh;
}

function addBox(group, { x, y, width, height }, color, zHeight, name, z = zHeight / 2) {
  const THREE = group.userData.THREE;
  return addMesh(group, new THREE.BoxGeometry(width, height, zHeight), color, x + width / 2, y + height / 2, z, name);
}

function addVerticalCylinder(group, { x, y, radius, height, color, name, sides = 7 }) {
  const THREE = group.userData.THREE;
  const mesh = addMesh(group, new THREE.CylinderGeometry(radius * 0.82, radius, height, sides), color, x, y, height / 2, name);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function addVerticalCone(group, { x, y, radius, height, z, color, name, sides = 7 }) {
  const THREE = group.userData.THREE;
  const mesh = addMesh(group, new THREE.ConeGeometry(radius, height, sides), color, x, y, z, name);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function addRock(group, prop, color = PALETTE.stone) {
  const THREE = group.userData.THREE;
  const scale = prop.scale ?? 1;
  const rock = addMesh(group, new THREE.DodecahedronGeometry(25 * scale, 0), color, prop.x, prop.y, 12 * scale, "landscape-rock");
  rock.scale.set(prop.stretchX ?? 1.25, prop.stretchY ?? 0.88, prop.stretchZ ?? 0.62);
  rock.rotation.z = prop.rotation ?? 0;
  return rock;
}

function addDeciduousTree(group, prop, city = false) {
  const THREE = group.userData.THREE;
  const scale = prop.scale ?? 1;
  addVerticalCylinder(group, { x: prop.x, y: prop.y, radius: 8 * scale, height: 45 * scale, color: PALETTE.trunk, name: "tree-trunk" });
  const baseZ = 48 * scale;
  const crownColor = city ? PALETTE.leafLight : PALETTE.leaf;
  for (const [dx, dy, dz, radius] of [[0, 0, 0, 35], [-18, 6, -3, 24], [17, -5, 4, 25]]) {
    const crown = addMesh(group, new THREE.DodecahedronGeometry(radius * scale, 0), crownColor, prop.x + dx * scale, prop.y + dy * scale, baseZ + dz * scale, "tree-crown");
    crown.scale.z = 0.82;
  }
}

function addSpruce(group, prop) {
  const scale = prop.scale ?? 1;
  addVerticalCylinder(group, { x: prop.x, y: prop.y, radius: 6 * scale, height: 42 * scale, color: PALETTE.barkDark, name: "spruce-trunk", sides: 6 });
  addVerticalCone(group, { x: prop.x, y: prop.y, radius: 31 * scale, height: 42 * scale, z: 42 * scale, color: PALETTE.spruce, name: "spruce-lower", sides: 7 });
  addVerticalCone(group, { x: prop.x, y: prop.y, radius: 24 * scale, height: 38 * scale, z: 65 * scale, color: PALETTE.spruceLight, name: "spruce-upper", sides: 7 });
}

function addTreeCluster(group, prop) {
  const points = [
    [0.16, 0.24, 0.9, "spruce"], [0.42, 0.18, 1.02, "tree"], [0.72, 0.25, 0.96, "spruce"],
    [0.26, 0.68, 1.08, "tree"], [0.60, 0.65, 0.92, "spruce"], [0.83, 0.71, 0.84, "tree"]
  ];
  for (const [px, py, scale, type] of points) {
    const tree = { x: prop.x + prop.width * px, y: prop.y + prop.height * py, scale: scale * (prop.scale ?? 1) };
    if (type === "spruce") addSpruce(group, tree); else addDeciduousTree(group, tree);
  }
}

function addHedgerow(group, prop) {
  const THREE = group.userData.THREE;
  const count = Math.max(4, Math.round(prop.width / 55));
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const radius = 24 + (index % 3) * 4;
    const shrub = addMesh(
      group,
      new THREE.DodecahedronGeometry(radius, 0),
      index % 2 ? PALETTE.leaf : PALETTE.leafLight,
      prop.x + 24 + t * Math.max(0, prop.width - 48),
      prop.y + prop.height * (0.42 + (index % 2) * 0.15),
      18,
      "field-hedgerow"
    );
    shrub.scale.set(1.18, 0.88, 0.72);
  }
}

function addPuddle(group, prop) {
  const THREE = group.userData.THREE;
  const radius = Math.max(prop.width, prop.height) / 2;
  const puddle = addMesh(group, new THREE.CircleGeometry(radius, 24), PALETTE.wet, prop.x + prop.width / 2, prop.y + prop.height / 2, 1.1, "rain-puddle", 0.58);
  puddle.scale.set(prop.width / (radius * 2), prop.height / (radius * 2), 1);
}

function addFence(group, prop) {
  const THREE = group.userData.THREE;
  const posts = Math.max(2, Math.floor(prop.width / 70) + 1);
  for (let index = 0; index < posts; index += 1) {
    const x = prop.x + (prop.width * index) / (posts - 1);
    addVerticalCylinder(group, { x, y: prop.y + prop.height / 2, radius: 4, height: 34, color: PALETTE.timber, name: "field-fence-post", sides: 5 });
  }
  const rail = addMesh(group, new THREE.BoxGeometry(prop.width, 5, 7), PALETTE.timber, prop.x + prop.width / 2, prop.y + prop.height / 2, 18, "field-fence-rail");
  rail.rotation.z = prop.rotation ?? 0;
}

function addForestRoot(group, prop) {
  const THREE = group.userData.THREE;
  const root = addMesh(group, new THREE.BoxGeometry(prop.width, prop.height, 10), PALETTE.barkDark, prop.x + prop.width / 2, prop.y + prop.height / 2, 6, "exposed-root");
  root.rotation.z = prop.rotation ?? -0.12;
}

function addSandMound(group, prop) {
  const THREE = group.userData.THREE;
  const scale = prop.scale ?? 1;
  const mound = addMesh(group, new THREE.ConeGeometry(38 * scale, 24 * scale, 7), PALETTE.sand, prop.x, prop.y, 11 * scale, "forest-profile-mound");
  mound.rotation.x = Math.PI / 2;
  mound.scale.z = 0.72;
  addRock(group, { x: prop.x + 28 * scale, y: prop.y + 18 * scale, scale: 0.42 * scale }, PALETTE.stoneLight);
}

function addEmbankment(group, prop) {
  addBox(group, prop, PALETTE.clayDark, 16, "quarry-embankment-base");
  const inset = Math.min(24, prop.height * 0.22);
  addBox(group, { x: prop.x + 12, y: prop.y + inset, width: Math.max(20, prop.width - 24), height: Math.max(18, prop.height - inset * 1.35) }, PALETTE.clay, 31, "quarry-embankment-mid");
  for (let index = 0; index < Math.max(2, Math.floor(prop.width / 95)); index += 1) {
    addRock(group, { x: prop.x + 38 + index * 82, y: prop.y + prop.height * 0.72, scale: 0.52 + (index % 2) * 0.12 }, PALETTE.stoneLight);
  }
}

function addQuarryPit(group, prop) {
  const THREE = group.userData.THREE;
  const radius = Math.max(prop.width, prop.height) / 2;
  const pit = addMesh(group, new THREE.CircleGeometry(radius, 20), PALETTE.clayDark, prop.x + prop.width / 2, prop.y + prop.height / 2, 0.9, "quarry-pit");
  pit.scale.set(prop.width / (radius * 2), prop.height / (radius * 2), 1);
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2;
    addRock(group, {
      x: prop.x + prop.width / 2 + Math.cos(angle) * prop.width * 0.46,
      y: prop.y + prop.height / 2 + Math.sin(angle) * prop.height * 0.46,
      scale: 0.44 + (index % 3) * 0.09
    }, index % 2 ? PALETTE.stone : PALETTE.stoneLight);
  }
}

function addProfileWall(group, prop) {
  const layerHeight = Math.max(16, prop.height / 3);
  const colors = [PALETTE.clayDark, PALETTE.clay, PALETTE.sand];
  colors.forEach((color, index) => addBox(group, {
    x: prop.x,
    y: prop.y + index * layerHeight,
    width: prop.width,
    height: layerHeight + 1
  }, color, 24 + index * 7, `geology-layer-${index}`));
}

function addScrub(group, prop) {
  const THREE = group.userData.THREE;
  const scale = prop.scale ?? 1;
  const bush = addMesh(group, new THREE.DodecahedronGeometry(25 * scale, 0), PALETTE.moss, prop.x, prop.y, 14 * scale, "quarry-scrub");
  bush.scale.set(1.25, 0.9, 0.62);
}

function addPlaza(group, prop) {
  const THREE = group.userData.THREE;
  addBox(group, prop, PALETTE.cityStone, 2, "event-plaza", 0.3);
  const tileCount = Math.min(8, Math.max(3, Math.floor(prop.width / 120)));
  for (let index = 1; index < tileCount; index += 1) {
    const x = prop.x + (prop.width * index) / tileCount;
    addMesh(group, new THREE.BoxGeometry(2, prop.height, 1.5), PALETTE.cityStoneLight, x, prop.y + prop.height / 2, 1.3, "plaza-joint");
  }
}

function addBuildingWing(group, prop) {
  const THREE = group.userData.THREE;
  addBox(group, prop, PALETTE.facade, 62, "kd-slavia-wing");
  const cap = addMesh(group, new THREE.BoxGeometry(prop.width + 10, prop.height + 10, 8), PALETTE.roof, prop.x + prop.width / 2, prop.y + prop.height / 2, 66, "kd-slavia-roof");
  cap.rotation.z = 0;
  const columns = Math.max(2, Math.floor(prop.width / 72));
  for (let index = 0; index < columns; index += 1) {
    const x = prop.x + 26 + (index * Math.max(1, prop.width - 52)) / Math.max(1, columns - 1);
    addVerticalCylinder(group, { x, y: prop.y + 12, radius: 4, height: 50, color: PALETTE.facadeLight, name: "kd-column", sides: 6 });
  }
}

function addEntrance(group, prop) {
  const THREE = group.userData.THREE;
  addBox(group, prop, PALETTE.metal, 16, "kd-entrance-canopy", 48);
  const light = addMesh(group, new THREE.BoxGeometry(prop.width * 0.78, prop.height * 0.72, 2), PALETTE.lamp, prop.x + prop.width / 2, prop.y + prop.height / 2, 8, "entrance-light", 0.46);
  light.scale.z = 1;
}

function addTent(group, prop) {
  const THREE = group.userData.THREE;
  addBox(group, prop, PALETTE.canvas, 18, "event-tent-base");
  const roof = addMesh(group, new THREE.ConeGeometry(Math.max(prop.width, prop.height) * 0.5, 38, 4), PALETTE.canvasLight, prop.x + prop.width / 2, prop.y + prop.height / 2, 38, "event-tent-roof");
  roof.rotation.x = Math.PI / 2;
  roof.rotation.z = Math.PI / 4;
}

function addDisplayTable(group, prop, glass = false) {
  const THREE = group.userData.THREE;
  const topColor = glass ? PALETTE.glass : PALETTE.timber;
  addBox(group, prop, topColor, glass ? 26 : 18, glass ? "mineral-vitrine" : "mineral-table");
  if (glass) {
    const glow = addMesh(group, new THREE.BoxGeometry(prop.width * 0.82, prop.height * 0.7, 2), PALETTE.lamp, prop.x + prop.width / 2, prop.y + prop.height / 2, 28, "vitrine-light", 0.4);
    glow.scale.z = 1;
  }
}

function addLamp(group, prop) {
  const scale = prop.scale ?? 1;
  addVerticalCylinder(group, { x: prop.x, y: prop.y, radius: 3.5, height: 54 * scale, color: PALETTE.metal, name: "plaza-lamp", sides: 6 });
  const THREE = group.userData.THREE;
  addMesh(group, new THREE.OctahedronGeometry(10 * scale, 0), PALETTE.lamp, prop.x, prop.y, 58 * scale, "plaza-lamp-glow");
}

function addBench(group, prop) {
  const THREE = group.userData.THREE;
  addMesh(group, new THREE.BoxGeometry(prop.width, 18, 8), PALETTE.timber, prop.x + prop.width / 2, prop.y + 9, 13, "plaza-bench-seat");
  addMesh(group, new THREE.BoxGeometry(prop.width, 6, 24), PALETTE.timber, prop.x + prop.width / 2, prop.y + 18, 25, "plaza-bench-back");
}

function addJuryDais(group, prop) {
  addBox(group, prop, PALETTE.cityStoneLight, 10, "jury-dais");
  addDisplayTable(group, { x: prop.x + 16, y: prop.y + 10, width: prop.width - 32, height: Math.min(38, prop.height - 16) }, false);
}

export function createAuthoredEnvironment(THREE, props) {
  const group = new THREE.Group();
  group.name = "authored-low-poly-environment";
  group.userData.THREE = THREE;
  group.userData.materials = new Map();

  for (const prop of props) {
    if (prop.kind === "tree" || prop.kind === "cityTree") addDeciduousTree(group, prop, prop.kind === "cityTree");
    else if (prop.kind === "spruce") addSpruce(group, prop);
    else if (prop.kind === "treeCluster") addTreeCluster(group, prop);
    else if (prop.kind === "hedgerow") addHedgerow(group, prop);
    else if (prop.kind === "wetPatch") addPuddle(group, prop);
    else if (prop.kind === "fieldStone" || prop.kind === "rock") addRock(group, prop);
    else if (prop.kind === "rockCluster") {
      addRock(group, { x: prop.x + prop.width * 0.25, y: prop.y + prop.height * 0.36, scale: 1.05 });
      addRock(group, { x: prop.x + prop.width * 0.68, y: prop.y + prop.height * 0.62, scale: 0.78 }, PALETTE.stoneLight);
      addRock(group, { x: prop.x + prop.width * 0.52, y: prop.y + prop.height * 0.25, scale: 0.55 }, PALETTE.stone);
    } else if (prop.kind === "fence") addFence(group, prop);
    else if (prop.kind === "stump") addVerticalCylinder(group, { x: prop.x, y: prop.y, radius: 22 * (prop.scale ?? 1), height: 20 * (prop.scale ?? 1), color: PALETTE.trunk, name: "forest-stump", sides: 7 });
    else if (prop.kind === "root") addForestRoot(group, prop);
    else if (prop.kind === "sandMound") addSandMound(group, prop);
    else if (prop.kind === "embankment") addEmbankment(group, prop);
    else if (prop.kind === "quarryPit") addQuarryPit(group, prop);
    else if (prop.kind === "profileWall") addProfileWall(group, prop);
    else if (prop.kind === "scrub") addScrub(group, prop);
    else if (prop.kind === "plaza") addPlaza(group, prop);
    else if (prop.kind === "buildingWing") addBuildingWing(group, prop);
    else if (prop.kind === "entrance") addEntrance(group, prop);
    else if (prop.kind === "eventTent") addTent(group, prop);
    else if (prop.kind === "displayTable") addDisplayTable(group, prop, false);
    else if (prop.kind === "glassCase") addDisplayTable(group, prop, true);
    else if (prop.kind === "lamp") addLamp(group, prop);
    else if (prop.kind === "bench") addBench(group, prop);
    else if (prop.kind === "juryDais") addJuryDais(group, prop);
  }

  delete group.userData.THREE;
  delete group.userData.materials;
  return group;
}
