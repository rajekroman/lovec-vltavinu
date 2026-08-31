import test from "node:test";
import assert from "node:assert/strict";

import { SceneTransition } from "../../src/ui/SceneTransition.js";

class FakeElement {
  constructor() {
    this.id = "";
    this.style = {};
    this.removed = false;
  }

  remove() {
    this.removed = true;
  }
}

class FakeDocument {
  constructor() {
    this.body = {
      children: [],
      appendChild: element => {
        this.body.children.push(element);
      }
    };
  }

  createElement() {
    return new FakeElement();
  }
}

test("fadeOut blocks pointer input until fadeIn has completed", async () => {
  const document = new FakeDocument();
  const transition = new SceneTransition(document);

  const fadeOut = transition.fadeOut(0);
  const overlay = transition.overlay;

  assert.ok(overlay);
  assert.equal(overlay.style.opacity, "1");
  assert.equal(overlay.style.pointerEvents, "auto");
  await fadeOut;
  assert.equal(overlay.style.pointerEvents, "auto", "scene swap must remain input-blocked while black");

  const fadeIn = transition.fadeIn(0);
  assert.equal(overlay.style.opacity, "0");
  assert.equal(overlay.style.pointerEvents, "auto", "input must stay blocked until fade-in finishes");
  await fadeIn;
  assert.equal(overlay.style.pointerEvents, "none");
});

test("dispose removes the transition overlay after a completed fade", async () => {
  const document = new FakeDocument();
  const transition = new SceneTransition(document);

  await transition.fadeOut(0);
  await transition.fadeIn(0);
  const overlay = transition.overlay;
  transition.dispose();

  assert.equal(overlay.removed, true);
  assert.equal(transition.overlay, null);
});
