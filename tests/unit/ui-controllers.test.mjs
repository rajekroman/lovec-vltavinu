import test from "node:test";
import assert from "node:assert/strict";
import { DIG_REQUIRED_HITS } from "../../src/data/levels.js";
import { HudController } from "../../src/ui/HudController.js";
import { ScreenController } from "../../src/ui/ScreenController.js";

class FakeClassList {
  constructor(initial = []) {
    this.values = new Set(initial);
  }

  add(...names) {
    for (const name of names) this.values.add(name);
  }

  remove(...names) {
    for (const name of names) this.values.delete(name);
  }

  toggle(name, force) {
    if (force === undefined) {
      if (this.values.has(name)) this.values.delete(name);
      else this.values.add(name);
    } else if (force) this.values.add(name);
    else this.values.delete(name);
    return this.values.has(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(id = "", classes = []) {
    this.id = id;
    this.classList = new FakeClassList(classes);
    this.style = {};
    this.attributes = new Map();
    this.textContent = "";
    this.disabled = false;
    this.onclick = null;
    this.inert = false;
    this.children = [];
    this.focused = false;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }

  querySelector(selector) {
    if (selector === "button:not([disabled])") {
      return this.children.find(child => child.tagName === "BUTTON" && !child.disabled) ?? null;
    }
    return null;
  }

  focus() {
    this.focused = true;
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = children;
  }
}

class FakeDocument {
  constructor() {
    this.elements = new Map();
  }

  add(id, classes = [], tagName = "DIV") {
    const element = new FakeElement(id, classes);
    element.tagName = tagName;
    this.elements.set(id, element);
    return element;
  }

  getElementById(id) {
    return this.elements.get(id) ?? null;
  }

  querySelectorAll(selector) {
    const all = [...this.elements.values()];
    if (selector === ".screen") return all.filter(element => element.classList.contains("screen"));
    if (selector === "button") return all.filter(element => element.tagName === "BUTTON");
    return [];
  }

  createElement(tagName) {
    const element = new FakeElement();
    element.tagName = tagName.toUpperCase();
    return element;
  }
}

class FakeEvents {
  on(type, handler) {
    this.type = type;
    this.handler = handler;
    return () => { this.handler = null; };
  }
}

const createUiDocument = () => {
  const document = new FakeDocument();
  for (const id of [
    "app", "hud", "controls", "missionNumber", "placeLabel", "objectiveLabel", "bagValue",
    "heatPill", "dangerMeterText", "heatFill", "dangerBanner", "dangerText", "hint",
    "actionButton", "actionIcon", "actionText", "briefKicker", "briefTitle", "briefText",
    "briefGoal", "dialogName", "dialogText", "dialogAvatar", "digTitle", "digInfo",
    "digHits", "digMarker", "sweetZone", "resultKicker", "resultTitle", "resultText",
    "resultScore", "resultStats"
  ]) document.add(id);

  for (const id of [
    "actionButton", "briefButton", "dialogButton", "digButton", "againButton",
    "resultRecordsButton", "resumeButton", "menuButton"
  ]) {
    if (!document.getElementById(id)) document.add(id, [], "BUTTON");
    else document.getElementById(id).tagName = "BUTTON";
  }

  for (const id of [
    "titleScreen", "briefScreen", "dialogScreen", "digScreen", "resultScreen", "pauseScreen"
  ]) document.add(id, ["screen"]);

  return document;
};

test("HudController renders Chlum action and tractor danger states from a revisioned model", () => {
  const document = createUiDocument();
  const events = new FakeEvents();
  const hud = new HudController({ document, events });

  assert.equal(events.type, "hud:model:changed");
  events.handler({
    revision: 1,
    model: {
      missionNumber: 1,
      placeLabel: "Chlum",
      objective: "Promluv s Václavem",
      findings: 2,
      danger: 0.92,
      hint: "Přibliž se k Václavovi",
      actionReady: true,
      actionLabel: "MLUVIT",
      actionIcon: "!"
    }
  });

  assert.equal(document.getElementById("placeLabel").textContent, "CHLUM");
  assert.equal(document.getElementById("objectiveLabel").textContent, "Promluv s Václavem");
  assert.equal(document.getElementById("heatFill").style.width, "92%");
  assert.equal(document.getElementById("dangerMeterText").textContent, "KRITICKÉ");
  assert.equal(document.getElementById("heatPill").classList.contains("detected"), true);
  assert.equal(document.getElementById("heatPill").classList.contains("critical"), true);
  assert.equal(document.getElementById("dangerBanner").classList.contains("hidden"), false);
  assert.equal(document.getElementById("dangerText").textContent, "TRAKTOR JE BLÍZKO");
  assert.equal(document.getElementById("app").classList.contains("danger-state"), true);
  assert.equal(document.getElementById("actionButton").classList.contains("ready"), true);
  assert.equal(document.getElementById("actionButton").getAttribute("aria-label"), "MLUVIT");
  assert.equal(document.getElementById("actionIcon").textContent, "!");

  events.handler({ revision: 1, model: { objective: "stale" } });
  assert.equal(document.getElementById("objectiveLabel").textContent, "Promluv s Václavem");
  hud.dispose();
  assert.equal(document.getElementById("app").classList.contains("danger-state"), false);
});

test("ScreenController exposes one-button dialog and exact-three dig overlay without gameplay state", () => {
  const document = createUiDocument();
  const screens = new ScreenController(document);
  let confirmed = 0;
  screens.showDialog({
    name: "Václav",
    text: "Na poli můžeš hledat, ale dávej pozor na traktor.",
    avatar: "V",
    buttonLabel: "ROZUMÍM",
    onConfirm: () => { confirmed += 1; }
  });

  assert.equal(screens.activeId, "dialogScreen");
  assert.equal(document.getElementById("dialogName").textContent, "VÁCLAV");
  assert.equal(document.getElementById("controls").classList.contains("hidden"), true);
  assert.equal(document.getElementById("dialogScreen").getAttribute("aria-hidden"), "false");
  document.getElementById("dialogButton").onclick({ preventDefault() {} });
  assert.equal(confirmed, 1);

  screens.showDig({
    hits: 2,
    requiredHits: DIG_REQUIRED_HITS,
    marker: 0.5,
    sweetMin: 0.4,
    sweetMax: 0.6,
    onAction() {}
  });
  assert.equal(screens.activeId, "digScreen");
  assert.equal(document.getElementById("digHits").textContent, "◆ ◆ ◇");
  assert.equal(document.getElementById("digMarker").style.left, "calc(50% - 5px)");
  assert.equal(document.getElementById("sweetZone").style.left, "40%");
  assert.equal(document.getElementById("sweetZone").style.width, "19.999999999999996%");
  assert.match(document.getElementById("digButton").getAttribute("aria-label"), /2 z 3/);
  assert.throws(() => screens.updateDig({ requiredHits: 4 }), /literal 3/);
});

test("ScreenController renders a generic level result and restores playing overlays", () => {
  const document = createUiDocument();
  const screens = new ScreenController(document);
  let continued = false;
  screens.showLevelResult({
    title: "První nález je v bezpečí",
    text: "Chlum je dokončen.",
    score: 150,
    stats: [{ label: "NÁLEZY", value: 1 }],
    onContinue: () => { continued = true; }
  });

  assert.equal(document.getElementById("resultKicker").textContent, "ÚROVEŇ DOKONČENA");
  assert.equal(document.getElementById("resultScore").textContent, "150");
  assert.equal(document.getElementById("resultStats").children.length, 1);
  assert.equal(document.getElementById("resultStats").children[0].children[0].textContent, "NÁLEZY");
  document.getElementById("againButton").onclick({ preventDefault() {} });
  assert.equal(continued, true);

  screens.play();
  assert.equal(screens.activeId, null);
  assert.equal(document.getElementById("hud").classList.contains("hidden"), false);
  assert.equal(document.getElementById("controls").classList.contains("hidden"), false);
});
