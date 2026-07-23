# PROJECT_CONTROL.md — dokončovací plán a integrační stav

Revize: **2.1 · 23. 7. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je autoritativní stavový registr projektu. Pracovní pravidla určuje `AGENTS.md`; technické invarianty určuje `docs/ARCHITECTURE_CONTRACT.md`.

## Aktuální ověřený stav

- Aktuální produkční základ před merge tohoto governance PR je `main@e137fe389bfd04b9402298b371df13e24fd38104`.
- PR #55 / issue #51 — Besednice vertical slice — jsou dokončené a sloučené.
- Produkční tok obsahuje `Chlum → Nesměň → Besednice` a po dokončení Besednice emituje `nextLevelId: "slavia"`.
- Aktivní runtime používá jediný Three.js `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader a jednu `GameSession`.
- Produkční vstup je pouze `src/bootstrap.js`.
- Nevzniká inventář, nový save systém ani localStorage gameplay stav.
- Kanonické levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`.

## Stav rolí

| Role | Stav | Aktuální oprávnění |
|---|---|---|
| A0 — koordinace | **ACTIVE** | review, merge, issue fronta, base SHA, větve a aktivace dalších kroků |
| A1 — platforma/architektura | **RESERVE** | žádná implementační práce; aktivace pouze pro konkrétní architektonický hardening nebo legacy cleanup s novým issue, base SHA a větví |
| A2 — gameplay/data | **NEXT: SLAVIA** | samostatný Slavia/KD Slavia vertical slice po merge governance PR #57 |
| A3 — grafika/assety | **SUPPORT SLAVIA** | pouze manifestový Slavia asset pack a pozdější samostatný polish |
| A4 — UI/mobil | **SUPPORT SLAVIA** | pouze nezbytný finální výsledek, safe-area a portrait/landscape adaptér |
| A5 — audio/výkon | **BLOCKED** | aktivovat až po vizuálním a obsahovém polish |
| A6 — QA | **SUPPORT / FINAL GATE** | testy pro Slavii; finální QA až po legacy cleanup |
| A7 — release | **BLOCKED** | release až po dvou zelených spuštěních stejného headu |

## Závazné integrační pořadí

1. **Review a merge PR #55 — Besednice** — dokončeno, merge `e137fe389bfd04b9402298b371df13e24fd38104`.
2. **Governance update / PR #57** — aktuální integrační brána.
3. **Slavia / KD Slavia vertical slice** — nový samostatný issue, větev a draft PR.
4. **Vizuální a obsahový polish** — samostatný balík po merge Slavie.
5. **Audio a výkonový hardening** — samostatný balík po polish.
6. **Odstranění legacy Canvas runtime a save kódu** — samostatný A1 balík; A1 se aktivuje až zde nebo při dříve prokázaném architektonickém blockeru.
7. **Finální QA** — dvě po sobě jdoucí zelená spuštění stejného headu.
8. **Produkční GitHub Pages release** — pouze z ověřeného `main`.

Žádný krok nesmí přeskočit přímou závislost.

## Aktivní další balík po merge PR #57

### Slavia / KD Slavia vertical slice

- vlastník: A2;
- podpora: A3, A4 a A6;
- povinná větev: `agent/slavia-vertical-slice`;
- base SHA: merge commit PR #57;
- výstup: jeden draft PR;
- A1 zůstává v rezervě.

### Kanonický tok

```text
dokončená Besednice
→ briefing Malše / KD Slavia
→ příchod k rozpoznatelné budově
→ registrace aktuální session sbírky
→ interakce se znalcem / porotou
→ vyhodnocení findingId a score
→ finální výsledek akce „Na Zelené Vlně“
→ nová čistá session po restartu
```

### Acceptance criteria

1. Produkční přechod z Besednice bez debug URL nebo přímé manipulace se scénou.
2. Rozpoznatelná KD Slavia načtená přes manifestovou skupinu `level:slavia`.
3. Vyhodnocení používá pouze aktuální `GameSession`, `findingId` a score.
4. Žádný inventář, save, import/export nebo localStorage gameplay stav.
5. Finální obrazovka funguje na desktopu, iPhone portrait a iPhone landscape.
6. Restart vytvoří čistou session a vrátí hráče na titulní obrazovku.
7. Unit, validátor a produkční mobilní E2E pokrývají celý tok Chlum → Nesměň → Besednice → Slavia.
8. PR obsahuje úplný HANDOFF, mobilní důkaz a potvrzení jednoho rendereru/kamery/loopu/session.

## A1 — pravidlo rezervy

A1 nesmí být připojen k implementaci Slavie pouze preventivně. Aktivace A1 je přípustná jen tehdy, když A0 vytvoří samostatný issue obsahující:

- konkrétní architektonický problém nebo legacy cleanup;
- přesný base SHA;
- samostatnou větev;
- povolené cesty;
- acceptance criteria;
- testovací bránu a HANDOFF.

## Finální brány

- Vizuální/content polish nesmí měnit kanonické objective podmínky bez samostatného issue.
- Audio/výkon musí ověřit iOS audio lifecycle, duplicitní tracky, DPR/LOD a výkonové rozpočty.
- Legacy cleanup odstraní nebo definitivně odpojí Canvas runtime, `game.js`, `runtime-stability.js` a starý save/import/export kód.
- Finální QA vyžaduje desktop, iPhone portrait a landscape a dvě zelená spuštění stejného commit SHA.
- Release vyžaduje čistý build, GitHub Pages deploy, smoke skutečné URL, licence, velikostní report, release notes a SHA-256 artefaktů.

## HANDOFF po každém balíku

Každý pracovní proud odevzdá:

- dokončený úkol;
- issue, PR, větev, base a head SHA;
- vytvořené nebo změněné soubory;
- technická rozhodnutí;
- testy a výsledky;
- mobilní a výkonový důkaz podle rozsahu;
- známé problémy;
- doporučený následující krok.
