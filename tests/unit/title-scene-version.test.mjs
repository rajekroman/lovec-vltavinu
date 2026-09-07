import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { TitleScene } from "../../src/scenes/TitleScene.js";

const rootUrl = new URL("../../", import.meta.url);
const html = fs.readFileSync(new URL("index.html", rootUrl), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("package.json", rootUrl), "utf8"));
const [major, minor] = pkg.version.split(".");
const expectedVersion = `v${major}.${minor} · Čtyři lokality`;

class FakeElement {
  addEventListener() {}
}

test("TitleScene runtime version matches the package candidate and static title label", async () => {
  const version = new FakeElement();
  version.textContent = "";

  const elements = new Map([
    ["playButton", new FakeElement()],
    ["howButton", new FakeElement()],
    ["closeHowButton", new FakeElement()],
    ["storyButton", new FakeElement()],
    ["settingsButton", new FakeElement()]
  ]);

  const document = {
    querySelector: selector => selector === ".version" ? version : null,
    getElementById: id => elements.get(id),
    addEventListener() {}
  };

  const scene = new TitleScene({
    document,
    screens: {
      showTitle() {},
      show() {},
      showStory() {},
      showSettings() {}
    },
    onStart() {}
  });

  await scene.enter();

  assert.equal(version.textContent, expectedVersion);
  assert.match(html, new RegExp(`<p class="version">${expectedVersion.replace(".", "\\.")}</p>`));
});
