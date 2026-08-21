# Technické specifikace pro herní pozadí

## Herní engine — Fyzické rozměry

```
Herní plátno:  1200 jednotek (šířka) × 675 jednotek (výška)
Kamera zoom:   1:1 (fyzické jednotky = pixely na obrazovce)
Orientace:     Landscape (16:9)
```

## Postava v prostoru

```
Postava:       116 jednotek × 200 jednotek (aproximace)
Měřítko:       116/1200 = 9,7 % šířky plátna
Výška:         16,6 % výšky plátna (200/1200)
```

### Co to znamená v realitě?
Pokud je postava vysoká 1,8 m, pak 1200 jednotek = cca 38 metrů hloubky.

**Příklad Chlumu:**
- Balík slámy měří ~4 % výšky obrázku
- Při 1200 jednotek = 38 m → balík = 4 % × 38 m = 1,52 m
- ✅ Realistické (balíky slámy jsou opravdu cca 1,5 m)

## Referenční obrázky — Požadavky

### Rozlišení
- Minimálně 1600 × 900 px (2K minimum)
- Doporučeno 2560 × 1440 px (2,5K)
- Formát: JPEG, PNG (bez ztrát pro práci)

### Orientace a kompozice
- Horizont **12–15 % od vrchu** obrázku
- Minimálně **2 plány hloubky** (popředí + pozadí)
- Bez lidí na fotografii (nebo minimálně)
- Bez textu a popisků

### Barevné hodnoty (po normalizaci)

| Atribut | Minimum | Maximum | Ideál |
|---------|---------|---------|-------|
| **Jas (L)** | 85 | 110 | 95–105 |
| **Sytost (S)** | 0,30 | 0,45 | 0,35–0,40 |
| **Teplota (K)** | 4500 | 6500 | 5500 |

*Poznámka: Hodnoty jsou v normalizované HSL škále (0–255 pro jas, 0–1 pro sytost)*

## Měřítko — Kalkulace pro jednotlivé lokality

### Chlum
```
Prvek referenční:  Balík slámy = 4 % výšky obrázku
Herní měřítko:     116 jednotek (postava)
Kalkulace:         4 % × 1200 = 48 j. na balík
Záběr pokrývá:     ~50 metrů hloubky
Řešení:            Ořez na 50 % šířky
Po ořezu:          ~25 metrů hloubky ✅
```

### Ločenice
```
Prvek referenční:  Vzdálené stromy
Měřítko:           Podle horizonta + orné řady
Kalkulace:         ~1,3× moc daleko
Řešení:            Dynamický ořez
```

### Nesměň
```
Prvek referenční:  Kmen stromu (svislý)
Měřítko:           Kmen = 8–10 % výšky obrázku
Kalkulace:         Podle kmene
Řešení:            Ořez zachovávající kmeny
```

### Besednice
```
Prvek referenční:  Terasa lomu (horizontální)
Měřítko:           Maximální využití plochy
Kalkulace:         7 entit v levelu = potřeba místa
Řešení:            Minimální ořez
```

### Slávie
```
Prvek referenční:  Budova KD (architektura)
Měřítko:           1,6× moc daleko
Kalkulace:         Přepočet z šířky budovy
Řešení:            Ořez + color grading
```

## Barva — Profil a korekce

### Měřený profil (před korekcí)
- **Chlum:** OK (v pásmu)
- **Ločenice:** OK (v pásmu)
- **Nesměň:** OK (v pásmu)
- **Besednice:** OK (v pásmu)
- **Slávie:** MIMO (jas 158, sytost 0,22) → po korekci 98,5 / 0,39 ✅

### Aplikace korekce v herním enginu
```glsl
// Shader fragment (pseudokód)
vec3 correctColor(vec3 diffuse) {
    // HSL normalizace
    vec3 hsl = rgbToHsl(diffuse);
    
    // Jas do pásmá 85–110
    hsl.z = clamp(hsl.z * 1.2 + 0.05, 85./255., 110./255.);
    
    // Sytost do pásmá 0,30–0,45
    hsl.y = clamp(hsl.y * 1.1 + 0.02, 0.30, 0.45);
    
    return hslToRgb(hsl);
}
```

## Kolize a gameplay

### Vrstvy obrázku (v herním enginu)
1. **Background** — Původní fotografie (barvy, textury)
2. **Collision Map** — Maska (bílé = průchozí, černé = stěny)
3. **Entity Layer** — Bodové značky (interakce, spawn, cíle)

### Příklady herních prvků z obrázku
- **Chlum:** Cesta (traktor), balíky (přesuny), pole (svobodný prostor)
- **Nesměň:** Kmeny (překážky), díry (zvýšená obtížnost), hromady (mapy)
- **Slávie:** Budova (interiér), zábradlí (hranice), dlažba (orientace)

---

## Workflow nástroje `prepare-plate.py`

Nástroj automatizuje 3 kroky:

```bash
python tools/prepare-plate.py \
  --input images/chlum-3.jpg \
  --output assets/levels/backgrounds/chlum.jpg \
  --scale 0.5 \
  --target-width 1200 \
  --color-correct
```

**Výstupy:**
- `chlum.jpg` — Hotový obrázek (ořezaný + korigovaný)
- `chlum-metadata.json` — Metadata (měřítko, ořez, barva)
- `chlum-collision.png` — Vygenerovaná collision mapa (detekce hran)

---

## Ověření a testy

### Pre-flight checklist
- [ ] Rozlišení ≥ 1600 × 900
- [ ] Horizont v 12–15 %
- [ ] Barevné hodnoty v pásmu (nebo připraveno na korekci)
- [ ] Žádný text/popisky
- [ ] Minimálně 2 plány hloubky
- [ ] Žádní (nebo velmi málo) lidé

### In-game test
1. Zapojit obrázek jako background
2. Vykreslить postavu v předpokládaném měřítku
3. Vizuálně ověřit → Sedí postava přirozeně?
4. Pokud ne, doladit ořez a znovu

---

**Poslední aktualizace:** 21. srpna 2026  
**Zdrojový kód:** `tools/prepare-plate.py`
