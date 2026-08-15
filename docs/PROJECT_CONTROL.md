# PROJECT_CONTROL.md — aktuální V7 řídicí registr

Revize: **2.17.1 · 15. 8. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr aktuální práce. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`. Historická release evidence a nepohyblivé tagy zůstávají auditovatelné v Git historii, uzavřených issues/PR a GitHub Releases a touto revizí se zpětně nepřepisují.

## 1. Aktuální ověřená realita

- Jediná publikovatelná větev je `main`.
- Governance base/provenance této revize je `main@53715811443eff26653007b1b9fcbfe57721e8f4`, vzniklý merge PR #210. Tento SHA je auditní základ revize 2.17.1, nikoli samo-referenční požadavek, aby po merge tohoto governance PR zůstal HEAD `main` beze změny.
- Runtime/release obsah na tomto governance základu zachovává ověřený produkční strom v6.3; governance-only commity nemění runtime a nový V7 release vznikne až po samostatné schválené release gate.
- Aktuální veřejný release `v6.3.0` existuje samostatně a jeho release target je `f16d5e2aaf7c47752de4c6e6f903924d485837c3`.
- Produkční runtime zachovává jeden Three.js `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden `InputManager`, jeden manifest-driven `AssetLoader` a jednu in-memory `GameSession`.
- Kanonické levely zůstávají přesně `chlum → nesmen → besednice → slavia`.
- Schválený produktový cíl je issue **#207 — V7 visual rebuild**.
- První a jediný aktivní V7 milestone je **Chlum visual vertical slice**.
- Autoritativní implementační větev je **PR #208 / `v7/visual-rebuild`**, původně založená z `main@6c30c05467d2faaa31b1c2d550799cb0a4071622`.
- Governance synchronizace **#209 / PR #210 je COMPLETED / MERGED**; nový A0 refresh aktuálního checkpointu vlastní **#211 / `agent/v7-governance-refresh`**.
- Nesměň, Besednice a Slavia jsou pro V7 vizuální přestavbu **FROZEN**, dokud A0 výslovně neschválí hotový Chlum baseline.

## 2. Neměnné architektonické a produktové invarianty

| Oblast | Závazné rozhodnutí |
|---|---|
| Repozitář | pouze `rajekroman/lovec-vltavinu` |
| Produkční větev | pouze `main` |
| Runtime | ES moduly + Three.js |
| Renderer | právě jeden `WebGLRenderer` |
| Kamera | právě jedna `OrthographicCamera` spravovaná renderer vrstvou |
| Simulace | jeden fixed-step loop, 60 Hz, max delta 100 ms, max 5 substepů |
| Session | jedna in-memory `GameSession` |
| Produkční vstup | pouze `src/bootstrap.js` |
| Assety | pouze manifest-driven preload z `assets/manifests/assets.json` |
| UI | HTML/CSS overlay, není autoritou gameplay stavu |
| Levely | Chlum → Nesměň → Besednice → Slavia |
| Ovládání | směrový vstup + jedno kontextové tlačítko `AKCE` |
| Chlum | povrchové hledání/radar, bez kopacího modalu |
| Nesměň | rytmické kopání, přesně 3 úspěšné zásahy |
| Persistence | žádný nový save systém ani localStorage gameplay stav |
| Inventář | žádné inventářové UI ani správa předmětů |
| Legacy | žádný návrat Canvas gameplay runtime, `game.js`, `runtime-stability.js` ani legacy save cesty |
| Release | nový tag/release pouze ze schváleného `main` po samostatné QA/release gate |

Porušení kteréhokoli bodu je blocker.

## 3. Aktuální pracovní proudy

| Role / balík | Stav | Povolená akce |
|---|---|---|
| A0 koordinace | **#211 ACTIVE** | governance refresh, review #208, evidence a rozhodnutí o Chlum gate |
| V7 Chlum #207 / PR #208 | **ACTIVE / DRAFT** | pouze Chlum vertical slice podle §4–§7 |
| A1 architektura | **STANDBY** | žádná samostatná větev; pouze již autorizované malé změny uvnitř #208 |
| A2 gameplay/data | **STANDBY** | gameplay flow Chlumu se nesmí redesignovat; jen kompatibilní vazba V7 scény v #208 |
| A3 grafika/assety | **SINGLE-STREAM #208** | pouze produkční Chlum terrain/actor/occlusion assety v autoritativním PR #208 |
| A4 UI/mobil | **SINGLE-STREAM #208** | pouze V7 Chlum HUD/composition v autoritativním PR #208 |
| A5 audio/výkon | **STANDBY** | bez změny audia; výkon pouze regresně sledovat |
| A6 QA | **SUPPORT #208** | validátor, unit, desktop + iPhone portrait/landscape a vizuální evidence |
| A7 release | **BLOCKED** | žádný V7 release před schválením všech čtyř levelů a samostatnou release gate |
| V7 Nesměň | **FROZEN** | bez implementace do schválení Chlumu |
| V7 Besednice | **FROZEN** | bez implementace do schválení Chlumu |
| V7 Slavia | **FROZEN** | bez implementace do schválení Chlumu |

Issue #207 výslovně zakazuje návrat k osmi paralelním neslučitelným implementacím. Proto je PR #208 jediný autoritativní integrační proud pro první V7 vertical slice a role A1/A3/A4/A6 do něj dodávají pouze izolované změny bez vlastních konkurenčních finálních větví.

## 4. Přidělený rozsah #207 / PR #208 — pouze Chlum

### 4.1 Cíl

Předělat Chlum do referenčního stylu detailní jihočeské 2.5D/3D diorámy při zachování současného Three.js/WebGL/ortografického runtime a existujícího gameplay flow:

```text
Václav
→ povolení
→ povrchové hledání / radar
→ odhalení nálezu
→ sebrání
→ dokončení Chlumu
→ existující přechod do Nesměně
```

### 4.2 Povolené oblasti

PR #208 smí měnit pouze to, co je nutné pro tento Chlum vertical slice:

- `docs/V7_VISUAL_CONTRACT.md`;
- `src/render/CameraBounds.js`;
- `src/render/HybridRenderer.js` v rozsahu terrain plate / foreground layer adaptace bez druhého rendereru;
- `src/systems/AnimationSystem.js` v rozsahu zpětně kompatibilních directional/action clipů;
- `src/scenes/ChlumV7Scene.js`;
- nezbytnou kompatibilní Chlum registraci v `src/bootstrap.js`;
- Chlum-only data vazby v `src/data/chlum.js` bez změny objective pravidel;
- `v7.css` a pouze Chlum-scoped HUD styling;
- `assets/manifests/assets.json` pouze pro Chlum V7 assety;
- Chlum terrain assety pod `assets/textures/terrain/`;
- hunter V7 atlas/sprite assety pod `assets/sprites/player/`;
- Václav V7 assety pod `assets/sprites/npcs/`;
- existující Chlum modely/occlusion assety pouze pokud jsou nutné pro vizuální integraci;
- `sw.js` pouze pro cache nových lokálních runtime URL;
- `tools/validate.mjs` pouze pro validaci explicitně autorizovaných Chlum V7 asset metadat;
- cílené unit/contract testy a existující full-flow Playwright test jako regresní důkaz.

Aktuální změněné soubory PR #208 na headu `c94af7eab1dac338efded9b794c073aaba17a77d` jsou evidovány jako:

- `assets/manifests/assets.json`;
- `assets/sprites/npcs/farmer-vaclav-v7.png`;
- `assets/textures/terrain/chlum-plate-v7.png`;
- `assets/textures/terrain/chlum-plate-v7.svg`;
- `docs/V7_VISUAL_CONTRACT.md`;
- `src/bootstrap.js`;
- `src/data/chlum.js`;
- `src/render/CameraBounds.js`;
- `src/render/HybridRenderer.js`;
- `src/scenes/ChlumV7Scene.js`;
- `src/systems/AnimationSystem.js`;
- `sw.js`;
- `tests/slavia-smoke.spec.mjs`;
- `tests/unit/animation-direction.test.mjs`;
- `tests/unit/besednice-production-contract.test.mjs`;
- `tests/unit/camera-bounds.test.mjs`;
- `tests/unit/character-visual-contract.test.mjs`;
- `tests/unit/chlum-assets.test.mjs`;
- `tests/unit/terrain-plate.test.mjs`;
- `tools/validate.mjs`;
- `v7.css`.

Další cesta je povolena jen tehdy, pokud je přímo Chlum-only a A0 ji před změnou zapíše do #207 nebo #208.

### 4.3 Zakázané oblasti

- žádný V7 redesign `NesmenScene`, `BesedniceScene` nebo `SlaviaScene`;
- žádné nové Nesměň/Besednice/Slavia production assety v tomto PR;
- žádná změna pořadí levelů;
- žádný nový quest, pátý level, inventář, save, persistence nebo import/export;
- žádný druhý renderer, Canvas runtime, paralelní kamera, paralelní loop nebo druhá session;
- žádná změna event payloadů bez samostatného architektonického issue;
- žádný release/tag/Pages release z PR #208;
- žádné vydávání placeholderu nebo provizorního generovaného assetu za finální produkční art.

## 5. V7 Chlum vizuální kontrakt

Chlum musí splnit všechny následující body:

1. hlavní vzhled mapy tvoří jedna nebo několik autorsky komponovaných **nerepetitivních terrain plate** vrstev; opakovaná textura nesmí být hlavní vizuál;
2. kamera kontinuálně sleduje hráče, používá dead-zone/damping a nikdy neukáže prostor mimo bounds;
3. desktop, iPhone portrait a iPhone landscape používají stejný world scale a pouze kompoziční tuning;
4. hráč a Václav mají konzistentní perspektivu, světlo, měřítko a materiálový styl s prostředím;
5. minimálně `idle` a `walk` jsou čitelné; produkční gate navíc vyžaduje reálné action art pro `search/look-down`, `pick-up`, `dig`, `talk/interact`, `caught/hit` a krátkou finding/celebration reakci, pokud jsou v Chlumu použity;
6. traktor je čitelný pohybující se hazard a vizuálně sedí do brázd;
7. foreground/occlusion prvky mohou hráče částečně překrývat a vytvářejí hloubku;
8. HUD je kompaktní, Chlum-scoped a neblokuje klíčové herní prvky;
9. Chlum gameplay flow zůstává funkční a dosažitelný bez debug URL nebo konzole;
10. pozdější levely zůstávají funkčně regresně zelené, ale jejich V7 vizuál se v tomto milestone nemění.

## 6. Aktuální checkpoint #208

Autoritativní technický checkpoint této governance revize:

- head: `c94af7eab1dac338efded9b794c073aaba17a77d`;
- PR #208: **OPEN / DRAFT / MERGEABLE**;
- workflow `31900365409` / run #1413: **SUCCESS**;
- validator: **0 errors / 0 warnings**;
- JavaScript syntax validation: **PASS**;
- unit suite: **209/209 PASS**;
- Playwright matrix: **6/6 PASS**;
- desktop Chromium full four-level flow: **PASS**;
- iPhone portrait real-touch input/lifecycle: **PASS**;
- iPhone portrait full four-level flow: **PASS**;
- iPhone landscape full four-level flow: **PASS**;
- statický artifact: `9250904902`, digest `sha256:d58e7acb67028f45890c312e0cb9a71980ac8b81feb0d2a45aaacef7b6aa5360`;
- Playwright artifact: `9251041281`, digest `sha256:b304ae60a245efcd5decfac7b912d996cb2bbc96081d35ffba323379792ad4cb`.

### Produkční asset checkpoint

- `assets/textures/terrain/chlum-plate-v7.png` je repository-owned raster terrain plate 1600×1200, 3,717,520 bytes, manifest budget 4,000,000 bytes, textureMax 2048, SHA-256 `1937dc52adafdb49b51779988bd33316cbe1311582a1105cf69d7ff8e13c3fda`;
- `assets/sprites/npcs/farmer-vaclav-v7.png` je transparentní bitmap 384×512, 166,177 bytes, manifest budget 200,000 bytes, textureMax 512, SHA-256 `837759db87c4e0e351ce0b7904cd1aacb57ec5c21aff5296f54940ba563a33e8`;
- oba assety mají manifest ID, relativní lokální URL a `LevelScene:chlum` dispose ownership;
- hlavní repeat-pattern blocker terrain plate je odstraněn;
- Václav už není plochý SVG placeholder vedle realističtějšího hunteru.

### Vizuální verdict

**ČÁSTEČNĚ SCHVÁLENO / CELÝ CHLUM JEŠTĚ NENÍ APPROVED.** Technická zelená gate neznamená splnění celé V7 art gate.

Terrain plate, základní Chlum kompozice a produkční Václav checkpoint prošly screenshot review na desktopu, iPhone portrait a iPhone landscape. PR #208 však musí zůstat **DRAFT**, protože ještě chybí úplná produkční action-art sada hunteru, finální vizuální integrace traktoru a finální foreground/occlusion obsah. Tyto body jsou explicitní blocker před A0 visual approval.

## 7. Povinná dokončovací brána PR #208

Před změnou PR #208 na ready musí existovat na jednom exact headu:

1. repository-owned produkční Chlum terrain plate jako stabilní lokální raster asset, bez expirované remote URL — **SPLNĚNO na `c94af7ea…`**;
2. manifestový záznam s unikátním ID, relativní URL, rozměrem, byte budgetem, SHA-256 a `disposeOwner` — **SPLNĚNO pro terrain a Václava**;
3. produkční hunter art v konzistentní perspektivě a měřítku — **ROZPRACOVÁNO / gate neuzavřena**;
4. produkční Václav art ve stejném vizuálním jazyce — **SPLNĚNO na `c94af7ea…`**;
5. skutečné action frames/clipy podle §5.5, nikoli pouze programová změna názvu klipu nad stejným placeholder framem — **BLOCKER**;
6. přirozeně integrovaný traktor a foreground/occlusion — **BLOCKER**;
7. bez viditelného repeat patternu, tile seams nebo generické plochy — **terrain checkpoint PASS**;
8. bez prázdného/černého prostoru mimo herní kompozici v desktopu ani mobilu — **checkpoint PASS**;
9. validátor `0 chyb / 0 varování` — **PASS na run #1413**;
10. kompletní unit suite PASS — **209/209 PASS**;
11. Playwright full-flow PASS na desktopu, iPhone portrait a iPhone landscape — **6/6 PASS**;
12. vizuální screenshot evidence minimálně pro Chlum na `1280×720`, `390×844` a `844×390` — **checkpoint evidence PASS**;
13. A0 vizuální review = **PENDING po final hunter/tractor/foreground headu**;
14. až potom ready-for-review a případný merge.

Automatický merge feature PR je zakázán.

## 8. Integrační pořadí V7

```text
#209 / PR #210 governance sync — COMPLETED
→ #211 governance checkpoint refresh
→ dokončit a vizuálně schválit Chlum v #207 / PR #208
→ A0 review + případný merge #208
→ zaznamenat přesný feature merge SHA jako nový V7 Chlum integration checkpoint (bez samo-referenčního požadavku na governance HEAD)
→ samostatný V7 Nesměň issue/PR
→ vizuální approval Nesměně
→ samostatný V7 Besednice issue/PR
→ vizuální approval Besednice
→ samostatný V7 Slavia issue/PR
→ celoproduktový QA
→ samostatná release issue / candidate SHA / dvě zelené gate
→ release pouze z main
```

Žádný další level nesmí přeskočit Chlum approval.

## 9. Historická release identita — neměnit

| Release | Stav / známý target |
|---|---|
| `v6.0.0` | historicky certifikovaný release; target `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9` |
| `v6.1.0` | historický release po sjednocení grafiky; merge SHA `745109103722646b69ad5b514d66f9882662ecb9` |
| `v6.2.0` | historický release prostředí; merge SHA `0175ff8483b24de73e835d005cb60d1338c0a491` |
| `v6.3.0` | aktuální pre-V7 release; GitHub Release target `f16d5e2aaf7c47752de4c6e6f903924d485837c3` |

V7 práce nesmí retagovat žádný z těchto tagů ani zpětně měnit jejich release evidence.

## 10. Povinné reportování pracovního chatu

Před změnou musí chat uvést:

```text
Identifikátor úkolu:
Role:
Přidělená oblast:
Načtené revize AGENTS / PROJECT_CONTROL / ARCHITECTURE_CONTRACT:
Base SHA:
Větev:
Závislosti:
Možné konflikty:
```

Po změně musí dodat:

```text
HANDOFF
Dokončený úkol:
Issue / PR / větev:
Base SHA / head SHA:
Vytvořené nebo změněné soubory:
Změněné kontrakty:
Technická rozhodnutí:
Testy a výsledky:
Mobilní důkaz:
Výkon a asset budget:
Známé problémy:
Potvrzení: bez save / inventáře / druhého runtime:
Doporučený následující krok:
```

Označení „hotovo“ je povoleno pouze pro konkrétní ověřitelný výstup.