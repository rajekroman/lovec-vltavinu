# Lovec vltavínů 3D – Cesta na Zelenou vlnu

Kompletní low-poly 3D browserová hra zasazená do stylizovaného světa jihočeských vltavínů.

## Obsah hry

Hra má šest samostatných průchozích kapitol:

1. **Chlum nad Malší** – povolení majitele, povrchový sběr po dešti a traktor.
2. **Ločenice** – určování pravých vltavínů a skleněných napodobenin.
3. **Nesměň** – čtyři dokumentované profily, policejní hlídka a zasypávání jam.
4. **Besednice** – noční lokalita, indicie, ježkovitý vltavín a boss Krystalový Karel.
5. **Nábřeží Malše** – hledání ztracené dokumentace, doprava, policie a boss Feták Franta.
6. **Kulturní dům Slávie** – registrace na akci Na Zelené Vlně a výběr pěti kamenů pro porotu.

## Herní systémy

- low-poly 3D grafika v Three.js
- šest procedurálně sestavených map
- dotykový joystick pro iPhone
- klávesnice: WASD/šipky, mezerník, Shift a P
- questy, NPC dialogy a různé podmínky dokončení
- policie, zemědělci, noční kopáči, doprava a dva bossové
- kopání profilů, zasypávání jam a systém pověsti
- určovací minihra vltavín versus sklo
- inventář jednotlivých kamenů s lokalitou, hmotností, kvalitou, hodnotou a dokumentací
- tábor mezi lokacemi, prodej slabých kamenů a čtyři druhy vylepšení
- ukládání průchodu do localStorage
- místní Top 10 rekordů
- finální volba pěti kamenů a několik možných konců
- sedm skutečných 8bitových hudebních WAV stop
- dvanáct samostatných 8bitových zvukových efektů
- PWA režim, ikona na plochu, fullscreen a offline cache po prvním načtení

## Spuštění

Hru je nutné otevřít přes HTTP nebo HTTPS, nikoli jako soubor v Rychlém náhledu iOS.

Lokální test:

```bash
python3 -m http.server 8000
```

Potom otevřít:

```text
http://localhost:8000
```

GitHub Pages:

```text
https://rajekroman.github.io/lovec-vltavinu/
```

Na iPhonu otevřít adresu v Safari a zvolit **Sdílet → Přidat na plochu**.

## Technické poznámky

Grafické modely se skládají za běhu z jednoduchých 3D geometrií. Balíček proto nepotřebuje velké GLB modely ani textury. Hudba a efekty jsou skutečné lokální osmibitové WAV soubory. Three.js je uložený přímo ve složce `vendor`, takže hra po instalaci nevyžaduje externí CDN.
