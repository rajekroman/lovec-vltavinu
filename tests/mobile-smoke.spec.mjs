import fs from "node:fs";
import { test, expect } from "@playwright/test";

const MOVE_TOLERANCE = 20;

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

async function withPhaseSnapshot(page, phase, operation, target = null) {
  try {
    return await operation();
  } catch (error) {
    const runtime = await snapshot(page).catch(snapshotError => ({ snapshotError: snapshotError.message }));
    const detail = JSON.stringify({ phase, target, runtime }, null, 2);
    throw new Error(`${phase} failed: ${error instanceof Error ? error.message : String(error)}\n${detail}`);
  }
}

async function holdKeys(page, keys, duration) {
  for (const key of keys) await page.keyboard.down(key);
  try {
    await page.waitForTimeout(duration);
  } finally {
    for (const key of [...keys].reverse()) await page.keyboard.up(key);
  }
}

async function moveAxisTo(page, axis, target, tolerance = 30, timeout = 20_000) {
  const initial = await snapshot(page);
  const player = initial.chlum?.runtime?.player;
  if (!player) throw new Error("Chlum player is not available.");
  const delta = target - player[axis];
  if (Math.abs(delta) <= tolerance) return initial;

  const positiveKey = axis === "x" ? "ArrowRight" : "ArrowUp";
  const negativeKey = axis === "x" ? "ArrowLeft" : "ArrowDown";
  const key = delta > 0 ? positiveKey : negativeKey;
  const direction = Math.sign(delta);

  await page.keyboard.down(key);
  try {
    await expect.poll(async () => {
      const current = (await snapshot(page)).chlum?.runtime?.player?.[axis];
      if (typeof current !== "number") return false;
      return direction > 0 ? current >= target - tolerance : current <= target + tolerance;
    }, { timeout, intervals: [80, 120, 180, 250] }).toBe(true);
  } finally {
    await page.keyboard.up(key);
  }

  const final = await snapshot(page);
  const current = final.chlum?.runtime?.player?.[axis];
  if (typeof current !== "number" || Math.abs(target - current) > 55) {
    throw new Error(`Player did not settle near ${axis}=${target}; current ${current}.`);
  }
  return final;
}

async function movePlayerTo(page, targetX, targetY, tolerance = MOVE_TOLERANCE) {
  return withPhaseSnapshot(page, "input movement", async () => {
    await moveAxisTo(page, "x", targetX, Math.max(30, tolerance));
    await moveAxisTo(page, "y", targetY, Math.max(30, tolerance));
    return snapshot(page);
  }, { x: targetX, y: targetY, tolerance });
}

async function waitForTractorLeftOf(page, maxX = 700, timeout = 18_000) {
  await withPhaseSnapshot(page, "tractor clearance", () => expect.poll(async () => {
    const tractorX = (await snapshot(page)).chlum?.runtime?.tractor?.x;
    return typeof tractorX === "number" && tractorX <= maxX;
  }, { timeout, intervals: [100, 180, 250] }).toBe(true), { maxX });
}

async function waitForInteraction(page, kind, timeout = 8_000) {
  await withPhaseSnapshot(page, `interaction ${kind}`, () => expect.poll(() => page.evaluate(expected => (
    window.__lovecRuntime.snapshot().chlum?.runtime?.available?.kind === expected
  ), kind), { timeout, intervals: [30, 60, 100] }).toBe(true), { kind });
}

async function moveToInteraction(page, x, y, kind) {
  await movePlayerTo(page, x, y);
  await waitForInteraction(page, kind);
}

async function chaseTractorUntilDanger(page) {
  return withPhaseSnapshot(page, "tractor chase", async () => {
    for (let step = 0; step < 140; step++) {
      const state = await snapshot(page);
      if (state.session.danger > 0) return state;
      const player = state.chlum?.runtime?.player;
      const tractor = state.chlum?.runtime?.tractor;
      if (!player || !tractor) throw new Error("Chlum tractor chase data is unavailable.");

      const dx = tractor.x - player.x;
      const dy = tractor.y - player.y;
      const keys = [];
      if (Math.abs(dx) > 18) keys.push(dx > 0 ? "ArrowRight" : "ArrowLeft");
      if (Math.abs(dy) > 18) keys.push(dy > 0 ? "ArrowUp" : "ArrowDown");
      if (!keys.length) keys.push("ArrowRight");
      await holdKeys(page, keys, 140);
    }
    throw new Error("Tractor did not trigger danger during an actual input-driven chase.");
  });
}

async function contextualAction(page) {
  await page.keyboard.press("Space");
}

async function strikeDigInsideSweetZone(page, expectedHit) {
  await withPhaseSnapshot(page, `dig hit ${expectedHit}/3`, () => expect.poll(() => page.evaluate(hit => {
    const before = window.__lovecRuntime.snapshot().chlum?.runtime;
    if (!before) return false;
    if (before.digHits === hit) return true;
    const position = before.dig?.position;
    if (before.digHits !== hit - 1 || typeof position !== "number" || position < 0.44 || position > 0.56) return false;
    document.getElementById("digButton")?.click();
    return window.__lovecRuntime.snapshot().chlum?.runtime?.digHits === hit;
  }, expectedHit), { timeout: 5_000, intervals: [20, 30, 50] }).toBe(true), { expectedHit });
}

async function captureEvidence(page, testInfo, name, expectedSize) {
  const directory = testInfo.outputPath("visual-evidence");
  fs.mkdirSync(directory, { recursive: true });
  const path = `${directory}/${name}.png`;
  const image = await page.screenshot({ path, animations: "disabled", caret: "hide", scale: "device" });
  const size = { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
  expect(size).toEqual(expectedSize);
  await testInfo.attach(name, { path, contentType: "image/png" });
}

const compactTransform = value => String(value).replace(/\s+/g, "");

test("canonical input-driven Chlum flow reaches one finding and a clean restarted session", async ({ page }) => {
  test.setTimeout(75_000);
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);

  await test.step("PLAY → Václav → permission", async () => {
    await moveToInteraction(page, 560, 410, "permission");
    await contextualAction(page);
    await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
    await expect(page.locator("#dialogName")).toHaveText("VÁCLAV");
    await page.locator("#dialogButton").tap();
    await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().session.flags.chlumPermission)).toBe(true);
  });

  await test.step("permission → dig site through canonical route", async () => {
    await movePlayerTo(page, 1020, 410);
    await waitForTractorLeftOf(page);
    await moveToInteraction(page, 1020, 720, "dig");
    await contextualAction(page);
    await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  });

  await test.step("exactly three successful rhythm hits", async () => {
    for (let hit = 1; hit <= 3; hit++) await strikeDigInsideSweetZone(page, hit);
    await expect(page.locator("#app")).toHaveClass(/playing/);
  });

  await test.step("collect one finding and reach result", async () => {
    await waitForInteraction(page, "collect");
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
  });

  await test.step("restart creates a clean in-memory session", async () => {
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
  });

  expect(pageErrors).toEqual([]);
});

test("portrait and landscape evidence survives pause and background lifecycle", async ({ page, context }, testInfo) => {
  test.setTimeout(35_000);
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);

  await test.step("capture 1170×2532 portrait evidence", async () => {
    await captureEvidence(page, testInfo, "chlum-portrait", { width: 1170, height: 2532 });
  });

  await test.step("capture 2532×1170 landscape evidence", async () => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => window.__lovecRuntime.resize());
    await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().renderer.width)).toBe(844);
    await captureEvidence(page, testInfo, "chlum-landscape", { width: 2532, height: 1170 });
  });

  await test.step("pause and resume keep the scene playable", async () => {
    await page.locator("#pauseButton").click();
    await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
    await page.locator("#resumeButton").click();
    await expect(page.locator("#app")).toHaveClass(/playing/);
  });

  await test.step("background and foreground restart the loop without stale input", async () => {
    const other = await context.newPage();
    await other.goto("about:blank");
    await other.bringToFront();
    await page.waitForTimeout(120);
    await page.bringToFront();
    await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().running)).toBe(true);
    await expect.poll(() => page.evaluate(() => {
      const move = window.__lovecRuntime.snapshot().chlum?.runtime?.player;
      return Boolean(move);
    })).toBe(true);
    await other.close();
  });

  expect(pageErrors).toEqual([]);
});

test("tractor collision raises danger, returns player to spawn and does not freeze input", async ({ page }) => {
  test.setTimeout(45_000);
  const pageErrors = await openBootstrap(page);
  await enterChlum(page);

  const state = await chaseTractorUntilDanger(page);
  expect(state.session.danger).toBeGreaterThan(0);
  expect(state.chlum.runtime.player.x).toBeLessThan(190);
  expect(state.chlum.runtime.player.y).toBeLessThan(450);
  expect(state.running).toBe(true);
  await page.locator("#pauseButton").click();
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
