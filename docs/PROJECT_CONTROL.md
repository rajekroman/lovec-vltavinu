# Řízení a integrace projektu

> Stav k 22. 7. 2026 během implementace Chlum vertical slice v draft PR #33. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Runtime baseline je `777f6513aca45272935bf6f03c607c4453ff8b2e`, squash merge produkčního bootstrap PR #24.
- Minimální governance baseline je `65ce1380aa84f1446d05b437fe4ebb50a3660d6c`. Skutečný branch point další práce je vždy aktuální `main` v okamžiku založení větve a musí obsahovat všechny pozdější governance-only aktualizace.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`; aktivním runtime je Three.js verze 6.0 s jedním `WebGLRenderer` a ortografickou kamerou.
- Gameplay/datová sanace z PR #23 zůstává závazná: levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód jsou zmrazené historické soubory a produkční bootstrap je nesmí importovat.
- PR #20 a uzavřený PR #21 jsou pouze donoři jednotlivých částí; nesmějí být sloučeny ani použity jako základ celé větve.
- Jediným aktivním implementačním balíkem je issue #29 a draft PR #33 na větvi `agent/chlum-vertical-slice`.
- PR #33 nyní obsahuje gameplay systémy, Chlum entity/dialog data, obecné HUD/screen adaptéry, PNG/GLB/textury, asset manifest a unit testy. Tyto vrstvy zatím nejsou napojené do produkční `ChlumScene`.
- Asset manifest a Chlum data používají rozdílné sady `assetId`; GLB traktor je v manifestu přítomný, ale data jej stále deklarují jako sprite a runtime dosud nemá GLTF loader/model binding.
- Zelené workflow rozpracovaného headu prokazuje pouze regresi neaktivních vrstev, nikoli dokončený Chlum průchod.

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

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | Automatické regrese sloučeny, chybí fyzický Safari důkaz | Záznam kompletního průchodu na cílovém iPhonu | Žádný freeze, dvojí akce ani konfliktní overlay |
| CI a validace #2 | Bootstrap smoke sloučen | Celý Chlum tok a asset kontrola | Zelený workflow na finálním headu PR #33 |
| Architektura #3 | Produkční bootstrap dokončen v PR #24 | Pouze doložená integrační podpora | Core/render/bootstrap změna musí být minimální, obecná a zdůvodněná |
| Gameplay #4 | Systémy a Chlum data rozpracované v PR #33 | Napojit systémy do scény a dokončit tok | Žádná paralelní session nebo levelová data |
| Grafika #5 | Assety a manifest přenesené do PR #33 | Sjednotit ID a prokázat runtime načtení | Manifest, rozpočty, pivoty, dispose, bez 404 |
| UI/mobil | Obecné HUD/screen adaptéry rozpracované v PR #33 | Použít je ve skutečné scéně | Žádná DOM stavová autorita |
| Audio/výkon #6 | Samostatný AudioEngine není aktivní etapa | Bez rozšíření Chlum balíku | Žádný audio redesign v PR #33 |
| QA/release #7 | Unit a legacy smoke procházejí | End-to-end smoke skutečného Chlumu | iPhone viewport, portrait/landscape, pauza a background návrat |
| Chlum vertical slice #29 / PR #33 | **Aktuální integrační etapa; draft, částečně implementováno** | Dokončit stejný PR bez vedlejšího implementačního PR | Kompletní Chlum, zelené testy, vizuální důkaz, žádný další level |
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
- dig eventy přijímají literal `3`;
- `ChlumScene` je integrační kostra.

### 4. Chlum vertical slice — aktuální etapa

Kanonický balík je issue #29 a jediným implementačním PR je draft PR #33.

- **Runtime baseline:** `777f6513aca45272935bf6f03c607c4453ff8b2e`.
- **Minimální governance baseline:** `65ce1380aa84f1446d05b437fe4ebb50a3660d6c`.
- **Branch point:** aktuální `main` při založení větve; před ready-for-review musí být větev znovu srovnána s aktuálním `main`.
- **Větev:** `agent/chlum-vertical-slice`.
- **PR:** draft #33; žádný vedlejší implementační PR není povolen.
- **Tok:** briefing → povolení Václava → hledání místa → tři rytmické zásahy → jeden nález → traktor → dokončení Chlumu.
- **Výsledek:** `level:complete` používá `levelId: "chlum"`, `nextLevelId: "nesmen"` a aktuální score, ale Nesměň se neimplementuje ani nespouští.

Aktuálně přijatelná rozpracovaná vrstva PR #33:

1. `InteractionSystem`, `DigSystem`, `DangerSystem` a objective vazba jsou v povoleném gameplay rozsahu;
2. Chlum entity, permission dialog a tři finding varianty jsou datově oddělené;
3. `ScreenController` a `HudController` zůstávají obecnými DOM adaptéry bez session autority;
4. skutečné PNG, textury a low-poly GLB soubory mají manifestové rozpočty a metadata;
5. unit testy gameplay, dat a UI procházejí;
6. dokud moduly nejsou v produkčním grafu, zelené CI neprokazuje vertical slice.

Povinné zbývající kroky PR #33:

1. srovnat větev s aktuálním `main` a zachovat governance aktualizace;
2. sjednotit všechny datové `assetId` s jedinou kanonickou sadou ID manifestu;
3. doplnit statický test, že každý `sprite.assetId`, `model.assetId` a finding `assetId` existuje právě jednou v manifestu;
4. instancovat Chlum entity do `World` a bezpečně mapovat stringová datová ID na interní entity ID;
5. napojit pohyb, interakci, danger, dig a objective v závazném fixed-step pořadí `ChlumScene`;
6. aktivovat permission dialog, dig site, tři zásahy, jeden nález, tractor hazard a level completion;
7. doplnit GLTF runtime načtení a model binding pro skutečný traktor a další GLB;
8. prokázat skutečné byte size, PNG rozměry, GLB parse/triangles, pivot/bounds, relativní URL bez 404 a dispose vlastnictví;
9. doplnit end-to-end mobilní browser průchod, portrait/landscape vizuální důkaz a úplný HANDOFF.

Doložená GLTF integrační výjimka:

- bootstrap registruje pouze `json` a `texture`, přestože manifest obsahuje typ `gltf`;
- Chlum data zatím označují traktor jako `sprite`, ačkoli manifest obsahuje `model-chlum-tractor-no-driver`;
- v PR #33 je povolena minimální obecná výjimka pro lokálně připnutý GLTF loader, registraci `gltf`, modelovou factory/binding a nezbytné composition-root zapojení;
- výjimka nesmí vložit quest logiku do bootstrapu ani vytvořit druhý renderer, kameru nebo loop.

Další technické podmínky:

- objective modul musí být explicitně Chlum-only, nebo odvozovat permission flag z kanonických dat; nesmí působit obecně a skrytě hardcodovat `chlumPermission`;
- asset ID v datech a manifestu musí být přesně shodná; současné dvojice `chlum-player`/`player-hunter-walk`, `chlum-farmer-vaclav`/`npc-farmer-vaclav`, `chlum-tractor`/`model-chlum-tractor-no-driver` a finding ID jsou blokující;
- `chlum-dig-marker` musí mít manifestovou položku nebo používat kanonické existující ID;
- položka pojmenovaná `finding-vltavin-besednice` v Chlum balíku vyžaduje přejmenování nebo výslovné zdůvodnění;
- fake-DOM unit test není náhradou browser testu produkční `ChlumScene`.

Zakázané změny:

- druhý renderer, kamera, loop, eventový katalog nebo `GameSession`;
- save/import/export, localStorage, continue nebo inventář;
- implementace Nesměně, Besednice nebo Slávie;
- merge celého PR #20 nebo PR #21;
- vedlejší implementační PR mimo #33.

Akceptační brána:

1. Chlum je dokončitelný od PLAY bez konzole nebo ruční URL;
2. Václavovo povolení vznikne přiblížením a jedním stiskem `AKCE`;
3. kopání dokončí pouze přesně tři úspěšné zásahy a používá kanonické dig eventy;
4. nález se přes `findingId` zapíše právě jednou do `GameSession` a zvýší score;
5. traktor je skutečný čitelný low-poly GLB hazard bez freeze, dvojí akce nebo zablokovaného vstupu;
6. objective se dokončí pouze po povolení, třech zásazích a jednom nálezu;
7. všechny runtime assety mají stabilní a použité ID, relativní URL, rozpočet, pivot/rozměry a dispose vlastníka;
8. syntaxe, celý unit suite, validátor a mobilní browser smoke celého toku jsou zelené;
9. PR obsahuje portrait/landscape vizuální důkaz a HANDOFF podle `AGENTS.md`;
10. existuje stále právě jeden renderer a nevznikl save systém ani inventář.

Teprve po merge issue #29 / PR #33 lze otevřít Nesměň vertical slice.

### 5. Zbývající levely a finále — blokováno Chlumem

Nesměň, Besednice a Slavia se převádějí po jednom v samostatných PR nad sloučeným předchozím stupněm.

## Přidělení práce dalším chatům

Aktivní je pouze implementační chat issue #29 na větvi `agent/chlum-vertical-slice` a draft PR #33. Všechny další Chlum změny musí pokračovat v tomto PR. Před ready-for-review musí být větev srovnána s aktuálním `main`.

Ostatní proudy smějí dodat pouze úzce vyžádanou podporu v témže PR:

1. **Gameplay/data:** čisté systémy, Chlum data a objective testy; bez paralelní session.
2. **Grafika:** Chlum manifest, PNG, GLB, textury a rozpočty; bez gameplay pravidel.
3. **UI/mobil:** obecné HUD/screen/input vazby; bez levelových dat.
4. **QA:** unit/browser testy, asset dostupnost a vizuální důkaz; bez nové funkce.
5. **Architektura:** review a minimální doložená GLTF/modelová integrační výjimka.
6. **Audio/výkon:** samostatný vývoj je do merge Chlumu pozastaven.

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
