# Changelog

## 7.3.0 — Polished animations, mobile stability, and full PWA

Stabilní release s vylepšenými animacemi hráče a NPC, robust mobilní stabilitou, offline hratelností a přístupností. Všechny 301 unit testy procházejí, smoke testy pokrývají desktop a mobile platformy.

Tato iterace V7 doplňuje animované postavy, přidává sekundární UI obrazovky pro příběh a deník, zpřístupňuje hru pro screen readery a nabízí offline hratelnost přes Progressive Web App.

### Vylepšenosť animací (Issue #305)
- Hráčský chod bez klouzání ve všech čtyřech směrech
- Walk cadence: 8 FPS @ 220 px/s, stride cycle 110px < 135px limit
- Plynulé přechody idle↔walk bez resetů fáze kroku
- NPC lifecycle: pause/resume bez opětovného spuštění, dialogue koordinace centrálně přes GameApp
- 301 unit testů pokrývají motion coherence, direction preservation, scene transitions
- Zbývá: Manual device visual testing (iPhone portrait/landscape, Android)

### Animované postavy (Issue #286 / PR #285)
- Pět postav s animovanými sety (Václav, Jan, Eva, Karel, František)
- Každá postava má 5 stavů: nečinnost, dialog, tři emociální/akční stavy
- Synchronizace s herními událostmi (přiblížení hráče, ústupy, gestikulace)
- Manifest preload strategie pro optimální načítání

### Sekundární UI obrazovky (Issue #272 / PR #283)
- **Deník** — přehled pokroku skrze čtyři kanonické lokality
- **Nastavení** — hlasitost, barvoslepost (5 variant), vysoký kontrast, velký text
- **Příběh** — narrativní kontext a průvodce pro každou lokalitu
- **Pauza** — obnovení, deník, nastavení nebo návrat do titulku

### Přístupnost (Issue #273)
- 47 ARIA atributů na všech dialog obrazovkách
- Keyboard navigation: Tab (navigace), Enter (aktivace), Escape (zavření)
- Automatické zaměření na první aktivní prvek při otevření obrazovky
- Živé oblasti (aria-live) pro oznámení HUD aktualizací
- Režimy barvoslepostí: deuteranopia, protanopia, tritanopia, normální, vysoký kontrast
- Semantic HTML (role="dialog", aria-modal, aria-labelledby, aria-describedby)
- WCAG 2.1 Level AA kompatibilita (ověřeno kódem, device testing v přípravě)

### PWA a offline režim (Issue #274)
- `manifest.webmanifest` s display: standalone
- App ikony (180×192×512px PNG)
- Service Worker s cache versioningem
- Network-first strategie pro HTML, cache-first pro assety
- Offline hratelnost jedné úrovně bez sítě

### Phase 2D: Integrované foreground assety
- Všechny čtyři lokality s layer-specific foreground sprites
- Chlum: mokré břehy s vegetací
- Nesměň: lesní vrstvení s occlusion effectem
- Besednice: jílový lom s geologickou vrstvou
- KD Slavia: venkovní event plocha s architekturou

### Animované NPC assety a akcí — HOTOVO (Issue #318, #319 / PR #322)
- **Milan vedoucí (Besednice)** ✅ — real artwork s 5 animovanými snímky
  - Rámce: neutral, talking, concerned, welcoming, pointing
  - Dynamické frame bounds pro asymetrické rámce (0: x0:104,x1:120; 4: x0:0,x1:16)
  - Animace: idle, talk, react_concerned, react_welcoming, action_point
- **Lovecké multi-frame akce (Chlum)** ✅ — upgrade z 6 statických poz na 16 snímků
  - pickup: [2,3,4,3] — 3 framy dopředu + návrat
  - caught: [5,6,7,6] — 3 framy dopředu + návrat
  - dig: [8,9,10,11,10,9] — 4 framy dopředu + návrat
  - celebration: [12,13,14,15,14,13] — 4 framy dopředu + návrat
  - search, talk: statické pozy

### Tři odlišné radar nálezy (Chlum) — HOTOVO (Issue #298)
- Tři povrchová místa místo jednoho pevně zakódovaného ✅
  - Site 1: { x: 1020, y: 720 }, Site 2: { x: 760, y: 920 }, Site 3: { x: 1240, y: 820 }
  - Každé místo má jedinečný findingId a variantu
  - Radar cílí na nejbližší neprohledavané místo
  - Testy: ObjectiveSystem správně zapisuje 3 nálezy do GameSession bez parallel collection

### Data-driven walkability — HOTOVO (Issue #303)
- Polygon, circle a rect blocked zóny pro všechny 4 lokality ✅
  - Chlum: verge-fence, hay bales, far edge
  - Nesměň: stromky a lesní struktury
  - Besednice: budovy a překážky
  - Slavia: řeka a přírodní prvky
  - Hráčský radius clearance zahrnut v testech
  - Všechny mandatory targets dosažitelné ze spawnu
  - Testy: rect/circle/polygon zóny korektně blokují body, player clearance funguje

### Mobilní stabilita a vstupní robustnost
- Touch input na joysticku a action tlačítku bez vlivů na gameplay
- Orientační změny (portrait ↔ landscape) automaticky pausují a obnovují hru
- Background/foreground lifecycle (pagehide/pageshow) bezpečně reset vstupu
- Safe-area support pro notched a folded zařízení
- Smoke testy na iPhone 12 portrait (390×844) a landscape (844×390)
- Playwright full-flow včetně orientation change mid-gameplay

### Technické zlepšení
- Manifest validátor odmítá nepoužívané assety (0 varování)
- Úklid preloadu: odebrány 7 legacy assetů (-4,26 MB)
- Service Worker cache s explicitní verzí
- Deterministic art pipeline pro Slavii (reprodukovatelný build)
- DomInputAdapter s pointerEvent API místo starších touchEvent/mouseEvent

**Status:** Připraveno k nasazení (zbývá: manual device testing na reálné iPhone/Android, audio asset generation)

---

## 7.0.0 — V7: vizuální přestavba všech lokalit

Každá lokalita dostává authored terrain plate, samostatnou foreground occlusion vrstvu a bounds-safe kameru sledující hráče. Gameplay, quest pravidla ani architektura runtime se přitom nemění.

- **Chlum** (#207 / PR #208) — pole po dešti, integrovaný traktor, action frames hledače.
- **Nesměň** (#213 / PR #214) — vrstevnatý les, rytmické kopání, průhledná foreground occlusion.
- **Besednice** (#217 / PR #218) — jílový lom, ježková vrstva, landscape-safe frustum.
- **KD Slavia** — venkovní sběratelská akce u Malše: nový plate `terrain-slavia-event-plate-v7`,
  foreground vrstva `foreground-slavia-event-edge-v7`, `resolveSlaviaV7CameraZoom` a reprodukovatelný
  generátor grafiky `tools/art/build-slavia-v7-art.mjs`.

### Úklid preloadu

Z manifestu, offline cache i stromu zmizelo 7 assetů (4,26 MB), které po V7 přestavbě už žádná scéna
nevykresluje — mimo jiné 3MB referenční snímek Nesměně a provizorní plate Besednice a Slavie.
`tools/validate.mjs` nově selže, pokud manifest obsahuje asset, na který se runtime neodkazuje.

### Odstranění legacy runtime a save kódu

Dokončen integrační krok 6: z repozitáře zmizely `audio.js`, `data.js`, distribuční ZIP,
`BUILD_REPORT.txt` a celá zmrazená save vrstva (`LegacySaveAdapter`, `LegacyDataAdapter`, `GameState`,
`docs/save-schema.md`). Validátor jejich návrat i jakoukoli persistenci v `src/` nově odmítá.

## 6.x

Modulární ES-module runtime s jedním Three.js `WebGLRenderer`, ortografickou kamerou, in-memory session
bez save systému a inventáře, dotykovým ovládáním pro iPhone portrait i landscape a service workerem
pouze jako distribuční cache.

## 5.1 — Reálnější lokality (historické)

- Chlum: otevřené zvlněné pole, vzdálený les, hluboké výkopy, haldy hlíny a strniště.
- Ločenice: řídký borový les, světlé písčité podloží, valy, jámy a popadané kmeny.
- Besednice: rozrytá těžební plocha, pásové stopy, zemní valy, hlubší jámy a bagry.
- Slávie: historická fasáda s trojúhelníkovým štítem spojená s moderní bílou přístavbou a proskleným parterem.

Ločenice není v cílové V7 verzi samostatný level; kanonické lokality jsou Chlum, Nesměň, Besednice a KD Slavia.
