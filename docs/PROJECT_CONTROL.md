# Řízení a integrace projektu

> Stav k 22. 7. 2026 po merge Chlum vertical slice PR #33. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Aktuální publikovatelný základ je `main@91179090fcd28cec4b7ffbf7e50ff433d7eaabad`, merge kompletního Chlum vertical slice PR #33.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`; aktivním runtime je Three.js verze 6.0 s jedním `WebGLRenderer` a ortografickou kamerou.
- Gameplay/datová sanace z PR #23 zůstává závazná: levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód jsou zmrazené historické soubory a produkční bootstrap je nesmí importovat.
- PR #20 a uzavřený PR #21 jsou pouze donoři jednotlivých částí; nesmějí být sloučeny ani použity jako základ nové větve.
- Issue #29 je dokončeno a uzavřeno. PR #33 byl sloučen z finálního headu `8772478f93895445ad10212f9289cae429583dea`.
- Finální workflow Chlumu `Validate game` #322 prošel: syntaxe, statický validátor, celý unit suite a mobilní browser smoke jsou zelené.
- Playwright artifact `8538592699` obsahuje portrait a landscape vizuální důkaz produkčního Chlumu.
- Fyzický Safari průchod na cílovém iPhonu zůstává manuální release bránou, nikoli důvodem znovu otevřít Chlum implementaci.
- Jediným aktivním implementačním balíkem je nyní issue #40 na větvi `agent/ui-mobile-hud-safe-area-input`.
- Issue #40 zpevňuje pouze obecnou HUD, safe-area a input vrstvu. Nesmí měnit levelová data, renderer ani gameplay pravidla a nesmí přidat další level.
- Následujícím povinným implementačním balíkem je issue #42 na výslovně rezervované větvi `agent/asset-runtime-hardening`.
- Issue #42 smí začít až z aktuálního `main` po merge issue #40 a musí být samostatným architektonickým PR.
- Nesměň vertical slice je blokován do merge issue #40 i issue #42 a následné koordinační aktualizace tohoto dokumentu.

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
| P0 mobilní stabilita #1 | Automatické regrese sloučeny, chybí fyzický Safari důkaz | Záznam kompletního průchodu na cílovém iPhonu | Žádný freeze, dvojí akce ani konfliktní overlay |
| CI a validace #2 | Chlum workflow #322 zelený | Testy aktivního issue #40, poté asset-runtime testy issue #42 | Zelený unit, validátor a mobilní browser smoke na každém finálním headu |
| Architektura #3 / asset runtime #42 | **Přiděleno jako následující povinný balík** | Standardní GLTFLoader r185, zachování `entry.type`, manifest-driven preload | Samostatný PR po merge #40; bez dalšího levelu a bez druhého runtime |
| Gameplay #4 | Chlum dokončen a sloučen | Bez změn během #40 a #42 | Nesměň nezačíná před merge obou předstupňů |
| Grafika #5 | Chlum assety, manifest a GLB sloučeny | U issue #42 pouze testovací standardní texturovaný GLB, ne Nesměň asset pack | Asset ID, preload, dispose a loader verze musí být doložené |
| UI/mobil #40 | **Aktuální implementační etapa** | HUD revision reset, ARIA, safe-area a robustní input release | Jeden draft PR, zelené testy, portrait/landscape důkaz |
| Audio/výkon #6 | Samostatný AudioEngine není aktivní etapa | Bez rozšíření #40 a #42 | Žádný audio redesign v těchto PR |
| QA/release #7 | Chlum E2E prošel | Unit/browser testy #40 a následně asset runtime regresní testy #42 | Otočení, background, asset failure a dispose bez drženého vstupu nebo úniku |
| Chlum vertical slice #29 / PR #33 | **Dokončeno a sloučeno** | Pouze regresní ochrana | Nevracet levelovou implementaci do paralelní větve |
| Nesměň vertical slice | **Blokováno** | Žádný branch ani PR | Povolit až po merge #40, merge #42 a koordinační aktualizaci |
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

### 4a. UI/mobil stabilizace — aktuální etapa

Kanonický balík je issue #40.

- **Base:** `main@91179090fcd28cec4b7ffbf7e50ff433d7eaabad`.
- **Větev:** `agent/ui-mobile-hud-safe-area-input`.
- **Rozsah:** `src/ui`, `src/input`, jediná sdílená UI stylesheet vrstva, související unit/browser testy a pouze nezbytné obecné composition-root zapojení.
- **Zakázáno:** levelová data/texty, renderer, kamera, loop, gameplay systémy, save/localStorage, inventář nebo další level.

Povinné výstupy:

1. HUD přijme první model nového producenta/session a přitom odmítne přesný duplikát;
2. danger progress a momentary action button mají korektní ARIA kontrakty bez falešného toggle stavu;
3. safe-area funguje při visual viewport změně, otočení a změně browser chrome;
4. joystick i akce vlastní pointer ID, ignorují cizí pointery a vždy se uvolní při lost capture, blur, pagehide, visibilitychange a změně orientace/viewportu;
5. gameplay klávesy neblokují nativní Enter/Space na menu a overlay tlačítkách;
6. unit testy a mobilní browser smoke pokrývají reset/revision, safe-area, orientation a input release;
7. výstupem je jeden draft PR s úplným HANDOFFem.

### 4b. Asset runtime hardening — přiděleno, čeká na merge #40

Kanonický balík je issue #42.

- **Base:** aktuální `main` po merge issue #40 a governance změn.
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
8. případná úprava `ChlumScene` smí pouze použít obecné preload API bez změny gameplay nebo vzhledu.

Akceptační brána:

1. standardní texturovaný GLB se načte přes lokální `GLTFLoader` revision 185;
2. `player-hunter-walk` se načítá a cachuje jako `spritesheet`;
3. chyba HTTP nebo parse emituje kanonický `asset:load:error`;
4. dispose první ze dvou texturovaných instancí nepoškodí druhou ani cached source;
5. Chlum je nadále dokončitelný od PLAY a celý unit, validátor a mobilní E2E zůstává zelený;
6. stále existuje právě jeden `WebGLRenderer`, jedna ortografická kamera, jeden loop a jedna session;
7. PR obsahuje úplný HANDOFF a potvrzení, že Nesměň nebyla zahájena.

### 5. Nesměň vertical slice — čeká na issue #40 a #42

Nesměň bude samostatný implementační balík založený z aktuálního `main` až po:

1. merge issue #40;
2. merge issue #42 z větve `agent/asset-runtime-hardening`;
3. koordinační aktualizaci tohoto dokumentu s přiděleným Nesměň issue, větví a akceptační bránou.

Nesmí vzniknout paralelní Nesměň branch ani PR během aktivního UI/mobil nebo asset-runtime balíku.

### 6. Besednice a Slavia — čekají na předchozí level

Besednice a Slavia se převádějí po jednom v samostatných PR nad sloučeným předchozím stupněm.

### 7. Legacy odstranění a finální release — blokováno dokončením všech levelů

Legacy Canvas runtime, opravné vrstvy a starý save kód se odstraňují až po převodu všech čtyř levelů a zeleném kompletním průchodu.

## Přidělení práce dalším chatům

Aktivní je pouze implementační chat issue #40 na větvi `agent/ui-mobile-hud-safe-area-input`. Výstupem musí být jeden draft PR. Nesměň ani jiný level se souběžně neimplementuje.

Issue #42 je výslovně přiděleno platformnímu/architektonickému chatu a rezervuje větev `agent/asset-runtime-hardening`. Tato větev se založí až po merge #40 z tehdy aktuálního `main`; nesmí vzniknout jako paralelní runtime implementace nad starým base.

Podpůrné proudy smějí dodat pouze úzce vyžádanou podporu v právě aktivním PR:

1. **UI/mobil:** vlastní implementaci issue #40; během #42 pouze regresní kontrolu UI/inputu.
2. **Platforma/architektura:** během #40 pouze review minimálního composition-root zásahu; poté vlastní implementaci issue #42.
3. **QA:** unit/browser testy, portrait/landscape důkaz a asset failure/dispose testy bez nové gameplay funkce.
4. **Gameplay/data:** pouze regresní kontrolu, bez změny pravidel nebo levelových dat.
5. **Grafika:** u #42 pouze standardní texturovaný GLB test fixture a metadata; žádný Nesměň asset pack.
6. **Audio/výkon:** bez samostatného rozšíření.

## Formát hlášení chatu

```text
Větev: agent/<tema>
Issue: #<číslo>
Změněné soubory: ...
Změněné kontrakty: žádné / přesný seznam
Testy: příkaz + výsledek
Mobilní ověření: zařízení, orientace, výsledek
Výkon/assety: rozpočty, manifest, dispose
Známé limity: ...
PR: <odkaz>
```

Výstup bez větve, issue, PR a ověřitelných testů se nepovažuje za integrovatelný.
