# Detailvermessung: Falz/Balken/Oeffnung, Textboxen, QR, Eckenradius,
# Wortmarken-Aspekt (fuer die Hinten-Kalibrierung) und Farbwahrheit aus dem
# Mockup-Render. Alles numerisch, Interpretation folgt im Gespraech.
from pathlib import Path

from PIL import Image

BASIS = Path(__file__).parent


def hell(rgb):
    return sum(rgb) / 3


def ist_blau(rgb):
    r, g, b = rgb
    return b > 120 and b - r > 45


def blau_laeufe(pix, y, x0, x1):
    laeufe, start = [], None
    for x in range(x0, x1):
        if ist_blau(pix[x, y]):
            if start is None:
                start = x
        else:
            if start is not None:
                laeufe.append((start, x - 1))
                start = None
    if start is not None:
        laeufe.append((start, x1 - 1))
    return laeufe


def dunkel_laeufe(pix, y, x0, x1, schwelle=90):
    laeufe, start = [], None
    for x in range(x0, x1):
        if hell(pix[x, y]) < schwelle:
            if start is None:
                start = x
        else:
            if start is not None:
                laeufe.append((start, x - 1))
                start = None
    if start is not None:
        laeufe.append((start, x1 - 1))
    return laeufe


def bbox(pix, x0, x1, y0, y1, test):
    xs, ys = [], []
    for x in range(x0, x1):
        for y in range(y0, y1):
            if test(pix[x, y]):
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return min(xs), max(xs), min(ys), max(ys)


mv = Image.open(BASIS / "master_vorne.png")
pv = mv.load()
print("===== vorne (Master, kalibriert) =====")

print("-- Eckenradius: erste helle Zeile in Spalte 0/849 --")
for spalte in (0, 849):
    for y in range(0, 80):
        if hell(pv[spalte, y]) > 180:
            print(f"  Spalte {spalte}: hell ab y={y}")
            break

print("-- Fugenprofil Band (x=125): y, Farbe alle 3 px --")
for y in range(325, 412, 3):
    r, g, b = pv[125, y]
    print(f"  y={y}: #{r:02x}{g:02x}{b:02x}")

print("-- Oeffnung/Notch: Dunkel-Laeufe je Zeile (x 350..700) --")
for y in range(332, 470, 8):
    print(f"  y={y}: {dunkel_laeufe(pv, y, 350, 700)}")

print("-- Blau-Laeufe je Zeile (ganze Breite) --")
for y in range(332, 412, 8):
    print(f"  y={y}: {blau_laeufe(pv, y, 0, 850)}")

print("-- QR-Bbox (dunkel<120, x 600..850, y 30..250) --")
print("  ", bbox(pv, 600, 850, 30, 250, lambda c: hell(c) < 120))

print("-- Kontakttext: Dunkelpixel-Zeilenprofil x 140..560 --")
zeilen = []
for y in range(30, 320):
    n = sum(1 for x in range(140, 560) if hell(pv[x, y]) < 130)
    if n > 3:
        zeilen.append((y, n))
druck = []
letzte = None
for y, n in zeilen:
    if letzte is None or y > letzte + 1:
        druck.append([y, y])
    else:
        druck[-1][1] = y
    letzte = y
print("  Textzeilen (y-Bereiche):", druck)

print("-- Kontakttext links: kleinstes x mit Dunkelpixel je Zeilenblock --")
for y0, y1 in druck:
    xs = [x for x in range(120, 560)
          if any(hell(pv[x, y]) < 130 for y in range(y0, y1 + 1))]
    if xs:
        print(f"  Zeilen {y0}-{y1}: x {min(xs)}..{max(xs)}")

print("-- SMITH JOHNSON (weiss auf blau, x 20..300) --")
print("  ", bbox(pv, 20, 300, 330, 380, lambda c: hell(c) > 215))
print("-- GRAPHIC DESIGNER --")
print("  ", bbox(pv, 20, 300, 375, 405, lambda c: hell(c) > 215))
print("-- SOCIALPRO vorne (weiss auf blau, x 560..820) --")
print("  ", bbox(pv, 560, 820, 330, 378, lambda c: hell(c) > 215))
print("-- UR SLOGAN HERE vorne --")
print("  ", bbox(pv, 560, 820, 372, 405, lambda c: hell(c) > 215))
print("-- Glyphe vorne (weiss, rechts vom Schriftzug) --")
print("  ", bbox(pv, 770, 850, 330, 405, lambda c: hell(c) > 215))

R = None
b_ = bbox(pv, 560, 820, 330, 378, lambda c: hell(c) > 215)
if b_:
    R = (b_[1] - b_[0] + 1) / (b_[3] - b_[2] + 1)
    print(f"  Wortmarken-Aspekt vorne (B/H): {R:.3f}")

print("===== hinten (Roh-Foto) =====")
bh = Image.open(BASIS / "referenz_eric_hinten.jpg").convert("RGB")
ph = bh.load()
b, h = bh.size

print("-- Wortmarke (dunkel), Suchfenster x 60..240, y 100..160 --")
wm = bbox(ph, 60, 240, 100, 160, lambda c: hell(c) < 120)
print("  ", wm)
print("-- Glyphe (blau) --")
gl = bbox(ph, 100, 200, 50, 110, ist_blau)
print("  ", gl)
print("-- Balkenoberkante an Aussenspalten: erste dunkle Zeile von oben --")
for x in (15, 30, 55, 235, 260, 275):
    for y in range(h // 2, h):
        if hell(ph[x, y]) < 90:
            print(f"  x={x}: dunkel ab y={y}")
            break
    else:
        print(f"  x={x}: nichts")
print("-- Blau-Laeufe je Zeile (Band) --")
for y in range(210, h, 6):
    print(f"  y={y}: {blau_laeufe(ph, y, 0, b)}")
print("-- Slogan-Zeile (dunkel), x 60..240, y 150..180 --")
print("  ", bbox(ph, 60, 240, 150, 185, lambda c: hell(c) < 140))

if wm and R:
    W, H = wm[1] - wm[0] + 1, wm[3] - wm[2] + 1
    sx = 850.0 / b
    sy = sx * (W / H) / R
    print(f"-- Kalibriervorschlag hinten: Wortmarke {W}x{H}, sx={sx:.3f}, "
          f"sy={sy:.3f} (k={W / H / R:.3f}) --")

print("===== Farbwahrheit aus dem Mockup-Render =====")
mock = Image.open(BASIS.parent / "referenz_socialpro.jpg").convert("RGB")
pm = mock.load()
mb, mh = mock.size


def median_farbe(x0, x1, y0, y1, test):
    rs, gs, bs = [], [], []
    for x in range(x0, x1, 2):
        for y in range(y0, y1, 2):
            c = pm[x, y]
            if test(c):
                rs.append(c[0])
                gs.append(c[1])
                bs.append(c[2])
    if not rs:
        return None, 0
    rs.sort(), gs.sort(), bs.sort()
    n = len(rs)
    return (rs[n // 2], gs[n // 2], bs[n // 2]), n


# Linker Stapel (Infoseite): Blau der Baender/Icons
for label, box in {
    "vorne-blau (linker Stapel)": (60, 520, 300, 1000),
    "hinten-blau (rechter Stapel)": (380, 1020, 30, 620),
}.items():
    farbe, n = median_farbe(*box, ist_blau)
    if farbe:
        print(f"  {label}: #{farbe[0]:02x}{farbe[1]:02x}{farbe[2]:02x} ({n} px)")

# Textgrau der Kontaktzeilen (dunkle, nicht schwarze Pixel im linken Stapel oben)
farbe, n = median_farbe(150, 520, 300, 700,
                        lambda c: 40 < hell(c) < 110)
print(f"  Textdunkel vorne: #{farbe[0]:02x}{farbe[1]:02x}{farbe[2]:02x} ({n} px)")
