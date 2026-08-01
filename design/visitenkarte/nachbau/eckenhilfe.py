# Zwei Ausschnitte (je ein Kartenstapel) 2x vergroessern und mit einem in
# Originalkoordinaten beschrifteten Gitter versehen — zum Ablesen der Ecken.
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASIS = Path(__file__).parent
QUELLE = BASIS.parent / "referenz_socialpro.jpg"
FONT = ImageFont.truetype("arial.ttf", 22)

AUSSCHNITTE = {
    "vorne": (0, 250, 520, 1063),   # linker Stapel (Kontaktseite)
    "hinten": (300, 0, 1000, 700),  # rechter Stapel (Logoseite)
}

bild = Image.open(QUELLE).convert("RGB")

for name, (x0, y0, x1, y1) in AUSSCHNITTE.items():
    teil = bild.crop((x0, y0, x1, y1)).resize(
        ((x1 - x0) * 2, (y1 - y0) * 2), Image.BICUBIC
    )
    z = ImageDraw.Draw(teil)
    for x in range(x0 - x0 % 50, x1, 50):
        haupt = x % 100 == 0
        z.line(
            [((x - x0) * 2, 0), ((x - x0) * 2, teil.height)],
            fill=(255, 40, 40) if haupt else (0, 230, 120),
            width=2 if haupt else 1,
        )
    for y in range(y0 - y0 % 50, y1, 50):
        haupt = y % 100 == 0
        z.line(
            [(0, (y - y0) * 2), (teil.width, (y - y0) * 2)],
            fill=(255, 40, 40) if haupt else (0, 230, 120),
            width=2 if haupt else 1,
        )
    for x in range(x0 - x0 % 100, x1, 100):
        for y in range(y0 - y0 % 100, y1, 100):
            z.text(((x - x0) * 2 + 5, (y - y0) * 2 + 4), f"{x},{y}",
                   fill=(255, 255, 0), font=FONT)
    ziel = BASIS / f"ecken_{name}.png"
    teil.save(ziel)
    print("geschrieben:", ziel, teil.size)
