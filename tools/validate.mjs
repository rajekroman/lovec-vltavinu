import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolsDir, "..");
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function file(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Chybí soubor: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function existing(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const requiredFiles = [
  "index.html",
  "style.css",
  "game.js",
  "runtime-stability.js",
  "manifest.webmanifest",
  "sw.js",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];
requiredFiles.forEach(relativePath => {
  if (!existing(relativePath)) fail(`Chybí povinný soubor: ${relativePath}`);
});

const html = file("index.html");
const game = file("game.js");
const runtime = file("runtime-stability.js");
const css = file("style.css");
const serviceWorker = file("sw.js");
const manifestText = file("manifest.webmanifest");
const combinedJavaScript = `${game}\n${runtime}`;

const htmlIds = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const htmlIdSet = new Set(htmlIds);
const duplicateIds = [...new Set(htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index))];
if (duplicateIds.length) fail(`Duplicitní HTML ID: ${duplicateIds.join(", ")}`);

const referencedIds = new Set([
  ...[...combinedJavaScript.matchAll(/\$\(["']([^"']+)["']\)/g)].map(match => match[1]),
  ...[...combinedJavaScript.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map(match => match[1])
]);
const missingIds = [...referencedIds].filter(id => !htmlIdSet.has(id)).sort();
if (missingIds.length) fail(`JavaScript odkazuje na chybějící HTML ID: ${missingIds.join(", ")}`);

for (const id of htmlIdSet) {
  if (!css.includes(`#${id}`) && !combinedJavaScript.includes(`$("${id}")`) && !combinedJavaScript.includes(`$('${id}')`) && !combinedJavaScript.includes(`getElementById("${id}")`) && !combinedJavaScript.includes(`getElementById('${id}')`)) {
    warn(`HTML prvek #${id} není explicitně použit v CSS ani JavaScriptu.`);
  }
}

const localScripts = [...html.matchAll(/<script[^>]+src=["']\.\/([^"']+)["']/g)].map(match => match[1]);
for (const relativePath of localScripts) {
  if (!existing(relativePath)) fail(`HTML načítá chybějící skript: ${relativePath}`);
}
if (!localScripts.includes("game.js")) fail("index.html nenačítá game.js.");
if (!localScripts.includes("runtime-stability.js")) fail("index.html nenačítá runtime-stability.js.");

const functionNames = [...game.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]);
const duplicateFunctions = [...new Set(functionNames.filter((name, index) => functionNames.indexOf(name) !== index))];
if (duplicateFunctions.length) fail(`Duplicitní pojmenované funkce: ${duplicateFunctions.join(", ")}`);

let manifest = null;
try {
  manifest = JSON.parse(manifestText);
} catch (error) {
  fail(`Neplatný manifest.webmanifest: ${error.message}`);
}

if (manifest) {
  if (!manifest.name || !manifest.short_name) fail("Manifest musí obsahovat name a short_name.");
  if (!manifest.start_url) fail("Manifest musí obsahovat start_url.");
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    fail("Manifest neobsahuje ikony.");
  } else {
    for (const icon of manifest.icons) {
      const relativePath = String(icon.src || "").replace(/^\.\//, "");
      if (!relativePath || !existing(relativePath)) fail(`Manifest odkazuje na chybějící ikonu: ${icon.src || "(bez src)"}`);
    }
  }
}

const cachedAssets = [...serviceWorker.matchAll(/["']\.\/([^"']*)["']/g)]
  .map(match => match[1])
  .filter(Boolean);
for (const relativePath of cachedAssets) {
  if (!existing(relativePath)) fail(`Service worker cachuje chybějící soubor: ${relativePath}`);
}
for (const relativePath of localScripts) {
  if (!cachedAssets.includes(relativePath)) warn(`Skript ${relativePath} není uveden v offline cache.`);
}

const audioAssets = [...game.matchAll(/["']\.\/(assets\/audio\/[^"']+)["']/g)].map(match => match[1]);
for (const relativePath of new Set(audioAssets)) {
  if (!existing(relativePath)) fail(`Hra odkazuje na chybějící audio: ${relativePath}`);
}

const requiredLevels = ["chlum", "locenice", "nesmen", "besednice", "malse"];
for (const levelId of requiredLevels) {
  if (!new RegExp(`id:\\s*["']${levelId}["']`).test(game)) fail(`Chybí definice levelu: ${levelId}`);
}

const visibleVersion = html.match(/\bv(\d+)\.(\d+)\b/)?.slice(1).join(".");
const saveSchemaVersion = game.match(/SAVE_KEY\s*=\s*["'][^"']*V(\d+)_(\d+)["']/)?.slice(1).join(".");
const cacheVersion = serviceWorker.match(/CACHE\s*=\s*["'][^"']*v(\d+)-(\d+)["']/)?.slice(1).join(".");
const runtimeVersion = runtime.match(/version:\s*["'](\d+)\.(\d+)(?:\.\d+)?["']/)?.slice(1).join(".");

if (!visibleVersion) fail("V UI není rozpoznána verze vydání.");
if (!cacheVersion) fail("V service workeru není rozpoznána verze cache.");
if (!runtimeVersion) fail("V runtime-stability.js není rozpoznána verze runtime.");
if (visibleVersion && cacheVersion && visibleVersion !== cacheVersion) {
  fail(`Nesoulad release a cache verze: UI=${visibleVersion}, CACHE=${cacheVersion}`);
}
if (visibleVersion && runtimeVersion && visibleVersion !== runtimeVersion) {
  fail(`Nesoulad release a runtime verze: UI=${visibleVersion}, RUNTIME=${runtimeVersion}`);
}
if (visibleVersion && saveSchemaVersion && visibleVersion !== saveSchemaVersion) {
  warn(`Save schéma ${saveSchemaVersion} zůstává kompatibilní se stabilizačním vydáním ${visibleVersion}.`);
}

if (!/requestAnimationFrame\s*\(loop\)/.test(game)) fail("Chybí spuštění hlavního requestAnimationFrame loopu.");
if (!/Math\.min\(\.035,/.test(game)) warn("Update loop nemá rozpoznaný limit delta time 35 ms.");
if (!/visibilitychange/.test(combinedJavaScript)) warn("Chybí obsluha visibilitychange pro mobilní pauzu.");
if (!/orientationchange/.test(combinedJavaScript)) warn("Chybí obsluha orientationchange.");
if (!/unhandledrejection/.test(runtime)) warn("Stabilizační runtime nezachytává odmítnuté Promise.");

console.log(`Kontrolováno HTML ID: ${htmlIds.length}`);
console.log(`Kontrolováno JS DOM referencí: ${referencedIds.size}`);
console.log(`Kontrolováno lokálních skriptů: ${localScripts.length}`);
console.log(`Kontrolováno cache assetů: ${cachedAssets.length}`);
console.log(`Kontrolováno audio assetů: ${new Set(audioAssets).size}`);
console.log(`Rozpoznaná release verze: ${visibleVersion || cacheVersion || runtimeVersion || "neuvedena"}`);
console.log(`Rozpoznané save schéma: ${saveSchemaVersion || "neuvedeno"}`);

for (const message of warnings) console.warn(`VAROVÁNÍ: ${message}`);
for (const message of errors) console.error(`CHYBA: ${message}`);

if (errors.length) {
  console.error(`\nValidace selhala: ${errors.length} chyba/chyby, ${warnings.length} varování.`);
  process.exit(1);
}

console.log(`\nValidace úspěšná: 0 chyb, ${warnings.length} varování.`);
