import { DIG_REQUIRED_HITS } from "../data/levels.js";
import { buildJournalView } from "./GameStatusPresenters.js";

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

const bindOnce = (element, handler) => {
  element.disabled = false;
  element.setAttribute("aria-disabled", "false");
  element.onclick = event => {
    event.preventDefault();
    handler?.(event);
  };
};

export class ScreenController {
  constructor(document, { session = null, audio = null } = {}) {
    this.document = document;
    this.app = this.element("app");
    this.hud = this.element("hud");
    this.controls = this.element("controls");
    this.activeId = null;
    this.session = session;
    this.audio = audio;
  }

  element(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`Missing UI element: #${id}`);
    return element;
  }

  show(id, options = {}) {
    for (const screen of this.document.querySelectorAll(".screen")) {
      const active = screen.id === id;
      screen.classList.toggle("visible", active);
      screen.setAttribute("aria-hidden", active ? "false" : "true");
      if ("inert" in screen) screen.inert = !active;
    }

    const screen = id ? this.element(id) : null;
    this.activeId = id;
    const playing = options.playing ?? id === null;
    this.app.classList.toggle("playing", playing);
    this.hud.classList.toggle("hidden", !playing);
    this.controls.classList.toggle("hidden", !playing);
    this.hud.setAttribute("aria-hidden", playing ? "false" : "true");
    this.controls.setAttribute("aria-hidden", playing ? "false" : "true");
    screen?.querySelector?.("button:not([disabled])")?.focus?.({ preventScroll: true });
    return screen;
  }

  showTitle() {
    return this.show("titleScreen", { playing: false });
  }

  showBrief(level, totalLevels, onStart) {
    this.element("briefKicker").textContent = `LOKALITA ${level.order + 1} / ${totalLevels}`;
    this.element("briefTitle").textContent = level.title;
    this.element("briefText").textContent = level.briefing?.context ?? level.text ?? "";
    this.element("briefGoal").textContent = level.briefing?.goal ?? level.goal ?? "";
    const button = this.element("briefButton");
    button.textContent = "JDU NA TO";
    bindOnce(button, onStart);
    return this.show("briefScreen", { playing: false });
  }

  showDialog({ name, text, avatar = "?", buttonLabel = "DOBŘE", onConfirm }) {
    this.element("dialogName").textContent = String(name ?? "").toUpperCase();
    this.element("dialogText").textContent = String(text ?? "");
    this.element("dialogAvatar").textContent = String(avatar ?? "?").slice(0, 2).toUpperCase();
    const button = this.element("dialogButton");
    button.textContent = buttonLabel;
    bindOnce(button, onConfirm);
    return this.show("dialogScreen", { playing: false });
  }

  showDig(options = {}) {
    this.element("digTitle").textContent = options.title ?? "Drž rytmus lopaty";
    const button = this.element("digButton");
    button.textContent = options.buttonLabel ?? "KOPNOUT";
    bindOnce(button, options.onAction);
    this.updateDig(options);
    return this.show("digScreen", { playing: false });
  }

  updateDig(options = {}) {
    const requiredHits = options.requiredHits ?? DIG_REQUIRED_HITS;
    if (requiredHits !== DIG_REQUIRED_HITS) {
      throw new RangeError(`requiredHits must be literal ${DIG_REQUIRED_HITS}.`);
    }

    const hits = Math.max(0, Math.min(DIG_REQUIRED_HITS, Math.trunc(Number(options.hits) || 0)));
    const marker = clamp01(options.marker);
    const sweetMin = clamp01(options.sweetMin ?? 0.4);
    const sweetMax = clamp01(options.sweetMax ?? 0.6);
    if (sweetMin >= sweetMax) throw new RangeError("Dig sweet spot must satisfy sweetMin < sweetMax.");

    this.element("digInfo").textContent = String(options.info ?? "Klepni, když je ukazatel v zeleném poli.");
    const symbols = Array.from({ length: DIG_REQUIRED_HITS }, (_, index) => index < hits ? "◆" : "◇").join(" ");
    const hitSummary = `ZÁSAHY ${hits}/${DIG_REQUIRED_HITS}`;
    const hitsElement = this.element("digHits");
    this.element("digHitCount").textContent = hitSummary;
    this.element("digHitSymbols").textContent = symbols;
    hitsElement.setAttribute("aria-label", `${hitSummary}; ${hits === DIG_REQUIRED_HITS ? "kopání dokončeno" : "drž rytmus pro další zásah"}`);
    this.element("digMarker").style.left = `calc(${marker * 100}% - 5px)`;
    const sweetZone = this.element("sweetZone");
    sweetZone.style.left = `${sweetMin * 100}%`;
    sweetZone.style.width = `${(sweetMax - sweetMin) * 100}%`;
    const button = this.element("digButton");
    button.disabled = Boolean(options.disabled);
    button.setAttribute("aria-label", `${button.textContent}; zásahy ${hits} z ${DIG_REQUIRED_HITS}`);
    button.setAttribute("aria-disabled", button.disabled ? "true" : "false");
  }

  showLevelResult({ kicker = "ÚROVEŇ DOKONČENA", title, text, score = 0, stats = [], buttonLabel = "POKRAČOVAT", onContinue }) {
    const resultScreen = this.element("resultScreen");
    resultScreen.setAttribute("role", "dialog");
    resultScreen.setAttribute("aria-modal", "true");
    resultScreen.setAttribute("aria-labelledby", "resultTitle");
    resultScreen.setAttribute("aria-describedby", "resultText");
    resultScreen.setAttribute("aria-live", "polite");
    resultScreen.setAttribute("aria-busy", "true");

    this.element("resultKicker").textContent = kicker;
    this.element("resultTitle").textContent = String(title ?? "Výprava pokračuje");
    this.element("resultText").textContent = String(text ?? "");
    const normalizedScore = Math.max(0, Number(score) || 0);
    const scoreElement = this.element("resultScore");
    scoreElement.textContent = String(normalizedScore);
    scoreElement.setAttribute("aria-label", `${normalizedScore} bodů`);

    const container = this.element("resultStats");
    container.setAttribute("role", "list");
    container.replaceChildren(...stats.map(stat => {
      const item = this.document.createElement("div");
      item.setAttribute("role", "listitem");
      const label = this.document.createElement("span");
      const value = this.document.createElement("strong");
      label.textContent = String(stat.label ?? "");
      value.textContent = String(stat.value ?? "");
      item.append(label, value);
      return item;
    }));

    const button = this.element("againButton");
    button.textContent = buttonLabel;
    bindOnce(button, onContinue);
    resultScreen.setAttribute("aria-busy", "false");
    return this.show("resultScreen", { playing: false });
  }

  showJurySelection({ findings = [], selectedFindingIds = [], required = 4, onSelectionChange, onSubmit }) {
    const selected = new Set(selectedFindingIds);
    const list = this.element("juryFindingList");
    const status = this.element("jurySelectionStatus");
    const submit = this.element("jurySubmitButton");
    const update = () => {
      status.textContent = `VYBRÁNO ${selected.size}/${required}`;
      submit.disabled = selected.size !== required;
      submit.setAttribute("aria-disabled", submit.disabled ? "true" : "false");
      onSelectionChange?.([...selected]);
    };
    list.replaceChildren(...findings.map(finding => {
      const label = this.document.createElement("label");
      label.className = "jury-finding-option";
      const input = this.document.createElement("input");
      input.type = "checkbox";
      input.value = finding.findingId;
      input.checked = selected.has(finding.findingId);
      input.onchange = () => {
        if (input.checked && selected.size >= required) input.checked = false;
        if (input.checked) selected.add(finding.findingId);
        else selected.delete(finding.findingId);
        update();
      };
      const text = this.document.createElement("span");
      text.textContent = `${String(finding.locality).toUpperCase()} · ${finding.rarity} · ${finding.score} bodů`;
      label.append(input, text);
      return label;
    }));
    submit.onclick = event => {
      event.preventDefault();
      if (selected.size === required) onSubmit?.([...selected]);
    };
    update();
    return this.show("juryScreen", { playing: false });
  }

  showPause({ onResume, onMenu, placeLabel = "", objective = "", progress = 0 }) {
    const percentage = Math.round(clamp01(progress) * 100);
    this.element("pausePlace").textContent = placeLabel ? `${String(placeLabel).toUpperCase()} · PAUZA` : "PAUZA";
    this.element("pauseObjective").textContent = String(objective || "Výprava čeká na další krok.");
    const progressElement = this.element("pauseProgress");
    progressElement.textContent = `POSTUP ${percentage} %`;
    progressElement.setAttribute("role", "progressbar");
    progressElement.setAttribute("aria-label", "Postup úkolu");
    progressElement.setAttribute("aria-valuemin", "0");
    progressElement.setAttribute("aria-valuemax", "100");
    progressElement.setAttribute("aria-valuenow", String(percentage));
    progressElement.setAttribute("aria-valuetext", `${percentage} %`);
    bindOnce(this.element("resumeButton"), onResume);
    const menu = this.element("menuButton");
    menu.textContent = "ODEJÍT DO MENU";
    bindOnce(menu, onMenu);
    bindOnce(this.element("journalButton"), () => this.showJournal({ onClose: onResume }));
    bindOnce(this.element("pauseStoryButton"), () => this.showStory({ onClose: onResume }));
    bindOnce(this.element("pauseSettingsButton"), () => this.showSettings({ onClose: onResume }));
    return this.show("pauseScreen", { playing: false });
  }

  showJournal({ onClose } = {}) {
    const { entries } = buildJournalView(this.session);

    const list = this.element("journalList");
    list.replaceChildren(...entries.map(entry => {
      const row = this.document.createElement("div");
      const badge = this.document.createElement("b");
      badge.textContent = entry.badge;
      const title = this.document.createElement("strong");
      title.textContent = entry.title;
      const status = this.document.createElement("p");
      status.textContent = entry.status;
      row.append(badge, title, status);
      return row;
    }));

    const button = this.element("journalCloseButton");
    button.textContent = "ZPĚT";
    bindOnce(button, onClose);
    return this.show("journalScreen", { playing: false });
  }

  showSettings({ onClose } = {}) {
    const audio = this.audio;
    const snapshot = audio?.snapshot?.() ?? { volume: 1, musicVolume: 0.34, effectsVolume: 0.72, muted: false };

    const masterRange = this.element("masterVolumeRange");
    const musicRange = this.element("musicVolumeRange");
    const effectsRange = this.element("effectsVolumeRange");
    const mutedCheckbox = this.element("mutedCheckbox");
    masterRange.value = String(Math.round(snapshot.volume * 100));
    musicRange.value = String(Math.round(snapshot.musicVolume * 100));
    effectsRange.value = String(Math.round(snapshot.effectsVolume * 100));
    mutedCheckbox.checked = snapshot.muted === true;
    masterRange.oninput = () => audio?.setVolume?.(Number(masterRange.value) / 100);
    musicRange.oninput = () => audio?.setMusicVolume?.(Number(musicRange.value) / 100);
    effectsRange.oninput = () => audio?.setEffectsVolume?.(Number(effectsRange.value) / 100);
    mutedCheckbox.onchange = () => audio?.setMuted?.(mutedCheckbox.checked);

    const root = this.document.documentElement;
    const highContrastCheckbox = this.element("highContrastCheckbox");
    const largeTextCheckbox = this.element("largeTextCheckbox");
    const colorBlindSelect = this.element("colorBlindSelect");
    highContrastCheckbox.checked = root?.classList?.contains("high-contrast") === true;
    largeTextCheckbox.checked = root?.classList?.contains("large-text") === true;
    colorBlindSelect.value = root?.getAttribute?.("data-colorblind") ?? "none";
    highContrastCheckbox.onchange = () => root?.classList?.toggle("high-contrast", highContrastCheckbox.checked);
    largeTextCheckbox.onchange = () => root?.classList?.toggle("large-text", largeTextCheckbox.checked);
    colorBlindSelect.onchange = () => {
      if (colorBlindSelect.value === "none") root?.removeAttribute?.("data-colorblind");
      else root?.setAttribute?.("data-colorblind", colorBlindSelect.value);
    };

    const button = this.element("settingsCloseButton");
    button.textContent = "ZPĚT";
    bindOnce(button, onClose);
    return this.show("settingsScreen", { playing: false });
  }

  showStory({ onClose } = {}) {
    const button = this.element("storyCloseButton");
    button.textContent = "ZPĚT";
    bindOnce(button, onClose);
    return this.show("storyScreen", { playing: false });
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

  showFinding({ text = "Nález", icon = "🔑", score = 0, perfect = false }) {
    const perfectionText = perfect ? " ⭐" : "";

    this.element("dialogName").textContent = `${icon} NÁLEZ`;
    this.element("dialogText").textContent = `${text}\n+${score} bodů${perfectionText}`;
    this.element("dialogAvatar").textContent = icon;
    const button = this.element("dialogButton");
    button.textContent = "POKRAČOVAT";
    bindOnce(button, () => {});

    const screen = this.show("dialogScreen", { playing: false });
    this.showScorePopup(score);
    return screen;
  }

  showScorePopup(score) {
    const popup = this.document.createElement("div");
    popup.className = "score-popup";
    popup.textContent = `+${score}`;
    popup.style.left = "50%";
    popup.style.top = "50%";
    const container = this.document.getElementById("app");
    if (container) {
      container.appendChild(popup);
      popup.offsetHeight;
      popup.addEventListener("animationend", () => popup.remove(), { once: true });
    }
  }

  animateFindingsCounter() {
    const counter = this.document.querySelector(".findings-counter");
    if (!counter) return;
    counter.classList.remove("new-finding");
    counter.offsetHeight;
    counter.classList.add("new-finding");
  }

  animateHealthDamage() {
    const hearts = this.document.querySelector(".health-hearts");
    if (!hearts) return;
    hearts.classList.remove("damage");
    hearts.offsetHeight;
    hearts.classList.add("damage");
  }

  showDanger(message = "⚠️ Nebezpečí!", onDismiss) {
    this.element("dialogName").textContent = "⚠️ NEBEZPEČÍ";
    this.element("dialogText").textContent = message;
    this.element("dialogAvatar").textContent = "⚠";
    const button = this.element("dialogButton");
    button.textContent = "POCHOPENO";
    bindOnce(button, onDismiss);
    return this.show("dialogScreen", { playing: false });
  }

  play() {
    const activeElement = this.document.activeElement;
    if (activeElement?.closest?.(".screen")) activeElement.blur?.();
    return this.show(null, { playing: true });
  }

  dispose() {
    for (const button of this.document.querySelectorAll("button")) button.onclick = null;
  }
}
