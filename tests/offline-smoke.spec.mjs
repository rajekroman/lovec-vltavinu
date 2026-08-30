import { test, expect } from "@playwright/test";

// The service worker is a distribution cache only: it must make the first
// canonical level playable with the network gone. Every other Playwright
// project blocks service workers, so this is the only place that proves the
// hand-maintained CORE list in sw.js still covers what the runtime loads.
//
// The level is played ONLY after the network is cut. Playing while online
// would let the network-first fetch handler cache the level assets on the way
// through, and the run would pass even with those assets missing from CORE.

async function playChlum(page) {
  await page.click("#playButton");
  await page.waitForFunction(() => window.__lovecRuntime.snapshot().scene === "chlum", null, { timeout: 25_000 });
  await page.waitForTimeout(1_200);
  for (let index = 0; index < 3; index += 1) {
    const button = await page.$(".screen.visible button.primary-button");
    if (!button) break;
    await button.click();
    await page.waitForTimeout(400);
  }
  return page.evaluate(() => {
    const snapshot = window.__lovecRuntime.snapshot();
    return {
      scene: snapshot.scene,
      running: snapshot.running,
      stable: snapshot.stable,
      loadedAssets: [...(snapshot.chlum?.runtime?.loadedAssets ?? [])].sort()
    };
  });
}

test("service worker precache alone keeps Chlum playable with the network disconnected", async ({ page, browser }) => {
  // Reference run: what Chlum loads when the network is available.
  await page.goto("./index.html", { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.__lovecRuntime), null, { timeout: 25_000 });
  const online = await playChlum(page);
  expect(online.scene).toBe("chlum");
  expect(online.loadedAssets.length).toBeGreaterThan(0);

  // Fresh client in its OWN context: Cache Storage is per-context, so reusing
  // the reference context would serve assets the online run had already pulled
  // through the network-first handler, and a missing CORE entry would pass.
  const freshContext = await browser.newContext({ serviceWorkers: "allow", baseURL: page.url() });
  const fresh = await freshContext.newPage();
  const failedRequests = [];
  fresh.on("requestfailed", request => failedRequests.push(`${request.failure()?.errorText} ${request.url()}`));

  await fresh.goto("./index.html", { waitUntil: "load" });
  await fresh.waitForFunction(() => Boolean(window.__lovecRuntime), null, { timeout: 25_000 });
  await fresh.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 25_000 });

  const precached = await fresh.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys[0]);
    return { name: keys[0], entries: (await cache.keys()).length };
  });
  expect(precached.name).toMatch(/^lovec-vltavinu-/);
  expect(precached.entries).toBeGreaterThan(100);

  await freshContext.setOffline(true);
  failedRequests.length = 0;

  const offline = await playChlum(fresh);
  expect(offline.scene).toBe("chlum");
  expect(offline.running).toBe(true);
  expect(offline.stable).toBe(true);
  // Identical asset set, not merely "it did not crash": a silent texture
  // failure would still leave the scene running.
  expect(offline.loadedAssets).toEqual(online.loadedAssets);
  expect(failedRequests, `offline run must not hit the network: ${failedRequests.join(", ")}`).toEqual([]);
  await freshContext.close();
});
