# PROJECT_CONTROL.md — dokončovací plán, automatická orchestrace a integrační stav

Revize: **2.10.0 · 30. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální ověřený základ

- Ověřený produkční `main` před touto governance revizí: `8a9b1e8747b8f2b3ba9019fed665a9009e2f1d60`.
- Brána 4 / PR #90 byla sloučena do `main` merge commitem `8a9b1e8747b8f2b3ba9019fed665a9009e2f1d60`; issue #88 je uzavřeno.
- A1 head před merge: `f6a6941eacbf3dbb2c6504577525556047bd5f74`.
- Workflow #1096 / run `30579480104` na přesném A1 headu: **SUCCESS**.
- Static validation artifact: `8774021291`; digest `sha256:03ba4449844a52609a30c4c4ed80561372bed6108d61034c1d27eed1204d3655`.
- Playwright artifact: `8774248150`; digest `sha256:3a409531600ab84bc5cfa5419ccc5830e818300bd63958a9035148625f0deb8d`.
- Produkční `index.html` spouští právě jeden modulární `src/bootstrap.js`.
- Aktivní runtime používá Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu in-memory `GameSession`.
- `game.js` a `runtime-stability.js` byly odstraněny; produkční strom neobsahuje druhý Canvas gameplay runtime ani legacy save/persistence cestu.
- Osiřelé continue/records DOM, pasivní JS reference a navázané CSS byly odstraněny bez změny gameplay, scene flow, audia, assetů nebo veřejného průchodu.
- Kanonický průchod je `chlum → nesmen → besednice → slavia → finální výsledek → čistý restart`.
- Historické nebo předčasné PR a větve nejsou integračním základem. Slavia a vizuální polish zůstávají dokončené brány a nesmějí být znovu aktivovány bez konkrétní regrese.
- Samostatný browser audio lifecycle smoke z Brány 3 nebyl dosud dokončen a zůstává povinným bodem finální A6 QA.

## 2. Neměnná rozhodnutí

| Oblast | Závazné rozhodnutí |
|---|---|
| Repozitář | pouze `rajekroman/lovec-vltavinu` |
| Produkční větev | pouze `main` |
| Runtime | ES moduly + Three.js, jeden renderer/kamera/loop/loader/input/session |
| Produkční vstup | pouze `src/bootstrap.js` |
| Simulace | fixed step 60 Hz, max delta 100 ms, max 5 substepů |
| Vizuál | 2D transparentní sprity + low-poly GLB |
| UI | HTML/CSS overlay mimo ECS data |
| Ovládání | směrový vstup + jedno tlačítko `AKCE` |
| Kopání | přesně tři úspěšné zásahy |
| Levely | Chlum → Nesměň → Besednice → Slavia |
| Nálezy | stabilní `findingId`, session score, bez inventáře |
| Persistence | žádný save systém ani localStorage/IndexedDB gameplay stav |
| Assety | manifest-driven preload, relativní URL, budgety, SHA-256 a dispose vlastník |
| Service worker | pouze distribuční cache, žádný gameplay stav |
| Nasazení | relativní cesty, GitHub Pages, release pouze z `main` |

## 3. Automatická orchestrace A1–A7

A0 při každém koordinačním běhu automaticky:

1. ověří aktuální SHA `main`;
2. načte otevřená issues, PR a stav CI;
3. porovná změněné cesty s vlastnictvím pracovních proudů;
4. aktualizuje existující kanonický checkpoint místo zakládání duplicitních vláken;
5. aktivuje pouze první odblokovaný pracovní balík v integračním pořadí;
6. pro nový aktivní balík uvede issue, roli, base SHA, větev, povolené a zakázané cesty, závislosti, acceptance criteria, testy a HANDOFF;
7. blokované role ponechá ve stavu `BLOCKED` nebo `STANDBY` a nevytváří jim předčasný implementační PR.

### Pravidla fronty

- Jeden pracovní balík má jedno kanonické issue a nejvýše jeden kanonický PR.
- Jeden agent nesmí souběžně vytvářet alternativní architekturu nebo druhý finální build.
- Změna přes dvě vlastnické hranice se rozdělí do vrstvených PR, nebo musí být v PR prokázáno, proč ji nelze bezpečně oddělit.
- Support role smí pracovat pouze v úzkém scope přiděleném A0.
- A0 nesmí označit bránu za dokončenou bez merge SHA, zelených relevantních testů a požadovaných důkazů.
- Warm-up se nezapočítává do dvou po sobě jdoucích certifikačních běhů.
- Dvě certifikační spuštění musí používat stejný nezměněný release candidate SHA.
- Jakýkoli commit měnící release candidate ruší dosavadní certifikační sérii a vyžaduje nový warm-up.
- Samostatné chaty nelze spouštět na pozadí; GitHub issue/PR fronta je trvalým zdrojem zadání.

## 4. Aktuální stav agentů

| Role | Stav | Kanonický balík | Automatický spouštěč další akce |
|---|---|---|---|
| A0 koordinace | **ACTIVE** | issue #91, governance po Bráně 4 | review a merge governance PR; zapsat jeho merge SHA do issue #92 a vytvořit A6 větev |
| A1 architektura | **STANDBY — BRÁNA 4 DOKONČENA** | issue #88 a PR #90 uzavřeny | aktivovat pouze při konkrétní architektonické regresi |
| A2 gameplay/data | **STANDBY** | bez samostatného balíku | aktivovat pouze při konkrétním gameplay/data nálezu z review nebo CI |
| A3 grafika | **STANDBY — BRÁNA 2 DOKONČENA** | issue #75 a PR #76 uzavřeny | aktivovat pouze při konkrétní assetové regresi |
| A4 UI/mobil | **STANDBY** | bez samostatného redesignu | aktivovat pouze při konkrétním UI/input nálezu schváleném A0 |
| A5 audio/výkon | **STANDBY — BRÁNA 3 DOKONČENA S RIZIKEM** | issue #84 a PR #87 uzavřeny | případný produkční zásah pouze při konkrétní regresi; lifecycle ověřuje A6 |
| A6 QA | **ACTIVE OD MERGE TÉTO REVIZE** | issue #92; větev `agent/final-qa-certification` | A0 zapíše governance merge SHA, vytvoří větev z tohoto SHA a spustí warm-up |
| A7 release | **BLOCKED** | žádný release balík | aktivovat až po úplném A6 HANDOFFu, audio lifecycle PASS a 2× zeleném stejném SHA |

## 5. Dokončené integrační brány

### Brána 0 — Besednice

- PR #55 byl sloučen.
- Besednice je součástí jediného kanonického průchodu.

### Brána 1 — Slavia

- PR #63 byl sloučen merge commitem `2a75d78e5b30feb2d581cafe1597ad0642b5130e`.
- Workflow #899 byl zelený.
- Slavia je dokončená kapitola, nikoli nový aktivní pracovní proud.

### Brána 2 — vizuální polish

- QA support PR #80 byl sloučen do větve PR #76 merge commitem `5569c2006b383fedc859680233d27a94354e6818`.
- Workflow #1015 / run `30544355160`: **SUCCESS**.
- PR #76 byl sloučen do `main` merge commitem `018ceee477be956a46490638f2fe239c8af5e975`.
- Historická iPhone portrait časová nestabilita není důvodem pro znovuotevření assetového nebo vizuálního vývoje bez nové konkrétní regrese.

### Brána 3 — audio/výkon

- PR #87 byl sloučen do `main` merge commitem `a3301836df0f88fe162ef99d78db7095e1e57548`.
- Workflow #1073 / run `30564013650`: **SUCCESS**.
- Zaveden jeden kanonický gesture-gated `AudioEngine`, manifestový `AudioRegistry` a reprodukovatelné výkonové reporty.
- Přijaté riziko: samostatný browser audio lifecycle smoke nebyl před merge dokončen a je povinnou součástí Brány 5.

### Brána 4 — legacy cleanup

- Governance base před implementací: `75d6e0f99b5877c5933e53d6437506193c6c05ad`.
- A1 head: `f6a6941eacbf3dbb2c6504577525556047bd5f74`.
- PR #90 byl sloučen do `main` merge commitem `8a9b1e8747b8f2b3ba9019fed665a9009e2f1d60`; issue #88 je uzavřeno.
- Odstraněny `game.js`, `runtime-stability.js`, legacy save/localStorage/migrační cesta a osiřelé continue/records UI/CSS vazby.
- Validátor vyžaduje absenci legacy souborů, zakazuje jejich import a kontroluje first-party Canvas2D gameplay cestu bez falešného zásahu do připnutého Three.js vendor modulu.
- Workflow #1096 / run `30579480104`: **SUCCESS**.
- Desktop Chromium, iPhone portrait a iPhone landscape dokončily celý kanonický průchod a čistý restart.

## 6. Aktivní Brána 5 — finální QA

### A6 — issue #92

- Stav nabývá účinnosti merge této governance revize.
- Pre-governance base: `8a9b1e8747b8f2b3ba9019fed665a9009e2f1d60`.
- Release candidate SHA: přesný merge SHA governance PR pro issue #91; A0 jej musí zapsat do issue #92 před prvním QA během.
- Větev: `agent/final-qa-certification`, vytvořit až z přesného governance merge SHA.
- Integrační cíl: certifikace; žádný produkční PR, pokud nejsou nutné úzké test-only změny.

### Povolené cesty

- `tests/**`;
- `tools/**`;
- `.github/**` pouze pro úzké testovací nebo evidenční změny výslovně schválené A0;
- QA/release dokumentace.

### Zakázané změny

- produkční logika, gameplay/data, scény, UI redesign, audio implementace a assety;
- zvýšení timeoutu, gameplay shortcut, mobilní early return nebo zkrácení full-flow bez nové A0 autorizace;
- změna release candidate SHA během certifikační série;
- aktivace A7 před úplným A6 HANDOFFem.

### Povinná certifikační sekvence

1. A0 zapíše přesný governance merge SHA do issue #92 a vytvoří z něj A6 větev.
2. A6 ověří, že větev je proti release SHA `ahead 0 / behind 0`.
3. Proběhne warm-up workflow na tomto SHA; jeho výsledek se nezapočítává do série.
4. Proběhne první úplný zelený certifikační workflow.
5. Bez změny SHA proběhne druhý po sobě jdoucí úplný zelený certifikační workflow.
6. Samostatně nebo v rámci stejné sady projde browser audio lifecycle smoke: locked/no-autoplay → gesture unlock → mute/unmute → background/foreground → pagehide → dispose.
7. A6 zveřejní HANDOFF s run ID, head SHA, artefakty, digesty, browser logy, známými riziky a doporučením pro A7.

### Acceptance criteria

- syntaxe, statický validátor, modular/unit suite: **PASS**;
- desktop Chromium full-flow: **PASS**;
- iPhone portrait full-flow a input reset: **PASS**;
- iPhone landscape full-flow: **PASS**;
- finální výsledek a čistý restart: **PASS**;
- browser audio lifecycle smoke: **PASS**;
- žádné page errors ani produkční HTTP chyby;
- warm-up + dvě po sobě jdoucí zelená spuštění stejného nezměněného SHA;
- úplný A6 HANDOFF.

## 7. Automatické integrační spouštěče

```text
T1. PR #80: zelené CI + besednice-karel 3/3 + přímá obrazová kontrola
    → SPLNĚNO; PR #80 sloučen do větve Brány 2.

T2. PR #76: zelené CI na nezměněném headu + úplný A3 HANDOFF
    → SPLNĚNO; PR #76 sloučen do main jako 018ceee477be956a46490638f2fe239c8af5e975.

T3. Merge Brány 2 do main
    → SPLNĚNO; aktivována Brána 3.

T4. Merge A5 audio/výkon hardeningu
    → SPLNĚNO; PR #87 sloučen jako a3301836df0f88fe162ef99d78db7095e1e57548; aktivována Brána 4.

T5. Merge A1 legacy cleanupu
    → SPLNĚNO; PR #90 sloučen jako 8a9b1e8747b8f2b3ba9019fed665a9009e2f1d60; vytvořena issues #91 a #92.

T6. Merge governance PR pro issue #91
    → A0 zapíše přesný merge SHA do issue #92, vytvoří větev agent/final-qa-certification a aktivuje A6 warm-up.

T7. Warm-up + 2× po sobě zelený stejný SHA + audio lifecycle PASS
    → A0 aktivuje A7 produkční release a GitHub Pages smoke.

T8. Konkrétní gameplay/data, UI/input, assetová nebo architektonická regrese
    → A0 vytvoří úzké issue pro příslušného vlastníka; bez nálezu zůstávají A1–A5 STANDBY.
```

Žádný spouštěč nesmí přeskočit přímou závislost.

## 8. Integrační brány

| Brána | Vlastník | Stav | Podmínka dokončení |
|---|---|---|---|
| 0 — Besednice | A2/A3/A6 | **DOKONČENO** | PR #55 sloučen |
| 1 — Slavia | A2/A3/A4/A6 | **DOKONČENO** | PR #63 sloučen, workflow #899 zelený |
| 2 — vizuální polish | A3, support A6/A7 | **DOKONČENO** | PR #80 → PR #76; merge `018ceee477be956a46490638f2fe239c8af5e975` |
| 3 — audio/výkon | A5, support A1/A6 | **DOKONČENO S EVIDOVANÝM RIZIKEM** | PR #87; lifecycle smoke přesunut do Brány 5 |
| 4 — legacy cleanup | A1 | **DOKONČENO** | PR #90; merge `8a9b1e8747b8f2b3ba9019fed665a9009e2f1d60`; workflow #1096 zelený |
| 5 — finální QA | A6 | **ACTIVE OD MERGE TÉTO REVIZE** | issue #92; warm-up + 2× zelený stejný SHA + audio lifecycle PASS |
| 6 — release | A7, schvaluje A0 | **BLOCKED** | A6 HANDOFF přijat; GitHub Pages produkční smoke a release evidence |

## 9. Povinný formát každého automatického přidělení

```text
Identifikátor úkolu: #<issue>
Role: A<číslo>
Přidělená oblast: <jedna vlastnická oblast>
Base SHA: <přesný commit>
Větev: agent/<jedno-tema>
Povolené cesty: ...
Zakázané cesty: ...
Závislosti: ...
Acceptance criteria: ...
Povinné testy: ...
Integrační cíl: <base větev / PR>
HANDOFF: změny, rozhodnutí, testy, problémy, další krok
```

Bez těchto údajů smí odborný chat pouze analyzovat.

## 10. Kritéria dokončení projektu

Projekt je dokončen pouze tehdy, když:

- všechny čtyři levely tvoří jeden produkční průchod;
- finále vyhodnotí session a umožní čistý restart;
- neexistuje druhý runtime, gameplay persistence ani inventář;
- desktop, iPhone portrait a iPhone landscape projdou E2E;
- stejný release candidate SHA projde po warm-upu dvakrát po sobě;
- odložený browser audio lifecycle smoke projde na release SHA;
- GitHub Pages projde produkčním smoke testem;
- dokumentace odpovídá skutečnému stavu ověřenému přímo přes GitHub.
