# Grafický výrobní plán

## Vizuální směr

Hra používá seriózní 2.5D styl inspirovaný skutečnou jihočeskou krajinou.
Postavy jsou ručně malované, polorealistické a dobře čitelné v malé velikosti.
Prostředí tvoří úsporné low-poly GLB modely v tlumených odstínech hlíny, mechu,
trávy, dřeva a kamene. Výsledkem nemá být dětská karikatura ani generická sada
barevných krychlí.

Procedurální kulisy používají fasetované nebo chamfered profily vytvořené přes
`ExtrudeGeometry`; ostré `BoxGeometry` primitivum se v herním prostředí
nepoužívá. Tvar tak zůstává čitelný na mobilu, ale nepůsobí jako sada čistých
krychlí.

## Technická specifikace sprite atlasů

- formát: PNG RGBA;
- atlas: 4 × 4 buňky;
- produkční rozměr: 1256 × 1256 px;
- jedna buňka: 314 × 314 px;
- směr řádků: jih, západ, východ, sever;
- čtyři sloupce: fáze jednoho cyklu chůze;
- pivot: u chodidel;
- bez vrženého stínu – stín vytváří Three.js samostatně;
- pozadí musí být skutečně transparentní;
- po generování je povinná kontrola konzistence obličeje, oděvu, měřítka a nohou.

Statické NPC používají stejnou mřížku 4 × 4, ale atlas má klip `idle: [0]`
a `walk: [0]`. Směrové řádky tak zůstávají kompatibilní s `SpriteAnimator` a
nepřidávají zbytečný runtime pohyb.

Aktivní produkční atlas:

```text
public/assets/sprites/player-walk-atlas.png
```

Produkční atlas majitele pole:

```text
public/assets/sprites/farmer-walk-atlas.png
```

Produkční atlas statického lesníka:

```text
public/assets/sprites/forester-static-atlas.png
```

Produkční atlas hrdiny pro kopání:

```text
public/assets/sprites/player-dig-atlas.png
```

Archivní sprite fallback pohyblivého traktoru v Chlumu:

```text
public/assets/sprites/tractor-chlum.png
```

Produkční low-poly GLB modely Milestone 09:

```text
public/assets/models/tractor-chlum.glb
public/assets/models/excavator-besednice.glb
public/assets/models/kd-slavia.glb
```

Modely jsou generované reprodukovatelným skriptem
`scripts/generate-glb-assets.mjs`, načítané přes `AssetManager` a zapojené do
levelových bundlů. Sprite traktoru zůstává jako bezpečný fallback pro případ,
že model není dostupný.

Produkční sprite varianty vltavínu podle kvality nálezu:

```text
public/assets/sprites/moldavite-quality-a.png
public/assets/sprites/moldavite-quality-b.png
public/assets/sprites/moldavite-quality-c.png
```

Produkční atlasy významných postav Milestone 06–08:

```text
public/assets/sprites/guard-quarry-atlas.png
public/assets/sprites/rival-walk-atlas.png
public/assets/sprites/thief-walk-atlas.png
public/assets/sprites/expert-walk-atlas.png
```

Archivní zdroje generování a post-processingu:

```text
zdroje/grafika/sprity/postavy/hrdina-chuze-zdroj.png
zdroje/grafika/sprity/postavy/hrdina-kopani-zdroj.png
zdroje/grafika/sprity/postavy/karel-chuze-zdroj.png
zdroje/grafika/sprity/postavy/lesnik-staticky-zdroj.png
zdroje/grafika/sprity/postavy/strazce-naleziste-zdroj.png
zdroje/grafika/sprity/postavy/rival-karel-zdroj.png
zdroje/grafika/sprity/postavy/franta-zdroj.png
zdroje/grafika/sprity/postavy/expertka-vystavy-zdroj.png
zdroje/grafika/vozidla/traktor-chlum-zdroj.png
zdroje/grafika/predmety/vltaviny/vltavin-a-zdroj.png
zdroje/grafika/predmety/vltaviny/vltavin-b-zdroj.png
zdroje/grafika/predmety/vltaviny/vltavin-c-zdroj.png
```

## Specifikace 3D modelů

- výstupní formát: binární `.glb`;
- měřítko: 1 Three.js jednotka = 1 metr;
- osa Y směřuje vzhůru;
- pivot objektu na styčné ploše se zemí;
- samostatné materiály pouze tam, kde jsou vizuálně nutné;
- preferovat jednu atlasovou texturu na skupinu rekvizit;
- stromy a kameny připravit pro `InstancedMesh`;
- statické objekty nepoužívat jako přesnou kolizní geometrii;
- LOD0 pro blízký záběr, jednoduchý LOD1 pro mobilní zařízení;
- žádné neviditelné plochy uvnitř modelů.

## Schvalovací proces každého AI assetu

1. Vygenerovat zdroj podle jednotného promptu a referenčního listu.
2. Ověřit siluetu, proporce, perspektivu a konzistenci.
3. Odstranit pozadí a zkontrolovat okrajové pixely.
4. Zarovnat výstup na přesnou mřížku nebo pivot.
5. Optimalizovat rozměr a kompresi bez viditelné degradace.
6. Přidat asset do `manifest.json` pod stabilním ID.
7. Ověřit jej v běžící scéně na desktopu i mobilním poměru stran.
8. Teprve poté označit asset jako produkční.

## Fronta generování

| Priorita | Asset | Forma | Stav |
|---|---|---|---|
| P0 | Hlavní hrdina – chůze 4 směry | PNG atlas | Hotovo, zapojeno |
| P1 | Hrdina – kopání | PNG atlas | Hotovo, zapojeno |
| P1 | Majitel pole / hospodář | PNG atlas | Hotovo, zapojeno |
| P1 | Lesník Milan – statický NPC | PNG atlas | Hotovo, zapojeno |
| P1 | Traktor Chlum – pohyblivý hazard | PNG billboard | Hotovo, zapojeno |
| P1 | Průzkumná díra a fáze odkrytí | Three.js reveal timeline | Hotovo, zapojeno |
| P1 | Vltavíny – runtime kvality A/B/C | transparentní PNG | Hotovo, zapojeno |
| P1 | Strážce naleziště – Besednice | PNG atlas | Hotovo, zapojeno |
| P1 | Rival – protivník Besednice | PNG atlas | Hotovo, zapojeno |
| P1 | Zloděj Franta – boss Slavia | PNG atlas | Hotovo, zapojeno |
| P1 | Expertka výstavy – finále Slavia | PNG atlas | Hotovo, zapojeno |
| P1 | Traktor Chlum – low-poly 3D varianta | GLB | Hotovo, zapojeno |
| P1 | Bagr Besednice | GLB | Hotovo, zapojeno |
| P1 | Kulturní dům Slavia | GLB | Hotovo, zapojeno |
| P2 | Vegetační sada Chlum | GLB sada | Čeká na modelovací brief |

## Výrobní prompt pro další postavu

```text
Use case: stylized-concept
Asset type: production source sprite atlas for a Three.js 2.5D browser game
Primary request: Create a clean and consistent 4 by 4 sprite sheet of one
character. Exactly sixteen isolated full-body poses of the same character,
aligned to a uniform invisible grid with equal cell size and foot baseline.
Rows: south, west, east, north. Columns: four walk-cycle phases.
Style: serious semi-realistic hand-painted game sprite, restrained
low-poly-inspired forms, readable at small size, not cute, not chibi.
Lighting: neutral overcast daylight, no cast shadow.
Backdrop: perfectly flat solid chroma-key color, no texture or gradient.
Avoid: text, labels, cell borders, scenery, ground, weapons, duplicated limbs,
cropping, inconsistent clothing or camera angle.
```

Každá konkrétní postava k tomuto základu doplní přesný věk, oblečení, povolání,
barevnou paletu, charakteristickou siluetu a předměty, které smí nebo nesmí držet.
