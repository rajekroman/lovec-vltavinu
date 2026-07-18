import * as THREE from "./vendor/three.module.min.js";
import {
  GAME_VERSION, DIFFICULTY, LEVELS, UPGRADES, IDENTIFY_SAMPLES, DIALOGUES
} from "./data.js";
import { AudioManager } from "./audio.js";

const $ = id => document.getElementById(id);
const canvas = $("gameCanvas");
const app = $("app");
const audio = new AudioManager();

const screens = {
  title: $("titleScreen"),
  chapter: $("chapterScreen"),
  dialogue: $("dialogueScreen"),
  identify: $("identifyScreen"),
  inventory: $("inventoryScreen"),
  camp: $("campScreen"),
  final: $("finalSelectionScreen"),
  pause: $("pauseScreen"),
  records: $("recordsScreen"),
  ending: $("endingScreen")
};

const hud = $("hud");
const touchControls = $("touchControls");
const ui = {
  chapterLabel: $("chapterLabel"),
  locationLabel: $("locationLabel"),
  health: $("healthValue"),
  reputation: $("reputationValue"),
  grams: $("gramsValue"),
  money: $("moneyValue"),
  score: $("scoreValue"),
  questTitle: $("questTitle"),
  questProgress: $("questProgress"),
  questText: $("questText"),
  questFill: $("questFill"),
  interactionHint: $("interactionHint"),
  interactionIcon: $("interactionIcon"),
  interactionText: $("interactionText"),
  bossHud: $("bossHud"),
  bossName: $("bossName"),
  bossHpText: $("bossHpText"),
  bossFill: $("bossFill"),
  toast: $("toast"),
  actionIcon: $("actionIcon"),
  actionLabel: $("actionLabel")
};

const STORAGE_KEY = "lovecVltavinuFullSaveV2";
const RECORDS_KEY = "lovecVltavinuFullRecordsV2";
const coarsePointer = matchMedia("(pointer: coarse)");

function defaultState() {
  return {
    version: GAME_VERSION,
    playerName: "Lovec",
    difficulty: "normal",
    levelIndex: 0,
    hp: 5,
    maxHp: 5,
    reputation: 80,
    money: 300,
    score: 0,
    inventory: [],
    upgrades: { shovel: 0, boots: 0, lamp: 0, case: 0 },
    completed: [],
    sound: true,
    startedAt: Date.now()
  };
}

let state = defaultState();
let checkpoint = structuredClone(state);
let runtime = {};
let mode = "menu";
let endingIsFinal = false;
let selectedFinal = new Set();

let renderer, scene, camera, clock;
let world, terrainGroup, decorGroup, entityGroup, effectGroup;
let player, playerBody, playerLegs = [], playerTool, playerLight;
let ambient, hemi, sun;
let rain = null;

let interactables = [];
let enemies = [];
let hazards = [];
let colliders = [];
let mudZones = [];
let effects = [];
let nearest = null;
let boss = null;

let keyboard = new Set();
let moveInput = new THREE.Vector2();
let joystickInput = new THREE.Vector2();
let sprintHeld = false;
let actionHeld = false;
let actionRepeat = 0;
let invulnerableUntil = 0;
let toastTimer = 0;
let lastUiUpdate = 0;
let lastFootstep = 0;
let currentSample = null;
let currentDialogue = null;
let dialogueIndex = 0;
let dialogueDone = null;
let frameId = 0;

const tmpVec3 = new THREE.Vector3();
const tmpVec2 = new THREE.Vector2();

function saveGame() {
  const payload = structuredClone(state);
  payload.version = GAME_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  refreshContinueButton();
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || !Array.isArray(saved.inventory)) return false;
    state = {
      ...defaultState(),
      ...saved,
      upgrades: { ...defaultState().upgrades, ...(saved.upgrades || {}) },
      completed: Array.isArray(saved.completed) ? saved.completed : []
    };
    checkpoint = structuredClone(state);
    audio.setEnabled(state.sound);
    return true;
  } catch {
    return false;
  }
}

function refreshContinueButton() {
  $("continueGameBtn").classList.toggle("hidden", !localStorage.getItem(STORAGE_KEY));
}

function records() {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]"); }
  catch { return []; }
}

function addRecord(finalScore, ending) {
  const list = records();
  list.push({
    name: state.playerName,
    score: Math.round(finalScore),
    grams: totalWeight(state.inventory),
    reputation: Math.round(state.reputation),
    ending,
    difficulty: state.difficulty,
    date: new Date().toISOString()
  });
  list.sort((a, b) => b.score - a.score);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(list.slice(0, 10)));
}

function totalWeight(items) {
  return items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
}

function totalValue(items) {
  return items.reduce((sum, item) => sum + Number(item.value || 0), 0);
}

function visibleInventory() {
  return [...state.inventory, ...(runtime.loot || [])];
}

function showOnly(screen) {
  for (const item of Object.values(screens)) item.classList.remove("visible");
  if (screen) screen.classList.add("visible");
}

function setPlaying(value) {
  app.classList.toggle("playing", value);
  hud.classList.toggle("hidden", !value);
  touchControls.classList.toggle("hidden", !value || !coarsePointer.matches);
}

function toast(text, type = "", duration = 1700) {
  clearTimeout(toastTimer);
  ui.toast.textContent = text;
  ui.toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => { ui.toast.className = "toast"; }, duration);
}

function initThree() {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.15));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07150f);
  camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 250);
  camera.position.set(8, 11, 13);
  clock = new THREE.Clock();

  world = new THREE.Group();
  terrainGroup = new THREE.Group();
  decorGroup = new THREE.Group();
  entityGroup = new THREE.Group();
  effectGroup = new THREE.Group();
  world.add(terrainGroup, decorGroup, entityGroup, effectGroup);
  scene.add(world);

  hemi = new THREE.HemisphereLight(0xd9f1ff, 0x4a3526, 1.1);
  ambient = new THREE.AmbientLight(0xffffff, .32);
  sun = new THREE.DirectionalLight(0xffefcf, 2.1);
  sun.position.set(-10, 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  scene.add(hemi, ambient, sun);

  createPlayer();
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && mode === "playing") pauseGame();
  });
}

function material(color, roughness = .82, metalness = 0, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

function makeMesh(geometry, mat, cast = true, receive = true) {
  const obj = new THREE.Mesh(geometry, mat);
  obj.castShadow = cast;
  obj.receiveShadow = receive;
  return obj;
}

function createPlayer() {
  player = new THREE.Group();
  const shadow = makeMesh(
    new THREE.CircleGeometry(.62, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .24 }),
    false,
    false
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .025;
  player.add(shadow);

  for (const x of [-.2, .2]) {
    const leg = makeMesh(new THREE.BoxGeometry(.22, .72, .24), material(0x273238));
    leg.position.set(x, .55, 0);
    player.add(leg);
    playerLegs.push(leg);
    const boot = makeMesh(new THREE.BoxGeometry(.28, .18, .42), material(0x191b18));
    boot.position.set(x, .13, .08);
    player.add(boot);
  }

  playerBody = makeMesh(new THREE.CapsuleGeometry(.38, .72, 4, 8), material(0x3d6a49));
  playerBody.position.y = 1.42;
  player.add(playerBody);

  const vest = makeMesh(new THREE.BoxGeometry(.78, .62, .42), material(0x71804d));
  vest.position.set(0, 1.48, .02);
  player.add(vest);

  const head = makeMesh(new THREE.SphereGeometry(.28, 12, 8), material(0xc68d67));
  head.position.y = 2.25;
  player.add(head);

  const cap = makeMesh(new THREE.CylinderGeometry(.3, .31, .16, 10), material(0x203a2a));
  cap.position.y = 2.5;
  player.add(cap);
  const brim = makeMesh(new THREE.BoxGeometry(.4, .05, .25), material(0x203a2a));
  brim.position.set(0, 2.45, .22);
  player.add(brim);

  const backpack = makeMesh(new THREE.BoxGeometry(.58, .7, .3), material(0x68482d));
  backpack.position.set(0, 1.45, -.34);
  player.add(backpack);

  playerTool = new THREE.Group();
  const handle = makeMesh(new THREE.CylinderGeometry(.025, .035, 1.5, 6), material(0x885c35));
  handle.position.y = .2;
  playerTool.add(handle);
  const blade = makeMesh(new THREE.BoxGeometry(.32, .38, .06), material(0x778080, .35, .25));
  blade.position.y = -.64;
  playerTool.add(blade);
  playerTool.position.set(.55, 1.38, 0);
  playerTool.rotation.z = -.28;
  player.add(playerTool);

  playerLight = new THREE.SpotLight(0xffedb0, 0, 18, Math.PI / 4.8, .55, 1.2);
  playerLight.position.set(0, 2.45, .15);
  playerLight.target.position.set(0, .2, -8);
  player.add(playerLight, playerLight.target);

  scene.add(player);
}

function disposeObject(obj) {
  obj.traverse(child => {
    child.geometry?.dispose?.();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
      else child.material.dispose?.();
    }
  });
}

function clearWorld() {
  if (rain) {
    scene.remove(rain);
    disposeObject(rain);
    rain = null;
  }
  for (const group of [terrainGroup, decorGroup, entityGroup, effectGroup]) {
    while (group.children.length) {
      const obj = group.children.pop();
      disposeObject(obj);
    }
  }
  interactables = [];
  enemies = [];
  hazards = [];
  colliders = [];
  mudZones = [];
  effects = [];
  nearest = null;
  boss = null;
  ui.bossHud.classList.add("hidden");
}

function setLevelLighting(level) {
  scene.background = new THREE.Color(level.sky);
  scene.fog = new THREE.FogExp2(level.fog, level.theme === "expo" ? .012 : .018);
  const night = level.theme === "night";
  const indoor = level.theme === "expo";
  hemi.color.set(night ? 0x536e9f : indoor ? 0xe7dcc4 : 0xd9f1ff);
  hemi.groundColor.set(night ? 0x11170f : indoor ? 0x413a31 : 0x4a3526);
  hemi.intensity = night ? .45 : indoor ? .8 : 1.08;
  ambient.intensity = night ? .18 : indoor ? .65 : .32;
  sun.color.set(night ? 0x8ea8ee : indoor ? 0xffe7bd : 0xffefcf);
  sun.intensity = night ? .36 : indoor ? .8 : 2.05;
  playerLight.intensity = night ? 3 + state.upgrades.lamp * 1.5 : 0;
  playerLight.distance = 12 + state.upgrades.lamp * 4;
}

function createGround(level) {
  const size = level.size;
  const ground = makeMesh(
    new THREE.PlaneGeometry(size, size),
    material(level.ground, 1),
    false,
    true
  );
  ground.rotation.x = -Math.PI / 2;
  terrainGroup.add(ground);

  const boundaryMat = material(level.theme === "expo" ? 0x3e453f : 0x314632);
  const wallH = level.theme === "expo" ? 3.8 : .45;
  const thickness = level.theme === "expo" ? .45 : .6;
  const positions = [
    [0, wallH / 2, -size / 2, size, wallH, thickness],
    [0, wallH / 2, size / 2, size, wallH, thickness],
    [-size / 2, wallH / 2, 0, thickness, wallH, size],
    [size / 2, wallH / 2, 0, thickness, wallH, size]
  ];
  for (const [x, y, z, w, h, d] of positions) {
    const wall = makeMesh(new THREE.BoxGeometry(w, h, d), boundaryMat);
    wall.position.set(x, y, z);
    terrainGroup.add(wall);
    colliders.push({ x, z, w, d });
  }
}

function addBoxCollider(x, z, w, d) {
  colliders.push({ x, z, w, d });
}

function addCircleCollider(x, z, r) {
  colliders.push({ x, z, r });
}

function blocked(x, z, r = .48) {
  const level = LEVELS[state.levelIndex];
  const half = level.size / 2 - .8;
  if (x - r < -half || x + r > half || z - r < -half || z + r > half) return true;
  for (const c of colliders) {
    if ("r" in c) {
      if (Math.hypot(x - c.x, z - c.z) < r + c.r) return true;
    } else {
      if (
        x + r > c.x - c.w / 2 &&
        x - r < c.x + c.w / 2 &&
        z + r > c.z - c.d / 2 &&
        z - r < c.z + c.d / 2
      ) return true;
    }
  }
  return false;
}

function marker(color = 0x66ff9b, symbol = "!") {
  const group = new THREE.Group();
  const gem = makeMesh(
    new THREE.OctahedronGeometry(.23, 0),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .8 })
  );
  gem.position.y = 2.7;
  group.add(gem);
  group.userData.symbol = symbol;
  return group;
}

function addInteractable(obj, type, data = {}) {
  obj.userData.interactable = { type, ...data };
  interactables.push(obj);
  entityGroup.add(obj);
  return obj;
}

function addColliderForObject(obj, w, d, ox = 0, oz = 0) {
  addBoxCollider(obj.position.x + ox, obj.position.z + oz, w, d);
}

function createTree(x, z, dark = false, scale = 1) {
  const group = new THREE.Group();
  const trunk = makeMesh(new THREE.CylinderGeometry(.18, .29, 2.9, 7), material(dark ? 0x291f19 : 0x5b4029));
  trunk.position.y = 1.45;
  group.add(trunk);
  for (let i = 0; i < 3; i++) {
    const crown = makeMesh(
      new THREE.ConeGeometry(1.05 - i * .13, 1.65, 7),
      material(dark ? 0x183224 : 0x2b6139)
    );
    crown.position.y = 2.65 + i * .72;
    group.add(crown);
  }
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  decorGroup.add(group);
  addCircleCollider(x, z, .58 * scale);
  return group;
}

function createBush(x, z, color = 0x3d793f) {
  const group = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = makeMesh(new THREE.DodecahedronGeometry(.38 + Math.random() * .2, 0), material(color));
    b.position.set((Math.random() - .5) * .75, .32 + Math.random() * .22, (Math.random() - .5) * .7);
    group.add(b);
  }
  group.position.set(x, 0, z);
  decorGroup.add(group);
  addCircleCollider(x, z, .52);
}

function createRock(x, z, scale = 1) {
  const rock = makeMesh(new THREE.DodecahedronGeometry(.55 * scale, 0), material(0x646257));
  rock.position.set(x, .32 * scale, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  decorGroup.add(rock);
  addCircleCollider(x, z, .42 * scale);
}

function createMud(x, z, r = 1.25) {
  const mud = makeMesh(
    new THREE.CircleGeometry(r, 18),
    new THREE.MeshStandardMaterial({ color: 0x2c211c, roughness: .36, metalness: .03 }),
    false,
    true
  );
  mud.rotation.x = -Math.PI / 2;
  mud.position.set(x, .025, z);
  decorGroup.add(mud);
  mudZones.push({ x, z, r });
}

function createFence(x, z, length = 6, horizontal = false) {
  const group = new THREE.Group();
  const posts = Math.max(2, Math.round(length / 2));
  for (let i = 0; i <= posts; i++) {
    const p = makeMesh(new THREE.BoxGeometry(.13, 1.05, .13), material(0x806443));
    const offset = -length / 2 + i * (length / posts);
    p.position.set(horizontal ? offset : 0, .52, horizontal ? 0 : offset);
    group.add(p);
  }
  for (const y of [.38, .82]) {
    const rail = makeMesh(
      new THREE.BoxGeometry(horizontal ? length : .12, .11, horizontal ? .12 : length),
      material(0x8b6c47)
    );
    rail.position.y = y;
    group.add(rail);
  }
  group.position.set(x, 0, z);
  decorGroup.add(group);
  addBoxCollider(x, z, horizontal ? length : .3, horizontal ? .3 : length);
}

function createBuilding(x, z, w, d, h, color = 0xb5a68e, roof = 0x6f3d30) {
  const group = new THREE.Group();
  const body = makeMesh(new THREE.BoxGeometry(w, h, d), material(color));
  body.position.y = h / 2;
  group.add(body);
  const roofMesh = makeMesh(new THREE.ConeGeometry(Math.max(w, d) * .72, h * .35, 4), material(roof));
  roofMesh.position.y = h + h * .17;
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  group.add(roofMesh);
  group.position.set(x, 0, z);
  decorGroup.add(group);
  addBoxCollider(x, z, w, d);
  return group;
}

function createVan(x, z, color = 0xe7ded0) {
  const group = new THREE.Group();
  const body = makeMesh(new THREE.BoxGeometry(2.7, 1.25, 4.4), material(color, .55, .05));
  body.position.y = .9;
  group.add(body);
  const cab = makeMesh(new THREE.BoxGeometry(2.4, 1.05, 1.65), material(0x526c75, .35, .08));
  cab.position.set(0, 1.55, 1.05);
  group.add(cab);
  for (const dx of [-1.25, 1.25]) for (const dz of [-1.25, 1.25]) {
    const wheel = makeMesh(new THREE.CylinderGeometry(.38, .38, .22, 10), material(0x181818));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(dx, .38, dz);
    group.add(wheel);
  }
  group.position.set(x, 0, z);
  decorGroup.add(group);
  addBoxCollider(x, z, 2.9, 4.6);
  return group;
}

function createNpc(name, x, z, colors = [0x385944, 0x2b3133], portrait = "?") {
  const group = createHumanoid(colors[1], colors[0], 0xc68c67);
  group.position.set(x, 0, z);
  group.add(marker(0x6bffa5, "!"));
  group.userData.npcName = name;
  group.userData.portrait = portrait;
  return group;
}

function createHumanoid(pants = 0x263238, shirt = 0x4b6c50, skin = 0xc68c67) {
  const group = new THREE.Group();
  for (const x of [-.18, .18]) {
    const leg = makeMesh(new THREE.BoxGeometry(.19, .65, .22), material(pants));
    leg.position.set(x, .42, 0);
    group.add(leg);
  }
  const body = makeMesh(new THREE.CapsuleGeometry(.33, .56, 4, 7), material(shirt));
  body.position.y = 1.25;
  group.add(body);
  const head = makeMesh(new THREE.SphereGeometry(.25, 10, 7), material(skin));
  head.position.y = 2.05;
  group.add(head);
  return group;
}

function createGemObject(x, z, options = {}) {
  const rare = Boolean(options.rare);
  const fake = Boolean(options.fake);
  const color = fake ? 0x29fa84 : rare ? 0xb8e26f : 0x4ca963;
  const geometry = rare
    ? new THREE.DodecahedronGeometry(.38, 1)
    : new THREE.IcosahedronGeometry(.31, 1);
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: fake ? .06 : .38,
    transmission: fake ? .38 : .16,
    thickness: .7,
    transparent: true,
    opacity: .93,
    emissive: rare ? 0x4a3b12 : 0x0b2312,
    emissiveIntensity: rare ? .5 : .22
  });
  const gem = makeMesh(geometry, mat);
  gem.position.set(x, .43, z);
  gem.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  const beam = makeMesh(
    new THREE.CylinderGeometry(.035, .18, 1.4, 8),
    new THREE.MeshBasicMaterial({ color: rare ? 0xffdd79 : 0x72ffab, transparent: true, opacity: .18 }),
    false,
    false
  );
  beam.position.y = .9;
  gem.add(beam);
  return gem;
}

function makeStone(locality, options = {}) {
  const rarity = options.rarity || "common";
  const fake = Boolean(options.fake);
  const documented = Boolean(options.documented);
  const weights = {
    common: [0.45, 2.6],
    good: [1.4, 4.8],
    rare: [3.6, 8.5],
    hedgehog: [5.5, 12]
  };
  const [min, max] = weights[rarity] || weights.common;
  const weight = Number((min + Math.random() * (max - min)).toFixed(2));
  const gradeRoll = Math.random() + (rarity === "rare" ? .25 : rarity === "hedgehog" ? .45 : 0);
  const grade = fake ? "?" : gradeRoll > .95 ? "A" : gradeRoll > .48 ? "B" : "C";
  const names = {
    common: ["drobný splash", "nepravidelný úlomek", "kapkovitý kus", "plochý fragment"],
    good: ["celotvar", "protáhlý splash", "kapka s bublinou", "vrstevnatý kus"],
    rare: ["výstavní celotvar", "hluboce skulptovaný kus", "vzácný splash"],
    hedgehog: ["besednický ježek"]
  };
  const pool = names[rarity] || names.common;
  const name = fake ? "zelený skleněný odlitek" : pool[Math.floor(Math.random() * pool.length)];
  const base = fake ? 20 : rarity === "hedgehog" ? 1450 : rarity === "rare" ? 580 : rarity === "good" ? 280 : 120;
  const gradeMult = grade === "A" ? 1.65 : grade === "B" ? 1.15 : grade === "C" ? .75 : .1;
  const value = Math.round(weight * base * gradeMult + (documented ? 180 : 0));
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    locality,
    name,
    weight,
    grade,
    rarity,
    fake,
    documented,
    value
  };
}

function createStonePickup(x, z, options = {}) {
  const obj = createGemObject(x, z, options);
  addInteractable(obj, "gem", options);
  return obj;
}

function createSample(x, z, sampleIndex) {
  const sample = IDENTIFY_SAMPLES[sampleIndex % IDENTIFY_SAMPLES.length];
  const obj = createGemObject(x, z, { fake: !sample.real, rare: false });
  obj.scale.setScalar(.92);
  addInteractable(obj, "sample", { sampleIndex, sample });
  return obj;
}

function createDigSpot(x, z, options = {}) {
  const group = new THREE.Group();
  const soil = makeMesh(new THREE.CylinderGeometry(.78, .9, .12, 16), material(0x6b4a31));
  soil.position.y = .06;
  group.add(soil);
  const stake = makeMesh(new THREE.BoxGeometry(.08, 1.05, .08), material(options.special ? 0xf2ce62 : 0xd9c58d));
  stake.position.set(.65, .52, 0);
  group.add(stake);
  const flag = makeMesh(new THREE.BoxGeometry(.5, .26, .04), material(options.special ? 0xeebd45 : 0xded7b9));
  flag.position.set(.88, .82, 0);
  group.add(flag);
  group.position.set(x, 0, z);
  addInteractable(group, "dig", {
    hits: 0,
    required: Math.max(1, (options.required || 4) - state.upgrades.shovel),
    special: Boolean(options.special),
    clue: Boolean(options.clue),
    locality: options.locality || LEVELS[state.levelIndex].location,
    rarity: options.rarity || "good",
    documented: Boolean(options.documented),
    dug: false,
    filled: false
  });
  return group;
}

function createHoleFromDig(dig) {
  const data = dig.userData.interactable;
  const group = new THREE.Group();
  const ring = makeMesh(new THREE.TorusGeometry(.82, .13, 7, 18), material(0x2d2118));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .03;
  group.add(ring);
  const pit = makeMesh(new THREE.CircleGeometry(.7, 18), material(0x17120f), false, false);
  pit.rotation.x = -Math.PI / 2;
  pit.position.y = .025;
  group.add(pit);
  group.position.copy(dig.position);
  addInteractable(group, "hole", { filled: false, source: data });
  entityGroup.remove(dig);
  dig.userData.interactable.disabled = true;
  return group;
}

function createDocument(x, z, label = "Dokumentace") {
  const group = new THREE.Group();
  const paper = makeMesh(new THREE.BoxGeometry(.7, .04, .92), material(0xf0e3b7));
  paper.position.y = .12;
  paper.rotation.y = Math.random() * .7;
  group.add(paper);
  const mark = marker(0x75bfff, "?");
  mark.scale.setScalar(.75);
  group.add(mark);
  group.position.set(x, 0, z);
  addInteractable(group, "document", { label });
}

function createExit(x, z, label = "Pokračovat") {
  const group = new THREE.Group();
  const pad = makeMesh(
    new THREE.CylinderGeometry(1.25, 1.25, .08, 24),
    new THREE.MeshStandardMaterial({ color: 0x2f9a61, emissive: 0x154829, emissiveIntensity: .7 })
  );
  pad.position.y = .04;
  group.add(pad);
  const arrow = marker(0x83ffb4, "→");
  arrow.position.y = .3;
  group.add(arrow);
  group.position.set(x, 0, z);
  addInteractable(group, "exit", { label });
}

function createTable(x, z, type, label) {
  const group = new THREE.Group();
  const top = makeMesh(new THREE.BoxGeometry(3, .18, 1.5), material(0x7b5636));
  top.position.y = 1.05;
  group.add(top);
  for (const dx of [-1.2, 1.2]) for (const dz of [-.55, .55]) {
    const leg = makeMesh(new THREE.BoxGeometry(.13, 1, .13), material(0x5c3d27));
    leg.position.set(dx, .5, dz);
    group.add(leg);
  }
  group.add(marker(type === "display" ? 0xffd874 : 0x79ffae, type === "display" ? "◆" : "!"));
  group.position.set(x, 0, z);
  addInteractable(group, type, { label });
  addBoxCollider(x, z, 3.1, 1.6);
  return group;
}

function createPolice(x, z, path) {
  const group = createHumanoid(0x222b38, 0x2b5f93, 0xc68c67);
  const cap = makeMesh(new THREE.BoxGeometry(.48, .12, .38), material(0x1d3c5e));
  cap.position.y = 2.32;
  group.add(cap);
  group.position.set(x, 0, z);
  entityGroup.add(group);
  enemies.push({
    obj: group,
    type: "police",
    hp: 99,
    path,
    pathIndex: 0,
    speed: 2.2,
    cooldown: 0,
    chase: false,
    alive: true
  });
  return group;
}

function createFarmerEnemy(x, z, path) {
  const group = createHumanoid(0x5d442d, 0x4b6d3c, 0xc68c67);
  group.position.set(x, 0, z);
  entityGroup.add(group);
  enemies.push({
    obj: group,
    type: "farmer",
    hp: 99,
    path,
    pathIndex: 0,
    speed: 1.8,
    cooldown: 0,
    chase: false,
    alive: true
  });
}

function createDigger(x, z, path = null) {
  const group = createHumanoid(0x211f20, 0x65302d, 0xb77755);
  const pick = makeMesh(new THREE.BoxGeometry(.12, 2, .12), material(0x745035));
  pick.rotation.z = .65;
  pick.position.set(.65, 1.25, 0);
  group.add(pick);
  group.position.set(x, 0, z);
  entityGroup.add(group);
  enemies.push({
    obj: group,
    type: "digger",
    hp: 2,
    path: path || [[x, z], [x + 3, z + 2]],
    pathIndex: 0,
    speed: 2.4,
    cooldown: 0,
    chase: false,
    alive: true
  });
}

function createBoss(name, x, z, hp, kind) {
  const group = createHumanoid(0x181719, kind === "franta" ? 0x563345 : 0x6a2d2c, 0xb77755);
  group.scale.setScalar(1.45);
  const tool = makeMesh(new THREE.BoxGeometry(.16, 2.7, .16), material(0x775234));
  tool.rotation.z = .7;
  tool.position.set(.95, 1.7, 0);
  group.add(tool);
  const blade = makeMesh(new THREE.BoxGeometry(.85, .28, .14), material(0x737c7d, .35, .3));
  blade.rotation.z = .7;
  blade.position.set(1.78, .65, 0);
  group.add(blade);
  group.position.set(x, 0, z);
  entityGroup.add(group);
  boss = {
    obj: group,
    name,
    kind,
    hp,
    maxHp: hp,
    cooldown: 0,
    attackTimer: 1.4,
    phase: "stalk",
    vulnerable: false,
    stunTimer: 0,
    alive: true
  };
  ui.bossName.textContent = name;
  ui.bossHud.classList.remove("hidden");
  audio.play("boss");
  audio.playMusic("boss");
  toast(`${name} vstupuje do hry!`, "bad", 2400);
}

function createMovingCar(x, z, axis = "x", speed = 4.5, range = 20) {
  const group = new THREE.Group();
  const body = makeMesh(new THREE.BoxGeometry(1.65, .68, 3), material(Math.random() < .5 ? 0x386e88 : 0x8b4137, .5, .08));
  body.position.y = .62;
  group.add(body);
  const roof = makeMesh(new THREE.BoxGeometry(1.2, .6, 1.35), material(0x435c65, .38, .1));
  roof.position.set(0, 1.16, -.2);
  group.add(roof);
  for (const dx of [-.74, .74]) for (const dz of [-.85, .85]) {
    const wheel = makeMesh(new THREE.CylinderGeometry(.25, .25, .18, 9), material(0x171717));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(dx, .3, dz);
    group.add(wheel);
  }
  group.position.set(x, 0, z);
  entityGroup.add(group);
  hazards.push({ obj: group, type: "car", axis, speed, range, origin: axis === "x" ? x : z, dir: Math.random() < .5 ? -1 : 1, cooldown: 0 });
}

function createTractor(x, z, path) {
  const group = new THREE.Group();
  const body = makeMesh(new THREE.BoxGeometry(2.1, 1, 2.5), material(0xb54829));
  body.position.y = .95;
  group.add(body);
  const cab = makeMesh(new THREE.BoxGeometry(1.1, 1.2, 1.1), material(0x526f78, .35, .08));
  cab.position.set(0, 1.8, -.2);
  group.add(cab);
  for (const dx of [-1, 1]) for (const dz of [-.75, .75]) {
    const wheel = makeMesh(new THREE.CylinderGeometry(.44, .44, .25, 10), material(0x171717));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(dx, .4, dz);
    group.add(wheel);
  }
  group.position.set(x, 0, z);
  entityGroup.add(group);
  hazards.push({ obj: group, type: "tractor", path, pathIndex: 0, speed: 2.1, cooldown: 0 });
}

function createRain() {
  const count = 760;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - .5) * 64;
    pos[i * 3 + 1] = Math.random() * 18;
    pos[i * 3 + 2] = (Math.random() - .5) * 64;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9ab6ce, size: .055, transparent: true, opacity: .48 }));
  scene.add(rain);
}

function buildLevel() {
  clearWorld();
  const level = LEVELS[state.levelIndex];
  setLevelLighting(level);
  createGround(level);
  runtime = {
    step: 0,
    permit: false,
    collected: 0,
    correct: 0,
    trueFound: 0,
    identified: new Set(),
    dug: 0,
    filled: 0,
    openHoles: 0,
    clues: 0,
    hedgehog: false,
    documents: 0,
    bossDefeated: false,
    organizer: false,
    registered: false,
    loot: [],
    enemiesDefeated: 0,
    finalReady: false,
    startedAt: performance.now()
  };
  player.position.set(level.start[0], 0, level.start[1]);
  player.rotation.set(0, 0, 0);
  checkpoint = structuredClone(state);

  if (level.id === "chlum") generateChlum(level);
  if (level.id === "locenice") generateLocenice(level);
  if (level.id === "nesmen") generateNesmen(level);
  if (level.id === "besednice") generateBesednice(level);
  if (level.id === "malse") generateMalse(level);
  if (level.id === "slavie") generateSlavie(level);

  audio.playMusic(level.music);
  updateHUD(true);
}

function randomClearPosition(size, margin = 5) {
  for (let tries = 0; tries < 80; tries++) {
    const x = (Math.random() - .5) * (size - margin * 2);
    const z = (Math.random() - .5) * (size - margin * 2);
    if (!blocked(x, z, .8) && Math.hypot(x - player.position.x, z - player.position.z) > 4) return [x, z];
  }
  return [0, 0];
}

function generateChlum(level) {
  for (let x = -18; x <= 18; x += 3.2) {
    const row = makeMesh(new THREE.BoxGeometry(.8, .14, 36), material(0x4d3728), false, true);
    row.position.set(x, .05, -1);
    terrainGroup.add(row);
  }
  const path = makeMesh(new THREE.PlaneGeometry(6.5, 42), material(0x7a6046), false, true);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, .07, 0);
  terrainGroup.add(path);

  createBuilding(-15, 15, 6.5, 6, 3.8, 0xc5b499, 0x7d4938);
  createVan(7.5, 18);
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1;
    createFence(side * 20, -15 + i * 3.1, 4, false);
  }
  for (let i = 0; i < 9; i++) {
    const [x, z] = randomClearPosition(level.size, 4);
    createBush(x, z);
  }
  createMud(-3, 8, 1.4);
  createMud(5, -4, 1.25);
  createMud(-10, -11, 1.35);
  const npc = createNpc("Sedlák Václav", -7, 16, [0x4f6c3a, 0x5b432e], "V");
  addInteractable(npc, "npc", { id: "vaclav" });

  const positions = [
    [-11, 9], [8, 9], [-6, 4], [12, 1], [-13, -5], [6, -8], [-8, -13], [13, -16]
  ];
  positions.forEach((p, i) => createStonePickup(p[0], p[1], { rarity: i === 7 ? "good" : "common", rare: i === 7 }));
  createTractor(-15, 2, [[-15, 13], [-15, -15], [15, -15], [15, 13]]);
  createFarmerEnemy(15, 14, [[15, 14], [15, -12], [-15, -12], [-15, 14]]);
  createExit(level.exit[0], level.exit[1], "Vrátit se k dodávce");
}

function generateLocenice(level) {
  const path = makeMesh(new THREE.PlaneGeometry(8, 44), material(0x8a7048), false, true);
  path.rotation.x = -Math.PI / 2;
  path.position.y = .06;
  terrainGroup.add(path);
  for (let i = 0; i < 26; i++) {
    const [x, z] = randomClearPosition(level.size, 4);
    if (Math.random() < .6) createBush(x, z, Math.random() < .5 ? 0x477f42 : 0x587b3c);
    else createRock(x, z, .65 + Math.random() * .45);
  }
  const table = createTable(-8, 15, "info", "Určovací stůl");
  table.userData.interactable.disabled = true;
  const npc = createNpc("Geolog Martin", -8, 12, [0x3e6255, 0x31383a], "M");
  addInteractable(npc, "npc", { id: "geologist" });

  const samplePositions = [
    [-12, 6], [-5, 7], [6, 8], [12, 5], [-14, -1],
    [-5, 0], [5, 1], [14, -3], [-8, -10], [8, -12]
  ];
  samplePositions.forEach((p, i) => createSample(p[0], p[1], i));
  createMud(-2, 5, 1.5);
  createMud(7, -6, 1.35);
  createExit(level.exit[0], level.exit[1], "Pokračovat do Nesměně");
}

function generateNesmen(level) {
  const path = makeMesh(new THREE.PlaneGeometry(7, 48), material(0x66523b), false, true);
  path.rotation.x = -Math.PI / 2;
  path.position.y = .055;
  terrainGroup.add(path);
  for (let i = 0; i < 46; i++) {
    let [x, z] = randomClearPosition(level.size, 3);
    if (Math.abs(x) < 4) x += x >= 0 ? 5 : -5;
    createTree(x, z, false, .8 + Math.random() * .45);
  }
  for (let i = 0; i < 8; i++) {
    const [x, z] = randomClearPosition(level.size, 4);
    createRock(x, z, .6 + Math.random() * .5);
  }
  const owner = createNpc("Majitel lesa", -6, 20, [0x4b6a3e, 0x3c332d], "L");
  addInteractable(owner, "npc", { id: "owner" });

  createMud(-2, 3, 1.45);
  createMud(5, -9, 1.25);
  const spots = [[-11, 10], [10, 7], [-12, -5], [11, -12]];
  spots.forEach((p, i) => createDigSpot(p[0], p[1], {
    required: 4,
    locality: "Nesměň",
    rarity: i === 3 ? "rare" : "good",
    documented: true
  }));
  createPolice(0, -2, [[0, 18], [0, -18]]);
  createExit(level.exit[0], level.exit[1], "Pokračovat k Besednici");
}

function generateBesednice(level) {
  const path = makeMesh(new THREE.PlaneGeometry(6, 50), material(0x3b3929), false, true);
  path.rotation.x = -Math.PI / 2;
  path.position.y = .055;
  terrainGroup.add(path);
  for (let i = 0; i < 52; i++) {
    let [x, z] = randomClearPosition(level.size, 3);
    if (Math.abs(x) < 3.6) x += x >= 0 ? 4.5 : -4.5;
    createTree(x, z, true, .8 + Math.random() * .45);
  }
  createRain();
  createMud(4, 8, 1.5);
  createMud(-5, -2, 1.35);
  const cluePositions = [[-12, 10], [11, 2], [-9, -8]];
  cluePositions.forEach((p, i) => createDocument(p[0], p[1], `Stopa nočních kopáčů ${i + 1}`));
  createDigSpot(0, -13, { required: 6, special: true, locality: "Besednice", rarity: "hedgehog", documented: true });
  createDigger(12, 12, [[12, 12], [9, -2], [15, -10]]);
  createDigger(-14, 1, [[-14, 1], [-9, -12], [-16, -17]]);
  createExit(level.exit[0], level.exit[1], "Odjet do Budějovic");
}

function createRiver(x, width, levelSize) {
  const water = makeMesh(
    new THREE.PlaneGeometry(width, levelSize),
    new THREE.MeshStandardMaterial({ color: 0x315c69, roughness: .25, metalness: .06, transparent: true, opacity: .86 }),
    false,
    true
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, .025, 0);
  terrainGroup.add(water);
  addBoxCollider(x, 0, width - 1, levelSize);
}

function createLamp(x, z) {
  const group = new THREE.Group();
  const pole = makeMesh(new THREE.CylinderGeometry(.045, .07, 4, 7), material(0x3e4548, .5, .18));
  pole.position.y = 2;
  group.add(pole);
  const bulb = makeMesh(
    new THREE.SphereGeometry(.18, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffe6a9, emissive: 0x6b511c, emissiveIntensity: .8 })
  );
  bulb.position.y = 4;
  group.add(bulb);
  group.position.set(x, 0, z);
  decorGroup.add(group);
}

function generateMalse(level) {
  createRiver(-19, 9, level.size);
  const road = makeMesh(new THREE.PlaneGeometry(11, 52), material(0x45484d, .95), false, true);
  road.rotation.x = -Math.PI / 2;
  road.position.set(5, .055, 0);
  terrainGroup.add(road);
  for (let z = -22; z <= 22; z += 8) {
    const dash = makeMesh(new THREE.BoxGeometry(.12, .02, 3.3), material(0xe9e4ce), false, false);
    dash.position.set(5, .07, z);
    terrainGroup.add(dash);
  }
  for (let z = -22; z <= 22; z += 7) {
    createLamp(-10, z);
    createLamp(11, z);
  }
  createBuilding(17, 14, 7, 8, 5.5, 0x98908a, 0x6e4e45);
  createBuilding(18, -7, 8, 9, 6, 0x9f917b, 0x614238);
  createVan(-5, 20, 0x7f9b79);

  createDocument(-8, 10, "Fotografie nálezů");
  createDocument(10, 4, "Seznam hmotností");
  createDocument(-7, -8, "Souhlasy vlastníků");
  createMovingCar(5, 13, "x", 5.3, 8);
  createMovingCar(5, 0, "x", 6, 8);
  createMovingCar(5, -14, "x", 5, 8);
  createPolice(10, -18, [[10, -18], [10, 18]]);
  createExit(level.exit[0], level.exit[1], "Vstoupit do Slávie");
}

function createSlavieInterior() {
  const back = createBuilding(0, -17.5, 30, 1, 7, 0xd9d1bd, 0x55463c);
  back.children[1].visible = false;
  const stage = makeMesh(new THREE.BoxGeometry(14, .8, 5), material(0x503b2e));
  stage.position.set(0, .4, -15);
  decorGroup.add(stage);
  addBoxCollider(0, -15, 14, 5);

  for (const x of [-13, 13]) {
    for (let z = -10; z <= 10; z += 5) {
      const booth = makeMesh(new THREE.BoxGeometry(4.2, 1.1, 2.2), material(z % 10 === 0 ? 0x72513d : 0x5e4938));
      booth.position.set(x, .55, z);
      decorGroup.add(booth);
      addBoxCollider(x, z, 4.3, 2.3);
    }
  }
  for (let x = -8; x <= 8; x += 4) {
    const banner = makeMesh(
      new THREE.BoxGeometry(2.7, 1.2, .12),
      material(0x22563a, .8, 0, { emissive: 0x102e1d, emissiveIntensity: .35 })
    );
    banner.position.set(x, 4.2, -17);
    decorGroup.add(banner);
  }
}

function generateSlavie(level) {
  createSlavieInterior();
  const organizer = createNpc("Organizátorka", -6, 10, [0x6b3f5e, 0x33323a], "Z");
  addInteractable(organizer, "npc", { id: "organizer" });
  const registrar = createNpc("Registrace", 6, 7, [0x405f73, 0x303338], "R");
  addInteractable(registrar, "npc", { id: "registrar" });
  createTable(0, -5, "display", "Výstavní stůl");
  createTable(-8, -1, "info", "Přednáškový stůl");
  createTable(8, -1, "info", "Geologická burza");
}

function questStatus() {
  const id = LEVELS[state.levelIndex].id;
  if (id === "chlum") {
    if (!runtime.permit) return { title: "Povolení", text: "Promluv se Sedlákem Václavem u statku.", current: 0, max: 1 };
    if (runtime.collected < 6) return { title: "Povrchový sběr", text: "Najdi v tmavých brázdách šest vltavínů.", current: runtime.collected, max: 6 };
    return { title: "Odjezd", text: "Vrať se k zelenému kruhu u dodávky.", current: 1, max: 1 };
  }
  if (id === "locenice") {
    return {
      title: "Určování vzorků",
      text: `Správně určeno ${runtime.correct}/6, pravé nálezy ${runtime.trueFound}/4.`,
      current: Math.min(runtime.correct, 6) + Math.min(runtime.trueFound, 4),
      max: 10
    };
  }
  if (id === "nesmen") {
    if (!runtime.permit) return { title: "Souhlas vlastníka", text: "Promluv s majitelem lesa.", current: 0, max: 1 };
    return {
      title: "Šetrný profil",
      text: `Vykopáno ${runtime.dug}/4, zasypáno ${runtime.filled}/4.`,
      current: runtime.dug + runtime.filled,
      max: 8
    };
  }
  if (id === "besednice") {
    if (runtime.clues < 3) return { title: "Stopy v noci", text: "Najdi tři modře označené indicie.", current: runtime.clues, max: 3 };
    if (!runtime.hedgehog) return { title: "Ježková vrstva", text: "Odkryj žlutě označený profil uprostřed lesa.", current: 0, max: 1 };
    if (!runtime.bossDefeated) return { title: "Krystalový Karel", text: "Uhýbej výpadům a udeř, když se zarazí krumpáč.", current: boss ? boss.maxHp - boss.hp : 0, max: boss ? boss.maxHp : 1 };
    return { title: "Odjezd", text: "Dojdi k výjezdu z lokality.", current: 1, max: 1 };
  }
  if (id === "malse") {
    if (runtime.documents < 3) return { title: "Ztracená dokumentace", text: "Najdi tři modré složky podél Malše.", current: runtime.documents, max: 3 };
    if (!runtime.bossDefeated) return { title: "Feták Franta", text: "Ochraň sbírku a poraz Frantu.", current: boss ? boss.maxHp - boss.hp : 0, max: boss ? boss.maxHp : 1 };
    return { title: "Slávie", text: "Projdi zeleným vstupem do kulturního domu.", current: 1, max: 1 };
  }
  if (id === "slavie") {
    if (!runtime.organizer) return { title: "Přivítání", text: "Promluv s organizátorkou u vstupu.", current: 0, max: 1 };
    if (!runtime.registered) return { title: "Registrace", text: "Předlož dokumentaci registračnímu stolu.", current: 0, max: 1 };
    return { title: "Výstavní pětice", text: "Připrav pět kamenů na centrálním stole.", current: 0, max: 1 };
  }
  return { title: "Výprava", text: "", current: 0, max: 1 };
}

function objectiveCompleteForExit() {
  const id = LEVELS[state.levelIndex].id;
  if (id === "chlum") return runtime.permit && runtime.collected >= 6;
  if (id === "locenice") return runtime.correct >= 6 && runtime.trueFound >= 4;
  if (id === "nesmen") return runtime.permit && runtime.dug >= 4 && runtime.filled >= 4;
  if (id === "besednice") return runtime.hedgehog && runtime.bossDefeated;
  if (id === "malse") return runtime.documents >= 3 && runtime.bossDefeated;
  return false;
}

function updateHUD(force = false) {
  const now = performance.now();
  if (!force && now - lastUiUpdate < 90) return;
  lastUiUpdate = now;
  const level = LEVELS[state.levelIndex];
  ui.chapterLabel.textContent = `Kapitola ${state.levelIndex + 1} / ${LEVELS.length}`;
  ui.locationLabel.textContent = level.location;
  ui.health.textContent = "♥".repeat(Math.max(0, state.hp)) + "♡".repeat(Math.max(0, state.maxHp - state.hp));
  ui.reputation.textContent = Math.round(state.reputation);
  ui.grams.textContent = totalWeight(visibleInventory()).toFixed(1);
  ui.money.textContent = Math.round(state.money).toLocaleString("cs-CZ");
  ui.score.textContent = Math.round(state.score).toLocaleString("cs-CZ");
  const q = questStatus();
  ui.questTitle.textContent = q.title;
  ui.questText.textContent = q.text;
  ui.questProgress.textContent = q.max > 1 ? `${Math.min(q.current, q.max)} / ${q.max}` : "";
  ui.questFill.style.width = `${Math.min(100, q.max ? q.current / q.max * 100 : 0)}%`;
}

function interactionLabel(data) {
  const map = {
    npc: ["!", "Promluvit"],
    gem: ["◆", "Sebrat"],
    sample: ["?", "Prozkoumat"],
    dig: ["⛏", "Kopat"],
    hole: ["▨", "Zasypat"],
    document: ["▤", "Sebrat"],
    exit: ["→", data.label || "Pokračovat"],
    display: ["◆", "Připravit vitrínu"],
    info: ["i", data.label || "Prohlédnout"]
  };
  return map[data.type] || ["!", "Akce"];
}

function updateNearest() {
  nearest = null;
  let best = 2.35;
  for (const obj of interactables) {
    const data = obj.userData.interactable;
    if (!data || data.disabled || !obj.parent) continue;
    const dx = obj.position.x - player.position.x;
    const dz = obj.position.z - player.position.z;
    const d = Math.hypot(dx, dz);
    if (d < best) {
      best = d;
      nearest = obj;
    }
  }
  if (nearest) {
    const label = interactionLabel(nearest.userData.interactable);
    ui.interactionIcon.textContent = label[0];
    ui.interactionText.textContent = label[1];
    ui.interactionHint.classList.remove("hidden");
    ui.actionIcon.textContent = label[0];
    ui.actionLabel.textContent = label[1].toUpperCase().slice(0, 8);
  } else {
    ui.interactionHint.classList.add("hidden");
    ui.actionIcon.textContent = boss ? "⚒" : "✋";
    ui.actionLabel.textContent = boss ? "ÚDER" : "AKCE";
  }
}

function collectGem(obj) {
  const data = obj.userData.interactable;
  if (LEVELS[state.levelIndex].id === "chlum" && !runtime.permit) {
    adjustReputation(-6, "Sbíráš bez povolení.");
  }
  const stone = makeStone(LEVELS[state.levelIndex].location, {
    rarity: data.rarity || (data.rare ? "good" : "common"),
    documented: Boolean(data.documented)
  });
  runtime.loot.push(stone);
  runtime.collected++;
  state.score += Math.round(stone.weight * (stone.rarity === "good" ? 220 : 130));
  removeInteractable(obj);
  burst(obj.position, data.rare ? 0xffd76e : 0x5ee797, data.rare ? 22 : 12);
  audio.play(data.rare ? "rare" : "collect");
  toast(`${stone.name}: +${stone.weight.toFixed(2)} g`, data.rare ? "rare" : "good");
}

function removeInteractable(obj) {
  const data = obj.userData.interactable;
  if (data) data.disabled = true;
  entityGroup.remove(obj);
}

function inspectSample(obj) {
  const data = obj.userData.interactable;
  if (runtime.identified.has(data.sampleIndex)) return;
  currentSample = { obj, ...data };
  const sample = data.sample;
  $("sampleDescription").textContent = sample.description;
  $("sampleFacts").innerHTML = `
    <dt>Barva</dt><dd>${sample.color}</dd>
    <dt>Povrch</dt><dd>${sample.surface}</dd>
    <dt>Hrany</dt><dd>${sample.edges}</dd>
    <dt>Bubliny</dt><dd>${sample.bubbles}</dd>`;
  $("sampleGem").style.color = sample.real ? "#54d987" : "#28ff8b";
  mode = "modal";
  setPlaying(false);
  screens.identify.classList.add("visible");
}

function resolveSample(markedReal) {
  if (!currentSample) return;
  const sample = currentSample.sample;
  const correct = markedReal === sample.real;
  runtime.identified.add(currentSample.sampleIndex);
  if (correct) {
    runtime.correct++;
    state.score += 350;
    adjustReputation(2);
    audio.play("collect");
    toast("Správné určení.", "good");
  } else {
    state.score = Math.max(0, state.score - 180);
    adjustReputation(-4);
    audio.play("wrong");
    toast("Chybné určení.", "bad");
  }
  if (markedReal) {
    const stone = makeStone("Ločenice", {
      rarity: sample.real ? (Math.random() < .25 ? "good" : "common") : "common",
      fake: !sample.real,
      documented: false
    });
    runtime.loot.push(stone);
    if (sample.real) runtime.trueFound++;
  }
  removeInteractable(currentSample.obj);
  currentSample = null;
  screens.identify.classList.remove("visible");
  mode = "playing";
  setPlaying(true);
  updateHUD(true);
}

function dig(obj) {
  const data = obj.userData.interactable;
  const levelId = LEVELS[state.levelIndex].id;
  if (levelId === "nesmen" && !runtime.permit) {
    adjustReputation(-5, "Nejdřív potřebuješ souhlas vlastníka.");
    return;
  }
  if (levelId === "besednice" && data.special && runtime.clues < 3) {
    toast("Nejdřív najdi všechny tři indicie.", "bad");
    return;
  }
  data.hits++;
  swingTool();
  audio.play("dig", .9, .92 + Math.random() * .12);
  burst(obj.position.clone().add(new THREE.Vector3(0, .1, 0)), 0x785036, 8);
  toast(`Kopání ${data.hits} / ${data.required}`);
  if (data.hits < data.required) return;

  data.dug = true;
  runtime.dug++;
  const stone = makeStone(data.locality, {
    rarity: data.rarity,
    documented: data.documented,
    fake: false
  });
  runtime.loot.push(stone);
  state.score += Math.round(stone.value * .65);
  if (data.rarity === "hedgehog") {
    runtime.hedgehog = true;
    audio.play("rare");
    toast(`Besednický ježek! ${stone.weight.toFixed(2)} g`, "rare", 2600);
    setTimeout(() => {
      if (!boss) createBoss("Krystalový Karel", 0, -2, 10, "karel");
    }, 900);
  } else {
    audio.play(data.rarity === "rare" ? "rare" : "collect");
    toast(`Nález v profilu: ${stone.weight.toFixed(2)} g`, data.rarity === "rare" ? "rare" : "good");
  }
  if (levelId === "nesmen") {
    runtime.openHoles++;
    createHoleFromDig(obj);
  } else {
    removeInteractable(obj);
  }
}

function fillHole(obj) {
  const data = obj.userData.interactable;
  if (data.filled) return;
  data.filled = true;
  runtime.filled++;
  runtime.openHoles = Math.max(0, runtime.openHoles - 1);
  state.score += 300;
  adjustReputation(5);
  swingTool();
  audio.play("fill");
  burst(obj.position.clone(), 0x6e5138, 10);
  toast("Jáma bezpečně zasypána: +5 pověst", "good");
  removeInteractable(obj);
  const patch = makeMesh(new THREE.CylinderGeometry(.82, .82, .05, 16), material(0x57412f));
  patch.position.copy(obj.position);
  patch.position.y = .025;
  decorGroup.add(patch);
}

function collectDocument(obj) {
  const data = obj.userData.interactable;
  const levelId = LEVELS[state.levelIndex].id;
  if (levelId === "besednice") runtime.clues++;
  else runtime.documents++;
  state.score += 250;
  audio.play("collect");
  toast(`${data.label} nalezena.`, "good");
  removeInteractable(obj);
  if (levelId === "malse" && runtime.documents >= 3 && !boss) {
    setTimeout(() => createBoss("Feták Franta", -2, -4, 12, "franta"), 650);
  }
}

function interactNpc(data) {
  if (data.id === "vaclav") {
    showDialogue(DIALOGUES.vaclav, () => {
      if (!runtime.permit) {
        runtime.permit = true;
        adjustReputation(5);
        state.score += 300;
        toast("Povolení získáno.", "good");
      } else toast("Drž se tmavých brázd.", "");
    });
  }
  if (data.id === "geologist") {
    showDialogue(DIALOGUES.geologist, () => toast("Vzorky jsou rozmístěné po celé rýze.", "good"));
  }
  if (data.id === "owner") {
    showDialogue(DIALOGUES.owner, () => {
      if (!runtime.permit) {
        runtime.permit = true;
        state.score += 350;
        adjustReputation(6);
        toast("Mapa profilů a souhlas získány.", "good");
      }
    });
  }
  if (data.id === "organizer") {
    showDialogue(DIALOGUES.organizer, () => {
      runtime.organizer = true;
      state.score += 300;
      toast("Registrace je napravo od vstupu.", "good");
    });
  }
  if (data.id === "registrar") {
    if (!runtime.organizer) {
      toast("Nejdřív se přihlas u organizátorky.", "bad");
      return;
    }
    showDialogue(DIALOGUES.registrar, () => {
      runtime.registered = true;
      const docs = state.inventory.filter(s => s.documented).length;
      const bonus = docs * 90 + Math.round(state.reputation * 4);
      state.score += bonus;
      toast(`Dokumentace přijata: +${bonus} bodů`, "good");
    });
  }
}

function interactExit(data) {
  if (!objectiveCompleteForExit()) {
    toast(questStatus().text, "bad");
    return;
  }
  completeChapter();
}

function openFinalSelection() {
  if (!runtime.organizer || !runtime.registered) {
    toast("Nejdřív dokonči přivítání a registraci.", "bad");
    return;
  }
  renderFinalSelection();
  mode = "modal";
  setPlaying(false);
  screens.final.classList.add("visible");
}

function interactInfo(data) {
  toast(data.label === "Přednáškový stůl"
    ? "Program: vznik tektitů, lokality, určování a ochrana nalezišť."
    : "Na burze se porovnávají sbírky, šperky a odborná literatura.", "good", 2600);
}

function performAction() {
  if (mode !== "playing") return;
  if (boss && boss.alive) {
    attackBoss();
    return;
  }
  const closeEnemy = enemies.find(e => e.alive && e.type === "digger" && e.obj.position.distanceTo(player.position) < 2);
  if (closeEnemy) {
    attackEnemy(closeEnemy);
    return;
  }
  if (!nearest) {
    swingTool();
    return;
  }
  const data = nearest.userData.interactable;
  if (!data || data.disabled) return;
  if (data.type === "npc") interactNpc(data);
  if (data.type === "gem") collectGem(nearest);
  if (data.type === "sample") inspectSample(nearest);
  if (data.type === "dig") dig(nearest);
  if (data.type === "hole") fillHole(nearest);
  if (data.type === "document") collectDocument(nearest);
  if (data.type === "exit") interactExit(data);
  if (data.type === "display") openFinalSelection();
  if (data.type === "info") interactInfo(data);
}

function swingTool() {
  playerTool.userData.swing = 1;
}

function attackEnemy(enemy) {
  if (enemy.cooldown > 0) return;
  enemy.hp--;
  enemy.cooldown = .35;
  swingTool();
  audio.play("hit");
  burst(enemy.obj.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff705c, 12);
  if (enemy.hp <= 0) {
    enemy.alive = false;
    entityGroup.remove(enemy.obj);
    runtime.enemiesDefeated++;
    state.score += 550;
    toast("Noční kopáč utekl.", "good");
  }
}

function attackBoss() {
  if (!boss || !boss.alive || boss.cooldown > 0) return;
  swingTool();
  boss.cooldown = .3;
  const d = boss.obj.position.distanceTo(player.position);
  if (d > 2.25) {
    toast("Přibliž se k bossovi.");
    return;
  }
  if (!boss.vulnerable) {
    toast("Počkej, až se zarazí krumpáč.");
    return;
  }
  boss.hp--;
  state.score += 420;
  audio.play("hit");
  burst(boss.obj.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xff725d, 18);
  if (boss.hp <= 0) defeatBoss();
}

function defeatBoss() {
  boss.alive = false;
  runtime.bossDefeated = true;
  state.score += 2800;
  state.money += 450;
  adjustReputation(7);
  burst(boss.obj.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xffd874, 42);
  entityGroup.remove(boss.obj);
  ui.bossHud.classList.add("hidden");
  audio.play("win");
  audio.playMusic(LEVELS[state.levelIndex].music);
  toast(`${boss.name} poražen. Cesta je volná!`, "rare", 2800);
  boss = null;
}

function adjustReputation(amount, message = "") {
  const diff = DIFFICULTY[state.difficulty];
  const effective = amount < 0 ? amount * diff.reputationLoss : amount;
  state.reputation = Math.max(0, Math.min(100, state.reputation + effective));
  if (message) toast(message, amount < 0 ? "bad" : "good");
  if (state.reputation <= 0) failLevel("Ztratil jsi důvěru místních i sběratelské komunity.");
}

function damage(reason, reputationLoss = 3) {
  if (performance.now() < invulnerableUntil || mode !== "playing") return;
  invulnerableUntil = performance.now() + 1200;
  const diff = DIFFICULTY[state.difficulty];
  state.hp -= Math.max(1, Math.round(diff.enemyDamage));
  adjustReputation(-reputationLoss);
  playerBody.material.emissive = new THREE.Color(0x791313);
  setTimeout(() => playerBody?.material?.emissive?.set(0x000000), 260);
  audio.play("hit");
  toast(reason, "bad");
  if (state.hp <= 0) failLevel("Zranění ukončilo tuto část výpravy.");
}

function burst(position, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const p = makeMesh(
      new THREE.BoxGeometry(.08 + Math.random() * .07, .08 + Math.random() * .07, .08 + Math.random() * .07),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9 }),
      false,
      false
    );
    p.position.copy(position);
    effectGroup.add(p);
    effects.push({
      obj: p,
      velocity: new THREE.Vector3((Math.random() - .5) * 3, 1 + Math.random() * 2.4, (Math.random() - .5) * 3),
      life: .55 + Math.random() * .45
    });
  }
}

function showDialogue(dialogue, onDone) {
  currentDialogue = dialogue;
  dialogueIndex = 0;
  dialogueDone = onDone;
  mode = "dialogue";
  setPlaying(false);
  $("dialogueName").textContent = dialogue.name;
  $("dialoguePortrait").textContent = dialogue.portrait;
  screens.dialogue.classList.add("visible");
  renderDialogueLine();
}

function renderDialogueLine() {
  $("dialogueText").textContent = currentDialogue.lines[dialogueIndex];
  $("dialogueNextBtn").textContent = dialogueIndex >= currentDialogue.lines.length - 1 ? "Rozumím" : "Pokračovat";
}

function nextDialogue() {
  if (!currentDialogue) return;
  if (dialogueIndex < currentDialogue.lines.length - 1) {
    dialogueIndex++;
    renderDialogueLine();
    audio.play("menu", .55);
    return;
  }
  screens.dialogue.classList.remove("visible");
  const done = dialogueDone;
  currentDialogue = null;
  dialogueDone = null;
  mode = "playing";
  setPlaying(true);
  done?.();
  updateHUD(true);
}

function chapterReward() {
  const id = LEVELS[state.levelIndex].id;
  const base = [700, 900, 1200, 1600, 1800, 0][state.levelIndex] || 0;
  const repBonus = Math.round(state.reputation * 5);
  const ethical = id === "nesmen" && runtime.filled >= 4 ? 700 : 0;
  return base + repBonus + ethical;
}

function completeChapter() {
  if (runtime.loot?.length) state.inventory.push(...runtime.loot);
  runtime.loot = [];
  const reward = chapterReward();
  state.money += reward;
  state.score += reward;
  state.hp = state.maxHp;
  state.completed = [...new Set([...state.completed, LEVELS[state.levelIndex].id])];
  const finishedLevel = LEVELS[state.levelIndex];
  state.levelIndex++;
  saveGame();

  if (state.levelIndex >= LEVELS.length) return;
  mode = "camp";
  setPlaying(false);
  $("campTitle").textContent = `${finishedLevel.location} dokončeno`;
  $("campSummary").textContent = `Výprava získala ${reward.toLocaleString("cs-CZ")} Kč za zakázky, fotografie a drobné prodeje. Vyber výbavu pro další lokalitu.`;
  renderCamp();
  screens.camp.classList.add("visible");
  audio.play("cash");
}

function renderCamp() {
  $("campWeight").textContent = `${totalWeight(state.inventory).toFixed(1)} g`;
  $("campReputation").textContent = Math.round(state.reputation);
  $("campMoney").textContent = `${Math.round(state.money).toLocaleString("cs-CZ")} Kč`;
  $("campScore").textContent = Math.round(state.score).toLocaleString("cs-CZ");
  const list = $("upgradeList");
  list.innerHTML = "";
  for (const up of UPGRADES) {
    const level = state.upgrades[up.id] || 0;
    const card = document.createElement("article");
    card.className = "upgrade";
    const maxed = level >= up.max;
    const price = maxed ? 0 : up.prices[level];
    card.innerHTML = `
      <h4>${up.name} · ${level}/${up.max}</h4>
      <p>${up.descriptions[level]}</p>
      <button type="button" ${maxed || state.money < price ? "disabled" : ""}>
        ${maxed ? "Maximum" : `Vylepšit za ${price.toLocaleString("cs-CZ")} Kč`}
      </button>`;
    card.querySelector("button").addEventListener("click", () => buyUpgrade(up));
    list.append(card);
  }
}

function buyUpgrade(upgrade) {
  const level = state.upgrades[upgrade.id] || 0;
  if (level >= upgrade.max) return;
  const price = upgrade.prices[level];
  if (state.money < price) {
    toast("Nemáš dost korun.", "bad");
    return;
  }
  state.money -= price;
  state.upgrades[upgrade.id]++;
  state.score += 150;
  audio.play("cash");
  saveGame();
  renderCamp();
}

function sellWeakCommon() {
  if (state.inventory.length <= 8) {
    toast("Sbírka je zatím příliš malá.", "bad");
    return;
  }
  const candidates = state.inventory
    .filter(s => !s.fake && s.rarity === "common")
    .sort((a, b) => a.value - b.value)
    .slice(0, Math.min(5, Math.max(0, state.inventory.length - 8)));
  if (!candidates.length) {
    toast("Nemáš slabé běžné kusy k prodeji.");
    return;
  }
  const ids = new Set(candidates.map(s => s.id));
  const value = candidates.reduce((sum, s) => sum + s.value, 0);
  state.inventory = state.inventory.filter(s => !ids.has(s.id));
  state.money += value;
  state.score += Math.round(value * .15);
  audio.play("cash");
  toast(`Prodáno ${candidates.length} kusů za ${value.toLocaleString("cs-CZ")} Kč.`, "good");
  saveGame();
  renderCamp();
}

function startNextChapter() {
  screens.camp.classList.remove("visible");
  showChapter();
}

function showChapter() {
  const level = LEVELS[state.levelIndex];
  if (!level) return;
  mode = "chapter";
  setPlaying(false);
  $("chapterKicker").textContent = `KAPITOLA ${state.levelIndex + 1} Z ${LEVELS.length}`;
  $("chapterTitle").textContent = level.title;
  $("chapterStory").textContent = level.story;
  $("chapterObjective").textContent = level.objective;
  $("chapterRare").textContent = level.rare;
  $("chapterLore").textContent = `Zápisník lovce: ${level.lore}`;
  screens.chapter.classList.add("visible");
}

function startChapter() {
  screens.chapter.classList.remove("visible");
  state.hp = state.maxHp;
  buildLevel();
  mode = "playing";
  setPlaying(true);
  saveGame();
}

function newGame() {
  state = defaultState();
  state.playerName = ($("playerNameInput").value.trim() || "Lovec").slice(0, 18);
  state.difficulty = $("difficultySelect").value;
  state.sound = true;
  audio.setEnabled(true);
  checkpoint = structuredClone(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  screens.title.classList.remove("visible");
  audio.unlock();
  audio.play("menu");
  showChapter();
}

function continueGame() {
  if (!loadGame()) {
    toast("Uloženou hru se nepodařilo načíst.", "bad");
    return;
  }
  screens.title.classList.remove("visible");
  audio.unlock();
  showChapter();
}

function failLevel(reason) {
  if (mode === "ending") return;
  mode = "ending";
  endingIsFinal = false;
  setPlaying(false);
  audio.stopMusic();
  $("endingKicker").textContent = "VÝPRAVA PŘERUŠENA";
  $("endingTitle").textContent = "Tuto kapitolu musíš zopakovat";
  $("endingScore").textContent = Math.round(state.score).toLocaleString("cs-CZ");
  $("endingText").textContent = reason;
  $("endingBreakdown").innerHTML = `
    <div><span>Poslední bezpečný bod</span><strong>${LEVELS[state.levelIndex].title}</strong></div>
    <div><span>Co zůstane</span><strong>Výbava a sbírka z předchozích kapitol</strong></div>`;
  $("playAgainBtn").textContent = "Zopakovat kapitolu";
  screens.ending.classList.add("visible");
}

function restartFailedChapter() {
  state = structuredClone(checkpoint);
  state.hp = state.maxHp;
  screens.ending.classList.remove("visible");
  showChapter();
}

function pauseGame() {
  if (mode !== "playing") return;
  mode = "paused";
  setPlaying(false);
  screens.pause.classList.add("visible");
}

function resumeGame() {
  if (mode !== "paused") return;
  screens.pause.classList.remove("visible");
  mode = "playing";
  setPlaying(true);
  clock.getDelta();
}

function saveAndMenu() {
  state = structuredClone(checkpoint);
  saveGame();
  screens.pause.classList.remove("visible");
  mode = "menu";
  setPlaying(false);
  audio.stopMusic();
  screens.title.classList.add("visible");
}

function restartGameConfirm() {
  if (!confirm("Opravdu zahodit rozehranou výpravu a začít znovu?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  screens.pause.classList.remove("visible");
  mode = "menu";
  setPlaying(false);
  audio.stopMusic();
  refreshContinueButton();
  screens.title.classList.add("visible");
}

function renderInventory() {
  const items = visibleInventory();
  $("inventoryCount").textContent = items.length;
  $("inventoryWeight").textContent = `${totalWeight(items).toFixed(1)} g`;
  $("inventoryValue").textContent = `${totalValue(items).toLocaleString("cs-CZ")} Kč`;
  $("inventoryDocumented").textContent = items.filter(s => s.documented).length;
  const list = $("inventoryList");
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `<div class="empty-list">Zatím jsi žádný kámen nenašel.</div>`;
    return;
  }
  const sorted = [...items].sort((a, b) => b.value - a.value);
  for (const item of sorted) {
    const row = document.createElement("div");
    row.className = `inventory-item ${item.fake ? "fake" : ""} ${["rare", "hedgehog"].includes(item.rarity) ? "rare" : ""}`;
    row.innerHTML = `
      <div class="stone-icon">◆</div>
      <div>
        <div class="item-title">${escapeHtml(item.name)}</div>
        <div class="item-meta">${escapeHtml(item.locality)} · ${item.weight.toFixed(2)} g · třída ${item.grade} · ${item.documented ? "dokladovaný" : "bez dokumentace"}</div>
      </div>
      <div class="item-value">${item.value.toLocaleString("cs-CZ")} Kč</div>`;
    list.append(row);
  }
}

function openInventory() {
  if (!["playing", "paused"].includes(mode)) return;
  const wasPlaying = mode === "playing";
  mode = wasPlaying ? "inventory" : mode;
  setPlaying(false);
  renderInventory();
  screens.inventory.classList.add("visible");
  screens.inventory.dataset.resume = wasPlaying ? "1" : "0";
}

function closeInventory() {
  const resume = screens.inventory.dataset.resume === "1";
  screens.inventory.classList.remove("visible");
  if (resume) {
    mode = "playing";
    setPlaying(true);
  }
}

function renderFinalSelection() {
  selectedFinal.clear();
  const list = $("finalSelectionList");
  list.innerHTML = "";
  const sorted = [...state.inventory].sort((a, b) => b.value - a.value);
  for (const item of sorted) {
    const row = document.createElement("label");
    row.className = `selection-item ${item.fake ? "fake" : ""} ${["rare", "hedgehog"].includes(item.rarity) ? "rare" : ""}`;
    row.innerHTML = `
      <input type="checkbox" value="${item.id}">
      <div class="stone-icon">◆</div>
      <div>
        <div class="item-title">${escapeHtml(item.name)}</div>
        <div class="item-meta">${escapeHtml(item.locality)} · ${item.weight.toFixed(2)} g · třída ${item.grade} · ${item.documented ? "dokladovaný" : "bez dokumentace"}</div>
      </div>
      <div class="item-value">${item.value.toLocaleString("cs-CZ")} Kč</div>`;
    const checkbox = row.querySelector("input");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked && selectedFinal.size >= 5) {
        checkbox.checked = false;
        toast("Na výstavní stůl se vejde pět kamenů.", "bad");
        return;
      }
      if (checkbox.checked) selectedFinal.add(item.id);
      else selectedFinal.delete(item.id);
      row.classList.toggle("selected", checkbox.checked);
      $("selectionCount").textContent = `Vybráno ${selectedFinal.size} / 5`;
      $("confirmSelectionBtn").disabled = selectedFinal.size !== 5;
    });
    list.append(row);
  }
  $("selectionCount").textContent = "Vybráno 0 / 5";
  $("confirmSelectionBtn").disabled = true;
}

function confirmFinalSelection() {
  if (selectedFinal.size !== 5) return;
  const selected = state.inventory.filter(s => selectedFinal.has(s.id));
  screens.final.classList.remove("visible");
  finishGame(selected);
}

function scoreStone(item) {
  if (item.fake) return -5200;
  const rarityBonus = item.rarity === "hedgehog" ? 4200 : item.rarity === "rare" ? 1800 : item.rarity === "good" ? 650 : 180;
  const gradeBonus = item.grade === "A" ? 1000 : item.grade === "B" ? 450 : 120;
  const docBonus = item.documented ? 700 : 0;
  return Math.round(item.weight * 120 + rarityBonus + gradeBonus + docBonus + item.value * .15);
}

function finishGame(selected) {
  mode = "ending";
  endingIsFinal = true;
  setPlaying(false);
  audio.playMusic("expo");
  audio.play("win");

  const stoneScore = selected.reduce((sum, item) => sum + scoreStone(item), 0);
  const repScore = Math.round(state.reputation * 28);
  const caseScore = state.upgrades.case * 1100;
  const localities = new Set(selected.map(item => item.locality)).size;
  const diversityScore = localities * 520;
  const documentationScore = selected.filter(item => item.documented).length * 430;
  const fakeCount = selected.filter(item => item.fake).length;
  const authenticityBonus = fakeCount ? -3500 * fakeCount : 2500;
  const finalScore = Math.max(0, Math.round(state.score + stoneScore + repScore + caseScore + diversityScore + documentationScore + authenticityBonus));

  let ending = "účastník";
  let title = "Sbírka byla přijata";
  let text = "Výprava dorazila do Slávie a získala místo mezi vystavovateli.";
  if (fakeCount) {
    ending = "padělek";
    title = "Porota odhalila padělek";
    text = "Jeden ze zelených kusů byl skleněný odlitek. Výstava pokračuje, ale důvěra poroty utrpěla.";
  } else if (finalScore >= 26000 && state.reputation >= 82) {
    ending = "vítěz";
    title = "Hlavní cena Zelené vlny";
    text = "Dokumentovaná, pestrá a eticky získaná sbírka získala hlavní ocenění. Besednický ježek se stal středem výstavy.";
  } else if (finalScore >= 19000) {
    ending = "výstavní";
    title = "Výstavní uznání poroty";
    text = "Porota ocenila kvalitu kamenů i příběh výpravy. Tvá vitrína patří k nejnavštěvovanějším stolům.";
  }

  state.score = finalScore;
  state.completed = [...new Set([...state.completed, "slavie"])];
  localStorage.removeItem(STORAGE_KEY);
  addRecord(finalScore, ending);
  refreshContinueButton();

  $("endingKicker").textContent = "NA ZELENÉ VLNĚ – FINÁLE";
  $("endingTitle").textContent = title;
  $("endingScore").textContent = finalScore.toLocaleString("cs-CZ");
  $("endingText").textContent = text;
  $("endingBreakdown").innerHTML = `
    <div><span>Výběr kamenů</span><strong>${stoneScore.toLocaleString("cs-CZ")}</strong></div>
    <div><span>Pověst</span><strong>${repScore.toLocaleString("cs-CZ")}</strong></div>
    <div><span>Výstavní kufr</span><strong>${caseScore.toLocaleString("cs-CZ")}</strong></div>
    <div><span>Rozmanitost lokalit</span><strong>${diversityScore.toLocaleString("cs-CZ")}</strong></div>
    <div><span>Dokumentace</span><strong>${documentationScore.toLocaleString("cs-CZ")}</strong></div>
    <div><span>Pravost sbírky</span><strong>${authenticityBonus.toLocaleString("cs-CZ")}</strong></div>`;
  $("playAgainBtn").textContent = "Nová výprava";
  screens.ending.classList.add("visible");
}

function renderRecords() {
  const list = $("recordsList");
  const rows = records();
  list.innerHTML = "";
  if (!rows.length) {
    list.innerHTML = `<li><div class="meta">Zatím není uložený žádný výsledek.</div></li>`;
    return;
  }
  rows.forEach((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">${i + 1}.</span>
      <div>
        <div class="name">${escapeHtml(r.name)}</div>
        <div class="meta">${Number(r.grams).toFixed(1)} g · pověst ${r.reputation} · ${new Date(r.date).toLocaleDateString("cs-CZ")}</div>
      </div>
      <div class="score">${Number(r.score).toLocaleString("cs-CZ")}</div>`;
    list.append(li);
  });
}

function openRecords() {
  renderRecords();
  screens.records.classList.add("visible");
}

function closeRecords() {
  screens.records.classList.remove("visible");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[ch]);
}

function updatePlayer(dt) {
  const diff = DIFFICULTY[state.difficulty];
  tmpVec2.copy(moveInput).add(joystickInput);
  if (tmpVec2.lengthSq() > 1) tmpVec2.normalize();

  const moving = tmpVec2.lengthSq() > .01;
  const inMud = mudZones.some(zone => Math.hypot(player.position.x - zone.x, player.position.z - zone.z) < zone.r);
  const bootLevel = state.upgrades.boots;
  let speed = 4.5 * diff.playerSpeed * (1 + bootLevel * .075);
  if (sprintHeld) speed *= 1.42 + bootLevel * .04;
  if (inMud) speed *= .52 + bootLevel * .13;

  if (moving) {
    const dx = tmpVec2.x * speed * dt;
    const dz = tmpVec2.y * speed * dt;
    const nx = player.position.x + dx;
    const nz = player.position.z + dz;
    if (!blocked(nx, player.position.z)) player.position.x = nx;
    if (!blocked(player.position.x, nz)) player.position.z = nz;
    const targetRot = Math.atan2(tmpVec2.x, tmpVec2.y);
    player.rotation.y = dampAngle(player.rotation.y, targetRot, 10, dt);
    const walk = performance.now() * (sprintHeld ? .016 : .012);
    playerLegs[0].rotation.x = Math.sin(walk) * .45;
    playerLegs[1].rotation.x = -Math.sin(walk) * .45;
    player.position.y = Math.abs(Math.sin(walk)) * .035;
    if (performance.now() - lastFootstep > (sprintHeld ? 260 : 390)) {
      lastFootstep = performance.now();
      audio.play("step", .18, .9 + Math.random() * .15);
    }
  } else {
    playerLegs.forEach(leg => leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, 0, 9, dt));
    player.position.y = THREE.MathUtils.damp(player.position.y, 0, 9, dt);
  }

  if (playerTool.userData.swing > 0) {
    playerTool.userData.swing -= dt * 4.4;
    playerTool.rotation.x = -Math.sin((1 - playerTool.userData.swing) * Math.PI) * 1.35;
  } else {
    playerTool.rotation.x = THREE.MathUtils.damp(playerTool.rotation.x, 0, 12, dt);
  }
}

function dampAngle(current, target, lambda, dt) {
  let delta = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  return current + delta * (1 - Math.exp(-lambda * dt));
}

function updateCamera(dt) {
  const offset = new THREE.Vector3(8.5, 10.5, 12);
  const desired = player.position.clone().add(offset);
  camera.position.lerp(desired, 1 - Math.exp(-4.2 * dt));
  tmpVec3.copy(player.position).add(new THREE.Vector3(0, 1.1, -2.4));
  camera.lookAt(tmpVec3);
}

function updateInteractables(dt) {
  const t = performance.now() * .001;
  for (const obj of interactables) {
    const data = obj.userData.interactable;
    if (!data || data.disabled || !obj.parent) continue;
    if (["gem", "sample"].includes(data.type)) {
      obj.rotation.y += dt * .9;
      obj.position.y = .43 + Math.sin(t * 2.5 + obj.position.x) * .08;
    }
    const mark = obj.children.find(c => c.userData?.symbol);
    if (mark) mark.rotation.y += dt * 1.3;
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive || !enemy.obj.parent) continue;
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    const d = enemy.obj.position.distanceTo(player.position);
    const levelId = LEVELS[state.levelIndex].id;
    let illegal = false;
    if (enemy.type === "farmer") illegal = !runtime.permit;
    if (enemy.type === "police") illegal = !runtime.permit || runtime.openHoles > 0 || (levelId === "malse" && boss && boss.alive);
    if (enemy.type === "digger") illegal = true;
    enemy.chase = illegal && d < (enemy.type === "police" ? 9 : 7);

    const diff = DIFFICULTY[state.difficulty];
    const speed = enemy.speed * diff.enemySpeed;
    if (enemy.chase) {
      const dir = player.position.clone().sub(enemy.obj.position);
      dir.y = 0;
      if (dir.lengthSq() > .01) dir.normalize();
      enemy.obj.position.addScaledVector(dir, speed * dt);
      enemy.obj.rotation.y = Math.atan2(dir.x, dir.z);
    } else if (enemy.path?.length) {
      const p = enemy.path[enemy.pathIndex];
      const target = new THREE.Vector3(p[0], 0, p[1]);
      const dir = target.sub(enemy.obj.position);
      if (dir.length() < .55) enemy.pathIndex = (enemy.pathIndex + 1) % enemy.path.length;
      else {
        dir.normalize();
        enemy.obj.position.addScaledVector(dir, speed * .55 * dt);
        enemy.obj.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }

    if (d < 1.05 && enemy.cooldown <= 0) {
      enemy.cooldown = 1.25;
      if (enemy.type === "police") {
        audio.play("police");
        damage("Policejní kontrola zastavila výpravu.", 6);
      } else if (enemy.type === "farmer") {
        damage("Zemědělec tě vyhnal z nepovolené části pole.", 5);
      } else {
        damage("Noční kopáč tě zasáhl krumpáčem.", 3);
      }
    }
  }
  enemies = enemies.filter(e => e.alive && e.obj.parent);
}

function updateHazards(dt) {
  for (const hazard of hazards) {
    hazard.cooldown = Math.max(0, hazard.cooldown - dt);
    if (hazard.path) {
      const p = hazard.path[hazard.pathIndex];
      const target = new THREE.Vector3(p[0], 0, p[1]);
      const dir = target.sub(hazard.obj.position);
      if (dir.length() < .6) hazard.pathIndex = (hazard.pathIndex + 1) % hazard.path.length;
      else {
        dir.normalize();
        hazard.obj.position.addScaledVector(dir, hazard.speed * dt);
        hazard.obj.rotation.y = Math.atan2(dir.x, dir.z);
      }
    } else {
      const axis = hazard.axis;
      hazard.obj.position[axis] += hazard.speed * hazard.dir * dt;
      if (Math.abs(hazard.obj.position[axis] - hazard.origin) > hazard.range) hazard.dir *= -1;
      hazard.obj.rotation.y = axis === "x" ? (hazard.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (hazard.dir > 0 ? 0 : Math.PI);
    }
    if (hazard.obj.position.distanceTo(player.position) < 1.25 && hazard.cooldown <= 0) {
      hazard.cooldown = 1.4;
      damage(hazard.type === "tractor" ? "Pozor na traktor!" : "Srážka v městském provozu!", 3);
    }
  }
}

function updateBoss(dt) {
  if (!boss || !boss.alive) return;
  boss.cooldown = Math.max(0, boss.cooldown - dt);
  boss.attackTimer -= dt;
  boss.stunTimer -= dt;

  const toPlayer = player.position.clone().sub(boss.obj.position);
  toPlayer.y = 0;
  const distance = toPlayer.length();

  if (boss.phase === "stalk") {
    boss.vulnerable = false;
    if (distance > 2.6) {
      toPlayer.normalize();
      boss.obj.position.addScaledVector(toPlayer, 2.0 * DIFFICULTY[state.difficulty].enemySpeed * dt);
      boss.obj.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }
    if (boss.attackTimer <= 0) {
      boss.phase = "windup";
      boss.attackTimer = .75;
      toast(`${boss.name} se napřahuje!`, "bad", 700);
    }
  } else if (boss.phase === "windup") {
    boss.vulnerable = false;
    boss.obj.rotation.z = Math.sin(performance.now() * .025) * .08;
    if (boss.attackTimer <= 0) {
      boss.phase = "charge";
      boss.attackTimer = .55;
      boss.chargeDir = player.position.clone().sub(boss.obj.position).setY(0).normalize();
    }
  } else if (boss.phase === "charge") {
    boss.obj.position.addScaledVector(boss.chargeDir, 8 * dt);
    if (boss.obj.position.distanceTo(player.position) < 1.25) {
      damage(`${boss.name} tě zasáhl.`, 4);
      boss.attackTimer = 0;
    }
    if (boss.attackTimer <= 0 || blocked(boss.obj.position.x + boss.chargeDir.x * .3, boss.obj.position.z + boss.chargeDir.z * .3, .7)) {
      boss.phase = "stunned";
      boss.stunTimer = 1.4;
      boss.vulnerable = true;
      boss.obj.rotation.z = .3;
    }
  } else if (boss.phase === "stunned") {
    boss.vulnerable = true;
    if (boss.stunTimer <= 0) {
      boss.phase = "stalk";
      boss.attackTimer = 1 + Math.random() * 1.2;
      boss.vulnerable = false;
      boss.obj.rotation.z = 0;
    }
  }

  const pct = Math.max(0, boss.hp / boss.maxHp * 100);
  ui.bossFill.style.width = `${pct}%`;
  ui.bossHpText.textContent = `${Math.round(pct)} %`;
}

function updateRain(dt) {
  if (!rain) return;
  const arr = rain.geometry.attributes.position.array;
  for (let i = 0; i < arr.length; i += 3) {
    arr[i + 1] -= 15 * dt;
    if (arr[i + 1] < 0) arr[i + 1] = 15 + Math.random() * 5;
  }
  rain.geometry.attributes.position.needsUpdate = true;
}

function updateEffects(dt) {
  for (const e of effects) {
    e.life -= dt;
    e.velocity.y -= 4.8 * dt;
    e.obj.position.addScaledVector(e.velocity, dt);
    e.obj.material.opacity = Math.max(0, e.life);
  }
  for (const e of effects.filter(e => e.life <= 0)) effectGroup.remove(e.obj);
  effects = effects.filter(e => e.life > 0);
}

function updateGame(dt) {
  if (mode !== "playing") return;
  actionRepeat -= dt;
  if (actionHeld && actionRepeat <= 0) {
    actionRepeat = .32;
    performAction();
  }
  updatePlayer(dt);
  updateCamera(dt);
  updateInteractables(dt);
  updateEnemies(dt);
  updateHazards(dt);
  updateBoss(dt);
  updateRain(dt);
  updateEffects(dt);
  updateNearest();
  updateHUD();
}

function animate() {
  frameId = requestAnimationFrame(animate);
  const dt = Math.min(.04, clock.getDelta());
  updateGame(dt);
  renderer.render(scene, camera);
}

function setupInput() {
  addEventListener("keydown", event => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    keyboard.add(event.code);
    if (event.code === "Space" && !event.repeat) performAction();
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") sprintHeld = true;
    if (event.code === "Escape" || event.code === "KeyP") {
      if (mode === "playing") pauseGame();
      else if (mode === "paused") resumeGame();
    }
    updateKeyboardInput();
  });
  addEventListener("keyup", event => {
    keyboard.delete(event.code);
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") sprintHeld = false;
    updateKeyboardInput();
  });

  const joystick = $("joystick");
  const knob = $("joystickKnob");
  let pointerId = null;
  function moveJoystick(event) {
    const rect = joystick.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const max = rect.width * .32;
    const len = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, max / len);
    const cx = dx * scale;
    const cy = dy * scale;
    joystickInput.set(cx / max, cy / max);
    knob.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
  }
  joystick.addEventListener("pointerdown", event => {
    pointerId = event.pointerId;
    joystick.setPointerCapture(pointerId);
    moveJoystick(event);
  });
  joystick.addEventListener("pointermove", event => {
    if (event.pointerId === pointerId) moveJoystick(event);
  });
  const endJoystick = event => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    joystickInput.set(0, 0);
    knob.style.transform = "translate(-50%,-50%)";
  };
  joystick.addEventListener("pointerup", endJoystick);
  joystick.addEventListener("pointercancel", endJoystick);

  const action = $("actionBtn");
  action.addEventListener("pointerdown", event => {
    event.preventDefault();
    actionHeld = true;
    action.classList.add("active");
    actionRepeat = .34;
    performAction();
  });
  const stopAction = () => {
    actionHeld = false;
    action.classList.remove("active");
  };
  action.addEventListener("pointerup", stopAction);
  action.addEventListener("pointercancel", stopAction);

  const sprint = $("sprintBtn");
  sprint.addEventListener("pointerdown", event => {
    event.preventDefault();
    sprintHeld = true;
    sprint.classList.add("active");
  });
  const stopSprint = () => {
    sprintHeld = false;
    sprint.classList.remove("active");
  };
  sprint.addEventListener("pointerup", stopSprint);
  sprint.addEventListener("pointercancel", stopSprint);
}

function updateKeyboardInput() {
  let x = 0, y = 0;
  if (keyboard.has("KeyA") || keyboard.has("ArrowLeft")) x -= 1;
  if (keyboard.has("KeyD") || keyboard.has("ArrowRight")) x += 1;
  if (keyboard.has("KeyW") || keyboard.has("ArrowUp")) y -= 1;
  if (keyboard.has("KeyS") || keyboard.has("ArrowDown")) y += 1;
  moveInput.set(x, y);
  if (moveInput.lengthSq() > 1) moveInput.normalize();
}

function resize() {
  if (!renderer || !camera) return;
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.15));
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (app.requestFullscreen) await app.requestFullscreen({ navigationUI: "hide" });
    else toast("Na iPhonu použij Sdílet → Přidat na plochu.", "");
  } catch {
    toast("Safari povolí plnou obrazovku po přidání hry na plochu.", "");
  }
}

function bindUI() {
  $("newGameBtn").addEventListener("click", newGame);
  $("continueGameBtn").addEventListener("click", continueGame);
  $("startChapterBtn").addEventListener("click", startChapter);
  $("dialogueNextBtn").addEventListener("click", nextDialogue);
  $("markRealBtn").addEventListener("click", () => resolveSample(true));
  $("markFakeBtn").addEventListener("click", () => resolveSample(false));
  $("inventoryBtn").addEventListener("click", openInventory);
  $("closeInventoryBtn").addEventListener("click", closeInventory);
  $("sellCommonBtn").addEventListener("click", sellWeakCommon);
  $("nextChapterBtn").addEventListener("click", startNextChapter);
  $("confirmSelectionBtn").addEventListener("click", confirmFinalSelection);
  $("pauseBtn").addEventListener("click", pauseGame);
  $("resumeBtn").addEventListener("click", resumeGame);
  $("saveAndMenuBtn").addEventListener("click", saveAndMenu);
  $("restartBtn").addEventListener("click", restartGameConfirm);
  $("fullscreenBtn").addEventListener("click", toggleFullscreen);
  $("soundBtn").addEventListener("click", () => {
    state.sound = !state.sound;
    audio.setEnabled(state.sound);
    $("soundBtn").textContent = state.sound ? "♫" : "×";
    saveGame();
  });
  $("recordsBtn").addEventListener("click", openRecords);
  $("endingRecordsBtn").addEventListener("click", openRecords);
  $("closeRecordsBtn").addEventListener("click", closeRecords);
  $("clearRecordsBtn").addEventListener("click", () => {
    if (confirm("Smazat místní rekordy?")) {
      localStorage.removeItem(RECORDS_KEY);
      renderRecords();
    }
  });
  $("playAgainBtn").addEventListener("click", () => {
    screens.ending.classList.remove("visible");
    if (endingIsFinal) {
      state = defaultState();
      mode = "menu";
      audio.stopMusic();
      screens.title.classList.add("visible");
    } else restartFailedChapter();
  });
}

function boot() {
  refreshContinueButton();
  initThree();
  setupInput();
  bindUI();
  animate();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
}

try {
  boot();
} catch (error) {
  console.error(error);
  mode = "menu";
  setPlaying(false);
  const panel = document.querySelector("#titleScreen .title-panel");
  if (panel) {
    const warning = document.createElement("p");
    warning.className = "lead";
    warning.style.color = "#ffb2af";
    warning.textContent = "3D engine se nepodařilo spustit. Otevři hru přímo v Safari nebo Chrome a zkontroluj, zda je povolen WebGL.";
    panel.append(warning);
  }
}
