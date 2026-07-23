# Řízení a integrace projektu

> Stav k 23. 7. 2026 po merge Nesměň issue #47 / PR #50 a rezervaci Besednice issue #51. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Aktuální publikovatelný základ je `main@8905a0da77d4bd906ca3b1202aa3fcf35421e17c`, squash merge PR #50.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`; aktivním runtime je Three.js verze 6.0 s jedním `WebGLRenderer`, jednou ortografickou kamerou, jedním loopem a jednou session.
- Kanonické levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód jsou zmrazené historické soubory a produkční bootstrap je nesmí importovat.
- Issue #29 / PR #33 je dokončeno a sloučeno: Chlum je produkčně průchozí od PLAY po `level:complete` s `nextLevelId: "nesmen"`.
- Issue #40 / PR #43 je dokončeno a sloučeno: HUD, safe-area a input lifecycle jsou stabilizované.
- Issue #38 / PR #44 je dokončeno a sloučeno: mobilní E2E je rozdělené a deterministické.
- Issue #42 / PR #45 je dokončeno a sloučeno: standardní lokální Three.js `GLTFLoader` revision 185, manifest-driven preload, zachování `entry.type` a bezpečné dispose vlastnictví jsou produkční kontrakt.
- Issue #47 / PR #50 je dokončeno a sloučeno jako `main@8905a0da77d4bd906ca3b1202aa3fcf35421e17c`: Nesměň je produkčně průchozí z dokončeného Chlumu po `level:complete` s `nextLevelId: "besednice"`.
- Finální workflow PR #50 `Validate game` #508 prošel: statický validátor, 100/100 unit testů a mobilní browser smoke jsou zelené.
- Playwright artifact `8543839126` obsahuje produkční průchod Chlum → Nesměň a portrait/landscape vizuální důkaz.
- Issue #51 je samostatná rezervace Besednice vertical slice. Implementace smí začít až po merge této governance aktualizace.
- Slavia vertical slice zůstává blokován do merge issue #51 a další koordinační aktualizace tohoto dokumentu.

## Rozhodnutí, která se znovu neotevírají

| Oblast | Závazné rozhodnutí |
|---|---|
| Rendering | Three.js/WebGL, právě jeden renderer, ortografická kamera |
| Produkční vstup | jediný `src/bootstrap.js`; žádný druhý gameplay runtime |
| Vizuální skladba | 2D transparentní sprity + low-poly GLB |
| UI | HTML/CSS overlay, žádné herní DOM elementy uvnitř ECS komponent |
| Architektura | ES moduly, scene manager, asset loader, input manager, ECS-lite, kolize, animace |
| Simulace | fixed timestep 60 Hz, max delta 100 ms, max 5 substepů, interpolovaný render |
| Ovládání | směrový vstup + jedno kontextové tlačítko `AKCE` |
| Kopání | přesně tři zásahy do rytmu; dig eventy literal `3` striktně validují |
| Nálezy | session skóre/kolekce bez inventářového UI; ID pole je `findingId` |
| Persistence | žádný nový save systém ani migrace; PLAY zahajuje čistou session |
| Nasazení | relativní cesty a GitHub Pages; `main` musí zůstat spustitelný |
| GLTF runtime | lokálně připnutý standardní Three.js `GLTFLoader` revision 185; žádný remote CDN loader |
| Asset preload | řízen manifestem a `level.assetGroups`; původní `entry.type` se nesmí za běhu přepisovat |
| Asset vlastnictví | cached source a každá modelová instance mají oddělené dispose vlastnictví |
| Dokončené levely | Chlum a Nesměň se mění pouze regresním fixem nebo nezbytným přechodem do dalšího levelu |

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | **Dokončeno a uzavřeno** | Pouze regresní ochrana | Nevracet input opravy do paralelní větve |
| CI a validace #2 / mobilní QA #38 | **Dokončeno pro Chlum a Nesměň** | Testy issue #51 | Zelený unit, validátor a mobilní browser smoke na finálním headu |
| Architektura #3 / asset runtime #42 | **Dokončeno a uzavřeno** | Pouze regresní ochrana loaderu, preloadu a dispose | Žádný ad-hoc loader ani ruční asset seznam |
| Gameplay/data #47 | **Dokončeno a uzavřeno** | Pouze regresní ochrana Nesměně | Neměnit quest nebo balance bez samostatného issue |
| Gameplay/data #51 | **Rezervováno; aktivace tímto governance PR** | Kompletní Besednice vertical slice | Jeden draft PR, produkční přechod z Nesměně, zelené E2E |
| Grafika/asset pipeline | **Aktivní pouze v rámci #51 po merge governance PR** | Besednice asset pack | Manifest ID, typ, preload, budget a dispose vlastník |
| UI/mobil #40 | **Dokončeno a uzavřeno** | Pouze nezbytný adaptér a regresní ochrana | Bez nové UI architektury |
| Audio/výkon #6 | Neaktivní samostatná etapa | Pouze úzce nutné Besednice podklady po přidělení | Žádný audio redesign v #51 |
| QA/release #7 | **Podpora issue #51 po aktivaci** | Unit, statické a mobilní E2E | Portrait, landscape, pause/resume, background a nezamrzlý input |
| Chlum vertical slice #29 / PR #33 | **Dokončeno a sloučeno** | Pouze regresní ochrana | Neměnit questy nebo balance bez samostatného issue |
| Nesměň vertical slice #47 / PR #50 | **Dokončeno a sloučeno** | Pouze regresní ochrana | Produkční průchod musí zůstat zelený |
| Besednice vertical slice #51 | **Rezervováno; implementace blokována do merge tohoto PR** | `agent/besednice-vertical-slice` | Branch point je merge commit tohoto governance PR |
| Slavia vertical slice | **Blokováno** | Žádný branch ani PR | Povolit až po merge #51 a další governance aktualizaci |
| Master #8 | Aktivní | Udržovat pořadí, rozhodnutí a blokace PR | Žádný paralelní release mimo frontu |

## Integrační fronta

### 1. Řídicí kontrakt — dokončeno

`AGENTS.md`, `ARCHITECTURE_CONTRACT.md`, `PROJECT_CONTROL.md` a PR šablona jsou závazné. Každá implementační větev vzniká z aktuálního `main` a končí jedním draft PR.

### 2. Sanace datového rozsahu — dokončeno

- `LEVEL_ORDER = ["chlum", "nesmen", "besednice", "slavia"]`;
- session-only `GameSession` žije pouze v paměti;
- nálezy používají `findingId` a automaticky zvyšují score;
- žádná inventářová správa, persistence, migrace ani nový renderer.

### 3. Produkční bootstrap — dokončeno

- jediný `src/bootstrap.js` a jeden ortografický `WebGLRenderer`;
- fixed-step 60 Hz, max delta 100 ms, max 5 substepů;
- fixed updates neběží během async transition;
- PLAY resetuje session;
- dig eventy přijímají literal `3`.

### 4. Chlum vertical slice — dokončeno

Issue #29 bylo uzavřeno po merge PR #33. Produkční tok je:

`PLAY → briefing → Václav → jedna AKCE → povolení → naleziště → přesně tři zásahy → jeden finding → vyhnutí se traktoru → výsledek Chlumu → level:complete(nextLevelId: "nesmen")`

### 4a. UI/mobil hardening — dokončeno

Issue #40 bylo uzavřeno po merge PR #43. Doložené jsou HUD revision, ARIA kontrakty, safe-area, pointer ownership, lifecycle release a nativní aktivace overlay tlačítek.

### 4b. Mobilní E2E stabilita — dokončeno

Issue #38 bylo uzavřeno po merge PR #44. Produkční browserový input je testovaný bez teleportu nebo přímé změny transformace a portrait/landscape důkaz je zachovaný.

### 4c. Asset runtime hardening — dokončeno

Issue #42 bylo uzavřeno po merge PR #45. Produkční kontrakt zahrnuje lokální `GLTFLoader` r185, manifest-driven preload, původní `entry.type`, oddělené dispose vlastnictví a kanonický `asset:load:error`.

### 5. Nesměň vertical slice — dokončeno

Issue #47 bylo uzavřeno po merge PR #50 jako `main@8905a0da77d4bd906ca3b1202aa3fcf35421e17c`.

Produkční tok:

`dokončený Chlum → briefing Nesměň → lesník Jan → jedna AKCE → povolení → profil 1: tři zásahy + finding + zahrnutí → profil 2: tři zásahy + zahrnutí → profil 3: tři zásahy + zahrnutí → výsledek → level:complete(nextLevelId: "besednice")`

Doložené vlastnosti:

1. přesně tři dosažitelné profily;
2. právě jedna otevřená díra a povinné zahrnutí před dalším profilem;
3. každé kopání vyžaduje přesně tři úspěšné zásahy;
4. finding používá `findingId`, zapisuje se právě jednou a zvyšuje stejné session score;
5. manifest-driven preload `assetGroups: ["common", "level:nesmen"]`;
6. šest Nesměň assetů s budgety, SHA-256 a dispose vlastníkem;
7. pohybová sprite animace a opravené uvolnění fokusu po minihře;
8. workflow #508 je celé zelené, 100/100 unit, portrait a landscape důkaz.

### 6. Besednice vertical slice — rezervováno issue #51

Kanonický balík je issue #51.

- **Vlastník:** Gameplay/data.
- **Povinná větev:** `agent/besednice-vertical-slice`.
- **Branch point:** přesně squash merge commit tohoto governance PR; větev nesmí vzniknout před jeho merge.
- **Výstup:** jeden samostatný draft PR s úplným HANDOFFem.
- **Zakázáno:** Slavia implementace, druhý renderer/kamera/loop/session/loader, ruční asset seznamy, persistence, inventář nebo změna dokončeného Chlum/Nesměň obsahu mimo nezbytný přechod.

Kanonický průchod:

`dokončená Nesměň → briefing Besednice → objevit 3 stopy → odemknout ježkový profil → přesně tři zásahy → získat ježkový finding → aktivovat rivala Karla → získat ježek zpět → výsledek → level:complete(nextLevelId: "slavia")`

Povinné výstupy:

1. produkční přechod z dokončené Nesměně bez debug URL;
2. přesně tři dosažitelné stopy a každá započtená právě jednou;
3. ježkový profil uzamčený do objevení všech tří stop;
4. kopání vyžaduje literal tři úspěšné zásahy;
5. ježkový finding používá stabilní `findingId`, zapíše se právě jednou a zvýší session score;
6. po získání nálezu se aktivuje kanonický rival Karel a recovery/boss fáze;
7. dokončení vyžaduje `clues >= 3`, `hedgehog`, `bossStarted` a `bossDefeated`;
8. manifest-driven preload přes `assetGroups: ["common", "level:besednice"]`;
9. všechny assety mají ID, typ, relativní URL, preload, budget a dispose vlastníka;
10. `level:complete` emituje `nextLevelId: "slavia"`, ale Slavia se neimplementuje ani neregistruje;
11. unit, validátor a skutečný mobilní E2E pokrývají celý tok Chlum → Nesměň → Besednice, portrait/landscape, pause/resume, background návrat a input release;
12. PR obsahuje asset budget tabulku, testy, vizuální důkaz a potvrzení rozsahových zákazů.

## Aktivační pravidlo dalšího levelu

Implementace issue #51 smí začít teprve po:

1. merge tohoto governance PR;
2. vytvoření `agent/besednice-vertical-slice` přesně z výsledného merge commitu;
3. zapsání konkrétního branch-point SHA do issue #51.

Slavia vertical slice smí být aktivován teprve po:

1. merge issue #51 / Besednice PR;
2. zeleném finálním workflow;
3. koordinační aktualizaci tohoto dokumentu s novým branch pointem a samostatným issue/PR kontraktem.
