# PROJECT_CONTROL.md — dokončovací plán, automatická orchestrace a integrační stav

Revize: **2.6 · 30. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální ověřený základ

- Aktuální ověřená špička `main`: `a6621648dcec6cd6431820c07f2eee514490442b`.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`.
- Aktivní runtime používá Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu `GameSession`.
- Kanonický průchod je `chlum → nesmen → besednice → slavia → finální výsledek → čistý restart`.
- PR #63 byl sloučen merge commitem `2a75d78e5b30feb2d581cafe1597ad0642b5130e`; issue #61 je uzavřeno.
- Governance PR #74 byl sloučen merge commitem `a6621648dcec6cd6431820c07f2eee514490442b`.
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
| A0 koordinace | **ACTIVE** | issue #81, governance a integrační rozhodnutí | kontrola každého nového commitu, CI výsledku nebo HANDOFFu |
| A1 architektura | **BLOCKED** | žádný aktivní implementační balík | aktivovat legacy cleanup až po merge Brány 2 a audio/výkon hardeningu |
| A2 gameplay/data | **STANDBY** | bez samostatného balíku | aktivovat pouze při konkrétním gameplay/data nálezu z review nebo CI |
| A3 grafika | **ACTIVE** | issue #75, PR #76, větev `agent/gate2-visual-polish` | po merge QA vrstvy dokončit Bránu 2 a dodat finální vizuální HANDOFF |
| A4 UI/mobil | **STANDBY** | bez samostatného redesignu | aktivovat pouze při konkrétním UI/input nálezu schváleném A0 |
| A5 audio/výkon | **BLOCKED** | Brána 3 zatím bez issue | vytvořit samostatné issue okamžitě po merge PR #76 |
| A6 QA | **ACTIVE SUPPORT** | issue #79, PR #80, větev `agent/gate2-besednice-qa` | opravit portrait helper, získat screenshotovou matici 3/3 a zelené CI |
| A7 release | **BLOCKED** | žádný release balík | aktivovat až po finálním QA na potvrzeném release SHA |

## 5. Aktivní Brána 2

### A3 — issue #75 / PR #76

- Cíl: celoproduktový vizuální polish bez změny gameplay, architektury nebo UI/input kontraktů.
- Aktuální head po cache integraci: `3e5a756ff57b8b34ce7fb7e60cbf1507b17d03bf`.
- Produkční změna zavádí samostatnou manifestovou identitu Karla pro Besednici.
- A3 assety, manifest a `sw.js` jsou během A6 QA vrstvy zmrazené.
- PR #76 zůstává `Draft / CHANGES REQUIRED`, dokud není přijata QA vrstva a screenshotová matice.

### A6 support — issue #79 / PR #80

- Base: `agent/gate2-visual-polish@3e5a756ff57b8b34ce7fb7e60cbf1507b17d03bf`.
- Aktuální head: `646ce0c0a02900514a97af709cc41bcf83872011`.
- Změny jsou povoleny pouze v `tests/**`.
- Workflow #955: statická a unit validace zelená; browser matice `4 passed / 1 failed`.
- Desktop a iPhone landscape vytvořily `besednice-karel`; iPhone portrait selhal již v Chlumu.
- Potvrzená kořenová příčina: pohybový monitor používá toleranci `18`, zatímco závěrečné usazení připouští `36`; portrait skončil s odchylkou přibližně `32,33` a byl chybně označen za timeout.
- A6 musí sjednotit toleranci, znovu spustit celý workflow a dodat třetí skutečný portrait screenshot. Pouhé další zvýšení timeoutu není přijatelná oprava.

## 6. Automatické integrační spouštěče

```text
T1. PR #80: zelené CI + besednice-karel 3/3 + přímá obrazová kontrola
    → A0 review a merge PR #80 do agent/gate2-visual-polish.

T2. PR #76: zelené CI na nezměněném headu + úplný A3 HANDOFF
    → A0 převede PR #76 na Ready, provede finální review a merge Brány 2.

T3. Merge Brány 2 do main
    → A0 automaticky vytvoří A5 issue, base SHA, větev a acceptance criteria pro Bránu 3.

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
| 2 — vizuální polish | A3, support A6/A7 | **ACTIVE** | PR #80 → PR #76, CI zelené, screenshoty 3/3 |
| 3 — audio/výkon | A5, support A1/A6 | **BLOCKED** | aktivace po merge Brány 2 |
| 4 — legacy cleanup | A1, ověření A6 | **BLOCKED** | aktivace po merge Brány 3 |
| 5 — finální QA | A6 | **BLOCKED** | warm-up + 2× zelený stejný release SHA |
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
