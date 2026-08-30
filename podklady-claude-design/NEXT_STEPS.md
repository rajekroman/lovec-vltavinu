# Další kroky — Plán pro Claude Design

## Okamžitě dostupné (✅)
- ✅ Designerský brief — technické specifikace, herní rozměry
- ✅ Výběr obrázků — 5 lokací s detailním zdůvodněním
- ✅ Měřítko spočítáno — pro každou lokalitu jiné
- ✅ Barevný profil — pásmo barev definováno
- ✅ Nástroj přípravy — `tools/prepare-plate.py` (ořez + color correction)

## Chyběné (⏳)
Obrázky nejsou na disku — potřeba stažení/nahrání:

### Soubory k nahrání
Lokality v pořadí priorit:
1. `chlum-3.jpg` — PRIORITA 1 (testovací ořez)
2. `loscenice-2.jpg` — PRIORITA 2
3. `nesmén-3.jpg` — PRIORITA 3
4. `besednice-1.jpg` — PRIORITA 4
5. `slavie-final.jpg` — PRIORITA 5 (už korigován)

**Způsob nahrání:**
- ZIP archiv s obrázky
- Nebo commitovat jednotlivě do `podklady-claude-design/images/`
- Nebo nahrát přes GitHub UI

## Pracovní postup po nahrání

### Fáze 2A: Testovací běh na Chlumu
```bash
# 1. Procesování Chlumu
python tools/prepare-plate.py \
  --input podklady-claude-design/images/chlum-3.jpg \
  --output assets/levels/backgrounds/chlum-draft.jpg \
  --scale 0.5 \
  --color-correct \
  --verbose

# 2. Integrace do hry
# → Zapojit `chlum-draft.jpg` jako background pro level 1

# 3. Vizuální test
# → Spustit hru, vypozorovat měřítko postavy
# → Fotka: postava + pole + horizont

# 4. Zpráva: Měřítko OK / Doladit ořez na X %
```

### Fáze 2B: Zpracování zbytku (po ověření Chlumu)
```bash
# Stejný postup pro Ločenici, Nesměň, Besednici
# Slávie: už korigovaná, jen ořez
```

### Fáze 3: Integrace do hry
- [ ] Výsledné obrázky do `assets/levels/backgrounds/chlum.jpg` apod.
- [ ] Generování collision map
- [ ] Entity layer (spawn, interakce, cíle)
- [ ] UI na vrstvě (minimap, compass)
- [ ] Barevné schéma z obrázku → UI tones

---

## Co bude hotovo po integraci?

### Pro hru
- ✅ 5 level backgrounds (fotogenické, měřítko ověřeno)
- ✅ Collision map pro každý level (automatická detekce)
- ✅ Barevná paleta (konsistentní mezi lokacemi)
- ✅ Entity layer (spawn, interakce, cíle)

### Pro designéra (v Claude Design)
- Referenční fotografie (s měřítkem a sítí)
- Herní specifikace (rozměry, horizont, prvky)
- Barevný profil (pásmo, teplota světla)
- Inspirace z atmosféry

---

## Poznámky pro Claude Design

Při tvorbě herního pozadí v Canvas editoru:

1. **Měřítko je nejdůležitější** → Ověřit vůči postavě v obrázku
2. **Ořez, ne roztahování** → Poměr stran musí zůstat 16:9
3. **Horizont v 12–15 %** → Referenční čára je už v obrázku
4. **Herní prvky vidět** → Cesty, hranice, překážky jasně viditelné
5. **Atmosféra** → Fotografie je inspirace, ne šablona

### Výstupy z Canvas
- **Hotové plátno** → `assets/levels/backgrounds/[locality].jpg`
- **Collision mapa** → `assets/levels/[locality]-collisions.png`
- **Barevná paleta** → `assets/themes/[locality]-palette.json`
- **Poznámky** → `podklady-claude-design/design-notes/[locality].md`

---

## Časový odhad (po nahrání obrázků)

| Úkol | Trvání | Vázanost |
|------|--------|----------|
| Testovací běh Chlumu | ~30 min | - |
| Ověření měřítka v herě | ~15 min | ← Závisí na tesťáku |
| Zpracování zbytku (4×) | ~2 hod | ← Po ověření Chlumu |
| Finální integrace | ~1 hod | ← Po zpracování |
| **Celkem** | **~3,5 hod** | |

---

## Rozhodnutí, které potřebuji tvůj názor

### 1. Ořez Chlumu — testovací procento?
- Návrh: 50 % (1200 → 600 px šířka)
- Výsledek: Horizont zůstane ~20 %, vesnice bude vidět
- Otázka: Nebo jít agresivněji na 40 % (méně vesnice, více pole)?

### 2. Slávie — color grading v herním shaderu, nebo offline?
- Offline: Jednorázově v `prepare-plate.py`, pak už jen obrázek
- Shader: Dynamická korekce, lze měnit za běhu (jas, sytost)
- Návrh: Offline (jednoduší, předvídatelné)

### 3. Collision map — automatická (detekce hran) nebo ruční?
- Automatická: Rychlá, může mít chyby
- Ruční: Přesná, zdržuje
- Návrh: Automatická + ruční doladění po tesťáku

---

## Stav Branch

- **Branch:** `claude/podklady-claude-design-038llg`
- **Soubory:** Všechna dokumentace ✅
- **Obrázky:** Čekám na nahrání ⏳
- **Ready to merge:** Když budou všechny lokality zpracované a testované ✅

---

**Poslední aktualizace:** 21. srpna 2026  
**Zpracovatel:** Claude Code + User (zpětná vazba)
