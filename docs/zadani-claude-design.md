# Zadání pro Claude Design — herní levely Lovce vltavínů

Podklad pro tvorbu level design blueprintů a stylového předpisu ke hře
*Lovec vltavínů* (v7, Three.js, ortografická kamera, malovaná kulisa + sprity).

---

## 1. Rozsah — co se objednává a co ne

**Claude Design vytvoří:**

1. **Level blueprint** pro každou ze čtyř lokalit — půdorys s průchozí zónou,
   spawnem, pozicemi NPC, ložisek, hazardů a hranicemi kamery.
2. **Art direction sheet** — závazný stylový předpis (paleta, světlo, kompozice,
   měřítko), podle kterého se generují malovaná plátna, aby držela jednotu.
3. **Kompoziční mřížka** pro každou lokalitu — rozvržení popředí, středního
   plánu a pozadí včetně místa pro kulisu popředí.

**Claude Design nevytvoří** malovaná plátna samotná. Kreslí HTML/CSS/SVG;
plátna jsou rastrové malby a vznikají v generátoru obrázků podle sheetu z bodu 2.
Blueprint slouží jako předloha, nad kterou se malba komponuje.

---

## 2. Závazný stylový předpis

Hodnoty níže jsou **naměřené ze tří existujících pláten**, která drží kvalitu
(Chlum, Nesměň, Besednice). Nejsou navržené — jsou to fakta o stávajícím díle
a nový obsah se jim musí podřídit.

| Lokalita | Jas (0–255) | Sytost | Dominantní tóny |
|---|---|---|---|
| Chlum | 70 | 0,50 | `#4F3D25` `#362C17` `#57482C` `#685439` |
| Nesměň | 66 | 0,42 | `#2A2B1D` `#454429` `#313723` `#585330` |
| Besednice | 96 | 0,39 | `#4E432D` `#7A654D` `#6E5940` `#877158` |
| **Slávie (vadná)** | **142** | **0,24** | `#B6AB93` `#A8A188` `#C1BBA8` |

**Cílové pásmo pro veškerý nový obsah: jas 65–100, sytost 0,38–0,50.**
Slávie z něj vypadává dvojnásobným jasem a poloviční sytostí — proto v ní
hra vypadá jako z jiného titulu.

### Stylová pravidla

- **Technika:** malba s reálným světlem a materiálovým detailem. Žádné ploché
  vektorové plochy, obrysové linky, kreslené figurky ani pastelové odstíny.
- **Světlo:** zatažený jihočeský den, měkké rozptýlené světlo, nízký kontrast
  mezi světly a stíny, žádné tvrdé vržené stíny v kulise.
- **Paleta:** zemitá — okr, hnědá, tlumená zeleň, šedá. Sytost nikdy nepřekročí
  0,55; syté barvy patří výhradně herním prvkům (zelený akcent HUD, ložiska).
- **Detail:** hustý po celé ploše — struktura hlíny, kameny, tráva, kaluže.
  Prázdné plochy působí nedodělaně.
- **Bez postav.** Postavy vkládá hra jako sprity. V kulise nesmí být žádná
  lidská figura — zapečené postavy jsou hlavní vada plátna Slávie.

### Měřítko

Dospělá postava měří **116 herních jednotek**. Vůči ní:

| Objekt | Výška v jednotkách | Poměr k postavě |
|---|---|---|
| Postava | 116 | 1,0 |
| Traktor | 140 | 1,2 |
| Vzrostlý strom | 700–900 | 6–8 |
| Kulturní dům (římsa) | 600–700 | 5–6 |
| Stěna lomu | 400–600 | 3,5–5 |

---

## 3. Technické parametry pláten

**Plátno musí být v pixelech přesně rovno herním hranicím lokality.**
Menší plátno se roztáhne a změkne — to je aktuální vada Besednice (85 %
potřebného rozlišení) a Slávie (80 %).

| Lokalita | Hranice = rozměr plátna | Poměr | Stav |
|---|---|---|---|
| Chlum | 1600 × 1200 | 1,33 | ✓ sedí |
| Nesměň | 1500 × 1200 | 1,25 | ✓ sedí |
| Besednice | 1680 × 1280 | 1,31 | ✗ dodáno 1436 × 1095 |
| Slávie | 1800 × 1100 | 1,64 | ✗ dodáno 1440 × 880 |
| Ločenice | 1600 × 1200 | 1,33 | ✗ neexistuje |

- **Projekce:** šikmý pohled shora, kamera skloněná zhruba 60° od svislice,
  bez perspektivního zkreslení svislic. Terén ubíhá směrem k hornímu okraji.
- **Horizont:** v horních 8–18 % výšky plátna podle lokality.
- **Formát:** WebP, kvalita 90, cílově 600–750 kB.

---

## 4. Blueprint jednotlivých lokalit

Souřadnice jsou skutečné hodnoty z herních dat. Počátek `[0,0]` je **vlevo
dole**; rostoucí `y` míří do hloubky scény.

### Chlum — „Pole po dešti" (level 1)

- Hranice `1600 × 1200`, průchozí `[40,40] 1520 × 1120`
- Spawn hráče `[120, 380]`

| Prvek | Pozice | Poznámka |
|---|---|---|
| Václav (hospodář) | `[560, 410]` | interakce, dává povolení |
| Místo hledání | `[1020, 720]` | povrchový nález |
| Traktor | `[360, 590]` | hazard, hlídkuje po ose x v pásmu 240–1360 |

**Kompozice:** zorané pole po dešti, brázdy sbíhající k hornímu okraji,
kaluže s odleskem oblohy, balíky slámy, vesnice s červenými střechami
a kostelní věží na horním okraji. Kulisa popředí: mokrá travnatá mez.

### Nesměň — „Lesní profily" (level 2)

- Hranice `1500 × 1200`, průchozí `[120,140] 1260 × 940`
- Spawn hráče `[180, 980]`

| Prvek | Pozice |
|---|---|
| Lesník | `[280, 240]` |
| Profil 1 | `[610, 430]` |
| Profil 2 | `[930, 690]` |
| Profil 3 | `[1210, 360]` |

**Kompozice:** smíšený les s pískovým podložím, prosluněné pěšiny mezi kmeny,
**viditelné díry po kopáčích a hromady vykopaného písku**, mech, kameny, kapradí.
Nejtmavší lokalita ve hře. Kulisa popředí: lesní okraj s kapradím a padlým kmenem.

### Besednice — „Ježková vrstva" (level 3)

- Hranice `1680 × 1280`, průchozí `[100,180] 1480 × 980`
- Spawn hráče `[140, 1040]`

| Prvek | Pozice |
|---|---|
| Místní znalec | `[260, 980]` |
| Stopa 1 / 2 / 3 | `[470, 890]` · `[880, 620]` · `[1240, 420]` |
| Ježek (nález) | `[1430, 260]` |
| Karel (boss) | `[1510, 900]` |

**Kompozice:** stará pískovna, stupňovité stěny s odkrytými barevnými vrstvami
jílu, kalné louže na dně, vyjeté koleje, náletové borovice na hraně.
Kulisa popředí: hrana lomu s křovím.

### Slávie — „Na Zelené Vlně" (level 4) — **k překreslení**

- Hranice `1800 × 1100`, průchozí `[340,120] 1360 × 860`
- Spawn hráče `[380, 860]`

| Prvek | Pozice |
|---|---|
| Dokument Chlum / Nesměň / Besednice | `[410, 760]` · `[790, 460]` · `[1130, 780]` |
| Expertka Eva | `[1450, 430]` |
| Franta (boss) | `[1020, 260]` |
| KD Slavia (cíl) | `[1630, 520]` |

**Kompozice:** prostranství před kulturním domem v Českých Budějovicích,
řeka podél levého okraje, dlažba a ošlapaný asfalt, stánky s látkovými
plachtami, vzrostlé stromy, budova KD na pravé straně.
**Bez lidí** — dav vkládá hra. Kulisa popředí: okraj prostranství se zábradlím.

### Ločenice — „Holé pole" — **nová lokalita**

- Navržené hranice `1600 × 1200`, průchozí `[40,40] 1520 × 1120`

**Kompozice:** holé zorané pole bez porostu, otevřená rovina ubíhající až
k horizontu, sypké písčité polohy prosvítající tmavou ornicí, drobné kameny,
vyjeté koleje. **V ploše žádné keře ani stromy** — jen vzdálený remízek
na horizontu. Nejotevřenější lokalita ve hře.

Vizuální profil je už v enginu (`src/render/VisualEngine.js`): vzdálenější
horizont, silnější sbíhání, suchý prašný opar, tvrdší kontaktní stíny.

---

## 5. Co má blueprint obsahovat

Pro každou lokalitu jeden artboard v měřítku odpovídajícím hranicím:

1. **Obrys hranic** a v něm **průchozí zóna** odlišenou výplní.
2. **Spawn hráče** a **pozice všech entit** z tabulek výše, popsané názvem.
3. **Dosah interakce** kolem každé interaktivní entity.
4. **Trasa hlídky** u hazardů (Chlum: traktor).
5. **Pásma hloubky** — vodorovné pruhy popředí / střed / pozadí s vyznačením
   horizontu, aby bylo zřejmé, jak se mění měřítko postav.
6. **Umístění kulisy popředí** — kde překrývá hráče.
7. **Měřítková figura** — silueta postavy 116 jednotek jako referenční měřítko.

Blueprinty patří na jednu stránku plátna; art direction sheet na druhou.

---

## 6. Kontrolní seznam přejímky

- [ ] Jas plátna v pásmu 65–100, sytost 0,38–0,50
- [ ] Rozlišení přesně rovno herním hranicím
- [ ] V kulise není žádná lidská postava
- [ ] Žádné ploché vektorové plochy ani obrysové linky
- [ ] Měřítko objektů odpovídá tabulce v odstavci 2
- [ ] Horizont v horních 8–18 % výšky
- [ ] Pozice v blueprintu souhlasí s herními daty v `src/data/`
