# Kantenmessung, Runde 2: fugenempfindlicher Kantenfinder (erste nicht-Karten-
# Zone >= 2 px = Kante — die Schattenfuge zur ersten Unterkarte zaehlt), robuste
# Geradenfits (Theil-Sen), Winkel-Gegenprobe ueber innenliegende Bandkanten.
import math
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
    blau = b > 140 and b - r > 55
    return hell > 185 or blau


def kante_ab(koeffs, start, richtung, max_weg=380):
    """Erster Beginn einer nicht-Karten-Zone von >= 2 px Laenge."""
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
            elif schritt - fremd_seit >= 1:
                return float(fremd_seit)
    return None


def theil_sen(punkte, senkrecht=False):
    """Robuste Gerade. senkrecht=True: x als Funktion von y fitten."""
    if senkrecht:
        punkte = [(y, x) for x, y in punkte]
    steigungen = []
    n = len(punkte)
    for i in range(n):
        for j in range(i + 1, n):
            dx = punkte[j][0] - punkte[i][0]
            if abs(dx) > 1e-9:
                steigungen.append((punkte[j][1] - punkte[i][1]) / dx)
    steigungen.sort()
    m = steigungen[len(steigungen) // 2]
    achsen = sorted(p[1] - m * p[0] for p in punkte)
    b = achsen[len(achsen) // 2]
    return m, b  # y = m*x+b bzw. x = m*y+b


def schnitt_xy(oben_m, oben_b, seite_m, seite_b):
    """Schnitt von y = oben_m*x+oben_b mit x = seite_m*y+seite_b."""
    x = (seite_m * oben_b + seite_b) / (1 - seite_m * oben_m)
    return (x, oben_m * x + oben_b)


for name, quad in QUADS.items():
    soll = [(0.0, 0.0), (850.0, 0.0), (850.0, 550.0), (0.0, 550.0)]
    koeffs = homographie_koeffs(soll, quad)
    print(f"== {name} ==")

    if name == "vorne":
        oben_scans = [(x, -20) for x in range(200, 701, 50)]
        links_scans = [(250, y) for y in range(0, 321, 40)]
        rechts_seed, rechts_zeilen = 1060, range(-160, 281, 40)
        band_spalten = range(500, 901, 80)  # Brand-Band-Oberkante (innen)
        band_start_y = 150
    else:
        oben_scans = [(x, 100) for x in range(200, 701, 50)]
        links_scans = [(250, y) for y in range(40, 281, 40)]
        rechts_seed, rechts_zeilen = 1040, range(40, 281, 40)
        band_spalten = range(300, 701, 80)  # Webband-Oberkante (innen)
        band_start_y = 250

    # Oberkante: von innen nach oben
    punkte = []
    for sx, sy in oben_scans:
        weg = kante_ab(koeffs, (sx, sy), (0, -1))
        if weg is not None:
            punkte.append((sx, sy - weg))
    m_o, b_o = theil_sen(punkte)
    print(f"  oben: {len(punkte)} Punkte, y = {m_o:.4f}*x + {b_o:.1f}")

    # Linke Kante: von innen nach links
    punkte = []
    for sx, sy in links_scans:
        weg = kante_ab(koeffs, (sx, sy), (-1, 0))
        if weg is not None:
            punkte.append((sx - weg, sy))
    m_l, b_l = theil_sen(punkte, senkrecht=True)
    print(f"  links: {len(punkte)} Punkte, x = {m_l:.4f}*y + {b_l:.1f}")

    # Rechte Kante: Seed evtl. ausserhalb — erst einwaerts auf die Karte,
    # dann von dort nach rechts bis zur ersten Fuge.
    punkte = []
    for sy in rechts_zeilen:
        sx = rechts_seed
        fx, fy = projektion(koeffs, sx, sy)
        schritte = 0
        while not ist_karte(foto_wert(fx, fy)) and schritte < 300:
            sx -= 1
            schritte += 1
            fx, fy = projektion(koeffs, sx, sy)
        if schritte >= 300:
            continue
        sx -= 12  # sicher ins Innere
        weg = kante_ab(koeffs, (sx, sy), (1, 0))
        if weg is not None:
            punkte.append((sx + weg, sy))
    m_r, b_r = theil_sen(punkte, senkrecht=True)
    print(f"  rechts: {len(punkte)} Punkte, x = {m_r:.4f}*y + {b_r:.1f}")
    print(f"    Punkte: {[(round(x), y) for x, y in punkte]}")

    # Winkel-Gegenprobe: Oberkante des blauen Bands (innen, stapelfrei)
    punkte = []
    for sx in band_spalten:
        for schritt in range(400):
            ky = band_start_y + schritt
            fx, fy = projektion(koeffs, sx, ky)
            r, g, b = foto_wert(fx, fy)
            if b > 140 and b - r > 55:
                punkte.append((sx, ky))
                break
    if len(punkte) >= 3:
        m_band, b_band = theil_sen(punkte)
        print(f"  Bandkante (innen): y = {m_band:.4f}*x + {b_band:.1f} "
              f"(Winkel {math.degrees(math.atan(m_band)):.2f} deg; "
              f"Oberkante {math.degrees(math.atan(m_o)):.2f} deg)")

    tl = schnitt_xy(m_o, b_o, m_l, b_l)
    tr = schnitt_xy(m_o, b_o, m_r, b_r)
    breite = math.hypot(tr[0] - tl[0], tr[1] - tl[1])
    ux, uy = (tr[0] - tl[0]) / breite, (tr[1] - tl[1]) / breite
    vx, vy = -uy, ux
    hoehe = breite * 550.0 / 850.0
    bl = (tl[0] + vx * hoehe, tl[1] + vy * hoehe)
    br = (tr[0] + vx * hoehe, tr[1] + vy * hoehe)
    print(f"  Breite {breite:.1f} -> Skala {breite / 850:.3f}; "
          f"TL ({tl[0]:.1f},{tl[1]:.1f}) TR ({tr[0]:.1f},{tr[1]:.1f})")

    foto_quad = [projektion(koeffs, *p) for p in (tl, tr, br, bl)]
    print("  Foto-Quad:", [(round(x, 1), round(y, 1)) for x, y in foto_quad])
