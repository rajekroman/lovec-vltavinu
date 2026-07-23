import fs from "node:fs";
import { test, expect } from "@playwright/test";

const MOVE_TOLERANCE = 20;

async function openBootstrap(page, url = "/?debug=1") {
  const pageErrors = [];
  const httpErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  return { pageErrors, httpErrors };
}

async function snapshot(page) {
  return page.evaluate(() => window.__lovecRuntime.snapshot());
}

async function inputSnapshot(page) {
  return page.evaluate(async () => {
    const { app } = await import("./src/bootstrap.js");
    return app.input.snapshot();
  });
}

function activeRuntime(state) {
  return state[state.scene]?.runtime ?? null;
}

async function expectReleasedInput(page) {
  await expect.poll(async () => {
    const input = await inputSnapshot(page);
    return {
      move: input.axes.move?.length ?? 0,
      action: Boolean(input.actions.action?.down),
      pause: Boolean(input.actions.pause?.down)
    };
  }).toEqual({ move: 0, action: false, pause: false });
}

async function enterChlum(page) {
  await page.locator("#playButton").tap();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 1 / 4");
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().chlum?.runtime?.player !== null)).toBe(true);
}

async function withPhaseSnapshot(page, phase, operation, target = null) {
  try {
    return await operation();
  } catch (error) {
    const runtime = await snapshot(page).catch(snapshotError => ({ snapshotError: snapshotError.message }));
    throw new Error(`${phase} failed: ${error instanceof Error ? error.message : String(error)}\n${JSON.stringify({ target, runtime }, null, 2)}`);
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
  const player = activeRuntime(initial)?.player;
  if (!player) throw new Error(`${initial.scene} player is not available.`);
  const delta = target - player[axis];
  if (Math.abs(delta) <= tolerance) return initial;

  const positiveKey = axis === "x" ? "ArrowRight" : "ArrowUp";
  const negativeKey = axis === "x" ? "ArrowLeft" : "ArrowDown";
  const key = delta > 0 ? positiveKey : negativeKey;
  const direction = Math.sign(delta);

  await page.evaluate(({ axisName, targetValue, targetTolerance, moveDirection, code, timeoutMs }) => {
    const state = { done: false, error: null, current: null };
    window.__lovecQaMovement = state;
    const startedAt = performance.now();
    const release = () => window.dispatchEvent(new KeyboardEvent("keyup", {
      code,
      key: code,
      bubbles: true,
      cancelable: true
    }));
    const monitor = () => {
      const snapshotValue = window.__lovecRuntime?.snapshot?.();
      const current = snapshotValue?.[snapshotValue.scene]?.runtime?.player?.[axisName];
      state.current = current;
      const reached = typeof current === "number" && (
        moveDirection > 0 ? current >= targetValue - targetTolerance : current <= targetValue + targetTolerance
      );
      if (reached) {
        release();
        state.done = true;
        return;
      }
      if (performance.now() - startedAt >= timeoutMs) {
        release();
        state.error = `Timed out at ${axisName}=${current}; target ${targetValue}.`;
        state.done = true;
        return;
      }
      requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
  }, {
    axisName: axis,
    targetValue: target,
    targetTolerance: tolerance,
    moveDirection: direction,
    code: key,
    timeoutMs: timeout
  });

  await page.keyboard.down(key);
  try {
    await page.waitForFunction(() => window.__lovecQaMovement?.done === true, null, { timeout: timeout + 2_000 });
    const movement = await page.evaluate(() => ({ ...window.__lovecQaMovement }));
    if (movement.error) throw new Error(movement.error);
  } finally {
    await page.keyboard.up(key);
    await page.evaluate(() => { delete window.__lovecQaMovement; });
  }

  const final = await snapshot(page);
  const current = activeRuntime(final)?.player?.[axis];
  if (typeof current !== "number" || Math.abs(target - current) > 45) {
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

async function waitForInteraction(page, kind, timeout = 8_000) {
  await withPhaseSnapshot(page, `interaction ${kind}`, () => expect.poll(() => page.evaluate(expected => {
    const state = window.__lovecRuntime.snapshot();
    return state[state.scene]?.runtime?.available?.kind === expected;
  }, kind), { timeout, intervals: [30, 60, 100] }).toBe(true), { kind });
}

async function moveToInteraction(page, x, y, kind) {
  await movePlayerTo(page, x, y);
  await waitForInteraction(page, kind);
}

async function contextualAction(page) {
  const action = page.locator("#actionButton");
  await expect(action).toHaveAttribute("aria-disabled", "false");
  const box = await action.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("Action button has no touch target.");

  const expectedKind = await page.evaluate(() => {
    const state = window.__lovecRuntime.snapshot();
    return state[state.scene]?.runtime?.available?.kind ?? null;
  });
  expect(expectedKind).not.toBeNull();
  await page.evaluate(async expected => {
    const { events } = await import("./src/bootstrap.js");
    window.__lovecQaInteractionOff?.();
    window.__lovecQaInteraction = { expected, performed: null };
    window.__lovecQaInteractionOff = events.once("interaction:performed", payload => {
      window.__lovecQaInteraction.performed = payload.kind;
    });
  }, expectedKind);

  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  const client = await page.context().newCDPSession(page);
  let touchStarted = false;
  try {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1 }]
    });
    touchStarted = true;
    await expect.poll(() => page.evaluate(() => window.__lovecQaInteraction?.performed ?? null), {
      timeout: 2_000,
      intervals: [10, 20, 30, 50]
    }).toBe(expectedKind);
  } finally {
    if (touchStarted) {
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }).catch(() => {});
    }
    await client.detach();
    await page.evaluate(() => {
      window.__lovecQaInteractionOff?.();
      delete window.__lovecQaInteractionOff;
      delete window.__lovecQaInteraction;
    });
  }
  await expectReleasedInput(page);
}

async function waitForTractorLeftOf(page, maxX = 700, timeout = 18_000) {
  await expect.poll(async () => {
    const tractorX = (await snapshot(page)).chlum?.runtime?.tractor?.x;
    return typeof tractorX === "number" && tractorX <= maxX;
  }, { timeout, intervals: [100, 180, 250] }).toBe(true);
}

async function successfulDigHit(page, expectedTotal) {
  await withPhaseSnapshot(page, `dig hit ${expectedTotal}`, async () => {
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
  }, { expectedTotal });
}

async function completeChlum(page) {
  await enterChlum(page);
  await moveToInteraction(page, 560, 410, "permission");
  await contextualAction(page);
  await expect(page.locator("#dialogName")).toHaveText("VÁCLAV");
  await page.locator("#dialogButton").tap();
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().session.flags.chlumPermission)).toBe(true);

  await movePlayerTo(page, 1020, 410);
  await waitForTractorLeftOf(page);
  await moveToInteraction(page, 1020, 720, "dig");
  await contextualAction(page);
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  for (let hit = 1; hit <= 3; hit++) await successfulDigHit(page, hit);
  await waitForInteraction(page, "collect");
  await contextualAction(page);
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function enterNesmenFromResult(page) {
  await expect(page.locator("#againButton")).toHaveText("POKRAČOVAT DO NESMĚNĚ");
  await page.locator("#againButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 2 / 4");
  await expect(page.locator("#briefTitle")).toHaveText("Lesní profily");
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().nesmen?.runtime?.profiles?.length)).toBe(3);
  await expect(page.locator("#placeLabel")).toHaveText("NESMĚŇ");
  await expect(page.locator("#objectiveLabel")).toHaveText("Získej souhlas lesníka");
  await expect(page.locator("#actionText")).toHaveText("AKCE");
}

async function captureEvidence(page, testInfo, name, expectedSize) {
  const directory = testInfo.outputPath("visual-evidence");
  fs.mkdirSync(directory, { recursive: true });
  const path = `${directory}/${name}.png`;
  const image = await page.screenshot({ path, animations: "disabled", caret: "hide", scale: "device" });
  expect({ width: image.readUInt32BE(16), height: image.readUInt32BE(20) }).toEqual(expectedSize);
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function verifyNesmenLifecycle(page, context, testInfo) {
  await captureEvidence(page, testInfo, "nesmen-portrait", { width: 1170, height: 2532 });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.__lovecRuntime.resize());
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().renderer.width)).toBe(844);
  await expectReleasedInput(page);
  await captureEvidence(page, testInfo, "nesmen-landscape", { width: 2532, height: 1170 });

  await page.locator("#pauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#resumeButton").click();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expectReleasedInput(page);

  const other = await context.newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  await page.waitForTimeout(120);
  await page.bringToFront();
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().running)).toBe(true);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime.snapshot().nesmen?.runtime?.player))).toBe(true);
  await expectReleasedInput(page);
  await other.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__lovecRuntime.resize());
  await expectReleasedInput(page);
}

async function completeNesmen(page) {
  await moveToInteraction(page, 280, 240, "permission");
  await contextualAction(page);
  await expect(page.locator("#dialogName")).toHaveText("JAN");
  await page.locator("#dialogButton").tap();
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().session.flags.nesmenPermission)).toBe(true);
  await expectReleasedInput(page);

  const profiles = [
    { x: 610, y: 430 },
    { x: 930, y: 690 },
    { x: 1210, y: 360 }
  ];
  let totalHits = 0;
  for (let index = 0; index < profiles.length; index++) {
    const profile = profiles[index];
    await moveToInteraction(page, profile.x, profile.y, "dig");
    await contextualAction(page);
    await expect(page.locator("#digScreen")).toHaveClass(/visible/);
    for (let localHit = 0; localHit < 3; localHit++) await successfulDigHit(page, ++totalHits);
    await expect(page.locator("#app")).toHaveClass(/playing/);
    await expect(page.locator("#resultScreen")).not.toHaveClass(/visible/);
    await expect(page.locator("#objectiveLabel")).toHaveText("Zasyp otevřenou díru");

    if (index === 0) {
      await waitForInteraction(page, "collect");
      await contextualAction(page);
    }
    await waitForInteraction(page, "fill");
    await expect(page.locator("#actionText")).toHaveText("ZAHRNOUT");
    await contextualAction(page);
    await expectReleasedInput(page);
    if (index < profiles.length - 1) await expect(page.locator("#resultScreen")).not.toHaveClass(/visible/);
  }
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function chaseTractorUntilDanger(page) {
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

    await page.evaluate(({ codes, timeoutMs }) => {
      const tracker = { done: false, caught: false };
      window.__lovecQaDanger = tracker;
      const startedAt = performance.now();
      const release = () => {
        for (const code of codes) window.dispatchEvent(new KeyboardEvent("keyup", {
          code,
          key: code,
          bubbles: true,
          cancelable: true
        }));
      };
      const monitor = () => {
        const danger = window.__lovecRuntime?.snapshot?.().session?.danger ?? 0;
        if (danger > 0) {
          tracker.caught = true;
          tracker.done = true;
          release();
          return;
        }
        if (performance.now() - startedAt >= timeoutMs) {
          tracker.done = true;
          release();
          return;
        }
        requestAnimationFrame(monitor);
      };
      requestAnimationFrame(monitor);
    }, { codes: keys, timeoutMs: 160 });

    for (const key of keys) await page.keyboard.down(key);
    let tracker = null;
    try {
      await page.waitForFunction(() => window.__lovecQaDanger?.done === true, null, { timeout: 1_000 });
      tracker = await page.evaluate(() => ({ ...window.__lovecQaDanger }));
    } finally {
      for (const key of [...keys].reverse()) await page.keyboard.up(key);
      await page.evaluate(() => { delete window.__lovecQaDanger; });
    }
    if (tracker?.caught) return snapshot(page);
  }
  throw new Error("Tractor did not trigger danger during an actual input-driven chase.");
}

const compactTransform = value => String(value).replace(/\s+/g, "");

async function enterBesedniceFromResult(page) {
  await expect(page.locator("#againButton")).toHaveText("POKRAČOVAT DO BESEDNICE");
  await page.locator("#againButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 3 / 4");
  await expect(page.locator("#briefTitle")).toHaveText("Ježková vrstva");
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().besednice?.runtime?.traces?.length)).toBe(3);
  await expect(page.locator("#placeLabel")).toHaveText("BESEDNICE");
  await expect(page.locator("#objectiveLabel")).toHaveText("Stopy 0/3");
  await expectReleasedInput(page);
}

async function isHedgehogProfileUnlocked(page) {
  return page.evaluate(async () => {
    const { app, besednice } = await import("./src/bootstrap.js");
    return app.world.get(besednice.hedgehogEntity, "interaction")?.enabled === true;
  });
}

async function completeBesednice(page) {
  const traces = [
    { x: 470, y: 890 },
    { x: 880, y: 620 },
    { x: 1240, y: 420 }
  ];

  for (let index = 0; index < traces.length; index++) {
    const trace = traces[index];
    await moveToInteraction(page, trace.x, trace.y, "discover");
    await contextualAction(page);
    await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().besednice.runtime.clues)).toBe(index + 1);
    await expectReleasedInput(page);

    const beforeDuplicate = (await snapshot(page)).besednice.runtime.clues;
    await expect(page.locator("#actionButton")).toHaveAttribute("aria-disabled", "true");
    await page.waitForTimeout(120);
    await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().besednice.runtime.clues)).toBe(beforeDuplicate);

    if (index < 2) {
      expect(await isHedgehogProfileUnlocked(page)).toBe(false);
      await expect(page.locator("#objectiveLabel")).toHaveText(`Stopy ${index + 1}/3`);
    }
  }

  expect(await isHedgehogProfileUnlocked(page)).toBe(true);
  await expect(page.locator("#objectiveLabel")).toHaveText("Vykopej ježkový profil");
  await moveToInteraction(page, 1430, 260, "dig");
  await contextualAction(page);
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  for (let hit = 1; hit <= 3; hit++) await successfulDigHit(page, hit);
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await waitForInteraction(page, "collect");
  await contextualAction(page);

  await expect.poll(() => page.evaluate(() => {
    const state = window.__lovecRuntime.snapshot();
    return {
      finding: state.session.findings.some(entry => entry.findingId === "besednice-hedgehog-1"),
      started: state.besednice.runtime.boss.started
    };
  })).toEqual({ finding: true, started: true });
  await expect(page.locator("#objectiveLabel")).toHaveText("Dostaň ježek zpět");

  await waitForInteraction(page, "recover", 15_000);
  await expect(page.locator("#actionText")).toHaveText("ZÍSKAT ZPĚT");
  await contextualAction(page);
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function verifyBesedniceLifecycle(page, context, testInfo) {
  await captureEvidence(page, testInfo, "besednice-portrait", { width: 1170, height: 2532 });

  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    window.dispatchEvent(new Event("orientationchange"));
    window.__lovecRuntime.resize();
  });
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().renderer.width)).toBe(844);
  await expectReleasedInput(page);
  await captureEvidence(page, testInfo, "besednice-landscape", { width: 2532, height: 1170 });

  await page.locator("#pauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#resumeButton").click();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expectReleasedInput(page);

  const other = await context.newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  await page.waitForTimeout(120);
  await page.bringToFront();
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().running)).toBe(true);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime.snapshot().besednice?.runtime?.player))).toBe(true);
  await expectReleasedInput(page);
  await other.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.dispatchEvent(new Event("orientationchange"));
    window.__lovecRuntime.resize();
  });
  await expectReleasedInput(page);
}

test("canonical input-driven Chlum → Nesměň → Besednice flow completes hedgehog recovery", async ({ page, context }, testInfo) => {
  test.setTimeout(220_000);
  const errors = await openBootstrap(page, "/");
  await completeChlum(page);

  const chlumComplete = await snapshot(page);
  expect(chlumComplete.chlum.levelComplete).toEqual({ levelId: "chlum", nextLevelId: "nesmen", score: 90 });
  expect(chlumComplete.session.findings[0]).toEqual({ findingId: "chlum-finding-1", locality: "chlum", rarity: "B", weight: 1.2, score: 90 });

  await enterNesmenFromResult(page);
  await completeNesmen(page);

  const nesmenComplete = await snapshot(page);
  expect(nesmenComplete.nesmen.levelComplete).toEqual({ levelId: "nesmen", nextLevelId: "besednice", score: 210 });
  expect(nesmenComplete.session.findings).toHaveLength(2);
  expect(nesmenComplete.nesmen.runtime.totalDigHits).toBe(9);
  expect(nesmenComplete.nesmen.runtime.profiles.every(profile => profile.dug && profile.filled)).toBe(true);

  await enterBesedniceFromResult(page);
  await verifyBesedniceLifecycle(page, context, testInfo);
  await completeBesednice(page);

  const completed = await snapshot(page);
  expect(completed.scene).toBe("besednice");
  expect(completed.session.findings).toHaveLength(3);
  expect(completed.session.findings[2]).toEqual({
    findingId: "besednice-hedgehog-1",
    locality: "besednice",
    rarity: "A",
    weight: 2.8,
    score: 240
  });
  expect(completed.session.score).toBe(450);
  expect(completed.session.objective).toEqual({ id: "besednice-hedgehog-recovery", current: 1, required: 1, complete: true });
  expect(completed.besednice.runtime.clues).toBe(3);
  expect(completed.besednice.runtime.totalDigHits).toBe(3);
  expect(completed.besednice.runtime.hedgehog).toEqual({ dug: true, collected: true });
  expect(completed.besednice.runtime.boss.started).toBe(true);
  expect(completed.besednice.runtime.boss.defeated).toBe(true);
  expect(completed.besednice.levelComplete).toEqual({ levelId: "besednice", nextLevelId: "slavia", score: 450 });
  expect(await page.evaluate(async () => {
    const { app } = await import("./src/bootstrap.js");
    return app.scenes.has("slavia");
  })).toBe(false);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(errors.httpErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);
});

test("tractor collision raises danger, returns player to spawn and does not freeze input", async ({ page }) => {
  test.setTimeout(45_000);
  const errors = await openBootstrap(page);
  await enterChlum(page);
  const state = await chaseTractorUntilDanger(page);
  expect(state.session.danger).toBeGreaterThan(0);
  await page.evaluate(() => window.__lovecRuntime.resetInput("playwright-tractor-caught"));
  await expectReleasedInput(page);
  await expect.poll(async () => {
    const current = await snapshot(page);
    const player = current.chlum?.runtime?.player;
    return player ? Math.hypot(player.x - 120, player.y - 380) : Number.POSITIVE_INFINITY;
  }, { timeout: 2_000, intervals: [20, 40, 80] }).toBeLessThan(40);
  expect(state.running).toBe(true);
  await page.locator("#pauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#resumeButton").click();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  expect(errors.httpErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);
});

test("runtime reset releases the mobile joystick in the Chlum scene", async ({ page }) => {
  const errors = await openBootstrap(page);
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
  expect(errors.httpErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);
});
