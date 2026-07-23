import test from "node:test";
import assert from "node:assert/strict";
import { EventBus } from "../../src/core/EventBus.js";
import { AudioEngine } from "../../src/audio/AudioEngine.js";

class FakeTarget {
  constructor() {
    this.listeners = new Map();
    this.hidden = false;
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  dispatch(type) {
    for (const handler of [...(this.listeners.get(type) ?? [])]) handler({ type });
  }
}

class FakeAudioParam {
  constructor(value = 1) {
    this.value = value;
  }

  setValueAtTime(value) {
    this.value = value;
  }

  linearRampToValueAtTime(value) {
    this.value = value;
  }

  cancelScheduledValues() {}
}

class FakeNode {
  constructor() {
    this.connections = [];
    this.gain = new FakeAudioParam();
  }

  connect(node) {
    this.connections.push(node);
    return node;
  }

  disconnect() {
    this.connections.length = 0;
  }
}

class FakeSource extends FakeNode {
  constructor() {
    super();
    this.started = false;
    this.stopped = false;
    this.loop = false;
    this.buffer = null;
    this.onended = null;
  }

  start() {
    this.started = true;
  }

  stop() {
    this.stopped = true;
  }
}

class FakeContext {
  constructor() {
    this.state = "suspended";
    this.currentTime = 1;
    this.destination = new FakeNode();
    this.sources = [];
    this.closed = false;
  }

  createGain() {
    return new FakeNode();
  }

  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  async decodeAudioData(data) {
    return { bytes: data.byteLength };
  }

  async resume() {
    this.state = "running";
  }

  async suspend() {
    this.state = "suspended";
  }

  async close() {
    this.closed = true;
    this.state = "closed";
  }
}

function createHarness() {
  const eventBus = new EventBus();
  const gestureTarget = new FakeTarget();
  const visibilityTarget = new FakeTarget();
  const windowTarget = new FakeTarget();
  const context = new FakeContext();
  const states = [];
  eventBus.on("audio:state", payload => states.push(payload));

  const engine = new AudioEngine({
    eventBus,
    gestureTarget,
    visibilityTarget,
    windowTarget,
    contextFactory: () => context,
    fetchImpl: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }),
    fadeMs: 0,
  });

  return { engine, eventBus, gestureTarget, visibilityTarget, context, states };
}

test("AudioEngine stays locked until a user gesture unlocks Web Audio", async () => {
  const { engine, gestureTarget, context, states } = createHarness();
  engine.start();
  assert.equal(engine.state, "locked");
  assert.equal(context.state, "suspended");

  gestureTarget.dispatch("pointerdown");
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.state, "running");
  assert.equal(engine.state, "ready");
  assert.deepEqual(states.at(-1), { state: "ready" });
});

test("AudioEngine crossfades scene music and stops the previous source", async () => {
  const { engine, context } = createHarness();
  engine.registerTrack("music-chlum", { url: "./assets/audio/chlum.ogg" });
  engine.registerTrack("music-nesmen", { url: "./assets/audio/nesmen.ogg" });
  await engine.unlock();

  assert.equal(await engine.playSceneMusic("chlum"), true);
  const firstSource = context.sources[0];
  assert.equal(firstSource.started, true);
  assert.equal(engine.currentMusic.id, "music-chlum");

  assert.equal(await engine.playSceneMusic("nesmen"), true);
  assert.equal(firstSource.stopped, true);
  assert.equal(engine.currentMusic.id, "music-nesmen");
});

test("AudioEngine suspends on background and resumes only when previously active", async () => {
  const { engine, visibilityTarget, context } = createHarness();
  await engine.unlock();
  engine.start();

  visibilityTarget.hidden = true;
  visibilityTarget.dispatch("visibilitychange");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(context.state, "suspended");
  assert.equal(engine.state, "suspended");

  visibilityTarget.hidden = false;
  visibilityTarget.dispatch("visibilitychange");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(context.state, "running");
  assert.equal(engine.state, "ready");
});

test("AudioEngine removes listeners and closes its context on dispose", async () => {
  const { engine, eventBus, context } = createHarness();
  engine.start();
  await engine.unlock();
  assert.ok(eventBus.listenerCount("dig:start") > 0);

  await engine.dispose();

  assert.equal(context.closed, true);
  assert.equal(engine.state, "disposed");
  assert.equal(eventBus.listenerCount("dig:start"), 0);
});
