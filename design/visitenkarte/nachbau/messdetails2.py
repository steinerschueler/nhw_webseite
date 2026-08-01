# Nachmessung mit sauberen Fenstern: Bandoberkante/Falz/Balken vorne,
# Weisstext-Zeilencluster (Name/Titel, Wortmarke/Slogan), Kontakttext-Kanten,
# Wortmarken-Kalibrierung hinten, Farbcluster im Mockup.
from pathlib import Path

from PIL import Image

BASIS = Path(__file__).parent


def hell(rgb):
    return sum(rgb) / 3


def ist_blau(rgb):
    r, g, b = rgb
    return b > 120 and b - r > 45


def cluster(zeilen):
    bloecke, letzte = [], None
    for y in zeilen:
        if letzte is None or y > letzte + 2:
            bloecke.append([y, y])
        else:
            bloecke[-1][1] = y
        letzte = y
    return bloecke


mv = Image.open(BASIS / "master_vorne.png")
pv = mv.load()
print("===== vorne =====")

print("-- Zeilenklassen y=290..345 (b=blau, s=schwarz, w=weiss; x-Laeufe) --")
for y in range(290, 346, 3):
    blau = []
    start = None
    for x in range(0, 850):
        if ist_blau(pv[x, y]):
            if start is None:
                start = x
        else:
            if start is not None:
                blau.append((start, x - 1))
                start = None
    if start is not None:
        blau.append((start, 849))
    dunkel = [xx for xx in range(340, 520) if hell(pv[xx, y]) < 90]
    d_bereich = (min(dunkel), max(dunkel)) if dunkel else None
    print(f"  y={y}: blau {blau}  dunkel(340-520) {d_bereich}")

print("-- Weisstext linkes Band: helle Pixel je Zeile (x 0..330, >205) --")
zeilen = [y for y in range(300, 410)
          if sum(1 for x in range(0, 330) if hell(pv[x, y]) > 205) > 4]
bloecke = cluster(zeilen)
print("  Cluster:", bloecke)
for y0, y1 in bloecke:
    xs = [x for x in range(0, 330)
          if any(hell(pv[x, y]) > 205 for y in range(y0, y1 + 1))]
    print(f"  {y0}-{y1}: x {min(xs)}..{max(xs)}")

print("-- Weisstext rechtes Band (x 520..850, >205) --")
zeilen = [y for y in range(300, 410)
          if sum(1 for x in range(520, 850) if hell(pv[x, y]) > 205) > 4]
bloecke = cluster(zeilen)
print("  Cluster:", bloecke)
for y0, y1 in bloecke:
    xs = [x for x in range(520, 850)
          if any(hell(pv[x, y]) > 205 for y in range(y0, y1 + 1))]
    print(f"  {y0}-{y1}: x {min(xs)}..{max(xs)}")

print("-- Kontakttext: dunkle nicht-blaue Pixel, x 130..600 --")
for y0, y1 in ([56, 74], [88, 106], [137, 149], [164, 183], [211, 231], [243, 263]):
    xs = [x for x in range(130, 600)
          if any(hell(pv[x, y]) < 130 and not ist_blau(pv[x, y])
                 for y in range(y0, y1 + 1))]
    if xs:
        print(f"  Zeilen {y0}-{y1}: x {min(xs)}..{max(xs)}")

print("===== hinten (Roh-Foto) =====")
bh = Image.open(BASIS / "referenz_eric_hinten.jpg").convert("RGB")
ph = bh.load()
b, h = bh.size

print("-- Dunkelpixel-Zeilenprofil x 60..240, y 85..185 --")
zeilen = [y for y in range(85, 185)
          if sum(1 for x in range(60, 240) if hell(ph[x, y]) < 120) > 2]
bloecke = cluster(zeilen)
print("  Cluster:", bloecke)
for y0, y1 in bloecke:
    xs = [x for x in range(40, 260)
          if any(hell(ph[x, y]) < 120 for y in range(y0, y1 + 1))]
    print(f"  {y0}-{y1}: x {min(xs)}..{max(xs)}")

print("-- Glyphe (blau), Fenster x 120..200, y 40..130 --")
xs, ys = [], []
for x in range(120, 200):
    for y in range(40, 130):
        if ist_blau(ph[x, y]):
            xs.append(x)
            ys.append(y)
print(f"   x {min(xs)}..{max(xs)}, y {min(ys)}..{max(ys)} "
      f"({max(xs) - min(xs) + 1}x{max(ys) - min(ys) + 1})")

print("===== Mockup-Blau, Helligkeitsquartile =====")
mock = Image.open(BASIS.parent / "referenz_socialpro.jpg").convert("RGB")
pm = mock.load()
for label, (x0, x1, y0, y1) in {
    "vorne (linker Stapel)": (60, 520, 300, 1000),
    "hinten (rechter Stapel)": (380, 1020, 30, 620),
}.items():
    blaue = []
    for x in range(x0, x1, 2):
        for y in range(y0, y1, 2):
            c = pm[x, y]
            if ist_blau(c):
                blaue.append(c)
    blaue.sort(key=hell)
    n = len(blaue)
    fuer = {
        "p25": blaue[n // 4],
        "median": blaue[n // 2],
        "p75": blaue[3 * n // 4],
        "p90": blaue[9 * n // 10],
    }
    txt = "  ".join(f"{k} #{c[0]:02x}{c[1]:02x}{c[2]:02x}" for k, c in fuer.items())
    print(f"  {label}: {txt}")
