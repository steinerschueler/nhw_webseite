# Gezoomte Fenster um die vier Kartenkanten (im Rund-1-Kartenraum), Gitter alle
# 100 Kartenpixel mit Beschriftung — zum Ablesen der wahren Kantenlage.
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from entzerren import QUADS, homographie_koeffs

BASIS = Path(__file__).parent
QUELLE = BASIS.parent / "referenz_socialpro.jpg"
FONT = ImageFont.truetype("arial.ttf", 20)

# Fenster je Karte: (kürzel, x0, y0, x1, y1) im Kartenraum der Runde 1.
# Die Karte liegt dort grob bei x -30..1010, y -90..470 (aus der Übersicht).
FENSTER = {
    "vorne": [
        ("oben", 150, -260, 750, 40),
        ("unten", 150, 280, 750, 580),
        ("links", -240, -60, 160, 500),
        ("rechts", 760, -160, 1160, 400),
    ],
    "hinten": [
        ("oben", 150, -260, 750, 40),
        ("unten", 150, 280, 750, 580),
        ("links", -240, -60, 160, 500),
        ("rechts", 760, -160, 1160, 400),
    ],
}

bild = Image.open(QUELLE).convert("RGB")

for name, quad in QUADS.items():
    soll = [(0, 0), (850, 0), (850, 550), (0, 550)]
    for kurz, x0, y0, x1, y1 in FENSTER[name]:
        skala = 1080.0 / (x1 - x0)
        ziel_ecken = [((x - x0) * skala, (y - y0) * skala) for x, y in soll]
        koeffs = homographie_koeffs(ziel_ecken, quad)
        groesse = (int((x1 - x0) * skala), int((y1 - y0) * skala))
        flach = bild.transform(groesse, Image.PERSPECTIVE, koeffs, Image.BICUBIC)
        z = ImageDraw.Draw(flach)
        for x in range(x0 - x0 % 100, x1 + 1, 100):
            z.line([((x - x0) * skala, 0), ((x - x0) * skala, groesse[1])],
                   fill=(255, 40, 40), width=1)
        for y in range(y0 - y0 % 100, y1 + 1, 100):
            z.line([(0, (y - y0) * skala), (groesse[0], (y - y0) * skala)],
                   fill=(255, 40, 40), width=1)
        for x in range(x0 - x0 % 100, x1 + 1, 100):
            for y in range(y0 - y0 % 100, y1 + 1, 100):
                z.text(((x - x0) * skala + 4, (y - y0) * skala + 3),
                       f"{x},{y}", fill=(255, 255, 0), font=FONT)
        ziel = BASIS / f"kante_{name}_{kurz}.png"
        flach.save(ziel)
        print("geschrieben:", ziel, groesse)
