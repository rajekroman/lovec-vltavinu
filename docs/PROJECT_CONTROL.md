# Řízení a integrace projektu

> Stav k 23. 7. 2026 po merge Nesměň vertical slice PR #50. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Aktuální `main` je `9bda0b56940dfd12ed46daba70916db850709971`.
- Produkční Nesměň vertical slice byl sloučen v PR #50 jako `8905a0da77d4bd906ca3b1202aa3fcf35421e17c` z finálního headu `7af16b6e2434a72081fe59c41e08aedfc843d6f2`.
- Commity `577d20d8` a `9bda0b56` pouze vytvořily a bezprostředně odstranily prázdný soubor `DO_NOT_CREATE.tmp`; výsledný strom nemá proti produkčnímu merge #50 žádný obsahový runtime rozdíl.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`; runtime používá právě jeden Three.js `WebGLRenderer`, jednu ortografickou kameru, jeden loop, jednu session, jeden `AssetLoader` a jeden eventový katalog.
- Kanonické levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód jsou zmrazené historické soubory a produkční bootstrap je nesmí importovat.
- Issue #29 / PR #33 je dokončeno a sloučeno: Chlum je produkčně průchozí od PLAY po `level:complete(nextLevelId: "nesmen")`.
- Issue #40 / PR #43, issue #38 / PR #44 a issue #42 / PR #45 jsou dokončené a jejich UI, mobilní QA a asset-runtime kontrakty se znovu neotevírají.
- Issue #47 je uzavřeno jako completed. PR #50 byl sloučen a Nesměň je produkčně průchozí po dokončeném Chlumu.
- Finální workflow Nesměně `Validate game` #508 prošel: statická/unit validace i mobilní browser smoke jsou zelené; unit suite má 100/100 PASS.
- Static artifact `8543743528` potvrzuje 17 runtime assetů, 33 eventových kontraktů a 0 chyb/varování.
- Playwright artifact `8543839126` obsahuje `nesmen-portrait.png` 1170×2532 a `nesmen-landscape.png` 2532×1170.
- Issue #51 je jediná rezervace pro následující Besednice vertical slice.
- Besednice implementace nesmí začít před merge governance PR, který obsahuje tuto aktualizaci.
- Slavia/KD Slavia zůstává blokovaná do merge Besednice a další koordinační aktualizace.

## Rozhodnutí, která se znovu neotevírají

| Oblast | Závazné rozhodnutí |
|---|---|
| Rendering | Three.js/WebGL, právě jeden renderer, ortografická kamera |
| Produkční vstup | jediný `src/bootstrap.js`; žádný druhý gameplay runtime |
| Vizuální skladba | 2D transparentní sprity/spritesheet + low-poly GLB |
| UI | HTML/CSS overlay; žádná DOM stavová autorita v gameplay/ECS |
| Architektura | ES moduly, scene manager, asset loader, input manager, ECS-lite, kolize a animace |
| Simulace | fixed timestep 60 Hz, max delta 100 ms, max 5 substepů, interpolovaný render |
| Ovládání | směrový vstup + jedno kontextové tlačítko `AKCE` |
| Kopání | přesně tři úspěšné zásahy; dig eventy striktně používají literal `3` |
| Nálezy | session kolekce/skóre bez inventářového UI; ID pole je `findingId` |
| Persistence | žádný save systém, localStorage gameplay stav, continue ani migrace |
| GLTF runtime | lokální standardní Three.js `GLTFLoader` revision 185; žádný remote CDN loader |
| Asset preload | výhradně manifest a `level.assetGroups`; původní `entry.type` se nepřepisuje |
| Asset vlastnictví | cached source a modelové instance mají oddělené dispose vlastnictví |
| Levelová integrace | každý level má samostatný issue, větev a jediný draft PR |

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | **Dokončeno a uzavřeno** | Pouze regresní ochrana | Žádný držený vstup po lifecycle přechodech |
| CI a validace #2 / mobilní QA #38 | **Dokončeno pro Chlum a Nesměň** | Testy issue #51 | Zelený unit, validátor a mobilní E2E finálního headu |
| Architektura #3 / asset runtime #42 | **Dokončeno a uzavřeno** | Pouze regresní ochrana | Jeden loader/runtime, manifest-driven preload |
| Gameplay/data #47 | **Dokončeno a sloučeno** | Pouze Nesměň regrese | Neměnit dokončená pravidla bez defect issue |
| Gameplay/data #51 | **Rezervováno, čeká na merge governance PR** | Besednice vertical slice | Jeden draft PR z nového aktuálního main |
| Grafika/asset pipeline | Čeká na aktivaci #51 | Besednice asset pack | Stabilní ID, preload, budget, SHA-256 a dispose vlastník |
| UI/mobil #40 | **Dokončeno a uzavřeno** | Pouze úzce nutná regrese #51 | Bez nové UI architektury nebo druhého controlu |
| Audio/výkon #6 | Neaktivní samostatná etapa | Bez změn, pokud #51 výslovně nevyžádá | Žádný audio redesign |
| QA/release #7 | Čeká na aktivaci #51 | Unit, statické a mobilní E2E | Chlum → Nesměň → Besednice, obě orientace a lifecycle |
| Chlum #29 / PR #33 | **Dokončeno a sloučeno** | Regresní ochrana | Neměnit questy/balance |
| Nesměň #47 / PR #50 | **Dokončeno a sloučeno** | Regresní ochrana | Neměnit tři profily, zahrnutí ani finding kontrakt |
| Besednice #51 | **Koordinační rezervace** | `agent/besednice-vertical-slice` až po governance merge | Base musí být nový aktuální main |
| Slavia | **Blokováno** | Žádný branch ani PR | Až po merge #51 a další governance aktualizaci |
| Master #8 | Aktivní | Udržovat pořadí a blokace | Žádný paralelní level nebo release |

## Integrační fronta

### 1. Řídicí kontrakt — dokončeno

`AGENTS.md`, `ARCHITECTURE_CONTRACT.md`, `PROJECT_CONTROL.md` a PR šablona jsou závazné. Každá implementační větev vzniká z aktuálního `main` a končí jedním draft PR.

### 2. Sanace datového rozsahu — dokončeno

- `LEVEL_ORDER = ["chlum", "nesmen", "besednice", "slavia"]`;
- session-only `GameSession` žije pouze v paměti;
- nálezy používají `findingId` a automaticky zvyšují score;
- žádná inventářová správa, persistence, migrace ani nový renderer.

### 3. Produkční bootstrap a asset runtime — dokončeno

- jediný `src/bootstrap.js`, renderer, kamera, loop, session a eventový katalog;
- fixed-step 60 Hz, max delta 100 ms, max 5 substepů;
- lokální standardní `GLTFLoader` r185;
- manifestové typy `json`, `texture`, `spritesheet` a `gltf`;
- preload podle `level.assetGroups` a manifestového `preload`;
- zachování `entry.type` a bezpečné dispose vlastnictví.

### 4. Chlum vertical slice — dokončeno

Issue #29 / PR #33 je sloučeno. Produkční tok:

`PLAY → briefing → Václav → jedna AKCE → povolení → naleziště → přesně tři zásahy → jeden finding → vyhnutí se traktoru → výsledek → level:complete(nextLevelId: "nesmen")`

### 5. Nesměň vertical slice — dokončeno

Issue #47 / PR #50 je sloučeno jako `main@8905a0da77d4bd906ca3b1202aa3fcf35421e17c`.

Dokončený tok:

`dokončený Chlum → briefing Nesměň → Jan → jedna AKCE → povolení → profil 1 → tři zásahy → finding → ZAHRNOUT → profil 2 → tři zásahy → ZAHRNOUT → profil 3 → tři zásahy → ZAHRNOUT → výsledek → level:complete(nextLevelId: "besednice")`

Doložené vlastnosti:

1. Nesměň je dosažitelná produkčně z Chlumu bez debug URL;
2. existují přesně tři profily a vždy nejvýše jedna otevřená díra;
3. další profil se odemkne až po `ZAHRNOUT` aktuální díry;
4. každé kopání vyžaduje přesně tři úspěšné zásahy;
5. `nesmen-finding-1` se zapíše právě jednou a zvýší score o 120;
6. kumulativní kanonické score po Chlumu a Nesměni je 210;
7. šest Nesměň assetů je v manifestu, rozpočtu a PWA cache;
8. preload používá `assetGroups: ["common", "level:nesmen"]` bez ručních ID seznamů;
9. workflow #508, 100 unit testů a mobilní E2E jsou zelené;
10. Besednice ani Slavia nebyly v PR #50 implementovány.

### 6. Besednice vertical slice — rezervováno, čeká na governance merge

Kanonický balík je issue #51.

- **Vlastník:** Gameplay/data.
- **Povinná budoucí větev:** `agent/besednice-vertical-slice`.
- **Branch point:** aktuální `main` vzniklý merge governance PR s tímto dokumentem.
- **Výstup:** jeden samostatný draft PR s úplným HANDOFFem.
- **Do governance merge:** žádná Besednice implementace, branch ani PR.
- **Zakázáno:** Slavia implementace; druhý renderer/kamera/loop/session/loader; ruční asset seznamy; runtime přepis `entry.type`; persistence; inventář; paralelní combat architektura; změna dokončeného Chlum/Nesměň obsahu mimo nezbytný přechod.

Kanonický průchod podle produkčních definic:

`dokončená Nesměň → briefing Besednice → objevit přesně 3 stopy → odemknout ježkový profil → kopání přesně 3 úspěšnými zásahy → získat ježkový finding → rival Karel zahájí boss/recovery fázi → získat ježek zpět → výsledek → level:complete(nextLevelId: "slavia")`

Povinné výstupy issue #51:

1. produkční přechod z dokončené Nesměně bez debug URL, konzole nebo teleportu;
2. briefing vysvětlí tři stopy, ježkový profil a riziko rivalova odcizení;
3. přesně tři dosažitelné stopy, každá započtená právě jednou;
4. ježkový profil se neodemkne před `clues >= 3`;
5. kopání používá `DIG_REQUIRED_HITS === 3` a kanonické dig eventy;
6. ježkový nález používá stabilní `findingId`, zapíše se jednou a zvýší session score;
7. po nálezu se aktivuje rival Karel a recovery fáze;
8. objective se dokončí pouze při `clues >= 3`, `hedgehog === true`, `bossStarted === true`, `bossDefeated === true`;
9. manifest-driven preload používá `assetGroups: ["common", "level:besednice"]`;
10. všechny assety mají ID, původní typ, relativní URL, preload, budget, SHA-256 a dispose vlastníka;
11. `level:complete` emituje `{ levelId: "besednice", nextLevelId: "slavia", score }`, ale Slavia se neregistruje;
12. unit, statický validátor a skutečný mobilní E2E pokrývají celý tok Chlum → Nesměň → Besednice;
13. E2E pokrývá portrait, landscape, pause/resume, background návrat, orientation a uvolněný input;
14. PR obsahuje asset budget tabulku, vizuální důkaz a potvrzení všech rozsahových zákazů;
15. runtime má stále právě jeden renderer, kameru, loop, session, loader a žádnou persistence.

### 7. Slavia/KD Slavia — blokováno Besednicí

Slavia vertical slice smí být aktivován teprve po:

1. merge issue #51 / Besednice PR;
2. zeleném finálním workflow;
3. koordinační aktualizaci tohoto dokumentu s novým issue, větví a akceptační bránou.

### 8. Legacy odstranění a release — blokováno dokončením levelů

Legacy Canvas runtime, opravné vrstvy a starý save kód se odstraňují až po převodu všech čtyř levelů a zeleném kompletním průchodu. Finální release vyžaduje mobilní QA včetně fyzického Safari důkazu.

## Přidělení práce dalším chatům

Do merge governance PR s touto změnou není aktivní žádný Besednice implementační chat.

Po jeho merge hlavní koordinátor:

1. ověří nový aktuální `main`;
2. vytvoří `agent/besednice-vertical-slice` přesně z tohoto commitu;
3. doplní aktivační komentář do issue #51;
4. přidělí Gameplay/data chatu jediný draft PR pro issue #51.

Podpůrné proudy v aktivním Besednice PR:

1. **Gameplay/data:** vlastní data, scény, discover/boss/recovery pravidlo a objective integraci.
2. **Grafika:** pouze Besednice PNG/GLB/textury a manifestová metadata.
3. **UI/mobil:** pouze nezbytné obecné adaptéry bez nové stavové autority.
4. **QA:** unit, statický a mobilní E2E, asset validace a vizuální důkaz.
5. **Platforma/architektura:** pouze review nebo úzce doložený obecný defect.
6. **Audio/výkon:** bez samostatného redesignu.

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
