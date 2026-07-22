import { LEVEL_ORDER, getLevelDefinition } from "../data/levels.js";
import { evaluateObjective } from "../gameplay/Objectives.js";

export class ChlumScene {
  constructor(options) {
    this.app = options.app;
    this.events = options.events;
    this.renderer = options.renderer;
    this.THREE = options.three;
    this.screens = options.screens;
    this.session = options.session;
    this.level = getLevelDefinition("chlum");
    this.visualRoot = null;
    this.hudRevision = 0;
    this.hudSignature = "";
  }

  async enter() {
    this.session.enterLevel(this.level.id);
    this.createVisualSkeleton();
    const centerX = this.level.bounds.x + this.level.bounds.width / 2;
    const centerY = this.level.bounds.y + this.level.bounds.height / 2;
    this.renderer.setCameraCenter(centerX, centerY, 0.72);
    this.screens.showBrief(this.level, LEVEL_ORDER.length, () => this.beginPlaying());
    this.emitHud(true);
  }

  beginPlaying() {
    this.session.setPhase("playing");
    this.screens.play();
    this.emitHud(true);
  }

  updateControl(_dt, _time, input) {
    if (!input.actions.pause?.pressed) return;
    if (this.session.state.phase === "playing") this.pause();
    else if (this.session.state.phase === "paused") this.resume();
  }

  updateCollisions() {
    if (this.session.state.phase !== "playing") return;
    this.app.collisions.update(this.app.world);
  }

  updateAnimations(dt) {
    if (this.session.state.phase !== "playing") return;
    this.app.animations.update(this.app.world, dt);
  }

  updateHud() {
    this.emitHud(false);
  }

  render(alpha) {
    this.renderer.syncWorld(this.app.world, alpha);
  }

  pause() {
    this.session.setPhase("paused");
    this.app.input.reset("pause-overlay");
    this.screens.showPause({
      onResume: () => this.resume(),
      onMenu: () => {
        void this.app.changeScene("title").catch(error => console.error("Scene transition:", error));
      }
    });
    this.emitHud(true);
  }

  resume() {
    this.session.setPhase("playing");
    this.app.input.reset("resume-overlay");
    this.screens.play();
    this.emitHud(true);
  }

  objectiveSnapshot() {
    return evaluateObjective(this.level.id, {
      permit: this.session.state.flags.chlumPermission === true,
      digHits: 0,
      findings: this.session.state.findings.length
    });
  }

  hudModel() {
    const objective = this.objectiveSnapshot();
    return {
      missionNumber: this.level.order + 1,
      placeLabel: this.level.name,
      objective: objective.text,
      findings: this.session.state.findings.length,
      danger: this.session.state.danger / 100,
      hint: this.session.state.phase === "playing"
        ? "Chlum gameplay bude připojen v samostatném vertical-slice PR."
        : "",
      actionReady: false,
      actionLabel: "AKCE"
    };
  }

  emitHud(force) {
    const model = this.hudModel();
    const signature = JSON.stringify(model);
    if (!force && signature === this.hudSignature) return;
    this.hudSignature = signature;
    this.events.emit("hud:model:changed", { revision: ++this.hudRevision, model });
  }

  createVisualSkeleton() {
    this.destroyVisualSkeleton();
    const group = new this.THREE.Group();
    group.name = "chlum-integration-skeleton";

    const ground = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(this.level.bounds.width, this.level.bounds.height),
      new this.THREE.MeshBasicMaterial({ color: 0x655437 })
    );
    ground.position.set(
      this.level.bounds.x + this.level.bounds.width / 2,
      this.level.bounds.y + this.level.bounds.height / 2,
      -2
    );
    group.add(ground);

    for (let index = 0; index < 10; index++) {
      const strip = new this.THREE.Mesh(
        new this.THREE.PlaneGeometry(this.level.bounds.width * 0.92, 18),
        new this.THREE.MeshBasicMaterial({ color: index % 2 ? 0x796744 : 0x57472f })
      );
      strip.position.set(
        this.level.bounds.x + this.level.bounds.width / 2,
        this.level.bounds.y + 100 + index * 100,
        -1
      );
      group.add(strip);
    }

    this.visualRoot = group;
    this.renderer.add(group, "ground");
  }

  destroyVisualSkeleton() {
    if (!this.visualRoot) return;
    this.renderer.remove(this.visualRoot);
    this.renderer.disposeObject(this.visualRoot);
    this.visualRoot = null;
  }

  snapshot() {
    return {
      level: this.level.id,
      session: this.session.state,
      objective: this.objectiveSnapshot()
    };
  }

  async exit() {
    this.destroyVisualSkeleton();
    this.app.world.clear();
    this.app.collisions.reset();
    this.hudSignature = "";
  }

  async dispose() {
    await this.exit();
  }
}
