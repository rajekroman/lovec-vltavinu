# Stav práce — Vltavín Game Dev

**Poslední update:** 2026-08-21

---

## ✅ Hotové

### Vizuální systém
- [x] VisualEngine — hloubková perspektiva, kontaktní stíny, atmosférická mlha
- [x] Integrace do všech lokalit (Chlum, Nesměň, Besednice, Slávie)
- [x] Hloubkové řazení aktérů podle osy Y (painter's algorithm)
- [x] SRGB color space, anisotropic filtering, DPI scaling
- [x] Měření barevných pásem lokalit (jas, sytost) — 3 referenční plátna

### Radarový sken
- [x] RadarSweep — procedurální světelný kužel s rotací
- [x] Signál podle vzdálenosti (nelineární průběh)
- [x] Pulsující prstenec při aktivaci hledače
- [x] Shader-based implementace, žádné externí textury
- [x] 11 unit testů, validation čistá
- [x] Offline cache (sw.js)

### Herní mechaniky
- [x] Kopání — funkční rytmická minihra s trefovacím pásmem
- [x] Potvrzeno screenshoty in-game

### Nástroje a dokumentace
- [x] `tools/prepare-plate.py` — ořez, rozměry, barevné srovnání
- [x] Měřítko kalibrováno pro každou lokalitu (zoom faktory)
- [x] `docs/vyber-podkladu.md` — rozhodnutí o výběru podkladů
- [x] `docs/zadani-chatgpt-podklady.md` — prompty pro generování textur
- [x] `docs/zadani-claude-design.md` — blueprinty s entity pozicemi

---

## ⏳ V příštím kroku (čekání na input)

### Připraveno
- [x] Nástroj prepare-plate.py připraven k použití
- [x] Výběr podkladů vybrán a dokumentován
- [x] Odhady zoom faktorů spočítány

### Čeká se na
- [ ] Obrázky 5 lokalit (Chlum 3, Ločenice 2, Nesměň 3, Besednice 1, Slávie nový)
  - Musí přijít jako soubory (příloha nebo push do repa)
  - Obrázky vložené přímo do zprávy nejsou dostupné jako soubory

### Jakmile přijdou soubory
```bash
# Zpracování lokalit jednu po jedné
python3 tools/prepare-plate.py --location chlum     --zoom 0.50 chlum.png
python3 tools/prepare-plate.py --location locenice  --zoom 0.50 locenice.png
python3 tools/prepare-plate.py --location nesmen    --zoom 0.65 nesmen.png
python3 tools/prepare-plate.py --location besednice --zoom 0.55 besednice.png
python3 tools/prepare-plate.py --location slavia    --zoom 0.60 slavia.png
```

### Test měřítka
1. Zpracovat Chlum, zapojit do hry
2. Pořídit snímek s postavou v poli
3. Ověřit, že měřítko sedí
4. Doladit zoom faktory pro zbytek podle skutečného výsledku

---

## 🔮 Budoucí práce (bez urgence)

### Ločenice (nová lokalita)
- [ ] Scéna: `src/scenes/LocenieceScene.js`
- [ ] Data: `src/data/locenice.js`
- [ ] Kulisa popředí: `assets/sprites/foreground/locenice-*.webp`
- [ ] Rozhodnutí: nahrazuje Besednici, nebo přidává jako pátá?

### Dialogové systémy
- [ ] NPC Václav — jen jednu větu, bez větvení
- [ ] Rozšířit na volby a dopad na hru

### Animace
- [ ] Hráč — chůze, kopání, interakce
- [ ] NPC — nečinnost, reakční animace

---

## 📊 Metriky

| Lokalita | Plátno | Status | Barva | Čtení |
|---|---|---|---|---|
| Chlum | chlum-plate-v7.webp | ✅ | jas 70,2, sat 0,50 | ✅ ok |
| Nesměň | nesmen-forest-plate-v7.webp | ✅ | jas 65,9, sat 0,42 | ✅ ok |
| Besednice | besednice-clay-quarry-v7.webp | ✅ | jas 95,6, sat 0,39 | ✅ ok |
| Slávie | slavia-event-plate-v7.webp | 🔄 | jas 142 (mimo), sat 0,24 (mimo) | ⚠️ potřeba nové plátno |
| Ločenice | locenice-plate-v7.webp | ⏳ | čeká se | ⏳ čeká se |

**Cílové pásmo:** jas 65–100, sytost 0,38–0,52

---

## 🎯 Strategie

1. **Soubory dorazí** → zpracování lokalit postupně (jeden po jednom)
2. **Test měřítka** → ověřit Chlum, doladit ostatní
3. **Zapojení do hry** → každá lokalita přidat celek (plátno + blueprint)
4. **Vizuální sjednocení** → všechny lokality by měly čtít jako jeden svět

---

## 📝 Poznámky

- Nástroj prepare-plate.py testován: Chlum, Nesměň, Besednice projdou bez zásahu; Slávie vyžaduje srovnání jasu ×0,63 a sytosti ×1,80
- Zoom faktory jsou odhady z fotek — nejdou se měnit během zpracování, jen v přípravě
- Každá lokalita má vlastní herní hranice (rozměry v pixelech):
  - Chlum, Ločenice: 1600×1200
  - Nesměň: 1500×1200
  - Besednice: 1680×1280
  - Slávie: 1800×1100
