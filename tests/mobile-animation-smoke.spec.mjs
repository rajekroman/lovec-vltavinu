import { test, expect } from "@playwright/test";

async function playerVisual(page) {
  return page.evaluate(async () => {
    const { renderer, nesmen } = await import("/src/bootstrap.js");
    const entity = nesmen.playerEntity;
    const object = renderer.objectByEntity.get(entity);
    const sprite = nesmen.app.world.get(entity, "sprite");
    const animation = nesmen.app.world.get(entity, "animation");
    const transform = nesmen.app.world.get(entity, "transform");
    return {
      frame: sprite?.frame ?? null,
      flipX: sprite?.flipX ?? null,
      playing: animation?.playing ?? null,
      direction: animation?.direction ?? null,
      offsetX: object?.material?.map?.offset?.x ?? null,
      offsetY: object?.material?.map?.offset?.y ?? null,
      scaleX: object?.scale?.x ?? null,
      x: transform?.x ?? null,
      y: transform?.y ?? null
    };
  });
}

async function inputSnapshot(page) {
  return page.evaluate(async () => {
    const { app } = await import("/src/bootstrap.js");
    return app.input.snapshot();
  });
}

async function beginJoystick(page, axisX, axisY) {
  const zone = page.locator("#moveZone");
  await expect(zone).toBeVisible();
  const box = await zone.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("Mobile joystick has no bounding box.");

  const radius = Math.max(1, Math.min(box.width, box.height) / 2);
  const length = Math.hypot(axisX, axisY) || 1;
  const x = Math.round(box.x + box.width / 2 + axisX / length * radius * 0.78);
  const y = Math.round(box.y + box.height / 2 - axisY / length * radius * 0.78);
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

async function installFrameEvidence(page) {
  await page.evaluate(async () => {
    const { events, nesmen } = await import("/src/bootstrap.js");
    window.__animationFrameEvidenceUnsubscribe?.();
    window.__animationFrameEvidence = [];
    window.__animationFrameEvidenceUnsubscribe = events.on("animation:frame", payload => {
      if (payload?.entity !== nesmen.playerEntity) return;
      window.__animationFrameEvidence.push({ clip: payload.clip, frame: payload.frame });
      if (window.__animationFrameEvidence.length > 128) window.__animationFrameEvidence.shift();
    });
  });
}

async function clearFrameEvidence(page) {
  await page.evaluate(() => {
    window.__animationFrameEvidence = [];
  });
}

async function frameEvidence(page) {
  return page.evaluate(() => [...(window.__animationFrameEvidence ?? [])]);
}

const DIRECTIONS = [
  { name: "right", x: 1, y: 0, firstFrame: 8, lastFrame: 11, axis: "x", sign: 1 },
  { name: "left", x: -1, y: 0, firstFrame: 4, lastFrame: 7, axis: "x", sign: -1 },
  { name: "up", x: 0, y: 1, firstFrame: 12, lastFrame: 15, axis: "y", sign: 1 },
  { name: "down", x: 0, y: -1, firstFrame: 0, lastFrame: 3, axis: "y", sign: -1 }
];

test("Nesměň real touch drives all four walk rows and returns to directional idle", async ({ page }) => {
  test.setTimeout(45_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  await page.evaluate(async () => {
    const { app, session } = await import("/src/bootstrap.js");
    session.reset();
    await app.changeScene("nesmen");
  });
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await installFrameEvidence(page);

  const initial = await playerVisual(page);
  expect(initial).toMatchObject({ frame: 0, direction: "down", playing: false, flipX: false });
  expect(initial.offsetX).toBeCloseTo(0, 6);
  expect(initial.offsetY).toBeCloseTo(0.75, 6);
  expect(initial.scaleX).toBeGreaterThan(0);

  for (const direction of DIRECTIONS) {
    await clearFrameEvidence(page);
    const before = await playerVisual(page);
    const release = await beginJoystick(page, direction.x, direction.y);
    try {
      await expect.poll(async () => {
        const input = await inputSnapshot(page);
        const axis = input.axes.move ?? { x: 0, y: 0 };
        return (direction.axis === "x" ? axis.x : axis.y) * direction.sign;
      }, { timeout: 3_000, intervals: [30, 50, 80] }).toBeGreaterThan(0.5);

      await expect.poll(async () => {
        const visual = await playerVisual(page);
        const evidence = await frameEvidence(page);
        const delta = (visual[direction.axis] - before[direction.axis]) * direction.sign;
        return {
          direction: visual.direction,
          inRow: visual.frame >= direction.firstFrame && visual.frame <= direction.lastFrame,
          flipX: visual.flipX,
          advancedFrame: evidence.some(event => event.clip === "walk"
            && event.frame >= direction.firstFrame
            && event.frame <= direction.lastFrame
            && event.frame !== direction.firstFrame),
          moved: delta > 8
        };
      }, { timeout: 3_000, intervals: [30, 50, 80] }).toEqual({
        direction: direction.name,
        inRow: true,
        flipX: false,
        advancedFrame: true,
        moved: true
      });
    } finally {
      await release();
    }

    await expect.poll(async () => {
      const visual = await playerVisual(page);
      return {
        playing: visual.playing,
        direction: visual.direction,
        frame: visual.frame,
        flipX: visual.flipX
      };
    }, { timeout: 3_000, intervals: [30, 50, 80] }).toEqual({
      playing: false,
      direction: direction.name,
      frame: direction.firstFrame,
      flipX: false
    });
  }

  await page.evaluate(() => {
    window.__animationFrameEvidenceUnsubscribe?.();
    delete window.__animationFrameEvidenceUnsubscribe;
    delete window.__animationFrameEvidence;
  });
  expect(pageErrors).toEqual([]);
});
