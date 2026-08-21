import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveDepth,
  resolveDepthScale,
  resolveRenderOrder,
  resolveHazeAmount,
  resolveVisualProfile,
  ACTOR_LAYER_ORDER,
  VisualEngine
} from "../../src/render/VisualEngine.js";

const BOUNDS = { x: 0, y: 0, width: 1600, height: 1200 };

class FakeColor {
  constructor(value = 0) {
    this.value = value;
  }
  clone() {
    return new FakeColor(this.value);
  }
  lerpColors(from, to, t) {
    this.value = from.value + (to.value - from.value) * t;
    return this;
  }
}

class FakeSprite {
  constructor(name = "sprite") {
    this.name = name;
    this.isSprite = true;
    this.children = [];
    this.renderOrder = 0;
    this.userData = {};
    this.position = { x: 0, y: 0, z: 0 };
    this.scale = { x: 80, y: 100, z: 1, set(x, y, z = 1) { this.x = x; this.y = y; this.z = z; } };
    this.material = { color: new FakeColor(0xffffff), userData: {} };
  }
  add(child) {
    this.children.push(child);
  }
}

class FakeGroup extends FakeSprite {
  constructor(name = "group") {
    super(name);
    this.isSprite = false;
    this.isGroup = true;
    this.material = null;
  }
}

const THREE_STUB = {
  Color: FakeColor,
  Sprite: FakeSprite,
  SpriteMaterial: class {
    constructor(options = {}) {
      Object.assign(this, options);
    }
  },
  CanvasTexture: class {}
};

const createEngine = (locationId = "chlum") => new VisualEngine({
  three: THREE_STUB,
  locationId,
  bounds: BOUNDS
});

test("hloubka roste od popředí k horizontu a za horizontem se ořízne", () => {
  const profile = resolveVisualProfile("chlum");
  assert.equal(resolveDepth(0, BOUNDS, profile), 0);
  assert.ok(resolveDepth(600, BOUNDS, profile) > 0);
  assert.equal(resolveDepth(5000, BOUNDS, profile), 1);
});

test("vzdálený aktér je menší než ten v popředí", () => {
  const profile = resolveVisualProfile("chlum");
  const foreground = resolveDepthScale(0, profile);
  const horizon = resolveDepthScale(1, profile);
  assert.ok(horizon < foreground, `u horizontu ${horizon} musí být menší než v popředí ${foreground}`);
});

test("holé pole Ločenic sbíhá silněji než pole na Chlumu", () => {
  const locenice = resolveDepthScale(1, resolveVisualProfile("locenice"));
  const chlum = resolveDepthScale(1, resolveVisualProfile("chlum"));
  assert.ok(locenice < chlum, "otevřená rovina musí ubývat rychleji");
});

test("opar se drží mimo popředí a roste do dálky", () => {
  const profile = resolveVisualProfile("nesmen");
  assert.equal(resolveHazeAmount(0, profile), 0);
  assert.ok(resolveHazeAmount(1, profile) > resolveHazeAmount(0.5, profile));
});

test("bližší aktér se kreslí přes vzdálenějšího", () => {
  assert.ok(resolveRenderOrder(0) > resolveRenderOrder(1));
});

test("obalová skupina si drží pořadí vrstvy, hloubka jde na sprity", () => {
  const engine = createEngine();
  const sprite = new FakeSprite("actor");
  const group = new FakeGroup("idle-wrapper");
  group.add(sprite);

  engine.track(group, { shadow: false });
  group.position.y = 0;
  engine.apply(group);

  assert.equal(group.renderOrder, ACTOR_LAYER_ORDER, "skupina nesmí přepsat groupOrder potomků");
  assert.equal(sprite.renderOrder, resolveRenderOrder(0), "hloubka patří na sprite");
});

test("aktér u horizontu se kreslí dřív než aktér v popředí", () => {
  const engine = createEngine();
  const near = new FakeSprite("near");
  const far = new FakeSprite("far");
  engine.track(near, { shadow: false });
  engine.track(far, { shadow: false });

  near.position.y = 0;
  far.position.y = BOUNDS.height;
  engine.update();

  assert.ok(near.renderOrder > far.renderOrder, "bližší aktér musí být nahoře");
  assert.ok(Math.abs(near.scale.x) > Math.abs(far.scale.x), "bližší aktér musí být větší");
});

test("převrácený sprite si po korekci měřítka udrží směr", () => {
  const engine = createEngine();
  const sprite = new FakeSprite("flipped");
  engine.track(sprite, { shadow: false });
  sprite.scale.x = -Math.abs(sprite.scale.x);
  sprite.position.y = 400;
  engine.apply(sprite);

  assert.ok(sprite.scale.x < 0, "převrácení se nesmí ztratit");
});

test("untrack odstraní aktéra z přepočtu", () => {
  const engine = createEngine();
  const sprite = new FakeSprite("gone");
  engine.track(sprite, { shadow: false });
  assert.equal(engine.untrack(sprite), true);
  assert.equal(engine.apply(sprite), null);
});
