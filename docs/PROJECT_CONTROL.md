# PROJECT_CONTROL.md — dokončovací plán, automatická orchestrace a integrační stav

Revize: **2.12.0 · 31. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální stav

- Výchozí produkční `main`: `d03a2468e4d1788f1cc3b5537ebc79bd432bc3eb`.
- Verze aplikace: `6.0.0`.
- Aktivní kanonický dokončovací balík: issue #100.
- Aktivní formální QA evidence: issue #98.
- Pracovní větev: `agent/final-project-completion`.
- Produkční kód, testy, workflow a assety se v dokončovacím balíku nemění; mění se pouze aktuální projektová a uživatelská dokumentace.
- Přesný release candidate je neměnný head dokončovacího PR a musí být zapsán do issue #100 i #98 před přijetím warm-upu.
- Historický owner-waived release v6.0.0 zůstává auditním faktem, dokud není dokončena nová tříběhová certifikační sekvence.

## 2. Ověřená produktová verze

- Produkční vstup je pouze `src/bootstrap.js`.
- Runtime používá ES moduly, Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu in-memory `GameSession`.
- Kanonické kapitoly jsou přesně `chlum → nesmen → besednice → slavia`.
- Kanonický průchod končí výběrem tří kamenů, výsledkem poroty a čistým restartem.
- Gameplay stav se neukládá do `localStorage` ani IndexedDB; nevzniká save systém ani inventářové UI.
- `game.js`, `runtime-stability.js`, Canvas gameplay runtime a legacy save cesta nejsou součástí produkčního stromu.
- Audio se odemyká uživatelským gestem a má lifecycle obsluhu pro mute/unmute, pozadí, návrat a `pagehide`.
- Service worker slouží pouze jako distribuční cache.
- Aplikace používá relativní URL a je připravena pro statické nasazení z kořene GitHub Pages.

## 3. Stav integračních bran

| Brána | Stav | Důkaz |
|---|---|---|
| 0 — Besednice | DOKONČENA | PR #55 |
| 1 — Slavia | DOKONČENA | PR #63, workflow #899 |
| 2 — vizuální/content polish | DOKONČENA | PR #76, workflow #1015 |
| 3 — audio/výkon | DOKONČENA | PR #87, workflow #1073 |
| 4 — legacy cleanup | DOKONČENA | PR #90, workflow #1096 |
| 5 — QA infrastruktura | DOKONČENA | PR #94, workflow #1119 |
| 6 — post-release governance | DOKONČENA | PR #97, workflow #1124 |
| 7 — formální certifikace | AKTIVNÍ | issue #98, issue #100 |
| 8 — finální release/deployment evidence | BLOCKED CERTIFIKACÍ | po třech zelených bězích stejného SHA |

## 4. Stav agentů A0–A7

| Role | Stav | Další povolená akce |
|---|---|---|
| A0 koordinace | **ACTIVE — ISSUE #100** | dokončovací PR, certifikační orchestrace, integrace a finální HANDOFF |
| A1 architektura | **STANDBY** | pouze konkrétní reprodukovatelná architektonická vada |
| A2 gameplay/data | **STANDBY** | pouze konkrétní reprodukovatelná gameplay/data vada |
| A3 grafika | **STANDBY** | pouze konkrétní reprodukovatelná assetová vada |
| A4 UI/mobil | **STANDBY** | pouze konkrétní reprodukovatelná UI/input vada |
| A5 audio/výkon | **STANDBY** | pouze konkrétní reprodukovatelná audio/výkon vada |
| A6 QA | **ACTIVE — ISSUE #98** | warm-up, cert-1, cert-2 a úplný QA HANDOFF |
| A7 release | **BLOCKED** | odblokovat až po A0 přijetí úplné A6 certifikace |

A0 nesmí opravovat produkční vadu v cizím modulu. Pokud certifikace odhalí blocker nebo critical defect, A0 vytvoří konkrétní pod-issue, určí vlastníka, base SHA, povolené cesty, acceptance criteria a nový testovací reset.

## 5. Poslední přijatá evidence

### PR #94 / workflow #1119

- pre-merge head: `f3d35c69ad0ea56d46613ffd0059dcbfdc9025e4`;
- static/unit: PASS;
- Playwright: `6 passed` včetně audio lifecycle;
- static artifact: `8779115969`;
- static digest: `sha256:ff8d39ebeb31c6cdbf7723601949c5f94ada7b9942ff9bfd675fb5722e61efb8`;
- Playwright artifact: `8779262699`;
- Playwright digest: `sha256:4db0e6f2a3f307d39dd7b69e4e28dbd4e204f01e3df03b34b78fc850310963de`.

### PR #97 / workflow #1124

- PR head: `b3fad1b34827aefdc3f5fca010f70c7e32c3d914`;
- static/unit: PASS;
- desktop/mobile Playwright matrix: PASS;
- static artifact: `8779901784`;
- static digest: `sha256:7c156c5a7fe64c7370bf3dcafd7e8f2c0ca2cddfa5774c25221db3d3ec3dd26d`;
- Playwright artifact: `8780017864`;
- Playwright digest: `sha256:cabc62863c1c159540a594f15e890a168a8650482692075c7113dbe01b2597ca`.

Tyto běhy dokazují funkčnost před dokončovacím balíkem, ale nenahrazují novou tříběhovou certifikaci aktuálního release candidate.

## 6. Závazná certifikační sekvence

1. Dokončovací PR určí jediný release candidate SHA.
2. **Warm-up:** první kompletní workflow na přesném SHA; nezapočítává se.
3. **Cert-1:** bezprostředně následující kompletní zelený workflow na stejném SHA.
4. **Cert-2:** další bezprostředně následující kompletní zelený workflow na stejném SHA.
5. Mezi běhy nesmí vzniknout commit ani změna testů, workflow, timeoutů, retries, assetů nebo produkčního kódu.
6. Každý běh musí obsahovat:
   - `Static and unit validation`;
   - `Desktop and mobile Playwright matrix`;
   - `6/6` Playwright scénářů včetně audio lifecycle;
   - `static-validation-report` s digestem;
   - `playwright-report` s digestem.
7. Změna SHA nebo jakákoli oprava resetuje celou sérii.

## 7. Integrační metoda finálního SHA

- Dokončovací změna vzniká na `agent/final-project-completion` a je kontrolována v draft PR.
- Po třech přijatých bězích musí být do `main` integrován přesně certifikovaný head SHA bez změny stromu.
- A0 smí použít pouze non-force fast-forward ref update po dokončeném PR review, protože běžný merge commit by vytvořil jiné, necertifikované SHA.
- Tento fast-forward není náhradní přímá implementace: všechny změny vznikají na pracovní větvi, mají issue, PR, review, CI a HANDOFF.

## 8. Release a deployment

Finální A7 krok musí rozlišit:

- certifikovaný commit SHA;
- výsledný tip `main`;
- git tag;
- GitHub Release objekt;
- veřejný GitHub Pages deployment a jeho otestovanou URL.

Projekt nesmí být označen jako plně vydaný, dokud není alespoň certifikovaný SHA na `main` a není přesně popsán stav veřejného deploymentu. Chybějící oprávnění k vytvoření tagu, GitHub Release nebo Pages deploymentu se eviduje jako externí release blocker, nikoli jako funkční vada hry.

## 9. Historické trackery

Po přijetí formální certifikace A0 uzavře nebo označí:

- #64 a #65 jako nahrazené finální QA implementací PR #94 a issue #98;
- #19 jako `not_planned`, protože alternativní Vite/TypeScript MVP není integrační základ;
- #5 a #6 jako completed podle dokončených vizuálních a audio/výkon bran;
- #7 a #8 až po finálním release/deployment HANDOFFu;
- #98 jako completed po úplném A6 HANDOFFu;
- #100 jako completed jako poslední projektový checkpoint.

## 10. Definition of Done projektu

Projekt je hotový pouze tehdy, když:

- README a řídicí registr odpovídají skutečné v6.0.0;
- hra je dosažitelná z titulní obrazovky a dokončitelná po finální výsledek;
- funguje desktop, iPhone portrait, iPhone landscape, pauza, otočení, background/foreground, audio lifecycle a čistý restart;
- validátor, unit testy a šest Playwright scénářů projdou ve třech předepsaných bězích stejného SHA;
- nevznikl save systém, inventář ani druhý renderer;
- není otevřený blocker nebo critical defect;
- certifikovaný SHA je na `main`;
- stav tagu, GitHub Release a veřejného deploymentu je ověřen nebo přesně označen jako externí blocker;
- issue #98 a #100 obsahují úplné HANDOFFy.
