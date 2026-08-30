# ART_PIPELINE.md — repository-owned V7 art

## Proč tento dokument

`docs/V7_VISUAL_CONTRACT.md` říká, **jak má level vypadat**. Tento dokument říká, **odkud se produkční obrázek bere**.

Platí pravidlo z `AGENTS.md` a `docs/PROJECT_CONTROL.md`: produkční autoritou je pouze asset v tomto repozitáři, zapsaný v `assets/manifests/assets.json` s ID, typem, relativní URL, rozměrem, byte budgetem, SHA-256 a `disposeOwner`.

## Autorizovaná grafika

Všechny čtyři terénní pláty (Chlum, Nesměň, Besednice, Slavia) jsou **authored bitmap assety** — ručně dodaná/upravená rastrová grafika uložená přímo v `assets/textures/terrain/`, bez generátoru nebo build kroku. Nic je nereprodukuje ze zdrojového kódu; produkční soubor je jediný zdroj pravdy.

| Soubor | Typ | Rozměr | Lokalita |
|---|---|---|---|
| `assets/textures/terrain/chlum-plate-v7.webp` | lossy WebP | 1600×1200 | Chlum |
| `assets/textures/terrain/nesmen-forest-plate-v7.webp` | lossy WebP | 1500×1200 | Nesměň |
| `assets/textures/terrain/besednice-clay-quarry-v7.webp` | lossy WebP | 1436×1095 | Besednice |
| `assets/textures/terrain/slavia-event-plate-v7.webp` | lossy WebP | 1440×880 | Slavia |

`assets/sprites/foreground/slavia-event-edge-v7.webp` (foreground occlusion, koruny stromů) je stejně tak authored bitmap, samostatný od terénního plátu.

## Souřadnicový kontrakt

Plate je mapován 1:1 na `bounds` levelu z `src/data/levels.js`. Kde plate rozměr odpovídá poměru stran `bounds` (Chlum, Nesměň, Slavia), se nikdy neroztahuje mimo osu; u Besednice je poměr blízký, ne identický, a drobné roztažení je akceptováno.

- Slavia bounds: `1800×1100` světových jednotek, plate `1440×880` px — identický poměr stran (`1800:1100` = `1440:880`).

## Úprava assetu

1. Nahraď produkční `.webp` soubor v `assets/textures/terrain/` novým obrázkem se stejným ID a poměrem stran blízkým `bounds` levelu.
2. Aktualizuj `metrics.bytes` a `sha256` odpovídajícího záznamu v `assets/manifests/assets.json` (spočti sha256 nového souboru).
3. `npm test` — validátor a unit kontrakty ověřují manifest, formát, SHA-256, budget i lifecycle ownership.

## Mrtvé assety

Manifest je zároveň seznam toho, co se stahuje. Validátor proto selže, pokud v něm zůstane asset, na jehož ID se produkční runtime nikdy neodkáže. Referenční snímky, provizorní plate a nepoužité rekvizity do manifestu ani do `sw.js` nepatří; jejich historie zůstává v Gitu.
