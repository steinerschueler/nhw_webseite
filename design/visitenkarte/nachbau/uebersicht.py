# Uebersicht im (grob) entzerrten Kartenraum mit Koordinatengitter: darin die
# wahren Kartenecken ablesen; ruecktransformieren uebernimmt ecken_mappen.py.
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from entzerren import QUADS, homographie_koeffs

BASIS = Path(__file__).parent
QUELLE = BASIS.parent / "referenz_socialpro.jpg"
FONT = ImageFont.truetype("arial.ttf", 14)

# Sichtfenster im Kartenraum (Kartenecken-Soll: (0,0)..(850,550))
X0, Y0, X1, Y1 = -150, -160, 1000, 972
SKALA = 0.939  # Ausgabe ~1080x1063 — die Groesse zeigt Read erfahrungsgemaess 1:1

bild = Image.open(QUELLE).convert("RGB")

for name, quad in QUADS.items():
    soll = [(0, 0), (850, 0), (850, 550), (0, 550)]
    ziel_ecken = [((x - X0) * SKALA, (y - Y0) * SKALA) for x, y in soll]
    koeffs = homographie_koeffs(ziel_ecken, quad)
    groesse = (int((X1 - X0) * SKALA), int((Y1 - Y0) * SKALA))
    flach = bild.transform(groesse, Image.PERSPECTIVE, koeffs, Image.BICUBIC)
    z = ImageDraw.Draw(flach)
    for x in range(X0, X1 + 1, 100):
        haupt = x % 500 == 0
        z.line(
            [((x - X0) * SKALA, 0), ((x - X0) * SKALA, groesse[1])],
            fill=(255, 40, 40) if haupt else (0, 230, 120),
            width=2 if haupt else 1,
        )
    for y in range(Y0, Y1 + 1, 100):
        haupt = y % 500 == 0
        z.line(
            [(0, (y - Y0) * SKALA), (groesse[0], (y - Y0) * SKALA)],
            fill=(255, 40, 40) if haupt else (0, 230, 120),
            width=2 if haupt else 1,
        )
    for x in range(X0, X1 + 1, 200):
        for y in range(Y0, Y1 + 1, 200):
            z.text(((x - X0) * SKALA + 3, (y - Y0) * SKALA + 2),
                   f"{x},{y}", fill=(255, 255, 0), font=FONT)
    ziel = BASIS / f"uebersicht_{name}.png"
    flach.save(ziel)
    print("geschrieben:", ziel, groesse)
