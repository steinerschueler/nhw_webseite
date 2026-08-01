# Kantenmessung, Runde 3: nur noch die zuverlaessigen Messungen —
# Kartenwinkel aus innenliegenden Bandkanten (stapelfrei), linke Kante
# numerisch mit fugenempfindlichem Abbruch. Oberkante/rechte Kante liest
# danach ein Mensch^W Modell aus Zoom-Fenstern ab.
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
    if not (1 <= xs < BREITE - 1 and 1 <= ys < HOEHE - 1):
        return (0.0, 0.0, 0.0)
    r = g = b = 0
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            w = PIX[xs + dx, ys + dy]
            r += w[0]
            g += w[1]
            b += w[2]
    return r / 9.0, g / 9.0, b / 9.0


def ist_blau(rgb):
    r, g, b = rgb
    return b > 140 and b - r > 55


def theil_sen(punkte, senkrecht=False):
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
    return m, b


for name, quad in QUADS.items():
    soll = [(0.0, 0.0), (850.0, 0.0), (850.0, 550.0), (0.0, 550.0)]
    koeffs = homographie_koeffs(soll, quad)
    print(f"== {name} ==")

    # --- Winkel aus Bandkanten (weiss -> blau von oben) ---
    if name == "vorne":
        band_scans = [(x, 60, 420) for x in range(430, 911, 60)]  # Brand-Band
    else:
        band_scans = [(x, 210, 500) for x in range(250, 751, 60)]  # Webband

    punkte = []
    for sx, sy, ymax in band_scans:
        for ky in range(sy, ymax):
            if ist_blau(foto_wert(*projektion(koeffs, sx, ky))):
                punkte.append((sx, ky))
                break
    m_band, b_band = theil_sen(punkte)
    print(f"  Bandoberkante: {len(punkte)} Punkte, y = {m_band:.4f}*x + {b_band:.1f}"
          f"  (Winkel {math.degrees(math.atan(m_band)):.2f} deg)")
    print(f"    Punkte: {punkte}")

    # --- Linke Kante: weiss -> erste nicht-weisse Zone (>=2 px) ---
    start_x = 30 if name == "vorne" else 110
    zeilen = range(-40, 321, 30) if name == "vorne" else range(40, 301, 30)
    punkte = []
    for sy in zeilen:
        # Startpunkt muss im hellen Karteninneren liegen
        r, g, b = foto_wert(*projektion(koeffs, start_x, sy))
        basis = (r + g + b) / 3
        if basis < 190:
            continue
        schwelle = basis - 30
        fremd_seit = None
        for schritt in range(300):
            kx = start_x - schritt
            r, g, b = foto_wert(*projektion(koeffs, kx, sy))
            if (r + g + b) / 3 >= schwelle:
                fremd_seit = None
            else:
                if fremd_seit is None:
                    fremd_seit = schritt
                elif schritt - fremd_seit >= 1:
                    punkte.append((start_x - fremd_seit, sy))
                    break
        else:
            continue
    m_l, b_l = theil_sen(punkte, senkrecht=True)
    print(f"  links: {len(punkte)} Punkte, x = {m_l:.4f}*y + {b_l:.1f}"
          f"  (Winkel {math.degrees(math.atan(m_l)):.2f} deg)")
    print(f"    Punkte: {[(round(x), y) for x, y in punkte]}")
