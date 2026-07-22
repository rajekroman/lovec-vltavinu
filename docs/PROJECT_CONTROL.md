# Řízení a integrace projektu

> Stav k 22. 7. 2026 po sloučení kompletního Chlum vertical slice PR #33. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Aktuální produkční základ je `main@91179090fcd28cec4b7ffbf7e50ff433d7eaabad`, squash merge PR #33.
- Runtime bootstrap baseline zůstává `777f6513aca45272935bf6f03c607c4453ff8b2e`; PR #33 ji rozšířil pouze o obecné GLTF načtení, model binding a kompletní Chlum scénu.
- Produkční `index.html` spouští jediný modulární `src/bootstrap.js`; runtime používá právě jeden Three.js `WebGLRenderer` s ortografickou kamerou.
- Čtyřlevelové pořadí je přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- Issue #29 je uzavřená jako dokončená. PR #33 byl sloučen až po finálním review, zeleném workflow a ověření portrait/landscape artefaktů.
- Chlum je dokončitelný v produkčním grafu: briefing → Václavovo povolení → naleziště → přesně tři zásahy → jeden nález → vyhnutí se traktoru → výsledek.
- Chlum emituje `level:complete` s `nextLevelId: "nesmen"`, ale Nesměň dosud není implementována ani automaticky spuštěna.
- Manifest obsahuje 11 aktivních Chlum assetů; GLB modely se načítají přes obecný `GlbModelLoader` a bindují přes `ModelFactory` do existujícího rendereru.
- Workflow #322 na finálním headu PR #33 skončil `success`. První mobilní pokus narazil na globální timeout dlouhého E2E; kontrolní rerun stejného headu prošel celý.
- Fyzický Safari průchod na konkrétním iPhonu zůstává manuálním release důkazem, nikoli blokací dokončené automatické integrační etapy.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód zůstávají zmrazené historické soubory a produkční bootstrap je nesmí importovat.
- PR #20 a uzavřený PR #21 jsou pouze donoři jednotlivých částí; nesmějí být sloučeny ani použity jako základ celé větve.
- Samostatný Nesměň vertical slice je nyní integračně přípustný, ale dosud pro něj nebyl vytvořen nový issue, pracovní branch ani PR.

## Rozhodnutí, která se znovu neotevírají

| Oblast | Závazné rozhodnutí |
|---|---|
| Rendering | Three.js/WebGL, právě jeden renderer, ortografická kamera |
| Produkční vstup | jediný `src/bootstrap.js`; žádný druhý gameplay runtime |
| Vizuální skladba | 2D transparentní sprity + low-poly GLB |
| UI | HTML/CSS overlay, žádné herní DOM elementy uvnitř ECS komponent |
| Architektura | ES moduly, scene manager, asset loader, input manager, ECS-lite, kolize, animace |
| Simulace | fixed timestep 60 Hz, max delta 100 ms, max 5 substepů, interpolovaný render |
| Ovládání | směrový vstup + jedno kontextové tlačítko `AKCE` |
| Kopání | přesně tři zásahy do rytmu; dig eventy literal `3` striktně validují |
| Nálezy | session skóre/kolekce bez inventářového UI; ID pole je `findingId` |
| Persistence | žádný nový save systém ani migrace; PLAY zahajuje čistou session |
| Nasazení | relativní cesty a GitHub Pages; `main` musí zůstat spustitelný |

## Stav pracovních proudů

| Proud / issue | Stav | Další přijímaný výstup | Integrační brána |
|---|---|---|---|
| P0 mobilní stabilita #1 | Automatické Chlum regrese zelené; chybí fyzický Safari důkaz | Manuální záznam na cílovém iPhonu | Žádný freeze, dvojí akce ani konfliktní overlay |
| CI a validace #2 | Chlum asset/unit/mobile E2E sloučeny | Rozšíření pro další přidělený level | Zelený celý workflow na finálním headu příslušného PR |
| Architektura #3 | Bootstrap a obecná GLTF/modelová integrace sloučeny | Pouze review nebo doložený obecný defect | Jeden renderer, žádná levelová logika v bootstrapu |
| Gameplay #4 | Chlum systémy a produkční tok sloučeny | Až nově přidělený Nesměň balík | Žádná paralelní session nebo levelová data |
| Grafika #5 | Chlum manifest, PNG, textury a GLB sloučeny | Až assety přiděleného dalšího levelu | Stabilní ID, rozpočty, pivot/bounds, dispose, bez 404 |
| UI/mobil | Obecné dialog/dig/result/HUD adaptéry sloučeny | Pouze obecné rozšíření vyžádané dalším levelem | Žádná DOM stavová autorita |
| Audio/výkon #6 | Samostatný AudioEngine není aktivní etapa | Bez práce do nového přidělení | Žádný nevyžádaný audio redesign |
| QA/release #7 | Workflow #322 a vizuální důkazy sloučeny | Fyzický Safari důkaz a QA dalšího levelu | Portrait/landscape, pauza, background, input reset |
| Chlum vertical slice #29 / PR #33 | **Dokončeno a sloučeno** | Pouze případný samostatný defect issue | Chlum zůstává hratelný na `main` |
| Nesměň vertical slice | **Přípustný, dosud nezaložený** | Nový issue, samostatná větev a draft PR | Musí vycházet z aktuálního `main` po governance aktualizaci |
| Master #8 | Aktivní | Určit nový Nesměň balík a udržovat frontu | Žádný paralelní release nebo další level bez přidělení |

## Integrační fronta

### 1. Řídicí kontrakt — dokončeno

`AGENTS.md`, `ARCHITECTURE_CONTRACT.md`, `PROJECT_CONTROL.md` a PR šablona byly zavedeny v PR #22.

### 1a. Karanténa historických snapshotů — platí

- PR #20, issue #19 a PR #21 jsou pouze dohledatelné zdroje jednotlivých kandidátních částí.
- Nepřenášet jejich alternativní strom, perspektivní kameru, eventový katalog ani starý branch base.

### 2. Sanace datového rozsahu — dokončeno

PR #23 byl sloučen jako `2e678506`.

- `LEVEL_ORDER = ["chlum", "nesmen", "besednice", "slavia"]`;
- session-only `GameSession` žije pouze v paměti;
- nálezy používají `findingId` a automaticky zvyšují score;
- žádná inventářová správa, persistence, migrace ani nový renderer.

### 3. Produkční bootstrap — dokončeno

PR #24 byl sloučen jako `777f6513`.

- jediný `src/bootstrap.js` a jeden ortografický `WebGLRenderer`;
- fixed-step 60 Hz, max delta 100 ms, max 5 substepů;
- fixed updates neběží během async transition;
- PLAY resetuje session;
- dig eventy přijímají literal `3`.

### 4. Chlum vertical slice — dokončeno

Issue #29 byla dokončena merge PR #33 jako `91179090`.

- finální implementační head: `8772478f93895445ad10212f9289cae429583dea`;
- jedna kontextová akce pro permission, dig a finding;
- přesně tři úspěšné rytmické zásahy;
- právě jeden finding `chlum-finding-1`, score 90;
- aktivní low-poly GLB traktor bez viditelného řidiče;
- obecný GLB loader a `ModelFactory` bez druhého rendereru;
- sjednocená datová a manifestová asset ID;
- assetové testy ověřují fyzické soubory, PNG rozměry, GLB parse, trojúhelníky, rozpočty a model binding;
- mobilní E2E ověřuje celý tok, tractor danger, pauzu, background návrat, čistou session a joystick reset;
- workflow #322 na finálním headu skončil zeleně;
- Playwright artefakt obsahuje portrait `1170×2532` a landscape `2532×1170` důkaz;
- nevznikl save systém, inventář, druhý renderer ani implementace Nesměně.

### 5. Nesměň vertical slice — další přípustná etapa, dosud nezaložena

Nový implementační balík smí vzniknout až po sloučení této governance aktualizace.

Povinné koordinační pořadí:

1. hlavní koordinační chat vytvoří samostatný Nesměň issue s přesným rozsahem a akceptací;
2. implementační chat znovu načte aktuální `AGENTS.md`, `ARCHITECTURE_CONTRACT.md` a `PROJECT_CONTROL.md`;
3. vytvoří jedinou větev `agent/<nesmen-tema>` z tehdy aktuálního `main`;
4. odevzdá jeden draft PR pouze pro Nesměň;
5. znovu použije sloučené obecné systémy, UI adaptéry, GLTF loader a model binding místo paralelních implementací;
6. neimplementuje Besednici ani Slavii;
7. vrátí PR z draftu až po dokončitelném toku, zeleném celém workflow, assetové validaci, portrait/landscape důkazu a HANDOFFu.

Do vytvoření samostatného issue není žádný Nesměň implementační chat aktivní.

### 6. Besednice a Slavia — blokováno Nesmění

Besednice a Slavia se převádějí po jednom, každý v samostatném PR nad sloučeným předchozím stupněm.

### 7. Legacy odstranění a finální release — blokováno levely

Canvas monolit, runtime opravné vrstvy a legacy save kód se odstraní až po převodu všech čtyř levelů. Finální release vyžaduje kompletní mobilní QA včetně fyzického Safari důkazu.

## Přidělení práce dalším chatům

Momentálně není aktivní žádný nový implementační levelový chat. Hlavní koordinační chat musí nejprve vytvořit Nesměň issue a určit jediný pracovní balík.

Do té doby jsou povoleny pouze:

1. review sloučeného Chlumu a samostatné defect issue;
2. fyzický Safari/iPhone důkaz;
3. governance příprava Nesměň zadání;
4. údržba CI bez rozšíření produktového rozsahu.

Zakázáno je:

- pokračovat na uzavřené větvi `agent/chlum-vertical-slice`;
- vytvářet Nesměň implementaci bez samostatného issue;
- implementovat Besednici nebo Slavii;
- vytvářet alternativní renderer, bootstrap, eventový katalog, `GameSession`, save systém nebo inventář.

## Formát hlášení chatu

```text
Větev: agent/<tema>
Issue: #<číslo>
Změněné soubory: ...
Změněné kontrakty: žádné / přesný seznam
Testy: příkaz + výsledek
Mobilní ověření: zařízení, orientace, výsledek
Výkon/assety: rozpočty, manifest, dispose
Známé limity: ...
PR: <odkaz>
```

Výstup bez větve, issue, PR a ověřitelných testů se nepovažuje za integrovatelný.
