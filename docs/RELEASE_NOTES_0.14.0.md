# Lovec vltavínů – release 0.14.0

## Dokončení provozní vrstvy

Release 0.14.0 uzavírá poslední známé okraje čtyřlevelové výpravy:

- načítání levelu má viditelný briefing a při chybě nabídne opakování;
- retry zachovává aktuální session a předchozí nálezy;
- briefing už nelze omylem odpausovat nebo obejít vstupem během přechodu;
- PWA boot čeká krátce na aktivní service worker a runtime cache používá
  `FetchEvent.waitUntil`;
- produkční JavaScript, CSS a assetový manifest mají stabilní názvy a jsou
  součástí precache app shellu;
- odhalení vltavínu je součástí fixed simulace, takže se zastaví spolu s hrou;
- datový regresní test potvrzuje pořadí Chlum → Nesměň → Besednice → Slavia.

## Ověření

```bash
npm install
npm run release:verify
npm run release:archive
```

Očekávaný checkpoint: `lovec-vltavinu-release-0.14.0.zip`.
