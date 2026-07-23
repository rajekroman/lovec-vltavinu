# AGENTS.md — agentní operační systém projektu Zelená vlna

Revize: **2.1 · 23. 7. 2026**

## Autorita

1. Aktuální výslovné zadání Romana.
2. `AGENTS.md`.
3. `docs/ARCHITECTURE_CONTRACT.md`.
4. `docs/PROJECT_CONTROL.md`.
5. Aktivní GitHub issue.

Při rozporu se konfliktní změna neprovádí. Rozpor řeší A0.

## Jediný zdroj pravdy

- Repozitář: `rajekroman/lovec-vltavinu`.
- `main` je jediná zveřejnitelná větev.
- Každý balík má jeden issue, přesný base SHA, jednu větev `agent/<téma>` a jeden draft PR.
- Přímé commity do `main` a paralelní finální buildy jsou zakázané.
- Hotovo znamená ověřitelný commit, PR, testy a HANDOFF.

## Produktové invarianty

- Jeden Three.js `WebGLRenderer`, jedna ortografická kamera, jeden fixed-step loop, jeden loader a jedna `GameSession`.
- Produkční vstup je pouze `src/bootstrap.js`.
- Kanonické levely: `chlum`, `nesmen`, `besednice`, `slavia`.
- Směrový vstup a jedno tlačítko `AKCE`.
- Kopání vyžaduje přesně tři úspěšné zásahy.
- Nálezy používají `findingId` a session score.
- Žádný inventář, nový save systém, localStorage gameplay stav nebo migrace save.
- Assety jsou manifest-driven, s relativní URL, rozpočtem, SHA-256 a dispose vlastníkem.

## Role

- **A0:** koordinace, issue fronta, base SHA, větve, review, merge a aktivace dalších kroků.
- **A1:** platforma a architektura. Stav `RESERVE`; aktivace pouze pro konkrétní architektonický hardening nebo legacy cleanup s novým issue, base SHA a větví.
- **A2:** gameplay, data, scény a objective pravidla.
- **A3:** grafika, asset pipeline, animace a manifest.
- **A4:** UI, UX, safe-area a mobilní vstup.
- **A5:** audio lifecycle a výkonové rozpočty.
- **A6:** unit, validátor, desktop a mobilní E2E, regresní a finální QA.
- **A7:** release dokumentace, GitHub Pages, PWA, licence a produkční smoke.

## Povinné úvodní hlášení

Každý pracovní chat před změnou uvede:

- identifikátor issue;
- roli a přidělenou oblast;
- načtené revize tří řídicích dokumentů;
- base SHA a větev;
- závislosti, povolené cesty a možné konflikty.

## Integrační pořadí

1. Besednice PR #55 — dokončeno.
2. Governance PR #57.
3. Slavia / KD Slavia vertical slice.
4. Vizuální a obsahový polish.
5. Audio a výkonový hardening.
6. Legacy Canvas runtime a save cleanup — A1.
7. Finální QA — dvě zelená spuštění stejného headu.
8. Produkční GitHub Pages release.

Žádný krok nesmí přeskočit přímou závislost.

## Definition of Done

- produkční tok je dosažitelný bez debug URL nebo konzole;
- syntaxe, validátor, unit, build a relevantní E2E jsou zelené;
- desktop, iPhone portrait a landscape jsou ověřeny podle rozsahu;
- dialog, pause, otočení, background/foreground a změna scény nezanechají zamrzlý input;
- nevznikl druhý runtime, loader, session, inventář nebo save systém;
- dokumentace popisuje skutečný stav;
- HANDOFF uvádí změněné soubory, rozhodnutí, testy, známé problémy a další krok.
