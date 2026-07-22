# Řízení a integrace projektu

> Stav k 22. 7. 2026 po merge UI/mobil issue #40, mobilní QA issue #38, asset-runtime issue #42 / PR #45 a aktivaci Nesměň vertical slice. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Aktuální publikovatelný základ je `main@de8f0a0a1e346dd00f3f8e7866d3cdff75cec91c`, squash merge governance PR #48; runtime obsahuje merge PR #45 jako `f68d2064c39da1bf7e3a08e380ebe1f4b647af22`.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`; aktivním runtime je Three.js verze 6.0 s jedním `WebGLRenderer`, jednou ortografickou kamerou, jedním loopem a jednou session.
- Kanonické levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód jsou zmrazené historické soubory a produkční bootstrap je nesmí importovat.
- Issue #29 / PR #33 je dokončeno a sloučeno: Chlum je produkčně průchozí od PLAY po `level:complete` s `nextLevelId: "nesmen"`.
- Issue #40 / PR #43 je dokončeno a sloučeno jako `main@c2771b88418c07b53b064088c09b7cb64d286c65`: HUD, safe-area a input lifecycle jsou stabilizované.
- Issue #38 / PR #44 je dokončeno a sloučeno jako `main@e887a863ac270a7a4c2e96f5818487d80ac87724`: mobilní Chlum E2E je rozdělené a deterministické.
- Issue #42 / PR #45 je dokončeno a sloučeno jako `f68d2064c39da1bf7e3a08e380ebe1f4b647af22`: standardní lokální Three.js `GLTFLoader` revision 185, manifest-driven preload, zachování `entry.type` a bezpečné dispose vlastnictví jsou produkční kontrakt.
- Finální workflow PR #45 `Validate game` #417 prošel: syntaxe, statický validátor, celý unit suite a mobilní browser smoke jsou zelené.
- Playwright artifact `8541110319` obsahuje texturovaný GLB test a portrait/landscape vizuální důkaz Chlumu.
- Jediným aktivním implementačním balíkem je nyní issue #47 — samostatný Nesměň vertical slice.
- Povinná implementační větev issue #47 `agent/nesmen-vertical-slice` byla vytvořena přesně z `main@de8f0a0a1e346dd00f3f8e7866d3cdff75cec91c`.
- Besednice vertical slice zůstává blokován do merge issue #47 a další koordinační aktualizace tohoto dokumentu.

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
| CI a validace #2 / mobilní QA #38 | **Dokončeno a uzavřeno pro Chlum** | Testy issue #47 | Zelený unit, validátor a mobilní browser smoke na finálním headu |
| Architektura #3 / asset runtime #42 | **Dokončeno a uzavřeno** | Pouze regresní ochrana standardního loaderu a preloadu | Žádný ad-hoc loader ani ruční asset seznam |
| Gameplay/data #47 | **Aktivní etapa** | Kompletní Nesměň vertical slice | Jeden draft PR, produkční přechod z Chlumu, zelené E2E |
| Grafika/asset pipeline | **Aktivní pouze v rámci #47** | Nesměň asset pack | Manifest ID, typ, preload, budget a dispose vlastník |
| UI/mobil #40 | **Dokončeno a uzavřeno** | Pouze regresní ochrana | Bez nové UI architektury |
| Audio/výkon #6 | Neaktivní samostatná etapa | Pouze úzce nutné Nesměň audio/perf podklady po přidělení | Žádný audio redesign v #47 |
| QA/release #7 | **Podpora issue #47** | Unit, statické a mobilní E2E | Portrait, landscape, pause/resume, background a nezamrzlý input |
| Chlum vertical slice #29 / PR #33 | **Dokončeno a sloučeno** | Pouze regresní ochrana | Neměnit questy nebo balance bez samostatného issue |
| Nesměň vertical slice #47 | **Výslovně aktivováno** | `agent/nesmen-vertical-slice` | Base `de8f0a0a`; jeden draft PR |
| Besednice vertical slice | **Blokováno** | Žádný branch ani PR | Povolit až po merge #47 a další governance aktualizaci |
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

Issue #40 bylo uzavřeno po merge PR #43 jako `main@c2771b88418c07b53b064088c09b7cb64d286c65`.

Doložené vlastnosti:

1. HUD revision reset a duplicate suppression;
2. korektní ARIA kontrakty danger a akčního tlačítka;
3. safe-area při visual viewport, orientation a browser chrome změnách;
4. pointer ownership a lifecycle release pro joystick i akci;
5. nativní Enter/Space na menu a overlay tlačítkách;
6. zelené unit a mobilní browser testy s portrait/landscape důkazem.

### 4b. Mobilní E2E stabilita — dokončeno

Issue #38 bylo uzavřeno po merge PR #44 jako `main@e887a863ac270a7a4c2e96f5818487d80ac87724`.

Doložené vlastnosti:

1. Chlum smoke je rozdělené do kratších deterministických scénářů;
2. produkční browserový input zůstal zachován bez teleportu nebo přímé změny transformace;
3. workflow #369 a #371 prošly po sobě na stejném headu bez rerunu;
4. portrait i landscape důkaz zůstal zachován.

### 4c. Asset runtime hardening — dokončeno

Issue #42 bylo uzavřeno po merge PR #45 jako `f68d2064c39da1bf7e3a08e380ebe1f4b647af22`.

Doložené vlastnosti:

1. standardní lokální Three.js `GLTFLoader` revision 185;
2. jediný Three.js namespace, renderer, kamera, loop a session;
3. manifestové typy `json`, `texture`, `spritesheet` a `gltf` registrované v composition rootu;
4. původní `entry.type` zachovaný v cache, eventech a unload cestě;
5. preload vybíraný podle `level.assetGroups` a manifestového `preload`;
6. odstraněné ruční `TEXTURE_IDS`/`MODEL_IDS` ze scény;
7. bezpečné oddělení cached source a texturovaných modelových instancí;
8. HTTP i parse chyba emitují kanonický `asset:load:error`;
9. Chlum zůstává dokončitelný a workflow #417 je celé zelené;
10. Nesměň nebyla součástí tohoto balíku.

### 5. Nesměň vertical slice — aktivní etapa

Kanonický balík je issue #47.

- **Vlastník:** Gameplay/data.
- **Povinná větev:** `agent/nesmen-vertical-slice`.
- **Base:** `main@de8f0a0a1e346dd00f3f8e7866d3cdff75cec91c`.
- **Výstup:** jeden samostatný draft PR s úplným HANDOFFem.
- **Zakázáno:** Besednice/Slavia implementace, druhý renderer/kamera/loop/session/loader, ruční asset seznamy, persistence, inventář nebo změna dokončeného Chlum obsahu mimo nezbytný přechod.

Kanonický průchod:

`dokončený Chlum → briefing Nesměň → lesník → jedna AKCE → povolení → tři profily → u každého přesně tři zásahy → zasypat všechny tři díry → nejméně jeden finding → výsledek → level:complete(nextLevelId: "besednice")`

Povinné výstupy:

1. produkční přechod z dokončeného Chlumu bez debug URL;
2. přesně tři dosažitelné profily/díry;
3. každé kopání vyžaduje přesně tři úspěšné zásahy;
4. level nelze dokončit, dokud nejsou všechny díry zasypané;
5. finding používá `findingId`, zapíše se právě jednou a zvýší session score;
6. manifest-driven preload přes `assetGroups: ["common", "level:nesmen"]`;
7. všechny assety mají ID, typ, relativní URL, preload, budget a dispose vlastníka;
8. `level:complete` emituje `nextLevelId: "besednice"`, ale Besednice se neimplementuje;
9. unit, validátor a skutečný mobilní E2E pokrývají celý tok, portrait/landscape, pause/resume, background návrat a input release;
10. PR obsahuje asset budget tabulku, testy, vizuální důkaz a potvrzení rozsahových zákazů.

## Aktivační pravidlo dalšího levelu

Besednice vertical slice smí být aktivován teprve po:

1. merge issue #47 / Nesměň PR;
2. zeleném finálním workflow;
3. koordinační aktualizaci tohoto dokumentu s novým branch pointem a samostatným issue/PR kontraktem.
