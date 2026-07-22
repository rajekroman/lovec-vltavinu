import { readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const archiveName = `lovec-vltavinu-release-${packageJson.version}.zip`;
const archivePath = join(root, archiveName);
const webArchiveName = `lovec-vltavinu-web-build-${packageJson.version}.zip`;
const webArchivePath = join(root, webArchiveName);

await rm(archivePath, { force: true });
await rm(webArchivePath, { force: true });

const included = [
  "index.html",
  "README.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "src",
  "tests",
  "scripts",
  "docs",
  "zdroje",
  "public",
  "dist",
];

await run("zip", ["-q", "-r", archiveName, ...included], root);
await run("zip", ["-q", "-r", webArchivePath, "."], join(root, "dist"));
console.log(`Archiv vytvořen: ${archivePath}`);
console.log(`Webový archiv vytvořen: ${webArchivePath}`);

function run(command, args, cwd) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.once("error", rejectPromise);
    child.once("exit", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${command} skončil s kódem ${code ?? "neznámý"}.`));
      }
    });
  });
}
