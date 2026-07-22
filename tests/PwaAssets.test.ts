import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const packageJson = JSON.parse(
  readFileSync(resolve(root, "package.json"), "utf8"),
) as { version: string };

describe("PWA release shell", () => {
  it("defines a relative install scope and a usable app icon", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(root, "public/site.webmanifest"), "utf8"),
    ) as {
      start_url: string;
      scope: string;
      display: string;
      icons: Array<{ src: string; type: string }>;
    };

    expect(manifest).toMatchObject({
      start_url: "./",
      scope: "./",
      display: "fullscreen",
    });
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "./icon.svg", type: "image/svg+xml" }),
    ]));
    expect(readFileSync(resolve(root, "public/icon.svg"), "utf8")).toContain("<svg");
  });

  it("uses a versioned cache and keeps external requests out of the worker", () => {
    const serviceWorker = readFileSync(resolve(root, "public/sw.js"), "utf8");

    expect(serviceWorker).toContain(`const CACHE_NAME = "lovec-vltavinu-v${packageJson.version}"`);
    expect(serviceWorker).toContain("event.request.url.startsWith(self.location.origin)");
    expect(serviceWorker).toContain('event.request.method !== "GET"');
    expect(serviceWorker).toContain("event.waitUntil(cacheResponse(event.request, response))");
    expect(serviceWorker).toContain('"./assets/app.js"');
    expect(serviceWorker).toContain('"./assets/app.css"');
    expect(serviceWorker).toContain('"./assets/manifest.json"');
  });
});
