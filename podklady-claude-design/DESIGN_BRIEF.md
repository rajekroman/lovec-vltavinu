# Claude Design — Designerský Brief

## Cíl
Připravit referenční materiály pro 5 herních lokací (level backgrounds) v grafickém enginu. Obrázky slouží jako reference pro tvorbu herních ploten — nejde o přímou kopii, ale o studii měřítka, kompozice, barevných schémat a prvků prostředí.

## Technické specifikace

### Herní rozměry
- **Šířka:** 1200 jednotek (fyzický rozsah kamery)
- **Výška postavy:** 116 jednotek z 1200 (9,7 %)
- **Měřítko obrázku:** reference by měla postavu na horizontu zobrazit v tomto měřítku

### Pásmo barev
- **Jas:** 85–110 (normalizováno 0–255)
- **Sytost:** 0,30–0,45 (normalizováno 0–1,0)
- **Důvod:** konzistence mezi lokacemi, čitelnost prvků i v herní kvalitě

### Horizont
- **Povinné umístění:** 12–15 % výšky obrázku
- **Obsah za horizontem:** nejméně jeden čitelný prvek (budova, remízek, strom)

## Herní prvky v referencích

### Co se hledá v obrázku
1. **Měřítko** — viditelný prvek, podle kterého postava sedne
   - Balíky slámy (Chlum)
   - Kmeny stromů (Nesměň)
   - Architektura (Slávie)

2. **Terén a jeho struktura**
   - Cesty, stopy, drážky (Chlum, Ločenice)
   - Díry a hromady (Nesměň, Besednice)
   - Dlažba a hranice (Slávie)

3. **Hloubka a perspektiva**
   - Minimálně 2 plány (popředí + horizont)
   - Vzdušná perspektiva pro hloubku

4. **Hranice zóny** — kde postava může chodit
   - Cesty, stěny, zábradlí
   - Přírodní prvky (les, řeka)

---

## Specifika jednotlivých lokací

### 1. Chlum — Pole s traktorem
**Herní cíl:** Plocha pro sbírání slámy  
**Prvky:** Balíky slámy, polní cesta, obzor se vesnicí  
**Měřítko:** 2× moc daleko (ořez 50 %)  
**Problém řešit:** Vzdálenost vesnice po ořezu

---

### 2. Ločenice — Orná půda
**Herní cíl:** Orientace v prostoru podle reliéfu  
**Prvky:** Orné řady, prosvítající písek, remízek  
**Měřítko:** Standard (1,2–1,5×)  
**Poznámka:** Bez popisků  

---

### 3. Nesměň — Les se stopami
**Herní cíl:** Zvýšená obtížnost — průhlednost a stíny  
**Prvky:** Kmeny stromů, díry po kopáčích, hromady písku  
**Měřítko:** Spočítáno ze kmene  
**Přednost:** Nejsilnější herní prvky (díry + hromady vidět jasně)

---

### 4. Besednice — Kaolínový lom
**Herní cíl:** Vertikální explorace, lavice lomu  
**Prvky:** Terasy, dno lomu, stěny  
**Měřítko:** Plocha maximální  
**Poznámka:** 7 entit v levelu — potřeba prostoru

---

### 5. Slávie — Nábřeží u budovy
**Herní cíl:** Puzzle a dialog v urbánním prostředí  
**Prvky:** Klasicistní budova KD, nábřeží, stánky, zábradlí  
**Měřítko:** 1,6× moc daleko (barva srovnána)  
**Obsah:** Tympanon, schodiště, dlažba, atmosféra

---

## Workflow Claude Design

### Úkol pro designéra
1. **Zobrazit referenční obrázek** (fotografie lokality)
2. **Porovnat měřítko** — postava vůči viditelným prvkům
3. **Nakreslit herní plochu** — zjednodušená sít prvků
4. **Barevné schéma** — extrahovat z fotografie
5. **Texturování** — procedurální nebo hand-drawn

### Výstupy
- Herní pozadí (layer: backgrounds)
- Mapa kolizí (layer: collision map)
- Barevná paleta (CSV nebo JSON)

---

## Kvalitativní kritéria

### Úspěch = Obrázek, který...
- ✅ Postava v něm sedne přirozeně (měřítko OK)
- ✅ Je čitelný i v herní kvalitě (kontrast, barva)
- ✅ Herní prvky jsou jasné (cesty, hranice, překážky)
- ✅ Sedí do pásma barev (vizuální koherence)
- ✅ Návaznost na stávající kulis (např. Chlum na `chlum-wet-verge-v7`)

---

## Poznámky pro realizaci

- Nepoužívat zpracované obrázky s popisky či textem
- Měřítko ověřit fyzickým testem se postavou v herním enginu
- Barevná korekce je výstup nástroje `prepare-plate.py`, nikoli ručního editingu
- Každá lokalita může mít jiný ořez — jednoduché řešení neexistuje
