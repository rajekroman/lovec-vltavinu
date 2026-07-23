import fs from "node:fs";
import { test, expect } from "@playwright/test";

const TARGET_TOLERANCE = 34;

async function runtimeSnapshot(page) {
  return page.evaluate(() => window.__lovecRuntime.snapshot());
}

async function captureEvidence(page, testInfo, name) {
  const directory = testInfo.outputPath("visual-evidence");
  fs.mkdirSync(directory, { recursive: true });
  const path = `${directory}/${name}.png`;
  await page.screenshot({ path, animations: "disabled", caret: "hide", scale: "device" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function moveAxisTo(page, axis, target) {
  const state = await runtimeSnapshot(page);
  const player = state.slavia?.runtime?.player;
  if (!player) throw new Error("Slavia player is unavailable.");
  const delta = target - player[axis];
  if (Math.abs(delta) <= TARGET_TOLERANCE) return;

  const positiveKey = axis === "x" ? "ArrowRight" : "ArrowUp";
  const negativeKey = axis === "x" ? "ArrowLeft" : "ArrowDown";
  const key = delta > 0 ? positiveKey : negativeKey;
  const direction = Math.sign(delta);

  await page.keyboard.down(key);
  try {
    await expect.poll(async () => {
      const current = (await runtimeSnapshot(page)).slavia?.runtime?.player?.[axis];
      if (typeof current !== "number") return false;
      return direction > 0
        ? current >= target - TARGET_TOLERANCE
        : current <= target + TARGET_TOLERANCE;
    }, { timeout: 15_000, intervals: [30, 60, 100] }).toBe(true);
  } finally {
    await page.keyboard.up(key);
  }
}

async function moveTo(page, x, y, kind) {
  await moveAxisTo(page, "x", x);
  await moveAxisTo(page, "y", y);
  await expect.poll(async () => {
    const state = await runtimeSnapshot(page);
    return state.slavia?.runtime?.available?.kind ?? null;
  }, { timeout: 8_000, intervals: [30, 60, 100] }).toBe(kind);
}

async function performAction(page) {
  const button = page.locator("#actionButton");
  await expect(button).toHaveAttribute("aria-disabled", "false");
  await button.tap();
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().running)).toBe(true);
}

async function prepareSlavia(page) {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);

  await page.evaluate(async () => {
    const { app, session, ensureSlaviaRegistered } = await import("./src/bootstrap.js");
    session.reset();
    session.recordFinding({ findingId: "chlum-finding-1", locality: "chlum", rarity: "B", weight: 1.2, score: 90 });
    session.recordFinding({ findingId: "nesmen-finding-1", locality: "nesmen", rarity: "B", weight: 1.6, score: 120 });
    session.recordFinding({ findingId: "besednice-hedgehog-1", locality: "besednice", rarity: "A", weight: 2.8, score: 240 });
    ensureSlaviaRegistered();
    await app.changeScene("slavia");
  });

  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 4 / 4");
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect.poll(async () => (await runtimeSnapshot(page)).scene).toBe("slavia");
}

test("Slavia arrival, certification, final result and clean restart", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const pageErrors = [];
  const httpErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  await prepareSlavia(page);
  await captureEvidence(page, testInfo, "slavia-arrival");

  for (const document of [
    { x: 410, y: 760 },
    { x: 790, y: 460 },
    { x: 1130, y: 780 }
  ]) {
    await moveTo(page, document.x, document.y, "collect-document");
    await performAction(page);
  }

  await expect(page.locator("#objectiveLabel")).toHaveText("Registruj sbírku u Evy");
  await moveTo(page, 1450, 430, "register-collection");
  await performAction(page);
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await expect(page.locator("#dialogName")).toContainText("Eva");
  await page.locator("#dialogButton").tap();

  await moveTo(page, 1020, 260, "recover-best-finding");
  await performAction(page);
  await expect(page.locator("#objectiveLabel")).toHaveText("Vyzvedni certifikát poroty");

  await moveTo(page, 1450, 430, "receive-certificate");
  await performAction(page);
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await expect(page.locator("#dialogName")).toContainText("Eva");
  await captureEvidence(page, testInfo, "slavia-certification");
  await page.locator("#dialogButton").tap();

  await moveTo(page, 1630, 520, "enter-event");
  await performAction(page);
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
  await expect(page.locator("#resultKicker")).toHaveText("NA ZELENÉ VLNĚ — FINÁLE");
  await expect(page.locator("#againButton")).toHaveText("NOVÁ VÝPRAVA");
  await captureEvidence(page, testInfo, "slavia-final-result");

  const completed = await runtimeSnapshot(page);
  expect(completed.session.phase).toBe("finale");
  expect(completed.session.flags.slaviaCertificate).toBe(true);
  expect(completed.slavia.flow.complete).toBe(true);
  expect(completed.slavia.evaluation.findingCount).toBe(3);

  await page.locator("#againButton").tap();
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  const restarted = await runtimeSnapshot(page);
  expect(restarted.scene).toBe("title");
  expect(restarted.session.levelId).toBe("chlum");
  expect(restarted.session.phase).toBe("briefing");
  expect(restarted.session.findings).toEqual([]);
  expect(restarted.session.score).toBe(0);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(httpErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
