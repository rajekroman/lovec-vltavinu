# Řízení a integrace projektu

> Stav k 22. 7. 2026 po sloučení gameplay/data PR #23. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- `main` obsahuje veřejně hratelný Canvas 2D build 5.2 a paralelní, zatím neaktivní modulární základ 6.0.
- Do `main` byly začleněny validační workflow (#9), mobilní stabilizace (#10), Playwright smoke testy (#11), modulární jádro (#12), datové registry (#13), legacy datový adaptér (#15), doménový stav se save migrací (#17) a gameplay/data sanace (#23).
- PR #23 byl squash sloučen jako `2e6785065ec21fd2e1966032d3c2a3baf0a14987`; issue #4 je dokončena.
- `main` nyní obsahuje čtyři kanonické definice `chlum → nesmen → besednice → slavia`, session-only `GameSession`, objective evaluátory a validační testy povinných targetů.
- Nové moduly v `src/` zatím nejsou produkčním bootstrapem načítány z `index.html`; veřejná hra tedy stále běží přes monolitický `game.js`.
- PR #17 řeší save systém, který aktuální hlavní zadání výslovně vylučuje. Kód může dočasně zůstat kvůli historii, ale je zmrazený a nesmí být závislostí cílové hry.
- Ločenice není samostatný cílový level. Starší pětilevelová data jsou legacy-only a nesmějí se vrátit do cílového registru.
- Draft PR #20 uchovává úplný alternativní Three.js snapshot 0.15.0. Integrační audit jej zařadil pouze jako donor jednotlivých částí: jeho CI je červené a kamera, moduly, eventy, ECS i asset manifest se rozcházejí s tímto řídicím kontraktem. PR #20 se nesmí sloučit jako celek.
- PR #21 je oddělený kandidátní asset pack pro Chlum se zeleným CI. Nemění aktivní runtime a sám neodemkne bootstrap ani Chlum vertical slice; před sloučením vyžaduje kontrolu grafického proudu #5.
- Draft PR #24 je po integraci #23 datově odblokován, ale v aktuálním rozsahu zůstává neintegrovatelný: musí být aktualizován z nového `main` a zbaven vlastní gameplay autority.

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
| Nálezy | session skóre/kolekce bez inventářového UI |
| Identifikátor nálezu | Kanonické pole je `findingId`; nevytvářet alias `id` ani migrační vrstvu |
| Persistence | žádný nový save systém ani migrace |
| Nasazení | relativní cesty a GitHub Pages; `main` zůstává hratelný |

## Aktuální integrační rozhodnutí

1. Gameplay/data etapa #4 je dokončena PR #23 a nesmí být znovu implementována v architektonické větvi.
2. `findingId` je závazný název v session i eventovém payloadu. Ukázka `findings[].id` v `ARCHITECTURE_CONTRACT.md` je dokumentační nesoulad k opravě architektonickým proudem, nikoli podporovaná druhá varianta.
3. PR #24 musí před novým auditem vycházet z `main` po commitu `2e678506`, používat `LEVEL_DEFINITIONS`, `GameSession` a objective evaluátory a odstranit vlastní pravidla questů, kopání, hazardů a dokončení.
4. Produkční bootstrap se integruje před Chlum vertical slice. Jeden PR nesmí současně nahrazovat bootstrap a zavádět alternativní gameplay autoritu.

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | Implementováno automaticky, chybí fyzický Safari důkaz | Záznam kompletního průchodu na cílovém iPhonu | Žádný freeze, dvojí akce ani konfliktní overlay |
| CI a validace #2 | Základ sloučen | Rozšířit až s novým bootstrapem | Zelený workflow na PR |
| Architektura #3 | Core moduly sloučeny, nejsou zapojeny; PR #24 vyžaduje zúžení | Rebased `src/bootstrap.js`, jediný renderer, TitleScene a integrační kostra Chlumu bez vlastní questové autority | Stávající veřejný build nesmí regredovat; zelený nový CI běh |
| Gameplay #4 | Dokončeno v PR #23 / `2e678506` | Žádná paralelní reimplementace; pouze spotřebování dat bootstrapem a pozdějším Chlum slice | Čtyři kanonické levely, session-only stav a unit testy zůstávají zelené |
| Grafika #5 | PR #21 dodává první izolovaný Chlum asset pack se zeleným CI | Zkontrolovat a případně sloučit manifest + 11 PNG/GLB assetů z PR #21 | Rozpočty, pivoty, průhlednost, načtení bez 404; runtime zapojení až v Chlum slice |
| Audio/výkon #6 | Legacy audio funguje | Oddělený AudioEngine a mobilní výkonový profil | Audio po gestu, bezpečný resume, stabilní FPS |
| QA/release #7 | Smoke základ sloučen | End-to-end průchod čtyř levelů + Pages ověření | Desktop + iPhone portrait/landscape |
| Master #8 | Aktivní; etapa 2 dokončena, PR #24 vrácen k rebase a rozdělení | Udržovat pořadí, odkazy na PR, rozhodnutí `findingId` a karanténu snapshotu #20 | Žádný paralelní release mimo frontu |

## Integrační fronta

### 1. Řídicí kontrakt

Sloučit tento dokument, `AGENTS.md`, architektonický kontrakt a PR šablonu. Tím dostanou všechny další chaty stejné mantinely.

### 1a. Karanténa snapshotu 0.15.0

- PR #20 a issue #19 slouží pouze jako dohledatelný zdroj kandidátních částí.
- Snapshot není splněná integrační etapa ani náhrada aktuálního `main`.
- Nepřenášet jeho alternativní modulový strom, perspektivní kameru, eventový katalog ani ECS komponenty s Three.js objekty.
- Jednotlivé datové, grafické, UI, audio nebo testovací části lze převzít pouze v příslušném pracovním proudu, po úpravě na závazné kontrakty a se zelenými testy.
- Před jakýmkoli release musí nový kořenový bootstrap odpovídat skutečnému GitHub Pages zdroji; commitnutý `dist` sám o sobě nasazení nemění.

### 2. Sanace datového rozsahu — DOKONČENO

Dokončeno PR #23, squash commit `2e6785065ec21fd2e1966032d3c2a3baf0a14987`:

- session-only `GameSession` žije pouze v paměti;
- levely jsou sjednoceny na Chlum → Nesměň → Besednice → Malše/KD Slavia;
- nálezy se automaticky sčítají přes `{ findingId, locality, rarity, weight, score }`;
- neexistují inventářové operace ani nové napojení na legacy save;
- objective testy ověřují platné dokončení, předčasnou blokaci a dosažitelnost povinných targetů.

### 3. Produkční bootstrap — AKTUÁLNÍ ETAPA

- aktualizovat architektonickou větev z `main` po PR #23;
- načíst lokálně připnutou verzi Three.js;
- vytvořit `bootstrap.js`, HTML canvas a HUD adapter;
- registrovat scény `title` a `chlum`; ostatní levely zatím nesmí předstírat dokončenou migraci;
- zapojit existující `GameLoop`, `SceneManager`, `InputManager`, `World`, kolize a animace v předepsaném pořadí;
- spotřebovat sloučená gameplay data, ale nevytvářet v bootstrap PR vlastní questovou, dig, hazard nebo objective autoritu;
- PR #24 se nesmí sloučit před rebased/zúženým diffem a novým zeleným CI během.

### 4. Chlum vertical slice

Kompletní tok: briefing → povolení zemědělce → hledání/kopání → tři rytmické zásahy → nález → vyhnutí traktoru → dokončení. Použije skutečný sprite hráče, unikátní NPC a low-poly traktor. Vznikne jako samostatný PR až po sloučení produkčního bootstrapu.

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
