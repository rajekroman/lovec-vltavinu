const MOVE_KEYS = Object.freeze({
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, 1], KeyW: [0, 1],
  ArrowDown: [0, -1], KeyS: [0, -1]
});

export class DomInputAdapter {
  constructor(options) {
    this.input = options.input;
    this.document = options.document;
    this.window = options.window;
    this.onResize = options.onResize ?? (() => {});
    this.keys = new Set();
    this.movePointer = null;
    this.controller = new AbortController();
    this.bind();
  }

  listen(target, type, handler, options = {}) {
    target.addEventListener(type, handler, { ...options, signal: this.controller.signal });
  }

  bind() {
    const moveZone = this.document.getElementById("moveZone");
    const action = this.document.getElementById("actionButton");
    const pause = this.document.getElementById("pauseButton");

    this.listen(this.window, "keydown", event => {
      if (MOVE_KEYS[event.code]) {
        event.preventDefault();
        this.keys.add(event.code);
        this.updateKeyboardAxis();
      } else if (["Space", "Enter", "KeyE"].includes(event.code) && !event.repeat) {
        event.preventDefault();
        this.input.press("action");
      } else if (["Escape", "KeyP"].includes(event.code) && !event.repeat) {
        event.preventDefault();
        this.pulse("pause");
      }
    });
    this.listen(this.window, "keyup", event => {
      if (MOVE_KEYS[event.code]) {
        this.keys.delete(event.code);
        this.updateKeyboardAxis();
      } else if (["Space", "Enter", "KeyE"].includes(event.code)) {
        this.input.release("action");
      }
    });

    this.listen(moveZone, "pointerdown", event => {
      if (this.movePointer !== null) return;
      event.preventDefault();
      this.movePointer = event.pointerId;
      try { moveZone.setPointerCapture?.(event.pointerId); } catch {}
      this.updatePointerAxis(event, moveZone);
    });
    this.listen(moveZone, "pointermove", event => {
      if (event.pointerId !== this.movePointer) return;
      event.preventDefault();
      this.updatePointerAxis(event, moveZone);
    });
    const releaseMove = event => {
      if (event.pointerId !== this.movePointer) return;
      this.movePointer = null;
      this.input.setAxis("move", 0, 0);
      this.resetStick();
    };
    this.listen(moveZone, "pointerup", releaseMove);
    this.listen(moveZone, "pointercancel", releaseMove);
    this.listen(moveZone, "lostpointercapture", releaseMove);

    this.listen(action, "pointerdown", event => {
      event.preventDefault();
      try { action.setPointerCapture?.(event.pointerId); } catch {}
      action.classList.add("active");
      this.input.press("action");
    });
    const releaseAction = event => {
      event.preventDefault();
      action.classList.remove("active");
      this.input.release("action");
    };
    this.listen(action, "pointerup", releaseAction);
    this.listen(action, "pointercancel", releaseAction);
    this.listen(action, "lostpointercapture", releaseAction);
    this.listen(pause, "click", event => {
      event.preventDefault();
      this.pulse("pause");
    });

    this.listen(this.window, "blur", () => this.reset("window-blur"));
    this.listen(this.document, "visibilitychange", () => {
      if (this.document.hidden) this.reset("document-hidden");
    });
    this.listen(this.window, "orientationchange", () => {
      this.reset("orientation-change");
      this.window.setTimeout(this.onResize, 80);
    });
    this.listen(this.window, "resize", this.onResize, { passive: true });
  }

  pulse(name) {
    this.input.press(name);
    this.input.release(name);
  }

  updateKeyboardAxis() {
    let x = 0;
    let y = 0;
    for (const code of this.keys) {
      x += MOVE_KEYS[code]?.[0] ?? 0;
      y += MOVE_KEYS[code]?.[1] ?? 0;
    }
    this.input.setAxis("move", x, y);
  }

  updatePointerAxis(event, zone) {
    const bounds = zone.getBoundingClientRect();
    const radius = Math.max(1, Math.min(bounds.width, bounds.height) / 2);
    const x = (event.clientX - (bounds.left + bounds.width / 2)) / radius;
    const y = -((event.clientY - (bounds.top + bounds.height / 2)) / radius);
    const vector = this.input.setAxis("move", x, y);
    const stick = this.document.getElementById("stick");
    stick.style.transform = `translate(calc(-50% + ${vector.x * radius * 0.45}px), calc(-50% + ${-vector.y * radius * 0.45}px))`;
  }

  resetStick() {
    this.document.getElementById("stick").style.transform = "translate(-50%, -50%)";
  }

  reset(reason = "dom-reset") {
    this.keys.clear();
    this.movePointer = null;
    this.resetStick();
    this.input.reset(reason);
  }

  dispose() {
    this.controller.abort();
    this.reset("dom-dispose");
  }
}
