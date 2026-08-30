# Podklady pro Claude Design — Výběr lokací

## Přehled
Výběr referenčních obrázků pro 5 herních lokací. Kritéria: měřitelné vlastnosti (horizont v pásmu 12–15 %, sytost barev, čitelnost prvků), konzistence mezi snímky, použitelnost v herním měřítku.

## Vybrané lokality

### Chlum — Obrázek 3 ✓
**Proč tento výběr:**
- Horizont v 14 % (v pásmu ze zadání)
- Pole čitelné po celé ploše
- Balíky slámy rozmístěné tak, že nic neblokují
- Silná polní cesta vlevo (trasa pro traktoru)
- Zelený travnatý okraj dole sedí na stávající kulisu `chlum-wet-verge-v7`

**Náhradník:** Obrázek 5 — nejvíc hratelné plochy, ale vesnice příliš daleko

**Poznámka k měřítku:** Záběr je cca 2× moc daleko (měřeno přes balíky slámy).
Řešení: ořez na 50 % šířky.

---

### Ločenice — Obrázek 2 ✓
**Proč tento výběr:**
- Lépe čte hloubku než varianta 1: prosvítající písčité polohy v tmavé ornici
- Vzdálený remízek na horizontu
- Živější světlo
- Varianta 1 je barevně poslušnější, ale monotónní

**Poznámka:** Obsahuje vpálený popisek „Ločenice – holé pole" vlevo dole.
Padne do ořezových 15 %, takže nevadí — ale nepoužívat popisky v promptech.

---

### Nesměň — Obrázek 3 ✓
**Proč tento výběr:**
- Nejlepší z celé sady pro hru
- Vidíš kmeny ze strany, ne jen koruny shora
- Kmeny dávají svislé měřítko pro postavení postavy
- Díry a hromady vysypaného písku perfektně čitelné

**Náhradník:** Obrázek 1

---

### Besednice — Obrázek 1 ✓
**Proč tento výběr:**
- Dno lomu zabírá největší plochu
- Těžiště lomu je vidět na celé ploše
- V levelu je zde 7 entit, které potřebují místo

---

### Slávie — Jediná varianta ✓
**Proč tento výběr:**
- Bez výhrad — nejlepší z dostupných záběrů
- Prázdné nábřeží (původní vada „příliš moc lidí" pryč)
- Stánky a mokrá dlažba čitelné
- Klasicistní budova (KD) čitelná včetně tympanonu a schodiště
- Zábradlí u řeky dává jasnou hranici průchozí zóny
- Listí a atmosféra

**Poznámka:** Byla mimo pásmo v obou hodnotách (jas 158, sytost 0,22).
Aktuální verze srovnána na jas 98,5 a sytost 0,39 — sedí do pásma.

**Měřítko:** Cca 1,6× moc daleko.

---

## Zpracování — Nástroj `prepare-plate.py`

Nástroj provádí tři kroky automaticky:
1. **Ořez** na správné herní rozměry
2. **Měřítko** — záběr se oříže (nikdy nenatahuje), aby postava 116px sedla správně
3. **Barevná korekce** — srovnání do měřeného pásma (jas, sytost)

Každá lokalita má jiné měřítko ořezu:
- **Chlum:** ~50 % (2× moc daleko)
- **Ločenice:** proporce podle horizontu + barevná korekce
- **Nesměň:** podle kmene (svislá reference)
- **Besednice:** podle dna lomu
- **Slávie:** ~1,6× (color grading + ořez)

---

## Plán integrace

1. ✅ Výběr a dokumentace
2. ✅ Vytvoření nástroje `prepare-plate.py`
3. ⏳ Testovací ořez Chlumu → zapojení do hry → ověření měřítka se postavou
4. ⏳ Zpracování zbytku dle testu
5. ⏳ Finální soubory do `assets/levels/backgrounds/`

---

## Ověření (dosavadní)

- ✅ Chlum 3, Nesměň 3, Besednice 1: projdou bez barevné korekce
- ✅ Slávie: srovnána do pásma (byla mimo)
- ✅ Měřítko spočítáno pro všechny lokality

Zbývá: testovací fotka s postavou v poli Chlumu.
