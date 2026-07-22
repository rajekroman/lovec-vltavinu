# Lovec vltavínů – čtyřlevelové MVP

Funkční vertikální řez browser hry postavený na Three.js, TypeScriptu a Vite.
MVP ověřuje kompletní cestu čtyřmi lokalitami: Chlum, Nesměň, Besednice a KD
Slavia. Postavy jsou 2D sprite sprity, prostředí tvoří stylizované 3D objekty
a veškeré ovládání používá jedinou kontextovou akci.

## Aktuálně implementováno

- jeden persistentní Three.js renderer;
- asynchronní asset manager s manifestem a bundle systémem;
- podpora textur, JSON atlasů a GLB modelů;
- scene manager a univerzální gameplay scéna;
- lehká ECS komponentová architektura;
- vstup z klávesnice a dotykových tlačítek;
- pevný update loop 60 Hz s interpolovaným renderingem;
- 2D kolize v rovině X/Z a spatial hash pro statické překážky;
- sprite animátor pro čtyřsměrný atlas;
- AI vytvořený transparentní atlas hlavní postavy;
- responzivní HUD, úvod levelu, pauza a kontextová akce;
- čtyři datově řízené lokality s briefingem na začátku každého levelu;
- Chlum: povolení hospodáře, kopání a odchod z pole;
- Nesměň: dva postupné profily, tři rytmické zásahy na každý nález a zasypání děr;
- Besednice: povolení strážce, ježkový nález a jednoduchý střet s rivalem;
- KD Slavia: jedinečná expertka, zloděj Franta, certifikace lokalit a závěr na akci Na Zelené Vlně;
- statický AI atlas lesníka Milana zapojený do Chlumu a Nesměně jako samostatná interakce;
- AI sprite traktoru s viditelným řidičem zapojený jako pohyblivý hazard v Chlumu;
- tři AI sprite varianty vltavínu (A/B/C), které se zobrazí jako odměna podle kvality nálezu;
- samostatný atlas strážce naleziště, rivala a Franty – zloděje;
- žádný inventář ani dialogové větvení – nálezy se automaticky započítávají do skóre;
- NPC se aktivují přiblížením a jediným akčním tlačítkem;
- protivníka hráč najde, přiblíží se a vyřeší jedním akčním stiskem;
- každý level má samostatný pohyblivý hazard a sdílený indikátor nebezpečí;
- blízkost hazardu zvyšuje poplachový metr, po úniku klesá a při kritické úrovni zobrazí jednorázové varování;
- kritický poplach hráče krátce znehybní, takže má jasný důvod držet se mimo dráhu;
- kritický poplach vrací hráče na poslední bezpečnou pozici a krátce jej znehybní;
- rytmická kopací minihra vyžaduje tři úspěšné zásahy;
- samostatný AI atlas hrdiny pro kopání se aktivuje pouze během rytmické minihry;
- po nálezu proběhne krátká vizuální sekvence: otevření půdy, prach a vystoupení vltavínu;
- automatizované testy rytmu, kolizí, povolení, poplachu a sekvence lesních děr.
- procedurální zvukové cue pro briefing, akci, povolení, kopání, nález,
  certifikaci, poplach, přechod mezi levely a finále;
- zvuk se odemyká až po uživatelském gestu a neblokuje spuštění hry bez podpory
  Web Audio.

Kamera používá explicitní `CAMERA_ZOOM = 1.5`, tedy přiblížení o 50 % proti
původnímu prototypovému offsetu. HUD zůstává HTML/CSS overlay a na dotyku se
přepíná na směrový pad s jedním tlačítkem `AKCE`.

Save systém záměrně není součástí této fáze.

Úplná technická specifikace – strom složek, odpovědnosti modulů, datové
struktury, katalog všech eventů a přesné pořadí update loopu – je v
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Spuštění

```bash
npm install
npm run dev
```

Výchozí vývojový server používá loopback adresu, která funguje i v omezeném
vývojovém prostředí. Pro otevření hry z telefonu nebo jiného zařízení ve stejné
síti použijte `npm run dev:network`. Stejná varianta pro kontrolu produkčního
buildu je `npm run preview:network`.

Produkční sestavení:

```bash
npm run build
```

Výstup vznikne ve složce `dist/` a používá relativní cesty vhodné pro GitHub Pages.

## Ovládání

- pohyb: `WASD` nebo šipky;
- akce: `E` nebo mezerník;
- pauza: `Esc` nebo `P`;
- mobil: směrová tlačítka a jedno tlačítko `AKCE`.

## Hlavní datový tok

```text
InputManager
  → PlayerControlSystem
  → MovementSystem
  → CollisionSystem
  → InteractionSystem
  → AnimationSystem
  → RenderSyncSystem
  → Three.js renderer

EventBus
  → HUD / cíle / kontextová interakce / AlertSystem
```

## Herní postup

```text
Briefing → povolení u NPC → hledání → kopání 3× do rytmu
        → případné zasypání díry → nalezení protivníka
        → akce v dosahu → certifikace sbírky → odchod / finále
```

Skóre a počet nálezů se zobrazují přímo v HUD. Nálezy se neukládají do
inventáře a hráč neřeší žádné předměty ani vybavení.

## Milestone 06

Milestone 06 doplňuje skutečný důsledek kritického poplachu a nahrazuje
generický farmer atlas u tří významných postav. Strážce je použit v Besednici,
rival v Besednici jako protivník a Franta ve finále u KD Slavia. Všechny tři
atlasy mají 4 × 4 směrovou mřížku, alfa průhlednost a archivní zdroj v `zdroje/`.

Při kritickém poplachu se v aktuální scéně uloží poslední bezpečné místo. Po
zahlédnutí je hráč vrácen na tuto pozici, rychlost se vynuluje a HUD zobrazí
konkrétní následek. Nejde o ukládání hry; checkpoint zaniká při změně levelu.

## Milestone 07

Milestone 07 přidává samostatný atlas `player-dig-atlas.png` se čtyřmi směry
a čtyřmi fázemi práce s rýčem. Během kopání se běžný atlas chůze dočasně
skryje, po dokončení se vrátí. Vykopaná díra už neukáže odměnu skokově: půda
se nejprve otevře, krátce se objeví prach a následně vltavín vystoupí z nálezu.
Časování této sekvence je oddělené od Three.js a ověřené unit testem.

## Milestone 08

Finální level používá samostatný 4 × 4 atlas expertky výstavy místo atlasu
hospodáře. Po prvním rozhovoru se zpřístupní Franta; po jeho zastavení se hráč
musí vrátit k expertce, která potvrdí lokality a vystaví certifikaci sbírky.
Teprve potom se aktivuje vstup na akci Na Zelené Vlně. Stav certifikace je
viditelný v horním HUD a je ověřený regresním testem.

## Milestone 09

Klíčové objekty už nejsou pouze procedurální geometrie. Chlum používá
`tractor-chlum.glb` jako pohyblivý hazard, Besednice `excavator-besednice.glb`
a finále `kd-slavia.glb`. Modely jsou načítané přes manifest a levelové bundly,
mají vlastní materiály a low-poly siluetu vhodnou pro mobilní WebGL. Příkaz
`npm run assets:models` jejich zdrojově řízenou podobu znovu vygeneruje.

Současně byla opravena obnova textu kontextové akce: při změně `digSite` na
`fillHole` se HUD aktualizuje i tehdy, když zůstává fokusovaná stejná entita.

## Milestone 10

Milestone 10 přidává `SoundManager` napojený na event bus. Krátké Web Audio
cue poskytují okamžitou zpětnou vazbu při akci, udělení povolení, zahájení
kopání, přesném zásahu, minutí, nálezu, certifikaci, kritickém poplachu,
dokončení levelu a závěru výpravy. Zvuk se inicializuje až po stisku tlačítka
pro zahájení průzkumu, takže respektuje autoplay omezení mobilních prohlížečů.
Nejsou potřeba další binární soubory ani změny v asset manifestu.

## Milestone 11

Milestone 11 uzavírá mobilní provozní vrstvu a release QA. Vstup se při
briefingu, pauze, změně levelu, ztrátě fokusu i návratu aplikace z pozadí
explicitně resetuje, takže se akce nemůže přenést do jiné herní fáze. Skrytí
karty automaticky pozastaví aktivní výpravu a po návratu vyžaduje vědomé
pokračování. Dotykové listenery se při zániku hry korektně odpojí.

Produkční metadata obsahují režim celé obrazovky pro mobilní prohlížeče,
safe-area layout, viditelné focus stavy a kompaktní rozložení pro šířky kolem
320 px. Test `FullLevelFlow` pokrývá průchod Chlumem a Besednicí vedle
stávajících testů Nesměně a finále. Příkaz `npm run release:verify` spouští
testy, čistý build a kontrolu všech zdrojových i produkčních assetů, validní
4 × 4 atlasové mřížky, PNG/GLB hlavičky a jediný aktuální JavaScript bundle.

## Milestone 12

Zvuková vrstva nyní kromě krátkých akcí obsahuje i velmi tichý ambientní podklad
pro Chlum, Nesměň, Besednici a KD Slavia. Profily používají odlišné základní
tóny a průběžně hrají pouze po odemknutí Web Audio uživatelským gestem. Při
přechodu mezi levely se podklad plynule nahradí novým profilem a při dokončení
výpravy se ztlumí, aby vyniklo finále. Nejsou potřeba žádné další audio soubory.

Produkční parametry a archivní grafické podklady jsou v
[`docs/GRAPHICS_PIPELINE.md`](docs/GRAPHICS_PIPELINE.md) a
[`zdroje/README.md`](zdroje/README.md). Ověřený build je připravený pro
GitHub Pages; externí publikování je samostatný distribuční krok mimo lokální
zdrojový projekt.

## Milestone 13

Při načítání se v briefingu zobrazuje průběh assetů a tlačítko pro zahájení je
do připravení scény deaktivované. `SceneManager` při chybě načítání uvolní
částečně vytvořenou scénu a ponechá předchozí scénu nedotčenou. Produkce má
installable PWA shell (`site.webmanifest`, SVG ikonu a versionovaný
`sw.js`), který po prvním načtení umožní návrat ke hře i bez připojení.

Release QA nově kontroluje také PWA soubory a archiv se automaticky pojmenovává
podle verze z `package.json`.

## Milestone 14

Release 0.14.0 uzavírá provozní okraje výpravy:

- při selhání načtení dalšího levelu se zobrazí jasná retry obrazovka a sbírka
  zůstává zachována;
- přechodový briefing blokuje vstup až do připravení nové scény a chrání hru
  před nechtěným odpausováním během načítání;
- první produkční načtení krátce počká na aktivaci service workeru, aby se
  offline cache naplnila v kontrolovaném lifecycle;
- stabilní `app.js`, `app.css` a `assets/manifest.json` jsou součástí
  precache app shellu, takže první návštěva má úplný offline základ;
- zápis síťových odpovědí do PWA cache je svázaný s `FetchEvent`, takže cache
  nezůstává nedokončená při ukončení workeru;
- reveal nálezu běží ve fixed update kroku a při pauze se neposouvá;
- release QA kontroluje verzi service workeru z jediného zdroje a testuje
  pořadí všech čtyř levelů.

Release poznámky jsou v
[`docs/RELEASE_NOTES_0.14.0.md`](docs/RELEASE_NOTES_0.14.0.md). Kompletní
reprodukovatelný archiv vytvoří příkaz `npm run release:archive`.

## Milestone 15

Release 0.15.0 dokončuje původní architektonické zadání také ve formě
samostatné specifikace. `docs/ARCHITECTURE.md` popisuje fyzický strom projektu,
odpovědnosti modulů, ECS a doménové datové struktury, všech 18 typovaných
eventů a implementovaný fixed-step update loop.

Kolizní vrstvy a masky už nejsou pouze deklarované v komponentě. Statické AABB
překážky mají vlastní `layer` a `mask` a `CollisionWorld` vyhodnocuje
oboustranný bitový filtr před narrow phase. Regresní testy ověřují přijetí i
odmítnutí kolizní dvojice. Konzistence povinných kapitol a katalogu eventů je
rovněž krytá automatickým testem dokumentace.

Release poznámky jsou v
[`docs/RELEASE_NOTES_0.15.0.md`](docs/RELEASE_NOTES_0.15.0.md).
Příkaz `npm run release:archive` vytváří úplný zdrojový release i samostatný
obsah složky `dist/` připravený k nahrání na GitHub Pages.
