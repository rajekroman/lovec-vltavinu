import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const CONFIG_URL = new URL("../../playwright.config.mjs", import.meta.url);
const CONTRACT_URL = new URL("../qa/certification-contract.md", import.meta.url);

const compact = value => value.replace(/\s+/g, "");

test("A6 Playwright configuration declares the required three-project matrix", async () => {
  const source = await readFile(CONFIG_URL, "utf8");

  for (const projectName of ["desktop-chromium", "iphone-portrait", "iphone-landscape"]) {
    assert.match(source, new RegExp(`name:\\s*\\"${projectName}\\"`));
  }

  assert.match(source, /width:\s*1440,\s*height:\s*900/);
  assert.match(source, /width:\s*390,\s*height:\s*844/);
  assert.match(source, /width:\s*844,\s*height:\s*390/);
});

test("A6 separates desktop keyboard tests from touch-oriented suites", async () => {
  const source = compact(await readFile(CONFIG_URL, "utf8"));
  assert.match(source, /name:"desktop-chromium",testMatch:\/desktop-smoke\\\.spec\\\.mjs\//);
  assert.match(source, /name:"iphone-portrait",testMatch:\/mobile-smoke\\\.spec\\\.mjs\//);
  assert.match(source, /name:"iphone-landscape",testMatch:\/landscape-smoke\\\.spec\\\.mjs\//);

  const desktopBlock = source.match(/name:"desktop-chromium"[\s\S]*?name:"iphone-portrait"/)?.[0] ?? "";
  assert.doesNotMatch(desktopBlock, /hasTouch:true/);
});

test("A6 certification contract excludes the warm-up run and requires two later green runs", async () => {
  const contract = await readFile(CONTRACT_URL, "utf8");

  assert.match(contract, /first complete matrix run[\s\S]*does not count/i);
  assert.match(contract, /Two subsequent complete green workflow runs/i);
  assert.match(contract, /same confirmed SHA/i);
  assert.match(contract, /A0 confirms the final head/i);
});