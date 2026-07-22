export class HudController {
  constructor(options) {
    this.document = options.document;
    this.events = options.events;
    this.revision = -1;
    this.unsubscribe = this.events.on("hud:model:changed", payload => this.render(payload));
  }

  render({ revision, model }) {
    if (revision <= this.revision) return;
    this.revision = revision;
    this.document.getElementById("missionNumber").textContent = String(model.missionNumber ?? 1);
    this.document.getElementById("placeLabel").textContent = String(model.placeLabel ?? "").toUpperCase();
    this.document.getElementById("objectiveLabel").textContent = model.objective ?? "";
    this.document.getElementById("bagValue").textContent = String(model.findings ?? 0);
    const danger = Math.max(0, Math.min(1, Number(model.danger) || 0));
    this.document.getElementById("heatFill").style.width = `${danger * 100}%`;
    this.document.getElementById("dangerMeterText").textContent = danger >= 0.75
      ? "POPLACH"
      : danger >= 0.35 ? "POZOR" : "KLID";
    const hint = this.document.getElementById("hint");
    hint.textContent = model.hint ?? "";
    hint.classList.toggle("hidden", !model.hint);
    const action = this.document.getElementById("actionButton");
    action.classList.toggle("ready", Boolean(model.actionReady));
    this.document.getElementById("actionText").textContent = model.actionLabel ?? "AKCE";
  }

  dispose() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
