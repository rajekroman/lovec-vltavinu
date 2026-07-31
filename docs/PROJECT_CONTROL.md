# PROJECT_CONTROL.md — dokončovací plán, automatická orchestrace a integrační stav

Revize: **2.11.0 · 31. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální stav

- Aktuální `main`: `7518db8ff150be8ef20913b29ffafd1b6ea324be`.
- Verze aplikace: `6.0.0`.
- PR #94 byl sloučen merge commitem `627f8c649feb64ddf592975a79fc654372b97ae2`.
- PR #94 doplnil pouze QA infrastrukturu: browser audio lifecycle smoke, samostatný Playwright projekt a `workflow_dispatch`.
- Workflow #1119 / run `30593243265` na pre-merge headu `f3d35c69ad0ea56d46613ffd0059dcbfdc9025e4`: **SUCCESS**.
- Workflow #1119 ověřil static/unit část a šest Playwright scénářů: audio lifecycle, desktop full-flow, iPhone portrait full-flow, iPhone portrait input/lifecycle a iPhone landscape full-flow.
- Static artifact: `8779115969`; digest `sha256:ff8d39ebeb31c6cdbf7723601949c5f94ada7b9942ff9bfd675fb5722e61efb8`.
- Playwright artifact: `8779262699`; digest `sha256:4db0e6f2a3f307d39dd7b69e4e28dbd4e204f01e3df03b34b78fc850310963de`.
- Issue #92 bylo na výslovný pokyn vlastníka uzavřeno jako `not_planned` bez warm-upu a bez dvou po sobě jdoucích certifikačních běhů na merge SHA.
- Release záznam `docs/releases/v6.0.0-owner-waived.md` byl commitnut přímo do `main` commitem `7518db8ff150be8ef20913b29ffafd1b6ea324be`.
- Issue #95 bylo uzavřeno jako `completed` a eviduje **owner-waived release v6.0.0**.
- Aktuální release SHA `7518db8ff150be8ef20913b29ffafd1b6ea324be` nebyl formálně certifikován podle původní tříběhové sekvence.
- GitHub Release objekt, git tag a nový GitHub Pages deployment nejsou ověřeny.
- Přímý release commit do `main` byl procesní odchylkou od `AGENTS.md`; odchylka je zachována v auditu a nesmí být vydávána za standardní integrační postup.

## 2. Neměnná produktová a architektonická rozhodnutí

- Produkční větev je pouze `main`.
- Produkční vstup je pouze `src/bootstrap.js`.
- Runtime používá ES moduly, Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu in-memory `GameSession`.
- Kanonické kapitoly jsou `chlum → nesmen → besednice → slavia`.
- Kanonický průchod končí finálním výsledkem a čistým restartem.
- Gameplay stav se neukládá do localStorage ani IndexedDB; nevzniká save systém ani inventářové UI.
- `game.js`, `runtime-stability.js`, Canvas gameplay runtime a legacy save cesta nejsou součástí produkčního stromu.
- Service worker smí sloužit pouze jako distribuční cache.
- Release a nasazení smějí vycházet pouze z `main`.

## 3. Stav integračních bran

| Brána | Stav | Důkaz |
|---|---|---|
| 0 — Besednice | DOKONČENA | PR #55 |
| 1 — Slavia | DOKONČENA | PR #63, workflow #899 |
| 2 — vizuální polish | DOKONČENA | PR #76, workflow #1015 |
| 3 — audio/výkon | DOKONČENA S PŮVODNÍM RIZIKEM | PR #87, workflow #1073 |
| 4 — legacy cleanup | DOKONČENA | PR #90, workflow #1096 |
| 5 — finální QA | ADMINISTRATIVNĚ UKONČENA BEZ FORMÁLNÍ CERTIFIKACE | issue #92 `not_planned`; workflow #1119 pouze na pre-merge headu |
| 6 — release | OWNER-WAIVED RELEASE ZAZNAMENÁN | commit `7518db8f…`, issue #95 |

## 4. Stav agentů A0–A7

| Role | Stav | Další povolená akce |
|---|---|---|
| A0 koordinace | **ACTIVE POUZE PRO POST-RELEASE GOVERNANCE** | dokončit issue #96 a governance PR; poté přejít do standby |
| A1 architektura | **STANDBY** | pouze nový konkrétní architektonický incident |
| A2 gameplay/data | **STANDBY** | pouze nový konkrétní gameplay/data incident |
| A3 grafika | **STANDBY** | pouze nový konkrétní assetový incident |
| A4 UI/mobil | **STANDBY** | pouze nový konkrétní UI/input incident |
| A5 audio/výkon | **STANDBY** | pouze nový konkrétní audio/výkon incident |
| A6 QA | **CLOSED — OWNER WAIVER** | znovu aktivovat jen explicitním issue |
| A7 release | **CLOSED — OWNER-WAIVED v6.0.0** | nový release pouze přes nové issue a explicitní A0 aktivaci |

Po merge post-release governance PR nemá žádný agent automaticky aktivní implementační balík. Nová práce musí mít nové kanonické issue, aktuální base SHA, jasné vlastnictví cest a nový HANDOFF.

## 5. Evidence owner-waived release

### Přijaté důkazy

- PR #94 změnil pouze `.github/workflows/validate.yml`, `playwright.config.mjs` a `tests/audio-lifecycle.spec.mjs`.
- Workflow #1119 bylo kompletně zelené na headu `f3d35c69ad0ea56d46613ffd0059dcbfdc9025e4`.
- Browserová sada skončila `6 passed`.
- Audio lifecycle pokryl locked/no-autoplay, gesture unlock, mute/unmute, background/foreground, `pagehide`, dispose a nulové page/HTTP chyby.

### Nepokryté požadavky

- Nebyl proveden warm-up na release SHA `7518db8ff150be8ef20913b29ffafd1b6ea324be`.
- Neběhla dvě po sobě jdoucí kompletní certifikační spuštění stejného release SHA.
- Není ověřen GitHub Release objekt ani git tag.
- Není ověřen nový GitHub Pages deployment.

Tato omezení jsou vědomě přijata vlastníkem projektu. Označení „owner-waived release“ nesmí být zaměněno za plnou certifikaci podle revize 2.10.0.

## 6. Pravidla pro další změny

1. Žádný přímý commit do `main`; každá další změna musí jít přes větev `agent/<jedno-tema>` a draft PR.
2. Produkční incident má přednost před novým rozvojem.
3. Každý nový balík musí uvést issue, roli, base SHA, povolené a zakázané cesty, acceptance criteria, testy a HANDOFF.
4. Bez nového explicitního rozhodnutí se neobnovuje alternativní architektura, save systém, inventář ani druhý renderer.
5. Další release musí jasně rozlišit: testovaný commit, merge commit, tag, GitHub Release objekt a skutečný deployment.
6. Pokud má být další release formálně certifikovaný, musí proběhnout warm-up a dvě po sobě jdoucí kompletní zelená spuštění stejného nezměněného release SHA.

## 7. Post-release governance balík

- Issue: #96.
- Base: `main@7518db8ff150be8ef20913b29ffafd1b6ea324be`.
- Větev: `agent/post-release-governance`.
- Povolená cesta: pouze `docs/PROJECT_CONTROL.md`.
- Zakázáno: produkční kód, testy, workflow, assety, manifesty a release dokumenty.
- Požadovaný výstup: jeden malý draft PR, přesný scope, CI evidence a HANDOFF.
