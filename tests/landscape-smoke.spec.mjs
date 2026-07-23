import { test, expect } from "@playwright/test";

function imageSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test("iPhone landscape touch profile respects viewport and lifecycle", async ({ page }) => {
  const pageErrors = [];
  const httpErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(0);
  expect(page.viewportSize()).toEqual({ width: 844, height: 390 });

  await page.locator("#playButton").tap();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);

  for (const selector of ["#moveZone", "#actionButton", "#pauseButton"]) {
    const box = await page.locator(selector).boundingBox();
    expect(box, `${selector} must have a landscape touch target`).not.toBeNull();
    if (!box) continue;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(844);
    expect(box.y + box.height).toBeLessThanOrEqual(390);
  }

  const screenshot = await page.screenshot({ animations: "disabled", caret: "hide", scale: "device" });
  expect(imageSize(screenshot)).toEqual({ width: 2532, height: 1170 });

  await page.locator("#pauseButton").tap();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#resumeButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);

  const input = await page.evaluate(async () => {
    const { app } = await import("./src/bootstrap.js");
    return app.input.snapshot();
  });
  expect(input.axes.move?.length ?? 0).toBe(0);
  expect(Boolean(input.actions.action?.down)).toBe(false);
  expect(Boolean(input.actions.pause?.down)).toBe(false);
  expect(httpErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});