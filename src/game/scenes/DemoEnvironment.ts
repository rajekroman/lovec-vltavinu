import * as THREE from "three";
import type { CollisionWorld } from "../../engine/collision/CollisionWorld";
import { CollisionLayer } from "../components/ColliderComponent";
import type { MoldaviteQuality } from "../mechanics/Moldavite";
import type { LevelId } from "../levels/LevelData";
export type { MoldaviteQuality } from "../mechanics/Moldavite";

export interface LevelEnvironment {
  playerSpawn: readonly [number, number, number];
}

export type ModelProvider = (assetId: string) => THREE.Object3D | undefined;

const TREE_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [-13, -11],
  [-15, 1],
  [-12, 13],
  [13, -13],
  [15, -2],
  [12, 12],
  [-4, -15],
  [5, 15],
];

export function buildDemoEnvironment(
  scene: THREE.Scene,
  collisionWorld: CollisionWorld,
): void {
  scene.background = new THREE.Color(0x9ca88e);
  scene.fog = new THREE.Fog(0x9ca88e, 24, 48);

  const hemisphere = new THREE.HemisphereLight(0xdce3d2, 0x4b3b29, 2.1);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xfff3d2, 2.8);
  sun.position.set(-9, 17, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  const groundGeometry = new THREE.PlaneGeometry(42, 42, 28, 28);
  const positionAttribute = groundGeometry.getAttribute("position");

  for (let index = 0; index < positionAttribute.count; index += 1) {
    const x = positionAttribute.getX(index);
    const y = positionAttribute.getY(index);
    const height = Math.sin(x * 0.42) * 0.055 + Math.cos(y * 0.31) * 0.045;
    positionAttribute.setZ(index, height);
  }

  groundGeometry.computeVertexNormals();
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x716747,
    roughness: 0.96,
    metalness: 0,
    flatShading: true,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  addFieldRows(scene);

  TREE_POSITIONS.forEach(([x, z], index) => {
    const tree = createTree(index);
    tree.position.set(x, 0, z);
    scene.add(tree);

    collisionWorld.addStatic({
      id: `tree-${index}`,
      layer: CollisionLayer.WORLD,
      mask: CollisionLayer.PLAYER | CollisionLayer.NPC | CollisionLayer.HAZARD,
      minX: x - 0.68,
      maxX: x + 0.68,
      minZ: z - 0.68,
      maxZ: z + 0.68,
    });
  });

  addStones(scene, collisionWorld);
}

export function buildLevelEnvironment(
  scene: THREE.Scene,
  collisionWorld: CollisionWorld,
  levelId: LevelId,
  modelProvider?: ModelProvider,
): LevelEnvironment {
  switch (levelId) {
    case "chlum":
      buildDemoEnvironment(scene, collisionWorld);
      return { playerSpawn: [0, 0, 6] };
    case "nesmen":
      buildForestEnvironment(scene, collisionWorld);
      return { playerSpawn: [-13, 0, 13] };
    case "besednice":
      buildMiningEnvironment(scene, collisionWorld, modelProvider);
      return { playerSpawn: [-15, 0, 13] };
    case "slavia":
      buildSlaviaEnvironment(scene, collisionWorld, modelProvider);
      return { playerSpawn: [-15, 0, 13] };
  }
}

function buildForestEnvironment(
  scene: THREE.Scene,
  collisionWorld: CollisionWorld,
): void {
  buildBaseEnvironment(scene, 0x71816b, 0x46533f, 0x30412f);

  const positions: ReadonlyArray<readonly [number, number]> = [
    [-14, -13], [-8, -15], [0, -14], [10, -14], [15, -9],
    [-16, -3], [-9, -2], [1, -4], [9, -2], [16, 1],
    [-15, 8], [-7, 7], [2, 9], [10, 7], [15, 12],
  ];

  positions.forEach(([x, z], index) => {
    const tree = createTree(index + 4);
    tree.scale.setScalar(0.92 + (index % 3) * 0.1);
    tree.position.set(x, 0, z);
    scene.add(tree);
    collisionWorld.addStatic({
      id: `forest-tree-${index}`,
      layer: CollisionLayer.WORLD,
      mask: CollisionLayer.PLAYER | CollisionLayer.NPC | CollisionLayer.HAZARD,
      minX: x - 0.7,
      maxX: x + 0.7,
      minZ: z - 0.7,
      maxZ: z + 0.7,
    });
  });

  addForestFloor(scene);
  addCabin(scene, -14, 12, 0.1);
  addLogPile(scene, 9, 12, -0.22);
}

function buildMiningEnvironment(
  scene: THREE.Scene,
  collisionWorld: CollisionWorld,
  modelProvider?: ModelProvider,
): void {
  buildBaseEnvironment(scene, 0x9c8f74, 0x685540, 0x584534);
  addMiningBanks(scene);
  addExcavator(scene, 10, -9, modelProvider);
  addMineFence(scene, collisionWorld);
  addMiningRocks(scene, collisionWorld);
}

function buildSlaviaEnvironment(
  scene: THREE.Scene,
  collisionWorld: CollisionWorld,
  modelProvider?: ModelProvider,
): void {
  buildBaseEnvironment(scene, 0x839199, 0x5c675f, 0x394a42);
  addRiver(scene);
  addSlaviaBuilding(scene, 7, -7, modelProvider);
  addEventStalls(scene);
  collisionWorld.addStatic({
    id: "slavia-building",
    layer: CollisionLayer.WORLD,
    mask: CollisionLayer.PLAYER | CollisionLayer.NPC | CollisionLayer.HAZARD,
    minX: 2,
    maxX: 16,
    minZ: -12,
    maxZ: -4,
  });
}

function buildBaseEnvironment(
  scene: THREE.Scene,
  background: number,
  groundColor: number,
  accentColor: number,
): void {
  scene.background = new THREE.Color(background);
  scene.fog = new THREE.Fog(background, 24, 48);

  const hemisphere = new THREE.HemisphereLight(0xdce3d2, 0x4b3b29, 2.1);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xfff3d2, 2.8);
  sun.position.set(-9, 17, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 42, 28, 28),
    new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.96,
      metalness: 0,
      flatShading: true,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const border = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 0.24),
    new THREE.MeshBasicMaterial({ color: accentColor }),
  );
  border.rotation.x = -Math.PI / 2;
  border.position.set(0, 0.025, -20.4);
  scene.add(border);
}

export function createSurveyMarker(): THREE.Group {
  const group = new THREE.Group();

  const zoneMaterial = new THREE.MeshBasicMaterial({
    color: 0xd8bd64,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const zone = new THREE.Mesh(new THREE.CircleGeometry(0.92, 24), zoneMaterial);
  zone.rotation.x = -Math.PI / 2;
  zone.position.y = 0.035;
  group.add(zone);

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xd3ae43,
    emissive: 0x493914,
    emissiveIntensity: 0.9,
    roughness: 0.55,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.045, 6, 28), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.07;
  group.add(ring);

  const stakeMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b7637,
    roughness: 0.9,
    flatShading: true,
  });

  for (const [x, z] of [
    [-0.62, -0.62],
    [0.62, -0.62],
    [0.62, 0.62],
    [-0.62, 0.62],
  ] as const) {
    const stake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.055, 0.65, 5),
      stakeMaterial,
    );
    stake.position.set(x, 0.31, z);
    stake.castShadow = true;
    group.add(stake);
  }

  return group;
}

export function createDigHole(
  collectibleTexture?: THREE.Texture,
  quality: MoldaviteQuality = "C",
): THREE.Group {
  const group = new THREE.Group();
  const hollowMaterial = new THREE.MeshBasicMaterial({
    color: 0x17150f,
    side: THREE.DoubleSide,
  });
  const hollow = new THREE.Mesh(new THREE.CircleGeometry(0.78, 11), hollowMaterial);
  hollow.name = "dig-hole-hollow";
  hollow.rotation.x = -Math.PI / 2;
  hollow.position.y = 0.042;
  hollow.scale.set(1.1, 0.82, 1);
  group.add(hollow);

  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3524,
    roughness: 1,
    flatShading: true,
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.13, 5, 13), soilMaterial);
  rim.name = "dig-hole-rim";
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.075;
  rim.scale.set(1.1, 0.82, 1);
  rim.castShadow = true;
  group.add(rim);

  const clods = new THREE.Group();
  clods.name = "dig-hole-clods";
  group.add(clods);

  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2 + 0.18;
    const clod = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.13 + (index % 3) * 0.025, 0),
      soilMaterial,
    );
    clod.position.set(
      Math.cos(angle) * (0.88 + (index % 2) * 0.08),
      0.12,
      Math.sin(angle) * (0.68 + ((index + 1) % 2) * 0.08),
    );
    clod.scale.y = 0.72;
    clod.rotation.set(index * 0.31, index * 0.71, index * 0.19);
    clod.castShadow = true;
    clods.add(clod);
  }

  const dust = new THREE.Group();
  dust.name = "dig-reveal-dust";
  dust.visible = false;
  for (let index = 0; index < 6; index += 1) {
    const dustMaterial = new THREE.MeshBasicMaterial({
      color: index % 2 === 0 ? 0xa78b61 : 0x786047,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mote = new THREE.Mesh(
      new THREE.CircleGeometry(0.045 + (index % 3) * 0.018, 6),
      dustMaterial,
    );
    mote.name = `dig-reveal-dust-${index}`;
    mote.rotation.x = -Math.PI / 2;
    mote.position.y = 0.095;
    dust.add(mote);
  }
  group.add(dust);

  if (collectibleTexture) {
    const map = collectibleTexture.clone();
    map.needsUpdate = true;
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: true,
        toneMapped: false,
      }),
    );
    sprite.name = "moldavite-reward";
    sprite.center.set(0.5, 0.06);
    const scaleByQuality: Record<MoldaviteQuality, number> = {
      A: 0.86,
      B: 0.76,
      C: 0.66,
    };
    const scale = scaleByQuality[quality];
    sprite.scale.set(scale, scale, 1);
    sprite.position.set(0.08, 0.16, -0.04);
    sprite.renderOrder = 5;
    sprite.visible = false;
    sprite.userData.revealBaseScale = sprite.scale.clone();
    sprite.userData.revealBaseY = sprite.position.y;
    group.add(sprite);
  } else {
    const moldaviteMaterial = new THREE.MeshStandardMaterial({
      color: 0x315f35,
      emissive: 0x0d2a12,
      emissiveIntensity: 0.8,
      roughness: 0.52,
      metalness: 0.04,
      flatShading: true,
    });
    const moldavite = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.19, 1),
      moldaviteMaterial,
    );
    moldavite.name = "moldavite-reward";
    moldavite.position.set(0.08, 0.13, -0.04);
    moldavite.scale.set(0.72, 0.34, 1.08);
    moldavite.rotation.set(0.5, 0.9, -0.2);
    moldavite.castShadow = true;
    moldavite.visible = false;
    moldavite.userData.revealBaseScale = moldavite.scale.clone();
    moldavite.userData.revealBaseY = moldavite.position.y;
    group.add(moldavite);
  }

  return group;
}

export function createExitMarker(): THREE.Group {
  const group = new THREE.Group();
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x9bc4a1,
    emissive: 0x183d25,
    emissiveIntensity: 0.8,
    roughness: 0.6,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.07, 6, 24), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  group.add(ring);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.13, 0.72, 6),
    new THREE.MeshStandardMaterial({ color: 0xd4b866, emissive: 0x513f13, emissiveIntensity: 0.9 }),
  );
  beacon.position.y = 0.36;
  group.add(beacon);
  return group;
}

export type HazardVisual = "tractor" | "boar" | "rockfall" | "city-cart";

/**
 * Textured billboard used for the Chlum tractor hazard.
 * The source is a single AI-produced cutout with a visible driver; the
 * procedural variants below remain deliberately low-poly for the other levels.
 */
export function createTractorHazardVisual(
  texture: THREE.Texture,
  model?: THREE.Object3D,
): THREE.Group {
  const group = new THREE.Group();
  if (model) {
    model.scale.setScalar(1.05);
    model.position.y = 0.02;
    markModelForShadows(model);
    group.add(model);
  } else {
    const map = texture.clone();
    map.needsUpdate = true;
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: true,
        toneMapped: false,
      }),
    );
    sprite.center.set(0.5, 0.06);
    sprite.scale.set(3.85, 3.85, 1);
    sprite.position.y = 0.04;
    sprite.renderOrder = 4;
    group.add(sprite);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 20),
    new THREE.MeshBasicMaterial({
      color: 0x11130f,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  shadow.scale.set(1.18, 0.54, 1);
  group.add(shadow);

  return group;
}

export function createHazardVisual(kind: HazardVisual): THREE.Group {
  const group = new THREE.Group();

  if (kind === "tractor") {
    const red = new THREE.MeshStandardMaterial({ color: 0x9b4436, roughness: 0.84, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x242b26, roughness: 0.95, flatShading: true });
    const body = new THREE.Mesh(createChamferedBlockGeometry(1.75, 0.62, 1.12, 0.12), red);
    body.position.y = 0.55;
    group.add(body);
    const cabin = new THREE.Mesh(createChamferedBlockGeometry(0.82, 0.9, 0.92, 0.1), red);
    cabin.position.set(0.36, 1.18, 0);
    group.add(cabin);
    const hood = new THREE.Mesh(createChamferedBlockGeometry(0.62, 0.35, 0.98, 0.07), red);
    hood.position.set(-0.7, 0.73, 0);
    group.add(hood);
    for (const z of [-0.58, 0.58]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.18, 10), dark);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(0.38, 0.36, z);
      group.add(wheel);
    }
  } else if (kind === "boar") {
    const hide = new THREE.MeshStandardMaterial({ color: 0x5f4a3d, roughness: 1, flatShading: true });
    const snout = new THREE.MeshStandardMaterial({ color: 0x9a7768, roughness: 0.98, flatShading: true });
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), hide);
    body.scale.set(1.25, 0.75, 0.72);
    body.position.y = 0.7;
    group.add(body);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), hide);
    head.position.set(-0.82, 0.78, 0);
    group.add(head);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 5), snout);
    nose.scale.set(1.2, 0.8, 0.7);
    nose.position.set(-1.15, 0.7, 0);
    group.add(nose);
    for (const x of [-0.5, 0.42]) {
      for (const z of [-0.38, 0.38]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.52, 6), hide);
        leg.position.set(x, 0.3, z);
        group.add(leg);
      }
    }
  } else if (kind === "rockfall") {
    const rock = new THREE.MeshStandardMaterial({ color: 0x514d47, roughness: 1, flatShading: true });
    for (let index = 0; index < 4; index += 1) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + index * 0.08, 0), rock);
      stone.position.set((index - 1.5) * 0.33, 0.32 + (index % 2) * 0.24, (index % 2) * 0.22);
      stone.rotation.set(index * 0.31, index * 0.54, index * 0.17);
      group.add(stone);
    }
  } else {
    const cart = new THREE.MeshStandardMaterial({ color: 0x5d766c, roughness: 0.9, flatShading: true });
    const body = new THREE.Mesh(createChamferedBlockGeometry(1.25, 0.62, 0.72, 0.1), cart);
    body.position.y = 0.55;
    group.add(body);
    const sign = new THREE.Mesh(createChamferedBlockGeometry(0.75, 0.6, 0.05, 0.02), new THREE.MeshStandardMaterial({ color: 0xd2b767, roughness: 0.78 }));
    sign.position.set(0, 1.1, 0);
    group.add(sign);
    for (const z of [-0.42, 0.42]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0x262a25, roughness: 1 }));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(0, 0.25, z);
      group.add(wheel);
    }
  }

  group.traverse((node) => {
    if (node instanceof THREE.Mesh) node.castShadow = true;
  });
  return group;
}

/**
 * A small faceted block for props that need a straight silhouette without
 * looking like an unlit cube. The chamfered footprint and one-segment bevel
 * keep the serious low-poly art direction while avoiding sharp box primitives.
 */
function createChamferedBlockGeometry(
  width: number,
  height: number,
  depth: number,
  cornerRadius: number,
): THREE.ExtrudeGeometry {
  const radius = Math.min(cornerRadius, width / 2, depth / 2);
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const shape = new THREE.Shape();

  shape.moveTo(-halfWidth + radius, -halfDepth);
  shape.lineTo(halfWidth - radius, -halfDepth);
  shape.lineTo(halfWidth, -halfDepth + radius);
  shape.lineTo(halfWidth, halfDepth - radius);
  shape.lineTo(halfWidth - radius, halfDepth);
  shape.lineTo(-halfWidth + radius, halfDepth);
  shape.lineTo(-halfWidth, halfDepth - radius);
  shape.lineTo(-halfWidth, -halfDepth + radius);
  shape.closePath();

  const bevelSize = Math.min(radius * 0.35, height * 0.08);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: bevelSize > 0,
    bevelSegments: 1,
    bevelSize,
    bevelThickness: bevelSize,
    curveSegments: 1,
  });

  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height / 2, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function addForestFloor(scene: THREE.Scene): void {
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x394a35,
    roughness: 1,
    flatShading: true,
  });

  for (let index = 0; index < 34; index += 1) {
    const leaf = new THREE.Mesh(
      new THREE.CircleGeometry(0.12 + (index % 3) * 0.05, 5),
      leafMaterial,
    );
    leaf.rotation.x = -Math.PI / 2;
    leaf.position.set(-18 + ((index * 19) % 35), 0.03, -17 + ((index * 11) % 34));
    scene.add(leaf);
  }
}

function addCabin(scene: THREE.Scene, x: number, z: number, rotation: number): void {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6d4d34, roughness: 0.96, flatShading: true });
  const roof = new THREE.MeshStandardMaterial({ color: 0x293228, roughness: 1, flatShading: true });
  const body = new THREE.Mesh(createChamferedBlockGeometry(3.6, 2.1, 2.8, 0.22), wood);
  body.position.y = 1.05;
  group.add(body);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.45, 1.3, 4), roof);
  cap.position.y = 2.72;
  cap.rotation.y = Math.PI / 4;
  group.add(cap);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.traverse((node) => {
    if (node instanceof THREE.Mesh) node.castShadow = true;
  });
  scene.add(group);
}

function addLogPile(scene: THREE.Scene, x: number, z: number, rotation: number): void {
  const material = new THREE.MeshStandardMaterial({ color: 0x6e5035, roughness: 1, flatShading: true });
  for (let index = 0; index < 5; index += 1) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 2.3, 8), material);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = rotation;
    log.position.set(x + (index % 2) * 0.15, 0.31 + Math.floor(index / 2) * 0.42, z + (index % 3) * 0.16);
    log.castShadow = true;
    scene.add(log);
  }
}

function addMiningBanks(scene: THREE.Scene): void {
  const bankMaterial = new THREE.MeshStandardMaterial({ color: 0x765f44, roughness: 1, flatShading: true });
  const bankPositions: ReadonlyArray<readonly [number, number, number]> = [
    [-8, -7, 0.8], [0, -10, 1.2], [10, 7, 0.9], [-11, 8, 0.7],
  ];
  bankPositions.forEach(([x, z, scale]) => {
    const bank = new THREE.Mesh(new THREE.ConeGeometry(2.4 * scale, 1.6 * scale, 7), bankMaterial);
    bank.scale.z = 0.62;
    bank.position.set(x, 0.8 * scale, z);
    bank.rotation.y = x * 0.17;
    bank.castShadow = true;
    scene.add(bank);
  });
}

function addExcavator(
  scene: THREE.Scene,
  x: number,
  z: number,
  modelProvider?: ModelProvider,
): void {
  if (modelProvider) {
    const model = modelProvider("model.environment.excavator");
    if (model) {
      model.position.set(x, 0, z);
      model.rotation.y = -0.42;
      model.scale.setScalar(1.05);
      markModelForShadows(model);
      scene.add(model);
      return;
    }
  }

  const group = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: 0xb88732, roughness: 0.85, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2d322d, roughness: 0.95, flatShading: true });
  const base = new THREE.Mesh(createChamferedBlockGeometry(2.8, 0.42, 1.5, 0.08), dark);
  base.position.y = 0.25;
  group.add(base);
  const cabin = new THREE.Mesh(createChamferedBlockGeometry(1.05, 1.05, 1.1, 0.13), yellow);
  cabin.position.set(0.45, 0.95, 0);
  group.add(cabin);
  const arm = new THREE.Mesh(createChamferedBlockGeometry(2.25, 0.28, 0.3, 0.05), yellow);
  arm.position.set(-1.2, 1.15, 0);
  arm.rotation.z = -0.34;
  group.add(arm);
  const bucket = new THREE.Mesh(createChamferedBlockGeometry(0.68, 0.48, 0.78, 0.08), yellow);
  bucket.position.set(-2.25, 0.55, 0);
  bucket.rotation.z = 0.28;
  group.add(bucket);
  group.position.set(x, 0, z);
  group.rotation.y = -0.42;
  group.traverse((node) => {
    if (node instanceof THREE.Mesh) node.castShadow = true;
  });
  scene.add(group);
}

function addMineFence(scene: THREE.Scene, collisionWorld: CollisionWorld): void {
  const material = new THREE.MeshStandardMaterial({ color: 0x4b3e2f, roughness: 1, flatShading: true });
  for (let index = 0; index < 7; index += 1) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.1, 5), material);
    post.position.set(-16 + index * 1.8, 0.55, -2.8);
    post.castShadow = true;
    scene.add(post);
  }
  const rail = new THREE.Mesh(createChamferedBlockGeometry(11, 0.12, 0.12, 0.03), material);
  rail.position.set(-10.6, 0.78, -2.8);
  scene.add(rail);
  collisionWorld.addStatic({
    id: "mine-fence",
    layer: CollisionLayer.WORLD,
    mask: CollisionLayer.PLAYER | CollisionLayer.NPC | CollisionLayer.HAZARD,
    minX: -16.4,
    maxX: -4.7,
    minZ: -2.95,
    maxZ: -2.65,
  });
}

function addMiningRocks(scene: THREE.Scene, collisionWorld: CollisionWorld): void {
  const material = new THREE.MeshStandardMaterial({ color: 0x554d43, roughness: 0.98, flatShading: true });
  for (let index = 0; index < 13; index += 1) {
    const size = 0.3 + (index % 4) * 0.1;
    const x = -17 + ((index * 23) % 34);
    const z = -15 + ((index * 13) % 30);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), material);
    rock.position.set(x, size * 0.42, z);
    rock.scale.y = 0.7;
    rock.castShadow = true;
    scene.add(rock);
    collisionWorld.addStatic({
      id: `mine-rock-${index}`,
      layer: CollisionLayer.WORLD,
      mask: CollisionLayer.PLAYER | CollisionLayer.NPC | CollisionLayer.HAZARD,
      minX: x - size * 0.65,
      maxX: x + size * 0.65,
      minZ: z - size * 0.65,
      maxZ: z + size * 0.65,
    });
  }
}

function addRiver(scene: THREE.Scene): void {
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 40),
    new THREE.MeshStandardMaterial({ color: 0x355d6b, roughness: 0.22, metalness: 0.05, transparent: true, opacity: 0.88 }),
  );
  river.rotation.x = -Math.PI / 2;
  river.position.set(-9.6, 0.035, 0);
  scene.add(river);
  for (let index = 0; index < 7; index += 1) {
    const bank = new THREE.Mesh(createChamferedBlockGeometry(0.36, 0.08, 4.2, 0.025), new THREE.MeshStandardMaterial({ color: 0xc1ae86, roughness: 1 }));
    bank.position.set(-6.25, 0.06, -16 + index * 5.2);
    scene.add(bank);
  }
}

function addSlaviaBuilding(
  scene: THREE.Scene,
  x: number,
  z: number,
  modelProvider?: ModelProvider,
): void {
  if (modelProvider) {
    const model = modelProvider("model.environment.slavia");
    if (model) {
      model.position.set(x, 0, z);
      model.rotation.y = 0.12;
      model.scale.setScalar(1);
      markModelForShadows(model);
      scene.add(model);
      return;
    }
  }

  const group = new THREE.Group();
  const facade = new THREE.MeshStandardMaterial({ color: 0xbab9ad, roughness: 0.9, flatShading: true });
  const roof = new THREE.MeshStandardMaterial({ color: 0x403936, roughness: 0.95, flatShading: true });
  const glass = new THREE.MeshStandardMaterial({ color: 0x6d9aa0, roughness: 0.25, metalness: 0.08, transparent: true, opacity: 0.86 });
  const historic = new THREE.Mesh(createChamferedBlockGeometry(9, 4.4, 4.2, 0.28), facade);
  historic.position.y = 2.2;
  group.add(historic);
  const pediment = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.1, 3), roof);
  pediment.rotation.y = Math.PI / 2;
  pediment.position.set(0, 5.45, 0);
  group.add(pediment);
  const annex = new THREE.Mesh(createChamferedBlockGeometry(5.2, 3.5, 4.8, 0.24), glass);
  annex.position.set(6.5, 1.75, 0.35);
  group.add(annex);
  group.position.set(x, 0, z);
  group.rotation.y = 0.12;
  group.traverse((node) => {
    if (node instanceof THREE.Mesh) node.castShadow = true;
  });
  scene.add(group);
}

function markModelForShadows(model: THREE.Object3D): void {
  model.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
}

function addEventStalls(scene: THREE.Scene): void {
  const colors = [0x8d5846, 0x526f59, 0x9c7b44];
  colors.forEach((color, index) => {
    const stall = new THREE.Group();
    const top = new THREE.Mesh(createChamferedBlockGeometry(2.4, 0.18, 1.2, 0.05), new THREE.MeshStandardMaterial({ color, roughness: 0.92 }));
    top.position.y = 1.5;
    stall.add(top);
    const table = new THREE.Mesh(createChamferedBlockGeometry(2.15, 0.65, 0.95, 0.1), new THREE.MeshStandardMaterial({ color: 0x6d4b35, roughness: 0.95 }));
    table.position.y = 0.55;
    stall.add(table);
    stall.position.set(-1 + index * 3.1, 0, 8 + (index % 2) * 1.3);
    stall.traverse((node) => {
      if (node instanceof THREE.Mesh) node.castShadow = true;
    });
    scene.add(stall);
  });
}

function addFieldRows(scene: THREE.Scene): void {
  const rowMaterial = new THREE.MeshStandardMaterial({
    color: 0x4e472f,
    roughness: 1,
    flatShading: true,
  });

  for (let z = -14; z <= 14; z += 1.35) {
    const geometry = new THREE.CylinderGeometry(0.035, 0.07, 31, 5, 1, true);
    const row = new THREE.Mesh(geometry, rowMaterial);
    row.rotation.z = Math.PI / 2;
    row.position.set(0, 0.045, z);
    row.receiveShadow = true;
    scene.add(row);
  }
}

function createTree(variation: number): THREE.Group {
  const group = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: variation % 2 === 0 ? 0x574333 : 0x624a34,
    roughness: 1,
    flatShading: true,
  });
  const crownMaterial = new THREE.MeshStandardMaterial({
    color: variation % 3 === 0 ? 0x344d31 : 0x405b37,
    roughness: 0.95,
    flatShading: true,
  });

  const trunkHeight = 2.1 + (variation % 3) * 0.18;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.34, trunkHeight, 7),
    trunkMaterial,
  );
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  group.add(trunk);

  const lowerCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.35, 0), crownMaterial);
  lowerCrown.position.set(0.08, trunkHeight + 0.72, 0);
  lowerCrown.scale.set(1.05, 1.12, 0.95);
  lowerCrown.castShadow = true;
  group.add(lowerCrown);

  const upperCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.02, 0), crownMaterial);
  upperCrown.position.set(-0.2, trunkHeight + 1.75, 0.05);
  upperCrown.scale.set(0.9, 1.08, 0.86);
  upperCrown.castShadow = true;
  group.add(upperCrown);

  group.rotation.y = variation * 0.73;
  return group;
}

function addStones(scene: THREE.Scene, collisionWorld: CollisionWorld): void {
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x77776c,
    roughness: 0.96,
    flatShading: true,
  });
  const positions: ReadonlyArray<readonly [number, number, number]> = [
    [-7, -4, 0.65],
    [8, 5, 0.8],
    [-8, 8, 0.55],
  ];

  positions.forEach(([x, z, size], index) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), stoneMaterial);
    rock.position.set(x, size * 0.45, z);
    rock.scale.y = 0.72;
    rock.rotation.set(index * 0.4, index * 0.8, index * 0.18);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);

    collisionWorld.addStatic({
      id: `rock-${index}`,
      layer: CollisionLayer.WORLD,
      mask: CollisionLayer.PLAYER | CollisionLayer.NPC | CollisionLayer.HAZARD,
      minX: x - size * 0.7,
      maxX: x + size * 0.7,
      minZ: z - size * 0.7,
      maxZ: z + size * 0.7,
    });
  });
}
