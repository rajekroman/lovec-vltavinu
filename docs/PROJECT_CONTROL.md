# Řízení a integrace projektu

> Stav k 22. 7. 2026 po integraci issue #4. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- `main` obsahuje veřejně hratelný Canvas 2D build 5.2, paralelní neaktivní modulární základ 6.0, gameplay/datovou sanaci z PR #23 (`2e678506`) a řídicí aktualizaci z PR #25 (`17affd4`).
- Do `main` byly začleněny validační workflow (#9), mobilní stabilizace (#10), Playwright smoke testy (#11), modulární jádro (#12), datové registry (#13), legacy datový adaptér (#15), doménový stav se save migrací (#17), řídicí kontrakty (#22) a čtyřlevelový session-only gameplay kontrakt (#23).
- Nové moduly v `src/` zatím nejsou produkčním bootstrapem načítány z `index.html`; veřejná hra tedy stále běží přes monolitický `game.js`.
- PR #17 řeší save systém, který aktuální hlavní zadání výslovně vylučuje. Kód může dočasně zůstat kvůli historii, ale je zmrazený a nesmí být závislostí cílové hry.
- Kanonické levely jsou nyní v datech přesně `chlum`, `nesmen`, `besednice`, `slavia`. Ločenice není samostatný cílový level.
- Session-only `GameSession` používá nálezy ve tvaru `{ findingId, locality, rarity, weight, score }`. `findingId` je koordinačně potvrzený kanonický identifikátor; případná ukázka `findings[].id` v architektonickém dokumentu se musí opravit v architektonickém proudu, ne obcházet aliasem.
- Draft PR #24 obsahuje kandidátní Three.js bootstrap, ale stále také vlastní hard-coded Chlum gameplay autoritu. Před integrací se musí aktualizovat z nového `main`, zúžit na platformní bootstrap a odstranit duplikovaná pravidla questů, kopání, objective postupu a hazardů.
- Draft PR #20 zůstává pouze donor jednotlivých částí. Nesmí být sloučen jako celek.
- PR #21 je oddělený kandidátní asset pack pro Chlum. Runtime zapojení patří až do samostatného Chlum vertical slice po integraci bootstrapu.

## Rozhodnutí, která se znovu neotevírají

| Oblast | Závazné rozhodnutí |
|---|---|
| Rendering | Three.js/WebGL, jeden renderer, ortografická kamera |
| Vizuální skladba | 2D transparentní sprity + low-poly GLB |
| UI | HTML/CSS overlay, žádné herní DOM elementy uvnitř ECS komponent |
| Architektura | ES moduly, scene manager, asset loader, input manager, ECS-lite, kolize, animace |
| Simulace | fixed timestep 60 Hz, max delta 100 ms, max 5 substepů, interpolovaný render |
| Ovládání | směrový vstup + jedno kontextové akční tlačítko |
| Kopání | tři zásahy do rytmu |
| Nálezy | session skóre/kolekce bez inventářového UI; ID pole je `findingId` |
| Persistence | žádný nový save systém ani migrace |
| Nasazení | relativní cesty a GitHub Pages; `main` zůstává hratelný |

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | Implementováno automaticky, chybí fyzický Safari důkaz | Záznam kompletního průchodu na cílovém iPhonu | Žádný freeze, dvojí akce ani konfliktní overlay |
| CI a validace #2 | Základ sloučen | Rozšířit s novým bootstrapem | Zelený workflow na PR |
| Architektura #3 | Core moduly sloučeny; PR #24 blokován rozsahem | Zúžený `src/bootstrap.js` + TitleScene + integrační kostra Chlum scény bez vlastní gameplay autority | Rebase na aktuální `main`, který obsahuje řídicí merge `17affd4`; jednotný renderer, žádná duplikace gameplay |
| Gameplay #4 | Dokončeno v PR #23, issue uzavřena | Pouze integrační podpora pro navazující scény | Zachovat čtyři kanonické levely, session-only stav a unit testy |
| Grafika #5 | PR #21 dodává izolovaný Chlum asset pack | Grafický audit manifestu a assetů | Rozpočty, pivoty, průhlednost, načtení bez 404; runtime až v Chlum slice |
| Audio/výkon #6 | Legacy audio funguje | Oddělený AudioEngine a mobilní výkonový profil | Audio po gestu, bezpečný resume, stabilní FPS |
| QA/release #7 | Smoke základ sloučen | Bootstrap smoke a později end-to-end průchod čtyř levelů | Desktop + iPhone portrait/landscape |
| Master #8 | Aktivní | Udržovat pořadí, rozhodnutí a blokace PR | Žádný paralelní release mimo frontu |

## Integrační fronta

### 1. Řídicí kontrakt — dokončeno

`AGENTS.md`, `ARCHITECTURE_CONTRACT.md`, `PROJECT_CONTROL.md` a PR šablona byly zavedeny v PR #22.

### 1a. Karanténa snapshotu 0.15.0 — platí

- PR #20 a issue #19 slouží pouze jako dohledatelný zdroj kandidátních částí.
- Snapshot není splněná integrační etapa ani náhrada aktuálního `main`.
- Nepřenášet jeho alternativní modulový strom, perspektivní kameru, eventový katalog ani ECS komponenty s Three.js objekty.

### 2. Sanace datového rozsahu — dokončeno

PR #23 byl sloučen jako `2e678506` a issue #4 byla uzavřena.

- `LEVEL_ORDER = ["chlum", "nesmen", "besednice", "slavia"]`;
- session-only `GameSession` žije pouze v paměti;
- nálezy používají `findingId` a automaticky se započítávají do skóre;
- žádná inventářová správa, persistence, migrace ani nový renderer;
- objective data používají jediné kontextové tlačítko a dig cíle vyžadují přesně tři zásahy.

### 3. Produkční bootstrap — aktuální etapa

Architektonická větev musí přepracovat PR #24:

1. aktualizovat větev z aktuálního `main`, který obsahuje minimálně gameplay merge `2e678506` a řídicí merge `17affd4`;
2. zachovat jediný lokálně připnutý Three.js `WebGLRenderer`, ortografickou kameru a fixed-step loop;
3. ponechat composition root `src/bootstrap.js`, TitleScene, HTML/CSS adaptéry a pouze integrační kostru Chlum scény;
4. odstranit nebo přesunout vlastní hard-coded permission/dig/finding/objective/tractor tok;
5. používat sloučené `LEVEL_DEFINITIONS`, `GameSession` a objective evaluátory místo paralelního stavu;
6. opravit normativní ukázku session finding na `findingId` v architektonickém kontraktu;
7. prokázat zelený unit, validátor a mobilní browser smoke bez regrese veřejného buildu.

### 4. Chlum vertical slice — až po bootstrapu

Samostatný navazující PR nad sloučeným bootstrapem. Kompletní tok:
briefing → povolení zemědělce → hledání/kopání → tři rytmické zásahy → nález → vyhnutí traktoru → dokončení.

Musí používat kanonická data a `GameSession`; nesmí vracet hard-coded druhou gameplay autoritu do scény.

### 5. Zbývající levely a finále

Každý level se převádí samostatným PR a musí mít vlastní briefing, riziko, dokončitelný cíl a mobilní smoke scénář.

## Přidělení práce dalším chatům

Každému chatu zadat pouze jeden z následujících balíků:

1. **Architektura:** bootstrap, scény a eventové kontrakty. Bez změn assetů a questů.
2. **Gameplay/data:** čtyři levely, session state, objective testy. Bez rendereru a save.
3. **Grafika:** asset manifest, sprity, GLB, textury a rozpočty. Bez gameplay logiky.
4. **UI/mobil:** HUD adapter, safe-area a vstupní vazby. Bez levelových dat.
5. **Audio/výkon:** AudioEngine, komprese, DPR/LOD a měření. Bez vizuálního redesignu.
6. **QA:** unit/browser testy, Pages kontrola a release report. Bez nové funkce.

## Formát hlášení chatu

```text
Větev: agent/<tema>
Issue: #<číslo>
Změněné soubory: ...
Změněné kontrakty: žádné / přesný seznam
Testy: příkaz + výsledek
Mobilní ověření: zařízení, orientace, výsledek
Známé limity: ...
PR: <odkaz>
```

Výstup bez větve a PR se nepovažuje za integrovatelný.
