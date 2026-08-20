import { TileGrid } from "./TileGrid.js";
import { IsometricRenderer } from "./IsometricRenderer.js";
import { getGridLevel, getSpawnPoint, gridSizeToWorldBounds } from "./GridLevels.js";
import { TILE_SIZE } from "./TileDefinitions.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class GridScene {
  constructor(options) {
    this.app = options.app;
    this.events = options.events;
    this.renderer = options.renderer;
    this.THREE = options.three;
    this.screens = options.screens;
    this.session = options.session;
    this.levelId = options.levelId ?? "chlum";
    this.resetRuntime();
  }

  resetRuntime() {
    this.grid = null;
    this.isometricRenderer = null;
    this.visualRoot = null;
    this.playerGridX = 0;
    this.playerGridY = 0;
    this.playerMesh = null;
    this.playerDirection = 4;
    this.entities = new Map();
    this.npcs = new Map();
    this.digSites = new Map();
    this.documents = new Map();
    this.modal = null;
    this.resultShown = false;
  }

  async enter() {
    this.resetRuntime();
    this.session.enterLevel(this.levelId);
    this.grid = getGridLevel(this.levelId);
    if (!this.grid) throw new Error(`Unknown level: ${this.levelId}`);

    this.instantiateWorld();
    this.createVisualWorld();
    this.setCameraToPlayer();

    const levelDef = { title: `Úroveň ${this.levelId}`, goal: "Splň cíl úrovně" };
    this.screens.showBrief(levelDef, 4, () => this.beginPlaying());
  }

  instantiateWorld() {
    const worldEntity = this.app.world.create();
    this.app.world.set(worldEntity, "transform", {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    });

    const spawn = getSpawnPoint(this.levelId);
    this.playerGridX = spawn.gridX;
    this.playerGridY = spawn.gridY;

    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const meta = this.grid.metadata.get(`${x},${y}`);
        if (!meta) continue;

        const entity = this.app.world.create();
        this.entities.set(`${x},${y}`, entity);

        if (meta.type === "npc") {
          this.npcs.set(meta.npc, { entity, gridX: x, gridY: y });
        } else if (meta.type === "dig-site") {
          this.digSites.set(meta.index, { entity, gridX: x, gridY: y });
        } else if (meta.type === "document") {
          this.documents.set(meta.index, { entity, gridX: x, gridY: y });
        }
      }
    }
  }

  createVisualWorld() {
    const THREE = this.THREE;
    const root = new THREE.Group();
    root.name = `grid-scene-${this.levelId}`;

    this.isometricRenderer = new IsometricRenderer(THREE);
    const gridGroup = this.isometricRenderer.renderGrid(this.grid);
    root.add(gridGroup);

    this.createPlayerMesh();
    root.add(this.playerMesh);

    const lights = new THREE.Group();
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(-20, 20, 30);
    directional.castShadow = true;
    lights.add(ambient, directional);
    root.add(lights);

    this.visualRoot = root;
    this.renderer.add(root, "ground");
  }

  createPlayerMesh() {
    const THREE = this.THREE;
    const geometry = new THREE.CircleGeometry(6, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf4a460,
      roughness: 0.7,
      metalness: 0.2
    });
    this.playerMesh = new THREE.Mesh(geometry, material);
    this.playerMesh.castShadow = true;
    this.playerMesh.receiveShadow = true;
    this.playerMesh.name = "player-mesh";
    this.updatePlayerPosition();
  }

  updatePlayerPosition() {
    const { x, y } = this.grid.gridToIsometric(this.playerGridX, this.playerGridY);
    this.playerMesh.position.set(x, y, 4);
  }

  beginPlaying() {
    this.session.setPhase("playing");
    this.screens.play();
    this.app.input.reset("grid-scene-start");
  }

  updateControl(dt, time, input) {
    if (!input.actions.pause?.pressed || this.modal || this.resultShown) return;
    if (this.session.state.phase === "playing") this.pause();
    else if (this.session.state.phase === "paused") this.resume();
  }

  updateMovement(dt, time, input) {
    if (this.session.state.phase !== "playing" || this.modal || this.resultShown) return;

    const move = input.axes.move ?? { x: 0, y: 0 };
    if (move.x === 0 && move.y === 0) return;

    const newX = this.playerGridX + (move.x > 0 ? 1 : move.x < 0 ? -1 : 0);
    const newY = this.playerGridY + (move.y > 0 ? 1 : move.y < 0 ? -1 : 0);

    if (this.grid.isWalkable(newX, newY)) {
      this.playerGridX = newX;
      this.playerGridY = newY;
      this.updatePlayerPosition();
      this.setCameraToPlayer();

      this.playerDirection = this.getDirection(move.x, move.y);
    }
  }

  getDirection(dx, dy) {
    if (dy < 0) return dx > 0 ? 1 : dx < 0 ? 7 : 0;
    if (dy > 0) return dx > 0 ? 3 : dx < 0 ? 5 : 4;
    return dx > 0 ? 2 : dx < 0 ? 6 : this.playerDirection;
  }

  updateGameplay(dt, time, input) {
    if (this.session.state.phase !== "playing" || this.modal || this.resultShown) return;

    if (input.actions.action?.pressed === true) {
      this.tryInteract();
    }
  }

  tryInteract() {
    const adjacentCells = this.grid.getNeighbors(this.playerGridX, this.playerGridY, true);

    for (const { x, y } of adjacentCells) {
      const meta = this.grid.metadata.get(`${x},${y}`);
      if (!meta) continue;

      if (meta.type === "dig-site") {
        this.performDig(x, y, meta.index);
        return;
      } else if (meta.type === "npc") {
        this.performNPCDialog(meta.npc);
        return;
      } else if (meta.type === "document") {
        this.collectDocument(meta.index);
        return;
      }
    }

    this.app.input.reset("grid-interact-fail");
  }

  performDig(gridX, gridY, siteIndex) {
    const site = this.digSites.get(siteIndex);
    if (!site) return;

    this.screens.showDig({
      title: `Vykopávka ${siteIndex + 1}`,
      requiredHits: 3,
      onAction: () => this.completeDig(siteIndex)
    });
  }

  completeDig(siteIndex) {
    const site = this.digSites.get(siteIndex);
    if (!site) return;

    this.screens.show(null, { playing: true });
    this.emitDugEvent(site.gridX, site.gridY);
    this.app.input.reset("grid-dig-complete");
  }

  emitDugEvent(gridX, gridY) {
    this.events.emit("dig:hit", {
      position: this.grid.gridToIsometric(gridX, gridY)
    });
    this.events.emit("dig:clean", {});
  }

  performNPCDialog(npcId) {
    this.modal = "dialog";
    const dialogText = {
      "farmer-vaclav": "Vítej na poli! Hledáš vltavíny?",
      "forester-jan": "V lese můžeš pracovat jen na vyznačených místech.",
      "rival-karel": "Slabo! Já bych to zvládl lépe.",
      "expert-eva": "Máš zajímavé nálezy!",
      "thief-franta": "Psst, podívej se sem..."
    };

    this.screens.showDialog({
      name: npcId.toUpperCase(),
      text: dialogText[npcId] || "Ahoj!",
      avatar: npcId[0].toUpperCase(),
      buttonLabel: "OK",
      onConfirm: () => {
        this.modal = null;
        this.screens.show(null, { playing: true });
      }
    });
  }

  collectDocument(docIndex) {
    const doc = this.documents.get(docIndex);
    if (!doc) return;

    this.screens.show(null, { playing: true });
    this.documents.delete(docIndex);
    this.events.emit("document:collected", { index: docIndex });
    this.app.input.reset("grid-collect-doc");
  }

  pause() {
    this.session.setPhase("paused");
    this.screens.showPause({
      onResume: () => this.resume(),
      onMenu: () => this.app.changeScene("title"),
      placeLabel: this.levelId,
      objective: "Prozkoumej lokalitu",
      progress: 0.5
    });
  }

  resume() {
    this.session.setPhase("playing");
    this.screens.show(null, { playing: true });
  }

  setCameraToPlayer() {
    const { x, y } = this.grid.gridToIsometric(this.playerGridX, this.playerGridY);
    const cameraZ = Math.max(120, this.grid.width * TILE_SIZE / 3);
    if (this.renderer.camera) {
      this.renderer.camera.position.set(x, y - 40, cameraZ);
      this.renderer.camera.lookAt(x, y, 0);
    }
  }

  destroyVisualWorld() {
    if (this.visualRoot) {
      this.renderer.remove(this.visualRoot);
      this.renderer.disposeObject(this.visualRoot);
      this.visualRoot = null;
    }
    if (this.isometricRenderer) {
      this.isometricRenderer.dispose();
      this.isometricRenderer = null;
    }
  }

  exit() {
    this.modal = null;
    this.app.input.reset("grid-exit");
    this.destroyVisualWorld();
    this.app.world.clear();
    this.app.collisions.reset();
  }

  dispose() {
    this.exit();
  }

  snapshot() {
    return {
      levelId: this.levelId,
      playerGridX: this.playerGridX,
      playerGridY: this.playerGridY,
      playerDirection: this.playerDirection,
      phase: this.session.state.phase,
      digSites: this.digSites.size,
      documents: this.documents.size
    };
  }
}
