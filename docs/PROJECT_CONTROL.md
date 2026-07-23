# PROJECT_CONTROL.md — dokončovací plán a integrační stav

Revize: **2.2 · 23. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální ověřená realita

- Publikovatelný základ je `main@36e75a97725481a2c4f296a3ea46ca22dd75dbbf`, vzniklý merge PR #62.
- Brána 0 je dokončena: Besednice PR #55 byla sloučena jako `e137fe389bfd04b9402298b371df13e24fd38104`; ověřený feature head byl `3ae2cceb0b57ac61b628c2ef45d9f09c26360bb9`; workflow `Validate game` #691 prošlo úspěšně.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`.
- Aktivní runtime používá Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop a jednu `GameSession`.
- Kanonické levely jsou `chlum`, `nesmen`, `besednice`, `slavia`.
- Chlum, Nesměň a Besednice jsou sloučené a regresně chráněné.
- Slavia / KD Slavia je aktivní v issue #61 a draft PR #63 na větvi `agent/slavia-vertical-slice`.
- A3 je explicitně aktivován jako vlastník Slavia asset packu a manifestových položek v rámci issue #61 a PR #63.
- Brána 2 celoproduktového vizuálního polish zůstává blokována do merge Slavie.
- A6 připravuje QA infrastrukturu v draft PR #66; workflow #731 selhalo v mobile browser smoke a není warm-up ani certifikační běh.
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
| A0 koordinace #67 | **ACTIVE** | governance-only aktualizace a A3 aktivace | pouze `docs/PROJECT_CONTROL.md` |
| A1 architektura | **STANDBY** | pouze samostatný hardening nebo pozdější legacy cleanup | bez změny architektury během Slavie |
| A2 Slavia #61 / PR #63 | **RUNNING / DRAFT** | kompletní produkční Slavia vertical slice | celý tok Besednice → Slavia → výsledek → restart |
| A3 Slavia asset pack | **ACTIVE SUPPORT #61 / PR #63** | KD Slavia assety, manifest, rozpočty a vizuální důkaz | bez gameplay a UI změn |
| A4 UI/mobil | **ACTIVE SUPPORT #61 / PR #63** | nezbytný výsledkový adaptér a mobilní čitelnost | portrait/landscape, safe-area, input release |
| A5 audio/výkon | **BLOCKED** | žádný samostatný redesign | aktivovat až po merge Slavie a Bráně 2 |
| A6 QA #65 / PR #66 | **ACTIVE INFRASTRUCTURE / CERTIFICATION BLOCKED** | desktop + iPhone portrait + landscape matice | #731 failure; finální SHA nepotvrzen |
| A7 release | **BLOCKED** | žádný release | až po finálním QA |
| Brána 2 vizuální polish | **BLOCKED** | samostatný A3 balík | aktivovat až po merge Slavie |
| Legacy cleanup | **BLOCKED** | odstranění starého runtime | až po zeleném čtyřlevelovém průchodu |

## 4. Integrační brány

### Brána 0 — koordinační review Besednice — DOKONČENO

- PR #55: merged jako `e137fe389bfd04b9402298b371df13e24fd38104`.
- Feature head: `3ae2cceb0b57ac61b628c2ef45d9f09c26360bb9`.
- Workflow #691: success.
- Ověřený tok: Nesměň → briefing Besednice → tři stopy → ježkový profil → tři zásahy → finding → Karel → recovery → `level:complete(nextLevelId: "slavia")`.

### Brána 1 — Slavia / KD Slavia vertical slice — AKTIVNÍ

- Issue: #61.
- Draft PR: #63.
- Base SHA: `36e75a97725481a2c4f296a3ea46ca22dd75dbbf`.
- Větev: `agent/slavia-vertical-slice`.
- Vlastník: A2.
- Podpora: A3 assety/manifest, A4 UI adaptér, A6 testy.

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

Acceptance criteria:

1. přechod z Besednice bez debug URL;
2. rozpoznatelná budova KD Slavia načtená z manifestu;
3. výsledek pouze z `GameSession` a stabilních `findingId`;
4. bez inventáře, save, localStorage a import/export;
5. čitelný výsledek na desktopu, iPhone portrait a landscape;
6. restart vytvoří čistou session;
7. kompletní HANDOFF a mobilní důkaz.

### Explicitní přidělení A3 — Slavia asset pack

- **Issue:** #61.
- **Role:** A3 — grafika, asset pipeline a animace.
- **Base SHA:** `36e75a97725481a2c4f296a3ea46ca22dd75dbbf`.
- **Větev:** `agent/slavia-vertical-slice`.
- **PR:** #63, bez paralelního A3 PR.
- **Povolené cesty:** `assets/`, asset manifest a úzké grafické factory podklady nutné pro registraci assetů.
- **Zakázané cesty:** `src/gameplay/`, objective logika, session stav, eventové payloady, `src/ui/`, `src/input/`, renderer, loader internals a workflow.
- **Závislosti:** A2 určuje scene/entity kontrakt; A4 určuje výsledkový UI kontrakt; A6 ověřuje asset load a mobilní průchod.

A3 acceptance criteria:

1. rozpoznatelný KD Slavia/Malše asset pack;
2. všechny assety mají stabilní manifest ID, relativní URL a správnou preload skupinu;
3. každý nový runtime asset má byte/triangle/texture budget, SHA-256 a dispose vlastníka;
4. žádná 404, duplicitní ID ani nepoužitý preload;
5. měřítko a pivot odpovídají existující scéně;
6. portrait a landscape screenshot Slavie;
7. žádný placeholder vydávaný za finální asset;
8. změny zůstávají ve stejném draft PR #63 a mají úplný A3 HANDOFF.

### Brána 2 — celoproduktový obsahový a vizuální polish — BLOKOVÁNO

Vlastník A3. Aktivace až po merge Brány 1 a nové aktualizaci tohoto dokumentu. Nynější A3 aktivace neopravňuje měnit ostatní levely ani zahájit celoproduktový polish.

### Brána 3 — audio a výkonový hardening — BLOKOVÁNO

Vlastník A5, podpora A1/A6. Aktivovat až po Bráně 2.

### Brána 4 — legacy runtime cleanup — BLOKOVÁNO

Vlastník A1, ověření A6. Aktivovat až po zeleném produkčním průchodu všech čtyř levelů.

### Brána 5 — finální QA — BLOKOVÁNO

Vlastník A6. Povinně desktop Chromium, iPhone portrait a iPhone landscape, úplný produkční průchod a dvě po sobě jdoucí zelená spuštění stejného A0 potvrzeného SHA. Workflow #731 se nezapočítává.

### Brána 6 — produkční release — BLOKOVÁNO

Vlastník A7, schvaluje A0. Release pouze z `main` po zeleném finálním QA a smoke skutečné GitHub Pages URL.

## 5. Aktivní integrační pořadí

```text
1. Brána 0 / Besednice — dokončeno
2. Governance PR #62 — dokončeno (`main@36e75a97725481a2c4f296a3ea46ca22dd75dbbf`)
3. Brána 1 / Slavia issue #61, PR #63 — aktivní
4. Brána 2 / A3 celoproduktový polish — blokováno
5. Brána 3 / A5 audio a výkon — blokováno
6. Brána 4 / A1 legacy cleanup — blokováno
7. Brána 5 / A6 finální QA — blokováno
8. Brána 6 / A7 release — blokováno
```

Žádná brána nesmí přeskočit přímou závislost.

## 6. Pravidla aktivace odborného chatu

A0 vždy uvede issue, roli, base SHA, větev, povolené a zakázané cesty, závislosti, acceptance criteria, povinné testy a integrační pořadí. Bez těchto údajů smí odborný chat pouze analyzovat.

## 7. Kritéria dokončení projektu

Projekt je dokončen pouze tehdy, když všechny čtyři levely tvoří jeden produkční průchod, finále vyhodnotí session a umožní čistý restart, neexistuje druhý runtime ani gameplay persistence, tři cílové profily projdou E2E, stejný release head projde dvakrát po sobě, GitHub Pages projde produkčním smoke testem a dokumentace odpovídá skutečnému `main`.
