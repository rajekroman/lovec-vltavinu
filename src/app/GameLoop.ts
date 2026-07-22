export interface GameLoopCallbacks {
  beforeFrame: () => void;
  shouldSimulate: () => boolean;
  fixedUpdate: (dt: number) => void;
  renderUpdate: (frameDt: number, alpha: number) => void;
}

export class GameLoop {
  private static readonly FIXED_DT = 1 / 60;
  private static readonly MAX_FRAME_DT = 0.1;
  private static readonly MAX_STEPS = 5;

  private accumulator = 0;
  private previousTime = 0;
  private animationFrameId: number | null = null;

  constructor(private readonly callbacks: GameLoopCallbacks) {}

  start(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    this.previousTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.accumulator = 0;
  }

  private readonly frame = (now: number): void => {
    const frameDt = Math.min(
      (now - this.previousTime) / 1000,
      GameLoop.MAX_FRAME_DT,
    );
    this.previousTime = now;
    this.callbacks.beforeFrame();

    if (this.callbacks.shouldSimulate()) {
      this.accumulator += frameDt;
      let steps = 0;

      while (this.accumulator >= GameLoop.FIXED_DT && steps < GameLoop.MAX_STEPS) {
        this.callbacks.fixedUpdate(GameLoop.FIXED_DT);
        this.accumulator -= GameLoop.FIXED_DT;
        steps += 1;
      }

      if (steps === GameLoop.MAX_STEPS) {
        this.accumulator = 0;
      }
    } else {
      this.accumulator = 0;
    }

    const alpha = this.accumulator / GameLoop.FIXED_DT;
    this.callbacks.renderUpdate(frameDt, alpha);
    this.animationFrameId = requestAnimationFrame(this.frame);
  };
}
