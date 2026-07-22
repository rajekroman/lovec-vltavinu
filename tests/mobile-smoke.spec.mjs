import fs from "node:fs";
import { test, expect } from "@playwright/test";

async function openBootstrap(page) {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  return pageErrors;
}

async function enterChlum(page) {
  await page.locator("#playButton").tap();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 1 / 4");
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect(page.locator("#hud")).not.toHaveClass(/hidden/);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().chlum?.runtime?.player !== null)).toBe(true);
}

async function snapshot(page) {
  return page.evaluate(() => window.__lovecRuntime.snapshot());
}

async function holdKeyUntil(page, key, predicate, argument, timeout = 15_000) {
  await page.keyboard.down(key);
  try {
    await expect.poll(() => page.evaluate(predicate, argument), {
      timeout,
      intervals: [30, 60, 100]
    }).toBe(true);
  } finally {
    await page.keyboard.up(key);
  }
}

async function holdUntilInteraction(page, key, kind, timeout = 15_000) {
  await holdKeyUntil(page, key, expected => (
    window.__lovecRuntime.snapshot().chlum?.runtime?.available?.kind === expected
  ), kind, timeout);
}

async function holdUntilCoordinate(page, key, condition, timeout = 15_000) {
  await holdKeyUntil(page, key, target => {
    const player = window.__lovecRuntime.snapshot().chlum?.runtime?.player;
    if (!player) return false;
    return target.axis === "x"
      ? (target.direction < 0 ? player.x <= target.value : player.x >= target.value)
      : (target.direction < 0 ? player.y <= target.value : player.y >= target.value);
  }, condition, timeout);
}

async function contextualAction(page) {
  await page.keyboard.press("Space");
}

async function strikeDigInsideSweetZone(page, expectedHit) {
  await expect.poll(() => page.evaluate(hit => {
    const before = window.__lovecRuntime.snapshot().chlum?.runtime;
    if (!before) return false;
    if (before.digHits === hit) return true;
    const position = before.dig?.position;
    if (before.digHits !== hit - 1 || typeof position !== "number" || position < 0.42 || position > 0.58) return false;
    document.getElementById("digButton")?.click();
    return window.__lovecRuntime.snapshot().chlum?.runtime?.digHits === hit;
  }, expectedHit), { timeout: 8_000, intervals: [30, 60, 100] }).toBe(true);
}

async function captureEvidence(page, testInfo, name) {
  const directory = testInfo.outputPath("visual-evidence");
  fs.mkdirSync(directory, { recursive: true });
  const path = `${directory}/${name}.png`;
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

const compactTransform = value => String(value).replace(/\s+/g, "");

test("complete Chlum flow works from PLAY and records portrait/landscape evidence", async ({ page, context }, testInfo) => {
  test.setTimeout(120_000);
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);

  await holdUntilInteraction(page, "ArrowRight", "permission");
  await contextualAction(page);
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await expect(page.locator("#dialogName")).toHaveText("VÁCLAV");
  await page.locator("#dialogButton").tap();
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().session.flags.chlumPermission)).toBe(true);

  await captureEvidence(page, testInfo, "chlum-portrait");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.__lovecRuntime.resize());
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().renderer.width)).toBe(844);
  await captureEvidence(page, testInfo, "chlum-landscape");

  await page.locator("#pauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#resumeButton").click();
  await expect(page.locator("#app")).toHaveClass(/playing/);

  const other = await context.newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  await page.waitForTimeout(120);
  await page.bringToFront();
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().running)).toBe(true);
  await other.close();

  await holdUntilCoordinate(page, "ArrowLeft", { axis: "x", direction: -1, value: 125 });
  await holdUntilCoordinate(page, "ArrowUp", { axis: "y", direction: 1, value: 840 });
  await holdUntilCoordinate(page, "ArrowRight", { axis: "x", direction: 1, value: 1000 });
  await holdUntilInteraction(page, "ArrowDown", "dig");
  await contextualAction(page);
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);

  for (let hit = 1; hit <= 3; hit++) await strikeDigInsideSweetZone(page, hit);
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().chlum?.runtime?.available?.kind === "collect")).toBe(true);
  await contextualAction(page);
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);

  const completed = await snapshot(page);
  expect(completed.session.findings).toHaveLength(1);
  expect(completed.session.findings[0]).toEqual({ findingId: "chlum-finding-1", locality: "chlum", rarity: "B", weight: 1.2, score: 90 });
  expect(completed.session.score).toBe(90);
  expect(completed.session.objective.complete).toBe(true);
  expect(completed.chlum.levelComplete).toEqual({ levelId: "chlum", nextLevelId: "nesmen", score: 90 });
  expect(completed.scene).toBe("chlum");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);

  await page.locator("#againButton").click();
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await page.locator("#playButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  const fresh = await page.evaluate(() => window.__lovecRuntime.snapshot().session);
  expect(fresh.levelId).toBe("chlum");
  expect(fresh.findings).toEqual([]);
  expect(fresh.score).toBe(0);
  expect(fresh.flags).toEqual({});
  expect(fresh.danger).toBe(0);
  expect(pageErrors).toEqual([]);
});

test("tractor collision raises danger, returns player to spawn and does not freeze input", async ({ page }) => {
  test.setTimeout(75_000);
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);

  await holdUntilCoordinate(page, "ArrowLeft", { axis: "x", direction: -1, value: 125 });
  await holdUntilCoordinate(page, "ArrowUp", { axis: "y", direction: 1, value: 570 });
  await holdKeyUntil(page, "ArrowRight", () => window.__lovecRuntime.snapshot().session.danger > 0, null, 15_000);

  const state = await snapshot(page);
  expect(state.session.danger).toBeGreaterThan(0);
  expect(state.chlum.runtime.player.x).toBeLessThan(190);
  expect(state.chlum.runtime.player.y).toBeLessThan(450);
  expect(state.running).toBe(true);
  await page.locator("#pauseButton").tap();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#resumeButton").click();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  expect(pageErrors).toEqual([]);
});

test("runtime reset releases the mobile joystick in the Chlum scene", async ({ page }) => {
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);
  const zone = page.locator("#moveZone");
  const stick = page.locator("#stick");
  const box = await zone.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.5, { steps: 3 });
  await expect.poll(async () => compactTransform(await stick.evaluate(element => element.style.transform))).not.toBe("translate(-50%,-50%)");
  await page.evaluate(() => window.__lovecRuntime.resetInput("playwright-smoke"));
  await page.mouse.up();
  await expect.poll(async () => compactTransform(await stick.evaluate(element => element.style.transform))).toBe("translate(-50%,-50%)");
  expect(pageErrors).toEqual([]);
});
