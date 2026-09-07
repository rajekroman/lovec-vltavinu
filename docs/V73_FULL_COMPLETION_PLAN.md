# Lovec vltavínů v7.3 — autoritativní plán dokončení

Stav: **BLOCK pouze na manual/device evidence, RELEASE_SHA a A6**  
Revize: **7. 9. 2026**  
Autoritativní acceptance: `docs/FINAL_GAME_GOALS.md`

Přesný kandidátní `main` SHA a GitHub Actions runy se vedou v #334. Tento dokument záměrně neobsahuje „current SHA“, protože samotný documentation commit vytváří nový SHA.

## 1. Integrační pravda

Zamýšlený v7.3 produktový/runtime scope je integrován. Klíčové pozdější kroky:

- #349: skutečné full portrait/landscape PR joby bez false-green skip wrapperů;
- #348/#350: v7.3 audio routing a result producer path;
- #354: protected main, PR-only a osm required checks;
- #371: player-facing/runtime version sjednocena na v7.3;
- #372: celý canonical audio set obnoven z repository-owned procedurálního generátoru, 21/21 CC0 a distinct finding cues.

Žádný z těchto kroků sám o sobě není release.

## 2. Neměnné kontrakty

- jedna Three.js architektura;
- jeden renderer/kamera/fixed-step loop/InputManager;
- jedna in-memory GameSession;
- žádný gameplay save systém, inventář ani persistence;
- pořadí Chlum → Nesměň → Besednice → Slavia;
- přesně 3 + 3 + 4 = 10 findings;
- stabilní finding data během jednoho průchodu;
- Slavia zobrazí všech 10 a přijme právě 4;
- evaluator dostane pouze 4, session zachová všech 10;
- skutečné blocked/walkable zóny a dosažitelné interaction pockets;
- lifecycle pro animace/audio/input při pause/orientation/background/dispose.

## 3. Functional release gate

Na přesném kandidátním SHA musí skutečně proběhnout a projít:

- Static and unit validation;
- desktop Chromium;
- desktop Firefox;
- full iPhone portrait 390×844;
- full iPhone landscape 844×390;
- portrait smoke;
- offline Chromium;
- audio lifecycle Chromium.

Full flow musí prokázat 3 → 6 → 10, Slavia 0/4, přesně 4/4, pátý blocked, správné submitted IDs a score, zachování 10 findings po evaluation a clean restart bez gameplay persistence.

## 4. Audio gate

Automatizovatelná část je dokončena:

- 21 canonical MP3;
- project-original procedural synthesis;
- žádné external samples;
- 21/21 CC0-1.0;
- 21/21 technical metadata verified;
- 21 unikátních SHA;
- 678 006 B;
- finding-b/c distinct.

Před release stále vyžadujeme fyzický desktop a real-iPhone speaker/headphones listen-through.

## 5. Real-device gate

Na stejném kandidátu:

### macOS Safari
- celý Chlum → Nesměň → Besednice → Slavia flow;
- HUD/dialog/result/jury;
- audio unlock;
- pause/background/resume;
- žádný blocking runtime/console defect;
- clean restart.

### real iPhone Safari
- portrait touch/safe areas;
- landscape/orientation;
- contextual action;
- background/resume;
- audio lifecycle;
- Slavia jury 0/4 → 4/4 → fifth blocked;
- result + restart.

Evidence musí uvést exact SHA, device, OS/browser, viewport, timestamp a výsledek.

## 6. Freeze

A0 smí nominovat jeden 40znakový `RELEASE_SHA` až když:

1. všechny zamýšlené code/CSS/asset/test/docs změny jsou v main;
2. exact-SHA CI je PASS;
3. desktop audio PASS;
4. real-iPhone audio PASS;
5. real Safari/device PASS;
6. není otevřen konkrétní P0/P1 release defect;
7. release dokumentace je pravdivá.

Jakákoli source změna po freeze invaliduje SHA-bound evidence.

## 7. Independent A6

Po freeze zachytit na stejném SHA:

- desktop 1280×720;
- portrait 390×844;
- landscape 844×390;
- všechny 4 lokality;
- prostředí, HUD, player/NPC animace, movement, context action, blockers/walkability, touch, orientation, pause/background/resume, transitions;
- Chlum radar/findings;
- Nesměň digging/findings;
- Besednice traces/digging/Karel;
- Slavia 10 findings, 0/4, 4/4, fifth blocked, evaluation a zachování session.

Verdikt A6 je PASS nebo BLOCK. Green CI A6 nenahrazuje.

## 8. Release

Tag/GitHub Release `v7.3.0` je povolen pouze pokud automated functional gate, manual audio, real Safari/device a independent A6 všechny odkazují na stejný frozen `RELEASE_SHA`.

Po tagu ověřit public Pages URL a případný hotfix řešit pouze novým PR/SHA.