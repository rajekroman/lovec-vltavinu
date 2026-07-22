# Lovec vltavínů – release 0.13.0

## Milestone 13

Release hardening dokončuje instalační a chybové okraje hry:

- briefing zobrazí průběh načítání assetů a akci lze spustit až po připravení scény;
- při chybě načítání se částečně vytvořená scéna bezpečně uvolní a předchozí scéna zůstane aktivní;
- přidán installable PWA manifest, SVG ikona a versionovaný offline service worker;
- release QA ověřuje manifest, ikonu, worker, relativní cesty a aktuální JavaScript bundle;
- archiv se nyní jmenuje podle verze z `package.json`, takže při dalším milníku nevzniká zastaralý název.

## Ověření

```bash
npm install
npm run release:verify
npm run release:archive
```

Očekávaný checkpoint: `lovec-vltavinu-release-0.13.0.zip`.
