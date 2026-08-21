import test from "node:test";
import assert from "node:assert/strict";
import {
  RADAR_DEFAULTS,
  resolveSweepAngle,
  resolveSignalStrength,
  resolvePulseProgress,
  resolvePulseOpacity,
  createRadarSweep
} from "../../src/render/RadarSweep.js";

const TAU = Math.PI * 2;

test("kužel se otáčí a po jedné otáčce se vrátí na začátek", () => {
  assert.equal(resolveSweepAngle(0), 0);
  const quarter = resolveSweepAngle(0.25 / RADAR_DEFAULTS.sweepSpeed);
  assert.ok(Math.abs(quarter - TAU * 0.25) < 1e-9);
  const full = resolveSweepAngle(1 / RADAR_DEFAULTS.sweepSpeed);
  assert.ok(full < 1e-9, "po plné otáčce je úhel zpět u nuly");
});

test("signál sílí s přiblížením a mimo dosah je nulový", () => {
  assert.equal(resolveSignalStrength(0, 400), 1);
  assert.equal(resolveSignalStrength(400, 400), 0);
  assert.equal(resolveSignalStrength(900, 400), 0);
  const far = resolveSignalStrength(300, 400);
  const near = resolveSignalStrength(100, 400);
  assert.ok(near > far, "bližší cíl musí dávat silnější signál");
});

test("nulový dosah nespadne na dělení nulou", () => {
  assert.equal(resolveSignalStrength(100, 0), 0);
});

test("prstenec doběhne na konci svého trvání", () => {
  assert.equal(resolvePulseProgress(0), 0);
  assert.equal(resolvePulseProgress(RADAR_DEFAULTS.pulseDuration), 1);
  assert.equal(resolvePulseProgress(99), 1);
});

test("prstenec naskočí a pak vyhasne do nuly", () => {
  assert.equal(resolvePulseOpacity(0), 0);
  assert.ok(resolvePulseOpacity(0.15) > 0.99, "na náběhu je plně vidět");
  assert.ok(resolvePulseOpacity(0.6) < resolvePulseOpacity(0.3), "pak slábne");
  assert.ok(resolvePulseOpacity(1) < 1e-9, "na konci je neviditelný");
});

// --- integrace nad minimálním Three.js ---

const vec = () => ({ x: 0, y: 0, z: 0, set(x, y, z = 0) { this.x = x; this.y = y; this.z = z; }, setScalar(v) { this.x = this.y = this.z = v; } });

class Node {
  constructor() {
    this.children = [];
    this.visible = true;
    this.position = vec();
    this.scale = vec();
    this.rotation = { x: 0, y: 0, z: 0 };
    this.name = "";
  }
  add(...c) { this.children.push(...c); }
  remove(...c) { this.children = this.children.filter(x => !c.includes(x)); }
}

const THREE_STUB = {
  Group: Node,
  Mesh: class extends Node {
    constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
  },
  CircleGeometry: class { dispose() { this.disposed = true; } },
  RingGeometry: class { dispose() { this.disposed = true; } },
  ShaderMaterial: class {
    constructor(o = {}) { Object.assign(this, o); }
    dispose() { this.disposed = true; }
  },
  MeshBasicMaterial: class {
    constructor(o = {}) { Object.assign(this, o); }
    dispose() { this.disposed = true; }
  },
  Color: class { constructor(v) { this.value = v; } },
  AdditiveBlending: 2
};

test("sken startuje skrytý a show/hide ho přepíná", () => {
  const sweep = createRadarSweep(THREE_STUB);
  assert.equal(sweep.object.visible, false);
  sweep.show();
  assert.equal(sweep.active, true);
  sweep.hide();
  assert.equal(sweep.active, false);
});

test("jas kužele roste se silou signálu", () => {
  const sweep = createRadarSweep(THREE_STUB);
  const cone = sweep.object.children[0];
  sweep.setSignal(0);
  sweep.update(0.016);
  const quiet = cone.material.uniforms.uStrength.value;
  sweep.setSignal(1);
  sweep.update(0.016);
  assert.ok(cone.material.uniforms.uStrength.value > quiet, "silný signál musí kužel rozsvítit");
  assert.ok(quiet > 0, "i bez signálu zůstává kužel čitelný");
});

test("pulz se rozepne a sám se ukončí", () => {
  const sweep = createRadarSweep(THREE_STUB);
  const pulse = sweep.object.children[1];
  assert.equal(pulse.visible, false);
  sweep.pulse();
  assert.equal(pulse.visible, true);
  sweep.update(RADAR_DEFAULTS.pulseDuration / 2);
  assert.ok(pulse.scale.x > 1, "prstenec se rozpíná");
  sweep.update(RADAR_DEFAULTS.pulseDuration);
  assert.equal(pulse.visible, false, "po doběhnutí zmizí");
});

test("skrytí zruší i rozběhnutý pulz", () => {
  const sweep = createRadarSweep(THREE_STUB);
  sweep.show();
  sweep.pulse();
  sweep.hide();
  assert.equal(sweep.object.children[1].visible, false);
});

test("dispose uvolní geometrie i materiály", () => {
  const sweep = createRadarSweep(THREE_STUB);
  const [cone, pulse] = sweep.object.children;
  sweep.dispose();
  assert.equal(cone.geometry.disposed, true);
  assert.equal(cone.material.disposed, true);
  assert.equal(pulse.geometry.disposed, true);
  assert.equal(pulse.material.disposed, true);
  assert.equal(sweep.object.children.length, 0);
});

test("bez Three.js namespace se sken nedá vytvořit", () => {
  assert.throws(() => createRadarSweep({}), TypeError);
});
