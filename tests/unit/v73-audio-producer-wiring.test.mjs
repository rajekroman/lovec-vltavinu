import test from "node:test";
import assert from "node:assert/strict";
import { ScreenController } from "../../src/ui/ScreenController.js";

class FakeClassList {
  toggle() {}
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.children = [];
    this.textContent = "";
    this.disabled = false;
    this.onclick = null;
    this.style = {};
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  querySelector() { return null; }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
}

class FakeDocument {
  constructor() { this.elements = new Map(); }

  getElementById(id) {
    if (!this.elements.has(id)) this.elements.set(id, new FakeElement(id));
    return this.elements.get(id);
  }

  querySelectorAll() { return []; }

  createElement() { return new FakeElement(); }
}

test("ScreenController result screen produces exactly one v7.3 result sound", () => {
  const document = new FakeDocument();
  let calls = 0;
  const audio = {
    playLevelResult() {
      calls += 1;
      return true;
    }
  };
  const screens = new ScreenController(document, { audio });

  screens.showLevelResult({
    title: "Hotovo",
    text: "Výprava pokračuje.",
    score: 42,
    stats: []
  });

  assert.equal(calls, 1);
  assert.equal(screens.activeId, "resultScreen");
});
