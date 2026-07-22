import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { GAME_EVENT_NAMES } from "../src/core/GameEvents.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const fail = message => errors.push(message);
const warn = message => warnings.push(message);
const absolute = relativePath => path.join(root, relativePath);
const exists = relativePath => fs.existsSync(absolute(relativePath));
const read = relativePath => {
  if (!exists(relativePath)) {
    fail(`Chybí soubor: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolute(relativePath), "utf8");
};

const requiredFiles = [
  "index.html", "style.css", "manifest.webmanifest", "sw.js",
  "icon-180.png", "icon-192.png", "icon-512.png",
  "vendor/three.module.min.js", "src/bootstrap.js"
];
requiredFiles.forEach(relativePath => {
  if (!exists(relativePath)) fail(`Chybí povinný soubor: ${relativePath}`);
});

const html = read("index.html");
const serviceWorker = read("sw.js");
const manifestText = read("manifest.webmanifest");

const htmlIds = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const htmlIdSet = new Set(htmlIds);
const duplicateIds = [...new Set(htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index))];
if (duplicateIds.length) fail(`Duplicitní HTML ID: ${duplicateIds.join(", ")}`);

const scripts = [...html.matchAll(/<script\b([^>]*)src=["']\.\/([^"']+)["'][^>]*>/g)]
  .map(match => ({ attributes: match[1], path: match[2], source: match[0] }));
if (scripts.length !== 1 || scripts[0]?.path !== "src/bootstrap.js" || !/type=["']module["']/.test(scripts[0]?.source ?? "")) {
  fail("index.html musí spouštět právě jeden modulární skript ./src/bootstrap.js.");
}
if (/src=["']\.\/(?:game|runtime-stability)\.js["']/.test(html)) {
  fail("index.html stále spouští legacy gameplay runtime.");
}

const runtimeModules = new Set();
const queue = ["src/bootstrap.js"];
while (queue.length) {
  const relativePath = queue.shift();
  if (runtimeModules.has(relativePath)) continue;
  runtimeModules.add(relativePath);
  const source = read(relativePath);
  const imports = [...source.matchAll(/(?:import|export)\s*(?:[^"']*?\s*from\s*)?["']([^"']+)["']/g)]
    .map(match => match[1]);
  for (const specifier of imports) {
    if (!specifier.startsWith(".")) {
      fail(`Runtime používá nepřipnutý bare import v ${relativePath}: ${specifier}`);
      continue;
    }
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), specifier));
    if (!exists(resolved)) fail(`Modul ${relativePath} importuje chybějící soubor: ${resolved}`);
    else if (resolved.endsWith(".js")) queue.push(resolved);
  }
}

const runtimeSource = [...runtimeModules]
  .filter(relativePath => relativePath.endsWith(".js"))
  .map(relativePath => read(relativePath))
  .join("\n");
if (/LegacySaveAdapter|localStorage|sessionStorage/.test(runtimeSource)) {
  fail("Produkční bootstrap importuje nebo používá zakázanou persistence/save vrstvu.");
}
const rendererConstructors = [...runtimeSource.matchAll(/new\s+THREE\.WebGLRenderer\s*\(/g)].length;
if (rendererConstructors !== 1) fail(`Runtime musí vlastnit právě jeden WebGLRenderer; nalezeno: ${rendererConstructors}.`);

const referencedIds = new Set([
  ...[...runtimeSource.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map(match => match[1]),
  ...[...runtimeSource.matchAll(/\.element\(["']([^"']+)["']\)/g)].map(match => match[1])
]);
const missingIds = [...referencedIds].filter(id => !htmlIdSet.has(id)).sort();
if (missingIds.length) fail(`Runtime odkazuje na chybějící HTML ID: ${missingIds.join(", ")}`);

let manifest = null;
try {
  manifest = JSON.parse(manifestText);
} catch (error) {
  fail(`Neplatný manifest.webmanifest: ${error.message}`);
}
if (manifest) {
  if (!manifest.name || !manifest.short_name || !manifest.start_url) fail("Manifest musí obsahovat name, short_name a start_url.");
  if (!Array.isArray(manifest.icons) || !manifest.icons.length) fail("Manifest neobsahuje ikony.");
  for (const icon of manifest.icons ?? []) {
    const relativePath = String(icon.src ?? "").replace(/^\.\//, "");
    if (!relativePath || !exists(relativePath)) fail(`Manifest odkazuje na chybějící ikonu: ${icon.src ?? "(bez src)"}`);
  }
}

const cachedPaths = new Set(
  [...serviceWorker.matchAll(/["']\.\/([^"']*)["']/g)]
    .map(match => match[1])
    .filter(Boolean)
);
for (const relativePath of cachedPaths) {
  if (!exists(relativePath)) fail(`Service worker cachuje chybějící soubor: ${relativePath}`);
}
for (const relativePath of runtimeModules) {
  if (!cachedPaths.has(relativePath)) fail(`Produkční runtime modul není v offline cache: ${relativePath}`);
}
for (const relativePath of ["index.html", "style.css", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"]) {
  if (!cachedPaths.has(relativePath)) fail(`PWA shell není v offline cache: ${relativePath}`);
}

const visibleVersion = html.match(/\bv(\d+)\.(\d+)\b/)?.slice(1).join(".");
const cacheVersion = serviceWorker.match(/CACHE\s*=\s*["'][^"']*v(\d+)-(\d+)["']/)?.slice(1).join(".");
if (!visibleVersion || !cacheVersion) fail("Nelze určit verzi UI nebo PWA cache.");
else if (visibleVersion !== cacheVersion) fail(`Nesoulad UI a cache verze: ${visibleVersion} vs ${cacheVersion}.`);

const expectedEvents = 33;
if (GAME_EVENT_NAMES.length !== expectedEvents) {
  fail(`Eventový katalog musí mít ${expectedEvents} položek; nalezeno ${GAME_EVENT_NAMES.length}.`);
}
if (!runtimeSource.includes("fixedStep: options.fixedStep ?? 1 / 60")) fail("GameApp nemá rozpoznaný fixed timestep 60 Hz.");
if (!runtimeSource.includes("maxFrameDelta: options.maxFrameDelta ?? 0.1")) fail("GameApp nemá limit frame delta 100 ms.");
if (!runtimeSource.includes("maxSubSteps: options.maxSubSteps ?? 5")) fail("GameApp nemá limit pěti substepů.");

console.log(`Kontrolováno HTML ID: ${htmlIds.length}`);
console.log(`Kontrolováno runtime DOM referencí: ${referencedIds.size}`);
console.log(`Kontrolováno runtime modulů: ${runtimeModules.size}`);
console.log(`Kontrolováno PWA cest: ${cachedPaths.size}`);
console.log(`Kontrolováno eventových kontraktů: ${GAME_EVENT_NAMES.length}`);
console.log(`Rozpoznaná release verze: ${visibleVersion ?? "neuvedena"}`);
for (const message of warnings) console.warn(`VAROVÁNÍ: ${message}`);
for (const message of errors) console.error(`CHYBA: ${message}`);
if (errors.length) {
  console.error(`\nValidace selhala: ${errors.length} chyba/chyby, ${warnings.length} varování.`);
  process.exit(1);
}
console.log(`\nValidace úspěšná: 0 chyb, ${warnings.length} varování.`);
