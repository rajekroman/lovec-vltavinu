import type { EventBus } from "../core/events/EventBus";
import type { GameEvents } from "../core/events/GameEvents";
import type { LevelDefinition } from "../game/levels/LevelData";
import type { JuryResult } from "../game/systems/FinalJury";

export interface HudCallbacks {
  onStart: () => void;
  onRetryLoad?: () => void;
  onPauseToggle: () => void;
}

export class HudController {
  private readonly objectiveText: HTMLElement;
  private readonly interactionHint: HTMLElement;
  private readonly interactionText: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly permissionStatus: HTMLElement;
  private readonly locationName: HTMLElement;
  private readonly foundStatus: HTMLElement;
  private readonly dangerStatus: HTMLElement;
  private readonly dangerText: HTMLElement;
  private readonly dangerValue: HTMLElement;
  private readonly dialogPanel: HTMLElement;
  private readonly dialogSpeaker: HTMLElement;
  private readonly dialogText: HTMLElement;
  private readonly diggingPanel: HTMLElement;
  private readonly rhythmCursor: HTMLElement;
  private readonly diggingScore: HTMLElement;
  private readonly diggingMisses: HTMLElement;
  private readonly diggingFeedback: HTMLElement;
  private readonly diggingPips: HTMLElement[];
  private readonly introScreen: HTMLElement;
  private readonly briefingChapter: HTMLElement;
  private readonly briefingTitle: HTMLElement;
  private readonly briefingCopy: HTMLElement;
  private readonly briefingGoal: HTMLElement;
  private readonly loadingStatus: HTMLElement;
  private readonly juryResult: HTMLElement;
  private readonly briefingControls: HTMLElement;
  private readonly startButton: HTMLButtonElement;
  private readonly pauseScreen: HTMLElement;
  private readonly unsubscribers: Array<() => void> = [];
  private toastTimer: number | null = null;
  private dialogTimer: number | null = null;
  private started = false;
  private retryLoad = false;
  private interactionFocused = false;

  constructor(
    root: HTMLElement,
    events: EventBus<GameEvents>,
    callbacks: HudCallbacks,
  ) {
    this.objectiveText = this.requireElement(root, "#objective-text");
    this.locationName = this.requireElement(root, "#location-name");
    this.foundStatus = this.requireElement(root, "#found-status");
    this.dangerStatus = this.requireElement(root, "#danger-status");
    this.dangerText = this.requireElement(root, "#danger-text");
    this.dangerValue = this.requireElement(root, "#danger-value");
    this.interactionHint = this.requireElement(root, "#interaction-hint");
    this.interactionText = this.requireElement(root, "#interaction-text");
    this.toast = this.requireElement(root, "#toast");
    this.permissionStatus = this.requireElement(root, "#permission-status");
    this.dialogPanel = this.requireElement(root, "#dialog-panel");
    this.dialogSpeaker = this.requireElement(root, "#dialog-speaker");
    this.dialogText = this.requireElement(root, "#dialog-text");
    this.diggingPanel = this.requireElement(root, "#digging-panel");
    this.rhythmCursor = this.requireElement(root, "#rhythm-cursor");
    this.diggingScore = this.requireElement(root, "#digging-score");
    this.diggingMisses = this.requireElement(root, "#digging-misses");
    this.diggingFeedback = this.requireElement(root, "#digging-feedback");
    this.diggingPips = [
      ...this.requireElement(root, "#digging-pips").querySelectorAll<HTMLElement>("span"),
    ];
    this.introScreen = this.requireElement(root, "#intro-screen");
    this.briefingChapter = this.requireElement(root, "#briefing-chapter");
    this.briefingTitle = this.requireElement(root, "#briefing-title");
    this.briefingCopy = this.requireElement(root, "#briefing-copy");
    this.briefingGoal = this.requireElement(root, "#briefing-goal-text");
    this.loadingStatus = this.requireElement(root, "#loading-status");
    this.juryResult = this.requireElement(root, "#jury-result");
    this.briefingControls = this.requireElement(root, "#briefing-controls");
    this.pauseScreen = this.requireElement(root, "#pause-screen");

    const startButton = this.requireElement<HTMLButtonElement>(root, "#start-button");
    this.startButton = startButton;
    const pauseButton = this.requireElement<HTMLButtonElement>(root, "#pause-button");
    const resumeButton = this.requireElement<HTMLButtonElement>(root, "#resume-button");

    startButton.addEventListener("click", () => {
      if (this.retryLoad) {
        this.retryLoad = false;
        callbacks.onRetryLoad?.();
        return;
      }

      this.started = true;
      this.introScreen.hidden = true;
      callbacks.onStart();
    });
    pauseButton.addEventListener("click", callbacks.onPauseToggle);
    resumeButton.addEventListener("click", callbacks.onPauseToggle);

    this.unsubscribers.push(
      events.on("assets:progress", ({ loaded, total }) => {
        this.loadingStatus.hidden = false;
        this.loadingStatus.textContent = `Načítám herní svět… ${loaded}/${total}`;
        this.startButton.disabled = true;
      }),
      events.on("interaction:focusChanged", ({ entityId, label }) => {
        this.interactionFocused = entityId !== null;
        this.interactionHint.hidden = !this.interactionFocused;
        this.interactionText.textContent = label ?? "Prozkoumat";
      }),
      events.on("objective:changed", ({ text }) => {
        this.objectiveText.textContent = text;
      }),
      events.on("collectible:found", ({ score }) => {
        const current = Number(this.foundStatus.dataset.count ?? "0") + 1;
        const totalScore = Number(this.foundStatus.dataset.score ?? "0") + score;
        this.setCollectionStatus(current, totalScore);
      }),
      events.on("permission:changed", ({ granted }) => {
        this.permissionStatus.textContent = granted ? "Povolení uděleno" : "Bez povolení";
        this.permissionStatus.classList.toggle("is-granted", granted);
        this.permissionStatus.classList.remove("is-certified");
      }),
      events.on("collection:certified", ({ stoneCount, localityCount }) => {
        this.permissionStatus.textContent = "Certifikace vystavena";
        this.permissionStatus.classList.remove("is-granted");
        this.permissionStatus.classList.add("is-certified");
        this.showToast(
          `Certifikace: ${stoneCount} ${stoneCount === 1 ? "kámen" : "kameny"}, ${localityCount} ${localityCount === 1 ? "lokalita" : "lokality"}.`,
          3200,
        );
      }),
      events.on("danger:changed", ({ active, label, value }) => {
        this.dangerStatus.hidden = !active;
        this.dangerText.textContent = label;
        const percent = Math.round(value * 100);
        this.dangerValue.textContent = `${percent}%`;
        this.dangerStatus.style.setProperty("--danger-progress", `${percent}%`);
        this.dangerStatus.dataset.level = percent >= 82 ? "critical" : "warning";
      }),
      events.on("dialog:shown", ({ speaker, text, durationMs }) => {
        this.showDialog(speaker, text, durationMs ?? 4000);
      }),
      events.on("digging:stateChanged", (state) => {
        this.diggingPanel.hidden = !state.active;
        this.diggingPanel.dataset.feedback = state.feedback;
        this.rhythmCursor.style.left = `${state.cursor * 100}%`;
        this.diggingScore.textContent = `${state.hits} / ${state.requiredHits}`;
        this.diggingMisses.textContent = `Minutí: ${state.misses}`;
        this.diggingFeedback.textContent =
          state.feedback === "hit"
            ? "Přesný zásah"
            : state.feedback === "miss"
              ? "Mimo rytmus"
              : "Stiskněte AKCE ve středu";
        this.interactionHint.hidden = state.active || !this.interactionFocused;

        this.diggingPips.forEach((pip, index) => {
          pip.classList.toggle("is-hit", index < state.hits);
        });
      }),
      events.on("ui:toastRequested", ({ text, durationMs }) => {
        this.showToast(text, durationMs ?? 2500);
      }),
      events.on("game:pauseChanged", ({ paused }) => {
        this.pauseScreen.hidden = !paused || !this.started;
      }),
    );
  }

  showBriefing(level: LevelDefinition): void {
    this.started = false;
    this.retryLoad = false;
    this.pauseScreen.hidden = true;
    this.interactionFocused = false;
    this.interactionHint.hidden = true;
    this.diggingPanel.hidden = true;
    this.dialogPanel.hidden = true;
    this.dangerStatus.hidden = true;
    this.dangerValue.textContent = "0%";
    this.dangerStatus.style.setProperty("--danger-progress", "0%");
    delete this.dangerStatus.dataset.level;
    this.locationName.textContent = level.location;
    this.briefingChapter.textContent = level.chapter;
    this.briefingTitle.textContent = `${level.location} – ${level.title}`;
    this.briefingCopy.textContent = level.briefing;
    this.briefingGoal.textContent = level.goal;
    this.loadingStatus.hidden = true;
    this.juryResult.hidden = true;
    this.briefingControls.hidden = false;
    this.objectiveText.textContent = level.objective;
    this.permissionStatus.textContent = "Bez povolení";
    this.permissionStatus.classList.remove("is-granted");
    this.permissionStatus.classList.remove("is-certified");
    this.startButton.textContent = level.id === "chlum" && !this.started
      ? "Začít průzkum"
      : "Pokračovat";
    this.startButton.disabled = false;
    this.introScreen.hidden = false;
  }

  showLoadError(level: LevelDefinition, message: string): void {
    this.started = false;
    this.retryLoad = true;
    this.pauseScreen.hidden = true;
    this.interactionFocused = false;
    this.interactionHint.hidden = true;
    this.diggingPanel.hidden = true;
    this.dialogPanel.hidden = true;
    this.dangerStatus.hidden = true;
    this.juryResult.hidden = true;
    this.loadingStatus.hidden = true;
    this.briefingChapter.textContent = "NAČTENÍ SE NEZDAŘILO";
    this.briefingTitle.textContent = `${level.location} – ${level.title}`;
    this.briefingCopy.textContent = message;
    this.briefingGoal.textContent =
      "Zkuste level načíst znovu. Dosavadní sbírka zůstává zachována.";
    this.briefingControls.hidden = true;
    this.startButton.textContent = "Načíst znovu";
    this.startButton.disabled = false;
    this.introScreen.hidden = false;
  }

  showFinalResult(result: JuryResult): void {
    this.started = false;
    this.retryLoad = false;
    this.pauseScreen.hidden = true;
    this.locationName.textContent = "KD Slavia";
    this.setFinalCollectionStatus(result.ranked.length, result.totalScore);
    this.briefingChapter.textContent = "VÝPRAVA DOKONČENA";
    this.briefingTitle.textContent = "Na Zelené Vlně";
    const selectedCount = result.selected.length;
    const selectedLabel = selectedCount === 1
      ? "nejlepší kus"
      : selectedCount >= 2 && selectedCount <= 4
        ? "nejlepší kusy"
        : "nejlepších kusů";
    this.briefingCopy.textContent =
      `Porota vybrala ${selectedCount} ${selectedLabel} z vaší sbírky. Výsledek: ${result.rating}.`;
    this.briefingGoal.textContent =
      "Konečné hodnocení: " + result.totalScore + " bodů · prezentováno " +
      result.selected.length + " kusů.";
    this.loadingStatus.hidden = true;
    this.renderJuryResult(result);
    this.juryResult.hidden = false;
    this.briefingControls.hidden = true;
    this.startButton.textContent = "Nová výprava";
    this.startButton.disabled = false;
    this.introScreen.hidden = false;
  }

  resetForNewSession(): void {
    this.started = false;
    this.retryLoad = false;
    this.interactionFocused = false;
    this.interactionHint.hidden = true;
    this.diggingPanel.hidden = true;
    this.dialogPanel.hidden = true;
    this.loadingStatus.hidden = true;
    this.setCollectionStatus(0, 0);
    this.juryResult.hidden = true;
    this.briefingControls.hidden = false;
    this.permissionStatus.textContent = "Bez povolení";
    this.permissionStatus.classList.remove("is-granted");
    this.permissionStatus.classList.remove("is-certified");
    this.dangerStatus.hidden = true;
    this.dangerValue.textContent = "0%";
    this.dangerStatus.style.setProperty("--danger-progress", "0%");
    delete this.dangerStatus.dataset.level;
  }

  dispose(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());

    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
    }

    if (this.dialogTimer !== null) {
      window.clearTimeout(this.dialogTimer);
    }
  }

  private showToast(text: string, durationMs: number): void {
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
    }

    this.toast.textContent = text;
    this.toast.hidden = false;
    this.toastTimer = window.setTimeout(() => {
      this.toast.hidden = true;
      this.toastTimer = null;
    }, durationMs);
  }

  private setCollectionStatus(foundCount: number, score: number): void {
    this.foundStatus.dataset.count = String(foundCount);
    this.foundStatus.dataset.score = String(score);
    this.foundStatus.textContent = `Nálezy: ${foundCount} · ${score} bodů`;
  }

  private setFinalCollectionStatus(foundCount: number, juryScore: number): void {
    this.foundStatus.dataset.count = String(foundCount);
    this.foundStatus.dataset.score = String(juryScore);
    this.foundStatus.textContent = `Nálezy: ${foundCount} · porota ${juryScore} bodů`;
  }

  private showDialog(speaker: string, text: string, durationMs: number): void {
    if (this.dialogTimer !== null) {
      window.clearTimeout(this.dialogTimer);
    }

    this.dialogSpeaker.textContent = speaker;
    this.dialogText.textContent = text;
    this.dialogPanel.hidden = false;
    this.dialogTimer = window.setTimeout(() => {
      this.dialogPanel.hidden = true;
      this.dialogTimer = null;
    }, durationMs);
  }

  private renderJuryResult(result: JuryResult): void {
    this.juryResult.replaceChildren();

    if (result.selected.length === 0) {
      const empty = document.createElement("p");
      empty.className = "jury-empty";
      empty.textContent = "Porota nemá žádný kámen k posouzení.";
      this.juryResult.append(empty);
      return;
    }

    result.selected.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "jury-entry";

      const heading = document.createElement("strong");
      heading.textContent = "#" + entry.rank + " " + entry.stone.name;

      const details = document.createElement("span");
      const weight = entry.stone.weightGrams.toFixed(2).replace(".", ",");
      details.textContent =
        entry.stone.locality + " · " + entry.stone.quality + " · " + weight + " g · " +
        "zachovalost " + entry.stone.preservation + "% · plastika " +
        entry.stone.sculpture + "%";

      const score = document.createElement("b");
      score.textContent = entry.score + " b.";

      row.append(heading, details, score);
      this.juryResult.append(row);
    });
  }

  private requireElement<TElement extends HTMLElement = HTMLElement>(
    root: HTMLElement,
    selector: string,
  ): TElement {
    const element = root.querySelector<TElement>(selector);

    if (!element) {
      throw new Error(`HUD element ${selector} nebyl nalezen.`);
    }

    return element;
  }
}
