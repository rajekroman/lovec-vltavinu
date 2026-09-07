# V7.3 — aktuální stav kandidáta

Revize: **2.0.0 · 7. 9. 2026**

Tento dokument popisuje stav v7.3 práce nad vydaným `v7.0.0`. Přesný aktuální main SHA se vede v #334, ne v tomto source dokumentu, aby změna dokumentace sama nevytvářela okamžitě zastaralý „current SHA“.

## 1. Release status

- publikovaný release: **`v7.0.0`**;
- `main`: **v7.3 development/release candidate**;
- `v7.3.0`: **zatím nevydáno**;
- release je BLOCK, dokud nejsou dokončeny manual/device gate, frozen `RELEASE_SHA` a independent A6.

## 2. Hotový integrační scope

- čtyři kanonické lokality;
- jeden ES-module/Three.js runtime;
- 3 → 6 → 10 findings v jedné in-memory session;
- Slavia jury přesně 4/10, pátý výběr blokován;
- data-driven walkability;
- player/NPC atlasové animace;
- desktop a touch input;
- portrait/landscape automated full-flow;
- offline runtime smoke;
- audio lifecycle;
- protected main + PR-only + osm required checks;
- runtime label v7.3.

## 3. Audio

Po #372 už neplatí staré tvrzení o chybějící generaci nebo nejasné licenci.

Canonical set je generován `tools/audio/build-v73-audio.py`:

- 21 MP3;
- project-original procedural synthesis;
- 21/21 CC0-1.0;
- 21/21 FFprobe metadata verified;
- 21 unikátních SHA;
- 678 006 B total;
- `finding-b` a `finding-c` jsou odlišné.

Zbývá pouze manual speaker/headphones listen-through na desktopu a reálném iPhonu (#269).

## 4. Automatická QA

Required matrix:

1. Static and unit validation;
2. desktop Chromium;
3. desktop Firefox;
4. iPhone portrait full-flow;
5. iPhone landscape full-flow;
6. iPhone portrait smoke;
7. offline Chromium;
8. audio lifecycle Chromium.

Release evidence musí vždy patřit přesnému aktuálnímu kandidátnímu SHA. `skipped`, `cancelled` ani PASS ze staršího SHA se nepřenáší.

## 5. Co zbývá před freeze

- desktop audio listen-through;
- real-iPhone audio listen-through;
- real macOS Safari full-flow;
- real iPhone Safari portrait/landscape/orientation/lifecycle;
- případné uzavření konkrétních nově nalezených P0/P1 defektů;
- explicitní A0 nominace frozen `RELEASE_SHA`.

## 6. Co následuje po freeze

Independent A6 musí na stejném SHA zachytit desktop 1280×720, iPhone portrait 390×844 a landscape 844×390 přes všechny čtyři lokality, včetně HUD, walkability, akcí, dialogů, findings, Slavia 0/4 → 4/4 → fifth blocked, výsledku a restartu.

Teprve A6 PASS + všechny manual/device gates povolují tag/GitHub Release `v7.3.0`.

## 7. Post-release / non-blocking scope

Rozšířená 3D hloubka/fyzický movement (#368), další dekorativní polish a jiné explicitně odložené funkce nejsou součástí v7.3 release blockerů, pokud z nich nevznikne konkrétní usability/regression defect.