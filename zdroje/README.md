# Zdroje projektu

Tato složka obsahuje editovatelné a archivní podklady, které se nepoužívají
přímo při běhu hry. Produkční soubory načítané prohlížečem zůstávají v
`public/assets/`.

## Struktura

```text
zdroje/
└── grafika/
    └── sprity/
        └── postavy/
            ├── hrdina-chuze-zdroj.png
            ├── hrdina-kopani-zdroj.png
            ├── karel-chuze-zdroj.png
            ├── lesnik-staticky-zdroj.png
            ├── strazce-naleziste-zdroj.png
            ├── rival-karel-zdroj.png
            ├── franta-zdroj.png
            └── expertka-vystavy-zdroj.png
    └── vozidla/
        └── traktor-chlum-zdroj.png
    └── predmety/
        └── vltaviny/
            ├── vltavin-a-zdroj.png
            ├── vltavin-b-zdroj.png
            └── vltavin-c-zdroj.png
```

- `hrdina-chuze-zdroj.png` – transparentní zdroj čtyřsměrné chůze hrdiny;
- `hrdina-kopani-zdroj.png` – archivní chroma-key zdroj čtyřsměrného kopacího atlasu;
- `karel-chuze-zdroj.png` – transparentní zdroj čtyřsměrné chůze majitele pole;
- `lesnik-staticky-zdroj.png` – archivní chroma-key zdroj statického lesníka;
  produkční alfa atlas je po odstranění pozadí v `public/assets/`.
- `strazce-naleziste-zdroj.png` – zdroj 4 × 4 atlasu strážce pro Besednici;
- `rival-karel-zdroj.png` – zdroj 4 × 4 atlasu konkurenčního hledače;
- `franta-zdroj.png` – zdroj 4 × 4 atlasu finálního zloděje Franty.
- `expertka-vystavy-zdroj.png` – chroma-key zdroj 4 × 4 atlasu expertky výstavy;
  produkční alfa atlas je `public/assets/sprites/expert-walk-atlas.png`.
- `traktor-chlum-zdroj.png` – archivní chroma-key zdroj traktoru s viditelným
  řidičem pro pohyblivý hazard v Chlumu.
- `vltavin-a-zdroj.png`, `vltavin-b-zdroj.png`, `vltavin-c-zdroj.png` –
  archivní zdroje tří kvalitativních variant odměny po kopání.

Archivní zdroje mají rozměr přibližně 1254 × 1254 px. Produkční atlasy byly doplněny
transparentním okrajem na 1256 × 1256 px, aby každá ze čtyř buněk v řádku a
sloupci měla přesně 314 px.

Low-poly 3D modely Milestone 09 jsou reprodukovatelné ze zdrojového skriptu
`scripts/generate-glb-assets.mjs`; jejich produkční výstupy jsou v
`public/assets/models/` a do hry se načítají přes `public/assets/manifest.json`.
