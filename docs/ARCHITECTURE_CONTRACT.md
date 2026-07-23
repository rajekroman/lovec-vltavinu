# ARCHITECTURE_CONTRACT.md — závazný technický kontrakt

Verze: **2.1 · 23. 7. 2026**

## Produkční runtime

Projekt používá jediný modulární Three.js runtime:

- vstup `src/bootstrap.js`;
- jeden `WebGLRenderer`;
- jedna ortografická kamera;
- jeden fixed-step loop;
- jeden `SceneManager`;
- jeden `AssetLoader`;
- jeden `InputManager`;
- jedna session-only `GameSession`.

Žádná scéna ani feature nesmí vytvořit druhý renderer, kameru, loop, loader, eventový katalog nebo session.

## Produktový tok

Kanonické levely jsou přesně:

```text
chlum → nesmen → besednice → slavia
```

Level se spouští pouze produkčním přechodem. Debug URL, přímá manipulace transformace nebo ruční zápis objective stavu nejsou platný herní průchod.

## Gameplay kontrakty

- Směrový vstup a jedno kontextové tlačítko `AKCE`.
- Kopání vyžaduje literal tři úspěšné zásahy.
- Nález má stabilní `findingId`, zapíše se do session právě jednou a zvýší score.
- Objective komponenty jsou serializovatelná data bez DOM nebo Three objektů.
- `level:complete` nese minimálně `{ levelId, nextLevelId, score }`.
- Restart po finálním výsledku vytváří čistou session.

## Persistence

Gameplay stav je pouze v paměti aktuální session. Zakázáno:

- nový save systém;
- localStorage gameplay stav;
- continue;
- import/export sbírky;
- migrace save;
- inventářová obrazovka nebo správa předmětů.

Service worker smí uchovávat pouze distribuční cache.

## Asset kontrakt

- Assety se načítají výhradně přes manifest a `level.assetGroups`.
- Skupiny levelů používají formát `level:<id>`.
- Každý asset má stabilní ID, typ, relativní URL, preload skupinu, rozpočet, SHA-256 a dispose vlastníka.
- 2D postavy a efekty jsou transparentní PNG nebo spritesheet.
- 3D rekvizity jsou optimalizované low-poly GLB.
- GLB používá lokální standardní Three.js `GLTFLoader` revision 185.
- Runtime nesmí přepisovat původní `entry.type` ani používat ruční seznam asset ID ve scéně.

## Mobilní a lifecycle kontrakt

- HUD je HTML/CSS overlay nad canvasem.
- Safe-area funguje v portrait i landscape.
- Pointer/touch ownership se po overlay, dialogu, pause, změně orientace, background/foreground a změně scény vždy uvolní.
- iOS audio se odemyká pouze uživatelským gestem.
- Pause/resume nesmí vytvořit duplicitní hudební stopu.

## Výkon

- Adaptivní DPR nejvýše 2.
- Asset a scéna respektují byte, texture a triangle budget.
- Statické opakované rekvizity používají instancing, pokud je to účelné.
- Dispose vlastnictví zdrojů a instancí je oddělené.
- Finální hardening měří FPS, frame time, load time a paměť.

## Role A1

A1 je po merge governance PR #57 v rezervě. Smí být aktivován pouze samostatným issue pro:

- konkrétní architektonický hardening; nebo
- odstranění legacy Canvas runtime a save kódu.

Takový issue musí mít přesný base SHA, větev, povolené cesty, acceptance criteria a QA bránu.

## Legacy cleanup

Po dokončení čtyřlevelového toku se odstraní nebo definitivně odpojí:

- `game.js`;
- `runtime-stability.js`;
- Canvas monolit a opravné vrstvy;
- legacy save/import/export kód;
- zastaralé testy a dokumentace starého runtime.

Produkční HTML po cleanup importuje pouze kanonický bootstrap.

## Testovací brány

Každý feature PR podle rozsahu prokazuje:

- syntax a statický validátor;
- unit testy;
- desktop browser smoke;
- iPhone portrait a landscape;
- pause/resume, background/foreground, otočení a uvolněný input;
- žádné HTTP chyby nebo page errors;
- žádný gameplay stav v localStorage.

Finální QA vyžaduje dvě po sobě jdoucí zelená spuštění stejného commit SHA.
