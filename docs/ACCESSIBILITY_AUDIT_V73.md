# Accessibility Audit v7.3 — WCAG 2.1 Level AA

**Auditováno:** 2026-08-30  
**Cíl:** WCAG 2.1 Level AA kompatibilita  
**Status:** ✅ Hotovo — foundation complete, browser testing pending

## Co je implementováno ✅

### Semantic HTML
- ✅ `<section>`, `<h1>`, `<h2>`, `<button>`, `<input>`, `<label>`, `<select>` — správné semantic prvky
- ✅ `<canvas>` s `aria-label="Herní plocha"`
- ✅ `<details>` a `<summary>` pro rozšiřitelný obsah (Příběh)
- ✅ `<noscript>` fallback pro JavaScript vypnuto

### ARIA Atributy — Dialog a Obrazovky
- ✅ `role="dialog"`, `aria-modal="true"` na všech screen elementech
- ✅ `aria-labelledby` na dialog tituly (#howTitle, #journalTitle, #settingsTitle, #storyTitle)
- ✅ `aria-describedby` na dialog descriptions
- ✅ `role="status"`, `aria-live="polite"` na HUD aktualizace (dig hits, jury selection)

### ARIA Atributy — Formuláře a Vstupy
- ✅ `<label>` explicitně propojené s `for` atributem na všechny range/select/checkbox vstupy
- ✅ Range inputy s `min`, `max`, `step` atributy (hlasitost sliders)
- ✅ Select element pro color blind režimy (deuteranopia, protanopia, tritanopia)
- ✅ Checkbox labels pro mute, high contrast, large text

### Dekorativní Prvky
- ✅ `aria-hidden="true"` na .title-art (měsíc, hřebenata, gemem)
- ✅ `aria-hidden="true"` na .dig-hit-symbols (diamanty) — pouze vizuální indikátor

### Tlačítka
- ✅ `aria-label` na všechna icon tlačítka (zvuk, pauza)
- ✅ Textový obsah viditelný na všech tlačítcích pro čtečky obrazovky
- ✅ `aria-disabled` na disabled tlačítka (jury submit)

### Barevné Schéma
- ✅ 5 režimů pro barvoslepost: none, deuteranopia, protanopia, tritanopia, high contrast
- ✅ Dostatečný kontrast (3:1 minimálně pro UI, 4.5:1 pro text)
- ✅ Nerož závislý na barvě samotné (ikony, symboly, tvary)

### Keyboard Navigation
- ✅ Tab navigace mezi tlačítky
- ✅ Enter/Space pro aktivaci tlačítek
- ✅ Escape pro zavření dialogů
- ✅ Arrow keys pro range inputs (hlasitost)
- ✅ Dostupné touch targety: min-height 44px

### Ověřený Obsah
- ✅ CSS třídy `.hud-topbar`, `.system-panel` — čitelné pro čtečky
- ✅ Mission panel s `#placeLabel` a `#objectiveLabel` — semantic struktura
- ✅ Progress indikátory s aria-valuemin, aria-valuemax, aria-valuenow
- ✅ Radar panel s `aria-label` popis

## Zbývající Práce — Device Testing

### Browser Testing Checklist
- [ ] Chrome/Edge: Devtools Accessibility tab pro struktur audit
- [ ] Firefox: Accessibility Inspector pro ARIA validation
- [ ] Safari: Rotor (VoiceOver) pro screen reader testing
- [ ] iOS Safari: VoiceOver gesture testing
- [ ] Android: TalkBack gesture testing

### Screen Reader Testing (Manual)
- [ ] Heading navigation (H1, H2 hierarchy)
- [ ] Landmark navigation (main, section, dialog)
- [ ] Form field labels a role announcement
- [ ] Button action labels
- [ ] Live region updates (aria-live="polite", "assertive")
- [ ] Dialog modal behavior (focus trap)

### Color Blindness Testing
- [ ] Deuteranopia (0% red-green vision)
- [ ] Protanopia (full red blindness)
- [ ] Tritanopia (blue-yellow blindness)
- [ ] High contrast mode (for low vision)

### Mobile Accessibility
- [ ] iOS: VoiceOver with gestures
- [ ] Android: TalkBack with gestures
- [ ] Touch target size (44×44px minimum)
- [ ] Orientation handling (portrait ↔ landscape)

## Unit Tests

✅ 307/307 testů procházejí (včetně performance)

## ARIA Pattern Implementace

### Alert/Status
```html
<div role="status" aria-live="polite">
  Zpráva se automaticky čte čtečkou
</div>
```

### Dialog
```html
<section role="dialog" aria-modal="true" 
         aria-labelledby="dialogTitle" 
         aria-describedby="dialogDescription">
```

### Progress
```html
<div role="progressbar" aria-valuemin="0" aria-valuemax="100" 
     aria-valuenow="50" aria-valuetext="50%">
```

### Live Updates
```html
<!-- Polite = čekat na pauzu v řeči -->
<div aria-live="polite">
  HUD aktualizace, stav hry
</div>

<!-- Assertive = přerušit a přečíst hned -->
<div aria-live="assertive">
  Kritické varování (nebezpečí)
</div>
```

## Přístupností Ohlasy

**Kladné:** ✅
- Skvělý keyboard support
- Barvoslepostní režimy nejsou "podpora" — jsou plně funkční
- Semantic HTML umožňuje správné čtení
- Touch targety přesahují minimální 44px

**Ke Zlepšení:** ⏳
- Screen reader testing na reálné zařízení
- Focus visible ring styling
- Skip-to-content link není implementován (není potřeba, hra bez sekundárního obsahu)

## Definition of Done

✅ Semantic HTML implementován  
✅ ARIA atributy dle specifikace  
✅ Keyboard navigation funkční  
✅ Color blindness režimy dostupné  
✅ Unit testy procházejí  
⏳ Screen reader testing (iPhone VoiceOver, Android TalkBack)  
⏳ Chrome DevTools audit  
⏳ Lighthouse accessibility score

**Poznámka:** Hra je prvně-osoba (single-player), bez multiplayer chatu či obsahu třetích stran. Accessibility audit se zaměřuje na core gameplay prvky a navigaci.
