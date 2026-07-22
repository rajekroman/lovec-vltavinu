# Řízení a integrace projektu

> Stav k 22. 7. 2026 po merge UI/mobil PR #43, merge QA PR #44 a uzavření issues #40 a #38. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Aktuální publikovatelný základ je `main@e887a863ac270a7a4c2e96f5818487d80ac87724`, squash merge QA PR #44.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`; aktivním runtime je Three.js verze 6.0 s jedním `WebGLRenderer` a ortografickou kamerou.
- Gameplay/datová sanace z PR #23 zůstává závazná: levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód jsou zmrazené historické soubory a produkční bootstrap je nesmí importovat.
- PR #20 a uzavřený PR #21 jsou pouze donoři jednotlivých částí; nesmějí být sloučeny ani použity jako základ nové větve.
- Issue #29 je dokončeno a uzavřeno. PR #33 byl sloučen z finálního headu `8772478f93895445ad10212f9289cae429583dea`.
- Issue #1 je dokončeno a uzavřeno po merge PR #39 jako `main@817cfa6521ff0d168ff69b569bb1bc11336db893`; Roman výslovně potvrdil dokončení poslední fyzické Safari brány.
- Issue #40 je dokončeno a uzavřeno po merge UI/mobil PR #43 jako `main@c2771b88418c07b53b064088c09b7cb64d286c65`.
- PR #43 zpevnil HUD revision reset, ARIA, safe-area a robustní pointer/lifecycle release bez změny gameplay, rendereru nebo levelových dat.
- Issue #38 je dokončeno a uzavřeno po merge QA PR #44 jako `main@e887a863ac270a7a4c2e96f5818487d80ac87724`.
- PR #44 rozdělil mobilní Chlum E2E na deterministické scénáře; workflow #369 a #371 prošly po sobě na nezměněném headu bez rerunu a bez flaky výsledků.
- Jediným aktivním implementačním balíkem je nyní issue #42 na povinné větvi `agent/asset-runtime-hardening`.
- Issue #42 musí vycházet z aktuálního `main@e887a863ac270a7a4c2e96f5818487d80ac87724` a skončit jedním samostatným architektonickým draft PR.
- Nesměň vertical slice zůstává blokován do merge issue #42 a následné koordinační aktualizace tohoto dokumentu.

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
| GLTF runtime | lokálně připnutý standardní Three.js `GLTFLoader` kompatibilní s revision 185; žádný remote CDN loader |
| Asset preload | řízen manifestem a `level.assetGroups`; původní `entry.type` se nesmí za běhu přepisovat |

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | **Dokončeno a uzavřeno** | Pouze regresní ochrana | Nevracet opravy vstupu do paralelní větve |
| CI a validace #2 / mobilní QA #38 | **Dokončeno a uzavřeno pro Chlum** | Asset-runtime testy issue #42 | Zelený unit, validátor a mobilní browser smoke na finálním headu |
| Architektura #3 / asset runtime #42 | **Aktuální implementační etapa** | Standardní GLTFLoader r185, zachování `entry.type`, manifest-driven preload | Jeden samostatný draft PR; bez dalšího levelu a bez druhého runtime |
| Gameplay #4 | Chlum dokončen a sloučen | Bez změn během #42 | Nesměň nezačíná před merge architektonického předstupně |
| Grafika #5 | Chlum assety, manifest a GLB sloučeny | U issue #42 pouze testovací standardní texturovaný GLB, ne Nesměň asset pack | Asset ID, preload, dispose a loader verze musí být doložené |
| UI/mobil #40 | **Dokončeno a uzavřeno** | Pouze regresní ochrana | Nevracet UI/input změny do asset runtime bez doložené nutnosti |
| Audio/výkon #6 | Samostatný AudioEngine není aktivní etapa | Bez rozšíření #42 | Žádný audio redesign v tomto PR |
| QA/release #7 | Mobilní E2E stabilizováno v PR #44 | Asset failure, preload a dispose regrese issue #42 | Dva zelené běhy finálního headu, pokud issue #42 mění mobilní smoke |
| Chlum vertical slice #29 / PR #33 | **Dokončeno a sloučeno** | Pouze regresní ochrana | Nevracet levelovou implementaci do paralelní větve |
| Nesměň vertical slice | **Blokováno** | Žádný branch ani PR | Povolit až po merge #42 a koordinační aktualizaci |
| Master #8 | Aktivní | Udržovat pořadí, rozhodnutí a blokace PR | Žádný paralelní release mimo frontu |

## Integrační fronta

### 1. Řídicí kontrakt — dokončeno

`AGENTS.md`, `ARCHITECTURE_CONTRACT.md`, `PROJECT_CONTROL.md` a PR šablona byly zavedeny v PR #22.

### 1a. Karanténa historických snapshotů — platí

- PR #20, issue #19 a PR #21 jsou pouze dohledatelné zdroje jednotlivých kandidátních částí.
- Nepřenášet jejich alternativní strom, perspektivní kameru, eventový katalog ani starý branch base.

### 2. Sanace datového rozsahu — dokončeno

PR #23 byl sloučen jako `2e678506`.

- `LEVEL_ORDER = ["chlum", "nesmen", "besednice", "slavia"]`;
- session-only `GameSession` žije pouze v paměti;
- nálezy používají `findingId` a automaticky zvyšují score;
- žádná inventářová správa, persistence, migrace ani nový renderer.

### 3. Produkční bootstrap — dokončeno

PR #24 byl sloučen jako `777f6513`.

- jediný `src/bootstrap.js` a jeden ortografický `WebGLRenderer`;
- fixed-step 60 Hz, max delta 100 ms, max 5 substepů;
- fixed updates neběží během async transition;
- PLAY resetuje session;
- dig eventy přijímají literal `3`.

### 4. Chlum vertical slice — dokončeno

Issue #29 bylo uzavřeno po merge PR #33 jako `main@91179090fcd28cec4b7ffbf7e50ff433d7eaabad`.

Dokončený tok:

`PLAY → briefing → Václav → jedna AKCE → povolení → naleziště → přesně tři zásahy → jeden finding → vyhnutí se traktoru → výsledek Chlumu`

Doložené vlastnosti:

1. produkční `ChlumScene` instancuje entity do `World` a používá závazný fixed-step pipeline;
2. Václavovo povolení vzniká jednou kontextovou akcí;
3. kopání dokončí pouze přesně tři úspěšné zásahy;
4. jeden nález se přes `findingId` zapíše právě jednou a zvýší score;
5. low-poly GLB traktor je aktivní hazard; samostatný regresní test ověřuje danger, návrat na spawn a nezamrzlý input;
6. `level:complete` emituje `nextLevelId: "nesmen"`, ale Nesměň se nespouští;
7. assety mají stabilní ID, relativní URL, rozpočty, pivot/rozměry a dispose vlastníka;
8. workflow #322 je zelený a artifact `8538592699` obsahuje portrait/landscape důkaz;
9. nevznikl save systém, inventář, druhý renderer ani alternativní eventový katalog.

### 4a. Mobilní stabilita #1 — dokončeno

Issue #1 bylo uzavřeno po merge PR #39 jako `main@817cfa6521ff0d168ff69b569bb1bc11336db893`.

- akční tlačítko vlastní právě jeden aktivní pointer;
- lifecycle přechody čistí lokální pointer a vizuální stav;
- `InputManager` se bezpečně resetuje;
- finální workflow #349 prošlo;
- fyzická Safari akceptace byla Romanem potvrzena.

### 4b. UI/mobil stabilizace #40 — dokončeno

Issue #40 bylo uzavřeno po merge PR #43 jako `main@c2771b88418c07b53b064088c09b7cb64d286c65`.

- HUD přijímá první model nového revision streamu a odmítá přesný duplikát;
- danger a momentary action mají korektní ARIA kontrakty;
- safe-area reaguje na visual viewport, otočení a browser chrome;
- joystick i akce vlastní pointer ID a uvolňují se při lost capture a lifecycle změnách;
- gameplay klávesy neblokují nativní Enter/Space na UI;
- workflow #363 a portrait/landscape artifact `8539991684` jsou zelené.

### 4c. Mobilní E2E stabilita #38 — dokončeno

Issue #38 bylo uzavřeno po merge PR #44 jako `main@e887a863ac270a7a4c2e96f5818487d80ac87724`.

- monolitický Chlum smoke byl rozdělen na kratší deterministické scénáře;
- skutečný browserový input zůstal zachován bez teleportu nebo přímé změny transformace;
- kanonický Chlum flow, lifecycle, tractor regrese a joystick reset jsou oddělené;
- workflow #369 a #371 prošly po sobě na stejném headu `afd934e12e2c21d5b6a00551782653a99a4800db` bez rerunu;
- oba běhy vykázaly `0 unexpected`, `0 flaky` a zachovaly portrait `1170×2532` i landscape `2532×1170` důkaz.

### 4d. Asset runtime hardening #42 — aktuální etapa

Kanonický balík je issue #42.

- **Base:** `main@e887a863ac270a7a4c2e96f5818487d80ac87724` po merge issues #40 a #38.
- **Povinná větev:** `agent/asset-runtime-hardening`.
- **Vlastník:** Platforma/architektura; QA a grafika poskytují pouze úzce vyžádané testovací podklady.
- **Cíl:** odstranit ad-hoc assetové vazby před zavedením Nesměně.
- **Zakázáno:** Nesměň data, scéna, questy, asset pack nebo jiný nový level.

Závazný rozsah:

1. lokálně připnout standardní Three.js `GLTFLoader` a potřebné add-on moduly kompatibilní s lokální revision 185;
2. nepoužívat remote CDN ani druhý Three.js namespace;
3. registrovat manifestové typy `json`, `texture`, `spritesheet` a `gltf` v jediném composition rootu;
4. předávat `AssetLoaderu` nezměněné manifestové položky a zachovat původní `entry.type` v cache, eventech i unloadu;
5. vybírat preload podle `level.assetGroups` a manifestového `preload`;
6. odstranit paralelní ruční seznamy typu `TEXTURE_IDS` a `MODEL_IDS` ze scén;
7. zachovat bezpečné vlastnictví dispose pro cached source a více texturovaných modelových instancí;
8. případná úprava `ChlumScene` smí pouze přejít na obecnou manifest-driven preload cestu bez změny questů, kolizí nebo výsledku;
9. dodat unit testy loaderu, preloadu, type preservation a dispose; browser smoke musí prokázat načtení testovacího texturovaného GLB bez 404 a bez úniku;
10. celý balík musí skončit jedním samostatným draft PR s integračním HANDOFFem.

## Aktivační pravidlo dalšího levelu

Samostatný Nesměň vertical slice smí být aktivován teprve po:

1. merge issue #42;
2. zeleném workflow na finálním headu;
3. koordinační aktualizaci tohoto dokumentu s novým branch pointem a samostatným issue/PR kontraktem.
