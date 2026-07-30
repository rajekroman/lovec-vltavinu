import test from "node:test";
import assert from "node:assert/strict";
import { AudioEngine } from "../../src/audio/AudioEngine.js";
import { EventBus } from "../../src/core/EventBus.js";
import { EVENT_CONTRACTS, validateEventPayload } from "../../src/core/GameEvents.js";

class FakeTarget {
  constructor() {
    this.listeners = new Map();
    this.hidden = false;
  }

  addEventListener(type, handler, options = {}) {
    if (options.signal?.aborted) return;
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
    options.signal?.addEventListener("abort", () => handlers.delete(handler), { once: true });
  }

  async dispatch(type, event = {}) {
    for (const handler of [...(this.listeners.get(type) ?? [])]) await handler(event);
  }
}

class FakeButton extends FakeTarget {
  constructor() {
    super();
    this.attributes = new Map();
    this.dataset = {};
    this.textContent = "";
    this.classList = { remove() {} };
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

function createContext() {
  const gain = {
    value: 1,
    setValueAtTime(value) {
      this.value = value;
    }
  };
  return {
    state: "suspended",
    currentTime: 0,
    destination: {},
    resumeCalls: 0,
    suspendCalls: 0,
    closeCalls: 0,
    createGain() {
      return { gain, connect() {}, disconnect() {} };
    },
    async resume() {
      this.resumeCalls += 1;
      this.state = "running";
    },
    async suspend() {
      this.suspendCalls += 1;
      this.state = "suspended";
    },
    async close() {
      this.closeCalls += 1;
      this.state = "closed";
    }
  };
}

function createHarness() {
  const events = new EventBus({ contracts: EVENT_CONTRACTS, strict: true, validatePayload: validateEventPayload });
  const document = new FakeTarget();
  const window = new FakeTarget();
  const button = new FakeButton();
  const context = createContext();
  const states = [];
  events.on("audio:state", payload => states.push(payload.state));
  const engine = new AudioEngine({
    events,
    document,
    window,
    button,
    contextFactory: () => context
  });
  return { engine, document, window, button, context, states };
}

test("AudioEngine creates one context only after a real gesture", async () => {
  const { engine, document, context, states } = createHarness();
  engine.start();
  assert.equal(engine.context, null);
  assert.equal(engine.snapshot().state, "locked");

  await document.dispatch("pointerdown");
  assert.equal(engine.context, context);
  assert.equal(context.resumeCalls, 1);
  assert.equal(engine.snapshot().state, "ready");

  await document.dispatch("keydown");
  assert.equal(engine.context, context);
  assert.equal(context.resumeCalls, 1);
  assert.deepEqual(states.slice(0, 2), ["locked", "ready"]);
});

test("mute, visibility suspend and dispose are idempotent", async () => {
  const { engine, document, button, context } = createHarness();
  engine.start();
  await document.dispatch("pointerdown");

  assert.equal(engine.setMuted(true), true);
  assert.equal(engine.setMuted(true), false);
  assert.equal(button.attributes.get("aria-pressed"), "true");

  document.hidden = true;
  await document.dispatch("visibilitychange");
  assert.equal(context.suspendCalls, 1);
  assert.equal(engine.snapshot().state, "suspended");

  await engine.dispose();
  await engine.dispose();
  assert.equal(context.closeCalls, 1);
  assert.equal(engine.snapshot().state, "disposed");
});

test("background return resumes only after a new gesture", async () => {
  const { engine, document, context } = createHarness();
  engine.start();
  await document.dispatch("pointerdown");
  document.hidden = true;
  await document.dispatch("visibilitychange");

  document.hidden = false;
  await document.dispatch("visibilitychange");
  assert.equal(context.resumeCalls, 1);
  assert.equal(engine.snapshot().state, "suspended");

  await document.dispatch("pointerdown");
  assert.equal(context.resumeCalls, 2);
  assert.equal(engine.snapshot().state, "ready");
});
