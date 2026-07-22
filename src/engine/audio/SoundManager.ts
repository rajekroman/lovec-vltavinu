import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";

export type SoundCueName =
  | "briefing"
  | "action"
  | "permission"
  | "digStart"
  | "digHit"
  | "digMiss"
  | "reward"
  | "certification"
  | "alarm"
  | "levelComplete"
  | "finale";

export type AmbientProfileName = "chlum" | "nesmen" | "besednice" | "slavia";

export interface SoundTone {
  readonly frequency: number;
  readonly duration: number;
  readonly type: OscillatorType;
  readonly volume: number;
  readonly delay?: number;
}

/**
 * Short, deliberately restrained UI tones and a very quiet ambient bed. The
 * game owns no binary audio files: everything is synthesized at runtime so
 * the GitHub Pages build stays small and the first sound can be unlocked by a
 * normal tap on iOS.
 */
export const SOUND_CUE_DEFINITIONS: Readonly<Record<SoundCueName, readonly SoundTone[]>> = {
  briefing: [
    { frequency: 392, duration: 0.12, type: "sine", volume: 0.045 },
    { frequency: 523.25, duration: 0.2, type: "sine", volume: 0.055, delay: 0.1 },
  ],
  action: [
    { frequency: 248, duration: 0.055, type: "triangle", volume: 0.055 },
  ],
  permission: [
    { frequency: 330, duration: 0.1, type: "sine", volume: 0.05 },
    { frequency: 494, duration: 0.16, type: "sine", volume: 0.06, delay: 0.09 },
  ],
  digStart: [
    { frequency: 142, duration: 0.16, type: "triangle", volume: 0.07 },
  ],
  digHit: [
    { frequency: 660, duration: 0.07, type: "sine", volume: 0.06 },
  ],
  digMiss: [
    { frequency: 168, duration: 0.11, type: "sawtooth", volume: 0.045 },
  ],
  reward: [
    { frequency: 523.25, duration: 0.11, type: "sine", volume: 0.055 },
    { frequency: 659.25, duration: 0.11, type: "sine", volume: 0.06, delay: 0.08 },
    { frequency: 783.99, duration: 0.22, type: "sine", volume: 0.07, delay: 0.16 },
  ],
  certification: [
    { frequency: 392, duration: 0.12, type: "triangle", volume: 0.05 },
    { frequency: 587.33, duration: 0.2, type: "triangle", volume: 0.06, delay: 0.1 },
  ],
  alarm: [
    { frequency: 220, duration: 0.16, type: "square", volume: 0.045 },
    { frequency: 165, duration: 0.18, type: "square", volume: 0.05, delay: 0.18 },
    { frequency: 220, duration: 0.16, type: "square", volume: 0.045, delay: 0.4 },
  ],
  levelComplete: [
    { frequency: 392, duration: 0.1, type: "sine", volume: 0.05 },
    { frequency: 523.25, duration: 0.1, type: "sine", volume: 0.055, delay: 0.09 },
    { frequency: 659.25, duration: 0.24, type: "sine", volume: 0.065, delay: 0.18 },
  ],
  finale: [
    { frequency: 392, duration: 0.14, type: "sine", volume: 0.05 },
    { frequency: 493.88, duration: 0.14, type: "sine", volume: 0.055, delay: 0.12 },
    { frequency: 587.33, duration: 0.14, type: "sine", volume: 0.06, delay: 0.24 },
    { frequency: 783.99, duration: 0.38, type: "sine", volume: 0.07, delay: 0.36 },
  ],
};

export interface AmbientProfile {
  readonly rootFrequency: number;
  readonly fifthFrequency: number;
  readonly upperFrequency: number;
  readonly waveform: OscillatorType;
}

/** Subtle location beds; the cue layer remains responsible for explicit actions. */
export const AMBIENT_PROFILES: Readonly<Record<AmbientProfileName, AmbientProfile>> = {
  chlum: {
    rootFrequency: 146.83,
    fifthFrequency: 220,
    upperFrequency: 293.66,
    waveform: "sine",
  },
  nesmen: {
    rootFrequency: 110,
    fifthFrequency: 164.81,
    upperFrequency: 220,
    waveform: "triangle",
  },
  besednice: {
    rootFrequency: 130.81,
    fifthFrequency: 196,
    upperFrequency: 261.63,
    waveform: "sine",
  },
  slavia: {
    rootFrequency: 174.61,
    fifthFrequency: 261.63,
    upperFrequency: 349.23,
    waveform: "triangle",
  },
};

export function cueForDigFeedback(
  feedback: "none" | "hit" | "miss",
  previousFeedback: "none" | "hit" | "miss",
): SoundCueName | null {
  if (feedback === previousFeedback) {
    return null;
  }

  if (feedback === "hit") {
    return "digHit";
  }

  if (feedback === "miss") {
    return "digMiss";
  }

  return null;
}

export class SoundManager {
  private readonly unsubscribers: Array<() => void> = [];
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientProfile: AmbientProfileName = "chlum";
  private ambient: {
    gain: GainNode;
    oscillators: OscillatorNode[];
  } | null = null;
  private diggingActive = false;
  private lastDigFeedback: "none" | "hit" | "miss" = "none";

  constructor(events: EventBus<GameEvents>) {
    this.unsubscribers.push(
      events.on("interaction:triggered", () => this.playCue("action")),
      events.on("permission:changed", ({ granted }) => {
        if (granted) {
          this.playCue("permission");
        }
      }),
      events.on("digging:stateChanged", (state) => {
        if (state.active && !this.diggingActive) {
          this.playCue("digStart");
        }

        const feedbackCue = cueForDigFeedback(state.feedback, this.lastDigFeedback);
        if (feedbackCue) {
          this.playCue(feedbackCue);
        }

        this.diggingActive = state.active;
        this.lastDigFeedback = state.feedback;
        if (!state.active) {
          this.lastDigFeedback = "none";
        }
      }),
      events.on("collectible:found", () => this.playCue("reward")),
      events.on("collection:certified", () => this.playCue("certification")),
      events.on("danger:critical", () => this.playCue("alarm")),
      events.on("level:completed", () => this.playCue("levelComplete")),
      events.on("game:completed", () => {
        this.playCue("finale");
        this.stopAmbient();
      }),
    );
  }

  setAmbientProfile(profile: AmbientProfileName): void {
    this.ambientProfile = profile;

    if (!this.context || !this.masterGain) {
      return;
    }

    this.stopAmbient();
    this.startAmbient();
  }

  /** Call from a user gesture before playing the first cue. */
  unlock(): void {
    if (this.context === null) {
      const contextConstructor = this.getContextConstructor();
      if (!contextConstructor) {
        return;
      }

      try {
        this.context = new contextConstructor();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.72;
        this.masterGain.connect(this.context.destination);
        this.startAmbient();
      } catch {
        this.context = null;
        this.masterGain = null;
        return;
      }
    }

    if (this.context.state === "suspended") {
      void this.context.resume().catch(() => {
        // Browsers may reject resume when the gesture has already ended. The
        // next action will retry without affecting the game loop.
      });
    }
  }

  playCue(cue: SoundCueName): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;
    for (const tone of SOUND_CUE_DEFINITIONS[cue]) {
      this.scheduleTone(tone, now);
    }
  }

  dispose(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.length = 0;

    if (this.context) {
      this.stopAmbient();
      void this.context.close().catch(() => {
        // Closing is best effort during page teardown.
      });
    }

    this.context = null;
    this.masterGain = null;
    this.diggingActive = false;
    this.lastDigFeedback = "none";
  }

  private startAmbient(): void {
    if (!this.context || !this.masterGain || this.ambient) {
      return;
    }

    const profile = AMBIENT_PROFILES[this.ambientProfile];
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 1.2);
    gain.connect(this.masterGain);

    const oscillators = [
      { frequency: profile.rootFrequency, detune: -3 },
      { frequency: profile.fifthFrequency, detune: 2 },
      { frequency: profile.upperFrequency, detune: -5 },
    ].map(({ frequency, detune }) => {
      const oscillator = this.context!.createOscillator();
      oscillator.type = profile.waveform;
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(detune, now);
      oscillator.connect(gain);
      oscillator.start(now);
      return oscillator;
    });

    this.ambient = { gain, oscillators };
  }

  private stopAmbient(): void {
    if (!this.context || !this.ambient) {
      return;
    }

    const ambient = this.ambient;
    this.ambient = null;
    const now = this.context.currentTime;
    ambient.gain.gain.cancelScheduledValues(now);
    ambient.gain.gain.setTargetAtTime(0.0001, now, 0.08);
    window.setTimeout(() => {
      try {
        ambient.gain.disconnect();
      } catch {
        // Disconnect is best effort if the audio context is already closed.
      }
    }, 460);

    ambient.oscillators.forEach((oscillator) => {
      oscillator.addEventListener("ended", () => oscillator.disconnect(), { once: true });
      try {
        oscillator.stop(now + 0.32);
      } catch {
        // The node may already be stopping while the browser is closing audio.
      }
    });
  }

  private scheduleTone(tone: SoundTone, now: number): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const start = now + (tone.delay ?? 0);
    const end = start + tone.duration;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const attack = Math.min(0.018, tone.duration * 0.3);

    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, tone.volume), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start(start);
    oscillator.stop(end + 0.025);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
  }

  private getContextConstructor(): (new () => AudioContext) | null {
    if (typeof window === "undefined") {
      return null;
    }

    const windowWithWebkit = window as Window & {
      webkitAudioContext?: new () => AudioContext;
    };
    return window.AudioContext ?? windowWithWebkit.webkitAudioContext ?? null;
  }
}
