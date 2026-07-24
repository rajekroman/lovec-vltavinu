import fs from "node:fs";
import { test, expect } from "@playwright/test";

const TARGET_TOLERANCE = 18;

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

async function touchLocator(page, locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("Touch target has no bounding box.");

  const client = await page.context().newCDPSession(page);
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  try {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1 }]
    });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally {
    await client.detach();
  }
}

async function moveAxisTo(page, axis, target, timeout = 20_000) {
  const initial = await runtimeSnapshot(page);
  const player = activeRuntime(initial)?.player;
  if (!player) throw new Error(`${initial.scene} player is unavailable.`);
  const delta = target - player[axis];
  if (Math.abs(delta) <= TARGET_TOLERANCE) return;

  const positiveKey = axis === "x" ? "ArrowRight" : "ArrowUp";
  const negativeKey = axis === "x" ? "ArrowLeft" : "ArrowDown";
  const key = delta > 0 ? positiveKey : negativeKey;
  const direction = Math.sign(delta);

  await page.evaluate(({ axisName, targetValue, tolerance, moveDirection, code, timeoutMs }) => {
    window.__slaviaQaMovement = { done: false, error: null };
    const startedAt = performance.now();
    const release = () => window.dispatchEvent(new KeyboardEvent("keyup", {
      code,
      key: code,
      bubbles: true,
      cancelable: true
    }));
    const monitor = () => {
      const state = window.__lovecRuntime?.snapshot?.();
      const current = state?.[state.scene]?.runtime?.player?.[axisName];
      const reached = typeof current === "number" && (
        moveDirection > 0 ? current >= targetValue - tolerance : current <= targetValue + tolerance
      );
      if (reached) {
        release();
        window.__slaviaQaMovement.done = true;
        return;
      }
      if (performance.now() - startedAt >= timeoutMs) {
        release();
        window.__slaviaQaMovement.error = `Timed out at ${axisName}=${current}; target ${targetValue}.`;
        window.__slaviaQaMovement.done = true;
        return;
      }
      requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
  }, {
    axisName: axis,
    targetValue: target,
    tolerance: TARGET_TOLERANCE,
    moveDirection: direction,
    code: key,
    timeoutMs: timeout
  });

  await page.keyboard.down(key);
  try {
    await page.waitForFunction(() => window.__slaviaQaMovement?.done === true, null, { timeout: timeout + 2_000 });
    const movement = await page.evaluate(() => ({ ...window.__slaviaQaMovement }));
    if (movement.error) throw new Error(movement.error);
  } finally {
    await page.keyboard.up(key);
    await page.evaluate(() => { delete window.__slaviaQaMovement; });
  }
}

async function moveTo(page, x, y, kind, timeout = 12_000) {
  const approaches = [[x, y], [x - 20, y], [x + 20, y], [x, y - 20], [x, y + 20], [x, y]];
  for (const [targetX, targetY] of approaches) {
    await moveAxisTo(page, "x", targetX);
    await moveAxisTo(page, "y", targetY);
    if ((activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null) === kind) return;
  }
  await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null, {
    timeout,
    intervals: [30, 60, 100]
  }).toBe(kind);
}

async function performAction(page) {
  const button = page.locator("#actionButton");
  await expect(button).toHaveAttribute("aria-disabled", "false");
  const expectedKind = await page.evaluate(() => {
    const state = window.__lovecRuntime.snapshot();
    return state[state.scene]?.runtime?.available?.kind ?? null;
  });
  expect(expectedKind).not.toBeNull();

  await page.evaluate(async () => {
    const { events } = await import("./src/bootstrap.js");
    window.__slaviaQaInteractionOff?.();
    window.__slaviaQaInteraction = { performed: null };
    window.__slaviaQaInteractionOff = events.once("interaction:performed", payload => {
      window.__slaviaQaInteraction.performed = payload.kind;
    });
  });

  try {
    await touchLocator(page, button);
    await expect.poll(() => page.evaluate(() => window.__slaviaQaInteraction?.performed ?? null), {
      timeout: 2_000,
      intervals: [10, 20, 30, 50]
    }).toBe(expectedKind);
  } finally {
    await page.evaluate(() => {
      window.__slaviaQaInteractionOff?.();
      delete window.__slaviaQaInteractionOff;
      delete window.__slaviaQaInteraction;
    });
  }
}

async function successfulDigHit(page, expectedTotal) {
  const button = page.locator("#digButton");
  await expect(button).toBeVisible();
  for (let attempt = 1; attempt <= 10; attempt++) {
    await expect.poll(async () => {
      const state = await runtimeSnapshot(page);
      const runtime = activeRuntime(state);
      const total = state.scene === "chlum" ? runtime?.digHits : runtime?.totalDigHits;
      return Number(total) >= expectedTotal || (
        Number(total) === expectedTotal - 1
        && typeof runtime?.dig?.position === "number"
        && runtime.dig.position >= 0.42
        && runtime.dig.position <= 0.58
      );
    }, { timeout: 8_000, intervals: [10, 15, 20] }).toBe(true);

    const before = await runtimeSnapshot(page);
    const beforeRuntime = activeRuntime(before);
    const beforeTotal = before.scene === "chlum" ? beforeRuntime?.digHits : beforeRuntime?.totalDigHits;
    if (Number(beforeTotal) >= expectedTotal) return;

    await button.tap({ force: true });
    const advanced = await expect.poll(async () => {
      const state = await runtimeSnapshot(page);
      const runtime = activeRuntime(state);
      const total = state.scene === "chlum" ? runtime?.digHits : runtime?.totalDigHits;
      return Number(total) >= expectedTotal;
    }, { timeout: 700, intervals: [20, 30, 50] }).toBe(true).then(() => true).catch(() => false);
    if (advanced) return;
  }
  throw new Error(`Dig hit ${expectedTotal} did not register after touch retries.`);
}

async function waitForTractorLeftOf(page, maxX = 620, timeout = 18_000) {
  await expect.poll(async () => {
    const tractorX = (await runtimeSnapshot(page)).chlum?.runtime?.tractor?.x;
    return typeof tractorX === "number" && tractorX <= maxX;
  }, { timeout, intervals: [100, 180, 250] }).toBe(true);
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
  let opened = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    await moveAxisTo(page, "x", 1020);
    await moveAxisTo(page, "y", 410);
    await waitForTractorLeftOf(page);
    await moveAxisTo(page, "y", 720);
    if (activeRuntime(await runtimeSnapshot(page))?.available?.kind !== "dig") continue;
    await performAction(page);
    opened = true;
    break;
  }
  expect(opened).toBe(true);
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  for (let hit = 1; hit <= 3; hit++) await successfulDigHit(page, hit);
  await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null).toBe("collect");
  await performAction(page);
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function enterLevel(page, buttonText, kicker, scene) {
  await expect(page.locator("#againButton")).toHaveText(buttonText);
  await page.locator("#againButton").tap();
  await expect(page.locator("#briefKicker")).toHaveText(kicker);
  await page.locator("#briefButton").tap();
  await expect.poll(async () => (await runtimeSnapshot(page)).scene).toBe(scene);
}

async function completeNesmen(page) {
  await moveTo(page, 280, 240, "permission");
  await performAction(page);
  await expect(page.locator("#dialogName")).toHaveText("JAN");
  await page.locator("#dialogButton").tap();
  const profiles = [{ x: 610, y: 430 }, { x: 930, y: 690 }, { x: 1210, y: 360 }];
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

async function completeBesednice(page) {
  for (const trace of [{ x: 470, y: 890 }, { x: 880, y: 620 }, { x: 1240, y: 420 }]) {
    await moveTo(page, trace.x, trace.y, "discover", 15_000);
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

test("input-driven Chlum → Nesměň → Besednice → Slavia flow captures evidence and cleanly restarts", async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  const pageErrors = [];
  const httpErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`); });

  await startChlum(page);
  await completeChlum(page);
  await enterLevel(page, "POKRAČOVAT DO NESMĚNĚ", "LOKALITA 2 / 4", "nesmen");
  await completeNesmen(page);
  await enterLevel(page, "POKRAČOVAT DO BESEDNICE", "LOKALITA 3 / 4", "besednice");
  await completeBesednice(page);
  await enterLevel(page, "POKRAČOVAT DO SLAVIE", "LOKALITA 4 / 4", "slavia");

  const arrived = await runtimeSnapshot(page);
  expect(arrived.session.findings).toHaveLength(3);
  expect(arrived.session.score).toBe(450);
  await captureEvidence(page, testInfo, "slavia-arrival");

  for (const document of [{ x: 410, y: 760 }, { x: 790, y: 460 }, { x: 1130, y: 780 }]) {
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
