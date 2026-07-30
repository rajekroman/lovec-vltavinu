const GESTURE_EVENTS = Object.freeze(["pointerdown", "touchend", "keydown"]);

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}

export class AudioEngine {
  constructor(options = {}) {
    if (!options.events) throw new TypeError("AudioEngine requires events.");

    this.events = options.events;
    this.document = options.document ?? globalThis.document ?? null;
    this.window = options.window ?? globalThis.window ?? null;
    this.button = options.button ?? null;
    this.contextFactory = options.contextFactory ?? (() => {
      const AudioContextCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AudioContextCtor) return null;
      return new AudioContextCtor();
    });

    this.context = null;
    this.masterGain = null;
    this.volume = clamp01(options.volume ?? 1);
    this.muted = Boolean(options.muted);
    this.state = "locked";
    this.started = false;
    this.disposed = false;
    this.resumeAfterVisibility = false;
    this.abortController = null;

    this.handleGesture = this.handleGesture.bind(this);
    this.handleButton = this.handleButton.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);
    this.handlePageHide = this.handlePageHide.bind(this);
  }

  start() {
    if (this.started || this.disposed) return this;
    this.started = true;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    for (const type of GESTURE_EVENTS) {
      this.document?.addEventListener?.(type, this.handleGesture, { passive: true, signal });
    }
    this.button?.addEventListener?.("click", this.handleButton, { signal });
    this.document?.addEventListener?.("visibilitychange", this.handleVisibility, { signal });
    this.window?.addEventListener?.("pagehide", this.handlePageHide, { signal });

    this.button?.classList?.remove("hidden");
    this.updateButton();
    this.emitState();
    return this;
  }

  ensureContext() {
    if (this.context || this.disposed) return this.context;
    const context = this.contextFactory();
    if (!context) {
      this.state = "unavailable";
      this.updateButton();
      this.emitState();
      return null;
    }

    this.context = context;
    this.masterGain = context.createGain();
    this.masterGain.connect(context.destination);
    this.applyGain();
    return context;
  }

  async unlock() {
    if (this.disposed) return false;
    const context = this.ensureContext();
    if (!context) return false;

    if (context.state !== "running") await context.resume?.();
    this.resumeAfterVisibility = false;
    this.state = this.muted ? "muted" : "ready";
    this.updateButton();
    this.emitState();
    return true;
  }

  async handleGesture() {
    if (this.state === "locked") await this.unlock();
    else if (this.state === "suspended" && this.resumeAfterVisibility) await this.resumeFromGesture();
  }

  async handleButton(event) {
    event?.preventDefault?.();
    if (this.state === "locked") await this.unlock();
    else if (this.state === "suspended" && this.resumeAfterVisibility) await this.resumeFromGesture();
    this.setMuted(!this.muted);
  }

  setMuted(muted) {
    if (this.disposed) return false;
    const next = Boolean(muted);
    if (next === this.muted) return false;
    this.muted = next;
    this.applyGain();
    if (this.state !== "locked" && this.state !== "unavailable" && this.state !== "suspended") {
      this.state = this.muted ? "muted" : "ready";
    }
    this.updateButton();
    this.emitState();
    return true;
  }

  setVolume(value) {
    if (this.disposed) return false;
    const next = clamp01(value);
    if (next === this.volume) return false;
    this.volume = next;
    this.applyGain();
    return true;
  }

  applyGain() {
    if (!this.masterGain) return;
    const value = this.muted ? 0 : this.volume;
    const now = Number.isFinite(this.context?.currentTime) ? this.context.currentTime : 0;
    this.masterGain.gain?.setValueAtTime?.(value, now);
    this.masterGain.gain.value = value;
  }

  async suspend(reason = "manual") {
    if (!this.context || this.disposed) return false;
    this.resumeAfterVisibility = this.context.state === "running" || this.resumeAfterVisibility;
    if (this.context.state === "running") await this.context.suspend?.();
    this.state = "suspended";
    this.updateButton();
    this.emitState();
    return reason;
  }

  async resumeFromGesture() {
    if (!this.context || this.disposed) return false;
    if (this.context.state !== "running") await this.context.resume?.();
    this.resumeAfterVisibility = false;
    this.state = this.muted ? "muted" : "ready";
    this.updateButton();
    this.emitState();
    return true;
  }

  async handleVisibility() {
    if (this.document?.hidden) await this.suspend("hidden");
  }

  async handlePageHide() {
    await this.suspend("pagehide");
  }

  updateButton() {
    if (!this.button) return;
    const muted = this.muted || this.state === "unavailable";
    this.button.textContent = muted ? "♪̸" : "♫";
    this.button.setAttribute?.("aria-pressed", String(this.muted));
    this.button.setAttribute?.("aria-label", this.muted ? "Zapnout zvuk" : "Vypnout zvuk");
    this.button.dataset.audioState = this.state;
  }

  emitState() {
    this.events.emit("audio:state", { state: this.state });
  }

  snapshot() {
    return Object.freeze({
      state: this.state,
      muted: this.muted,
      volume: this.volume,
      contextState: this.context?.state ?? "none"
    });
  }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.abortController?.abort();
    this.abortController = null;
    this.started = false;

    try {
      this.masterGain?.disconnect?.();
    } catch {
      // Already disconnected.
    }
    await this.context?.close?.();
    this.context = null;
    this.masterGain = null;
    this.state = "disposed";
    this.updateButton();
    this.emitState();
  }
}
