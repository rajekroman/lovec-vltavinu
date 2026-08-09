# Zelená vlna — implementovaný level layout

Tento dokument popisuje skutečný layout větve `agent/production-level-redesign` pro issue #205. Je to handoff k produkční implementaci, nikoli alternativní design nebo paralelní runtime.

## Společné invarianty

- kanonický tok: Chlum → Nesměň → Besednice → KD Slavia;
- jeden existující Three.js renderer, ortografická kamera, fixed-step loop a `GameSession`;
- pohyb + jediná kontextová AKCE;
- objective/event/session pravidla se nemění;
- footprinty pevných překážek jsou serializovaná AABB data v `src/data/levelLayout.js`;
- každý footprint má odpovídající viditelný prop přes `obstacleId`;
- pohyb hráče používá radius 28 a resolver s klouzáním po osách, aby se hráč nezachytával o rohy;
- povinné targety jsou kontrolovány grid reachability testem.

## Chlum — pole po dešti

```text
sever
┌──────────────────────────────────────────────────────┐
│ remízek         otevřené pole          remízek/strom │
│                                                      │
│   plot ─ plot       VÁCLAV                           │
│                                                      │
│       ===== předvídatelná trasa traktoru =====       │
│                     kaluže                           │
│                              SEARCH / nález          │
│                                          seno        │
│ SPAWN / tráva                         seno     strom  │
└──────────────────────────────────────────────────────┘
jih
```

Flow: bezpečný spawn → Václav → otevřené pole → čitelná trasa traktoru → krátký průzkum přes mokré brázdy → radarový surface search → nález. Hlavní landmarky jsou Václav, pohyblivý traktor, remízky, seno a kopcovitější travnatý okraj. Pevné collidery: 8 + samostatný hazard collider traktoru.

Mobil: Václav a search zůstávají v širokých otevřených plochách; žádný collider neleží v interaction radiusu. Traktor přejíždí napříč širokou zónou a lze jej vidět i obejít bez úzkého koridoru.

## Nesměň — les a staré profily

```text
sever
┌──────────────────────────────────────────────────────┐
│ JAN / mýtina   stromy                 stromy PROFIL3 │
│                velký strom                            │
│            PROFIL1        otevřená lesní cesta       │
│ stromy            kořen        PROFIL2        pařez  │
│                                                      │
│            vedlejší smyčka                           │
│ SPAWN                 stromy              stromy     │
└──────────────────────────────────────────────────────┘
jih
```

Flow: spawn → lesní cesta → Jan → tři odlišitelné profile clearings → vždy přesně tři úspěšné zásahy → zahrabání → další profil. Skupiny stromů tvoří okraje a krátké smyčky, nikoliv bludiště. Landmarky: Janova mýtina, velký listnatý strom, tři světlé profily, kořen a pařezy. Pevné collidery: 9.

Mobil: hlavní cesta zůstává souvislá a širší než dvě šířky hráče. Stromové koruny jsou vizuálně vysoké, ale collider odpovídá pouze půdorysu skupiny/kmene. Všechny tři dig zóny mají volný přístup z více směrů.

## Besednice — překopaná jílová lokalita

```text
sever
┌──────────────────────────────────────────────────────┐
│ val        val                    PROFIL / JEŽEK ███ │
│                                  STOPA3              │
│ kameny             STOPA2   kameny                  │
│                                                      │
│ kameny      jáma                 val / velký kámen   │
│         STOPA1                          KARL / aréna  │
│ SPAWN           hlubší jižní jáma                    │
└──────────────────────────────────────────────────────┘
jih
```

Flow: vstupní bezpečná police → stopa 1 → stopa 2 → stopa 3 → odemčený ježkový profil → přesně tři dig zásahy → nález → široká Karel arena → recovery → exit. Profily používají vrstvenou hlínu/písek, jámy mají tmavé dno a kamenitý okraj, valy jsou fyzicky neprůchozí. Pevné collidery: 9.

Mobil: stopy jsou v odlišných otevřených plochách a cesta mezi nimi není sevřena dekoracemi. Karelův prostor je záměrně bez hustých props, aby hráč i rival zůstali čitelní v portraitu.

## KD Slavia — finále Na Zelené Vlně

```text
sever
┌──────────────────────────────────────────────────────┐
│ strom  stan      lavička    FRANTA      severní křídlo│
│          dokument2       vitríny  POROTA/EVA          │
│ dokument1      stoly                  VSTUP / canopy  │
│                    dokument3           jižní křídlo   │
│ SPAWN      výstavní cesta     stan / výstava          │
└──────────────────────────────────────────────────────┘
jih
```

Flow: příchod → tři dokumenty → Eva/registrace → Franta recovery → návrat k Evě/certifikát → jasně osvětlený vstup KD → session evaluation → finální výsledek. Plaza má budovu, stany, stoly, vitrínu, lampy, lavičku a porotní dais. Pevné collidery: 11; vstupní canopy je průchozí, protože je nad hlavou a slouží jako vizuální navigace.

Mobil: props jsou rozmístěné po stranách hlavní trasy, nikoli v jednolité řadě. Dokumenty, Eva, Franta i vstup mají samostatné volné plochy. Budova je dominantní, ale nevytváří skrytou interaction zónu.

## Výkon a assety

Redesign používá deterministické low-poly primitivy v existujícím Three.js rendereru a čtyři lehké terrain plates registrované v manifestu. Geometrie se vytváří pouze při `enter()` aktivního levelu a uvolňuje přes existující `renderer.disposeObject()` při `exit()`/restartu. Neexistuje druhý canvas, renderer, kamera, loop, input manager, inventář ani persistence gameplay stavu.

## QA kontrakt

Povinný gate pro tuto větev:

- `npm run validate`;
- `npm run validate:modules`;
- `npm run test:unit`;
- renderer ownership test;
- Playwright desktop 1280×720;
- Playwright iPhone portrait 390×844;
- Playwright iPhone landscape 844×390;
- canonical full-flow a clean restart;
- screenshot evidence všech čtyř levelů.
