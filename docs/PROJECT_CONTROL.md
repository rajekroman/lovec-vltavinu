# PROJECT_CONTROL.md — finální certifikační a release registr

Revize: **2.13.0 · 31. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální ověřený stav

- Produkční základ před finálním registračním commitem: `main@732e876123b5c57dcc2fed170912c544f8d416fe`.
- Verze aplikace: `6.0.0`.
- Master dokončovací issue: #100.
- Aktivní finální QA issue: #106.
- Aktivní A0 větev: `agent/final-certification-register`.
- Aktivní release issue: #104.
- Přesný release candidate je jediný head této větve po commitu revize 2.13.0; A0 jej zapisuje do issue #106 a do draft PR před přijetím warm-upu.
- V certifikačním balíku se mění pouze tento registr. Produkční kód, testy, workflow, timeouty, retries, assety a manifesty se nemění.
- Historická certifikace issue #98 zůstává auditním důkazem pouze pro SHA `3b38dad059973a8f74697a3eeac7241015802fc6`; nepokrývá novější PR #102 ani PR #105.

## 2. Ověřená produktová verze

- Produkční vstup je pouze `src/bootstrap.js`.
- Runtime používá ES moduly, Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu in-memory `GameSession`.
- Renderer ownership je staticky vynucen nad produkčním importním grafem: jediný konstrukční bod `THREE.WebGLRenderer`, žádné produkční `new HybridRenderer`, jediný potomek `ThreeRenderer` a právě jedna instance `ThreeRenderer` v bootstrapu.
- Kanonické kapitoly jsou přesně `chlum → nesmen → besednice → slavia`.
- Průchod končí výsledkem poroty a idempotentním čistým restartem; rychlý dvojitý tap nesmí vytvořit duplicitní reset ani scene lifecycle.
- Gameplay stav se neukládá do `localStorage` ani IndexedDB; nevzniká save systém ani inventářové UI.
- `game.js`, `runtime-stability.js`, Canvas gameplay runtime a legacy save cesta nejsou součástí produkčního stromu.
- Audio se odemyká uživatelským gestem a má lifecycle obsluhu pro mute/unmute, background/foreground a `pagehide`.
- Service worker slouží pouze jako distribuční cache a aplikace používá relativní URL pro GitHub Pages.

## 3. Integrační brány

| Brána | Stav | Důkaz |
|---|---|---|
| Besednice | DOKONČENA | PR #55 |
| Slavia | DOKONČENA | PR #63 |
| vizuální/content polish | DOKONČENA | PR #76 |
| audio/výkon | DOKONČENA | PR #87 |
| legacy cleanup | DOKONČENA | PR #90 |
| QA infrastruktura | DOKONČENA | PR #94 |
| post-release governance | DOKONČENA | PR #97 |
| historická certifikace | DOKONČENA, HISTORICKÁ | issue #98, SHA `3b38dad…` |
| restart integrity | DOKONČENA | PR #102, merge `e94bb096…` |
| renderer ownership | DOKONČENA | PR #105, merge `732e876…` |
| finální registr | AKTIVNÍ | issue #100, větev `agent/final-certification-register` |
| finální certifikace | RESERVED / AKTIVACE PO PR HEADU | issue #106 |
| Pages, tag a Release | BLOCKED CERTIFIKACÍ | issue #104 |

## 4. Stav agentů A0–A7

| Role | Stav | Další povolená akce |
|---|---|---|
| A0 koordinace | **ACTIVE — #100** | dokončit registrační PR, přijmout tři běhy, fast-forward a finální HANDOFF |
| A1 architektura | **COMPLETED / STANDBY** | pouze nový konkrétní reprodukovatelný blocker |
| A2 gameplay/data | **COMPLETED / STANDBY** | pouze nový konkrétní reprodukovatelný blocker |
| A3 grafika | **STANDBY** | žádný aktivní assetový balík |
| A4 UI/mobil | **STANDBY** | žádný aktivní UI/input balík |
| A5 audio/výkon | **STANDBY** | žádný aktivní audio/výkonový balík |
| A6 QA | **RESERVED / #106** | warm-up → cert-1 → cert-2 na jediném nezměněném headu |
| A7 release | **BLOCKED / #104** | až po přijetí A6 certifikace a integraci kandidáta do `main` |

Pokud certifikace odhalí blocker nebo critical defect, A0 vytvoří samostatný pod-issue, určí vlastníka, base SHA, povolené cesty, acceptance criteria a resetuje celou sérii. A0 neopravuje produkční vadu v cizím modulu bez samostatného issue.

## 5. Poslední přijatá evidence před finální sérií

### PR #102 — restart integrity

- změněna pouze `src/scenes/SlaviaScene.js` (`+3/-0`);
- merge SHA: `e94bb0964a0a80edbe9040143188f40164dc1a77`;
- workflow run `30598560969`;
- oba joby SUCCESS;
- Playwright `6 passed (8.1m)`;
- static artifact `8781036882`, digest `sha256:7a4839ff2a37c4663e3d29fd4ef451af5beafa6024b31ed3b42ddb12ec382d6c`;
- Playwright artifact `8781163602`, digest `sha256:7be9c309646da5f614a4773fc22c2da3c69a40503b695a97f4e73a87e865030d`.

### PR #105 — renderer ownership

- efektivní diff: pouze `docs/ARCHITECTURE_CONTRACT.md`, `tests/unit/renderer-ownership.test.mjs`, `tools/validate.mjs`;
- merge SHA: `732e876123b5c57dcc2fed170912c544f8d416fe`;
- workflow #1164 / run `30601200908`;
- `Static and unit validation`: SUCCESS;
- validátor: `0 chyb / 0 varování`;
- unit testy: `167/167 PASS`;
- renderer ownership testy: `5/5 PASS`;
- `Desktop and mobile Playwright matrix`: SUCCESS;
- Playwright: `6 passed (7.8m)`;
- static artifact `8781960736`, digest `sha256:2252ce8c3ec8bde05bac6be5ee30f5a3fccef5c2210be03c9c85ea460246815b`;
- Playwright artifact `8782082714`, digest `sha256:86e3918525877a217c3e7e8d7f59de75810b953848f7b27187959fee603a1ee5`.

Tyto důkazy potvrzují jednotlivé integrované změny, ale nenahrazují tříběhovou certifikaci finálního registračního headu.

## 6. Závazná finální certifikační sekvence

1. A0 otevře jeden draft PR z `agent/final-certification-register` do `main`; jeho head je jediný release candidate.
2. **Warm-up:** první kompletní PR workflow na přesném headu; nezapočítává se do ostré dvojice.
3. **Cert-1:** bezprostředně následující kompletní zelený workflow stejného SHA.
4. **Cert-2:** další bezprostředně následující kompletní zelený workflow stejného SHA.
5. Mezi běhy nesmí vzniknout commit ani změna testů, workflow, timeoutů, retries, assetů, manifestů nebo produkčního kódu.
6. Každý běh musí obsahovat:
   - `Static and unit validation` SUCCESS;
   - validátor `0 chyb / 0 varování`;
   - úplnou unit sadu PASS;
   - `Desktop and mobile Playwright matrix` SUCCESS;
   - Playwright `6/6` včetně audio lifecycle;
   - `static-validation-report` s ID, velikostí a digestem;
   - `playwright-report` s ID, velikostí a digestem.
7. Jakýkoli FAIL, CANCELLED nebo změna SHA resetuje celou sérii.
8. Úplná evidence patří do issue #106 a souhrnné přijetí do issue #100.

## 7. Integrace certifikovaného kandidáta

- Certifikační změna vzniká pouze na `agent/final-certification-register` a je kontrolována v draft PR.
- Po přijetí warm-upu, cert-1 a cert-2 musí být do `main` integrován přesně certifikovaný head SHA bez změny stromu.
- A0 použije non-force fast-forward ref update po scope review a úplném A6 HANDOFFu; běžný merge nebo squash by vytvořil jiný necertifikovaný SHA.
- Po integraci musí compare kandidát vs. `main` vrátit `identical`, ahead `0`, behind `0`.

## 8. Release a deployment

A7 issue #104 smí pokračovat až po splnění sekce 7. Finální release musí rozlišit:

- certifikovaný commit SHA;
- výsledný tip `main`;
- tag `v6.0.0` a jeho target;
- GitHub Release objekt;
- GitHub Pages deployment SHA;
- veřejnou HTTPS URL a produkční smoke test.

Starý SHA `3b38dad…` se nesmí použít pro nový tag, Release ani deployment evidence. Chybějící oprávnění k Pages, tagu nebo Release se eviduje jako externí release blocker, nikoli jako funkční vada hry.

## 9. Historické trackery

- #5, #6, #19, #64, #65 a #98 zůstávají uzavřené podle předchozích integračních rozhodnutí.
- #103 je completed po merge PR #105.
- #7 a #8 zůstávají pasivní umbrella trackery a uzavřou se až po A7 HANDOFFu.
- #106 se uzavře po úplném A6 HANDOFFu a A0 přijetí série.
- #104 se uzavře po Pages, veřejném smoke, tagu a GitHub Release objektu.
- #100 se uzavře jako poslední projektový checkpoint.

## 10. Definition of Done projektu

Projekt je hotový pouze tehdy, když:

- README a tento registr odpovídají skutečné v6.0.0;
- hra je dosažitelná z titulní obrazovky a dokončitelná po finální výsledek;
- funguje desktop, iPhone portrait, iPhone landscape, pauza, otočení, background/foreground, audio lifecycle a čistý restart;
- validátor, unit testy a šest Playwright scénářů projdou ve třech předepsaných bězích stejného finálního SHA;
- nevznikl save systém, inventář, druhý renderer, druhý canvas ani paralelní loop;
- není otevřený blocker nebo critical defect;
- certifikovaný SHA je identický s `main`;
- Pages, tag, GitHub Release a veřejný smoke jsou ověřeny nebo přesně označeny jako externí blocker;
- issue #106, #104 a #100 obsahují úplné HANDOFFy.
