# Výběr podkladů lokalit

Rozhodnutí o tom, který vygenerovaný podklad jde do hry, a co se s ním musí
udělat, než se zapojí. Slouží jako vstup pro level blueprinty
(`docs/zadani-claude-design.md`) — blueprinty se staví nad těmito záběry.

**Stav:** vybráno, čeká se na soubory. Obrázky vložené přímo do konverzace nejsou
dostupné jako soubory; je potřeba je poslat jako přílohu nebo commitnout do repa.

---

## Vybrané záběry

| Lokalita | Varianta | Proč právě tahle |
|---|---|---|
| **Chlum** | 3 z 5 | Horizont ve 14 % výšky, pole čitelné po celé ploše, balíky nikde neblokují průchod, silná polní cesta vlevo jako trasa traktoru. Zelený travnatý okraj vlevo dole navazuje na stávající kulisu popředí `chlum-wet-verge-v7`. |
| **Ločenice** | 2 ze 2 | Prosvítající písčité polohy v tmavé ornici a remízek na horizontu — čte hloubku lépe než jednička, která je monotónní. Popisek vlevo dole padne do ořezu. |
| **Nesměň** | 3 ze 3 | Jediná varianta, kde jsou vidět **kmeny ze strany**, ne jen koruny shora. Kmeny dávají svislé měřítko, podle kterého postava sedne. Díry po kopáčích a hromady písku perfektně čitelné. |
| **Besednice** | 1 ze 3 | Dno lomu zabírá největší část záběru. Level má sedm entit (průvodce, tři stopy, ježek, Karel) a všechny potřebují průchozí plochu. Trojka má hezčí popředí, ale rám lomu ukusuje moc místa; dvojka je kolmý pohled a čte se jako mapa. |
| **Slávie** | bližší záběr | Nahrazuje jak původní vadné plátno, tak první širokou variantu. Budova KD čitelná včetně tympanonu a schodiště, zábradlí u řeky dává jasnou hranici průchozí zóny. **Bez lidí** — původní vada odstraněna. |

### Co bylo zamítnuto a proč

- **Slávie, původní plátno v repu** — jiná technika než zbytek hry (plochá
  vektorová ilustrace), zapečené blokové figurky, jas 142 a sytost 0,24 proti
  pásmu 65–100 / 0,38–0,52.
- **Besednice 2** — kolmý pohled shora, chybí hloubka.
- **Nesměň 2** — pohled kolmo dolů, postava by neměla vůči čemu být velká.
- **Ločenice 1** — barevně poslušná, ale monotónní, bez čitelné hloubky.

---

## Měřítko: každá lokalita potřebuje jiný ořez

Vygenerované záběry jsou širší, než plátno snese. Bez ořezu vyjde postava
násobně větší, než má být — přesně ta vada, kvůli které dřív působily postavy
a okolí nesourodě.

Odhady vycházejí z velikosti známých objektů v záběru (balík slámy 1,5 m,
stánek 2,5 m, lucerna 4 m) přepočtené na výšku postavy 116 herních jednotek.

| Lokalita | Odhad zvětšení | Ořez `--zoom` | Podle čeho měřeno |
|---|---|---|---|
| Chlum | ~2,0× | 0,50 | balíky slámy |
| Ločenice | ~2,0× | 0,50 | kameny a koleje |
| Nesměň | ~1,5× | 0,65 | kmeny stromů |
| Besednice | ~1,8× | 0,55 | borovice na hraně |
| Slávie | ~1,6× | 0,60 | lucerny a lavičky |

**Tohle jsou odhady z fotek, ne ověřená čísla.** Postup je začít Chlumem,
zapojit ho a podívat se na postavu v poli; podle skutečného výsledku se hodnoty
pro zbytek doladí.

---

## Zpracování

Nástroj `tools/prepare-plate.py` udělá ořez, převod na přesné herní rozměry
a barevné srovnání do pásma jedním příkazem:

```bash
python3 tools/prepare-plate.py --location chlum     --zoom 0.50 chlum.png
python3 tools/prepare-plate.py --location locenice  --zoom 0.50 locenice.png
python3 tools/prepare-plate.py --location nesmen    --zoom 0.65 nesmen.png
python3 tools/prepare-plate.py --location besednice --zoom 0.55 besednice.png
python3 tools/prepare-plate.py --location slavia    --zoom 0.60 slavia.png
```

Kontrola bez zápisu: `python3 tools/prepare-plate.py --measure obrazek.png`

Cílové rozměry a názvy souborů jsou v nástroji; Ločenice zapisuje do
`locenice-plate-v7.webp`, který zatím v repu není.

---

## Co ještě chybí

- **Ločenice nemá scénu ani data.** Plátno bude, ale lokalita v `src/data/levels.js`
  neexistuje — je potřeba ji založit a rozhodnout, jestli nahrazuje Besednici,
  nebo se přidává jako pátá.
- **Kulisa popředí pro Ločenice** — ostatní čtyři lokality mají svou
  (`assets/sprites/foreground/`), Ločenice ne.
