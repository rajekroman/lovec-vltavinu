# A3 asset audit — Besednice

Datum auditu: 23. 7. 2026

## Účel

Tento audit navazuje na issue #5 a produkční Besednice vertical slice sloučený v PR #55. Nemění gameplay, renderer, input ani UI. Vymezuje pouze zbývající grafický dluh v asset manifestu.

## Zjištěné provizorní záměny

| Asset ID | Aktuální soubor | Problém | Požadovaná náhrada |
|---|---|---|---|
| `npc-rival-karel` | `assets/sprites/npcs/farmer-vaclav.png` | Besednický rival používá totožný sprite jako chlumský zemědělec. | Unikátní transparentní sprite/sheet s odlišnou siluetou, oděvem a čitelným profilem na iPhonu. |
| `finding-vltavin-besednice-hedgehog` | `assets/sprites/findings/vltavin-rare.png` | Besednický ježek není samostatný vizuální typ. | Samostatný PNG asset s radiálními hroty a odlišitelnou siluetou při 64–128 px. |
| `terrain-besednice-quarry` | `assets/textures/terrain/nesmen-sand-profile.png` | Lom používá texturu Nesměně. | Samostatná opakovatelná textura šedohnědého lomového podloží. |
| `model-besednice-trace-marker` | `assets/models/nesmen/profile-marker.glb` | Stopa je pouze přejmenovaný model z jiného levelu. | Nízkopolygonální značka stopy se samostatným pivotem a bounds. |
| `model-besednice-hedgehog-marker` | `assets/models/chlum/field-marker.glb` | Marker nálezu je převzat z Chlumu. | Samostatný marker odpovídající ježkovitému vltavínu. |
| `model-besednice-rock` | `assets/models/nesmen/tree-stump.glb` | Kámen je ve skutečnosti pařez. | Samostatný instancovatelný low-poly lomový kámen. |

## Povinná metadata každé náhrady

- stabilní unikátní `id`;
- relativní URL začínající `./assets/`;
- `preload: level:besednice`;
- skutečné `metrics.bytes` a SHA-256;
- byte budget s rezervou nejvýše 25 %;
- u PNG přesné `dimensions`, průhlednost a `textureMax`;
- u GLB `scale`, `pivot`, `boundsMeters`, počet trojúhelníků a triangle budget;
- `disposeOwner: LevelScene:besednice`;
- žádné sdílení stejného souboru nebo SHA-256 s jiným levelovým assetem, pokud nejde o výslovně společný asset v preload skupině `common`.

## Vizuální akceptace

1. Rival Karel je rozpoznatelný od Václava pouze podle siluety i bez jmenovky.
2. Besednický ježek je rozeznatelný od standardního a vzácného Chlum nálezu při zobrazení 64 px.
3. Lomová textura nemá viditelné švy při opakování 4×4.
4. Kámen, stopa a marker ježka mají ground-center pivot a při instancování neplavou nad terénem.
5. Nové assety jsou čitelné v iPhone portrait i landscape a nepřekročí manifestové rozpočty.
6. `npm run validate`, `npm run validate:modules` a relevantní browser smoke test jsou zelené.

## Hranice změny

Tento pracovní balík nesmí měnit questové podmínky, session stav, kolize, vstup, HUD ani lifecycle rendereru. Případná změna pozic či měřítka entit musí být samostatně koordinována s Gameplay/data proudem.
