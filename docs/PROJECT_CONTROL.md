# PROJECT_CONTROL.md — dokončovací plán a integrační stav

Revize: **2.3 · 23. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální ověřená realita

- Aktuální `main` je `92c13c78f602c80e6625adfaa839b077b8d0d356`, merge governance PR #68.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`.
- Aktivní runtime používá Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop a jednu `GameSession`.
- Kanonické levely jsou `chlum`, `nesmen`, `besednice`, `slavia`.
- Chlum, Nesměň a Besednice jsou sloučené a regresně chráněné.
- Slavia / KD Slavia je aktivní v issue #61 a draft PR #63 na větvi `agent/slavia-vertical-slice`.
- Aktuální Slavia head je `547369cce50b6237df6cd0283b57aee138133e09`; workflow `Validate game` #811 je zelené.
- Zelené workflow #811 zatím není důkaz kompletního vertical slice: Slavia není registrovaná v produkčním bootstrapu, Besednice stále vrací hráče do titulního menu a PR neobsahuje input-driven E2E průchod Slavie.
- Větev PR #63 je vůči `main` `ahead_by: 34`, `behind_by: 1`; před finálním review musí bezpečně převzít aktuální `main` bez force-push.
- A6 připravuje pouze QA infrastrukturu v draft PR #66 na headu `14b5412a02a6d5b6efe8b3c29a73f53b1f9ca5ec`; workflow #752 je zelené, ale certifikace nebyla zahájena a započtené běhy jsou 0.
- Předčasné PR #58 a PR #59 jsou uzavřené bez merge. Jejich větve nejsou integračním základem.
- Starý draft PR #20 je nekanonický snapshot a nesmí být sloučen ani použit jako nový základ.

## 2. Neměnná rozhodnutí

| Oblast | Závazné rozhodnutí |
|---|---|
| Repozitář | pouze `rajekroman/lovec-vltavinu` |
| Produkční větev | pouze `main` |
| Runtime | ES moduly + Three.js, jeden renderer/kamera/loop/session |
| Produkční vstup | pouze `src/bootstrap.js` |
| Simulace | fixed step 60 Hz, max delta 100 ms, max 5 substepů |
| Vizuál | 2D transparentní sprity + low-poly GLB |
| UI | HTML/CSS overlay mimo ECS data |
| Ovládání | směrový vstup + jedno tlačítko `AKCE` |
| Kopání | přesně tři úspěšné zásahy |
| Levely | Chlum → Nesměň → Besednice → Slavia |
| Nálezy | stabilní `findingId`, session score, bez inventáře |
| Persistence | žádný save systém ani localStorage gameplay stav |
| Assety | manifest-driven preload, lokální GLTFLoader r185 |
| Nasazení | relativní cesty, GitHub Pages, release pouze z `main` |

## 3. Stav pracovních proudů

| Role / balík | Stav | Přijímaný výstup | Integrační brána |
|---|---|---|---|
| A0 koordinace #69 | **ACTIVE** | governance-only záznam A0 review | pouze `docs/PROJECT_CONTROL.md` |
| A1 architektura | **STANDBY** | pouze samostatný hardening nebo pozdější legacy cleanup | bez změny architektury během Slavie |
| A2 Slavia #61 / PR #63 | **RUNNING / DRAFT / CHANGES REQUIRED** | produkční registrace, přechod, finále a restart | celý tok Besednice → Slavia → výsledek → restart |
| A3 Slavia asset pack #61 / PR #63 | **ACTIVE SUPPORT** | KD Slavia assety, manifest, rozpočty a vizuální důkaz | bez gameplay a UI změn |
| A4 UI/mobil #61 / PR #63 | **ACTIVE SUPPORT** | výsledkový adaptér a mobilní čitelnost | portrait/landscape, safe-area, input release |
| A5 audio/výkon | **BLOCKED** | žádný samostatný redesign | aktivovat až po merge Slavie a Bráně 2 |
| A6 QA #65 / PR #66 | **INFRASTRUCTURE READY / CERTIFICATION BLOCKED** | desktop + iPhone portrait + landscape matice | finální release SHA nepotvrzen; 0 započtených běhů |
| A7 release | **BLOCKED** | žádný release | až po finálním QA |
| Brána 2 vizuální polish | **BLOCKED** | samostatný A3 balík | aktivovat až po merge Slavie |
| Legacy cleanup | **BLOCKED** | odstranění starého runtime | až po zeleném čtyřlevelovém průchodu |

## 4. Integrační brány

### Brána 0 — Besednice — DOKONČENO

- PR #55 byl sloučen jako `e137fe389bfd04b9402298b371df13e24fd38104`.
- Ověřený feature head byl `3ae2cceb0b57ac61b628c2ef45d9f09c26360bb9`.
- Workflow #691 prošlo.
- Produkční tok končí `level:complete(nextLevelId: "slavia")`, ale přechod do Slavie musí dodat Brána 1.

### Brána 1 — Slavia / KD Slavia vertical slice — AKTIVNÍ, CHANGES REQUIRED

- Issue: #61.
- Draft PR: #63.
- Původní branch point: `36e75a97725481a2c4f296a3ea46ca22dd75dbbf`.
- Aktuální `main`: `92c13c78f602c80e6625adfaa839b077b8d0d356`.
- Aktuální head: `547369cce50b6237df6cd0283b57aee138133e09`.
- Větev: `agent/slavia-vertical-slice`.
- Vlastník: A2.
- Podpora: A3 assety/manifest, A4 UI adaptér, A6 testy.
- Workflow #811: success; nepostačuje k merge, protože současná matice neověřuje produkční dosažitelnost Slavie.

Kanonický průchod:

```text
dokončená Besednice
→ briefing Malše / KD Slavia
→ rozpoznatelná budova
→ registrace sbírky
→ znalec / porota
→ vyhodnocení findingů a score
→ finální výsledek „Na Zelené Vlně“
→ čistý restart session
```

#### Ověřené hotové části

1. deterministické `SlaviaEvaluation` nad daty `GameSession`;
2. datový kontrakt Slavie;
3. testovatelný objective flow;
4. Slavia scéna;
5. KD Slavia asset pack, manifestové budgety, SHA-256 a dispose vlastnictví;
6. zelená statická a unit validace na headu `547369c...`.

#### Blokátory merge

1. `src/bootstrap.js` Slavia scénu neimportuje, nevytváří ani neregistruje;
2. bootstrap debug snapshot a export neobsahují Slavia instanci;
3. `BesedniceScene.showResult()` stále používá tlačítko `ZPĚT DO MENU` a `app.changeScene("title")`;
4. chybí produkční `app.changeScene("slavia")` podle již zavedeného vzoru Nesměň → Besednice;
5. chybí input-driven E2E průchod Slavie na desktopu, iPhone portrait a iPhone landscape;
6. chybí důkaz finálního výsledku, čistého restartu a uvolněného vstupu po overlayi, orientaci a background/foreground;
7. větev je o jeden commit za aktuálním `main`;
8. hlavní popis PR neodpovídá aktuálnímu headu a nemá úplný finální HANDOFF.

#### Povinná oprava v PR #63

- bezpečně synchronizovat větev s aktuálním `main` bez force-push;
- registrovat Slavia scénu v jediném bootstrapu;
- napojit přechod Besednice → Slavia;
- doplnit observační debug snapshot pouze pro QA, bez druhého runtime;
- doplnit desktop, portrait a landscape E2E;
- aktualizovat hlavní popis PR, testovací artefakty a A2/A3/A4 HANDOFF;
- ponechat PR jako draft, dokud všechny podmínky neprojdou na stejném headu.

### Brána 2 — celoproduktový obsahový a vizuální polish — BLOKOVÁNO

Vlastník A3. Aktivace až po merge Brány 1 a nové aktualizaci tohoto dokumentu. Uzavřený PR #58 lze použít jen jako zdroj jednotlivých assetů po novém přidělení; nesmí být dodatečně sloučen.

### Brána 3 — audio a výkonový hardening — BLOKOVÁNO

Vlastník A5, podpora A1/A6. Aktivovat až po Bráně 2. Uzavřený PR #59 lze použít jen jako zdroj jednotlivých částí po novém issue a novém branch pointu.

### Brána 4 — legacy runtime cleanup — BLOKOVÁNO

Vlastník A1, ověření A6. Aktivovat až po zeleném produkčním průchodu všech čtyř levelů.

### Brána 5 — finální QA — BLOKOVÁNO

Vlastník A6. PR #66 zatím pouze připravuje infrastrukturu. Certifikace začne až po potvrzení finálního release SHA A0. První běh je warm-up a nezapočítává se; potom musí následovat dvě kompletní zelená spuštění stejného nezměněného SHA. Současný počet započtených běhů je 0.

### Brána 6 — produkční release — BLOKOVÁNO

Vlastník A7, schvaluje A0. Release pouze z `main` po zeleném finálním QA a smoke skutečné GitHub Pages URL.

## 5. Aktivní integrační pořadí

```text
1. Brána 0 / Besednice — dokončeno
2. Governance PR #68 — dokončeno (`main@92c13c78f602c80e6625adfaa839b077b8d0d356`)
3. A0 governance issue #69 — aktivní
4. Brána 1 / Slavia issue #61, PR #63 — changes required
5. Brána 2 / A3 celoproduktový polish — blokováno
6. Brána 3 / A5 audio a výkon — blokováno
7. Brána 4 / A1 legacy cleanup — blokováno
8. Brána 5 / A6 finální QA — blokováno
9. Brána 6 / A7 release — blokováno
```

Žádná brána nesmí přeskočit přímou závislost.

## 6. Pravidla aktivace odborného chatu

A0 vždy uvede issue, roli, base SHA, větev, povolené a zakázané cesty, závislosti, acceptance criteria, povinné testy a integrační pořadí. Bez těchto údajů smí odborný chat pouze analyzovat.

## 7. Kritéria dokončení projektu

Projekt je dokončen pouze tehdy, když všechny čtyři levely tvoří jeden produkční průchod, finále vyhodnotí session a umožní čistý restart, neexistuje druhý runtime ani gameplay persistence, tři cílové profily projdou E2E, stejný release head projde dvakrát po sobě po nezapočítaném warm-upu, GitHub Pages projde produkčním smoke testem a dokumentace odpovídá skutečnému `main`.