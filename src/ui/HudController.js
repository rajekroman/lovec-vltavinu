const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const fingerprint = (revision, model) => `${revision}:${JSON.stringify(model ?? {})}`;

export class HudController {
  constructor(options) {
    this.document = options.document;
    this.events = options.events;
    this.revision = -1;
    this.lastFingerprint = "";
    this.elements = {
      app: this.require("app"),
      hud: this.require("hud"),
      missionNumber: this.require("missionNumber"),
      placeLabel: this.require("placeLabel"),
      objectiveLabel: this.require("objectiveLabel"),
      bagValue: this.require("bagValue"),
      dangerMeter: this.require("heatPill"),
      dangerMeterText: this.require("dangerMeterText"),
      dangerFill: this.require("heatFill"),
      dangerBanner: this.require("dangerBanner"),
      dangerText: this.require("dangerText"),
      hint: this.require("hint"),
      action: this.require("actionButton"),
      actionIcon: this.require("actionIcon"),
      actionText: this.require("actionText")
    };
    this.installAccessibilityContracts();
    this.unsubscribe = this.events.on("hud:model:changed", payload => this.render(payload));
  }

  require(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`Missing HUD element: #${id}`);
    return element;
  }

  installAccessibilityContracts() {
    const elements = this.elements;
    elements.dangerMeter.setAttribute("role", "progressbar");
    elements.dangerBanner.setAttribute("role", "status");
    elements.dangerBanner.setAttribute("aria-live", "polite");
    elements.action.removeAttribute?.("aria-pressed");
  }

  render({ revision, model }) {
    if (!Number.isFinite(revision) || !model || typeof model !== "object") return;
    const nextFingerprint = fingerprint(revision, model);
    if (nextFingerprint === this.lastFingerprint) return;
    this.lastFingerprint = nextFingerprint;
    this.revision = revision;

    const elements = this.elements;
    elements.missionNumber.textContent = String(model.missionNumber ?? 1);
    elements.placeLabel.textContent = String(model.placeLabel ?? "").toUpperCase();
    elements.objectiveLabel.textContent = String(model.objective ?? "");
    elements.bagValue.textContent = String(Math.max(0, Number(model.findings) || 0));

    const danger = clamp01(model.danger);
    const warning = danger >= 0.35;
    const detected = danger >= 0.75;
    const critical = danger >= 0.9;
    const dangerState = critical ? "KRITICKÉ" : detected ? "POPLACH" : warning ? "POZOR" : "KLID";
    elements.dangerFill.style.width = `${Math.round(danger * 1000) / 10}%`;
    elements.dangerMeterText.textContent = dangerState;
    elements.dangerMeter.classList.toggle("warning", warning && !detected);
    elements.dangerMeter.classList.toggle("detected", detected);
    elements.dangerMeter.classList.toggle("critical", critical);
    elements.dangerMeter.setAttribute("aria-valuemin", "0");
    elements.dangerMeter.setAttribute("aria-valuemax", "100");
    elements.dangerMeter.setAttribute("aria-valuenow", String(Math.round(danger * 100)));
    elements.dangerMeter.setAttribute("aria-valuetext", dangerState);

    const dangerMessage = String(model.dangerMessage ?? (detected ? "TRAKTOR JE BLÍZKO" : ""));
    elements.dangerText.textContent = dangerMessage;
    elements.dangerBanner.classList.toggle("hidden", !dangerMessage);
    elements.dangerBanner.setAttribute("aria-hidden", dangerMessage ? "false" : "true");
    elements.app.classList.toggle("danger-state", detected);
    elements.hud.classList.toggle("danger-shake", critical);

    const hint = String(model.hint ?? "");
    elements.hint.textContent = hint;
    elements.hint.classList.toggle("hidden", !hint);

    const actionLabel = String(model.actionLabel ?? "AKCE");
    const actionReady = Boolean(model.actionReady);
    elements.action.classList.toggle("ready", actionReady);
    elements.action.setAttribute("aria-label", actionLabel);
    elements.action.setAttribute("aria-disabled", actionReady ? "false" : "true");
    elements.action.setAttribute("data-action-ready", actionReady ? "true" : "false");
    elements.actionIcon.textContent = String(model.actionIcon ?? "◉");
    elements.actionText.textContent = actionLabel;
  }

  dispose() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.lastFingerprint = "";
    this.elements.app.classList.remove("danger-state");
    this.elements.hud.classList.remove("danger-shake");
  }
}
