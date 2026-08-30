# Lovec vltavínů — v7.3 development candidate

Mobilní browserová arkádová hra z jihočeských nalezišť vltavínů. Hráč projde čtyři kanonické kapitoly **Chlum → Nesměň → Besednice → KD Slávie**, sestaví výstavní kolekci a získá finální hodnocení poroty.

> **Release status:** aktuálně vydaný GitHub Release je `v7.0.0`. Větev `main` obsahuje rozpracovaný kandidát v7.3, který **není vydaný ani release-certifikovaný**. Green CI samo o sobě není release ani A6 PASS.

## Připraveno pro v7.3

- **Vylepšené animace**: plynulý chod hráče bez klouzání ve všech čtyřech směrech;
- **NPC animace**: Václav, Jan, Milan, Karel, Eva a František s idle, talk a reakčními animacemi;
- **Mobilní stabilita**: změny orientace, pause/resume lifecycle a dotykový joystick;
- **Data-driven walkability**: polygon, circle a rect zóny pro všechny 4 lokality;
- **Kanonický findings flow**: Chlum 3 → Nesměň 3 → Besednice 4, celkem 10 unikátních findings;
- **Slavia jury**: z 10 findings lze zvolit právě 4 pro finální hodnocení.

## Stav produktu

- jeden modulární ES-module runtime spuštěný z `src/bootstrap.js`;
- jeden Three.js `WebGLRenderer` s ortografickou kamerou a bounded follow kamerou;
- desktopové ovládání klávesnicí a dotykové ovládání s Pointer Events API;
- jedna in-memory `GameSession` bez save systému, gameplay persistence a inventářového UI;
- žádná gameplay persistence v `localStorage`, `sessionStorage` ani IndexedDB;
- hudba a zvuky odemykané uživatelským gestem s lifecycle obsluhou pro pozadí, návrat a `pagehide`;
- service worker slouží pouze jako distribuční cache statických souborů;
- plný průchod končí výsledkem poroty a čistým restartem nové výpravy;
- automatická validace zahrnuje unit/statické kontroly a Playwright full-flow/smoke projekty pro desktop a mobile profily.

## Herní průchod

1. **Chlum** — získání souhlasu, sběr 3 nálezů a vyhýbání se traktoru.
2. **Nesměň** — lesní profily, rytmické kopání a 3 další nálezy.
3. **Besednice** — hledání stop, kopání a 4 další nálezy.
4. **KD Slávie** — venkovní sběratelská akce u Malše: dokumentace původu, certifikace sbírky a finální porota nad 10 findings s výběrem právě 4.

Kopání používá tři úspěšné zásahy do rytmu. Veškeré interakce probíhají jedním kontextovým akčním tlačítkem.

## Ovládání

### Desktop

- pohyb: šipky nebo `WASD`;
- akce: kontextové akční tlačítko podle nápovědy ve hře;
- pauza: tlačítko v HUD.

### Mobil

- levá strana: virtuální joystick;
- pravá strana: jedno kontextové akční tlačítko;
- podporovaný je portrait i landscape režim, safe-area a reset vstupu při otočení, ztrátě fokusu nebo návratu z pozadí.

## Lokální spuštění

Projekt je statická webová aplikace. Musí běžet přes HTTP server, ne přímo z `file://`.

```bash
python3 -m http.server 8080
```

Poté otevřete `http://localhost:8080/`.

## Testy

Požadováno je Node.js 24.

```bash
npm install --no-audit --no-fund --no-package-lock
npm test
npm run test:smoke
```

Dostupné příkazy:

- `npm run validate` — statický validátor produktu a architektonických invariantů;
- `npm run validate:modules` — syntaxe všech modulů pod `src/`;
- `npm run test:unit` — unit testy modulárního runtime;
- `npm run test:smoke` — Playwright matice desktop, iPhone portrait, iPhone landscape, audio lifecycle a offline režim;
- `npm test` — validátor, syntaxe modulů a unit testy.

Produkční grafika V7 (Chlum, Nesměň, Besednice, Slavia) jsou authored bitmap assety uložené přímo v repozitáři, bez generátoru nebo build kroku. Původ a souřadnicový kontrakt popisuje `docs/ART_PIPELINE.md`.

CI workflow `Validate game` ukládá validační a Playwright artefakty. Automatický PASS je funkční evidence, nikoli náhrada za real-device, audio nebo independent A6 sign-off.

## Architektura

Normativní pravidla jsou v:

- `AGENTS.md` — pravidla práce, vlastnictví cest a Definition of Done;
- `docs/ARCHITECTURE_CONTRACT.md` — modulární, eventový, renderovací a datový kontrakt;
- `docs/FINAL_GAME_GOALS.md` — autoritativní produktové cíle a Definition of Done;
- `docs/PROJECT_CONTROL.md` — integrační stav a certifikační evidence;
- `docs/V73_STAV.md` — stav rozpracované v7.3 práce nad vydaným `v7.0.0`;
- `docs/V7_VISUAL_CONTRACT.md` — vizuální cíl jednotlivých lokalit;
- `docs/ART_PIPELINE.md` — původ, reprodukce a metadata produkčních assetů.

Produkční strom nesmí znovu zavést `game.js`, `runtime-stability.js`, Canvas gameplay runtime, druhý renderer, save migrace ani inventář.

## GitHub Pages

Aplikace používá relativní URL a je připravená pro publikaci z kořene větve `main` přes GitHub Pages.

Po nasazení je nutné ověřit veřejnou URL na desktopu a skutečném iPhonu v portrait i landscape režimu. Ověření musí zahrnout titulní obrazovku, celý kanonický průchod, audio po gestu, návrat z pozadí, finální porotu a čistý restart.

## Release a certifikace

Poslední publikovaný GitHub Release je **`v7.0.0`**. Stav na `main` je development/release-candidate práce pro v7.3 a nesmí být prezentován jako vydaný `v7.3.0`, dokud nejsou splněny všechny release brány.

Pro v7.3 platí:

1. všechny zamýšlené code/CSS/asset/governance změny musí být nejprve integrovány;
2. výsledný kandidátní SHA musí mít skutečně vykonaný exact-SHA CI PASS v požadované browser matici;
3. musí být dokončen manual desktop audio listen-through;
4. musí být dokončen real-mobile audio listen-through;
5. musí být doložena real Safari/macOS a real iPhone Safari evidence;
6. teprve poté lze explicitně nominovat jeden frozen 40znakový `RELEASE_SHA`;
7. independent A6 visual gate musí proběhnout a projít na stejném `RELEASE_SHA`;
8. až poté je povolen tag/GitHub Release `v7.3.0`.

`skipped` nebo `cancelled` není PASS. PASS na starším SHA se nepřenáší. Playwright/WebKit není real Safari sign-off. Green CI není visual A6 PASS. Jakákoli další změna po freeze vytvoří nový SHA a vyžaduje odpovídající re-certifikaci.
