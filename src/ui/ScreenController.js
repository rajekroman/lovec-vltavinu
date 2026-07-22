const bindOnce = (element, handler) => {
  element.onclick = event => {
    event.preventDefault();
    handler(event);
  };
};

export class ScreenController {
  constructor(document) {
    this.document = document;
    this.app = this.element("app");
    this.hud = this.element("hud");
    this.controls = this.element("controls");
    this.activeId = null;
  }

  element(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`Missing UI element: #${id}`);
    return element;
  }

  show(id, options = {}) {
    for (const screen of this.document.querySelectorAll(".screen.visible")) screen.classList.remove("visible");
    const screen = id ? this.element(id) : null;
    screen?.classList.add("visible");
    this.activeId = id;
    const playing = options.playing ?? id === null;
    this.app.classList.toggle("playing", playing);
    this.hud.classList.toggle("hidden", !playing);
    this.controls.classList.toggle("hidden", !playing);
    return screen;
  }

  showTitle() {
    return this.show("titleScreen", { playing: false });
  }

  showBrief(level, totalLevels, onStart) {
    this.element("briefKicker").textContent = `LOKALITA ${level.order + 1} / ${totalLevels}`;
    this.element("briefTitle").textContent = level.title;
    this.element("briefText").textContent = level.briefing?.context ?? level.text;
    this.element("briefGoal").textContent = level.briefing?.goal ?? level.goal;
    bindOnce(this.element("briefButton"), onStart);
    return this.show("briefScreen", { playing: false });
  }

  showPause({ onResume, onMenu }) {
    bindOnce(this.element("resumeButton"), onResume);
    const menu = this.element("menuButton");
    menu.textContent = "ODEJÍT DO MENU";
    bindOnce(menu, onMenu);
    return this.show("pauseScreen", { playing: false });
  }

  showFatal({ title, text, onRetry }) {
    this.element("briefKicker").textContent = "CHYBA SPOUŠTĚNÍ";
    this.element("briefTitle").textContent = title;
    this.element("briefText").textContent = text;
    this.element("briefGoal").textContent = "Obnov stránku a zkus spuštění znovu.";
    const button = this.element("briefButton");
    button.textContent = "OBNOVIT";
    bindOnce(button, onRetry);
    return this.show("briefScreen", { playing: false });
  }

  play() {
    this.element("briefButton").textContent = "JDU NA TO";
    return this.show(null, { playing: true });
  }

  dispose() {
    for (const button of this.document.querySelectorAll("button")) button.onclick = null;
  }
}
