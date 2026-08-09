# Lovec vltavínů: Zelená vlna — kanonická level-design specifikace

Stav: návrhová autorita pro implementační stream [#146](https://github.com/rajekroman/lovec-vltavinu/issues/146)

Řídicí issue: [#203](https://github.com/rajekroman/lovec-vltavinu/issues/203)

Výchozí stav: `main@6c30c05467d2faaa31b1c2d550799cb0a4071622`

## 1. Účel a závazné mantinely

Tento dokument převádí schválený brief „Zelená vlna“ do prostorového plánu čtyř kanonických kapitol. Je návrhovým podkladem; sám nemění data, objective logiku, eventy, asset manifest ani runtime.

Pořadí zůstává přesně:

`Chlum → Nesměň → Besednice → Slavia → výsledek → čistý restart`.

Závazné invarianty:

- jedna ortografická kamera, jeden `WebGLRenderer`, jeden canvas a jeden fixed-step loop;
- pohyb a jediná kontextová AKCE;
- transparentní 2D postavy/efekty nad stylizovanou low-poly 3D diorámou;
- HTML/CSS HUD nad canvasem;
- žádný inventář, crafting, save point, gameplay persistence ani pátý level;
- nálezy jsou jen položky aktuální `GameSession` pro skóre a finální hodnocení;
- kopání používá přesně tři úspěšné zásahy;
- stávající objective ID, pořadí a podmínky na výchozím `main` se v level-design balíku nemění;
- průchody jsou široké, landmarky nepřekrývají postavu a žádná interakce není závislá na hoveru.

### Souřadnice a implementace

Plány níže používají aktuální světové rozměry a cílové pozice ze `src/data/levels.js`. Schémata nejsou v měřítku, ale zachovávají relativní směry. Osa `x` roste doprava, osa `y` dolů. Budoucí změna transformů patří do samostatného owner-scoped issue; tento dokument ji neautorizuje.

### Legenda

| Značka | Význam |
|---|---|
| `S` | spawn hráče |
| `N` | NPC |
| `I` | interakční bod |
| `O` | objective oblast |
| `F` | nález / finding |
| `H` | hazard nebo riziková oblast |
| `L` | landmark |
| `E` | cílový/exit bod nebo prezentační kotva přechodu |
| `→` | hlavní pohyb hráče |
| `⇄` | opakovaná nebo patrolovací trasa |

## 2. Společný prostorový jazyk

Každá mapa je malé otevřené místo se dvěma krátkými cestami mezi hlavními body, nikoli koridor. Hlavní cesta nese objective flow, vedlejší cesta dovoluje bezpečné obejití hazardu nebo návrat bez dlouhého backtrackingu.

Kompozice pracuje se třemi výškovými pásmy:

1. **podlaha 0–0,25 m** — povrch, kaluže, kořeny, drobné kameny a čitelné stopy; neblokuje postavu;
2. **herní pásmo 0,25–1,8 m** — NPC, interakce, ploty, valy a props; drží volný prstenec kolem AKCE;
3. **landmark/background nad 1,8 m** — koruny, budovy a siluety; umísťují se k horním a bočním okrajům, aby nezakrývaly hráče.

Pro každý interakční bod musí zůstat volná plocha minimálně o průměru dvojnásobku interaction range. Silueta NPC nesmí splývat s kmenem, kamenem, dveřmi ani hranou HUDu. Pohyblivý hazard musí být viditelný před vstupem do jeho dráhy.

## 3. Level 1 — Chlum

### A. Top-down plán

Aktuální rámec: bounds `1600 × 1200`, spawn `(120, 380)`, Václav `(560, 410)`, hledací místo `(1020, 720)`, traktor na `y ≈ 590` patroluje `x = 240–1360`.

```text
SEVER / vzdálená obec a měkký horizont
┌──────────────────────────────────────────────────────────────┐
│ L1 remízek        L2 výrazný strom          E polní výjezd   │
│ ████████                 ▲                      ║             │
│                                                            │
│ S bezpečný okraj ──→ N Václav ──→ vstup do otevřeného pole │
│ ● (120,380)          ● (560,410)                             │
│                         │                                    │
│                         ├── bezpečná obchůzná pěšina ───┐    │
│                         │                               │    │
│ H TRAKTOR  ⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄⇄  L3 traktor    │
│ y≈590, x 240–1360; čitelný pás stopy kol a volné kraje │    │
│                         │                               │    │
│                         └────→ O/I/F hledací místo ←────┘    │
│                                  ● (1020,720)                 │
│                                  L4 světlý kamenitý zához    │
│                                           L5 balíky / mez     │
└──────────────────────────────────────────────────────────────┘
JIH / travnatý okraj, plot a bezpečná návratová cesta
```

Hranici tvoří remízky, nízký plot, příkop a travnatý lem. Nejsou to neviditelné stěny uprostřed pole. Spawn a Václav leží ve stejné bezpečné kapse; pole se za nimi vizuálně otevírá. Červenohnědý patrolovací pás traktoru je čitelný jako jedna souvislá dráha. Hledací místo leží za drahou, nikoli vedle Václava.

`E` je jen kompoziční kotva následného přechodu. Dokončení nadále spouští stávající objective flow; nevzniká nová exit interakce.

### B. Gameplay flow

1. Hráč se objeví na travnatém jihozápadním okraji. Václav, barevný traktor i většina jeho dráhy jsou viditelné v prvních dvou kamerových rámcích.
2. Krátkou cestou dojde k Václavovi a AKCÍ získá stávající povolení.
3. Otevře se čitelný cíl v poli. Hráč z bezpečné kapsy nejprve přečte směr traktoru.
4. Dráhu buď překročí po průjezdu, nebo obejde travnatou pěšinou podél okraje.
5. U kamenitého záhozu provede stávající surface-search interakci a získá nález.
6. Výsledek se zapíše do session a kapitola přejde do Nesměně. Žádný fyzický předmět se nespravuje v inventáři.

### C. Environment composition

- **Povrchy:** tmavá mokrá ornice, pravidelné ale mírně nepravidelné brázdy, mělké kaluže, travnatý lem a světlejší polní cesta.
- **Vegetace:** nízká tráva, mezní květiny, dva kompaktní remízky a 2–3 stromy na okraji; žádný les uprostřed pole.
- **Architektura:** vzdálená jihočeská obec pouze jako nízko-kontrastní horizont; plot a jednoduchý polní vjezd.
- **Rekvizity:** traktor jako nejsytější landmark, 2–3 balíky, patníky, stopy pneumatik a několik kamenů u hledacího místa.
- **Výškové vrstvení:** centrální pole zůstává nízké a otevřené; vyšší zeleň pouze na horním a bočních okrajích.
- **Světlo:** zatažené měkké světlo po dešti, jemný teplý průraz oblohy, žádné tvrdé černé stíny.
- **Atmosféra:** bezpečný první výlet s jedním jasným rizikem; „jihočeské pole po dešti“ musí být rozpoznatelné bez HUDu.

### D. Asset list

**2D sprites**

- hráč: idle/walk/action, čitelná tmavozelená silueta;
- Václav: pracovní bunda, čepice, vousy; jeden výrazný barevný akcent;
- mokrý odlesk, prach/bláto traktoru, AKCE/finding záblesk.

**Low-poly 3D**

- traktor bez viditelného řidiče, polní plot, balík slámy, patník;
- 2–3 druhy listnatých stromů a jeden remízkový cluster;
- hledací marker jako nízký kamenitý zához, ne fantasy oltář.

**Textury**

- mokrá ornice a samostatný motiv brázd;
- blátivá cesta, tráva/mez, kalužový detail a nízko-kontrastní vzdálená krajina.

### E. Mobile readability check

| Zóna | Desktop | iPhone portrait | iPhone landscape |
|---|---|---|---|
| Spawn + Václav | současně ukáže NPC, okraj pole a část traktoru | Václav je první dominantní svislá silueta; spawn není pod joystickem | NPC a traktor jsou oddělené do dvou horizontálních třetin |
| Traktorová dráha | dlouhá patrola je čitelná téměř celá | před vstupem do pásu kamera ukáže nejméně jeden směr úniku | nízké props nebrání širokému výhledu pod HUDem |
| Hledací místo | kontrastuje světlým kamením proti hnědé půdě | volný kruh kolem cíle drží postavu i AKCI mimo okraje | marker není závislý na drobném záblesku; funguje i siluetou |

## 4. Level 2 — Nesměň

### A. Top-down plán

Aktuální rámec: bounds `1500 × 1200`, spawn `(180, 980)`, lesník `(280, 240)`, profily `(610, 430)`, `(930, 690)`, `(1210, 360)`.

```text
SEVER / hustší stromová stěna
┌──────────────────────────────────────────────────────────────┐
│ N lesník Jan         L1 strážní posed / velký smrk          │
│ ● (280,240) ──→ O1 profil A ● (610,430)                     │
│      │                    ╲                                  │
│      │  hlavní lesní cesta ╲       L2 charakteristický buk  │
│      │                      ╲                  ▲             │
│      │                       O2 profil B ● (930,690)         │
│      │                       │  H hluk / otevřená díra       │
│      │  vedlejší měkká cesta│                               │
│      └───────────────────────┴──→ O3 profil C ● (1210,360)  │
│                                  L3 odkrytý světlý profil    │
│                                              E lesní výjezd  │
│ S ● (180,980) ─→ L4 vstupní mýtina ────────────────┘        │
└──────────────────────────────────────────────────────────────┘
JIH / řidší porost a čitelný vstup
```

Stromy jsou ve skupinách, mezi nimiž vzniká trojúhelníková smyčka. Kmeny nikdy netvoří jednolitý labyrint. Každý profil má jiný sousední landmark a jinou orientaci světlé odkryté zeminy. Hazard není nový pohybující se nepřítel: riziko je navázáno na stávající hluk a dočasně otevřenou díru.

### B. Gameplay flow

1. Ze vstupní mýtiny hráč sleduje nejširší lesní cestu k lesníkovi Janovi.
2. AKCÍ získá stávající povolení a podmínku po sobě všechny profily zasypat.
3. Profil A je z prostoru lesníka nejsnáze viditelný a učí vizuální jazyk odkryté půdy.
4. Hráč pokračuje krátkou smyčkou k profilu B a C; pořadí obou může být prostorově volné, objective zůstává deterministický.
5. Každý profil používá stávající kopání na tři úspěšné zásahy a následné zasypání. Otevřený profil zůstává výrazný, dokud není obnoven.
6. Po třech dokončených a zasypaných profilech se kapitola uzavře a přejde do Besednice.

### C. Environment composition

- **Povrchy:** tmavá lesní hrabanka, mech, udusaná hnědošedá cesta, tři světlé písčité profily a mokré listí.
- **Vegetace:** skupiny smrků a listnáčů, kapradiny v nízkých shlucích, kořeny a spadané větve vedené rovnoběžně s cestou.
- **Architektura:** jednoduchý posed nebo správcovský přístřešek jako Janův landmark; žádná fantasy ruina.
- **Rekvizity:** pařezy, klády, kameny, nízké výstražné kolíky a lopata u hlídaného prostoru.
- **Výškové vrstvení:** nejvyšší koruny na severním a bočním okraji, střed smyčky tvoří nižší mýtiny; kmeny poblíž interakcí mají prořídnuté koruny.
- **Světlo:** zelené filtrované světlo s teplejšími kužely na mýtinách; profily jsou světlejší než okolní zem.
- **Atmosféra:** skutečné hledání něčeho ukrytého; uzavřenější než Chlum, ale bez bludiště.

### D. Asset list

**2D sprites**

- hráč: společný sheet;
- lesník Jan: reflexní nebo rezavý detail proti zelenému pozadí;
- kopací prach, odletující hlína, stav otevřeného/zasypaného profilu.

**Low-poly 3D**

- smrk, buk/listnáč, pařez, kořenový cluster, kláda;
- tři varianty profilového markeru, kameny a nízké kolíky;
- posed nebo malý správcovský přístřešek.

**Textury**

- lesní hrabanka, mech, mokré listí, udusaná cesta;
- světlý písek profilu a obnovená tmavší zemina.

### E. Mobile readability check

| Zóna | Desktop | iPhone portrait | iPhone landscape |
|---|---|---|---|
| Vstup → Jan | široká cesta vede pohled diagonálně přes mýtinu | cesta je svislá navigační osa a Jan má čisté pozadí | posed/smrk a Jan tvoří oddělené landmarky |
| Trojúhelník profilů | dva průchody umožní krátkou smyčku | vždy je viditelný současný profil a jeden návratový směr | skupiny stromů rámují cestu, neřežou ji na úzké pruhy |
| Kopání + zasypání | světlá půda ukazuje stav i bez textu | interakční kruh nezasahuje kmen ani safe-area HUD | nízká vegetace u profilu nezakrývá hit feedback |

## 5. Level 3 — Besednice

### A. Top-down plán

Aktuální rámec: bounds `1680 × 1280`, spawn `(140, 1040)`, stopy `(470, 890)`, `(880, 620)`, `(1240, 420)`, ježkový profil `(1430, 260)`, Karel `(1510, 900)`.

```text
SEVER / vysoké odkryté profily a kamenité valy
┌──────────────────────────────────────────────────────────────┐
│ L1 vrstvená stěna     L2 hlavní výkop      O/F ježkový profil│
│ ███████████████          ╲________/          ● (1430,260)    │
│        │                                        ↑ odemkne se │
│        O3 stopa ● (1240,420) ←── kamenitá horní cesta        │
│          ↑                                                   │
│ O2 stopa ● (880,620) ───→ L3 pracovní / těžební prvek       │
│    ↑                       │                                 │
│    │                       └── široký sestup ─────────┐      │
│ O1 stopa ● (470,890)                                │      │
│    ↑                                                ↓      │
│ S ● (140,1040) → bezpečná orientační kapsa    H/N Karel    │
│                                               ● (1510,900) │
│                                      L4 široká arena/recovery│
│                                                   E → Slavia │
└──────────────────────────────────────────────────────────────┘
JIH / zarostlý vstup, nižší valy
```

Mapa se odhaluje diagonálně od jihozápadu k severovýchodu. Stopy jsou jednorázové a vizuálně odlišné, ale používají stejný interaction jazyk. Ježkový profil je od vstupu zahlédnutelný přes kompoziční průhled jako nejvýraznější geologický bod, gameplayově však zůstává uzamčený do nalezení tří stop. Karel není mentor ani briefing NPC; jeho stávající konflikt nastává až po nálezu. Arena u Karla je široká a bez vysokých props.

### B. Gameplay flow

1. V bezpečné vstupní kapse hráč přečte tři úrovně mapy: první stopu, vzdálený val a siluetu hlavního profilu.
2. Najde jednorázovou stopu 1 u snadno dostupného nízkého valu.
3. Střední cesta vede ke stopě 2; vedlejší cesta umožňuje obejít hlavní výkop bez úzkého koridoru.
4. Horní kamenitá cesta vede ke stopě 3. Po jejím získání se odemkne stávající ježkový profil.
5. U profilu hráč provede přesně tři úspěšné zásahy a získá ježkový vltavín do session výsledků.
6. Následuje stávající konflikt s Karlem. Hráč sestoupí do široké jihovýchodní arény a AKCÍ nález získá zpět.
7. Recovery dokončí objective a kapitola přejde do Slavie.

### C. Environment composition

- **Povrchy:** směs jílu, štěrku a kamenité zeminy; odlišné vrstvy v odkrytých stěnách; tmavší mokré kapsy a světlé čerstvé řezy.
- **Vegetace:** jen na okrajích a starších valech; ostružiní, nízké trávy a několik odolných stromů. Střed je záměrně surový.
- **Architektura:** žádná dominantní budova; jednoduché pracovní zábrany nebo starý skluz pouze jako měřítko lokality.
- **Rekvizity:** kamenné valy, staré výkopy, třídicí síto/kolečko, lopaty, výstražné kolíky a tři jasně odlišené stopy.
- **Výškové vrstvení:** horní severní profil je nejvyšší; střední valy dělí zóny bez zakrytí; arena s Karlem je nízká a plochá.
- **Světlo:** větší kontrast než v předchozích levelech, chladnější stíny a teplejší odkryté vrstvy; žádná fotorealistická ostrost.
- **Atmosféra:** vrchol hledání, fyzicky poznamenaná lokalita a očekávání nejlepšího nálezu.

### D. Asset list

**2D sprites**

- hráč: společný sheet;
- Karel: výrazná rivalova silueta, odlišná barva od jílu a kamene;
- tři varianty clue feedbacku, dig hit/miss, ježkový nález a recovery efekt.

**Low-poly 3D**

- modulární odkrytý profil se 3–4 barevnými vrstvami;
- nízký a vysoký kamenitý val, jáma/výkop, balvany;
- třídicí síto nebo starý těžební skluz, kolečko, lopata, zábrana;
- tři clue markery a samostatný ježkový profilový marker.

**Textury**

- kamenitá lomová zem, jíl, štěrk a odkryté geologické vrstvy;
- starší zarostlá zemina, mokrá kapsa a pracovní stopa.

### E. Mobile readability check

| Zóna | Desktop | iPhone portrait | iPhone landscape |
|---|---|---|---|
| Vstup + stopa 1 | okamžitě ukáže první cíl i vzdálený profil | diagonální osa vede vzhůru obrazem; první stopa není pod joystickem | valy rámují cíl, ale neblokují boční obchůzku |
| Stopy 2–3 | landmarky rozlišují střední a horní zónu | v každém rámu je právě jeden dominantní cíl a návratová cesta | nízké kameny nezakrývají sprite ani AKCI |
| Ježkový profil | velký tvar a vrstvy fungují bez drobného textu | profil sedí v horní polovině, hit feedback ve volném středu | kamera ukáže profil i bezpečný odstup od hrany |
| Karel + recovery | arena má nejméně dvě šířky interakčního dosahu | Karel je svislá kontrastní silueta na nízkém pozadí | žádné vysoké props mezi hráčem a Karlem |

## 6. Level 4 — KD Slavia

### A. Top-down plán

Aktuální rámec: bounds `1800 × 1100`, spawn `(380, 860)`, dokumentační body `(410, 760)`, `(790, 460)`, `(1130, 780)`, expertka Eva `(1450, 430)`, Franta `(1020, 260)`, cíl KD Slavia `(1630, 520)`.

```text
SEVER / městská hrana a boční servisní prostor
┌──────────────────────────────────────────────────────────────┐
│                 H Franta ● (1020,260)                        │
│                 krátká stávající recovery kapsa              │
│                           │                                  │
│ I dokument 2 ● (790,460)  └────→ N expertka Eva ● (1450,430)│
│       │                           L3 porota / registrační pult│
│       │                                      │               │
│ L1 bannerová osa                            E KD Slavia      │
│       │                                ● (1630,520)          │
│ I dokument 1 ● (410,760) ─→ I dokument 3 ● (1130,780)      │
│       ↑                    L2 předprostor akce                │
│ S ● (380,860) → chodník → bannery → registrace → porota     │
│ L4 nábřeží / stromy / lampy       L5 dominantní fasáda      │
└──────────────────────────────────────────────────────────────┘
JIH / bezpečný příchod a okamžitý pohled na budovu
```

Slavia se prostorově čte ve třech pásmech: příchod, organizace/registrace, porota a finální vstup. Stávající dokumentační body fungují jako čitelné organizační stanice na cestě, ne jako hledání pokladu. Stávající Frantova sekvence má vlastní nízkou boční kapsu a nesmí přebít hlavní osu k budově. Expertka/porota a vstup jsou dvě nejvýraznější interakce.

Pokud budoucí vizuální slice zobrazí interiér, použije otevřený cutaway nebo plynule navazující halu v téže scéně, kameře a rendereru. Nevzniká druhá kamera ani paralelní runtime.

### B. Gameplay flow

1. Hráč vstoupí na bezpečný chodník. Dominantní fasáda KD Slavia, bannery „Na Zelené Vlně“ a vstup jsou viditelné okamžitě.
2. Po bannerové ose projde stávající tři dokumentační body, vizuálně pojaté jako pořadatelské/registrující stanice pro Chlum, Nesměň a Besednici.
3. U expertky Evy předloží session podklady. UI pouze zobrazuje stav autoritativní `GameSession`.
4. Stávající Frantova sekvence proběhne v oddělené boční recovery kapse s pohybem a jedinou AKCÍ; nepřidává se nový combat systém.
5. Hráč se vrátí k expertce, obdrží stávající certifikaci a pokračuje ke vstupu.
6. U vstupu/poroty se vyhodnotí nálezy aktuální session. Poslední metry jsou přímá slavnostní osa bez dekorativního slalomu.
7. Výsledková obrazovka nabídne stávající čistý restart. Nevzniká inventář ani uložený postup.

### C. Environment composition

- **Povrchy:** městská dlažba, chodník, schody/rampa, případně nábřežní kámen; uvnitř nebo v cutaway hale teplejší podlaha.
- **Vegetace:** několik pravidelných městských stromů v ostrůvcích; příroda už není dominantní.
- **Architektura:** rozpoznatelná, ale stylizovaná fasáda KD Slavia jako největší landmark; skutečnou podobu je nutné před finálním modelem ověřit, referenční obraz není sám o sobě stavební autoritou.
- **Rekvizity:** bannery, směrovky, lampy, registrační stoly, vitríny, stojany, vystavené kameny, návštěvníci a porotní pult.
- **Výškové vrstvení:** budova na horním/pravém okraji, otevřený předprostor uprostřed, nízké stolky v herním pásmu; stromy nesmí zakrývat dveře.
- **Světlo:** teplejší slavnostní světlo a zelené akcenty proti modrošedému městu; jasný kontrast k přírodním levelům.
- **Atmosféra:** změna z hledání na veřejné zhodnocení cesty; budova a porota jsou cíl, nikoli kulisa.

### D. Asset list

**2D sprites**

- hráč: společný sheet;
- expertka Eva, Franta, pořadatelé, porota a 2–3 varianty návštěvníků;
- registrační potvrzení, certifikační a výsledkový efekt, jemný davový pohyb.

**Low-poly 3D**

- KD Slavia se čitelným vstupem, schody/rampa a dveře;
- banner, směrovka, lampa, registrační stůl, vitrína, stojan;
- porotní pult, vystavené kameny, lavička a městský strom;
- dokumentační/organizační stanice zachovávající stávající objective targety.

**Textury**

- fasáda, střecha, dveře/okna, městská dlažba a nábřežní kámen;
- banner „Na Zelené Vlně“, neutrální stolová plocha a teplá podlaha haly.

### E. Mobile readability check

| Zóna | Desktop | iPhone portrait | iPhone landscape |
|---|---|---|---|
| Příchod | fasáda a bannerová osa jsou viditelné současně | budova tvoří horní cíl; spawn a joystick zůstávají na volné dlažbě | dlouhá fasáda nepřekrývá HUD ani boční cestu |
| Dokumentace/registrace | tři body mají společný vizuální jazyk a různá stanoviště | vždy je viditelná další stanice a dominantní budova | stoly jsou nízké, široké průchody dovolí obejití |
| Frantova kapsa | boční odbočka je čitelná, ale ne silnější než vstup | postavy mají čisté pozadí a dva únikové směry | sekvence proběhne mimo dveře a porotní rekvizity |
| Eva/porota/vstup | poslední osa je bez vizuálního šumu | Eva a dveře nejsou ve stejné siluetě; AKCE zůstává nad safe-area | porota, hráč i cíl se vejdou do jednoho čitelného rámu |

## 7. Práce s dodanými referencemi

Šest dodaných obrazů je moodboard, ne sada runtime assetů:

1. stylizovaný terasový lom je vhodný pro velké čitelné plochy a vrstvení Besednice, ale jeho měřítko se musí zmenšit na kompaktní lokalitu;
2. realistický mokrý lom je reference pro materiál, kaluže a počasí, nikoli pro fotorealistický výstup;
3. lesní výkopy jsou dobrá reference pro kontrast světlé odkryté půdy proti tmavé Nesměni;
4. stylizovaná budova u vody je reference pro noční/večerní slavnostní kontrast a dominantní fasádu; přesnou podobu KD Slavia je nutné ověřit samostatně;
5. realistický Chlum potvrzuje čitelnost mokra, Václava a traktorové trasy, ale výsledná hra musí zůstat méně detailní;
6. stylizovaný Chlum je nejbližší společnému cíli: výrazné brázdy, jednoduché low-poly props, jasné postavy a český horizont.

Reference se v tomto docs slice nekopírují do `assets/**`, nepřidávají do manifestu a nesmějí nahradit ověřené runtime soubory bez samostatného A3 issue.

## 8. Implementační rozpad bez překročení ownership hranic

Dokument nesmí být implementován jedním monolitickým PR. Doporučené pořadí zachovává sekvenci #146:

1. gameplay/data slice pouze tehdy, když je pro stávající objective flow nutný layout/wiring;
2. samostatný A3 asset/composition slice s manifestem a screenshoty;
3. samostatný A4 UI/mobile slice jen pro HUD, safe-area a prezentační adaptéry;
4. A6 read-only vizuální, mobilní, lifecycle a performance gate.

Karel zůstává rival v post-dig konfliktu. Starší návrh udělat z něj briefing/mentor NPC se nesmí implementovat bez nového výslovného rozhodnutí vlastníka. Slavia zachovává objective logiku aktuálního `main`; její vizuální hierarchie však musí být příchod → registrace → porota → výsledek, přičemž existující Frantova recovery sekvence zůstává podřízeným beatem.

## 9. Definition of Done pro každý budoucí vizuální slice

- screenshot bez HUDu jednoznačně identifikuje level;
- 3–5 landmarků je rozeznatelných a hráč dokáže popsat svou polohu;
- aktuální cíl, bezpečná cesta a hazard jsou čitelné na 1280×720, 390×844 a 844×390;
- hráč/NPC/AKCE nejsou zakryti foregroundem, HUDem ani vysokým propem;
- objective a event payloady zůstávají v souladu s architektonickým kontraktem;
- každý nový asset má manifest ID, typ, relativní URL, rozměr, budget, SHA-256 a dispose owner;
- validator, unit testy a relevantní browser smoke/full-flow testy projdou;
- nedojde k přidání inventáře, save systému, persistence, pátého levelu, druhého rendereru, kamery, canvasu, loopu nebo input systému;
- PR popíše dopad na iPhone portrait/landscape, výkon a známá omezení.
