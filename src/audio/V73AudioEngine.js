import { AudioEngine } from "./AudioEngine.js";

export const DIG_IMPACT_IDS = Object.freeze([
  "audio-sfx-dig-hard",
  "audio-sfx-dig-wet",
  "audio-sfx-dig-stone"
]);

export const FINDING_IDS = Object.freeze({ C: "audio-sfx-finding-c", B: "audio-sfx-finding-b", A: "audio-sfx-finding-a" });
export const DANGER_IDS = Object.freeze({
  chlum: "audio-sfx-danger-chlum", nesmen: "audio-sfx-danger-nesmen",
  besednice: "audio-sfx-danger-besednice", slavia: "audio-sfx-danger-slavia"
});
export const AMBIENCE_IDS = Object.freeze({
  chlum: "audio-ambient-chlum", nesmen: "audio-ambient-nesmen",
  besednice: "audio-ambient-besednice", slavia: "audio-ambient-slavia"
});
export const UI_IDS = Object.freeze({ click: "audio-ui-click", open: "audio-ui-open", close: "audio-ui-close", result: "audio-ui-result" });
export const DIG_MISS_ID = "audio-sfx-dig-miss";
export const DIG_CLEAN_ID = "audio-sfx-dig-perfect";
export const CAUGHT_ID = "audio-sfx-danger-caught";

const MODAL_OPEN_IDS = new Set(["howButton", "storyButton", "settingsButton", "journalButton", "pauseStoryButton", "pauseSettingsButton"]);
const MODAL_CLOSE_IDS = new Set(["howCloseButton", "storyCloseButton", "settingsCloseButton", "journalCloseButton", "resumeButton"]);

function hashString(value) {
  const text = String(value ?? "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function resolveDigImpactId({ spot = "", hit = 0 } = {}) {
  return DIG_IMPACT_IDS[hashString(`${spot}:${Number(hit) || 0}`) % DIG_IMPACT_IDS.length];
}
export function resolveFindingEffectId(rarity) {
  return FINDING_IDS[String(rarity ?? "").toUpperCase()] ?? FINDING_IDS.C;
}
export function resolveDangerEffectId(sceneId) {
  return DANGER_IDS[String(sceneId ?? "").toLowerCase()] ?? null;
}
export function resolveAmbienceId(sceneId) {
  return AMBIENCE_IDS[String(sceneId ?? "").toLowerCase()] ?? null;
}

function scheduleGain(gainNode, context, from, to, seconds) {
  const gain = gainNode?.gain;
  if (!gain || !context) return false;
  const now = Number.isFinite(context.currentTime) ? context.currentTime : 0;
  gain.cancelScheduledValues?.(now);
  gain.setValueAtTime?.(from, now);
  gain.linearRampToValueAtTime?.(to, now + Math.max(0, seconds));
  gain.value = to;
  return true;
}

export class V73AudioEngine extends AudioEngine {
  constructor(options = {}) {
    super(options);
    this.ambienceFadeSeconds = Math.max(0, Number(options.ambienceFadeSeconds ?? 0.24));
    this.handleSceneTransitionStart = this.handleSceneTransitionStart.bind(this);
    this.handleDigMiss = this.handleDigMiss.bind(this);
    this.handleDigClean = this.handleDigClean.bind(this);
    this.handleCaught = this.handleCaught.bind(this);
    this.handleUiClick = this.handleUiClick.bind(this);
  }

  start() {
    if (this.started || this.disposed) return this;
    super.start();
    const { signal } = this.abortController;
    this.events.on("scene:transition:start", this.handleSceneTransitionStart, { signal });
    this.events.on("dig:miss", this.handleDigMiss, { signal });
    this.events.on("dig:clean", this.handleDigClean, { signal });
    this.events.on("danger:caught", this.handleCaught, { signal });
    this.document?.addEventListener?.("click", this.handleUiClick, { capture: true, signal });
    return this;
  }

  handleSceneTransitionStart() {
    const record = this.musicSource;
    if (!record || !this.context || !this.musicGain) return;
    const now = Number.isFinite(this.context.currentTime) ? this.context.currentTime : 0;
    scheduleGain(this.musicGain, this.context, Number(this.musicGain.gain?.value ?? this.musicVolume), 0, this.ambienceFadeSeconds);
    try { record.source.stop?.(now + this.ambienceFadeSeconds); } catch {}
  }

  async fadeInAmbience(id) {
    if (!id) return false;
    if (!this.context || this.context.state !== "running") {
      this.pendingMusicId = id;
      return false;
    }
    scheduleGain(this.musicGain, this.context, 0, 0, 0);
    const played = await this.playMusic(id);
    if (!played) return false;
    scheduleGain(this.musicGain, this.context, 0, this.musicVolume, this.ambienceFadeSeconds);
    return true;
  }

  async startPendingMusic() {
    const id = this.pendingMusicId;
    if (!id || this.currentScene === "title") return false;
    return this.fadeInAmbience(id);
  }

  handleSceneTransition({ to }) {
    this.currentScene = to;
    if (to === "title") {
      this.pendingMusicId = null;
      this.stopMusic();
      return;
    }
    const id = resolveAmbienceId(to);
    this.pendingMusicId = id;
    if (id && this.context?.state === "running") {
      void this.preloadAudio().then(() => this.startPendingMusic()).catch(() => {});
    }
  }

  handleDigHit(payload = {}) { void this.playEffect(resolveDigImpactId(payload)); }
  handleDigMiss() { void this.playEffect(DIG_MISS_ID); }
  handleDigClean() { void this.playEffect(DIG_CLEAN_ID); }
  handleFinding({ rarity } = {}) { void this.playEffect(resolveFindingEffectId(rarity)); }
  handleDanger({ previous, current } = {}) {
    if (!(Number(current) > Number(previous))) return;
    const id = resolveDangerEffectId(this.currentScene);
    if (id) void this.playEffect(id);
  }
  handleCaught() { void this.playEffect(CAUGHT_ID); }

  handleUiClick(event) {
    if (this.isButtonGesture(event)) return;
    const button = event?.target?.closest?.("button");
    if (!button || button.disabled) return;
    const id = MODAL_OPEN_IDS.has(button.id) ? UI_IDS.open : MODAL_CLOSE_IDS.has(button.id) ? UI_IDS.close : UI_IDS.click;
    void this.playEffect(id);
  }

  playLevelResult() { return this.playEffect(UI_IDS.result); }
}
