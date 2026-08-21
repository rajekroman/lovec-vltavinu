#!/usr/bin/env python3
"""Zpracování podkladu lokality na herní plátno.

Vygenerovaný obrázek se musí dostat na přesné herní rozměry, mít správné měřítko
postavy a barevně sednout ke zbytku hry. Tenhle nástroj dělá všechny tři kroky:

1. ORIENTAČNÍ OŘEZ (--zoom) — generátory vydávají širší záběr, než plátno snese.
   Bez ořezu vyjde postava několikanásobně větší, než má být.
2. PŘESNÉ ROZMĚRY — plátno musí být v pixelech rovno herním hranicím, jinak se
   roztáhne a změkne (aktuální vada Besednice a Slávie).
3. BAREVNÉ SROVNÁNÍ — jas a sytost se srovnají do pásma naměřeného na plátnech,
   která drží kvalitu, aby lokality působily jako jeden celek.

Použití:
    python3 tools/prepare-plate.py --measure obrazek.png
    python3 tools/prepare-plate.py --location chlum --zoom 0.5 obrazek.png
"""

import argparse
import colorsys
import sys
from pathlib import Path

try:
    from PIL import Image, ImageEnhance
except ImportError:
    sys.exit("Chybí Pillow: pip install Pillow")

REPO = Path(__file__).resolve().parent.parent

# Herní hranice lokalit — plátno musí být v pixelech přesně takto velké.
LOCATIONS = {
    "chlum":     {"size": (1600, 1200), "asset": "chlum-plate-v7.webp"},
    "locenice":  {"size": (1600, 1200), "asset": "locenice-plate-v7.webp"},
    "nesmen":    {"size": (1500, 1200), "asset": "nesmen-forest-plate-v7.webp"},
    "besednice": {"size": (1680, 1280), "asset": "besednice-clay-quarry-v7.webp"},
    "slavia":    {"size": (1800, 1100), "asset": "slavia-event-plate-v7.webp"},
}

# Pásmo naměřené na Chlumu, Nesměni a Besednici — plátnech, která drží kvalitu.
TARGET_LUMA = (65.0, 100.0)
# Horní mez je nad Chlumem (0,50), aby referenční plátno samo prošlo.
TARGET_SATURATION = (0.38, 0.52)

# Nad tuto velikost se měří na zmenšenině; měření je statistické, detail nehraje roli.
SAMPLE_SIZE = 200


def measure(image):
    """Průměrný jas (0-255) a sytost (0-1)."""
    sample = image.convert("RGB").resize((SAMPLE_SIZE, SAMPLE_SIZE))
    # Obě metody vracejí řadu n-tic RGB; getdata je v Pillow 14 na odpis.
    source = sample.get_flattened_data if hasattr(sample, "get_flattened_data") else sample.getdata
    pixels = list(source())
    luma = sum(0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in pixels) / len(pixels)
    saturation = sum(colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[1] for r, g, b in pixels) / len(pixels)
    return luma, saturation


def center_crop(image, zoom):
    """Ořez ke středu. zoom=0.5 znamená polovinu šířky i výšky, tedy dvojnásobné měřítko."""
    if zoom >= 1:
        return image
    width, height = image.size
    new_width, new_height = int(width * zoom), int(height * zoom)
    left = (width - new_width) // 2
    top = (height - new_height) // 2
    return image.crop((left, top, left + new_width, top + new_height))


def fit_to_bounds(image, target):
    """Doplní na cílový poměr ořezem (nikdy roztažením) a přeškáluje na přesné rozměry."""
    target_width, target_height = target
    target_ratio = target_width / target_height
    width, height = image.size
    ratio = width / height

    if ratio > target_ratio:
        keep = int(height * target_ratio)
        left = (width - keep) // 2
        image = image.crop((left, 0, left + keep, height))
    elif ratio < target_ratio:
        keep = int(width / target_ratio)
        top = (height - keep) // 2
        image = image.crop((0, top, width, top + keep))

    return image.resize(target, Image.LANCZOS)


def grade(image):
    """Srovná jas a sytost do cílového pásma. Vrací (obrázek, popis zásahu)."""
    luma, saturation = measure(image)
    notes = []

    target_luma = min(max(luma, TARGET_LUMA[0]), TARGET_LUMA[1])
    if abs(target_luma - luma) > 0.5 and luma > 0:
        factor = target_luma / luma
        image = ImageEnhance.Brightness(image).enhance(factor)
        notes.append(f"jas x{factor:.2f}")

    # Zesílení sytosti není lineární vůči naměřené hodnotě, takže jeden průchod
    # cíl podstřelí. Dotahuje se po krocích, dokud se hodnota netrefí do pásma.
    total = 1.0
    for _ in range(6):
        _, saturation = measure(image)
        if TARGET_SATURATION[0] <= saturation <= TARGET_SATURATION[1] or saturation <= 0:
            break
        target_saturation = min(max(saturation, TARGET_SATURATION[0]), TARGET_SATURATION[1])
        factor = target_saturation / saturation
        image = ImageEnhance.Color(image).enhance(factor)
        total *= factor
    if abs(total - 1.0) > 0.01:
        notes.append(f"sytost x{total:.2f}")

    return image, notes


def report(label, image):
    luma, saturation = measure(image)
    luma_ok = "ok " if TARGET_LUMA[0] <= luma <= TARGET_LUMA[1] else "MIMO"
    saturation_ok = "ok " if TARGET_SATURATION[0] <= saturation <= TARGET_SATURATION[1] else "MIMO"
    print(f"  {label:10} {image.size[0]}x{image.size[1]}  "
          f"jas {luma:5.1f} [{luma_ok}]  sytost {saturation:.2f} [{saturation_ok}]")


def main():
    parser = argparse.ArgumentParser(description="Zpracuje podklad na herní plátno lokality.")
    parser.add_argument("source", help="vstupní obrázek")
    parser.add_argument("--location", choices=sorted(LOCATIONS), help="cílová lokalita")
    parser.add_argument("--zoom", type=float, default=1.0,
                        help="ořez ke středu pro srovnání měřítka; 0.5 = dvojnásobné měřítko")
    parser.add_argument("--measure", action="store_true", help="jen změřit, nic nezapisovat")
    parser.add_argument("--no-grade", action="store_true", help="vynechat barevné srovnání")
    parser.add_argument("--out", help="cílový soubor (jinak podle lokality)")
    args = parser.parse_args()

    source = Path(args.source)
    if not source.exists():
        sys.exit(f"Vstup neexistuje: {source}")

    image = Image.open(source).convert("RGB")
    print(f"\n{source.name}")
    report("vstup", image)

    if args.measure:
        return

    if not args.location:
        sys.exit("Bez --measure je potřeba --location.")

    location = LOCATIONS[args.location]

    if args.zoom < 1:
        image = center_crop(image, args.zoom)
        report(f"ořez {args.zoom}", image)

    image = fit_to_bounds(image, location["size"])
    report("rozměry", image)

    if not args.no_grade:
        image, notes = grade(image)
        report("srovnáno", image)
        if notes:
            print(f"  {'':10} zásah: {', '.join(notes)}")

    destination = Path(args.out) if args.out else REPO / "assets" / "textures" / "terrain" / location["asset"]
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=90, method=6)
    size_kb = destination.stat().st_size / 1024
    try:
        shown = destination.relative_to(REPO)
    except ValueError:
        shown = destination
    print(f"  -> {shown}  {size_kb:.0f} kB\n")


if __name__ == "__main__":
    main()
