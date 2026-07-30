# PROJECT_CONTROL.md — dokončovací plán, automatická orchestrace a integrační stav

Revize: **2.7 · 30. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální ověřený základ

- Aktuální ověřená špička `main`: `018ceee477be956a46490638f2fe239c8af5e975`.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`.
- Aktivní runtime používá Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu `GameSession`.
- Kanonický průchod je `chlum → nesmen → besednice → slavia → finální výsledek → čistý restart`.
- PR #63 byl sloučen merge commitem `2a75d78e5b30feb2d581cafe1597ad0642b5130e`; issue #61 je uzavřeno.
- Governance PR #74 byl sloučen merge commitem `a6621648dcec6cd6431820c07f2eee514490442b`.
- QA support PR #80 byl sloučen do větve Brány 2 merge commitem `5569c2006b383fedc859680233d27a94354e6818`; issue #79 je uzavřeno.
- Brána 2 / PR #76 byla sloučena do `main` merge commitem `018ceee477be956a46490638f2fe239c8af5e975`; issue #75 je uzavřeno.
- Historické nebo předčasné PR a větve nejsou integračním základem. Aktivní dokončovací frontu tvoří pouze explicitně uvedené issues a jejich větve.

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
| Persistence | žádný save systém ani localStorage gameplay stav |
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

- Jeden pracovní balík má jedno kanonické issue a jeden kanonický PR.
- Jeden agent nesmí souběžně vytvářet alternativní architekturu nebo druhý finální build.
- Změna přes dvě vlastnické hranice se rozdělí do vrstvených PR.
- Support role smí pracovat pouze v úzkém scope přiděleném A0.
- A0 nesmí označit bránu za dokončenou bez merge SHA, zelených relevantních testů a požadovaných důkazů.
- Automatická orchestrace znamená automatické přidělení při každém A0 běhu. Samostatné chaty nelze spouštět na pozadí bez nového běhu, proto je GitHub issue/PR fronta trvalým zdrojem zadání.

## 4. Aktuální stav agentů

| Role | Stav | Kanonický balík | Automatický spouštěč další akce |
|---|---|---|---|
| A0 koordinace | **ACTIVE** | issue #81, governance a integrační rozhodnutí | dokončit governance zápis Brány 2 a poté aktivovat první odblokovaný balík |
| A1 architektura | **BLOCKED** | žádný aktivní implementační balík | aktivovat legacy cleanup až po merge audio/výkon hardeningu |
| A2 gameplay/data | **STANDBY** | bez samostatného balíku | aktivovat pouze při konkrétním gameplay/data nálezu z review nebo CI |
| A3 grafika | **STANDBY — BRÁNA 2 DOKONČENA** | issue #75 a PR #76 uzavřeny | aktivovat pouze při konkrétní assetové regresi |
| A4 UI/mobil | **STANDBY** | bez samostatného redesignu | aktivovat pouze při konkrétním UI/input nálezu schváleném A0 |
| A5 audio/výkon | **NEXT — ČEKÁ NA AKTIVACI** | Brána 3 zatím bez issue | po sloučení této governance revize vytvořit issue, base SHA, větev a acceptance criteria |
| A6 QA | **STANDBY** | issue #79 a PR #80 uzavřeny | support pro Bránu 3 pouze na výslovné A0 zadání; finální QA až po legacy cleanupu |
| A7 release | **BLOCKED** | žádný release balík | aktivovat až po finálním QA na potvrzeném release SHA |

## 5. Dokončená Brána 2

### A3 — issue #75 / PR #76

- Produkční změna zavedla samostatný manifestový asset `npc-rival-karel` pro Besednici.
- Poškozený PNG byl korektně vyrastrován z kanonického SVG; úplný decode, alpha bounds, budget a SHA-256 kontrakt prošly.
- `sw.js` obsahuje pouze distribuční cache položku nového assetu; nevznikl gameplay stav ani persistence.
- A3 head před integrací QA: `3e2c9ce1a3d2cfbe338967400c559529f70bb4fe`.

### A6 support — issue #79 / PR #80

- A6 změnil pouze `tests/mobile-smoke.spec.mjs` a `tests/slavia-smoke.spec.mjs`.
- QA head: `32e0730e4a3d21ee2136499ad52bc220aa2e01d0`.
- PR #80 byl sloučen do větve PR #76 merge commitem `5569c2006b383fedc859680233d27a94354e6818`.

### Konsolidované ověření a merge

- Workflow #1015 / run `30544355160` na headu `5569c2006b383fedc859680233d27a94354e6818`: **SUCCESS**.
- Static and unit validation: **SUCCESS**.
- Desktop and mobile Playwright matrix: **SUCCESS**.
- Desktop Chromium, iPhone portrait a iPhone landscape dokončily plný čtyřlevelový průchod, finální výsledek a čistý restart.
- Playwright artifact: `8760291164`; digest `sha256:ca79b0a69da6b2e1d3faf86cf241a5bedf8fa72784a3c0dea654055b51565d41`.
- Přímá obrazová kontrola `besednice-karel.png`: 3/3 PASS; hráč a celý Karel jsou rozlišitelní.
- PR #76 byl sloučen do `main` merge commitem `018ceee477be956a46490638f2fe239c8af5e975`.
- Brána 2 nemá známý integrační blocker.

## 6. Automatické integrační spouštěče

```text
T1. PR #80: zelené CI + besednice-karel 3/3 + přímá obrazová kontrola
    → SPLNĚNO; PR #80 sloučen do větve Brány 2.

T2. PR #76: zelené CI na nezměněném headu + úplný A3 HANDOFF
    → SPLNĚNO; PR #76 sloučen do main jako 018ceee477be956a46490638f2fe239c8af5e975.

T3. Merge Brány 2 do main
    → AKTIVNÍ; po sloučení této governance revize A0 vytvoří A5 issue, base SHA, větev a acceptance criteria pro Bránu 3.

T4. Merge A5 audio/výkon hardeningu
    → A0 automaticky vytvoří A1 issue pro Bránu 4 — legacy runtime cleanup.

T5. Merge A1 legacy cleanupu
    → A0 aktivuje A6 finální QA na přesném release SHA.

T6. Warm-up + dvě po sobě jdoucí zelená spuštění stejného nezměněného SHA
    → A0 aktivuje A7 produkční release a GitHub Pages smoke.

T7. Konkrétní gameplay/data nebo UI/input regrese
    → A0 vytvoří úzké issue pro A2 nebo A4; bez nálezu zůstávají STANDBY.
```

Žádný spouštěč nesmí přeskočit přímou závislost.

## 7. Integrační brány

| Brána | Vlastník | Stav | Podmínka dokončení |
|---|---|---|---|
| 0 — Besednice | A2/A3/A6 | **DOKONČENO** | PR #55 sloučen |
| 1 — Slavia | A2/A3/A4/A6 | **DOKONČENO** | PR #63 sloučen, workflow #899 zelený |
| 2 — vizuální polish | A3, support A6/A7 | **DOKONČENO** | PR #80 → PR #76; merge `018ceee477be956a46490638f2fe239c8af5e975` |
| 3 — audio/výkon | A5, support A1/A6 | **NEXT — ČEKÁ NA AKTIVACI** | A5 issue a větev až po merge této governance revize |
| 4 — legacy cleanup | A1, ověření A6 | **BLOCKED** | aktivace po merge Brány 3 |
| 5 — finální QA | A6 | **BLOCKED** | aktivace po merge Brány 4; warm-up + 2× zelený stejný release SHA |
| 6 — release | A7, schvaluje A0 | **BLOCKED** | GitHub Pages produkční smoke a release evidence |

## 8. Povinný formát každého automatického přidělení

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

## 9. Kritéria dokončení projektu

Projekt je dokončen pouze tehdy, když:

- všechny čtyři levely tvoří jeden produkční průchod;
- finále vyhodnotí session a umožní čistý restart;
- neexistuje druhý runtime, gameplay persistence ani inventář;
- desktop, iPhone portrait a iPhone landscape projdou E2E;
- stejný release head projde po warm-upu dvakrát po sobě;
- GitHub Pages projde produkčním smoke testem;
- dokumentace odpovídá skutečnému stavu ověřenému přímo přes GitHub.
