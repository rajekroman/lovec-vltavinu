import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { getDialogueDefinition } from "../../src/data/dialogues.js";

const rootUrl = new URL("../../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, rootUrl), "utf8");
const slaviaScene = read("src/scenes/SlaviaScene.js");
const besedniceScene = read("src/scenes/BesedniceScene.js");

test("Slavia dialogues are normalized into dialogues.js, matching Chlum/Nesměň/Besednice", () => {
  const consultation = getDialogueDefinition("slavia-expert-consultation");
  assert.equal(consultation.speaker.entityId, "expert-eva");
  assert.match(consultation.lines.join(" "), /Franta/);
  assert.equal(consultation.actionLabel, "ZASTAVIT FRANTU");

  const certification = getDialogueDefinition("slavia-certification");
  assert.equal(certification.speaker.entityId, "expert-eva");
  assert.match(certification.lines.join(" "), /Na Zelené Vlně/);

  assert.match(slaviaScene, /getDialogueDefinition\("slavia-expert-consultation"\)/);
  assert.match(slaviaScene, /getDialogueDefinition\("slavia-certification"\)/);
  assert.doesNotMatch(slaviaScene, /Dokumentace sedí\. Franta/);
  assert.doesNotMatch(slaviaScene, /Sbírka je ověřena a může/);
});

test("Karel and František react with a one-shot confirm dialog when stopped", () => {
  const karel = getDialogueDefinition("besednice-karel-defeated");
  assert.equal(karel.speaker.entityId, "crystal-karel");
  assert.equal(karel.speaker.role, "rival");

  const franta = getDialogueDefinition("slavia-franta-defeated");
  assert.equal(franta.speaker.entityId, "thief-franta");
  assert.equal(franta.speaker.role, "thief");

  assert.match(besedniceScene, /getDialogueDefinition\("besednice-karel-defeated"\)/);
  assert.match(slaviaScene, /getDialogueDefinition\("slavia-franta-defeated"\)/);
});

test("Besednice defers the result screen while Karel's defeat dialog is open", () => {
  assert.match(besedniceScene, /objective\.complete && !this\.resultShown && !this\.modal/);
});
