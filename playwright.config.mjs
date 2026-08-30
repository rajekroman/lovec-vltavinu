import { defineConfig, devices } from "@playwright/test";

const iphone13 = devices["iPhone 13"];

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  // Each CI project runs on its own GitHub runner. Keep one worker inside each
  // WebGL project for deterministic input and rendering behavior.
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    serviceWorkers: "block",
    actionTimeout: 6_000,
    navigationTimeout: 10_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop-chromium",
      testMatch: [/slavia-smoke\.spec\.mjs$/, /v71-dig-smoke\.spec\.mjs$/],
      metadata: { inputMode: "desktop", orientation: "landscape" },
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      // The only project that lets the service worker run: it proves the CORE
      // list in sw.js still covers everything the first level loads.
      name: "offline-chromium",
      testMatch: /offline-smoke\.spec\.mjs$/,
      metadata: { inputMode: "desktop", orientation: "landscape" },
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1280, height: 720 },
        serviceWorkers: "allow"
      }
    },
    {
      name: "audio-lifecycle-chromium",
      testMatch: /audio-lifecycle\.spec\.mjs$/,
      metadata: { inputMode: "desktop", orientation: "landscape" },
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: "iphone-portrait",
      testMatch: /slavia-smoke\.spec\.mjs$/,
      metadata: { inputMode: "touch", orientation: "portrait" },
      use: {
        ...iphone13,
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        screen: { width: 390, height: 844 }
      }
    },
    {
      name: "iphone-portrait-smoke",
      testMatch: [/mobile-smoke\.spec\.mjs$/, /mobile-animation-smoke\.spec\.mjs$/, /radar-hud-smoke\.spec\.mjs$/],
      metadata: { inputMode: "touch", orientation: "portrait" },
      use: {
        ...iphone13,
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        screen: { width: 390, height: 844 }
      }
    },
    {
      name: "iphone-landscape",
      testMatch: /slavia-smoke\.spec\.mjs$/,
      metadata: { inputMode: "touch", orientation: "landscape" },
      use: {
        ...iphone13,
        browserName: "chromium",
        viewport: { width: 844, height: 390 },
        screen: { width: 844, height: 390 }
      }
    },
    {
      name: "desktop-firefox",
      testMatch: [/slavia-smoke\.spec\.mjs$/, /v71-dig-smoke\.spec\.mjs$/],
      metadata: { inputMode: "desktop", orientation: "landscape" },
      use: {
        ...devices["Desktop Firefox"],
        browserName: "firefox",
        headless: false,
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          firefoxUserPrefs: {
            "webgl.disabled": false,
            "webgl.force-enabled": true
          }
        }
      }
    }
  ],
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
