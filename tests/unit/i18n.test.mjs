import test from "node:test";
import assert from "node:assert/strict";
import { I18n, SUPPORTED } from "../../src/core/I18n.js";

const CS = {
  title: "Lovec vltavínů",
  ui: { startGame: "ZAČÍT HRU", continue: "POKRAČOVAT" },
  dig: { title: "Drž rytmus lopaty" }
};

const EN = {
  title: "Moldavite Hunter",
  ui: { startGame: "START GAME", continue: "CONTINUE" },
  dig: { title: "Keep the shovel rhythm" }
};

test("I18n defaults to cs locale", () => {
  const i18n = new I18n();
  assert.equal(i18n.locale, "cs");
});

test("I18n translates top-level key", () => {
  const i18n = new I18n("cs");
  i18n.load("cs", CS);
  assert.equal(i18n.t("title"), "Lovec vltavínů");
});

test("I18n translates nested key with dot notation", () => {
  const i18n = new I18n("cs");
  i18n.load("cs", CS);
  assert.equal(i18n.t("ui.startGame"), "ZAČÍT HRU");
  assert.equal(i18n.t("dig.title"), "Drž rytmus lopaty");
});

test("I18n returns fallback for missing key", () => {
  const i18n = new I18n("cs");
  i18n.load("cs", CS);
  assert.equal(i18n.t("nonexistent.key", "fallback"), "fallback");
  assert.equal(i18n.t("nonexistent.key"), "nonexistent.key");
});

test("I18n switches locale and translates correctly", () => {
  const i18n = new I18n("cs");
  i18n.load("cs", CS);
  i18n.load("en", EN);

  assert.equal(i18n.t("title"), "Lovec vltavínů");
  i18n.setLocale("en");
  assert.equal(i18n.locale, "en");
  assert.equal(i18n.t("title"), "Moldavite Hunter");
  assert.equal(i18n.t("ui.continue"), "CONTINUE");
});

test("I18n ignores unsupported locale", () => {
  const i18n = new I18n("cs");
  i18n.load("cs", CS);
  i18n.setLocale("fr");
  assert.equal(i18n.locale, "cs");
});

test("I18n calls onChange listener on locale change", () => {
  const i18n = new I18n("cs");
  i18n.load("cs", CS);
  i18n.load("en", EN);

  let called = null;
  i18n.onChange(locale => { called = locale; });
  i18n.setLocale("en");
  assert.equal(called, "en");
});

test("I18n onChange unsubscribe removes listener", () => {
  const i18n = new I18n("cs");
  i18n.load("cs", CS);
  i18n.load("en", EN);

  let count = 0;
  const unsub = i18n.onChange(() => count++);
  i18n.setLocale("en");
  assert.equal(count, 1);
  unsub();
  i18n.setLocale("cs");
  assert.equal(count, 1);
});

test("I18n does not call listener if locale unchanged", () => {
  const i18n = new I18n("cs");
  i18n.load("cs", CS);

  let count = 0;
  i18n.onChange(() => count++);
  i18n.setLocale("cs");
  assert.equal(count, 0);
});

test("SUPPORTED exports cs and en locales", () => {
  assert.ok(SUPPORTED.includes("cs"));
  assert.ok(SUPPORTED.includes("en"));
});
