import { test, expect } from "@playwright/test";

async function runtimeSnapshot(page) {
  return page.evaluate(() => window.__lovecRuntime.snapshot());
}

test("desktop keyboard and mouse profile starts, moves and resumes", async ({ page }) => {
  const pageErrors = [];
  const httpErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  expect(await page.evaluate(() => navigator.maxTouchPoints)).toBe(0);

  await page.locator("#playButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").click();
  await expect(page.locator("#app")).toHaveClass(/playing/);

  const before = await runtimeSnapshot(page);
  const startX = before.chlum?.runtime?.player?.x;
  expect(typeof startX).toBe("number");

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(350);
  await page.keyboard.up("ArrowRight");
  await expect.poll(async () => (await runtimeSnapshot(page)).chlum?.runtime?.player?.x).toBeGreaterThan(startX);

  await page.locator("#pauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#resumeButton").click();
  await expect(page.locator("#app")).toHaveClass(/playing/);

  expect(httpErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});