import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const architecture = readFileSync(
  resolve(projectRoot, "docs/ARCHITECTURE.md"),
  "utf8",
);
const eventContract = readFileSync(
  resolve(projectRoot, "src/core/events/GameEvents.ts"),
  "utf8",
);

describe("architecture documentation", () => {
  it("contains every deliverable required by the architecture brief", () => {
    for (const heading of [
      "## 3. Strom složek",
      "## 4. Odpovědnosti modulů",
      "## 5. Datové struktury",
      "## 6. Eventy mezi moduly",
      "## 7. Doporučený a implementovaný update loop",
    ]) {
      expect(architecture).toContain(heading);
    }
  });

  it("catalogues every typed game event", () => {
    const eventNames = [...eventContract.matchAll(/^\s+"([^"]+)":/gm)]
      .map((match) => match[1]);

    expect(eventNames).toHaveLength(18);
    for (const eventName of eventNames) {
      expect(architecture).toContain(`\`${eventName}\``);
    }
  });

  it("documents the fixed step and bilateral collision filter", () => {
    expect(architecture).toContain("`1/60 s`");
    expect(architecture).toContain("steps < 5");
    expect(architecture).toContain("(source.mask & target.layer) !== 0");
    expect(architecture).toContain("(target.mask & source.layer) !== 0");
  });
});
