import fs from "node:fs";
import { test, expect } from "@playwright/test";

const TARGET_TOLERANCE = 36;

async function runtimeSnapshot(page) {
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

function digHitCount(state) {
  const runtime = activeRuntime(state);
  return Number(runtime?.totalDigHits);
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
      let active = true;
      let repeatError = null;
      await page.keyboard.down(key);
      const repeatTimer = setInterval(() => {
        if (!active) return;
        page.keyboard.down(key).catch(error => { repeatError ??= error; });
      }, 250);
      return async () => {
        if (!active) return;
        active = false;
        clearInterval(repeatTimer);
        await page.keyboard.up(key);
        if (repeatError) throw repeatError;
      };
    }

    const zone = page.locator("#moveZone");
    await expect(zone).toBeVisible();
    const moveZoneBox = await zone.boundingBox();
    expect(moveZoneBox).not.toBeNull();
    if (!moveZoneBox) throw new Error("Mobile joystick has no bounding box.");

    const radius = Math.max(1, Math.min(moveZoneBox.width, moveZoneBox.height) / 2);
    const centerX = moveZoneBox.x + moveZoneBox.width / 2;
    const centerY = moveZoneBox.y + moveZoneBox.height / 2;
    const x = Math.round(centerX + (axis === "x" ? direction * radius * 0.98 : 0));
    const y = Math.round(centerY + (axis === "y" ? -direction * radius * 0.98 : 0));
    const client = await page.context().newCDPSession(page);
    let active = true;
    let repeatError = null;
    let repeatPromise = Promise.resolve();
    const touchPoint = { x, y, radiusX: 4, radiusY: 4, force: 1 };
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [touchPoint]
    });
    const repeatTimer = setInterval(() => {
      if (!active) return;
      repeatPromise = repeatPromise
        .then(() => client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [touchPoint] }))
        .catch(error => { repeatError ??= error; });
    }, 250);
    return async () => {
      if (!active) return;
      active = false;
      clearInterval(repeatTimer);
      await repeatPromise;
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }).catch(() => {});
      await client.detach().catch(() => {});
      if (repeatError) throw repeatError;
    };
  }

  return Object.freeze({ desktop, activateUi, contextualAction, holdAxis });
}

async function expectReleasedInput(page) {
  await expect.poll(async () => {
    const input = await inputSnapshot(page);
    return {
      move: input.axes.move?.length ?? 0,
      action: Boolean(input.actions.action?.down),
      pause: Boolean(input.actions.pause?.down)
    };
  }, { timeout: 20_000 }).toEqual({ move: 0, action: false, pause: false });
}

async function captureEvidence(page, testInfo, name) {
  const directory = testInfo.outputPath("visual-evidence");
  fs.mkdirSync(directory, { recursive: true });
  const path = `${directory}/${name}.png`;
  await page.screenshot({ path, animations: "disabled", caret: "hide", scale: "device", timeout: 15_000 });
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
  const movementTimeout = input.desktop ? timeout : timeout + 30_000;

  await page.evaluate(async ({ axisName, targetValue, tolerance, moveDirection, timeoutMs, expectedKind }) => {
    const { app } = await import("./src/bootstrap.js");
    window.__slaviaQaMovement = { done: false, error: null, current: null, paused: false, interaction: null };
    const startedAt = performance.now();
    const monitor = () => {
      const state = window.__lovecRuntime?.snapshot?.();
      const runtime = state?.[state.scene]?.runtime;
      const current = runtime?.player?.[axisName];
      const availableKind = runtime?.available?.kind ?? null;
      window.__slaviaQaMovement.current = current;
      const reached = typeof current === "number" && (
        moveDirection > 0 ? current >= targetValue - tolerance : current <= targetValue + tolerance
      );
      const interactionReached = Boolean(expectedKind) && availableKind === expectedKind;
      if (reached || interactionReached) {
        app.stop();
        window.__slaviaQaMovement.paused = true;
        window.__slaviaQaMovement.interaction = interactionReached ? availableKind : null;
        window.__slaviaQaMovement.done = true;
        return;
      }
      if (performance.now() - startedAt >= timeoutMs) {
        window.__slaviaQaMovement.error = `Timed out at ${axisName}=${current}; target ${targetValue}; interaction ${availableKind}.`;
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
    timeoutMs: movementTimeout,
    expectedKind: stopKind
  });

  let movement = null;
  let release = null;
  const movementDeadline = Date.now() + movementTimeout + 2_000;
  try {
    while (!movement?.done) {
      release = await input.holdAxis(axis, direction);
      const holdWindow = input.desktop
        ? Math.max(1, movementDeadline - Date.now())
        : Math.min(8_000, Math.max(1, movementDeadline - Date.now()));
      try {
        await page.waitForFunction(() => window.__slaviaQaMovement?.done === true, null, { timeout: holdWindow });
      } catch (error) {
        if (input.desktop || Date.now() >= movementDeadline) throw error;
      } finally {
        await release().catch(() => {});
        release = null;
      }
      movement = await page.evaluate(() => ({ ...window.__slaviaQaMovement }));
    }
  } finally {
    await release?.().catch(() => {});
    await page.evaluate(async () => {
      const { app } = await import("./src/bootstrap.js");
      app.start();
      delete window.__slaviaQaMovement;
    }).catch(() => {});
  }

  if (movement?.error) throw new Error(movement.error);
  const final = await runtimeSnapshot(page);
  if (stopKind && activeRuntime(final)?.available?.kind === stopKind) return;
  const current = activeRuntime(final)?.player?.[axis];
  if (typeof current !== "number" || Math.abs(target - current) > TARGET_TOLERANCE) {
    throw new Error(`Player did not settle near ${axis}=${target}; current ${current}.`);
  }
}

async function moveTo(page, input, x, y, kind, timeout = 12_000) {
  const approaches = [[x, y], [x - 20, y], [x + 20, y], [x, y - 20], [x, y + 20], [x, y]];
  const collisionTolerantKind = kind;
  for (const [targetX, targetY] of approaches) {
    await moveAxisTo(page, input, "x", targetX, 20_000, collisionTolerantKind);
    if ((activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null) === kind) return;
    await moveAxisTo(page, input, "y", targetY, 20_000, collisionTolerantKind);
    if ((activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null) === kind) return;
  }
  await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null, {
    timeout,
    intervals: [30, 60, 100]
  }).toBe(kind);
}

async function performAction(page, input) {
  const expectedKind = await page.evaluate(() => {
    const state = window.__lovecRuntime.snapshot();
    return state[state.scene]?.runtime?.available?.kind ?? null;
  });
  expect(expectedKind).not.toBeNull();
  if (!input.desktop) await expect(page.locator("#actionButton")).toHaveAttribute("aria-disabled", "false");

  await page.evaluate(async () => {
    const { events } = await import("./src/bootstrap.js");
    window.__slaviaQaInteractionOff?.();
    window.__slaviaQaInteraction = { performed: null };
    window.__slaviaQaInteractionOff = events.once("interaction:performed", payload => {
      window.__slaviaQaInteraction.performed = payload.kind;
    });
  });

  try {
    await input.contextualAction();
    await expect.poll(() => page.evaluate(() => window.__slaviaQaInteraction?.performed ?? null), {
      timeout: 6_000,
      intervals: [10, 20, 30, 50]
    }).toBe(expectedKind);
  } finally {
    await page.evaluate(() => {
      window.__slaviaQaInteractionOff?.();
      delete window.__slaviaQaInteractionOff;
      delete window.__slaviaQaInteraction;
    }).catch(() => {});
  }
  await expectReleasedInput(page);
}

async function pauseLoopAtDigSweetSpot(page, expectedTotal, timeout = 10_000) {
  await page.evaluate(async ({ target, timeoutMs }) => {
    const { app } = await import("./src/bootstrap.js");
    await new Promise((resolve, reject) => {
      const startedAt = performance.now();
      const monitor = () => {
        const state = window.__lovecRuntime?.snapshot?.();
        const runtime = state?.[state.scene]?.runtime;
        const total = Number(runtime?.totalDigHits);
        if (total >= target) {
          app.stop();
          resolve();
          return;
        }
        const position = runtime?.dig?.position;
        if (total === target - 1 && typeof position === "number" && position >= 0.46 && position <= 0.54) {
          app.stop();
          resolve();
          return;
        }
        if (performance.now() - startedAt >= timeoutMs) {
          reject(new Error(`Dig hit ${target} did not enter the sweet spot.`));
          return;
        }
        requestAnimationFrame(monitor);
      };
      requestAnimationFrame(monitor);
    });
  }, { target: expectedTotal, timeoutMs: timeout });
}

async function successfulDigHit(page, input, expectedTotal) {
  await pauseLoopAtDigSweetSpot(page, expectedTotal);
  try {
    const stopped = await runtimeSnapshot(page);
    expect(stopped.running).toBe(false);
    if (digHitCount(stopped) < expectedTotal) {
      const position = activeRuntime(stopped)?.dig?.position;
      expect(position).toBeGreaterThanOrEqual(0.4);
      expect(position).toBeLessThanOrEqual(0.6);
      await input.activateUi(page.locator("#digButton"));
    }
    await expect.poll(async () => digHitCount(await runtimeSnapshot(page)), {
      timeout: 2_000,
      intervals: [20, 30, 50]
    }).toBeGreaterThanOrEqual(expectedTotal);
  } finally {
    await page.evaluate(async () => {
      const { app } = await import("./src/bootstrap.js");
      app.start();
    }).catch(() => {});
  }
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().running)).toBe(true);
}

async function waitForTractorLeftOf(page, maxX = 620, timeout = 75_000) {
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

async function completeChlum(page, input, testInfo) {
  await moveTo(page, input, 560, 410, "permission");
  await performAction(page, input);
  await expect(page.locator("#dialogName")).toHaveText("VÁCLAV");
  await input.activateUi(page.locator("#dialogButton"));

  const sites = [
    { x: 1020, y: 720 },
    { x: 760, y: 920 },
    { x: 1320, y: 860 }
  ];
  await moveAxisTo(page, input, "x", sites[0].x);
  await moveAxisTo(page, input, "y", 410);
  await waitForTractorLeftOf(page);

  for (const [index, site] of sites.entries()) {
    await moveAxisTo(page, input, "x", site.x);
    await moveAxisTo(page, input, "y", site.y);
    await expect(page.locator("#actionButton")).toHaveAttribute("aria-label", "RADAR");
    if (!input.desktop) await expect(page.locator("#actionButton")).toHaveAttribute("aria-disabled", "false");
    await input.contextualAction();
    await expectReleasedInput(page);
    await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.searchedCount).toBe(index + 1);
    if (index === 0) await captureEvidence(page, testInfo, "chlum-radar-finding");
    await expect.poll(async () => activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null).toBe("collect");
    await performAction(page, input);
    await expect.poll(async () => (
      (await runtimeSnapshot(page)).session.findings.filter(finding => finding.locality === "chlum").length
    )).toBe(index + 1);
  }
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function enterLevel(page, input, buttonText, kicker, scene) {
  await expect(page.locator("#againButton")).toHaveText(buttonText);
  await input.activateUi(page.locator("#againButton"));
  await expect(page.locator("#briefKicker")).toHaveText(kicker);
  await input.activateUi(page.locator("#briefButton"));
  await expect.poll(async () => (await runtimeSnapshot(page)).scene).toBe(scene);
}

async function completeNesmen(page, input, testInfo) {
  await moveTo(page, input, 280, 240, "permission");
  await performAction(page, input);
  await expect(page.locator("#dialogName")).toHaveText("JAN");
  await input.activateUi(page.locator("#dialogButton"));

  const profiles = [{ x: 610, y: 430 }, { x: 930, y: 690 }, { x: 1210, y: 360 }];
  let totalHits = 0;
  for (let index = 0; index < profiles.length; index++) {
    const profile = profiles[index];
    await moveTo(page, input, profile.x, profile.y, "dig");
    if (index === 0) {
      const state = await runtimeSnapshot(page);
      expect(state.nesmen.runtime.visualMode).toBe("layered-forest-v7");
      expect(state.nesmen.runtime.loadedAssets).toContain("terrain-nesmen-forest-plate-v7");
      expect(state.nesmen.runtime.loadedAssets).toContain("foreground-nesmen-forest-edge-v7");
      expect(state.nesmen.runtime.cameraZoom).toBeGreaterThan(0.9);
      await captureEvidence(page, testInfo, "nesmen-layered-forest");
    }
    await performAction(page, input);
    await expect(page.locator("#digScreen")).toHaveClass(/visible/);
    for (let hit = 0; hit < 3; hit++) await successfulDigHit(page, input, ++totalHits);

    const pendingKinds = new Set(["collect", "fill"]);
    while (pendingKinds.size > 0) {
      let availableKind = activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null;
      if (!pendingKinds.has(availableKind)) {
        const requiredKind = pendingKinds.has("collect") ? "collect" : "fill";
        const target = requiredKind === "collect"
          ? { x: profile.x + 30, y: profile.y + 18 }
          : profile;
        await moveTo(page, input, target.x, target.y, requiredKind);
        availableKind = activeRuntime(await runtimeSnapshot(page))?.available?.kind ?? null;
      }
      expect(pendingKinds.has(availableKind)).toBe(true);
      pendingKinds.delete(availableKind);
      await performAction(page, input);
    }

    const state = await runtimeSnapshot(page);
    expect(state.session.findings.filter(entry => entry.locality === "nesmen")).toHaveLength(index + 1);
  }
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

async function pauseForBesedniceEvidence(page, timeout = 20_000) {
  await page.evaluate(async timeoutMs => {
    const { app } = await import("./src/bootstrap.js");
    await new Promise((resolve, reject) => {
      const startedAt = performance.now();
      const monitor = () => {
        const runtime = window.__lovecRuntime?.snapshot?.()?.besednice?.runtime;
        const player = runtime?.player;
        const boss = runtime?.boss;
        const distance = player && boss ? Math.hypot(player.x - boss.x, player.y - boss.y) : Infinity;
        if (boss?.started === true && boss.defeated !== true && distance >= 120 && distance <= 200) {
          app.stop();
          resolve();
          return;
        }
        if (performance.now() - startedAt >= timeoutMs) {
          reject(new Error(`Karel did not enter the evidence distance; current ${distance}.`));
          return;
        }
        requestAnimationFrame(monitor);
      };
      requestAnimationFrame(monitor);
    });
  }, timeout);
}

async function completeBesednice(page, input, testInfo) {
  await moveTo(page, input, 260, 980, "talk", 15_000);
  await performAction(page, input);
  await expect(page.locator("#dialogName")).toHaveText("MILAN");
  await input.activateUi(page.locator("#dialogButton"));
  await expect.poll(async () => (await runtimeSnapshot(page)).besednice?.runtime?.briefingComplete ?? false).toBe(true);

  for (const trace of [{ x: 470, y: 890 }, { x: 880, y: 620 }, { x: 1240, y: 420 }]) {
    await moveTo(page, input, trace.x, trace.y, "discover", 15_000);
    await performAction(page, input);
  }
  await moveTo(page, input, 1430, 260, "dig");
  await performAction(page, input);
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  for (let hit = 1; hit <= 3; hit++) await successfulDigHit(page, input, hit);
  await moveTo(page, input, 1464, 278, "collect");
  await performAction(page, input);
  await pauseForBesedniceEvidence(page);
  try {
    const besednice = await runtimeSnapshot(page);
    const distance = Math.hypot(
      besednice.besednice.runtime.player.x - besednice.besednice.runtime.boss.x,
      besednice.besednice.runtime.player.y - besednice.besednice.runtime.boss.y
    );
    expect(besednice.besednice.runtime.loadedAssets).toContain("npc-rival-karel");
    expect(besednice.besednice.runtime.boss.started).toBe(true);
    expect(besednice.besednice.runtime.boss.defeated).not.toBe(true);
    expect(distance).toBeGreaterThanOrEqual(120);
    expect(distance).toBeLessThanOrEqual(200);
    await captureEvidence(page, testInfo, "besednice-karel");
  } finally {
    await page.evaluate(async () => {
      const { app } = await import("./src/bootstrap.js");
      app.start();
    }).catch(() => {});
  }
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().running)).toBe(true);
  await moveTo(page, input, 1510, 900, "recover", 15_000);
  await performAction(page, input);
  await expect(page.locator("#dialogName")).toHaveText("KAREL");
  await input.activateUi(page.locator("#dialogButton"));
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
}

test("Chlum → Nesměň → Besednice → Slavia certifies 10 findings and submits exactly four to the jury", async ({ page }, testInfo) => {
  test.setTimeout(900_000);
  const input = createInputDriver(page, testInfo);
  const pageErrors = [];
  const httpErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`); });

  await startChlum(page, input);
  await completeChlum(page, input, testInfo);
  await enterLevel(page, input, "POKRAČOVAT DO NESMĚNĚ", "LOKALITA 2 / 4", "nesmen");
  await completeNesmen(page, input, testInfo);
  await enterLevel(page, input, "POKRAČOVAT DO BESEDNICE", "LOKALITA 3 / 4", "besednice");
  await completeBesednice(page, input, testInfo);
  await enterLevel(page, input, "POKRAČOVAT DO SLAVIE", "LOKALITA 4 / 4", "slavia");

  const arrived = await runtimeSnapshot(page);
  const collectionBeforeJury = arrived.session.findings.map(finding => ({ ...finding }));
  const scoreBeforeJury = arrived.session.score;
  expect(collectionBeforeJury).toHaveLength(10);
  expect(new Set(collectionBeforeJury.map(finding => finding.findingId)).size).toBe(10);
  expect(collectionBeforeJury.filter(finding => finding.locality === "chlum")).toHaveLength(3);
  expect(collectionBeforeJury.filter(finding => finding.locality === "nesmen")).toHaveLength(3);
  expect(collectionBeforeJury.filter(finding => finding.locality === "besednice")).toHaveLength(4);
  for (const finding of collectionBeforeJury) {
    expect(Object.keys(finding).sort()).toEqual(["findingId", "locality", "rarity", "score", "weight"]);
    expect(finding.findingId).toBeTruthy();
    expect(["chlum", "nesmen", "besednice"]).toContain(finding.locality);
    expect(["A", "B", "C"]).toContain(finding.rarity);
    expect(Number.isFinite(finding.weight)).toBe(true);
    expect(Number.isFinite(finding.score)).toBe(true);
  }
  expect(scoreBeforeJury).toBe(collectionBeforeJury.reduce((total, finding) => total + finding.score, 0));
  expect(arrived.slavia.runtime.visualMode).toBe("event-plaza-v7");
  expect(arrived.slavia.runtime.loadedAssets).toContain("terrain-slavia-event-plate-v7");
  expect(arrived.slavia.runtime.loadedAssets).toContain("foreground-slavia-event-edge-v7");
  expect(arrived.slavia.runtime.cameraZoom).toBeGreaterThanOrEqual(0.9);
  await captureEvidence(page, testInfo, "slavia-arrival");

  for (const document of [{ x: 410, y: 760 }, { x: 790, y: 460 }, { x: 1130, y: 780 }]) {
    await moveTo(page, input, document.x, document.y, "collect-document");
    await performAction(page, input);
  }
  await moveTo(page, input, 1450, 430, "register-collection");
  await performAction(page, input);
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await input.activateUi(page.locator("#dialogButton"));
  await moveTo(page, input, 1020, 260, "recover-best-finding");
  await performAction(page, input);
  await expect(page.locator("#dialogName")).toHaveText("FRANTIŠEK");
  await input.activateUi(page.locator("#dialogButton"));
  await moveTo(page, input, 1450, 430, "receive-certificate");
  await performAction(page, input);
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await captureEvidence(page, testInfo, "slavia-certification");
  await input.activateUi(page.locator("#dialogButton"));
  await moveTo(page, input, 1630, 520, "enter-event");
  await performAction(page, input);

  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  await expect(page.locator("#resultScreen")).not.toHaveClass(/visible/);
  const beforeSelection = await runtimeSnapshot(page);
  expect(beforeSelection.slavia.flow.phase).toBe("jury-selection");
  expect(beforeSelection.slavia.flow.complete).toBe(false);
  expect(beforeSelection.slavia.flow.jurySubmitted).toBe(false);
  expect(beforeSelection.session.findings).toEqual(collectionBeforeJury);
  expect(beforeSelection.session.score).toBe(scoreBeforeJury);

  const juryOptions = page.locator(".jury-finding-option input");
  await expect(juryOptions).toHaveCount(10);
  const selectedIndexes = [0, 3, 6, 9];
  const selectedIds = selectedIndexes.map(index => collectionBeforeJury[index].findingId);
  const selectOption = async index => {
    const option = juryOptions.nth(index);
    if (input.desktop) await option.check();
    else await touchLocator(page, option);
  };

  for (const index of selectedIndexes.slice(0, 3)) await selectOption(index);
  await expect(page.locator("#jurySelectionStatus")).toHaveText("VYBRÁNO 3/4");
  await expect(page.locator("#jurySubmitButton")).toBeDisabled();

  await selectOption(selectedIndexes[3]);
  await expect(page.locator("#jurySelectionStatus")).toHaveText("VYBRÁNO 4/4");
  await expect(page.locator("#jurySubmitButton")).toBeEnabled();

  await selectOption(1);
  await expect(juryOptions.nth(1)).not.toBeChecked();
  await expect(page.locator("#jurySelectionStatus")).toHaveText("VYBRÁNO 4/4");
  await captureEvidence(page, testInfo, "slavia-jury-selection");

  await input.activateUi(page.locator("#jurySubmitButton"));
  await expect(page.locator("#juryScreen")).not.toHaveClass(/visible/);
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
  await expect(page.locator("#resultKicker")).toHaveText("NA ZELENÉ VLNĚ — FINÁLE");
  await expect(page.locator("#againButton")).toHaveText("NOVÁ VÝPRAVA");
  await captureEvidence(page, testInfo, "slavia-final-result");

  const completed = await runtimeSnapshot(page);
  const selectedFindings = collectionBeforeJury.filter(finding => selectedIds.includes(finding.findingId));
  const selectedScore = selectedFindings.reduce((total, finding) => total + finding.score, 0);
  const selectedWeight = Number(selectedFindings.reduce((total, finding) => total + finding.weight, 0).toFixed(2));
  const rarityWeights = { A: 3, B: 2, C: 1 };
  const selectedRarityPoints = selectedFindings.reduce((total, finding) => total + rarityWeights[finding.rarity], 0);

  expect(completed.session.phase).toBe("finale");
  expect(completed.session.flags.slaviaCertificate).toBe(true);
  expect(completed.slavia.flow.phase).toBe("complete");
  expect(completed.slavia.flow.complete).toBe(true);
  expect(completed.slavia.flow.jurySubmitted).toBe(true);
  expect(completed.slavia.evaluation.findingCount).toBe(4);
  expect(completed.slavia.evaluation.submittedFindingIds).toEqual(selectedIds);
  expect(completed.slavia.evaluation.score).toBe(selectedScore);
  expect(completed.slavia.evaluation.totalWeight).toBe(selectedWeight);
  expect(completed.slavia.evaluation.rarityPoints).toBe(selectedRarityPoints);
  expect(completed.session.findings).toEqual(collectionBeforeJury);
  expect(completed.session.findings).toHaveLength(10);
  expect(completed.session.score).toBe(scoreBeforeJury);

  await input.activateUi(page.locator("#againButton"));
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  const restarted = await runtimeSnapshot(page);
  expect(restarted.scene).toBe("title");
  expect(restarted.session.levelId).toBe("chlum");
  expect(restarted.session.phase).toBe("briefing");
  expect(restarted.session.findings).toEqual([]);
  expect(restarted.session.score).toBe(0);
  expect(restarted.session.flags).toEqual({});
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await expectReleasedInput(page);
  expect(httpErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("Slavia jury selection accepts exactly four findings without clipping", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  await page.evaluate(async () => {
    const { app } = await import("./src/bootstrap.js");
    const { ScreenController } = await import("./src/ui/ScreenController.js");
    app.stop();
    const screens = new ScreenController(document);
    const findings = ["a", "b", "c", "d", "e", "f"].map((findingId, index) => ({
      findingId,
      locality: ["chlum", "nesmen", "besednice"][index % 3],
      rarity: ["A", "B", "C"][index % 3],
      weight: 1 + index / 10,
      score: 60 + index * 20
    }));
    window.__jurySubmittedIds = null;
    screens.showJurySelection({
      findings,
      required: 4,
      onSubmit: ids => { window.__jurySubmittedIds = ids; }
    });
  });

  const jury = page.locator("#juryScreen");
  await expect(jury).toHaveClass(/visible/);
  await expect(page.locator("#jurySubmitButton")).toBeDisabled();
  const options = page.locator(".jury-finding-option input");
  for (let index = 0; index < 4; index++) await options.nth(index).check();
  await expect(page.locator("#jurySelectionStatus")).toHaveText("VYBRÁNO 4/4");
  await expect(page.locator("#jurySubmitButton")).toBeEnabled();
  await options.nth(4).click();
  await expect(options.nth(4)).not.toBeChecked();

  await page.locator("#jurySubmitButton").scrollIntoViewIfNeeded();
  const box = await page.locator("#jurySubmitButton").boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  await page.locator("#jurySubmitButton").click();
  await expect.poll(() => page.evaluate(() => window.__jurySubmittedIds)).toEqual(["a", "b", "c", "d"]);
});
