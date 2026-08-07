# PROJECT_CONTROL.md — post-release řídicí registr

Revize: **2.14.0 · 7. 8. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`. Historická release evidence níže se nesmí zpětně přepisovat novými post-release změnami.

## 1. Aktuální post-release stav

- Vydaná a formálně certifikovaná verze: **6.0.0**.
- Neměnný release baseline a tag target: `v6.0.0@6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`.
- Výchozí `main` pro tento registrační balík #116: `97828c3973d5c2166a69b94118421dfe9507c0fc`.
- `v6.0.0 → main`: **ahead 1 / behind 0**; jediná post-release změna před tímto registrem je dokumentační PR #120 v `docs/ARCHITECTURE_CONTRACT.md`.
- Aktivní A0 koordinační issue: **#118**.
- Aktivní registrační issue: **#116**.
- Aktivní větev: `agent/post-release-project-control-sync`, vytvořená přesně z `main@97828c3973d5c2166a69b94118421dfe9507c0fc`.
- Tento balík smí změnit pouze `docs/PROJECT_CONTROL.md`; nemění produkt, testy, workflow, assety, manifest, architekturu ani release tag.
- Žádný nový release není aktivní. Post-release dokumentační commity nejsou součástí historicky certifikovaného tagu `v6.0.0` a tag se na ně nesmí posouvat.

## 2. Neměnná release identita v6.0.0

- Finálně certifikovaný SHA: `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`.
- Skutečný git tag: `v6.0.0`, target přesně na certifikovaný SHA.
- GitHub Release: **Lovec vltavínů 6.0.0**.
- Release URL: `https://github.com/rajekroman/lovec-vltavinu/releases/tag/v6.0.0`.
- GitHub Pages: `https://rajekroman.github.io/lovec-vltavinu/`.
- Pages/public mobile smoke: **PASS**.
- Release blocker při uzavření v6.0.0: **žádný**.
- Finální master issue #100: **COMPLETED**.
- Finální certifikační issue #106: **COMPLETED**.
- Release issue #104: **COMPLETED**.
- Umbrella trackery #7 a #8: **COMPLETED**.

Post-release práce nesmí retagovat `v6.0.0`, měnit jeho Release objekt ani vydávat novější `main` za původní certifikovaný release SHA.

## 3. Historická formální certifikace v6.0.0

Certifikace proběhla na jediném nezměněném SHA `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`:

| Fáze | Run ID | Výsledek |
|---|---:|---|
| warm-up | `30601983659` | SUCCESS |
| cert-1 | `30602468712` | SUCCESS |
| cert-2 | `30602880009` | SUCCESS |

V každém běhu byly oba workflow joby SUCCESS. Certifikační kontrakt zahrnoval validátor `0 chyb / 0 varování`, unit `167/167`, renderer ownership `5/5` a Playwright `6/6`, včetně desktop full-flow + čistého restartu, audio lifecycle, iPhone portrait touch/full-flow/lifecycle a iPhone landscape full-flow.

### Certifikační artefakty a digesty

- warm-up static `8782231552`, 5831 B, `sha256:7e8d553132bd10300260f67d16e128c9a124f72aa889f3b45f73f83bba50b645`;
- warm-up Playwright `8782350880`, 32112911 B, `sha256:14d1aa9b34cc6bf70a2462a721161cf2b2d9a83cb1ac6e73495bbad741fcd8a3`;
- cert-1 static `8782396987`, 5839 B, `sha256:d30ea6c79d2e5dfd92cc681e7a80c764d5b59e24b55b35e381bd83f157dac8e1`;
- cert-1 Playwright `8782519777`, 32102538 B, `sha256:c479c652cd83cc7d2248677653d42c942e6435aa50c50ce6995753c9cf7e97e2`;
- cert-2 static `8782539257`, 5855 B, `sha256:0775ce902624fcec6a14f05130e9a197ae1aa5ed90bb1a3010510f26210c9076`;
- cert-2 Playwright `8782664148`, 32070860 B, `sha256:421b505091ba0cd0b77d022e1adf75a6acaac8ebe629d104124337f85d110013`.

Nezávislý A6 audit #114 tuto sérii znovu ověřil jako **PASS** bez blocker/critical vady.

## 4. Ověřený produktový kontrakt v6.0.0

- Produkční vstup je pouze `src/bootstrap.js`.
- Runtime používá ES moduly, Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu in-memory `GameSession`.
- Renderer ownership je staticky vynucen: jediný konstrukční bod `THREE.WebGLRenderer`, žádné produkční `new HybridRenderer`, jediný potomek `ThreeRenderer` a právě jedna instance `ThreeRenderer` v bootstrapu.
- Kanonické kapitoly jsou přesně `chlum → nesmen → besednice → slavia`.
- Průchod končí výsledkem poroty a idempotentním čistým restartem.
- Gameplay stav se neukládá do `localStorage` ani IndexedDB; cílový runtime nemá save systém ani inventářové UI.
- `game.js`, `runtime-stability.js`, Canvas gameplay runtime a legacy save cesta nejsou součástí produkčního stromu.
- Audio se odemyká uživatelským gestem a pokrývá mute/unmute, background/foreground a `pagehide` lifecycle.
- Service worker slouží pouze jako distribuční cache.
- Runtime asset autorita je `assets/manifests/assets.json`; `src/data` nemá paralelní asset registry.

## 5. Finální read-only audity A1–A6

Před release byly proti certifikovanému SHA provedeny samostatné read-only audity:

| Issue | Oblast | Výsledek |
|---|---|---|
| #109 | architektura a runtime invarianty | **PASS** |
| #110 | gameplay/data a průchod kapitolami | **PASS** |
| #111 | assety a manifest | **PASS** |
| #112 | UI a mobilní ovládání | **PASS** |
| #113 | audio, lifecycle a výkon | **PASS** |
| #114 | finální QA a certifikační evidence | **PASS** |

Tyto audity jsou historická release evidence. Nová post-release dokumentační změna je zpětně nemění ani znovu necertifikuje v6.0.0.

## 6. Post-release změny po v6.0.0

### #115 / PR #120 — ARCHITECTURE_CONTRACT sync

Stav: **COMPLETED**.

- base: `main@6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`;
- A1 head: `f0a0c232229ec08edf82327d0c2b7bace3ad9de3`;
- merge / nový main: `97828c3973d5c2166a69b94118421dfe9507c0fc`;
- změněna pouze `docs/ARCHITECTURE_CONTRACT.md` (`+1/-2`);
- odstraněna stale položka `src/data/assets.js`;
- `assets/manifests/assets.json` zapsán jako skutečná manifestová autorita;
- runtime a release baseline beze změny.

Validace PR #120, workflow #1174 / run `31203304631`:
- `Static and unit validation`: SUCCESS;
- validátor `0/0`;
- unit `167/167`;
- renderer ownership `5/5`;
- `Desktop and mobile Playwright matrix`: SUCCESS;
- Playwright `6/6 PASS (8.1m)`;
- static artifact `9003689666`, 5856 B, `sha256:f2b4e81be834ea3652aaa08c088f2909aaace475048cebbb0e162ea0b6dce764`;
- Playwright artifact `9003943435`, 32104424 B, `sha256:29503c73f6122d2b7f6e5ba1fa23a4ca26d97f3979cbad9b825ae9ad893f3e74`.

### #116 — PROJECT_CONTROL post-release sync

Stav: **ACTIVE** v době vytvoření této revize.

- base: `main@97828c3973d5c2166a69b94118421dfe9507c0fc`;
- větev: `agent/post-release-project-control-sync`;
- povolená cesta: pouze `docs/PROJECT_CONTROL.md`;
- účel: převést registr z předrelease revize 2.13.0 na skutečný post-release stav bez produktové změny.

Po integračním přijetí #116 je výsledný merge/head SHA evidován v PR/HANDOFFu a živém A0 issue #118; revize 2.14.0 nesmí předstírat znalost vlastního budoucího merge SHA.

## 7. Stav agentů A0–A7

| Role | Stav | Autoritativní úkol / další povolená akce |
|---|---|---|
| A0 koordinace | **ACTIVE** | #118; dokončit #116 a poté vyhodnotit novou frontu |
| A1 architektura | **COMPLETED / STANDBY** | #115 dokončeno; nová změna pouze přes nové A0 issue |
| A2 gameplay/data | **STANDBY** | žádná větev/commit bez nového reprodukovatelného problému a A0 dispatchu |
| A3 grafika/assety | **STANDBY** | žádná změna bez nového A0 issue |
| A4 UI/mobil | **STANDBY** | žádná změna bez nového A0 issue |
| A5 audio/výkon | **STANDBY** | žádná změna bez nového A0 issue |
| A6 QA | **STANDBY / QA RESERVE** | nový audit/certifikace pouze na explicitní A0 dispatch |
| A7 release | **COMPLETED / RELEASE STANDBY** | #104 historicky completed; nový tag/release pouze přes nový A0 release issue |

## 8. Aktuální integrační pravidla

1. `main` zůstává jediná zveřejnitelná větev.
2. Žádný agent nesmí měnit cizí modul bez konkrétního A0 issue.
3. Nový pracovní balík musí uvést base SHA, větev, povolené cesty, acceptance criteria a testy.
4. Release `v6.0.0` je historicky uzavřený a nesmí se kvůli post-release práci recertifikovat, retagovat ani přepisovat.
5. Dokumentační post-release commit nevytváří novou vydanou verzi hry.
6. A2–A7 zůstávají STANDBY, dokud není doložen konkrétní nový produktový backlog nebo reprodukovatelný incident.
7. Při produkční vadě A0 vytvoří samostatný issue a přiřadí vlastníka podle hranic v `AGENTS.md`; A0 neopravuje cizí feature modul v registračním PR.

## 9. Otevřená fronta po revizi 2.14.0

1. **#116 / A0:** dokončit tento one-file registrační PR, zelené CI, HANDOFF a integraci.
2. **#118 / A0:** po integraci #116 znovu vyhodnotit skutečný backlog.
3. Pokud není doložen nový produktový problém nebo schválený feature cíl, **nevytvářet práci jen kvůli vytížení agentů**; A1–A7 zůstávají STANDBY.
4. Jakýkoli nový release musí mít samostatný release issue, explicitní candidate SHA a vlastní QA/release gate. Nesmí používat `v6.0.0` jako pohyblivý tag.

## 10. Definition of Done post-release governance

Post-release registr je přijat pouze pokud:

- release v6.0.0 historie zůstává auditovatelná a neměnná;
- tag `v6.0.0` stále míří na `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`;
- #100, #106, #104, #7 a #8 jsou evidovány jako completed;
- audity #109–#114 jsou evidovány jako PASS;
- #115 / PR #120 je evidován jako dokončený docs-only post-release sync;
- aktuální role A0–A7 odpovídají živému issue #118;
- diff #116 obsahuje pouze `docs/PROJECT_CONTROL.md`;
- validátor, modulární kontroly, unit testy a existující PR workflow jsou zelené;
- HANDOFF obsahuje base/head SHA, změněné soubory, testy, známé problémy a doporučený další krok.
