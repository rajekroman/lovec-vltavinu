const DEFAULT_FADE_MS = 650;
const GESTURE_EVENTS = ["pointerdown", "touchend", "keydown"];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function nowSeconds(context) {
  return Number.isFinite(context?.currentTime) ? context.currentTime : 0;
}

function safeDisconnect(node) {
  try {
    node?.disconnect?.();
  } catch {
    // Disconnect may throw when a mocked or already-disconnected node is used.
  }
}

export class AudioEngine {
  constructor(options = {}) {
    if (!options.eventBus) throw new TypeError("AudioEngine requires an eventBus.");

    this.eventBus = options.eventBus;
    this.contextFactory = options.contextFactory ?? (() => {
      const AudioContextCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AudioContextCtor) throw new Error("Web Audio API is not available.");
      return new AudioContextCtor();
    });
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
    this.gestureTarget = options.gestureTarget ?? globalThis.document ?? null;
    this.visibilityTarget = options.visibilityTarget ?? globalThis.document ?? null;
    this.windowTarget = options.windowTarget ?? globalThis.window ?? null;
    this.fadeMs = options.fadeMs ?? DEFAULT_FADE_MS;

    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.tracks = new Map();
    this.effects = new Map();
    this.buffers = new Map();
    this.currentMusic = null;
    this.state = "locked";
    this.started = false;
    this.disposed = false;
    this.resumeAfterVisibility = false;
    this.unsubscribers = [];
    this.boundGestureUnlock = () => void this.unlock();
    this.boundVisibility = () => void this.handleVisibilityChange();
    this.boundPageHide = () => void this.suspend("pagehide");
    this.boundPageShow = () => void this.resume("pageshow");
  }

  registerTrack(id, definition) {
    this.assertRegistration(id, definition);
    this.tracks.set(id, {
      id,
      url: definition.url,
      loop: definition.loop ?? true,
      volume: clamp(definition.volume ?? 1, 0, 1),
    });
    return this;
  }

  registerEffect(id, definition) {
    this.assertRegistration(id, definition);
    this.effects.set(id, {
      id,
      url: definition.url,
      volume: clamp(definition.volume ?? 1, 0, 1),
    });
    return this;
  }

  assertRegistration(id, definition) {
    if (typeof id !== "string" || !id) throw new TypeError("Audio asset id must be a non-empty string.");
    if (!definition || typeof definition.url !== "string" || !definition.url) {
      throw new TypeError(`Audio asset ${id} requires a relative URL.`);
    }
  }

  start() {
    if (this.started || this.disposed) return this;
    this.started = true;

    this.listen("app:boot:complete", () => this.armGestureUnlock());
    this.listen("scene:transition:start", () => this.stopMusic({ fadeMs: 180 }));
    this.listen("scene:transition:complete", payload => this.playSceneMusic(payload?.to));
    this.listen("dig:start", () => this.playEffect("dig-start"));
    this.listen("dig:hit", () => this.playEffect("dig-hit"));
    this.listen("dig:miss", () => this.playEffect("dig-miss"));
    this.listen("dig:complete", () => this.playEffect("dig-complete"));
    this.listen("finding:collected", () => this.playEffect("finding-collected"));
    this.listen("danger:changed", payload => this.handleDanger(payload));
    this.listen("danger:caught", () => this.playEffect("danger-caught"));
    this.listen("app:dispose", () => this.dispose());

    this.visibilityTarget?.addEventListener?.("visibilitychange", this.boundVisibility);
    this.windowTarget?.addEventListener?.("pagehide", this.boundPageHide);
    this.windowTarget?.addEventListener?.("pageshow", this.boundPageShow);
    this.armGestureUnlock();
    return this;
  }

  listen(type, handler) {
    this.unsubscribers.push(this.eventBus.on(type, handler));
  }

  armGestureUnlock() {
    if (this.disposed || this.state !== "locked") return;
    for (const eventName of GESTURE_EVENTS) {
      this.gestureTarget?.addEventListener?.(eventName, this.boundGestureUnlock, {
        passive: true,
        once: true,
      });
    }
  }

  disarmGestureUnlock() {
    for (const eventName of GESTURE_EVENTS) {
      this.gestureTarget?.removeEventListener?.(eventName, this.boundGestureUnlock);
    }
  }

  ensureContext() {
    if (this.context) return this.context;
    this.context = this.contextFactory();
    this.masterGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.effectsGain = this.context.createGain();
    this.musicGain.connect(this.masterGain);
    this.effectsGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    return this.context;
  }

  async unlock() {
    if (this.disposed) return false;
    const context = this.ensureContext();
    if (context.state !== "running") await context.resume?.();
    this.disarmGestureUnlock();
    this.setState("ready");
    return true;
  }

  async loadBuffer(definition) {
    if (this.buffers.has(definition.id)) return this.buffers.get(definition.id);
    if (!this.fetchImpl) throw new Error("AudioEngine requires fetch to load audio assets.");

    const context = this.ensureContext();
    const promise = (async () => {
      const response = await this.fetchImpl(definition.url);
      if (!response?.ok) throw new Error(`Failed to load audio asset: ${definition.id}`);
      const data = await response.arrayBuffer();
      return context.decodeAudioData(data);
    })();

    this.buffers.set(definition.id, promise);
    try {
      return await promise;
    } catch (error) {
      this.buffers.delete(definition.id);
      throw error;
    }
  }

  async playSceneMusic(sceneId) {
    if (!sceneId) return false;
    const candidates = [`music-${sceneId}`, sceneId];
    const trackId = candidates.find(id => this.tracks.has(id));
    if (!trackId) return false;
    return this.playMusic(trackId);
  }

  async playMusic(trackId, options = {}) {
    if (this.disposed || this.state === "locked") return false;
    const definition = this.tracks.get(trackId);
    if (!definition) return false;
    if (this.currentMusic?.id === trackId) return true;

    const context = this.ensureContext();
    if (context.state !== "running") await context.resume?.();
    const buffer = await this.loadBuffer(definition);
    const source = context.createBufferSource();
    const gain = context.createGain();
    const startAt = nowSeconds(context);
    const fadeSeconds = Math.max(0, options.fadeMs ?? this.fadeMs) / 1000;

    source.buffer = buffer;
    source.loop = definition.loop;
    source.connect(gain);
    gain.connect(this.musicGain);
    gain.gain.setValueAtTime?.(0, startAt);
    gain.gain.linearRampToValueAtTime?.(definition.volume, startAt + fadeSeconds);

    const previous = this.currentMusic;
    this.currentMusic = { id: trackId, source, gain };
    source.onended = () => {
      if (this.currentMusic?.source === source) this.currentMusic = null;
      safeDisconnect(source);
      safeDisconnect(gain);
    };
    source.start?.(0);
    this.fadeOutInstance(previous, fadeSeconds);
    this.setState("playing", trackId);
    return true;
  }

  fadeOutInstance(instance, fadeSeconds) {
    if (!instance) return;
    const context = this.context;
    const startAt = nowSeconds(context);
    const stopAt = startAt + Math.max(0, fadeSeconds);
    instance.gain?.gain?.cancelScheduledValues?.(startAt);
    instance.gain?.gain?.setValueAtTime?.(instance.gain.gain.value ?? 1, startAt);
    instance.gain?.gain?.linearRampToValueAtTime?.(0, stopAt);
    try {
      instance.source?.stop?.(stopAt + 0.02);
    } catch {
      // Source may already be stopped.
    }
  }

  stopMusic(options = {}) {
    const instance = this.currentMusic;
    if (!instance) return false;
    this.currentMusic = null;
    this.fadeOutInstance(instance, Math.max(0, options.fadeMs ?? this.fadeMs) / 1000);
    this.setState("ready");
    return true;
  }

  async playEffect(effectId) {
    if (this.disposed || this.state === "locked") return false;
    const definition = this.effects.get(effectId);
    if (!definition) return false;

    const context = this.ensureContext();
    if (context.state !== "running") await context.resume?.();
    const buffer = await this.loadBuffer(definition);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = definition.volume;
    source.connect(gain);
    gain.connect(this.effectsGain);
    source.onended = () => {
      safeDisconnect(source);
      safeDisconnect(gain);
    };
    source.start?.(0);
    return true;
  }

  handleDanger(payload = {}) {
    const current = Number(payload.current ?? 0);
    const previous = Number(payload.previous ?? 0);
    if (current > previous && current >= 0.65) void this.playEffect("danger-high");
  }

  setMasterVolume(value) {
    const context = this.ensureContext();
    const volume = clamp(Number(value) || 0, 0, 1);
    this.masterGain.gain.setValueAtTime?.(volume, nowSeconds(context));
    this.masterGain.gain.value = volume;
  }

  async suspend(reason = "manual") {
    if (!this.context || this.disposed) return false;
    this.resumeAfterVisibility = this.context.state === "running";
    if (this.context.state === "running") await this.context.suspend?.();
    this.setState("suspended", this.currentMusic?.id);
    return reason;
  }

  async resume(reason = "manual") {
    if (!this.context || this.disposed || this.state === "locked") return false;
    if (this.context.state !== "running") await this.context.resume?.();
    this.setState(this.currentMusic ? "playing" : "ready", this.currentMusic?.id);
    this.resumeAfterVisibility = false;
    return reason;
  }

  async handleVisibilityChange() {
    if (this.visibilityTarget?.hidden) {
      await this.suspend("hidden");
    } else if (this.resumeAfterVisibility) {
      await this.resume("visible");
    }
  }

  setState(state, trackId) {
    if (this.state === state && this.currentMusic?.id === trackId) return;
    this.state = state;
    this.eventBus.emit("audio:state", trackId ? { state, trackId } : { state });
  }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.disarmGestureUnlock();
    this.visibilityTarget?.removeEventListener?.("visibilitychange", this.boundVisibility);
    this.windowTarget?.removeEventListener?.("pagehide", this.boundPageHide);
    this.windowTarget?.removeEventListener?.("pageshow", this.boundPageShow);
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe?.();
    this.stopMusic({ fadeMs: 0 });
    this.buffers.clear();
    safeDisconnect(this.effectsGain);
    safeDisconnect(this.musicGain);
    safeDisconnect(this.masterGain);
    await this.context?.close?.();
    this.context = null;
    this.setState("disposed");
  }
}
