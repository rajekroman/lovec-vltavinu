import fs from "node:fs";
import { test, expect } from "@playwright/test";

const TARGET_TOLERANCE = 36;

async function runtimeSnapshot(page) {
  return page.evaluate(() => window.__lovecRuntime.snapshot());
}

function activeRuntime(state) {
  return state[state.scene]?.runtime ?? null;
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
      touchPoints: [{ x, y, radiusX: 3, radiusY: 3, force: 1 }]
    });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally {
    await client.detach().catch(() => {});
  }
}

function createInputDriver(page, testInfo) {
  const desktop = testInfo.project.metadata?.inputMode === "desktop";

  async function activateUi(locator) {
    await expect(locator).toBeVisible();
    if (desktop) {
      await locator.focus();
      await page.keyboard.press("Enter");
    } else {
      await touchLocator(page, locator);
    }
  }

  async function contextualAction() {
    if (desktop) await page.keyboard.press("KeyE");
    else await touchLocator(page, page.locator("#actionButton"));
  }

  async function holdAxis(axis, direction) {
    if (desktop) {
      const key = axis === "x"
        ? (direction > 0 ? "ArrowRight" : "ArrowLeft")
        : (direction > 0 ? "ArrowUp" : "ArrowDown");
      await page.keyboard.down(key);
      return async () => page.keyboard.up(key);
    }

    const zone = page.locator("#moveZone");
    await expect(zone).toBeVisible();
    const box = await zone.boundingBox();
    expect(box).not.toBeNull();
    if (!box) throw new Error("Mobile joystick has no bounding box.");

    const radius = Math.max(1, Math.min(box.width, box.height) / 2);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const x = Math.round(centerX + (axis === "x" ? direction * radius * 0.98 : 0));
    const y = Math.round(centerY + (axis === "y" ? -direction * radius * 0.98 : 0));
    const client = await page.context().newCDPSession(page);
    let active = true;
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, radiusX: 4, radiusY: 4, force: 1 }]
    });
    return async () => {
      if (!active) return;
      active = false;
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }).catch(() => {});
      await client.detach().catch(() => {});
    };
  }

  return Object.freeze({ desktop, activateUi, contextualAction, holdAxis });
}

async function captureEvidence(page, testInfo, name) {
  const directory = testInfo.outputPath("visual-evidence");
  fs.mkdirSync(directory, { recursive: true });
  const path = `${directory}/${name}.png`;
  await page.screenshot({ path, animations: "disabled", caret: "hide", scale: "device" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function moveAxisTo(page, input, axis, target, timeout = 20_000, stopKind = null) {
  const initial = await runtimeSnapshot(page);
  const player = activeRuntime(initial)?.player;
  if (!player) throw new Error(`${initial.scene} player is unavailable.`);
  if (stopKind && activeRuntime(initial)?.available?.kind === stopKind) return;
  const delta = target - player[axis];
  if (Math.abs(delta) <= TARGET_TOLERANCE) return;
  const direction = Math.sign(delta);

  await page.evaluate(async ({ axisName, targetValue, tolerance, moveDirection, timeoutMs, expectedKind }) => {
    const { app } = await import("./src/bootstrap.js");
    window.__chlumA6Movement = { done: false, error: null };
    const startedAt = performance.now();
    const monitor = () => {
      const state = window.__lovecRuntime?.snapshot?.();
      const runtime = state?.[state.scene]?.runtime;
      const current = runtime?.player?.[axisName];
      const availableKind = runtime?.available?.kind ?? null;
      const reached = typeof current === "number" && (
        moveDirection > 0 ? current >= targetValue - tolerance : current <= targetValue + tolerance
      );
      const interactionReached = Boolean(expectedKind) && availableKind === expectedKind;
      if (reached || interactionReached) {
        app.stop();
        window.__chlumA6Movement.done = true;
        return;
      }
      if (performance.now() - startedAt >= timeoutMs) {
        window.__chlumA6Movement.error = `Timed out at ${axisName}=${current}; target ${targetValue}; interaction ${availableKind}.`;
        window.__chlumA6Movement.done = true;
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
    timeoutMs: timeout,
    expectedKind: stopKind
  });

  const release = await input.holdAxis(axis, direction);
  let movement = null;
  try {
    await page.waitForFunction(() => window.__chlumA6Movement?.done === true, null, { timeout: timeout + 2_000 });
    movement = await page.evaluate(() => ({ ...window.__chlumA6Movement }));
  } finally {
    await release().catch(() => {});
    await page.evaluate(async () => {
      const { app } = await import("./src/bootstrap.js");
      app.start();
      delete window.__chlumA6Movement;
    }).catch(() => {});
  }

  if (movement?.error) throw new Error(movement.error);
}

async function moveTo(page, input, x, y, kind) {
  const approaches = [[x, y], [x - 20, y], [x + 20, y], [x, y - 20], [x, y + 20], [x, y]];
  for (const [targetX, targetY] of approaches) {
    await moveAxisTo(page, input, "x", targetX, 20_000, kind);
    if (activeRuntime(await runtimeSnapshot(page))?.available?.kind === kind) return;
    await moveAxisTo(page, input, "y", targetY, 20_000, kind);
    if (activeRuntime(await runtimeSnapshot(page))?.available?.kind === kind) return;
  }
  await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null, {
    timeout: 12_000,
    intervals: [30, 60, 100]
  }).toBe(kind);
}

async function waitForTractorLeftOf(page, maxX = 620, timeout = 30_000) {
  await expect.poll(async () => {
    const tractorX = (await runtimeSnapshot(page)).chlum?.runtime?.tractor?.x;
    return typeof tractorX === "number" && tractorX <= maxX;
  }, { timeout, intervals: [100, 180, 250] }).toBe(true);
}

async function startChlum(page, input) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  await input.activateUi(page.locator("#playButton"));
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 1 / 4");
  await input.activateUi(page.locator("#briefButton"));
  await expect.poll(async () => (await runtimeSnapshot(page)).scene).toBe("chlum");
}

test("A6 read-only Chlum furrows visual capture", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const input = createInputDriver(page, testInfo);
  const pageErrors = [];
  const httpErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`); });

  await startChlum(page, input);
  await expect(page.locator("#hud")).toBeVisible();
  await captureEvidence(page, testInfo, "chlum-furrows-overview");

  await moveTo(page, input, 560, 410, "permission");
  await captureEvidence(page, testInfo, "chlum-vaclav-context");
  await input.contextualAction();
  await expect(page.locator("#dialogName")).toHaveText("VÁCLAV");
  await input.activateUi(page.locator("#dialogButton"));

  await waitForTractorLeftOf(page, 620);
  await captureEvidence(page, testInfo, "chlum-tractor-checkpoint");

  await moveAxisTo(page, input, "x", 1020);
  await moveAxisTo(page, input, "y", 410);
  await waitForTractorLeftOf(page, 620);
  await moveAxisTo(page, input, "y", 720, 20_000, "dig");
  await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null, {
    timeout: 12_000,
    intervals: [30, 60, 100]
  }).toBe("dig");
  await captureEvidence(page, testInfo, "chlum-field-marker-dig-context");

  const final = await runtimeSnapshot(page);
  expect(final.scene).toBe("chlum");
  expect(final.chlum?.runtime?.tractor).toBeTruthy();
  expect(httpErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
