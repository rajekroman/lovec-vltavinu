# PROJECT_CONTROL.md — řídicí registr release

Revize: **3.0.0 · 7. 9. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je stabilní repository-owned řídicí registr. Přesný aktuální kandidátní SHA a běhy GitHub Actions se zapisují do release-governance issues (#334, #335, #279), protože vložení „aktuálního SHA“ přímo do source dokumentu by při každé dokumentační změně samo vytvořilo nový SHA.

## 1. Vydaná verze

- Poslední publikovaný GitHub Release je **`v7.0.0`**.
- Tag `v7.0.0` je neměnný a resolveuje na `258897cf064194c95c1de629ca83461617e22ed2`.
- `v7.3.0` zatím **není vydaná verze**. `main` obsahuje release-candidate práci pro v7.3.
- Tag `v7.0.0` se nesmí přesouvat ani retagovat.

## 2. Aktuální v7.3 integrační stav

K 7. 9. 2026 je do `main` integrován zamýšlený produktový scope v7.3 včetně:

- čtyř kanonických lokalit Chlum → Nesměň → Besednice → Slavia;
- jediné Three.js architektury, jednoho rendereru, jedné ortografické kamery a jednoho fixed-step loopu;
- jediné in-memory `GameSession` bez gameplay persistence a inventáře;
- data-driven walkability a dosažitelných mandatory interaction pockets;
- 3 → 6 → 10 findings a Slavia jury s přesně 4/10 výběrem;
- desktop/mobile Playwright full-flow, offline a audio lifecycle gate;
- v7.3 runtime labelu;
- kanonického 21-souborového audio setu generovaného repository-owned deterministickým procedurálním generátorem bez externích sample;
- CC0-1.0 provenance pro všech 21 kanonických audio souborů;
- rozdílných `finding-b.mp3` a `finding-c.mp3`;
- chráněné větve `main` s PR-only pravidlem a osmi required status checks.

Poslední přesný automatický stav se nesmí kopírovat z tohoto souboru. Autoritativní exact-SHA evidence je v #334 a dokumentační/release-truth stav v #279.

## 3. Neměnné runtime invarianty

| Oblast | Závazné rozhodnutí |
|---|---|
| Repozitář | pouze `rajekroman/lovec-vltavinu` |
| Produkční větev | `main` |
| Runtime | ES moduly + Three.js |
| Renderer / kamera | právě jeden `WebGLRenderer` a jedna `OrthographicCamera` |
| Simulace | jeden fixed-step loop |
| Vstup | jeden `InputManager` |
| Session | jedna in-memory `GameSession` |
| Produkční vstup | `src/bootstrap.js` |
| Assety | manifest-driven preload z `assets/manifests/assets.json` |
| UI | HTML/CSS overlay; není autoritou gameplay stavu |
| Levely | Chlum → Nesměň → Besednice → Slavia |
| Persistence | žádný save/localStorage/sessionStorage/IndexedDB gameplay stav |
| Legacy | žádný Canvas gameplay runtime ani paralelní save vrstva |

Porušení kteréhokoli bodu je regresní blocker.

## 4. v7.3 release gate

Před tagem `v7.3.0` musí nad jedním identickým frozen 40znakovým `RELEASE_SHA` projít:

1. exact-SHA Validate game: všech osm required jobů skutečně vykonaných a PASS;
2. deploy/Pages evidence pro stejný kandidát;
3. manual desktop speaker + headphones audio listen-through;
4. real-iPhone speaker + headphones audio listen-through;
5. real macOS Safari full-flow;
6. real iPhone Safari portrait, landscape, orientation a lifecycle;
7. žádný konkrétní otevřený P0/P1 release defect;
8. explicitní A0 nominace jednoho `RELEASE_SHA`;
9. independent A6 visual PASS na témže SHA.

Green CI není náhradou real-device Safari, poslechu ani A6.

## 5. Audio release truth

Kanonický v7.3 audio set:

- 21/21 souborů project-original procedural synthesis;
- žádné externí samples, stock recordingy ani ElevenLabs výstupy v canonical setu;
- 21/21 `CC0-1.0`;
- 21/21 technicky ověřeno přes FFprobe;
- 21 unikátních SHA-256;
- `finding-b` a `finding-c` jsou odlišné;
- celkový canonical payload 678 006 B.

Zbývající audio release gate je subjektivní fyzický poslech na desktopu a skutečném iPhonu (#269).

## 6. Autoritativní evidence

- produktové cíle: `docs/FINAL_GAME_GOALS.md`;
- architektura: `docs/ARCHITECTURE_CONTRACT.md`;
- v7.3 completion/release flow: `docs/V73_FULL_COMPLETION_PLAN.md`;
- launch checklist: `LAUNCH_CHECKLIST.md`;
- exact-SHA QA/A0: #334;
- A6/freeze: #335;
- audio manual gate: #269;
- Safari/device gate: #272;
- QA matrix: #280;
- documentation/release notes: #279;
- branch governance: #354.

Označení **hotovo/vydáno** je povoleno pouze pro konkrétní ověřený stav.