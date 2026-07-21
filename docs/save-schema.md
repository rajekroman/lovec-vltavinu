# Save schema a kompatibilita

## Aktivní produkční klíč

```text
lovecVltavinuRebornSaveV5_1
```

Stabilizační vydání 5.2 nemění datový formát rozehrané výpravy. Verze veřejného runtime, offline cache a save schématu jsou oddělené pojmy.

- **runtime version:** implementace a release hry;
- **cache version:** identifikátor service worker cache;
- **save schema version:** struktura serializovaného herního stavu.

## Normalizovaný stav

```js
{
  version: "5.1.0",
  schemaVersion: "5.1",
  runtimeVersion: "6.0.0",
  levelIndex: 0,
  score: 0,
  stones: [],
  heat: 0,
  combo: 1,
  comboTimer: 0,
  caught: 0,
  perks: { boots: 0, scanner: 0, shovel: 0, quiet: 0, case: 0, eye: 0 },
  stats: { digs: 0, correct: 0, misses: 0, rare: 0 },
  sound: true
}
```

Pole `version: "5.1.0"` zůstává zachováno kvůli kompatibilitě se stávajícím monolitem. `runtimeVersion` označuje modulární kód, který stav normalizoval; není rozhodujícím údajem pro načtení save.

## Podporované starší klíče

Adaptér prohledává v pořadí:

1. `lovecVltavinuRebornSaveV5_1`
2. `lovecVltavinuRebornSaveV5_0`
3. `lovecVltavinuRebornSaveV4_9`
4. `lovecVltavinuRebornSaveV4_8`
5. `lovecVltavinuRebornSaveV4_7`
6. `lovecVltavinuRebornSaveV4_6`
7. `lovecVltavinuRebornSaveV4_5`

Aktuální klíč má vždy přednost. Neplatný JSON nebo záznam bez pole `stones` je přeskočen a lze jej zaznamenat přes callback `onInvalid`.

## Normalizační pravidla

- `levelIndex` se omezí na existující levely;
- záporné skóre, statistiky a počet dopadení se nastaví na nulu;
- `heat` se omezí na `0–100`;
- `combo` se omezí na `1–6`;
- úrovně perků se omezí podle maxima z `PERK_DEFINITIONS`;
- neplatné kameny se odstraní;
- číselné vlastnosti kamenů se převedou na bezpečné nezáporné hodnoty;
- chybějící `perks` a `stats` se doplní;
- zvuk je zapnutý, pokud není výslovně `false`.

## Bezpečnost migrace

Výchozí migrace:

1. přečte první platný záznam;
2. normalizuje jej;
3. zapíše jej pod aktuální klíč;
4. ponechá původní starší klíč jako nouzovou zálohu.

Zdrojový klíč se odstraní pouze při explicitním `removeSource: true` a až po úspěšném zápisu cílového záznamu.

## Budoucí změny schématu

Při nekompatibilní změně musí vzniknout nový identifikátor schématu, nový cílový storage klíč, explicitní transformace ze všech podporovaných formátů a unit test každé migrační cesty. Pouhé navýšení verze vydání není důvodem ke smazání rozehrané výpravy.
