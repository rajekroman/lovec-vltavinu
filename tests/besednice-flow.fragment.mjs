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
    await contextualAction(page);
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
