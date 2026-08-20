# ART_PIPELINE.md — repository-owned V7 art

## Proč tento dokument

`docs/V7_VISUAL_CONTRACT.md` říká, **jak má level vypadat**. Tento dokument říká, **odkud se produkční obrázek bere** a jak ho lze reprodukovat bez externího nástroje, účtu nebo expirujícího odkazu.

Platí pravidlo z `AGENTS.md` a `docs/PROJECT_CONTROL.md`: produkční autoritou je pouze asset v tomto repozitáři, zapsaný v `assets/manifests/assets.json` s ID, typem, relativní URL, rozměrem, byte budgetem, SHA-256 a `disposeOwner`.

## Generátor Slavia V7

```bash
node tools/art/build-slavia-v7-art.mjs
```

Vytvoří dva soubory:

| Soubor | Typ | Rozměr | Role |
|---|---|---|---|
| `assets/textures/terrain/slavia-event-plate-v7.webp` | lossy WebP | 1440×880 | authored terrain plate celé lokality |
| `assets/sprites/foreground/slavia-event-edge-v7.webp` | lossy+alpha WebP | 1440×880 | foreground occlusion (koruny stromů, girlandy) |

Vlastnosti:

- **deterministický** — stejný commit vyprodukuje bajtově shodné soubory, takže SHA-256 v manifestu je ověřitelný (`npm run test:unit` to kontroluje v `tests/unit/slavia-production-contract.test.mjs`);
- **bez závislostí** — vlastní softwarový rasterizér a PNG enkodér v `tools/art/raster.mjs`, žádný nativní modul, žádné stahování;
- **build-time only** — `tools/` není součástí runtime grafu z `src/bootstrap.js` ani offline cache gameplay kódu;
- **WebP konverze** — po vygenerování PNG se výstup převede na WebP pomocí `cwebp -q 92 -m 6` (opaque) nebo `cwebp -q 92 -m 6 -alpha_q 95` (transparent). Vyžaduje systémový balíček `webp` (`apt install webp` / `brew install webp`). Manifest pak odkazuje na `.webp` soubory.

## Souřadnicový kontrakt

Plate je mapován 1:1 na `bounds` levelu z `src/data/levels.js`.

- Slavia bounds: `1800×1100` světových jednotek, plate `1440×880` px, měřítko `0.8 px / jednotka`, tedy **identický poměr stran** — plate se nikdy neroztahuje mimo osu.
- Převod: `ix = wx * 0.8`, `iy = (1100 − wy) * 0.8` (světové `+Y` míří nahoru, obrázkové `+Y` dolů).
- Kanonické cíle (Václavův protějšek zde: dokumenty, Eva, Franta, vstup do KD) mají v generátoru vyhrazené `CLEAR_ZONES`; žádná malovaná rekvizita se do nich nesmí dostat, aby povinný cíl nikdy nezmizel za grafikou.
- Výška rekvizit roste v obrázku **nahoru** od bodu dosedu, stejně jako sprity herců.

## Přidání nebo úprava assetu

1. Uprav generátor (`tools/art/*.mjs`) — ne binárku.
2. Spusť generátor.
3. Převeď výstup na WebP: `cwebp -q 92 -m 6 input.png -o output.webp` (pro alpha: přidej `-alpha_q 95`).
4. Aktualizuj `assets/manifests/assets.json`: `url` (`.webp`), `metrics.bytes`, `budget.bytes`, `dimensions`, `sha256`.
5. Přidej cestu do `sw.js` (`CORE`), jinak validátor selže.
6. `npm test` — validátor kontroluje RIFF/WEBP signaturu, byte budget; unit testy kontrolují SHA-256 a lifecycle ownership.

## Mrtvé assety

Manifest je zároveň seznam toho, co se stahuje. Validátor proto selže, pokud v něm zůstane asset,
na jehož ID se neodkazuje žádný modul dosažitelný z `src/bootstrap.js`. Referenční snímky,
provizorní plate a nepoužité rekvizity do manifestu ani do `sw.js` nepatří; jejich historie zůstává v Gitu.

## Známé omezení

Plate Slavie je **procedurálně malovaný** stylizovaný diorama-art, ne fotorealistická malba jako Chlum/Nesměň/Besednice. Kompozice, měřítko postav, hloubka a čitelnost cílů odpovídají vizuálnímu kontraktu; malířská věrnost je nižší. Výměna za ručně/externě autorovanou malbu je možná bez zásahu do runtime: stačí zachovat ID `terrain-slavia-event-plate-v7`, poměr stran `1800:1100` a aktualizovat manifest.
