# Řízení a integrace projektu

> Stav k 22. 7. 2026 po sloučení produkčního bootstrap PR #24. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Závazný integrační základ je `main@777f6513aca45272935bf6f03c607c4453ff8b2e`, squash merge PR #24.
- Produkční `index.html` nyní spouští jediný modulární `src/bootstrap.js`; aktivním runtime je Three.js verze 6.0 s jedním `WebGLRenderer` a ortografickou kamerou.
- PR #24 sloučil transition-safe fixed update, čistý session start při PLAY, striktní literal `3` u dig eventů, kanonický katalog eventů a mobilní regresní testy.
- Gameplay/datová sanace z PR #23 zůstává závazná: levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód mohou v repozitáři dočasně zůstat pouze jako zmrazené historické soubory. Produkční bootstrap je nesmí importovat.
- PR #20 zůstává pouze donor jednotlivých částí a nesmí být sloučen jako celek.
- PR #21 je starý nemergeable donor Chlum assetů nad `main@1837c7b`. Vybrané assety se mohou přenést nebo znovu vytvořit pouze v novém Chlum balíku nad aktuálním `main`; PR #21 se neslučuje samostatně.
- Jediným aktivním implementačním balíkem integrační etapy 4 je issue #29: samostatný Chlum Three.js vertical slice na větvi `agent/chlum-vertical-slice` nad `main@777f6513`.

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
| CI a validace #2 | Základ a bootstrap smoke sloučeny | Rozšířit o celý Chlum tok a asset kontrolu | Zelený workflow na PR #29 |
| Architektura #3 | Produkční bootstrap dokončen v PR #24 | Pouze integrační podpora při doloženém defectu | `src/core`, `src/render` a `src/bootstrap.js` se v Chlum PR běžně nemění |
| Gameplay #4 | Čtyřlevelová data a session-only stav dokončeny | Chlum gameplay systémy a objective tok v issue #29 | Žádná paralelní session nebo levelová data |
| Grafika #5 | PR #21 je donor Chlum assetů | Vybrané assety integrovat přímo v issue #29 nad aktuálním `main` | Manifest, rozpočty, pivoty, dispose, bez 404 |
| Audio/výkon #6 | Samostatný nový AudioEngine dosud není aktivní etapa | Bez rozšíření Chlum balíku, kromě minimálních již existujících hooků | Žádný nový audio redesign v PR #29 |
| QA/release #7 | Bootstrap smoke sloučen | Unit a mobilní end-to-end smoke celého Chlumu | iPhone viewport, portrait/landscape, pauza a background návrat |
| Chlum vertical slice #29 | **Aktuální integrační etapa** | Jeden samostatný draft PR z `agent/chlum-vertical-slice` | Kompletní Chlum, zelené testy, vizuální důkaz, žádný další level |
| Master #8 | Aktivní | Udržovat pořadí, rozhodnutí a blokace PR | Žádný paralelní release mimo frontu |

## Integrační fronta

### 1. Řídicí kontrakt — dokončeno

`AGENTS.md`, `ARCHITECTURE_CONTRACT.md`, `PROJECT_CONTROL.md` a PR šablona byly zavedeny v PR #22.

### 1a. Karanténa snapshotu 0.15.0 — platí

- PR #20 a issue #19 slouží pouze jako dohledatelný zdroj jednotlivých kandidátních částí.
- Snapshot není integrační etapa ani náhrada aktuálního `main`.
- Nepřenášet jeho alternativní strom, perspektivní kameru, eventový katalog ani ECS komponenty s Three.js objekty.

### 2. Sanace datového rozsahu — dokončeno

PR #23 byl sloučen jako `2e678506` a issue #4 byla uzavřena.

- `LEVEL_ORDER = ["chlum", "nesmen", "besednice", "slavia"]`;
- session-only `GameSession` žije pouze v paměti;
- nálezy používají `findingId` a automaticky se započítávají do skóre;
- žádná inventářová správa, persistence, migrace ani nový renderer;
- objective data používají jediné kontextové tlačítko a dig cíle vyžadují přesně tři zásahy.

### 3. Produkční bootstrap — dokončeno

PR #24 byl sloučen jako `777f6513`.

- produkční HTML spouští jediný `src/bootstrap.js`;
- existuje jeden lokálně připnutý Three.js `WebGLRenderer` s ortografickou kamerou;
- fixed-step parametry jsou 60 Hz, max delta 100 ms a max 5 substepů;
- fixed scene updates neběží během async transition;
- PLAY resetuje session před vstupem do Chlumu;
- dig eventy přijímají u požadovaných polí výhradně literal `3`;
- `ChlumScene` je zatím pouze integrační kostra;
- workflow #202 a odpovídající unit/mobile regrese prošly.

### 4. Chlum vertical slice — aktuální etapa

Kanonický balík je issue #29.

- **Základ:** `main@777f6513aca45272935bf6f03c607c4453ff8b2e`.
- **Větev:** `agent/chlum-vertical-slice`.
- **Výstup:** jeden samostatný draft PR do `main`.
- **Tok:** briefing → povolení zemědělce Václava → hledání vhodného místa → tři rytmické zásahy → jeden zapsaný nález → vyhnutí traktoru → dokončení Chlumu.
- **Session výsledek:** `level:complete` používá `levelId: "chlum"`, `nextLevelId: "nesmen"` a aktuální score, ale PR nesmí implementovat ani spouštět Nesměň.

Povolené změny:

1. čisté gameplay systémy v `src/gameplay` pro interakci, kopání, danger a objective vazbu;
2. Chlum data/entity/dialog definice v `src/data` bez změny čtyřlevelového pořadí;
3. `src/scenes/ChlumScene.js` jako orchestrace lifecycle a systémů, nikoli druhá session autorita;
4. vybrané Chlum PNG/GLB/textury a manifestová data převzatá nebo znovu vytvořená z PR #21;
5. minimální obecné doplnění existujících HUD/screen adaptérů;
6. unit, statické a mobilní browser testy potřebné k prokázání celého toku.

Zakázané změny:

- bez doloženého integračního defectu neměnit `src/core`, `src/ecs`, `src/render` ani `src/bootstrap.js`;
- nevytvářet druhý renderer, kameru, loop, eventový katalog nebo `GameSession`;
- nepřidávat save/import/export, localStorage, continue ani inventář;
- neimplementovat Nesměň, Besednici ani Slávii;
- neslučovat celý PR #20 nebo PR #21 a nepoužívat jejich starý base jako základ.

Akceptační brána:

1. Chlum je dokončitelný od PLAY bez konzole nebo ruční URL;
2. Václavovo povolení vznikne přiblížením a jedním stiskem `AKCE`;
3. kopání dokončí pouze přesně tři úspěšné zásahy a používá kanonické dig eventy;
4. nález se přes `findingId` zapíše právě jednou do `GameSession` a zvýší score;
5. traktor je čitelný hazard a nezpůsobí freeze, dvojí akci ani zablokovaný vstup;
6. objective se dokončí pouze po povolení, třech zásazích a jednom nálezu;
7. všechny runtime assety mají stabilní ID, relativní URL, rozpočet, pivot/rozměry a dispose vlastníka;
8. syntaxe, celý unit suite, validátor a mobilní browser smoke jsou zelené;
9. PR obsahuje portrait/landscape vizuální důkaz a HANDOFF podle `AGENTS.md`;
10. existuje stále právě jeden renderer a nevznikl save systém ani inventář.

Teprve po merge issue #29 lze otevřít samostatný Nesměň vertical slice.

### 5. Zbývající levely a finále — blokováno Chlumem

Nesměň, Besednice a Slavia se převádějí po jednom, každý v samostatném PR nad sloučeným předchozím stupněm. Každý musí mít vlastní briefing, riziko, dokončitelný cíl a mobilní smoke scénář.

## Přidělení práce dalším chatům

Aktuálně je povolen pouze implementační chat pro issue #29. Musí pracovat z `main@777f6513` na větvi `agent/chlum-vertical-slice` a nesmí současně otevírat další level nebo alternativní architekturu.

Ostatní proudy smějí dodat pouze review nebo úzce vyžádanou integrační podporu:

1. **Gameplay/data:** čisté systémy, Chlum data a objective testy; bez rendereru a save.
2. **Grafika:** pouze Chlum manifest, sprity, GLB, textury a rozpočty; bez gameplay pravidel.
3. **UI/mobil:** pouze obecné HUD/screen/input vazby nutné pro Chlum; bez levelových dat.
4. **QA:** unit/browser testy, asset dostupnost a vizuální důkaz; bez nové funkce.
5. **Architektura:** pouze review; produkční bootstrap a core se považují za zmrazené.
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