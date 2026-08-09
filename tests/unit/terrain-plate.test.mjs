import assert from "node:assert/strict";
import test from "node:test";
import { prepareTerrainPlateTexture } from "../../src/render/HybridRenderer.js";

const makeTexture = () => ({
  channel: -1,
  wrapS: "repeat",
  wrapT: "repeat",
  repeat: { x: 4, y: 3, set(x, y) { this.x = x; this.y = y; } },
  offset: { x: 0.25, y: 0.5, set(x, y) { this.x = x; this.y = y; } },
  needsUpdate: false,
  clone() {
    const copy = makeTexture();
    copy.channel = this.channel;
    copy.wrapS = this.wrapS;
    copy.wrapT = this.wrapT;
    copy.repeat.x = this.repeat.x;
    copy.repeat.y = this.repeat.y;
    copy.offset.x = this.offset.x;
    copy.offset.y = this.offset.y;
    return copy;
  }
});

test("terrain plates clamp edges and never repeat the authored image", () => {
  const source = makeTexture();
  const prepared = prepareTerrainPlateTexture(source, { ClampToEdgeWrapping: "clamp" });

  assert.notEqual(prepared, source);
  assert.equal(prepared.channel, 0);
  assert.equal(prepared.wrapS, "clamp");
  assert.equal(prepared.wrapT, "clamp");
  assert.deepEqual([prepared.repeat.x, prepared.repeat.y], [1, 1]);
  assert.deepEqual([prepared.offset.x, prepared.offset.y], [0, 0]);
  assert.equal(prepared.needsUpdate, true);

  assert.equal(source.wrapS, "repeat");
  assert.deepEqual([source.repeat.x, source.repeat.y], [4, 3]);
});
