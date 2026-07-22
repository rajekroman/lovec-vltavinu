import type { EventBus } from "../../core/events/EventBus";
import type { GameEvents } from "../../core/events/GameEvents";

export interface AlertSystemOptions {
  risePerSecond?: number;
  decayPerSecond?: number;
  publishStep?: number;
  criticalThreshold?: number;
}

/**
 * Converts proximity to a level hazard into a small, readable alarm meter.
 *
 * The system is intentionally independent of Three.js and the world. A scene
 * only reports whether the player is currently inside the warning radius; this
 * keeps the gameplay rule easy to test and lets the HUD consume one event.
 */
export class AlertSystem {
  private readonly risePerSecond: number;
  private readonly decayPerSecond: number;
  private readonly publishStep: number;
  private readonly criticalThreshold: number;

  private value = 0;
  private lastPublishedValue = -1;
  private lastPublishedActive = false;
  private criticalToastSent = false;

  constructor(
    private readonly events: EventBus<GameEvents>,
    options: AlertSystemOptions = {},
  ) {
    this.risePerSecond = options.risePerSecond ?? 0.42;
    this.decayPerSecond = options.decayPerSecond ?? 0.24;
    this.publishStep = options.publishStep ?? 0.025;
    this.criticalThreshold = options.criticalThreshold ?? 0.82;
  }

  getValue(): number {
    return this.value;
  }

  update(dt: number, threatActive: boolean, label: string): number {
    const safeDt = Math.max(0, dt);
    const delta = (threatActive ? this.risePerSecond : -this.decayPerSecond) * safeDt;
    this.value = Math.min(1, Math.max(0, this.value + delta));

    const visible = threatActive || this.value > 0.005;
    const valueChanged = Math.abs(this.value - this.lastPublishedValue) >= this.publishStep;
    if (visible !== this.lastPublishedActive || valueChanged || (this.value === 0 && this.lastPublishedValue !== 0)) {
      this.lastPublishedActive = visible;
      this.lastPublishedValue = this.value;
      this.events.emit("danger:changed", {
        active: visible,
        label,
        value: this.value,
      });
    }

    if (this.value >= this.criticalThreshold && !this.criticalToastSent) {
      this.criticalToastSent = true;
      this.events.emit("danger:critical", { label });
      this.events.emit("ui:toastRequested", {
        text: `POPLACH: ${label}. Vzdalte se z dosahu nebezpečí.`,
        durationMs: 3000,
      });
    } else if (this.value < this.criticalThreshold * 0.55) {
      this.criticalToastSent = false;
    }

    return this.value;
  }

  reset(): void {
    this.value = 0;
    this.lastPublishedValue = -1;
    this.lastPublishedActive = false;
    this.criticalToastSent = false;
  }
}
