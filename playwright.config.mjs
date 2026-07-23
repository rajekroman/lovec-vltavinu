import { defineConfig, devices } from "@playwright/test";

const sharedProjectUse = {
  browserName: "chromium"
};

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
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
      testMatch: /desktop-smoke\.spec\.mjs/,
      use: {
        ...sharedProjectUse,
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: "iphone-portrait",
      testMatch: /mobile-smoke\.spec\.mjs/,
      use: {
        ...sharedProjectUse,
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 }
      }
    },
    {
      name: "iphone-landscape",
      testMatch: /landscape-smoke\.spec\.mjs/,
      use: {
        ...sharedProjectUse,
        ...devices["iPhone 13 landscape"],
        viewport: { width: 844, height: 390 }
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