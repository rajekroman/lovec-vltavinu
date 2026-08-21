# Podklady pro Claude Design

Referenční materiály pro vytváření herních pozadí (level backgrounds) v projektovém grafickém enginu.

## Obsah

- **DESIGN_BRIEF.md** — Designerský brief s technickými specifikacemi
- **MATERIAL_SELECTION.md** — Detailní výběr obrázků a zdůvodnění
- **images/** — Referenční fotografie (při nahrání)
- **processing/** — Konfigurace a log nástroje `prepare-plate.py`

## Pracovní postup

### Fáze 1: Výběr a validace (✅ Hotovo)
- [x] Výběr referenčních obrázků pro 5 lokací
- [x] Měřítko spočítáno pro každou lokalitu
- [x] Barevné pásmo definováno
- [x] Horizont a herní prvky ověřeny

### Fáze 2: Zpracování (⏳ V průběhu)
- [ ] Nahrání obrázků do `images/`
- [ ] Spuštění `tools/prepare-plate.py` pro každou lokalitu
- [ ] Testovací ořez Chlumu → ověření v herním enginu
- [ ] Doladění ořezu dle testu
- [ ] Zpracování zbytku lokací

### Fáze 3: Integrace do hry (⏳ Budoucnost)
- [ ] Výsledné obrázky do `assets/levels/backgrounds/`
- [ ] Herní vrstva s jejich příslušenstvím (collision maps, entity layers)
- [ ] Barevná paleta pro UI a shade tabulku

## Technické specifikace

**Herní rozměry:**
- Herní plocha: 1200 × 675 jednotek
- Postava: ~116 × 200 jednotek (9,7 % šířky)

**Barevné pásmo:**
- Jas: 85–110 (0–255)
- Sytost: 0,30–0,45 (0–1,0)

**Horizont:**
- Výška: 12–15 % od vrcholu obrázku
- Obsah: min. 1 čitelný prvek za horizontem

## Lokality a jejich výběr

| Lokalita | Obrázek | Horizontů | Měřítko | Stav |
|----------|---------|---------|---------|------|
| **Chlum** | 3 | 14 % | 50 % (2× daleko) | Výběr ✅ |
| **Ločenice** | 2 | 13 % | Standard | Výběr ✅ |
| **Nesměň** | 3 | 18 % | Ze kmene | Výběr ✅ |
| **Besednice** | 1 | 25 % | Plocha max | Výběr ✅ |
| **Slávie** | Jediná | 12 % | 1,6× + color | Výběr ✅ |

## Poznámky pro designéry

1. **Měřítko je kritické** — postava musí sedět vůči viditelným prvkům v obrázku
2. **Ořez, ne roztahování** — obrázek se pouze oříže, nikdy se nenatahuje
3. **Konzistence barev** — všechny lokality v jednom pásmu pro vizuální koherenci
4. **Herní prvky** — cesty, hranice, terénní struktura musí být jasně čitelné
5. **Atmosféra** — fotografie nejsou přímou kopií, ale inspirací (volnost v barvě, detailu)

## Připraveno pro Claude Design

Dokumentace a podklady jsou připraveny k použití v Claude Design canvasu pro tvorbu finálních herních ploten. Designér bude mít k dispozici:

1. Referenční fotografii (s měřítkem)
2. Technical brief (měřítko, pásmo, prvky)
3. Herní specifikace (rozměry, horizont, kolize)
4. Inspiraci z barevného schématu

---

**Poslední aktualizace:** 21. srpna 2026  
**Branch:** `claude/podklady-claude-design-038llg`  
**Připravil:** Claude Code
