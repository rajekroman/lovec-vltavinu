import fs from "node:fs";
import { test, expect } from "@playwright/test";

const TARGET_TOLERANCE = 34;

async function runtimeSnapshot(page) {
  return page.evaluate(() => window.__lovecRuntime.snapshot());
}

function activeRuntime(state) {
  return state[state.scene]?.runtime ?? null;
}

async function captureEvidence(page, testInfo, name) {
  const directory = testInfo.outputPath("visual-evidence");
  fs.mkdirSync(directory, { recursive: true });
  const path = `${directory}/${name}.png`;
  await page.screenshot({ path, animations: "disabled", caret: "hide", scale: "device" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function moveAxisTo(page, axis, target, timeout = 20_000) {
  const state = await runtimeSnapshot(page);
  const player = activeRuntime(state)?.player;
  if (!player) throw new Error(`${state.scene} player is unavailable.`);
  const delta = target - player[axis];
  if (Math.abs(delta) <= TARGET_TOLERANCE) return;

  const positiveKey = axis === "x" ? "ArrowRight" : "ArrowUp";
  const negativeKey = axis === "x" ? "ArrowLeft" : "ArrowDown";
  const key = delta > 0 ? positiveKey : negativeKey;
  const direction = Math.sign(delta);

  await page.keyboard.down(key);
  try {
    await expect.poll(async () => {
      const currentState = await runtimeSnapshot(page);
      const current = activeRuntime(currentState)?.player?.[axis];
      if (typeof current !== "number") return false;
      return direction > 0
        ? current >= target - TARGET_TOLERANCE
        : current <= target + TARGET_TOLERANCE;
    }, { timeout, intervals: [30, 60, 100] }).toBe(true);
  } finally {
    await page.keyboard.up(key);
  }
}

async function moveTo(page, x, y, kind, timeout = 10_000) {
  await moveAxisTo(page, "x", x);
  await moveAxisTo(page, "y", y);
  await expect.poll(async () => {
    const state = await runtimeSnapshot(page);
    return activeRuntime(state)?.available?.kind ?? null;
  }, { timeout, intervals: [30, 60, 100] }).toBe(kind);
}

async function performAction(page) {
  const button = page.locator("#actionButton");
  await expect(button).toHaveAttribute("aria-disabled", "false");
  await button.tap();
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().running)).toBe(true);
}

async function successfulDigHit(page, expectedTotal) {
  await expect.poll(() => page.evaluate(total => {
    const state = window.__lovecRuntime.snapshot();
    const runtime = state[state.scene]?.runtime;
    if (!runtime) return "waiting";
    const currentTotal = state.scene === "chlum" ? runtime.digHits : runtime.totalDigHits;
    if (currentTotal >= total) return "complete";
    const position = runtime.dig?.position;
    if (currentTotal !== total - 1 || typeof position !== "number" || position < 0.44 || position > 0.56) return "waiting";
    document.getElementById("digButton")?.click();
    return "triggered";
  }, expectedTotal), { timeout: 8_000, intervals: [20, 30, 50] }).not.toBe("waiting");

  await expect.poll(() => page.evaluate(total => {
    const state = window.__lovecRuntime.snapshot();
    const runtime = state[state.scene]?.runtime;
    const currentTotal = state.scene === "chlum" ? runtime?.digHits : runtime?.totalDigHits;
    return Number(currentTotal) >= total;
  }, expectedTotal), { timeout: 2_000, intervals: [20, 30, 50] }).toBe(true);
}

async function startChlum(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  await page.locator("#playButton").tap();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 1 / 4");
  await page.locator("#briefButton").tap();
  await expect.poll(async () => (await runtimeSnapshot(page)).scene).toBe("chlum");
}

async function completeChlum(page) {
  await moveTo(page, 560, 410, "permission");
  await performAction(page);
  await expect(page.locator("#dialogName")).toHaveText("VÁCLAV");
  await page.locator("#dialogButton").tap();

  await moveTo(page, 1020, 720, "dig", 20_000);
  await performAction(page);
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  for (let hit = 1; hit <= 3; hit++) await successfulDigHit(page, hit);
  await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null).toBe("collect");
  await performAction(page);
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function enterNesmen(page) {
  await expect(page.locator("#againButton")).toHaveText("POKRAČOVAT DO NESMĚNĚ");
  await page.locator("#againButton").tap();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 2 / 4");
  await page.locator("#briefButton").tap();
  await expect.poll(async () => (await runtimeSnapshot(page)).scene).toBe("nesmen");
}

async function completeNesmen(page) {
  await moveTo(page, 280, 240, "permission");
  await performAction(page);
  await expect(page.locator("#dialogName")).toHaveText("JAN");
  await page.locator("#dialogButton").tap();

  const profiles = [
    { x: 610, y: 430 },
    { x: 930, y: 690 },
    { x: 1210, y: 360 }
  ];
  let totalHits = 0;
  for (let index = 0; index < profiles.length; index++) {
    const profile = profiles[index];
    await moveTo(page, profile.x, profile.y, "dig");
    await performAction(page);
    await expect(page.locator("#digScreen")).toHaveClass(/visible/);
    for (let hit = 0; hit < 3; hit++) await successfulDigHit(page, ++totalHits);
    if (index === 0) {
      await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null).toBe("collect");
      await performAction(page);
    }
    await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null).toBe("fill");
    await performAction(page);
  }
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function enterBesednice(page) {
  await expect(page.locator("#againButton")).toHaveText("POKRAČOVAT DO BESEDNICE");
  await page.locator("#againButton").tap();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 3 / 4");
  await page.locator("#briefButton").tap();
  await expect.poll(async () => (await runtimeSnapshot(page)).scene).toBe("besednice");
}

async function completeBesednice(page) {
  for (const trace of [
    { x: 470, y: 890 },
    { x: 880, y: 620 },
    { x: 1240, y: 420 }
  ]) {
    await moveTo(page, trace.x, trace.y, "discover");
    await performAction(page);
  }

  await moveTo(page, 1430, 260, "dig");
  await performAction(page);
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  for (let hit = 1; hit <= 3; hit++) await successfulDigHit(page, hit);
  await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null).toBe("collect");
  await performAction(page);
  await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null, {
    timeout: 15_000,
    intervals: [50, 100, 200]
  }).toBe("recover");
  await performAction(page);
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function enterSlavia(page) {
  await expect(page.locator("#againButton")).toHaveText("POKRAČOVAT DO SLAVIE");
  await page.locator("#againButton").tap();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 4 / 4");
  await page.locator("#briefButton").tap();
  await expect.poll(async () => (await runtimeSnapshot(page)).scene).toBe("slavia");
}

test("input-driven Chlum → Nesměň → Besednice → Slavia flow captures evidence and cleanly restarts", async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  const pageErrors = [];
  const httpErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  await startChlum(page);
  await completeChlum(page);
  await enterNesmen(page);
  await completeNesmen(page);
  await enterBesednice(page);
  await completeBesednice(page);
  await enterSlavia(page);

  const arrived = await runtimeSnapshot(page);
  expect(arrived.session.findings).toHaveLength(3);
  expect(arrived.session.score).toBe(450);
  await captureEvidence(page, testInfo, "slavia-arrival");

  for (const document of [
    { x: 410, y: 760 },
    { x: 790, y: 460 },
    { x: 1130, y: 780 }
  ]) {
    await moveTo(page, document.x, document.y, "collect-document");
    await performAction(page);
  }

  await moveTo(page, 1450, 430, "register-collection");
  await performAction(page);
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await page.locator("#dialogButton").tap();

  await moveTo(page, 1020, 260, "recover-best-finding");
  await performAction(page);

  await moveTo(page, 1450, 430, "receive-certificate");
  await performAction(page);
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
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
  expect(restarted.session.flags).toEqual({});
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(httpErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
