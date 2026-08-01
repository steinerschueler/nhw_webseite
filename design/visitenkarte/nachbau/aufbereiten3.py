# Hinten-Normierung, Runde 3: Y-Skala ueber die Bandhoehe (Soll = gemessene
# Bandhoehe vorne), Unterkante mit Karte=(dunkel|blau). Ausserdem praezise
# Bandgeometrie vorne als Grundlage.
from pathlib import Path

from PIL import Image

BASIS = Path(__file__).parent


def ist_blau(rgb):
    r, g, b = rgb
    return b > 120 and b - r > 45


def band_hoehe(pix, x, y0, y1):
    """Laengster Blau-Lauf in Spalte x zwischen y0..y1."""
    beste = lauf = 0
    start = beste_start = None
    for y in range(y0, y1):
        if ist_blau(pix[x, y]):
            if lauf == 0:
                start = y
            lauf += 1
            if lauf > beste:
                beste, beste_start = lauf, start
        else:
            lauf = 0
    return beste, beste_start


# --- vorne: Bandhoehe messen (Master ist geometrisch verifiziert) ---
master_v = Image.open(BASIS / "master_vorne.png")
pv = master_v.load()
vorne_hoehen = []
for x in (125, 300, 650, 800):
    hoehe, start = band_hoehe(pv, x, 330, 500)
    vorne_hoehen.append(hoehe)
    print(f"vorne Band @x={x}: y {start}..{start + hoehe - 1}  (Hoehe {hoehe})")

# --- hinten ---
bild = Image.open(BASIS / "referenz_eric_hinten.jpg").convert("RGB")
b, h = bild.size
pix = bild.load()
print(f"hinten: {b}x{h}")

# Bandhoehe im Foto (Spalten in Bandmitte)
foto_hoehen = []
for x in (b // 3, b // 2, 2 * b // 3):
    hoehe, start = band_hoehe(pix, x, h // 2, h)
    foto_hoehen.append(hoehe)
    print(f"hinten Foto-Band @x={x}: y {start}..{start + hoehe - 1}  (Hoehe {hoehe})")

# Unterkante: unterste Zeile, deren Mitte kartenartig (dunkel|blau) ist
def zeile_kartig(y):
    n = 0
    for x in range(b // 3, 2 * b // 3):
        rgb = pix[x, y]
        if sum(rgb) / 3 < 75 or ist_blau(rgb):
            n += 1
    return n / (b // 3)

unten = None
for y in range(h - 1, h // 2, -1):
    if zeile_kartig(y) > 0.6:
        unten = y + 1
        break
print(f"hinten Unterkante: {unten} (von {h})")
for y in range(max(0, unten - 4), min(h, unten + 4)):
    print(f"  Zeile {y}: kartig {zeile_kartig(y):.2f}")

# Kalibrierung: Bandhoehe hinten (Foto-px) -> Soll aus vorne (Karten-px);
# Annahme: gleiches Designsystem, gleiche Bandhoehe auf beiden Seiten.
soll_band = sorted(vorne_hoehen)[len(vorne_hoehen) // 2]
foto_band = sorted(foto_hoehen)[1]
sx = 850.0 / b
sy = soll_band / foto_band
inhalt_hoehe = round(unten * sy)
print(f"sx={sx:.3f}  sy={sy:.3f} (Band {foto_band}px -> {soll_band})  "
      f"Inhaltshoehe {inhalt_hoehe} (fehlend oben: {550 - inhalt_hoehe})")

master = Image.new("RGB", (850, 550), (255, 255, 255))
inhalt = bild.crop((0, 0, b, unten)).resize((850, inhalt_hoehe), Image.LANCZOS)
master.paste(inhalt, (0, 550 - inhalt_hoehe))
master.save(BASIS / "master_hinten.png")
print("geschrieben: master_hinten.png")

# Glyphen-Kontrolle im neuen Master (Erwartung: annähernd rund, eher hoch)
mp = master.load()
xs, ys = [], []
for x in range(300, 560):
    for y in range(60, 300):
        if ist_blau(mp[x, y]):
            xs.append(x)
            ys.append(y)
if xs:
    print(f"Glyphe im Master: x {min(xs)}..{max(xs)}, y {min(ys)}..{max(ys)} "
          f"({max(xs) - min(xs) + 1}x{max(ys) - min(ys) + 1})")
