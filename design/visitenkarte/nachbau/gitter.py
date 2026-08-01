# Gitter-Overlay aufs Referenzfoto legen, damit die Karten-Eckpunkte
# pixelgenau abgelesen werden koennen (Vorstufe der Entzerrung).
from pathlib import Path

from PIL import Image, ImageDraw

BASIS = Path(__file__).parent
QUELLE = BASIS.parent / "referenz_socialpro.jpg"

bild = Image.open(QUELLE).convert("RGB")
breite, hoehe = bild.size
print("Bildgroesse:", breite, "x", hoehe)

zeichnung = ImageDraw.Draw(bild)
for x in range(0, breite, 50):
    haupt = x % 200 == 0
    zeichnung.line(
        [(x, 0), (x, hoehe)],
        fill=(255, 40, 40) if haupt else (0, 230, 120),
        width=2 if haupt else 1,
    )
for y in range(0, hoehe, 50):
    haupt = y % 200 == 0
    zeichnung.line(
        [(0, y), (breite, y)],
        fill=(255, 40, 40) if haupt else (0, 230, 120),
        width=2 if haupt else 1,
    )
for x in range(0, breite, 200):
    for y in range(0, hoehe, 200):
        zeichnung.text((x + 4, y + 3), f"{x},{y}", fill=(255, 255, 0))

ziel = BASIS / "gitter.png"
bild.save(ziel)
print("geschrieben:", ziel)
