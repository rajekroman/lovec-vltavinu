# Changelog

## 7.3.0 — Unreleased

v7.3 je release candidate nad publikovaným `v7.0.0`. Tato sekce popisuje integrovaný scope, nikoli již vydaný release. Tag/GitHub Release `v7.3.0` vznikne až po manual/device gates, explicitním frozen `RELEASE_SHA` a independent A6 PASS.

### Integrovaný scope

- čtyři kanonické lokality Chlum → Nesměň → Besednice → Slavia;
- plynulejší directional walk a atlasové NPC/hero animace;
- data-driven walkability s dosažitelnými mandatory targets;
- touch input, portrait/landscape lifecycle a safe-area handling;
- 3 → 6 → 10 findings v jedné in-memory GameSession;
- Slavia jury zobrazující 10 findings a přijímající právě 4, s blokací pátého výběru;
- sekundární UI obrazovky, ARIA kontrakty a accessibility režimy;
- offline service-worker runtime smoke;
- protected main s PR-only pravidlem a osmi required CI checks;
- v7.3 runtime/player-facing version label.

### Audio v7.3

Canonical audio set je dokončen automatizovatelně:

- 21 project-original procedurálně generovaných MP3;
- žádné externí samples/stock/ElevenLabs v canonical setu;
- 21/21 CC0-1.0;
- 21/21 FFprobe metadata verified;
- 21 unikátních SHA-256;
- `finding-b` a `finding-c` jsou odlišné;
- canonical payload 678 006 B;
- routing pro dig/finding/danger/UI/result/ambient a audio lifecycle je testovaný.

### Zbývající release gates

- manual desktop speaker/headphones audio listen-through;
- real-iPhone speaker/headphones audio listen-through;
- real macOS Safari full-flow;
- real iPhone Safari portrait/landscape/orientation/lifecycle;
- explicitní frozen 40znakový `RELEASE_SHA`;
- independent A6 visual PASS na stejném SHA.

Dokud nejsou tyto brány uzavřené, v7.3 není vydaná ani release-certifikovaná.

---

## 7.0.0 — V7: vizuální přestavba všech lokalit

Publikovaný release `v7.0.0` na tagu `258897cf064194c95c1de629ca83461617e22ed2`.

- Chlum — authored terrain plate, radar/search flow.
- Nesměň — vrstevnatý les a rytmické kopání.
- Besednice — jílový lom a ježková vrstva.
- KD Slavia — venkovní sběratelská akce u Malše.
- jedna modulární Three.js architektura a in-memory session bez save systému.

## 6.x

Modulární ES-module runtime s jedním Three.js rendererem, ortografickou kamerou, in-memory session bez save systému a inventáře a touch ovládáním pro mobil.

## 5.1 — Reálnější lokality (historické)

Historický pre-V7 obsah; není součástí současné release gate.