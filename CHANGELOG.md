# Changelog

## 7.3.0 — Postavy, příchody a přístupnost

Třetí iterace V7 doplňuje živostí přes animované postavy, přidá sekvenční UI obrazovky pro příběh a deník, zpřístupňuje hru pro screen readery a offline hratelnost přes Progressive Web App.

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

### Technické zlepšení
- Manifest validátor odmítá nepoužívané assety (0 varování)
- Úklid preloadu: odebrány 7 legacy assetů (-4,26 MB)
- Service Worker cache s explicitní verzí
- Deterministic art pipeline pro Slavii (reprodukovatelný build)

**Status:** Připraveno k nasazení (zbývá: audio komprese, device testing)

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
