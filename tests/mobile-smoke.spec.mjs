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
  await expect(page.locator("#controls")).not.toHaveClass(/hidden/);
  await expect(page.locator(".screen.visible")).toHaveCount(0);
}

const compactTransform = value => String(value).replace(/\s+/g, "");

test("title starts the canonical Chlum integration scene", async ({ page }) => {
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);

  const snapshot = await page.evaluate(() => window.__lovecRuntime.snapshot());
  expect(snapshot.stable).toBe(true);
  expect(snapshot.scene).toBe("chlum");
  expect(snapshot.screen).toBe("playing");
  expect(snapshot.running).toBe(true);
  expect(snapshot.renderer.type).toBe("three-webgl-orthographic");
  expect(snapshot.renderer.width).toBeGreaterThan(0);
  expect(snapshot.renderer.height).toBeGreaterThan(0);
  expect(snapshot.session.levelId).toBe("chlum");
  expect(snapshot.session.phase).toBe("playing");
  expect(snapshot.session.findings).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(pageErrors).toEqual([]);
});

test("pause overlay resets input and returns to title without freeze", async ({ page }) => {
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);

  await page.locator("#pauseButton").tap();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().session.phase)).toBe("paused");

  await page.locator("#resumeButton").tap();
  await expect(page.locator(".screen.visible")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().session.phase)).toBe("playing");

  await page.locator("#pauseButton").tap();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#menuButton").tap();
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().scene)).toBe("title");
  expect(pageErrors).toEqual([]);
});

test("runtime reset releases the mobile joystick", async ({ page }) => {
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
  await expect.poll(async () => compactTransform(await stick.evaluate(element => element.style.transform)))
    .not.toBe("translate(-50%,-50%)");

  await page.evaluate(() => window.__lovecRuntime.resetInput("playwright-smoke"));
  await page.mouse.up();
  await expect.poll(async () => compactTransform(await stick.evaluate(element => element.style.transform)))
    .toBe("translate(-50%,-50%)");
  expect(pageErrors).toEqual([]);
});

test("portrait to landscape resize preserves one running renderer", async ({ page }) => {
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);
  const before = await page.evaluate(() => window.__lovecRuntime.snapshot().renderer);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.__lovecRuntime.resize());
  await page.waitForTimeout(100);

  const after = await page.evaluate(() => window.__lovecRuntime.snapshot());
  expect(after.stable).toBe(true);
  expect(after.running).toBe(true);
  expect(after.scene).toBe("chlum");
  expect(after.renderer.type).toBe("three-webgl-orthographic");
  expect(after.renderer.width).not.toBe(before.width);
  expect(after.renderer.height).not.toBe(before.height);
  expect(pageErrors).toEqual([]);
});
