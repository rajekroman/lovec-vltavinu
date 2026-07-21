import { test, expect } from "@playwright/test";

async function openDebugGame(page) {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/?debug", { waitUntil: "networkidle" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime && window.__lovecDebug))).toBe(true);
  return pageErrors;
}

test("titulní obrazovka spustí mobilní level bez konfliktu UI", async ({ page }) => {
  const pageErrors = await openDebugGame(page);

  await page.locator("#playButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").click();

  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect(page.locator("#hud")).not.toHaveClass(/hidden/);
  await expect(page.locator("#controls")).not.toHaveClass(/hidden/);
  await expect(page.locator(".screen.visible")).toHaveCount(0);

  const snapshot = await page.evaluate(() => window.__lovecRuntime.snapshot());
  expect(snapshot.stable).toBe(true);
  expect(snapshot.appPlaying).toBe(true);
  expect(snapshot.hudHidden).toBe(false);
  expect(snapshot.controlsHidden).toBe(false);

  const canvas = await page.locator("#game").evaluate(element => ({
    width: element.width,
    height: element.height,
    cssWidth: element.getBoundingClientRect().width,
    cssHeight: element.getBoundingClientRect().height
  }));
  expect(canvas.width).toBeGreaterThan(0);
  expect(canvas.height).toBeGreaterThan(0);
  expect(canvas.cssWidth).toBeGreaterThan(300);
  expect(canvas.cssHeight).toBeGreaterThan(600);
  expect(pageErrors).toEqual([]);
});

test("dialog se vždy vrátí do ovladatelného herního stavu", async ({ page }) => {
  const pageErrors = await openDebugGame(page);

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(280, 990);
  });
  await page.locator("#actionButton").click();

  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await expect(page.locator("#controls")).toHaveClass(/hidden/);
  await page.locator("#dialogButton").click();

  await expect(page.locator(".screen.visible")).toHaveCount(0);
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect(page.locator("#controls")).not.toHaveClass(/hidden/);

  const snapshot = await page.evaluate(() => window.__lovecRuntime.snapshot());
  expect(snapshot.stable).toBe(true);
  expect(snapshot.screen).toBe("playing");
  expect(pageErrors).toEqual([]);
});

test("reset runtime uvolní zadržený joystick a klávesy", async ({ page }) => {
  const pageErrors = await openDebugGame(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));

  const zone = page.locator("#moveZone");
  const box = await zone.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.5, { steps: 3 });

  await expect.poll(() => zone.locator("#stick").evaluate(element => element.style.transform)).not.toBe("translate(-50%,-50%)");
  await page.evaluate(() => window.__lovecRuntime.resetInput("playwright-smoke"));
  await page.mouse.up();

  await expect(zone.locator("#stick")).toHaveCSS("transform", "matrix(1, 0, 0, 1, -29, -29)");
  const snapshot = await page.evaluate(() => window.__lovecRuntime.snapshot());
  expect(snapshot.activeMovePointer).toBeNull();
  expect(snapshot.resetLog.at(-1)?.reason).toBe("playwright-smoke");
  expect(pageErrors).toEqual([]);
});

test("změna orientace zachová canvas i dotykové ovládání", async ({ page }) => {
  const pageErrors = await openDebugGame(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(250);

  await expect(page.locator("#controls")).not.toHaveClass(/hidden/);
  await expect(page.locator(".screen.visible")).toHaveCount(0);

  const state = await page.evaluate(() => ({
    runtime: window.__lovecRuntime.snapshot(),
    canvas: {
      width: document.getElementById("game").width,
      height: document.getElementById("game").height
    }
  }));
  expect(state.runtime.stable).toBe(true);
  expect(state.runtime.appPlaying).toBe(true);
  expect(state.canvas.width).toBeGreaterThan(0);
  expect(state.canvas.height).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
});

test("runtime odstraní konflikt více viditelných obrazovek", async ({ page }) => {
  const pageErrors = await openDebugGame(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));

  await page.evaluate(() => {
    document.getElementById("titleScreen").classList.add("visible");
    document.getElementById("pauseScreen").classList.add("visible");
    window.__lovecRuntime.reconcileUi();
  });

  await expect(page.locator(".screen.visible")).toHaveCount(1);
  await expect(page.locator("#hud")).toHaveClass(/hidden/);
  await expect(page.locator("#controls")).toHaveClass(/hidden/);

  const snapshot = await page.evaluate(() => window.__lovecRuntime.snapshot());
  expect(snapshot.stable).toBe(true);
  expect(snapshot.appPlaying).toBe(true);
  expect(pageErrors).toEqual([]);
});
