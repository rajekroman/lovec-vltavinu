# V7.3 — stav rozpracované práce

Revize: **1.2.0 · 30. 8. 2026**
Větev: `claude/dokoncit-zbyvajici-levely-704apq` (předchozí kolo sloučeno v PR #289)

Tento dokument nahrazuje šestnáct rozporuplných status/plán souborů, které se
nahromadily v kořeni repozitáře. Autoritativní zůstává `docs/PROJECT_CONTROL.md`
(release registr) a `docs/ARCHITECTURE_CONTRACT.md` (technické invarianty);
tenhle soubor popisuje jen rozpracovanou v7.3 práci nad vydaným `v7.0.0`.

## 1. Vydaná verze vs. rozpracovaná práce

Produkt na všech distribučních plochách nese **7.0** — `index.html`, cache
service workeru, `package.json` i README. Poslední vydaný tag je `v7.0.0`
(viz `docs/PROJECT_CONTROL.md` §1).

Označení „v7.3“ používá jen dokumentace a issues pro rozpracovaný balík funkcí.
Číslo verze se povýší **až samostatným release issue** s explicitním candidate
SHA a zelenou QA maticí — sloučení feature PR release nevytváří.

## 2. Co je v kódu hotové a ověřené

| Oblast | Stav | Důkaz |
|---|---|---|
| Čtyři kanonické lokality | hotovo | `src/scenes/{ChlumV7,Nesmen,Besednice,Slavia}Scene.js` |
| Foreground vrstvy všech lokalit | hotovo | `assets/sprites/foreground/*-v7.webp`, v manifestu i v sw.js |
| Animované NPC atlasy | hotovo | `src/render/{NPCAnimationSystem,SpriteAtlas}.js` |
| Sekundární obrazovky (deník, nastavení, příběh, pauza) | hotovo | `src/ui/ScreenController.js` |
| Přístupnost — ARIA, klávesnice, fokus | hotovo v kódu | `src/ui/{ScreenController,HudController}.js` |
| Barvoslepost, vysoký kontrast, velký text | hotovo | `style.css` (`html[data-colorblind=…]`, `.high-contrast`, `.large-text`) |
| PWA a offline cache | hotovo, ověřeno za běhu | `manifest.webmanifest`, `sw.js`, `tests/offline-smoke.spec.mjs` |
| Unit testy | 252 / 252 | `npm test` |
| Statická validace | 0 chyb, 0 varování | `npm run validate` |

Nastavení hry řídí **`src/ui/ScreenController.js`** (obrazovka `settingsScreen`).
Starší dokumentace odkazovala na `src/ui/SettingsPanel.js`; ten modul byl mrtvý
kód mimo runtime graf a je odstraněný.

## 3. Co zbývá

### 3.1 Přístupnost — co je ověřené a co ne

**Ověřeno automatizovaně (22. 8. 2026, axe-core 4.13, Chromium 141):**

| Rozsah | Výsledek |
|---|---|
| 4 obrazovky (titulek, nápověda, příběh, nastavení) × 6 režimů | 0 porušení WCAG 2.1 A/AA |
| HUD během hry na Chlumu × 6 režimů | 0 porušení WCAG 2.1 A/AA |
| Kontrast: 300 textových prvků | 0 pod limitem AA |

Režimy: výchozí, deuteranopia, protanopia, tritanopia, vysoký kontrast, velký text.
Obrazovky se otevíraly **skutečným klikem v UI**, ne nastavením tříd — vynucený
stav dává falešný výsledek, protože plátno pak leží nad obrazovkou a axe většinu
pravidel přeskočí jako nepoužitelná.

Kontrast počítán vlastním výpočtem, ne axe: pozadí jsou gradienty s
`backdrop-filter`, u kterých axe vrací `incomplete`. Výpočet skládá všechny
vrstvy pozadí přes celý řetěz předků a bere **nejhorší bod gradientu**. Ověřen
proti záměrně špatnému vzorku (`#2a2f2c` na tmavém pozadí → 1,41:1, odhaleno)
i dobrému (bílá → 19,22:1, prošel).

**Nalezeno a opraveno:** `#objectiveProgress` (HUD) a `#pauseProgress` (pauza)
měly `role="progressbar"` bez přístupného jména — porušení WCAG 4.1.2 se
závažností *serious* ve všech šesti režimech. Progressbar nedědí jméno z obsahu,
takže screen reader hlásil jen číslo bez kontextu. Doplněn `aria-label` podle
vzoru, který už používal `heatPill` („Pozornost hlídky“).

**Stále neověřeno — vyžaduje zařízení:**
- skutečný screen reader (NVDA na Windows, VoiceOver na iOS) — automat neověří
  srozumitelnost oznámení, jen přítomnost atributů;
- průchod pouze klávesnicí od titulku po výsledek;
- dotykové cíle a gesta na reálném iPhonu.

Automatizovaná část tedy pokrývá strukturu, ARIA kontrakty a kontrast; zbytek je
o použitelnosti, kterou nelze změřit bez člověka a zařízení.

### 3.2 Offline režim — ověřeno

Do 30. 8. 2026 nebyl offline režim nikdy otestovaný za běhu: `playwright.config.mjs`
má globálně `serviceWorkers: "block"`, takže žádný smoke test service workera
vůbec nespustil. Ověřený byl jen statický soulad seznamu v `sw.js` s runtime grafem.

Nově to kryje `tests/offline-smoke.spec.mjs` v projektu `offline-chromium`
(jediný, kde je `serviceWorkers: "allow"`). Chlum se hraje **až po odpojení
sítě** a v samostatném browser contextu — jinak by test byl razítko:

- kdyby se hrálo online před odpojením, network-first fetch handler by si
  assety nacachoval cestou a chybějící položka v CORE by prošla;
- kdyby čerstvý klient sdílel context s referenčním během, četl by jeho cache.

Obojí jsem ověřil experimentem: s odebraným `chlum-wet-verge-v7.webp` ze `sw.js`
obě slabší varianty testu **prošly**, správná varianta selhala. Test navíc
porovnává množinu načtených assetů online vs. offline — samotné „nespadlo to“
nestačí, protože scéna běží dál i při tichém selhání textury.

Výsledek na zdravém stromu: 16 assetů Chlumu načtených offline shodně jako
online, 0 selhaných requestů.

### 3.3 Nepřehrávané animace NPC
Atlasy definují 16 animací, ale scény pouštějí jen 7. Nikdy se nepřehrají:

```
action_point      react_alert       action_beckon
react_curious     react_pondering   react_skeptical
react_smug        react_mysterious  react_friendly
```

Snímky se tedy stahují, ale nikdy nezobrazí. Napojení vyžaduje **designové
rozhodnutí**, ve kterých herních momentech se mají spouštět — není to oprava,
kterou lze udělat mechanicky. Do té doby zůstávají atlasy beze změny.

### 3.4 Mobilní QA matice
Průchod na reálném iPhonu a Androidu v portrait i landscape režimu.

**Pozor na výklad CI:** workflow `Validate game` záměrně přeskakuje projekty
`iphone-portrait` a `iphone-landscape`, pokud událost je `pull_request` —
drahé plné mobilní průchody běží jen na push do `main` a při ručním release
gate. Přeskočené joby se v GitHub Actions reportují jako **success**, ne jako
skipped, takže zelená fajfka u těchto dvou checků na PR neznamená, že plný
mobilní průchod proběhl. Pro release evidenci platí jen běhy z `main` nebo
`workflow_dispatch`.

## 4. Co bylo odstraněno a proč

Audit celého stromu (22. 8. 2026) našel a odstranil:

- **Zakázaná persistence vrstva** — `persistence/StorageAdapter.js` používal
  `localStorage`, což `AGENTS.md` výslovně zakazuje. Byl umístěný mimo `src/`,
  kam validátor nedosáhl. Scan je nově rozšířený na celý first-party strom.
- **15 nedosažitelných modulů** — žádný nešel naimportovat z `bootstrap.js`
  ani ho nekryl test. Service worker jich 11 zbytečně precacheoval.
- **10,6 MB nepoužívaných assetů** — 19 WAV souborů, které nebyly v manifestu
  ani v žádném modulu (runtime používá čtyři MP3 v `assets/audio/`), plus
  sprity nahrazené `-v2`/`-v7`/`-atlas` variantami.
- **Legacy v5 UI v `index.html`** — `#bossHud`, `#bossIntro`, `#identifyScreen`,
  `#perkScreen`, `#juryScreen` a jejich CSS. Verdikt poroty jde přes generický
  `#resultScreen`, boss fight hlásí danger meter.
- **Šestnáct status/plán dokumentů** — obsahovaly vzájemně neslučitelná tvrzení
  a navrhovaly funkce, které `AGENTS.md` zakazuje (save systém, cloud save,
  inventář). `IMPLEMENTATION_STATUS.md` navíc vedl `localStorage` persistenci
  jako hotovou funkci.

Takzvaný „audio compression blocker“ vedený jako blokátor launche byl **fiktivní** —
ty WAV soubory runtime nikdy nenačítal.

## 5. Oprava načtení `v7.css`

`v7.css` se dřív injektoval až konstruktorem `ChlumV7Scene`. Při vstupu rovnou
do pozdější lokality (`app.changeScene("nesmen")`, což dělá i
`tests/mobile-animation-smoke.spec.mjs`) zůstal HUD bez stylů. Nově je
linkovaný staticky v `index.html`; `ensureV7Theme()` zůstává jako idempotentní
pojistka.

## 6. Zbylá dokumentace

| Soubor | Role |
|---|---|
| `AGENTS.md` | závazná pracovní pravidla, pořadí autority |
| `docs/PROJECT_CONTROL.md` | autoritativní release registr |
| `docs/ARCHITECTURE_CONTRACT.md` | technické invarianty |
| `docs/V7_VISUAL_CONTRACT.md` | vizuální cíl lokalit |
| `docs/ART_PIPELINE.md` | původ a reprodukce assetů |
| `GAME_DESIGN.md` | herní koncept |
| `GAME_MECHANICS_GUIDE.md` | reference mechanik (ověřeno proti `DigMechanics.js`) |
| `VISUAL_INTEGRATION_PLAN.md` | podklady vizuální fáze |
| `CHANGELOG.md` | změny; v7.3 sekce vedena jako nevydaná |
