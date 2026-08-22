# V7.3 — stav rozpracované práce

Revize: **1.0.0 · 22. 8. 2026**
Větev: `claude/v73-accessibility-pwa-dokončit`

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
| PWA a offline cache | hotovo | `manifest.webmanifest`, `sw.js` |
| Unit testy | 252 / 252 | `npm test` |
| Statická validace | 0 chyb, 0 varování | `npm run validate` |

Nastavení hry řídí **`src/ui/ScreenController.js`** (obrazovka `settingsScreen`).
Starší dokumentace odkazovala na `src/ui/SettingsPanel.js`; ten modul byl mrtvý
kód mimo runtime graf a je odstraněný.

## 3. Co zbývá

### 3.1 Přístupnost — ověření na zařízeních
Kód je hotový, chybí ověření na reálných zařízeních: screen reader (NVDA na
Windows, VoiceOver na iOS), průchod pouze klávesnicí a kontrola kontrastních
poměrů podle WCAG 2.1 AA. Bez toho nelze soulad tvrdit, jen předpokládat.

### 3.2 Nepřehrávané animace NPC
Atlasy definují 16 animací, ale scény pouštějí jen 7. Nikdy se nepřehrají:

```
action_point      react_alert       action_beckon
react_curious     react_pondering   react_skeptical
react_smug        react_mysterious  react_friendly
```

Snímky se tedy stahují, ale nikdy nezobrazí. Napojení vyžaduje **designové
rozhodnutí**, ve kterých herních momentech se mají spouštět — není to oprava,
kterou lze udělat mechanicky. Do té doby zůstávají atlasy beze změny.

### 3.3 Mobilní QA matice
Průchod na reálném iPhonu a Androidu v portrait i landscape režimu.

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
