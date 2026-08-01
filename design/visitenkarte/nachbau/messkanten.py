# Kartenkanten numerisch abtasten (im Runde-1-Kartenraum) und daraus die
# wahren Foto-Eckpunkte bestimmen. Drei Kanten werden gemessen (oben, links,
# rechts); die Unterkante folgt aus dem Seitenverhaeltnis 850:550 — sie ist
# wegen Schwarzanteilen/Stapelkanten nicht sauber messbar.
from pathlib import Path

from PIL import Image

from entzerren import QUADS, homographie_koeffs

BASIS = Path(__file__).parent
QUELLE = BASIS.parent / "referenz_socialpro.jpg"

bild = Image.open(QUELLE).convert("RGB")
PIX = bild.load()
BREITE, HOEHE = bild.size


def projektion(koeffs, x, y):
    a, b, c, d, e, f, g, h = koeffs
    n = g * x + h * y + 1.0
    return (a * x + b * y + c) / n, (d * x + e * y + f) / n


def foto_wert(x, y):
    """3x3-Mittelwert im Foto (RGB)."""
    xs, ys = int(round(x)), int(round(y))
    r = g = b = n = 0
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            px, py = xs + dx, ys + dy
            if 0 <= px < BREITE and 0 <= py < HOEHE:
                w = PIX[px, py]
                r += w[0]
                g += w[1]
                b += w[2]
                n += 1
    return r / n, g / n, b / n


def ist_karte(rgb):
    r, g, b = rgb
    hell = (r + g + b) / 3
    blau = b > 140 and b - r > 60
    return hell > 175 or blau


def kante_suchen(koeffs, start, richtung, max_weg=420):
    """Vom Kartel-Inneren aus in `richtung` laufen; Position des Beginns der
    ersten anhaltend kartenfremden Zone (>=6 px) zurueckgeben, in Kartenpx."""
    sx, sy = start
    dx, dy = richtung
    fremd_seit = None
    for schritt in range(max_weg):
        kx, ky = sx + dx * schritt, sy + dy * schritt
        fx, fy = projektion(koeffs, kx, ky)
        if ist_karte(foto_wert(fx, fy)):
            fremd_seit = None
        else:
            if fremd_seit is None:
                fremd_seit = schritt
            if schritt - fremd_seit >= 6:
                return fremd_seit
    return None


def gerade_aus_punkten(punkte):
    """Least-Squares-Gerade durch Punkte, als (px, py, rx, ry): Punkt+Richtung."""
    n = len(punkte)
    mx = sum(p[0] for p in punkte) / n
    my = sum(p[1] for p in punkte) / n
    sxx = sum((p[0] - mx) ** 2 for p in punkte)
    sxy = sum((p[0] - mx) * (p[1] - my) for p in punkte)
    syy = sum((p[1] - my) ** 2 for p in punkte)
    # Hauptrichtung (groesster Eigenvektor der 2x2-Kovarianz)
    import math

    winkel = 0.5 * math.atan2(2 * sxy, sxx - syy)
    return (mx, my, math.cos(winkel), math.sin(winkel))


def schnittpunkt(g1, g2):
    (p1x, p1y, r1x, r1y), (p2x, p2y, r2x, r2y) = g1, g2
    det = r1x * (-r2y) - (-r2x) * r1y
    t = ((p2x - p1x) * (-r2y) + r2x * (p2y - p1y)) / det
    return (p1x + t * r1x, p1y + t * r1y)


SCANS = {
    "vorne": {
        "oben": [((x, 60), (0, -1)) for x in (250, 450, 650)],
        "links": [((250, y), (-1, 0)) for y in (60, 200, 340)],
        "rechts": [((750, y), (1, 0)) for y in (0, 120, 240)],
    },
    "hinten": {
        "oben": [((x, 100), (0, -1)) for x in (200, 450, 700)],
        "links": [((250, y), (-1, 0)) for y in (80, 200, 320)],
        "rechts": [((650, y), (1, 0)) for y in (80, 200, 320)],
    },
}

for name, quad in QUADS.items():
    soll = [(0.0, 0.0), (850.0, 0.0), (850.0, 550.0), (0.0, 550.0)]
    koeffs = homographie_koeffs(soll, quad)  # Kartenraum -> Foto
    geraden = {}
    print(f"== {name} ==")
    for kante, scans in SCANS[name].items():
        punkte = []
        for (sx, sy), (dx, dy) in scans:
            weg = kante_suchen(koeffs, (sx, sy), (dx, dy))
            if weg is None:
                print(f"  {kante}: Scan ab ({sx},{sy}) fand keine Kante!")
                continue
            punkte.append((sx + dx * weg, sy + dy * weg))
        print(f"  {kante}: Punkte {[(round(px, 1), round(py, 1)) for px, py in punkte]}")
        geraden[kante] = gerade_aus_punkten(punkte)

    tl = schnittpunkt(geraden["oben"], geraden["links"])
    tr = schnittpunkt(geraden["oben"], geraden["rechts"])
    import math

    ux, uy = tr[0] - tl[0], tr[1] - tl[1]
    breite = math.hypot(ux, uy)
    ux, uy = ux / breite, uy / breite
    vx, vy = -uy, ux  # senkrecht, nach unten
    hoehe = breite * 550.0 / 850.0
    bl = (tl[0] + vx * hoehe, tl[1] + vy * hoehe)
    br = (tr[0] + vx * hoehe, tr[1] + vy * hoehe)
    print(f"  Rechteck: Breite {breite:.1f} (Hoehe {hoehe:.1f}), "
          f"TL {tuple(round(v, 1) for v in tl)} TR {tuple(round(v, 1) for v in tr)}")

    foto_quad = [projektion(koeffs, *p) for p in (tl, tr, br, bl)]
    print("  Foto-Quad:", [(round(x, 1), round(y, 1)) for x, y in foto_quad])
