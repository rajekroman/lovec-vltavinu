# Lovec vltavínů — vývojový roadmap 6.0

## Produktový cíl

Mobilní browser hra propagující akci **Na Zelené Vlně** v KD Slávie. Hráč projde jihočeské vltavínové lokality, respektuje pravidla jednotlivých míst, získává kvalitní a doložené nálezy a ve finále sestaví výstavní kolekci.

## Výchozí stav

Veřejný build 5.1 je čistá 2D Canvas aplikace. Obsahuje pět lokalit, HTML/CSS HUD, dotykový joystick, jedno akční tlačítko, minihru kopání, určování vzorků, hlídky, bossy, hudbu, lokální pokračování a finální hodnocení.

Současné technické riziko je vysoké: rendering, audio, data, vstupy, UI a gameplay jsou soustředěny převážně v jednom souboru `game.js`. Cílová architektura projektu je hybridní Three.js aplikace s 2D sprity a low-poly 3D objekty.

## Zásady řízení

1. Hratelný build nesmí být nahrazen neověřeným kompletním přepisem.
2. Každá změna probíhá v samostatné větvi a pull requestu.
3. Blokující mobilní chyby mají přednost před novým obsahem.
4. Každý pull request musí projít automatickou validací.
5. Vizuální assety musí mít jasný výkonový rozpočet a technickou specifikaci.
6. Release je dokončen až po testu veřejné GitHub Pages verze na cílovém iPhonu.

## Etapa 0 — ochrana buildu

- GitHub Actions validace;
- kontrola syntaxe JavaScriptu;
- kontrola DOM ID;
- kontrola manifestu, cache a assetů;
- kontrola verzí;
- vývojový a release checklist.

Výstup: každá další změna má automatickou regresní bránu.

## Etapa 1 — stabilita mobilního runtime

- sjednotit pointer, touch a click události;
- vytvořit centrální správu herních režimů a overlayů;
- nulovat vstup při pauze, dialogu, minihře a změně orientace;
- přidat diagnostický režim s viditelným výpisem chyb;
- opravit návrat z pozadí a obnovení audia;
- provést smoke test všech přechodů.

Výstup: ovladatelná a dokončitelná verze 5.2.

## Etapa 2 — oddělení systémů

Navržená struktura:

```text
src/
  app/
    GameApp.js
    GameState.js
    GameLoop.js
  core/
    EventBus.js
    SceneManager.js
    AssetLoader.js
  input/
    InputManager.js
    TouchControls.js
    KeyboardControls.js
  gameplay/
    InteractionSystem.js
    CollisionSystem.js
    DangerSystem.js
    DigSystem.js
    BossSystem.js
    ProgressionSystem.js
  rendering/
    Renderer2DAdapter.js
    ThreeRenderer.js
    CameraController.js
    AnimationSystem.js
  ui/
    HudController.js
    ScreenController.js
  audio/
    AudioEngine.js
  data/
    levels.js
    items.js
    perks.js
```

Nejprve se oddělí data a vstup. Rendering bude migrován až poté.

## Etapa 3 — hybridní Three.js renderer

- ortografická kamera;
- 2D postavy jako transparentní sprity nebo sprite sheets;
- low-poly GLB objekty pro stroje, stromy, lávku a KD Slávii;
- světla a stíny pouze tam, kde mají jasný vizuální přínos;
- HTML/CSS HUD zůstává nad canvasem;
- kolize a gameplay zůstávají nezávislé na renderingu.

Výstup: jeden plně převedený referenční level, následně migrace ostatních lokalit.

## Etapa 4 — obsah a art pass

- Chlum: pole, traktor, zemědělec a brázdy;
- Ločenice: písčitá hrana, sklo versus vltavín;
- Nesměň: lesní profily a povinnost zahrabání;
- Besednice: těžební prostor, ježek a Krystalový Karel;
- Malše / Slávie: nábřeží, dokumentace, finální certifikace a výstava;
- každý NPC má vlastní siluetu, oděv a funkci;
- bossové jsou čitelní bez spoléhání pouze na textové jméno.

## Etapa 5 — výkon, audio a polish

- adaptivní DPR;
- omezení částic a animací podle výkonu;
- komprimované audio formáty s bezpečným fallbackem;
- jasně odlišná hudební nálada lokalit;
- safe-area, portrait a landscape layout;
- přístupnost ovládacích prvků a snížené animace.

## Etapa 6 — release

Release kandidát musí splnit:

- automatická validace je zelená;
- všech pět levelů lze dokončit v jednom průchodu;
- nový start i pokračování fungují;
- žádný overlay nezablokuje ovládání;
- hra funguje po návratu z pozadí;
- offline cache se aktualizuje na novou verzi;
- veřejná GitHub Pages verze je otestována na cílovém iPhonu;
- changelog a číslo verze odpovídají skutečnému buildu.

## Aktivní GitHub issues

- #1 Stabilita mobilního ovládání a stavových přechodů
- #2 Automatická validace buildu
- #3 Modulární hybridní architektura Three.js
- #4 Gameplay všech lokalit
- #5 Vizuální styl a assety
- #6 Audio a mobilní výkon
- #7 QA a release
- #8 Hlavní vývojový plán
