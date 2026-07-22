export type GameAction = "interact" | "pause";
type Direction = "up" | "down" | "left" | "right";

const KEY_TO_DIRECTION: Readonly<Record<string, Direction | undefined>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const KEY_TO_ACTION: Readonly<Record<string, GameAction | undefined>> = {
  KeyE: "interact",
  Space: "interact",
  Escape: "pause",
  KeyP: "pause",
};

export interface MoveInput {
  x: number;
  y: number;
}

export class InputManager {
  private readonly keyboardDirections = new Set<Direction>();
  private readonly touchDirections = new Set<Direction>();
  private readonly keyboardActions = new Set<GameAction>();
  private readonly touchActions = new Set<GameAction>();
  private readonly pressedActions = new Set<GameAction>();
  private readonly touchPointers = new Map<number, Direction | GameAction>();
  private readonly touchButtons: HTMLElement[] = [];

  constructor() {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  bindTouchControls(root: HTMLElement): void {
    if (this.touchButtons.length > 0) {
      return;
    }

    for (const button of root.querySelectorAll<HTMLElement>("[data-input]")) {
      button.addEventListener("pointerdown", this.onPointerDown, { passive: false });
      button.addEventListener("pointerup", this.onPointerUp, { passive: false });
      button.addEventListener("pointercancel", this.onPointerUp, { passive: false });
      button.addEventListener("lostpointercapture", this.onPointerUp, { passive: false });
      button.addEventListener("contextmenu", this.onContextMenu);
      this.touchButtons.push(button);
    }
  }

  getMove(): MoveInput {
    const directions = new Set([...this.keyboardDirections, ...this.touchDirections]);
    let x = Number(directions.has("right")) - Number(directions.has("left"));
    let y = Number(directions.has("down")) - Number(directions.has("up"));
    const length = Math.hypot(x, y);

    if (length > 1) {
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  consumePressed(action: GameAction): boolean {
    if (!this.pressedActions.has(action)) {
      return false;
    }

    this.pressedActions.delete(action);
    return true;
  }

  isHeld(action: GameAction): boolean {
    return this.keyboardActions.has(action) || this.touchActions.has(action);
  }

  /**
   * Clears both held and one-shot input. This is used at scene/paused-screen
   * boundaries so a key or touch that belongs to the previous UI state cannot
   * trigger an unintended action after the game resumes.
   */
  reset(): void {
    this.keyboardDirections.clear();
    this.touchDirections.clear();
    this.keyboardActions.clear();
    this.touchActions.clear();
    this.pressedActions.clear();
    this.touchPointers.clear();
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);

    for (const button of this.touchButtons) {
      button.removeEventListener("pointerdown", this.onPointerDown);
      button.removeEventListener("pointerup", this.onPointerUp);
      button.removeEventListener("pointercancel", this.onPointerUp);
      button.removeEventListener("lostpointercapture", this.onPointerUp);
      button.removeEventListener("contextmenu", this.onContextMenu);
    }
    this.touchButtons.length = 0;
    this.reset();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const direction = KEY_TO_DIRECTION[event.code];
    const action = KEY_TO_ACTION[event.code];

    if (!direction && !action) {
      return;
    }

    event.preventDefault();

    if (direction) {
      this.keyboardDirections.add(direction);
    }

    if (action && !this.keyboardActions.has(action)) {
      this.keyboardActions.add(action);
      this.pressedActions.add(action);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const direction = KEY_TO_DIRECTION[event.code];
    const action = KEY_TO_ACTION[event.code];

    if (!direction && !action) {
      return;
    }

    event.preventDefault();

    if (direction) {
      this.keyboardDirections.delete(direction);
    }

    if (action) {
      this.keyboardActions.delete(action);
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    const target = event.currentTarget as HTMLElement;
    const input = target.dataset.input as Direction | GameAction | undefined;

    if (!input) {
      return;
    }

    event.preventDefault();
    target.setPointerCapture(event.pointerId);
    this.touchPointers.set(event.pointerId, input);

    if (this.isDirection(input)) {
      this.touchDirections.add(input);
    } else if (!this.touchActions.has(input)) {
      this.touchActions.add(input);
      this.pressedActions.add(input);
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const input = this.touchPointers.get(event.pointerId);

    if (!input) {
      return;
    }

    event.preventDefault();
    this.touchPointers.delete(event.pointerId);

    if (this.isDirection(input)) {
      const stillHeld = [...this.touchPointers.values()].some((value) => value === input);
      if (!stillHeld) {
        this.touchDirections.delete(input);
      }
    } else {
      const stillHeld = [...this.touchPointers.values()].some((value) => value === input);
      if (!stillHeld) {
        this.touchActions.delete(input);
      }
    }
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) {
      this.reset();
    }
  };

  private readonly onBlur = (): void => {
    this.reset();
  };

  private readonly onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private isDirection(input: Direction | GameAction): input is Direction {
    return input === "up" || input === "down" || input === "left" || input === "right";
  }
}
