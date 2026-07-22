import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "public", "assets", "manifest.json");
const distPath = join(root, "dist");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const assetEntries = Object.entries(manifest.assets ?? {});
const bundleEntries = Object.entries(manifest.bundles ?? {});

if (assetEntries.length === 0 || bundleEntries.length === 0) {
  throw new Error("Produkční manifest nemá assety nebo bundly.");
}

const referencedIds = new Set();
for (const [bundleId, assetIds] of bundleEntries) {
  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    throw new Error(`Bundle ${bundleId} je prázdný nebo neplatný.`);
  }

  for (const assetId of assetIds) {
    if (!manifest.assets[assetId]) {
      throw new Error(`Bundle ${bundleId} odkazuje na neznámý asset ${assetId}.`);
    }
    referencedIds.add(assetId);
  }
}

for (const [assetId, definition] of assetEntries) {
  if (!referencedIds.has(assetId)) {
    throw new Error(`Asset ${assetId} není součástí žádného bundlu.`);
  }

  const sourcePath = join(root, "public", definition.url);
  const outputPath = join(distPath, definition.url.replace(/^assets[\\/]/, "assets/"));
  await assertFile(sourcePath, `zdrojový asset ${assetId}`);
  await assertFile(outputPath, `produkční asset ${assetId}`);

  const bytes = await readFile(outputPath);
  if (definition.type === "texture") {
    assertPng(bytes, assetId);
  } else if (definition.type === "gltf") {
    assertGlb(bytes, assetId);
  } else if (definition.type === "json") {
    const parsed = JSON.parse(bytes.toString("utf8"));
    if (parsed.columns !== undefined && (parsed.columns !== 4 || parsed.rows !== 4)) {
      throw new Error(`Atlas ${assetId} nemá očekávanou mřížku 4 × 4.`);
    }
  }
}

const distIndexPath = join(distPath, "index.html");
await assertFile(distIndexPath, "dist/index.html");
const distIndex = await readFile(distIndexPath, "utf8");
if (
  !distIndex.includes("./assets/") ||
  distIndex.includes("/src/main.ts") ||
  !distIndex.includes("./site.webmanifest") ||
  !distIndex.includes("./icon.svg")
) {
  throw new Error("dist/index.html nepoužívá relativní produkční asset cestu.");
}
await assertFile(join(distPath, "site.webmanifest"), "dist/site.webmanifest");
await assertFile(join(distPath, "icon.svg"), "dist/icon.svg");
await assertFile(join(distPath, "sw.js"), "dist/sw.js");
for (const shellAsset of ["assets/app.js", "assets/app.css", "assets/manifest.json"]) {
  await assertFile(join(distPath, shellAsset), `produkční PWA shell ${shellAsset}`);
}

const webManifest = JSON.parse(
  await readFile(join(distPath, "site.webmanifest"), "utf8"),
);
if (webManifest.start_url !== "./" || webManifest.scope !== "./") {
  throw new Error("PWA manifest nemá relativní start_url nebo scope.");
}

const serviceWorker = await readFile(join(distPath, "sw.js"), "utf8");
if (!serviceWorker.includes(`lovec-vltavinu-v${packageJson.version}`)) {
  throw new Error("Service worker nemá aktuální release cache.");
}
for (const shellAsset of ["./assets/app.js", "./assets/app.css", "./assets/manifest.json"]) {
  if (!serviceWorker.includes(`\"${shellAsset}\"`)) {
    throw new Error(`Service worker neprecachuje ${shellAsset}.`);
  }
}
const distAssets = await readdir(join(distPath, "assets"));
const JavaScriptFiles = distAssets.filter((file) => file.endsWith(".js"));
if (JavaScriptFiles.length !== 1) {
  throw new Error(`Produkční dist obsahuje ${JavaScriptFiles.length} JavaScript bundle místo jednoho.`);
}

console.log(
  `Release QA OK: ${assetEntries.length} assetů, ${bundleEntries.length} bundlů, ` +
  `1 produkční JavaScript bundle.`,
);

async function assertFile(path, label) {
  try {
    const info = await stat(path);
    if (!info.isFile() || info.size === 0) {
      throw new Error(`${label} je prázdný.`);
    }
  } catch (error) {
    throw new Error(`${label} chybí: ${path}`, { cause: error });
  }
}

function assertPng(bytes, assetId) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (signature.some((byte, index) => bytes[index] !== byte)) {
    throw new Error(`Texture ${assetId} není platný PNG soubor.`);
  }
}

function assertGlb(bytes, assetId) {
  if (bytes.length < 20 || bytes.toString("ascii", 0, 4) !== "glTF") {
    throw new Error(`Model ${assetId} nemá platnou GLB hlavičku.`);
  }

  const declaredLength = bytes.readUInt32LE(8);
  if (declaredLength !== bytes.length) {
    throw new Error(`Model ${assetId} má nesouhlasnou délku GLB.`);
  }
}
