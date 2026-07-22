# Lovec vltavínů 0.15.0

Datum: 22. července 2026

## Výsledek

Release 0.15.0 uzavírá původní zadání technické architektury. Implementovaná
hra a její dokumentace nyní používají stejný, testovaný kontrakt.

## Změny

- Přidán `docs/ARCHITECTURE.md` jako autoritativní architektonická specifikace.
- Doplněn úplný strom složek a odpovědnosti aplikačních, engine, ECS, gameplay
  a UI modulů.
- Popsány datové struktury entit, komponent, levelů, atlasů, asset manifestu,
  session a vltavínů.
- Zkatalogizováno všech 18 typovaných eventů včetně producentů, payloadů a
  konzumentů.
- Zdokumentován fixed-step loop 60 Hz, pořadí systémů, event flush a
  interpolovaný render.
- `StaticCollider` nyní nese `layer` a `mask`.
- `CollisionWorld` vyhodnocuje oboustrannou podmínku vrstev a masek před
  fyzickým řešením circle/AABB.
- Všechny produkční překážky jsou explicitně zařazené na vrstvu `WORLD` nebo
  `NPC`.
- Přidány pozitivní i negativní regresní testy kolizních filtrů.
- Přidán test, který hlídá povinné kapitoly dokumentu a katalog všech eventů.
- Release pipeline vytváří zdrojový ZIP i samostatný webový ZIP s obsahem
  `dist/` pro přímé nasazení na GitHub Pages.

## Architektonické hranice

- Save systém zůstává záměrně mimo rozsah; `SessionState` je pouze paměťový.
- Fyzická narrow phase MVP řeší pohyb kruhu proti statickým AABB.
- Pohyblivé hazardy a interakce používají záměrnou proximity/trigger logiku.
- Dokument popisuje rozšiřovací bod pro budoucí dynamické circle/circle kolize,
  aniž by takovou nevyužitou složitost přidával do současného gameplaye.

## Ověření

Pro release je vyžadováno:

```bash
npm run release:verify
```

Tento příkaz spouští Vitest, striktní TypeScript kontrolu, produkční Vite build
a kontrolu manifestu, všech assetů, PWA shellu a distribučních cest.
