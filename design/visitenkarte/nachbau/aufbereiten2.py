# Normierung, Runde 2: Y-Skala aus Rundheits-Bedingungen (Icons vorne,
# Logo-Glyphe hinten) statt aus der Bildhoehe — Erics Fotos sind vertikal
# verzerrt/beschnitten. Ergebnis: master_vorne.png / master_hinten.png,
# beide exakt 850x550 (10 px/mm), plus Mess- und Farbausgaben.
from pathlib import Path

from PIL import Image

BASIS = Path(__file__).parent


def blob(pix, groesse, cx, cy, radius, test):
    b, h = groesse
    xs, ys = [], []
    for x in range(max(0, cx - radius), min(b, cx + radius)):
        for y in range(max(0, cy - radius), min(h, cy + radius)):
            if test(pix[x, y]):
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return min(xs), max(xs), min(ys), max(ys)


def ist_blau(rgb):
    r, g, b = rgb
    return b > 120 and b - r > 45


def ist_dunkel(rgb):
    return sum(rgb) / 3 < 100


# ---------- vorne ----------
bild = Image.open(BASIS / "referenz_eric_vorne.jpg").convert("RGB")
b, h = bild.size
pix = bild.load()
print(f"== vorne: {b}x{h} ==")

# Icon-Rundheit im Originalfoto
verhaeltnisse = []
for cx, cy in ((47, 51), (47, 100), (47, 150)):
    tr = blob(pix, (b, h), cx, cy, 26, ist_blau)
    if tr:
        x0, x1, y0, y1 = tr
        w, hh = x1 - x0 + 1, y1 - y0 + 1
        verhaeltnisse.append(w / hh)
        print(f"  Icon bei ({cx},{cy}): {w}x{hh} px")
k = sum(verhaeltnisse) / len(verhaeltnisse)
sx = 850.0 / b
sy = sx * k
inhalt_hoehe = round(h * sy)
print(f"  k={k:.4f}  sx={sx:.3f}  sy={sy:.3f}  Inhaltshoehe {inhalt_hoehe} px "
      f"(fehlend unten: {550 - inhalt_hoehe})")

# QR-Quadrat-Kontrolle
tr = blob(pix, (b, h), 352, 95, 45, ist_dunkel)
if tr:
    x0, x1, y0, y1 = tr
    print(f"  QR im Foto: {x1 - x0 + 1}x{y1 - y0 + 1} px -> normiert "
          f"{(x1 - x0 + 1) * sx:.0f}x{(y1 - y0 + 1) * sy:.0f}")

master = Image.new("RGB", (850, 550), (1, 1, 1))
inhalt = bild.resize((850, inhalt_hoehe), Image.LANCZOS)
master.paste(inhalt, (0, 0))
master.save(BASIS / "master_vorne.png")
print("  geschrieben: master_vorne.png")

mp = master.load()
for label, (x, y) in {
    "icon1-zentrum?": (98, 81), "band-125": (125, 400), "band-300": (300, 400),
    "band-500": (500, 400), "band-650": (650, 400), "band-800": (800, 400),
    "schwarz-notch": (425, 400), "schwarz-strip": (300, 500),
    "text-kontakt": (195, 76), "weiss": (300, 55),
}.items():
    r = g = bl = 0
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            w = mp[x + dx, y + dy]
            r += w[0]
            g += w[1]
            bl += w[2]
    print(f"  Farbe {label} @({x},{y}): #{r // 25:02x}{g // 25:02x}{bl // 25:02x}")

# Icon-Zentren und Radius im Master
for i, cy in enumerate((81, 160, 240), 1):
    tr = blob(master.load(), (850, 550), 98, cy, 55, ist_blau)
    if tr:
        x0, x1, y0, y1 = tr
        print(f"  Master-Icon{i}: x {x0}..{x1}, y {y0}..{y1} "
              f"(Zentrum {(x0 + x1) / 2:.0f},{(y0 + y1) / 2:.0f}; "
              f"D {x1 - x0 + 1}x{y1 - y0 + 1})")

# ---------- hinten ----------
bild = Image.open(BASIS / "referenz_eric_hinten.jpg").convert("RGB")
b, h = bild.size
pix = bild.load()
print(f"== hinten: {b}x{h} ==")

# Unterkante: letzte Zeile von unten, deren Mitte dunkel (<60) ist
unten = h
for y in range(h - 1, h // 2, -1):
    mitte = sum(sum(pix[x, y]) / 3 for x in range(b // 3, 2 * b // 3)) / (b // 3)
    if mitte < 60:
        unten = y + 1
        break
print(f"  Unterkante (schwarz->grau): Zeile {unten} von {h}")

# Glyphen-Rundheit (blaue Marke ueber dem Schriftzug)
tr = blob(pix, (b, h), 147, 95, 40, ist_blau)
x0, x1, y0, y1 = tr
gw, gh = x1 - x0 + 1, y1 - y0 + 1
print(f"  Glyphe: {gw}x{gh} px bei ({(x0 + x1) / 2:.0f},{(y0 + y1) / 2:.0f})")
k = gw / gh
sx = 850.0 / b
sy = sx * k
inhalt_hoehe = round(unten * sy)
print(f"  k={k:.4f}  sx={sx:.3f}  sy={sy:.3f}  Inhaltshoehe {inhalt_hoehe} px "
      f"(fehlend oben: {550 - inhalt_hoehe})")

master = Image.new("RGB", (850, 550), (255, 255, 255))
inhalt = bild.crop((0, 0, b, unten)).resize((850, inhalt_hoehe), Image.LANCZOS)
master.paste(inhalt, (0, 550 - inhalt_hoehe))
master.save(BASIS / "master_hinten.png")
print("  geschrieben: master_hinten.png")

mp = master.load()
for label, (x, y) in {
    "weiss": (425, 120), "band-200": (200, 490), "band-425": (425, 490),
    "band-650": (650, 490), "schwarz-eckenkeil": (60, 500),
    "logo-social?": (350, 250), "glyphe": (470, 180),
}.items():
    r = g = bl = 0
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            w = mp[x + dx, y + dy]
            r += w[0]
            g += w[1]
            bl += w[2]
    print(f"  Farbe {label} @({x},{y}): #{r // 25:02x}{g // 25:02x}{bl // 25:02x}")
