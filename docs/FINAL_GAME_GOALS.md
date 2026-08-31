# Lovec vltavínů — finální produktový a gameplay kontrakt

Stav: autoritativní cílový návrh pro větev `final-gameplay-synthesis`.

## Zásadní pravidlo zdrojů

Nahraná první verze hry slouží pouze jako **game-design reference**. Z jejího kódu, runtime architektury ani implementačních detailů se nic nekopíruje. Použitelné nápady se implementují znovu v aktuálním projektu.

Aktuální GitHub projekt je technický základ. Produktové zadání vlastníka má přednost před historickými gameplay cíli, které mu odporují.

## Hlavní cíl

Vytvořit krátkou, jednoduchou, vizuálně kvalitní 3D hru o hledání vltavínů s jasným průchodem:

**Chlum → Nesměň → Besednice → KD Slavia / Na zelené vlně**

Finálním cílem je přijet na vltavínovou akci **Na zelené vlně** a vybrat **5 nejlepších nalezených vltavínů na výstavu**.

Hra nemá být RPG, survival ani komplexní simulátor. Každá lokalita má jednu srozumitelnou hlavní mechaniku a vlastní atmosféru.

## Společný ovládací princip

- pohyb postavy;
- jedno kontextové akční tlačítko;
- když není poblíž přímá interakce, tlačítko může fungovat jako **RADAR / ROZHLÉDNUTÍ**;
- minimum menu, minimum dlouhých textů;
- okamžitá vizuální a zvuková odezva na každou významnou akci.

---

## 1. CHLUM — povrchový sběr a rozpoznání

### Prostředí

Pole v oblasti Chlumu, kvalitní herní prostředí s ornou půdou, brázdami, polní cestou, vegetací a vzdáleným lesem.

### Radar

Akční tlačítko aktivuje krátký vizuální kužel před hráčem podobný světlu baterky. Nejde o elektronický přístroj, ale o herní vyjádření soustředěného rozhlédnutí po zemi.

Radar:

1. krátce prohledá prostor před postavou;
2. při zásahu kandidátního místa zobrazí diskrétní červený marker;
3. hráč musí k markeru dojít;
4. teprve potom předmět sebere.

### Obsah mapy

Na Chlumu je celkem **6 kandidátních nálezů**:

- **4 skutečné vltavíny**;
- **2 falešné nálezy**.

Po sebrání kandidáta se zobrazí jen:

- vizuál nálezu;
- název;
- několik slov popisu.

Například: `Olivově zelený · matný · nepravidelný povrch`.

Hráč zvolí pouze:

- **VLTAVÍN**
- **NENÍ VLTAVÍN**

Žádná další identifikační minihra ani dlouhý geologický text.

### Dokončení

Hráč musí opustit Chlum se **3 správně určenými skutečnými vltavíny**.

Čtvrtý pravý kus a oba falešné kusy vytvářejí lehkou volbu a nejistotu; není nutné vyčistit celou mapu.

---

## 2. NESMĚŇ — hledání, přesné kopání a obnova terénu

### Prostředí

Lesní naleziště s členitým terénem, kořeny, starými výkopy, písčitou/hlinitou půdou, kameny a hustší vegetací.

### Hledání

Hráč pomocí stejného principu radaru / rozhlédnutí objeví tři místa vhodná ke kopání.

### Kopací minihra

Každý výkop používá krátkou timing minihru:

- ukazatel se pohybuje po stupnici;
- existuje úzká cílová zóna;
- hráč musí stisknout akční tlačítko ve správném okamžiku;
- pro dokončení výkopu jsou potřeba **3 úspěšné zásahy**;
- chybný zásah pouze nezapočítá pokus, nezpůsobuje game over.

Tři úspěchy reprezentují postupné odkopání vrstev půdy.

### Tři profily

Hráč vykopá přesně **3 díry / profily** a získá z nich **3 unikátní vltavíny**.

### Povinné zahrnutí

Po každém výkopu zůstane otevřená díra.

Hráč ji musí kontextovou akcí **ZAHRNOUT / ZAHRABAT**.

Dokud není zahrnuto **3/3**, nelze pokračovat do Besednice.

Toto je závazná charakteristická mechanika levelu.

---

## 3. BESEDNICE — stopy, ježek a zloděj

### Prostředí

Stará terasovitá pískovna s výraznými výškovými rozdíly, odkrytými vrstvami, pískovými stěnami, stopami staré těžby a prorůstající vegetací.

### Průzkum

Hráč nejprve objeví **3 stopy** vedoucí k ježkové vrstvě.

Tyto tři stopy mohou současně představovat tři menší unikátní nálezy / indicie, aby předchozí struktura druhé verze zůstala smysluplná.

Po objevení všech tří stop se odemkne hlavní ježkový profil.

### Velký ježatý vltavín

Hlavní profil používá stejný jednoduchý třízásahový princip kopání.

Výsledkem je **velký ježatý besednický vltavín**, jednoznačně mimořádný kus a vizuální vrchol lovecké části hry.

Besednice tak může dodat celkem **4 unikátní nálezy**: tři menší nálezy/stopy + ježek.

### Zloděj

Po získání ježka se aktivuje krátká scripted událost se zlodějem, který je zjevně pod vlivem drog a pokusí se vltavín ukrást.

Nevytvářet plnohodnotný bojový systém.

Konflikt má být krátký a jednoduchý, například:

- pronásledování;
- několikeré přiblížení / zachycení;
- jednoduché vyhýbání;
- krátká environmentální nebo timing sekvence.

Cíl: získat ježka zpět a pokračovat do Slavie.

---

## 4. KD SLAVIA — Na zelené vlně

### Smysl levelu

Slavia je finále, nikoli čtvrté naleziště.

Po třech přírodních lokalitách se tempo mění. Hráč přichází na vltavínovou akci **Na zelené vlně**.

### Co zde nedělat

Finální flow nemá být zbytečně zatížené dalšími vedlejšími questy, dalším zlodějem ani opakováním loveckých mechanik jen proto, aby byl level delší.

Historické mechaniky typu sbírání dokumentů, druhá krádež před Slavií nebo jiné nadbytečné úkoly nejsou součástí závazného cíle, pokud neprokážou jasný přínos pro finální tempo hry.

### Výstava

Hráč prohlédne svou kolekci ze tří předchozích lokalit a musí vybrat **přesně 5 kusů na výstavu**.

Při současném cílovém průchodu lze zachovat celkem **10 unikátních nálezů**:

- Chlum: 3;
- Nesměň: 3;
- Besednice: 4.

Slavia přijme **5 z 10**.

### Hodnocení

Každý vltavín zachovává stabilní:

- `findingId`;
- lokalitu;
- raritu;
- hmotnost;
- skóre / kvalitu.

Finální hodnocení pracuje pouze s vybranými pěti kusy a zobrazí stručný, uspokojivý výsledek poroty / výstavy.

---

## Core loop

### Chlum

**RADAR → MARKER → SEBRAT → KRÁTKÝ POPIS → PRAVÝ / NEPRAVÝ → ODNÉST 3**

### Nesměň

**RADAR → MÍSTO → 3× PŘESNÝ ZÁSAH → NÁLEZ → ZAHRNOUT → 3 PROFILY**

### Besednice

**3 STOPY → JEŽKOVÝ PROFIL → 3× ZÁSAH → JEŽEK → KRÁDEŽ → ZÍSKAT ZPĚT**

### Slavia

**PŘÍJEZD NA AKCI → PROHLÉDNOUT KOLEKCI → VYBRAT 5 Z 10 → HODNOCENÍ**

---

## Co přebíráme jako nápad z první verze

Pouze designové principy, nikoli kód:

- jedno akční tlačítko měnící význam podle kontextu;
- rozhlédnutí/radar jako aktivní hledání;
- timing kopání na tři zásahy;
- otevřená díra jako stav, který musí hráč napravit;
- krátký konflikt o mimořádný ježek;
- rychlé a čitelné interakce bez komplikovaných menu.

## Co z první verze nepřebíráme

- její JavaScript / Canvas kód;
- její save systém;
- perk/upgradovací systém;
- combo systém;
- Ločenice jako samostatný level;
- obecný heat/lives systém;
- opakované boss souboje;
- druhého zloděje před Slavií;
- mechaniky, které pouze prodlužují hru bez jasného přínosu.

## Implementační priorita

1. zachovat současný technický základ druhé verze;
2. sjednotit gameplay podle tohoto kontraktu;
3. nejdříve upravit Chlum a Slavia, protože Nesměň a Besednice už velkou část cílových mechanik obsahují;
4. nepřepisovat fungující Nesměň ani Besednici bez důvodu;
5. grafiku, postavy a levely dále stavět ve vysoké produkční kvalitě, ne jako dočasné placeholdery;
6. rozsáhlé QA a release evidence provést až po dokončení hlavní herní a vizuální kostry; během stavby udržovat pouze nezbytné smoke/regresní testy dotčených kontraktů.

## Definition of Done gameplay kostry

Hlavní kostra je hotová, když nový hráč bez konzole a zásahu do URL:

1. na Chlumu najde kandidáty radarem, správně určí a odnese 3 pravé vltavíny;
2. v Nesměni vykopá 3 profily timing minihrou a všechny 3 zahrne;
3. v Besednici najde 3 stopy, vykope ježka a získá jej zpět od zloděje;
4. vstoupí na akci Na zelené vlně v KD Slavia;
5. z celkem 10 unikátních nálezů vybere přesně 5;
6. dostane finální hodnocení a může čistě ukončit / restartovat průchod.
