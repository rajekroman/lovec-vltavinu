# Řízení a integrace projektu

> Stav k 22. 7. 2026 po integračním review PR #24. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- `main` obsahuje veřejně hratelný Canvas 2D build 5.2, paralelní neaktivní modulární základ 6.0, gameplay/datovou sanaci z PR #23 (`2e678506`) a řídicí aktualizace z PR #25 a #26 (`17affd4`, `880a1f7`).
- Do `main` byly začleněny validační workflow (#9), mobilní stabilizace (#10), Playwright smoke testy (#11), modulární jádro (#12), datové registry (#13), legacy datový adaptér (#15), doménový stav se save migrací (#17), řídicí kontrakty (#22) a čtyřlevelový session-only gameplay kontrakt (#23).
- Nové moduly v `src/` zatím nejsou produkčním bootstrapem načítány z `index.html`; veřejná hra tedy stále běží přes monolitický `game.js`.
- PR #17 řeší save systém, který aktuální hlavní zadání výslovně vylučuje. Kód může dočasně zůstat kvůli historii, ale je zmrazený a nesmí být závislostí cílové hry.
- Kanonické levely jsou nyní v datech přesně `chlum`, `nesmen`, `besednice`, `slavia`. Ločenice není samostatný cílový level.
- Session-only `GameSession` používá nálezy ve tvaru `{ findingId, locality, rarity, weight, score }`. `findingId` je koordinačně potvrzený kanonický identifikátor. Ukázka `findings[].id` v aktuálním `main` se opraví v bootstrap PR #24.
- PR #24 byl čistě rekonstruován nad `main@880a1f7`: odstranil paralelní Chlum gameplay autoritu, používá jediný ortografický renderer a prošel workflow #183. Po integračním review byl vrácen do draftu kvůli třem izolovaným kontraktním opravám: blokování fixed update během async přechodu scény, reset nové session při PLAY a přesná validace tří dig zásahů.
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
| Kopání | tři zásahy do rytmu; dig eventy musí literal `3` striktně validovat |
| Nálezy | session skóre/kolekce bez inventářového UI; ID pole je `findingId` |
| Persistence | žádný nový save systém ani migrace; PLAY zahajuje čistou session |
| Nasazení | relativní cesty a GitHub Pages; `main` zůstává hratelný |

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | Implementováno automaticky, chybí fyzický Safari důkaz | Záznam kompletního průchodu na cílovém iPhonu | Žádný freeze, dvojí akce ani konfliktní overlay |
| CI a validace #2 | Základ sloučen | Rozšířit s novým bootstrapem | Zelený workflow na PR |
| Architektura #3 | PR #24 má čistý bootstrap kandidát; po review opět draft | Opravit async transition guard, nový session reset a exact-three dig event kontrakty | Nový head, nové unit testy, zelený unit/validátor/mobile smoke, mergeable proti aktuálnímu `main` |
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

PR #24 již splnil původní rozsahovou bránu:

- větev je rekonstruována nad `main@880a1f7`;
- produkční HTML spouští jediný `src/bootstrap.js`;
- existuje jeden lokálně připnutý Three.js `WebGLRenderer` s ortografickou kamerou;
- fixed-step parametry jsou 60 Hz, max delta 100 ms a max 5 substepů;
- `ChlumScene` je pouze integrační kostra nad `LEVEL_DEFINITIONS`, `GameSession` a objective evaluátorem;
- nejsou přítomné vlastní `DigSystem`, `InteractionSystem`, `ObjectiveSystem` ani `TractorSystem`;
- workflow #183 prošel.

Před sloučením musí architektonická větev dokončit tři opravy:

1. `GameApp.updateFixed()` nesmí volat žádné scene update fáze, když `SceneManager.transitioning === true`; doplnit test s odloženým async přechodem;
2. PLAY z titulní obrazovky musí před vstupem do Chlumu zahájit čistou session přes `session.reset()` nebo ekvivalent; doplnit regresní test návrat do menu → nový PLAY;
3. eventový kontrakt musí pro `dig:start.requiredHits`, `dig:hit.requiredHits` a `dig:complete.hits` přijímat výhradně hodnotu `3`; doplnit pozitivní i negativní unit testy;
4. po opravách spustit celý unit suite, statický validátor a mobilní browser smoke;
5. aktualizovat HANDOFF a vrátit PR z draftu až nad novým zeleným headem.

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
