# Lovec vltavínů – release 0.12.0

## Stav

Produkční release candidate čtyřlevelové browser hry pro desktop i mobilní
prohlížeče. Hra je připravená k nahrání obsahu `dist/` na GitHub Pages.

## Ověřený rozsah

- Chlum, Nesměň, Besednice a KD Slavia;
- povolení, kopací minihra 3× do rytmu, nálezy A/B/C a globální sbírka;
- poplach, hazardy, bezpečný návrat, rival a Franta;
- certifikace sbírky a finále na akci Na Zelené Vlně;
- desktopové klávesy, dotykový D-pad a jedno kontextové tlačítko;
- responsive HUD, safe-area layout, briefing každého levelu a pauza;
- krátké zvukové cue a tichý ambientní profil každé lokality;
- 2D sprite atlasy, low-poly GLB modely a fallback procedurální geometrie.

## Kontrola release

```bash
npm install
npm run release:verify
npm run release:archive
```

`release:verify` ověřuje 16 testovacích souborů, produkční build, 23 assetů,
5 bundlů, 4 × 4 atlasové mřížky, PNG/GLB hlavičky, relativní cesty a jediný
aktuální JavaScript bundle.

Save systém ani inventář nejsou součástí záměrně zúženého MVP. Výprava se
restartuje tlačítkem „Nová výprava“ a mezi levely se přenáší pouze aktuální
stav sbírky v paměti.
