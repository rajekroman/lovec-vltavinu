# Lovec vltavínů v7.3 — autoritativní plán dokončení plné verze

Stav: **BLOCK — release ani soft launch zatím nejsou schválené**

Aktuální integrační baseline: `main@eea25139071f4635aeb3ff6fdbfda3c2b7a4cbe4`

Datum revize: 30. 8. 2026

Autoritativní acceptance: `docs/FINAL_GAME_GOALS.md`

Tento dokument je repository-owned master plán dokončení v7.3. Starší chatové reporty, launch-ready deklarace a mezistavy PR jsou pouze historický vstup. Při rozporu rozhoduje aktuální GitHub stav, `docs/FINAL_GAME_GOALS.md`, architektonické kontrakty a exact-SHA důkaz.

## 1. Aktuální integrační pravda

- `main@eea25139071f4635aeb3ff6fdbfda3c2b7a4cbe4` je současný integrační baseline po merged PR #350.
- PR #344 je **MERGED** a jeho mobile compatibility-click oprava je součástí produkčního `main`.
- PR #332 je **MERGED**; Firefox release-gate konfigurace s headed Xvfb/software GL je součástí `main`.
- PR #346 a PR #347 jsou **historické/superseded** CI integrační větve. Nejsou release kandidáti a nemají se mergovat do současného `main`.
- PR #349 je **MERGED** a integroval finální CI policy pro skutečné full `iphone-portrait` a `iphone-landscape` běhy na pull requestech bez false-green skip wrapperů.
- PR #348 je **MERGED** a integroval deterministický v7.3 audio scope při zachování jediného audio enginu.
- PR #350 je **MERGED** a napojil result SFX na skutečný veřejný result producer/rendered result path.
- PR #330 je **MERGED** a release governance nyní odpovídá pravidlu `functional PASS → explicitní RELEASE_SHA → independent A6 PASS`.
- PR #333 je tento master completion plan. Po tomto refreshi má být použit jako poslední governance snapshot před nominací `RELEASE_SHA`.
- Aktuální push workflow `Validate game` pro `main@eea25139071f4635aeb3ff6fdbfda3c2b7a4cbe4` skončil **SUCCESS**. GitHub Pages deploy pro stejný SHA skončil **SUCCESS**.
- Green CI samo o sobě není release ani A6 PASS.

## 2. Neměnné produktové a architektonické kontrakty

- jedna kanonická Three.js architektura;
- jeden `WebGLRenderer`, jedna ortografická kamera, jeden fixed-step loop, jeden `InputManager`;
- jedna in-memory `GameSession`;
- žádný gameplay save systém, inventář ani paralelní Canvas runtime;
- žádná gameplay persistence v `localStorage`, `sessionStorage` ani IndexedDB;
- pořadí Chlum → Nesměň → Besednice → Slavia;
- přesně 3 + 3 + 4 findings = 10 unikátních findings;
- stabilní `findingId`, `locality`, `rarity`, `weight`, `score` během jednoho průchodu;
- Slavia zobrazí všech 10 a dovolí vybrat právě 4;
- evaluator dostane pouze zvolené 4, ale session po jury stále drží původních 10;
- skutečné blocked/walkable zóny a dosažitelné interaction pockets;
- animační a audio lifecycle respektuje pause, orientation, background/resume a dispose;
- automatický Playwright/WebKit důkaz není náhradou real Safari/iOS Safari sign-off;
- green CI není náhradou independent A6 vizuálního PASS.

## 3. Automatická functional release gate

Před freeze musí být na přesném kandidátním `main` SHA doloženo, že skutečně proběhly a prošly:

- Static and unit validation;
- desktop Chromium;
- desktop Firefox;
- full iPhone portrait `390×844`;
- iPhone portrait smoke;
- full iPhone landscape `844×390`;
- offline Chromium;
- audio lifecycle Chromium.

`skipped`, `cancelled`, false-green wrapper nebo PASS na starším SHA není PASS pro nový release kandidát.

Full-flow acceptance musí zachovat:

- Chlum snapshot = 3;
- Nesměň snapshot = 6 a první 3 findings beze změny;
- Besednice snapshot = 10 a prvních 6 beze změny;
- po vstupu do Slavie stále stejných 10;
- jury UI IDs přesně odpovídají session findings;
- initial jury state = `VYBRÁNO 0/4`;
- 0–3 selection = submit disabled;
- přesně 4 = submit enabled;
- pátý výběr je zablokovaný;
- deselect → náhradní výběr funguje;
- submitted IDs přesně odpovídají finální čtveřici;
- jury score = součet score těchto čtyř finding objektů;
- session po evaluation stále obsahuje původních 10;
- nová expedice + reload = čistá in-memory session;
- žádná gameplay persistence.

Aktuální `main@eea25139071f4635aeb3ff6fdbfda3c2b7a4cbe4` má push `Validate game` SUCCESS. Před nominací `RELEASE_SHA` musí být auditováno, že mobile full-flow joby na tomto přesném SHA nebyly `skipped` ani `cancelled` a obsahují požadovanou skutečnou execution evidence.

## 4. Zbývající BLOCK před `RELEASE_SHA`

Po integraci #349, #348, #350 a #330 už není plánován další známý produktový merge. Release zůstává BLOCK pouze do uzavření následujících důkazních bran:

### A. Exact-SHA CI audit

Na současném kandidátním `main` potvrdit skutečnou execution evidence všech povinných browser projektů, zejména full portrait a full landscape. PASS musí patřit přesně SHA, který bude následně nominován jako `RELEASE_SHA`.

### B. Manual desktop audio listen-through

Na stejném kandidátním SHA ručně ověřit:

- dig variants / finding / miss / result a UI cues podle implementovaného scope;
- ambient routing podle lokality;
- pause/resume;
- background/resume;
- žádný duplicate engine nebo dvojité přehrávání;
- result SFX skutečně zazní z reálného result producer path.

### C. Real-mobile audio listen-through

Na skutečném iPhonu ověřit stejné audio lifecycle body, user-gesture start, background/resume a orientaci. Automatický mobile Chromium test tuto bránu nenahrazuje.

### D. Real Safari/device evidence

Na stejném kandidátním SHA ověřit minimálně:

- Safari macOS;
- Safari na skutečném iPhonu;
- portrait `390×844` behavior;
- landscape/orientation behavior;
- touch movement a contextual action;
- pause/background/resume;
- Slavia jury 0/4 → 4/4 → final evaluation.

Playwright Chromium/WebKit není real Safari sign-off.

### E. Independent A6

Independent A6 capture zůstává **BLOCK**, dokud není explicitně nominovaný frozen `RELEASE_SHA`.

## 5. Governance historie a integrační stav

### PR #330 — release governance

**MERGED.** Jeho pravidla jsou součástí `main`:

- žádný předčasný `Official Release`;
- žádné nedoložené browser/audio/i18n claims;
- explicitní full portrait + landscape gate;
- 3→6→10 + 4/10 jury evidence;
- jeden explicitní `RELEASE_SHA`;
- A6 invalidation po jakékoli následné source změně.

### PR #346 / #347 — historical CI branches

**SUPERSEDED.** Nemergovat. Jejich integrační účel převzal a dokončil PR #349.

### PR #349 — full mobile PR matrix

**MERGED.** Pull request CI policy skutečně spouští full portrait a landscape projekty namísto jejich skipování.

### PR #348 — deterministic audio completion

**MERGED.** Audio scope je integrován do `main`; manual listen-through zůstává samostatnou acceptance branou.

### PR #350 — result SFX producer fix

**MERGED.** Result SFX je napojen na skutečný rendered result/public producer path a fix má testové krytí.

### PR #333 — master completion plan

Tento PR je governance/documentation only. Po tomto refreshi už nemá popisovat historické integrační kroky jako budoucí práci. Jeho účelem je zaznamenat dnešní stav a zbývající důkazní brány.

Po merge #333 vznikne nový `main` SHA. Proto se žádný starší SHA nesmí předem označit jako finální `RELEASE_SHA`.

## 6. Nominace explicitního `RELEASE_SHA`

`RELEASE_SHA` se nominuje až po merge #333 a po potvrzení, že už není plánován žádný další code/CSS/asset/docs merge měnící release baseline.

Freeze je povolen pouze pokud:

1. všechny povinné runtime/code/CSS/asset/governance změny jsou merged;
2. exact-SHA CI audit je PASS;
3. manual desktop audio listen-through je PASS;
4. real-mobile audio listen-through je PASS;
5. požadovaná real Safari/device evidence je PASS;
6. žádný P0/P1 release blocker není otevřený;
7. release dokumentace neobsahuje falešné PASS.

Pak se zapíše jeden 40znakový `RELEASE_SHA`.

Jakákoli následná source změna vytváří nový SHA a invaliduje SHA-bound release evidence, která se na změněném povrchu může stát neplatnou. A6 musí vždy patřit finálnímu frozen SHA.

## 7. A6 — nezávislá vizuální release brána

A6 začne až po explicitním freeze.

Kanonické viewporty:

- desktop `1280×720`;
- iPhone portrait `390×844`;
- iPhone landscape `844×390`.

Pro všechny 4 lokality musí evidence pokrýt:

- kanonický environment;
- HUD;
- player identity a animace;
- movement;
- contextual action;
- blocked/walkable zóny;
- touch;
- orientation;
- pause;
- background/resume;
- transitions.

Specificky:

- Chlum: radar, 3 findings a povinné special actions;
- Nesměň: 3 findings a dig flow;
- Besednice: 4 findings, stopy/digging a vizuálně odlišné NPC identity;
- Slavia: 10 findings, jury initial `0/4`, přesně `4/4`, fifth-selection protection a final evaluation pouze ze 4 při zachování 10 v session.

Green CI ≠ visual A6 PASS.

## 8. Release

Tag/release `v7.3.0` je povolen pouze při současném:

- functional exact-SHA PASS;
- full portrait PASS;
- full landscape PASS;
- manual desktop audio PASS;
- real-mobile audio PASS;
- real Safari/device PASS v požadovaném rozsahu;
- independent A6 PASS;
- stejném explicitním `RELEASE_SHA` pro všechny finální důkazy;
- pravdivé release dokumentaci.

Po tagu/deployi:

- ověřit GitHub Pages vůči release SHA;
- provést smoke veřejné URL;
- hotfix pouze samostatným PR;
- každý hotfix vytváří nový SHA a vyžaduje novou odpovídající release certifikaci.

## 9. Aktuální pořadí dokončení

1. refresh + merge #333 jako finální governance snapshot;
2. vzít výsledný nový `main` SHA jako kandidáta;
3. ověřit exact-SHA CI execution evidence včetně skutečného full portrait + landscape;
4. dokončit manual desktop audio listen-through;
5. dokončit real-mobile audio listen-through;
6. dokončit real Safari/device evidence;
7. pokud už nebude plánován žádný další merge, explicitně nominovat tento SHA jako `RELEASE_SHA`;
8. provést independent A6 capture na tomto frozen SHA;
9. při PASS všech bran teprve tag/release `v7.3.0`.

Dokud nejsou body 1–8 uzavřené podle jejich acceptance podmínek, stav zůstává **BLOCK**.
