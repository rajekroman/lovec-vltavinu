# Zadání pro ChatGPT — kompletní nové podklady pozadí

Prompt pack pro vygenerování malovaných pozadí (pláten) všech pěti lokalit hry
*Lovec vltavínů*. Prompty jsou připravené ke zkopírování jeden po druhém.

**Postup:** vygeneruješ obrázky → pošleš mi je → já je ořežu a přeškáluju na přesné
herní rozměry, převedu do WebP, ověřím proti stylovému pásmu a zapojím do hry.
Ty se rozměry ani formátem nemusíš zabývat.

---

## 0. Než začneš — tři pravidla, na kterých to stojí

1. **Žádní lidé.** V pozadí nesmí být jediná lidská postava. Postavy vkládá hra
   jako samostatné sprity. Zapečené figury jsou hlavní vada současné Slávie.
2. **Žádný text, cedule ani nápisy.** Generátory je píší zkomoleně.
3. **Malba, ne plochá grafika.** Žádné vektorové plochy, obrysové linky,
   kreslené ikonky ani pastelové odstíny.

**Nastavení obrázku v ChatGPT:** velikost **na šířku (1536 × 1024)**, u všech pěti.
Důležitý obsah drž dál od okrajů — vnějších zhruba 15 % šířky se při zasazení do
hry ořízne.

---

## 1. Společná stylová hlavička

Tenhle odstavec vlož **na začátek každého** z pěti promptů níže:

```
Painted top-down oblique game background for a 2.5D adventure game, in the style
of a realistic digital matte painting. Camera tilted about 60 degrees from
vertical, looking down at the ground; the terrain recedes toward the top edge of
the image. Overcast South Bohemian daylight, soft diffuse light, low contrast,
no harsh cast shadows. Muted earthy palette of ochre, brown, subdued green and
grey, medium-low saturation. Dense painterly surface detail everywhere — soil
texture, stones, grass, puddles. Hand-painted brushwork, visible material
detail, photorealistic lighting.
No people, no figures, no characters. No text, no signs, no lettering.
No flat vector shapes, no outlines, no cartoon style, no pastel colours.
```

---

## 2. Prompty jednotlivých lokalit

### Chlum — pole po dešti

```
[vlož společnou hlavičku]

Scene: a freshly ploughed Czech farm field after heavy rain. Dark brown furrows
running in long curves toward the horizon, filled with shallow puddles
reflecting the grey sky. Wet clods of earth, scattered stones, patches of
trampled grass along the edges. Round straw bales resting on the field. A dirt
track curving through the mud with tractor tyre ruts. In the far distance along
the top edge, a small Czech village with red tiled roofs and a church tower,
half hidden by a line of trees. Autumn, damp, overcast.
```

### Ločenice — holé pole

```
[vlož společnou hlavičku]

Scene: a bare ploughed field with no vegetation, an open flat plain stretching
all the way to a distant horizon. Dark topsoil with loose sandy patches showing
through, small scattered stones, dried tyre ruts crossing the field. Completely
open ground — no bushes, no trees, no crops anywhere in the field itself. Only a
thin distant treeline far away on the horizon. Wide empty sky. Dry, dusty, sunlit
haze in the distance, harder light than the other scenes.
```

### Nesměň — lesní profily

```
[vlož společnou hlavičku]

Scene: a mixed Czech forest floor with sandy subsoil. Tall spruce and birch
trunks, shafts of sunlight falling through the canopy onto narrow dirt paths
winding between the trees. Moss-covered rocks, ferns, fallen branches, drifts of
brown leaves. Several dug pits in the forest floor with heaps of pale excavated
sand piled beside them, clearly the work of moldavite diggers. Deep green,
shadowed, the darkest scene of the set.
```

### Besednice — stará pískovna

```
[vlož společnou hlavičku]

Scene: an abandoned sand and clay quarry. Stepped terraced walls exposing bands
of coloured clay — ochre, rust red, grey and pale yellow strata. Muddy pools of
standing water on the quarry floor, deep vehicle ruts in the sand, loose gravel
and boulders. Young pine saplings and rough grass reclaiming the upper rim.
Weathered, abandoned, quiet.
```

### Slávie — nábřeží před kulturním domem

```
[vlož společnou hlavičku]

Scene: a riverside public square in a Czech town. A calm river running along the
left edge with a stone embankment and iron railing. Worn cobblestone and cracked
asphalt paving across the square, fallen leaves gathered in the joints. Market
stalls with plain fabric awnings standing empty. Mature broadleaf trees, cast
iron lamp posts, a few benches. On the right side, the facade of a large
19th-century cultural house with tall windows and a pitched roof. Late afternoon,
overcast, damp pavement.
```

---

## 3. Když výsledek nesedí

| Problém | Co dopsat do promptu |
|---|---|
| Vypadá jako kreslená ilustrace | `photorealistic painted texture, no illustration style, no flat colour areas` |
| Objevili se lidé | `absolutely no people, no silhouettes, empty scene` |
| Příliš světlé a vybledlé | `darker, richer earth tones, deeper shadows, higher colour saturation` |
| Málo detailu, prázdné plochy | `dense surface detail across the entire ground, no empty areas` |
| Špatný úhel pohledu | `viewed from above at a steep angle, ground plane fills the frame, no sky except at the very top` |
| Nápisy v obraze | `no text of any kind, no signage` |

---

## 4. Kontrola před odesláním

- [ ] V obraze není žádná lidská postava
- [ ] V obraze není žádný text ani cedule
- [ ] Terén ubíhá k hornímu okraji, obloha nejvýš v horní pětině
- [ ] Barvy jsou zemité a tlumené, ne pastelové
- [ ] Povrch má detail po celé ploše, nikde není prázdná plocha
- [ ] Důležitý obsah není u samého okraje (vnějších 15 % se ořízne)

Pošli obrázky v nejvyšší kvalitě, kterou ChatGPT nabídne, jako PNG.
Pojmenování neřeš — přiřadím je podle obsahu.

---

## 5. Co udělám já

1. Ořežu a přeškáluju na přesné herní rozměry (Chlum a Ločenice 1600 × 1200,
   Nesměň 1500 × 1200, Besednice 1680 × 1280, Slávie 1800 × 1100).
2. Změřím jas a sytost a doladím je do pásma, ve kterém drží stávající malby
   (jas 65–100, sytost 0,38–0,50), aby všech pět lokalit působilo jako jeden celek.
3. Převedu do WebP a zapojím do hry — vizuální engine i profily lokalit na
   nová plátna už čekají.
4. Nad hotovými plátny se pak staví level blueprinty podle
   `docs/zadani-claude-design.md`.
