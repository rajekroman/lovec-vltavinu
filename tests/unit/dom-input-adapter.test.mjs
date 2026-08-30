import test from "node:test";
import assert from "node:assert/strict";
import { DomInputAdapter } from "../../src/input/DomInputAdapter.js";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    for (const name of names) this.values.add(name);
  }

  remove(...names) {
    for (const name of names) this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, handler, options = {}) {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
    options.signal?.addEventListener("abort", () => handlers.delete(handler), { once: true });
  }

  dispatch(type, init = {}) {
    const event = {
      type,
      defaultPrevented: false,
      immediatePropagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopImmediatePropagation() {
        this.immediatePropagationStopped = true;
      },
      ...init
    };
    for (const handler of [...(this.listeners.get(type) ?? [])]) {
      handler(event);
      if (event.immediatePropagationStopped) break;
    }
    return event;
  }
}

class FakeElement extends FakeTarget {
  constructor() {
    super();
    this.classList = new FakeClassList();
    this.style = {};
    this.capturedPointer = null;
  }

  setPointerCapture(pointerId) {
    this.capturedPointer = pointerId;
  }

  releasePointerCapture(pointerId) {
    if (this.capturedPointer === pointerId) this.capturedPointer = null;
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 100, height: 100 };
  }
}

class FakeDocument extends FakeTarget {
  constructor() {
    super();
    this.hidden = false;
    this.elements = new Map([
      ["moveZone", new FakeElement()],
      ["actionButton", new FakeElement()],
      ["pauseButton", new FakeElement()],
      ["stick", new FakeElement()]
    ]);
  }

  getElementById(id) {
    return this.elements.get(id) ?? null;
  }
}

class FakeWindow extends FakeTarget {
  constructor() {
    super();
    this.nextTimerId = 1;
    this.timers = new Map();
  }

  setTimeout(handler) {
    const id = this.nextTimerId++;
    this.timers.set(id, handler);
    return id;
  }

  clearTimeout(id) {
    this.timers.delete(id);
  }

  flushTimers() {
    const timers = [...this.timers.values()];
    this.timers.clear();
    for (const handler of timers) handler();
  }
}

class FakeInput {
  constructor() {
    this.presses = [];
    this.releases = [];
    this.resets = [];
    this.axes = [];
  }

  press(name) {
    this.presses.push(name);
  }

  release(name) {
    this.releases.push(name);
  }

  setAxis(name, x, y = null) {
    const value = y === null
      ? x
      : { x, y, length: Math.min(1, Math.hypot(x, y)) };
    this.axes.push({ name, value });
    return value;
  }

  reset(reason) {
    this.resets.push(reason);
  }
}

function createAdapter() {
  const document = new FakeDocument();
  const window = new FakeWindow();
  const input = new FakeInput();
  const adapter = new DomInputAdapter({ input, document, window });
  return { adapter, document, window, input };
}

test("mobile action commits exactly once only after its owning pointer is released", () => {
  const { adapter, document, input } = createAdapter();
  const action = document.getElementById("actionButton");

  const down = action.dispatch("pointerdown", { pointerId: 11 });
  assert.equal(down.defaultPrevented, true);
  assert.deepEqual(input.presses, []);
  assert.deepEqual(input.releases, []);
  assert.equal(action.classList.contains("active"), true);
  assert.equal(action.capturedPointer, 11);

  action.dispatch("pointerdown", { pointerId: 22 });
  action.dispatch("pointerup", { pointerId: 22 });
  assert.deepEqual(input.presses, []);
  assert.deepEqual(input.releases, []);
  assert.equal(action.classList.contains("active"), true);
  assert.equal(adapter.actionPointer, 11);

  const up = action.dispatch("pointerup", { pointerId: 11 });
  assert.equal(up.defaultPrevented, true);
  assert.deepEqual(input.presses, ["action"]);
  assert.deepEqual(input.releases, ["action"]);
  assert.equal(action.classList.contains("active"), false);
  assert.equal(action.capturedPointer, null);
  assert.equal(adapter.actionPointer, null);

  action.dispatch("pointerup", { pointerId: 11 });
  assert.deepEqual(input.presses, ["action"]);
  assert.deepEqual(input.releases, ["action"]);

  adapter.dispose();
});

test("mobile action suppresses exactly one pointer compatibility click after commit", () => {
  const { adapter, document, input } = createAdapter();
  const action = document.getElementById("actionButton");

  action.dispatch("pointerdown", { pointerId: 31 });
  action.dispatch("pointerup", { pointerId: 31 });
  assert.deepEqual(input.presses, ["action"]);
  assert.deepEqual(input.releases, ["action"]);
  assert.equal(adapter.suppressPointerClick, true);

  const compatibilityClick = document.dispatch("click", { detail: 1 });
  assert.equal(compatibilityClick.defaultPrevented, true);
  assert.equal(compatibilityClick.immediatePropagationStopped, true);
  assert.equal(adapter.suppressPointerClick, false);

  const laterPointerClick = document.dispatch("click", { detail: 1 });
  assert.equal(laterPointerClick.defaultPrevented, false);

  action.dispatch("pointerdown", { pointerId: 32 });
  action.dispatch("pointerup", { pointerId: 32 });
  const assistiveClick = document.dispatch("click", { detail: 0 });
  assert.equal(assistiveClick.defaultPrevented, false);
  assert.equal(adapter.suppressPointerClick, true);

  adapter.dispose();
  assert.equal(adapter.suppressPointerClick, false);
});

test("compatibility click suppression expires if the browser emits no click", () => {
  const { adapter, document, window } = createAdapter();
  const action = document.getElementById("actionButton");

  action.dispatch("pointerdown", { pointerId: 41 });
  action.dispatch("pointerup", { pointerId: 41 });
  assert.equal(adapter.suppressPointerClick, true);

  window.flushTimers();
  assert.equal(adapter.suppressPointerClick, false);
  const laterPointerClick = document.dispatch("click", { detail: 1 });
  assert.equal(laterPointerClick.defaultPrevented, false);

  adapter.dispose();
});

test("cancel, blur and pagehide clear mobile action ownership without firing gameplay", () => {
  const { adapter, document, window, input } = createAdapter();
  const action = document.getElementById("actionButton");

  action.dispatch("pointerdown", { pointerId: 21 });
  action.dispatch("pointercancel", { pointerId: 21 });
  assert.deepEqual(input.presses, []);
  assert.deepEqual(input.releases, []);
  assert.equal(action.classList.contains("active"), false);
  assert.equal(adapter.actionPointer, null);

  action.dispatch("pointerdown", { pointerId: 22 });
  window.dispatch("blur");
  assert.deepEqual(input.presses, []);
  assert.deepEqual(input.releases, []);
  assert.deepEqual(input.resets, ["window-blur"]);
  assert.equal(action.classList.contains("active"), false);
  assert.equal(adapter.actionPointer, null);
  action.dispatch("pointerup", { pointerId: 22 });
  assert.deepEqual(input.presses, []);

  action.dispatch("pointerdown", { pointerId: 23 });
  window.dispatch("pagehide");
  assert.deepEqual(input.presses, []);
  assert.deepEqual(input.releases, []);
  assert.deepEqual(input.resets, ["window-blur"]);
  assert.equal(action.classList.contains("active"), false);
  assert.equal(adapter.actionPointer, null);
  action.dispatch("pointerup", { pointerId: 23 });
  assert.deepEqual(input.presses, []);

  adapter.dispose();
  assert.deepEqual(input.resets, ["window-blur", "dom-dispose"]);
});

test("keyboard action semantics remain press on keydown and release on keyup", () => {
  const { adapter, window, input } = createAdapter();

  const down = window.dispatch("keydown", { code: "Space", repeat: false });
  assert.equal(down.defaultPrevented, true);
  assert.deepEqual(input.presses, ["action"]);
  assert.deepEqual(input.releases, []);

  window.dispatch("keydown", { code: "Space", repeat: true });
  assert.deepEqual(input.presses, ["action"]);

  window.dispatch("keyup", { code: "Space" });
  assert.deepEqual(input.releases, ["action"]);

  adapter.dispose();
});

test("keyboard movement aggregates simultaneous keys and releases them independently", () => {
  const { adapter, window, input } = createAdapter();

  const right = window.dispatch("keydown", { code: "ArrowRight", repeat: false });
  assert.equal(right.defaultPrevented, true);
  assert.deepEqual(input.axes.at(-1), { name: "move", value: { x: 1, y: 0, length: 1 } });

  window.dispatch("keydown", { code: "ArrowUp", repeat: false });
  assert.deepEqual(input.axes.at(-1), { name: "move", value: { x: 1, y: 1, length: 1 } });

  window.dispatch("keyup", { code: "ArrowRight" });
  assert.deepEqual(input.axes.at(-1), { name: "move", value: { x: 0, y: 1, length: 1 } });

  adapter.dispose();
});
