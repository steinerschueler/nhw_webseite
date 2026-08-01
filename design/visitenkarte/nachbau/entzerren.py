# Kartenflaechen perspektivisch entzerren (Homographie, rein stdlib + PIL).
# Die vier Quellecken je Karte werden auf ein 850x550-Rechteck (85x55 mm bei
# 10 px/mm) mit 50 px Rand abgebildet; ein roter Rahmen markiert die Soll-
# Kartenkante — Abweichungen der weissen Kante vom Rahmen = Eckenfehler.
from pathlib import Path

from PIL import Image, ImageDraw

BASIS = Path(__file__).parent
QUELLE = BASIS.parent / "referenz_socialpro.jpg"

# Quellecken im Originalfoto, Reihenfolge: TL, TR, BR, BL in Lese-Orientierung
# der Karte (TL = oben links, wenn man die Karte normal liest).
QUADS = {
    "vorne": [(300, 274), (456, 716), (236, 920), (86, 494)],
    "hinten": [(510, 8), (924, 124), (810, 576), (416, 392)],
}

RAND = 50
KB, KH = 850, 550  # Kartenflaeche in Ausgabepixeln (10 px/mm)


def loese_gauss(a, b):
    """Loest a*x = b (8x8) mit Teilpivotisierung."""
    n = len(a)
    m = [zeile[:] + [b[i]] for i, zeile in enumerate(a)]
    for s in range(n):
        pivot = max(range(s, n), key=lambda z: abs(m[z][s]))
        m[s], m[pivot] = m[pivot], m[s]
        t = m[s][s]
        m[s] = [w / t for w in m[s]]
        for z in range(n):
            if z != s and m[z][s]:
                f = m[z][s]
                m[z] = [w - f * ws for w, ws in zip(m[z], m[s])]
    return [zeile[n] for zeile in m]


def homographie_koeffs(ziel_ecken, quell_ecken):
    """PIL-PERSPECTIVE-Koeffizienten: Ausgabepunkt -> Quellpunkt."""
    a, b = [], []
    for (zx, zy), (qx, qy) in zip(ziel_ecken, quell_ecken):
        a.append([zx, zy, 1, 0, 0, 0, -qx * zx, -qx * zy])
        b.append(qx)
        a.append([0, 0, 0, zx, zy, 1, -qy * zx, -qy * zy])
        b.append(qy)
    return loese_gauss(a, b)


bild = Image.open(QUELLE).convert("RGB")

for name, quad in QUADS.items():
    ziel_ecken = [
        (RAND, RAND),
        (RAND + KB, RAND),
        (RAND + KB, RAND + KH),
        (RAND, RAND + KH),
    ]
    koeffs = homographie_koeffs(ziel_ecken, quad)
    flach = bild.transform(
        (KB + 2 * RAND, KH + 2 * RAND), Image.PERSPECTIVE, koeffs, Image.BICUBIC
    )
    z = ImageDraw.Draw(flach)
    z.rectangle([RAND, RAND, RAND + KB, RAND + KH], outline=(255, 0, 0), width=2)
    ziel = BASIS / f"entzerrt_{name}.png"
    flach.save(ziel)
    print("geschrieben:", ziel, flach.size)
