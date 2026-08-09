const materials = {
  foliage: 0x31523a, foliageLight: 0x547247, trunk: 0x60422d,
  stone: 0x716454, stoneLight: 0xa38d6c, clay: 0x8d6041,
  sand: 0xb99461, city: 0xc6a66e, canvas: 0x497b62, metal: 0x374248
};

const addMesh = (group, geometry, color, x, y, z, name) => {
  const mesh = new group.userData.THREE.Mesh(geometry, new group.userData.THREE.MeshLambertMaterial({ color, flatShading: true }));
  mesh.position.set(x, y, z);
  mesh.name = name;
  group.add(mesh);
  return mesh;
};

function addTree(group, prop, city = false) {
  const THREE = group.userData.THREE;
  const scale = prop.scale ?? 1;
  addMesh(group, new THREE.CylinderGeometry(9 * scale, 13 * scale, 44 * scale, 6), materials.trunk, prop.x, prop.y, 13 * scale, "tree-trunk");
  const crown = addMesh(group, new THREE.DodecahedronGeometry((city ? 37 : 46) * scale, 0), city ? materials.foliageLight : materials.foliage, prop.x, prop.y, 48 * scale, "tree-crown");
  crown.scale.y = 0.86;
}

function addRock(group, prop) {
  const THREE = group.userData.THREE;
  const scale = prop.scale ?? 1;
  const rock = addMesh(group, new THREE.DodecahedronGeometry(30 * scale, 0), materials.stone, prop.x, prop.y, 14 * scale, "quarry-rock");
  rock.scale.set(1.3, 0.9, 0.7);
}

function addBox(group, prop, color, height, name) {
  const THREE = group.userData.THREE;
  return addMesh(group, new THREE.BoxGeometry(prop.width, prop.height, height), color, prop.x + prop.width / 2, prop.y + prop.height / 2, height / 2, name);
}

function addCluster(group, prop) {
  const positions = [[0.14, 0.2], [0.43, 0.25], [0.72, 0.18], [0.28, 0.66], [0.62, 0.7]];
  for (const [x, y] of positions) addTree(group, { x: prop.x + prop.width * x, y: prop.y + prop.height * y, scale: 0.86 + x * 0.34 });
}

function addTent(group, prop) {
  const THREE = group.userData.THREE;
  addBox(group, prop, materials.canvas, 24, "event-tent");
  const roof = addMesh(group, new THREE.ConeGeometry(Math.max(prop.width, prop.height) * 0.55, 42, 4), 0x2f6351, prop.x + prop.width / 2, prop.y + prop.height / 2, 42, "event-tent-roof");
  roof.rotation.z = Math.PI / 4;
}

export function createAuthoredEnvironment(THREE, props) {
  const group = new THREE.Group();
  group.name = "authored-low-poly-environment";
  group.userData.THREE = THREE;
  for (const prop of props) {
    if (prop.kind === "tree" || prop.kind === "cityTree") addTree(group, prop, prop.kind === "cityTree");
    else if (prop.kind === "treeCluster") addCluster(group, prop);
    else if (prop.kind === "rock" || prop.kind === "fieldStone") addRock(group, prop);
    else if (prop.kind === "rockCluster") {
      addRock(group, { x: prop.x + 35, y: prop.y + 42, scale: 1.1 }); addRock(group, { x: prop.x + 104, y: prop.y + 76, scale: 0.8 });
    } else if (prop.kind === "hedgerow") addBox(group, prop, materials.foliage, 28, "hedgerow");
    else if (prop.kind === "embankment") addBox(group, prop, materials.clay, 38, "clay-embankment");
    else if (prop.kind === "quarryPit" || prop.kind === "wetPatch" || prop.kind === "plaza") addBox(group, prop, prop.kind === "wetPatch" ? 0x4d4032 : prop.kind === "plaza" ? 0x95816c : 0x5e493b, 3, prop.kind);
    else if (prop.kind === "sandMound") {
      const mound = addMesh(group, new THREE.ConeGeometry(42 * prop.scale, 26 * prop.scale, 7), materials.sand, prop.x, prop.y, 12, "sand-profile");
      mound.scale.y = 0.7;
    } else if (prop.kind === "stump") addMesh(group, new THREE.CylinderGeometry(24 * prop.scale, 29 * prop.scale, 25 * prop.scale, 7), materials.trunk, prop.x, prop.y, 12, "forest-stump");
    else if (prop.kind === "root") addBox(group, prop, materials.trunk, 12, "exposed-root");
    else if (prop.kind === "scrub") addMesh(group, new THREE.DodecahedronGeometry(28 * prop.scale, 0), materials.foliage, prop.x, prop.y, 16, "quarry-scrub");
    else if (prop.kind === "buildingWing") addBox(group, prop, materials.city, 72, "kd-slavia-wing");
    else if (prop.kind === "eventTent") addTent(group, prop);
    else if (prop.kind === "displayTable") addBox(group, prop, 0x6f4d35, 20, "mineral-display-table");
    else if (prop.kind === "lamp") {
      addMesh(group, new THREE.CylinderGeometry(4, 5, 55 * prop.scale, 6), materials.metal, prop.x, prop.y, 24, "plaza-lamp");
      addMesh(group, new THREE.OctahedronGeometry(12 * prop.scale, 0), 0xffd88b, prop.x, prop.y, 56 * prop.scale, "plaza-lamp-light");
    }
  }
  delete group.userData.THREE;
  return group;
}
