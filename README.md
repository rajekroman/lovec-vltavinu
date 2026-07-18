# Lovec vltavínů: Zelená vlna — Reborn Edition

Kompletně přepracovaná mobilní arkádová hra zasazená do stylizovaných jihočeských lokalit vltavínů.

## Nový herní princip

Každá lokalita trvá přibližně dvě až čtyři minuty. Hráč:

1. prozkoumává mapu,
2. jedním tlačítkem skenuje okolí,
3. vyhledává stopy a nálezové body,
4. kope pomocí krátké rytmické minihry,
5. vyhýbá se hlídkám, provozu a rivalům,
6. vytváří kombo rychlými správnými nálezy,
7. po lokalitě vybírá jednu trvalou výhodu,
8. ve finále sestaví vitrínu pro akci Na Zelené Vlně ve Slávii.

## Lokality

- **Chlum po bouřce** — rozorané pole, kaluže, souhlas majitele a pohybující se traktor.
- **Ločenice** — louka a erozní štěrková rýha s rychlým určováním vltavínů a skla.
- **Nesměň** — lesní cesta, mělké profily, zasypávání jam a lesní dohled.
- **Besednice** — noční borový les, staré jámy, hledání stop a honička o ježkovitý vltavín.
- **Malše a Slávie** — řeka, nábřeží, lávka, doprava, dokumentace a finální vstup do kulturního domu.

## Ovládání

### Mobil

- levý joystick: pohyb,
- vychýlení joysticku k okraji: automatický běh,
- pravé tlačítko: podle situace sken, kopání, sběr, rozhovor, chycení rivala nebo odchod.

### Klávesnice

- WASD nebo šipky: pohyb,
- mezerník: akce,
- Escape: pauza.

## Zvuk

Hudba je generována za běhu pomocí Web Audio API. Je záměrně tichá, řídká a adaptivní podle lokality. Neobsahuje agresivní krátkou WAV smyčku. Tlačítkem `♫` lze veškerý zvuk okamžitě vypnout.

## Technické vlastnosti

- čistý Canvas 2D bez WebGL a bez externích knihoven,
- okamžité spuštění na iPhonu a Androidu,
- portrét i režim naležato,
- offline režim po prvním načtení,
- ukládání rozehrané výpravy,
- místní rekordy,
- žádné externí síťové závislosti,
- automatické nasazení přes GitHub Pages workflow.

## Nasazení

Obsah ZIPu nahrajte přímo do kořene větve `main`. V GitHubu nastavte:

`Settings → Pages → Source → GitHub Actions`

Publikovaná adresa bude:

`https://rajekroman.github.io/lovec-vltavinu/`
