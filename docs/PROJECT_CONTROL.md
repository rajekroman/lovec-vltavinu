# Řízení a integrace projektu

> Stav k 22. 7. 2026 po zahájení implementace Chlum vertical slice v draft PR #33. Tento dokument propojuje práci všech projektových chatů. Normativní technický kontrakt je v `ARCHITECTURE_CONTRACT.md`.

## Aktuální realita

- Runtime baseline je `777f6513aca45272935bf6f03c607c4453ff8b2e`, squash merge produkčního bootstrap PR #24.
- Minimální governance baseline je `65ce1380aa84f1446d05b437fe4ebb50a3660d6c`, merge řídicího PR #31. Skutečný branch point další práce je vždy aktuální `main` v okamžiku založení větve; musí obsahovat tuto baseline i všechny pozdější governance-only aktualizace.
- Produkční `index.html` nyní spouští jediný modulární `src/bootstrap.js`; aktivním runtime je Three.js verze 6.0 s jedním `WebGLRenderer` a ortografickou kamerou.
- PR #24 sloučil transition-safe fixed update, čistý session start při PLAY, striktní literal `3` u dig eventů, kanonický katalog eventů a mobilní regresní testy.
- Gameplay/datová sanace z PR #23 zůstává závazná: levely jsou přesně `chlum`, `nesmen`, `besednice`, `slavia`; `GameSession` je session-only a nálezy používají `findingId`.
- `game.js`, `runtime-stability.js`, legacy Canvas runtime a save kód mohou v repozitáři dočasně zůstat pouze jako zmrazené historické soubory. Produkční bootstrap je nesmí importovat.
- PR #20 zůstává pouze donor jednotlivých částí a nesmí být sloučen jako celek.
- PR #21 je starý uzavřený donor Chlum assetů nad `main@1837c7b`. Vybrané assety se mohou přenést nebo znovu vytvořit pouze v novém Chlum balíku nad aktuálním `main`; PR #21 se neslučuje samostatně.
- Jediným aktivním implementačním balíkem integrační etapy 4 je issue #29 a draft PR #33 na větvi `agent/chlum-vertical-slice`.
- V PR #33 jsou zatím pouze čisté gameplay systémy, Chlum entity/dialog data a unit testy. Nejsou ještě napojené do produkční `ChlumScene`; chybí assety, manifest, UI vazby, celý browser průchod a vizuální důkaz.

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
| P0 mobilní stabilita #1 | Automatické regrese sloučeny, chybí fyzický Safari důkaz | Záznam kompletního průchodu na cílovém iPhonu | Žádný freeze, dvojí akce ani konfliktní overlay |
| CI a validace #2 | Základ a bootstrap smoke sloučeny | Rozšířit o celý Chlum tok a asset kontrolu | Zelený workflow na finálním headu PR #33 |
| Architektura #3 | Produkční bootstrap dokončen v PR #24 | Pouze integrační podpora při doloženém defectu | `src/core`, `src/render` a `src/bootstrap.js` se běžně nemění; výjimka musí být minimální a zdůvodněná |
| Gameplay #4 | Čtyřlevelová data a session-only stav dokončeny; první Chlum systémy v PR #33 | Napojit systémy do scény a dokončit tok | Žádná paralelní session nebo levelová data |
| Grafika #5 | PR #21 je uzavřený donor Chlum assetů | Integrovat skutečné Chlum PNG/GLB/textury přímo v PR #33 | Manifest, rozpočty, pivoty, dispose, bez 404 |
| Audio/výkon #6 | Samostatný nový AudioEngine dosud není aktivní etapa | Bez rozšíření Chlum balíku, kromě minimálních již existujících hooků | Žádný nový audio redesign v PR #33 |
| QA/release #7 | Bootstrap smoke sloučen | Unit a mobilní end-to-end smoke celého Chlumu | iPhone viewport, portrait/landscape, pauza a background návrat |
| Chlum vertical slice #29 / PR #33 | **Aktuální integrační etapa; draft, částečně implementováno** | Dokončit stejný PR bez vedlejšího implementačního PR | Kompletní Chlum, zelené testy, vizuální důkaz, žádný další level |
| Master #8 | Aktivní | Udržovat pořadí, rozhodnutí a blokace PR | Žádný paralelní release mimo frontu |

## Integrační fronta

### 1. Řídicí kontrakt — dokončeno

`AGENTS.md`, `ARCHITECTURE_CONTRACT.md`, `PROJECT_CONTROL.md` a PR šablona byly zavedeny v PR #22.

### 1a. Karanténa snapshotu 0.15.0 — platí

- PR #20 a issue #19 slouží pouze jako dohledatelný zdroj jednotlivých kandidátních částí.
- Snapshot není integrační etapa ani náhrada aktuálního `main`.
- Nepřenášet jeho alternativní strom, perspektivní kameru, eventový katalog ani ECS komponenty s Three.js objekty.

### 2. Sanace datového rozsahu — dokončeno

PR #23 byl sloučen jako `2e678506` a issue #4 byla uzavřena.

- `LEVEL_ORDER = ["chlum", "nesmen", "besednice", "slavia"]`;
- session-only `GameSession` žije pouze v paměti;
- nálezy používají `findingId` a automaticky se započítávají do skóre;
- žádná inventářová správa, persistence, migrace ani nový renderer;
- objective data používají jediné kontextové tlačítko a dig cíle vyžadují přesně tři zásahy.

### 3. Produkční bootstrap — dokončeno

PR #24 byl sloučen jako `777f6513`.

- produkční HTML spouští jediný `src/bootstrap.js`;
- existuje jeden lokálně připnutý Three.js `WebGLRenderer` s ortografickou kamerou;
- fixed-step parametry jsou 60 Hz, max delta 100 ms a max 5 substepů;
- fixed scene updates neběží během async transition;
- PLAY resetuje session před vstupem do Chlumu;
- dig eventy přijímají u požadovaných polí výhradně literal `3`;
- `ChlumScene` je zatím pouze integrační kostra;
- workflow #202 a odpovídající unit/mobile regrese prošly.

### 4. Chlum vertical slice — aktuální etapa

Kanonický balík je issue #29 a jediným implementačním PR je draft PR #33.

- **Runtime baseline:** `777f6513aca45272935bf6f03c607c4453ff8b2e`.
- **Minimální governance baseline:** `65ce1380aa84f1446d05b437fe4ebb50a3660d6c`.
- **Branch point:** aktuální `main` v okamžiku založení implementační větve; před ready-for-review musí být větev znovu srovnána s aktuálním `main`.
- **Větev:** `agent/chlum-vertical-slice`.
- **PR:** draft #33; žádný vedlejší implementační PR není povolen.
- **Tok:** briefing → povolení zemědělce Václava → hledání vhodného místa → tři rytmické zásahy → jeden zapsaný nález → vyhnutí traktoru → dokončení Chlumu.
- **Session výsledek:** `level:complete` používá `levelId: "chlum"`, `nextLevelId: "nesmen"` a aktuální score, ale PR nesmí implementovat ani spouštět Nesměň.

Aktuálně přijatelná rozpracovaná vrstva PR #33:

1. `InteractionSystem`, `DigSystem`, `DangerSystem` a tenká objective vazba jsou v povoleném gameplay rozsahu;
2. Chlum entity, permission dialog a tři finding varianty jsou datově oddělené;
3. unit testy exact-three, permission, finding uniqueness, objective a danger procházejí;
4. workflow může být zelený, ale dokud moduly nejsou v produkčním grafu, neprokazuje dokončený vertical slice.

Povinné zbývající kroky PR #33:

1. srovnat větev s aktuálním `main` a zachovat všechny governance-only aktualizace;
2. instancovat Chlum entity do `World` a napojit systémy v závazném fixed-step pořadí `ChlumScene`;
3. dokončit pohyb hráče, permission dialog, aktivaci dig site, tři zásahy, jediný nález, tractor hazard a level completion;
4. doplnit skutečné Chlum PNG/GLB/textury, manifest, asset rozpočty, pivoty/rozměry a dispose vlastníky;
5. doplnit existující HUD/screen adaptéry bez nové stavové autority;
6. doplnit end-to-end mobilní browser průchod, portrait/landscape vizuální důkaz a kompletní HANDOFF.

Doložený GLB integrační defect:

- issue #29 vyžaduje low-poly GLB traktor, ale aktuální bootstrap registruje pouze `json` a `texture` loadery;
- rozpracovaná Chlum data zatím označují traktor jako `sprite`;
- v PR #33 je proto povolena minimální obecná výjimka pro lokálně připnutý GLTF loader, registraci typu `gltf`, modelovou factory/binding a nezbytné bootstrap zapojení;
- výjimka musí být v PR technicky zdůvodněná, bez quest logiky v bootstrapu a bez druhého rendereru, kamery nebo loopu.

Další technické podmínky:

- objective modul nesmí přijímat libovolný `levelId` a současně skrytě hardcodovat `chlumPermission`; buď je explicitně Chlum-only, nebo flag odvozuje z kanonických dat;
- všechny stringové datové entity musí být při instanci bezpečně mapovány na interní entity ID `World`;
- stávající zelený smoke není akceptační důkaz, dokud neprojde skutečný tok přes produkční `ChlumScene`.

Zakázané změny:

- nevytvářet druhý renderer, kameru, loop, eventový katalog nebo `GameSession`;
- nepřidávat save/import/export, localStorage, continue ani inventář;
- neimplementovat Nesměň, Besednici ani Slávii;
- neslučovat celý PR #20 nebo PR #21 a nepoužívat jejich starý base jako základ;
- nevytvářet vedlejší implementační PR mimo #33.

Akceptační brána:

1. Chlum je dokončitelný od PLAY bez konzole nebo ruční URL;
2. Václavovo povolení vznikne přiblížením a jedním stiskem `AKCE`;
3. kopání dokončí pouze přesně tři úspěšné zásahy a používá kanonické dig eventy;
4. nález se přes `findingId` zapíše právě jednou do `GameSession` a zvýší score;
5. traktor je skutečný čitelný low-poly GLB hazard a nezpůsobí freeze, dvojí akci ani zablokovaný vstup;
6. objective se dokončí pouze po povolení, třech zásazích a jednom nálezu;
7. všechny runtime assety mají stabilní ID, relativní URL, rozpočet, pivot/rozměry a dispose vlastníka;
8. syntaxe, celý unit suite, validátor a mobilní browser smoke celého toku jsou zelené;
9. PR obsahuje portrait/landscape vizuální důkaz a HANDOFF podle `AGENTS.md`;
10. existuje stále právě jeden renderer a nevznikl save systém ani inventář.

Teprve po merge issue #29 / PR #33 lze otevřít samostatný Nesměň vertical slice.

### 5. Zbývající levely a finále — blokováno Chlumem

Nesměň, Besednice a Slavia se převádějí po jednom, každý v samostatném PR nad sloučeným předchozím stupněm. Každý musí mít vlastní briefing, riziko, dokončitelný cíl a mobilní smoke scénář.

## Přidělení práce dalším chatům

Aktuálně je aktivní pouze implementační chat issue #29 na větvi `agent/chlum-vertical-slice` a draft PR #33. Všechny další Chlum změny musí pokračovat v tomto jediném PR. Chat musí před ready-for-review srovnat větev s aktuálním `main`; runtime API a implementační rozsah jsou dány baseline `777f6513`. Nesmí současně otevírat další level nebo alternativní architekturu.

Ostatní proudy smějí dodat pouze review nebo úzce vyžádanou integrační podporu v témže PR:

1. **Gameplay/data:** čisté systémy, Chlum data a objective testy; bez paralelní session.
2. **Grafika:** pouze Chlum manifest, sprity, GLB, textury a rozpočty; bez gameplay pravidel.
3. **UI/mobil:** pouze obecné HUD/screen/input vazby nutné pro Chlum; bez levelových dat.
4. **QA:** unit/browser testy, asset dostupnost a vizuální důkaz; bez nové funkce.
5. **Architektura:** review a pouze minimální doložená GLTF/modelová integrační výjimka.
6. **Audio/výkon:** samostatný vývoj je do merge Chlumu pozastaven.

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
