# Lovec vltavínů — cíle finální verze

Stav dokumentu: závazný cílový a akceptační rámec pro post-release dokončení hry.
Navázaný issue: [#279](https://github.com/rajekroman/lovec-vltavinu/issues/279).
Autorita: při rozporu platí `AGENTS.md`, `docs/ARCHITECTURE_CONTRACT.md`, `docs/PROJECT_CONTROL.md` a aktuální výslovné zadání vlastníka.

## Hlavní cíl

Dokončit Lovce vltavínů jako vizuálně působivou, herně zábavnou a technicky stabilní browserovou hru pro desktop a mobil. Finální verze musí zachovat jedinou Three.js architekturu, čtyři kanonické lokality Chlum, Nesměň, Besednice a Malše/KD Slavia, jednu in-memory `GameSession`, žádnou gameplay persistence a žádné inventářové UI.

Dokončení musí být prokázáno automatickými testy a ručními vizuálními důkazy svázanými s přesným finálním SHA. Zelené CI samo o sobě není vizuální schválení.

## Neměnné produktové a architektonické podmínky

- jeden produkční `WebGLRenderer`, jedna `OrthographicCamera`, jeden fixed-step loop a jeden `InputManager`;
- čtyři lokality v pořadí Chlum → Nesměň → Besednice → Malše/KD Slavia;
- pohyb a jedno kontextové akční tlačítko pro klávesnici i touch;
- session stav pouze v paměti otevřené stránky;
- žádný save systém, gameplay `localStorage`, `sessionStorage`, `indexedDB`, inventář ani paralelní Canvas runtime;
- všechny runtime assety manifest-driven se stabilním ID, relativní URL, rozpočtem a vlastníkem dispose.

## 1. Finální podoba čtyř lokalit

- Použít schválené obrazové podklady uložené v kanonickém GitHub repozitáři.
- Zachovat výrazně odlišnou atmosféru každé lokality a konzistentní styl postav, rekvizit, efektů a HUD.
- Zajistit čitelnost hráče, NPC, interaktivních míst, nebezpečí a současného cíle na fotografických pozadích.
- Odstranit viditelné švy, nevhodné ořezy, černé či prázdné okraje, rušivé překryvy, rozpadlé textury a nesoulad perspektivy.
- Ověřit skutečný in-game render, ne pouze samostatné zdrojové bitmapy.

## 2. Smysluplná průchodnost map

- Definovat skutečné průchozí a neprůchozí oblasti, nejen vnější obdélníkové hranice levelu.
- Zablokovat vodu, budovy, ploty, stromy, skály, srázy a další zřetelné překážky.
- Viditelná překážka musí odpovídat skutečné kolizi; vizuálně volná cesta nesmí obsahovat neviditelnou bariéru.
- Všechny povinné NPC, nálezy, profily, stopy a interakční body musejí zůstat dosažitelné.
- Kolize nesmějí změnit objektivní pravidla ani vytvářet druhý movement systém.

## 3. Plynulé a kvalitní animace

- Vyladit chůzi hráče ve čtyřech směrech tak, aby frekvence snímků odpovídala rychlosti pohybu.
- Odstranit klouzání, cukání při změně směru, drift po uvolnění vstupu a nevhodné přepínání idle/walk.
- Zachovat konzistentní měřítko, ukotvení chodidel, facing a hitbox ve všech lokalitách.
- Ověřit idle, dialogové, reakční a akční animace NPC.
- Animace se musejí korektně zastavit nebo resetovat při pauze, dialogu, změně orientace, návratu z pozadí, přechodu scény a dispose.

## 4. Deset unikátních vltavínů

- Chlum: tři radarová místa a tři unikátní povrchové nálezy.
- Nesměň: tři profily, rytmické kopání se třemi úspěšnými zásahy a tři unikátní nálezy.
- Besednice: tři stopy a ježek, celkem čtyři unikátní nálezy.
- Celý průchod musí vytvořit přesně deset unikátních nálezů v jediné in-memory `GameSession`.
- Každý nález musí mít stabilní `findingId`, lokalitu, raritu, hmotnost a skóre.

## 5. Zábavný a srozumitelný průchod

- Chlum stojí na průzkumu, povolení a radaru.
- Nesměň nabízí čitelné rytmické kopání a obnovu vykopaných míst.
- Besednice propojuje stopy, profil, kopání, ježka, Karla a návrat.
- Slavia umožní z deseti nálezů vybrat přesně čtyři a zobrazí uspokojivé finální hodnocení poroty.
- Každá významná akce poskytne okamžitou vizuální a zvukovou odezvu.
- Hráč vždy rozumí současnému cíli, dostupné akci a výsledku svého rozhodnutí.

## 6. Mobil jako plnohodnotná platforma

- Stejný průchod musí fungovat na desktopu, iPhone portrait a iPhone landscape.
- Touch pohyb a kontextové tlačítko musejí být spolehlivé, ergonomické a mimo systémové safe-area.
- HUD nesmí překrývat důležité cíle ani ovládání.
- Otočení telefonu, pauza, dialog, návrat z pozadí a přechod scény nesmějí zanechat aktivní nebo zablokovaný vstup.
- Kamera musí zachovat hráče i relevantní cíl v čitelném prostoru bez odhalení prostoru mimo mapu.

## 7. SHA-bound QA a release evidence

- Každý integrační PR uvádí přesný base SHA, head SHA, změněné soubory, kontrakty, testy, mobilní dopad a známá omezení.
- Finální source freeze se kontroluje před i po sběru důkazů; drift base nebo head SHA znamená BLOCK.
- Automatická brána obsahuje statickou validaci, module graph, unit suite, desktop/mobile full-flow, portrait touch smoke, offline a audio lifecycle.
- Nezávislá read-only A6 vizuální brána kontroluje přesný frozen SHA v rozměrech desktop 1280×720, portrait 390×844 a landscape 844×390.
- Důkazy pokryjí všechny čtyři lokality, postavu v pohybu, průchodnost, HUD, kontextovou akci, radar, kopání, nálezy, přechody a finální porotu.
- Release může být označen jako hotový pouze při zelených automatických kontrolách a explicitním vizuálním PASS nad stejným SHA.

## Definition of Done

Projekt je dokončen pouze tehdy, když:

1. nový hráč projde bez zásahu do URL nebo konzole všechny čtyři lokality až k porotě a čistému restartu;
2. průchod vytvoří přesně deset unikátních nálezů a Slavia přijme přesně čtyři;
3. mapy mají věrohodné průchozí a neprůchozí oblasti a všechny povinné cíle jsou dosažitelné;
4. animace hráče a NPC působí plynule na desktopu i mobilu;
5. grafika odpovídá schváleným podkladům a je ručně vizuálně schválena ve třech povinných viewports;
6. nevznikl druhý renderer, inventář, save systém ani gameplay persistence;
7. všechny automatické i ruční release brány prošly nad jedním přesně zaznamenaným SHA.

## Navazující pracovní proudy

- dokončené integrační důkazy a produktové opravy jsou sloučené do `main`; historické PR a assetové workstreamy nejsou samostatnou otevřenou release bránou;
- finální výběr poroty, zachování deseti nálezů, mobilní automatizované průchody, atlasové animace a produkční assetové zapojení jsou kryté aktuálními testy a integrační historií;
- automatická QA autorita: #334; každý nový `main` SHA vyžaduje vlastní plnou validaci a PASS se nepřenáší ze staršího SHA;
- manual audio a potvrzení práv/provenance: #269;
- real macOS Safari a real iPhone Safari: #272;
- UI/UX a animační čitelnost ve finálním vizuálním auditu: #275;
- produkční QA matice: #280;
- dokumentace a release notes: #279;
- ochrana `main` před source freeze: #354;
- nominace jediného frozen `RELEASE_SHA` a nezávislá A6 brána: #335.

Historický audit #226 patří vydanému `v7.0.0` a není release bránou současného kandidáta. Dokud nejsou manual/device brány, ochrana větve, frozen `RELEASE_SHA` a nezávislý A6 PASS doložené nad stejným SHA, je release stav `BLOCK`.
