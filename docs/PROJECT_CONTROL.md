# PROJECT_CONTROL.md — dokončovací plán a integrační stav

Revize: **2.5 · 24. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Význam evidovaných SHA

Aktuální špička `main` se vždy ověřuje přímo přes GitHub. Tento dokument eviduje pouze již existující a ověřené commity.

- Governance branch point této revize: `main@2a75d78e5b30feb2d581cafe1597ad0642b5130e`.
- Tento commit je merge PR #63 a uzavírá produkční Slavia / KD Slavia vertical slice.
- Budoucí merge SHA této governance revize se nepředjímá.

## 2. Aktuální ověřená realita

- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`.
- Aktivní runtime používá Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu `GameSession`.
- Kanonický průchod je `chlum → nesmen → besednice → slavia → finální výsledek → čistý restart`.
- PR #63 byl sloučen merge commitem `2a75d78e5b30feb2d581cafe1597ad0642b5130e`; issue #61 je uzavřeno jako dokončené.
- Workflow `Validate game` #899 na ověřeném feature headu `6a08f164fa4d315585f88ce9b485972f30f76ac4` prošlo.
- Playwright artefakt #899 obsahuje `slavia-arrival.png`, `slavia-certification.png` a `slavia-final-result.png`.
- Známé omezení QA helperu rytmického zásahu je neblokující testovací dluh. Nesmí být řešeno změnou produkčních pravidel v Bráně 2.
- Předčasné nebo historické PR a větve nejsou integračním základem. Jednotlivé assety lze převzít pouze po kontrole původu, kontraktu a rozpočtu.

## 3. Neměnná rozhodnutí

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
| Nasazení | relativní cesty, GitHub Pages, release pouze z `main` |

## 4. Stav pracovních proudů

| Role / balík | Stav | Přijímaný výstup | Integrační brána |
|---|---|---|---|
| A0 koordinace | **ACTIVE** | governance, review a integrační rozhodnutí | bez produkční implementace |
| A1 architektura | **STANDBY** | pozdější samostatný legacy cleanup | až po Bráně 2 a příslušném issue |
| A2 gameplay/data | **STANDBY** | pouze konkrétní opravy z nového issue | Slavia balík uzavřen |
| A3 grafika / Brána 2 | **READY FOR ASSIGNMENT** | celoproduktový vizuální polish v samostatném issue a PR | nesmí měnit gameplay, UI/input ani architekturu |
| A4 UI/mobil | **STANDBY** | podpora pouze na explicitní A3/A0 žádost | bez samostatného redesignu |
| A5 audio/výkon | **BLOCKED** | žádný nový balík | aktivovat až po merge Brány 2 |
| A6 QA | **STANDBY / SUPPORT** | testovací evidence pro Bránu 2; QA helper dluh v odděleném backlogu | bez produkční logiky |
| A7 release | **BLOCKED** | žádný release | až po finálním QA |

## 5. Integrační brány

### Brána 0 — Besednice — DOKONČENO

- PR #55 byl sloučen jako `e137fe389bfd04b9402298b371df13e24fd38104`.
- Produkční tok předává `nextLevelId: "slavia"`.

### Brána 1 — Slavia / KD Slavia vertical slice — DOKONČENO

- Issue: #61 — closed/completed.
- PR: #63 — merged.
- Merge commit: `2a75d78e5b30feb2d581cafe1597ad0642b5130e`.
- Ověřený QA feature head: `6a08f164fa4d315585f88ce9b485972f30f76ac4`.
- Workflow #899: success.
- Dodáno: kanonická Slavia scéna, přechod Besednice → Slavia, deterministické vyhodnocení session, finální obrazovka, čistý restart, manifestový asset pack a vizuální důkazy.

### Brána 2 — celoproduktový vizuální polish — READY FOR ASSIGNMENT

Vlastník: A3. Aktivace proběhne pouze samostatným issue vytvořeným A0 po merge této governance revize.

Povolený směr:

- sjednotit vizuální jazyk všech čtyř levelů;
- odstranit zjevné grafické placeholdery a nesourodé assety;
- sjednotit měřítka, pivoty, světelný směr, kontrast a čitelnost;
- doplnit omezené pohybové animace a vizuální feedback bez změny gameplay pravidel;
- optimalizovat PNG/GLB a aktualizovat manifestová metadata;
- dodat desktop, iPhone portrait a iPhone landscape screenshotovou matici.

Zakázáno:

- měnit questy, objective flow, session, score, kolize nebo obtížnost;
- měnit `src/bootstrap.js`, renderer, loop, loader, input internals nebo UI logiku;
- přidávat save, inventář, nový runtime nebo paralelní scény;
- zahrnout audio redesign, legacy cleanup nebo release změny.

### Brána 3 — audio a výkonový hardening — BLOKOVÁNO

Vlastník A5, podpora A1/A6. Aktivovat až po merge Brány 2.

### Brána 4 — legacy runtime cleanup — BLOKOVÁNO

Vlastník A1, ověření A6. Vyžaduje samostatný issue a branch point po Bráně 2.

### Brána 5 — finální QA — BLOKOVÁNO

Vlastník A6. Po potvrzení finálního release SHA musí následovat warm-up a dvě kompletní zelená spuštění stejného nezměněného SHA.

### Brána 6 — produkční release — BLOKOVÁNO

Vlastník A7, schvaluje A0. Release pouze z `main` po zeleném finálním QA a smoke skutečné GitHub Pages URL.

## 6. Aktivní integrační pořadí

```text
1. Brána 0 / Besednice — dokončeno
2. Brána 1 / Slavia — dokončeno (`2a75d78e5b30feb2d581cafe1597ad0642b5130e`)
3. Governance po PR #63 — aktivní issue #73
4. Brána 2 / A3 celoproduktový vizuální polish — ready for assignment
5. Brána 3 / A5 audio a výkon — blokováno
6. Brána 4 / A1 legacy cleanup — blokováno
7. Brána 5 / A6 finální QA — blokováno
8. Brána 6 / A7 release — blokováno
```

Žádná brána nesmí přeskočit přímou závislost.

## 7. Pravidla aktivace odborného chatu

A0 vždy uvede issue, roli, base SHA, větev, povolené a zakázané cesty, závislosti, acceptance criteria, povinné testy a integrační pořadí. Bez těchto údajů smí odborný chat pouze analyzovat.

## 8. Kritéria dokončení projektu

Projekt je dokončen pouze tehdy, když všechny čtyři levely tvoří jeden produkční průchod, finále vyhodnotí session a umožní čistý restart, neexistuje druhý runtime ani gameplay persistence, tři cílové profily projdou E2E, stejný release head projde dvakrát po sobě po nezapočítaném warm-upu, GitHub Pages projde produkčním smoke testem a dokumentace odpovídá skutečnému stavu ověřenému přímo přes GitHub.
