# Lovec vltavínů — cílová architektura

## Stav migrace

Veřejná verze 5.2 zůstává dočasně postavená na původním `game.js` a 2D Canvas renderingu. Nové moduly v `src/` jsou testované jádro pro postupnou migraci. Dokud nebude převeden celý jeden level, nesmí nová architektura nahradit veřejný build jednorázově.

## Modulární jádro

### `src/core/EventBus.js`
Synchronní doménové eventy mezi systémy. Posluchače lze rušit funkcí nebo přes `AbortSignal`.

### `src/core/GameLoop.js`
Deterministická fixed-step simulace. Výchozí krok je 1/60 s, delta time je omezený a přebytečný čas se zahazuje, aby návrat z pozadí nezpůsobil lavinu update kroků.

Pořadí systémů:
1. aktivní scéna,
2. animace,
3. kolize,
4. uzavření vstupního frame.

Rendering běží jednou za obrazový frame s interpolační hodnotou `alpha`.

### `src/core/SceneManager.js`
Registrace a asynchronní přechody scén. Neúspěšný vstup do nové scény provede cleanup a rollback do předchozí scény.

### `src/core/InputManager.js`
Jednotný stav klávesnice, pointeru a virtuálních akcí. Rozlišuje `down`, `pressed` a `released` a poskytuje centrální reset pro overlaye, ztrátu fokusu a změnu scény.

### `src/core/AssetLoader.js`
Cache a deduplikace souběžných požadavků. Loader není svázán s konkrétní knihovnou; PNG, audio a GLB dostanou vlastní registrované adaptéry.

### `src/core/GameApp.js`
Composition root. Vytváří event bus, ECS world, vstupy, assety, scény, animace, kolize a loop. Renderer je injektovaný, aby bylo možné testovat jádro bez WebGL.

## Herní data a ECS

### `src/ecs/World.js`
Lehký ECS world s číselnými entity ID a mapami komponent. Základní komponenty:

- `transform`: `{ x, y, z, rotation, scale }`
- `velocity`: `{ x, y }`
- `collider`: circle nebo AABB
- `animation`: stav sprite animace
- `renderable`: odkaz na Three.js objekt nebo sprite
- `interaction`: typ akce a dosah
- `dangerSource`: dohled, hluk nebo pohybující se hrozba
- `objective`: vazba na stav úkolu

## Systémy

### `src/systems/AnimationSystem.js`
Časování sprite frames nezávislé na FPS. Podporuje loop, pause, restart a dokončení jednorázové animace.

### `src/systems/CollisionSystem.js`
Broad-phase uniform grid a circle/AABB narrow phase. Vysílá `collision:enter`, `collision:stay` a `collision:exit`.

## Rendering

### `src/render/HybridRenderer.js`
Three.js ortografický renderer se čtyřmi vrstvami:

1. `ground` — terén a velké 3D plochy,
2. `props` — stromy, traktor, lampy a KD Slávie,
3. `actors` — 2D PNG sprity hráče, NPC a bossů,
4. `effects` — částice, zvýraznění a krátké efekty.

Renderer přijímá Three.js namespace injekcí. Three.js nebude načítán z CDN; release build musí používat verzovaný lokální modul.

## Eventy mezi moduly

- `app:boot:start`, `app:boot:complete`, `app:dispose`
- `loop:start`, `loop:stop`, `loop:drop`
- `scene:transition:start`, `scene:transition:complete`, `scene:transition:error`
- `input:change`, `input:reset`
- `asset:load:start`, `asset:load:complete`, `asset:load:error`
- `entity:create`, `entity:destroy`
- `component:add`, `component:remove`
- `animation:frame`, `animation:loop`, `animation:complete`
- `collision:enter`, `collision:stay`, `collision:exit`

Gameplay eventy budou přidávány jako doménové názvy, například `permit:granted`, `dig:complete`, `hole:filled`, `stone:identified`, `danger:detected` a `level:complete`.

## Migrační pořadí

1. Oddělit definice levelů a objective data z `game.js`.
2. Připojit nový `InputManager` ke stávajícímu canvas buildu.
3. Převést Chlum na samostatnou scénu při zachování současného vizuálu.
4. Zavést lokální Three.js a `HybridRenderer` pouze pro Chlum.
5. Převést hráče a NPC na PNG sprite sheets.
6. Převést velké objekty na low-poly GLB.
7. Po dokončení Chlumu migrovat ostatní lokality postupně.
8. Původní `game.js` odstranit až po dokončení celé hry a průchodu release QA.

## Výkonové limity pro mobilní build

- DPR maximálně 2; adaptivně 1–1,5 při nízkém FPS.
- Jeden atlas postav na level, nikoli samostatná textura pro každý frame.
- Low-poly objekt zpravidla do 5 000 trojúhelníků; dominantní KD Slávie může mít vyšší rozpočet.
- Textury běžně 512 px, dominantní stavby nejvýše 1 024 px.
- Bez dynamických stínů v MVP; používat baked nebo jednoduché blob shadows.
- Aktivní částice a světla musí mít pevné horní limity.
