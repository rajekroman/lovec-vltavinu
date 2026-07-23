# Řízení a integrace projektu

> Stav k 23. 7. 2026 po merge Nesměň issue #47 / PR #50 a před založením implementační větve Besednice. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Aktuální publikovatelný základ před merge této governance aktualizace je `main@9bda0b56940dfd12ed46daba70916db850709971`.
- Produkční Nesměň runtime byl sloučen z PR #50 jako `8905a0da77d4bd906ca3b1202aa3fcf35421e17c`; finální implementační head byl `7af16b6e2434a72081fe59c41e08aedfc843d6f2`.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`; aktivním runtime je Three.js verze 6.0 s jedním `WebGLRenderer`, jednou ortografickou kamerou, jedním loopem, jedním `AssetLoader` a jednou session.
- Kanonické levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód jsou zmrazené historické soubory a produkční bootstrap je nesmí importovat.
- Issue #29 / PR #33 je dokončeno: Chlum je produkčně průchozí od PLAY po `level:complete` s `nextLevelId: "nesmen"`.
- Issue #40 / PR #43 je dokončeno: HUD, safe-area a input lifecycle jsou stabilizované.
- Issue #38 / PR #44 je dokončeno: mobilní E2E je rozdělené a deterministické.
- Issue #42 / PR #45 je dokončeno: standardní lokální Three.js `GLTFLoader` revision 185, manifest-driven preload, zachování `entry.type` a bezpečné dispose vlastnictví jsou produkční kontrakt.
- Issue #47 / PR #50 je dokončeno a uzavřeno: Nesměň je produkčně dosažitelná z Chlumu a dokončitelná po třech vykopaných a zasypaných profilech.
- Finální workflow PR #50 `Validate game` #508 prošel: statická validace, 100/100 unit testů a mobilní browser smoke jsou zelené.
- Static artifact `8543743528` skončil s 0 chybami a 0 varováními; Playwright artifact `8543839126` obsahuje input-driven Chlum → Nesměň průchod a Nesměň portrait/landscape důkaz.
- Issue #51 je samostatný rezervovaný Besednice vertical slice. Tato governance aktualizace jej aktivuje, ale jeho implementační větev smí vzniknout až z merge commitu tohoto PR.
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

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | **Dokončeno a uzavřeno** | Pouze regresní ochrana | Nevracet input opravy do paralelní větve |
| CI a validace #2 / mobilní QA #38 | **Dokončeno pro Chlum a Nesměň** | Testy issue #51 | Zelený unit, validátor a mobilní browser smoke na finálním headu |
| Architektura #3 / asset runtime #42 | **Dokončeno a uzavřeno** | Pouze regresní ochrana standardního loaderu a preloadu | Žádný ad-hoc loader ani ruční asset seznam |
| Gameplay/data #47 | **Dokončeno a uzavřeno** | Pouze regresní ochrana Nesměně | Neměnit dokončený tok mimo nezbytný přechod |
| Gameplay/data #51 | **Aktivováno touto governance aktualizací** | Kompletní Besednice vertical slice | Jeden draft PR z přesného post-governance `main` |
| Grafika/asset pipeline | **Aktivní pouze v rámci #51** | Besednice asset pack | Manifest ID, typ, preload, budget a dispose vlastník |
| UI/mobil #40 | **Dokončeno a uzavřeno** | Pouze regresní ochrana | Bez nové UI architektury |
| Audio/výkon #6 | Neaktivní samostatná etapa | Jen úzce nutné podklady po výslovném přidělení | Žádný audio redesign v #51 |
| QA/release #7 | **Podpora issue #51** | Unit, statické a mobilní E2E | Celý Chlum → Nesměň → Besednice tok, portrait/landscape a input lifecycle |
| Chlum vertical slice #29 / PR #33 | **Dokončeno a sloučeno** | Pouze regresní ochrana | Neměnit questy nebo balance bez samostatného issue |
| Nesměň vertical slice #47 / PR #50 | **Dokončeno a sloučeno** | Pouze regresní ochrana | Zachovat tři profily, devět zásahů a tři zasypané díry |
| Besednice vertical slice #51 | **Výslovně aktivováno** | `agent/besednice-vertical-slice` | Větev založit až po merge této governance aktualizace |
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

Issue #40 bylo uzavřeno po merge PR #43. HUD revision, safe-area, pointer ownership, input lifecycle a nativní Enter/Space zůstávají regresním kontraktem.

### 4b. Mobilní E2E stabilita — dokončeno

Issue #38 bylo uzavřeno po merge PR #44. Produkční browserový vstup zůstává zachovaný bez teleportu nebo přímé změny transformace.

### 4c. Asset runtime hardening — dokončeno

Issue #42 bylo uzavřeno po merge PR #45. Platí standardní lokální GLTFLoader r185, manifest-driven preload, původní `entry.type` a oddělené dispose vlastnictví cached source a instancí.

### 5. Nesměň vertical slice — dokončeno

Issue #47 bylo uzavřeno jako `completed` po merge PR #50 jako `8905a0da77d4bd906ca3b1202aa3fcf35421e17c`.

Produkční tok:

`dokončený Chlum → briefing Nesměň → lesník Jan → jedna AKCE → povolení → profil 1: tři zásahy → finding → ZAHRNOUT → profil 2: tři zásahy → ZAHRNOUT → profil 3: tři zásahy → ZAHRNOUT → výsledek → level:complete(nextLevelId: "besednice")`

Doložené vlastnosti:

1. Nesměň se spouští z výsledku Chlumu bez debug URL;
2. existují přesně tři dosažitelné profily;
3. každé kopání vyžaduje přesně tři úspěšné zásahy, celkem devět;
4. vždy může existovat pouze jedna otevřená díra a další profil se odemkne až po akci `ZAHRNOUT`;
5. finding `nesmen-finding-1` se zapíše právě jednou a kumulativní score je 210;
6. preload používá pouze `assetGroups: ["common", "level:nesmen"]` a manifest;
7. šest Nesměň assetů má ID, typ, relativní URL, preload, metrics, budget, SHA-256 a dispose vlastníka;
8. `level:complete` emituje `nextLevelId: "besednice"`, ale Besednice nebyla v PR #50 implementována;
9. workflow #508 je zelené, unit suite má 100/100 PASS;
10. artifact `8543839126` obsahuje `nesmen-portrait.png` 1170×2532 a `nesmen-landscape.png` 2532×1170.

### 6. Besednice vertical slice — aktivovaná etapa

Kanonický balík je issue #51.

- **Vlastník:** Gameplay/data.
- **Povinná větev:** `agent/besednice-vertical-slice`.
- **Branch point:** merge commit této governance aktualizace; koordinátor zapíše přesný SHA do issue #51 při založení větve.
- **Výstup:** jeden samostatný draft PR s úplným HANDOFFem.
- **Zakázáno:** implementace Slavia/KD Slavia, druhý renderer/kamera/loop/session/loader, nový eventový katalog, ruční asset seznamy, runtime přepis `entry.type`, persistence, inventář nebo změna dokončeného Chlum/Nesměň obsahu mimo nezbytný přechod.

Kanonický průchod:

`dokončená Nesměň → briefing Besednice → objevit přesně tři stopy → odemknout ježkový profil → kopání přesně třemi úspěšnými zásahy → získat ježkový finding → rival Karel zahájí boss/recovery fázi → získat ježek zpět → výsledek → level:complete(nextLevelId: "slavia")`

Povinné výstupy:

1. produkční přechod z dokončené Nesměně bez debug URL;
2. přesně tři dosažitelné stopy, každá započtená právě jednou;
3. ježkový profil se neodemkne před nalezením všech tří stop;
4. kopání vyžaduje literal `DIG_REQUIRED_HITS === 3`;
5. ježkový nález používá stabilní `findingId`, zapíše se právě jednou a zvýší session score;
6. rival Karel zahájí boss/recovery fázi až po získání nálezu;
7. level nelze dokončit bez `clues >= 3`, `hedgehog === true`, `bossStarted === true` a `bossDefeated === true`;
8. manifest-driven preload přes `assetGroups: ["common", "level:besednice"]`;
9. všechny assety mají ID, typ, relativní URL, preload, metrics, budget, SHA-256 a dispose vlastníka;
10. `level:complete` emituje `nextLevelId: "slavia"`, ale Slavia se neimplementuje ani neregistruje;
11. unit, validátor a skutečný mobilní E2E pokrývají celý Chlum → Nesměň → Besednice tok, portrait/landscape, pause/resume, background návrat a input release;
12. PR obsahuje asset budget tabulku, testy, vizuální důkaz a potvrzení všech rozsahových zákazů.

## Aktivační pravidlo dalšího levelu

Slavia vertical slice smí být aktivován teprve po:

1. merge issue #51 / Besednice PR;
2. zeleném finálním workflow;
3. koordinační aktualizaci tohoto dokumentu s novým branch pointem a samostatným issue/PR kontraktem.
