# Erics gerade Draufsicht-Fotos zu Mess-Mastern normieren (850x550 = 10 px/mm).
# Annahme: Bildrand ~ Kartenrand; wo moeglich wird der Rand numerisch gesucht.
# Kontrolle: Icon-Kreise muessen nach der Normierung rund sein.
import shutil
from pathlib import Path

from PIL import Image

BASIS = Path(__file__).parent
UPLOADS = Path(r"C:\Users\ericn\.claude\uploads\7f7e3b99-115b-42f0-ac2f-e99221485ca7")
QUELLEN = {
    "vorne": UPLOADS / "b22ff009-1000010545.jpg",
    "hinten": UPLOADS / "0acc5e32-1000010544.jpg",
}

for name, quelle in QUELLEN.items():
    kopie = BASIS / f"referenz_eric_{name}.jpg"
    if not kopie.exists():
        shutil.copy(quelle, kopie)

    bild = Image.open(kopie).convert("RGB")
    b, h = bild.size
    pix = bild.load()
    print(f"== {name}: {b}x{h} ==")

    def zeile_hell(y, x0, x1):
        werte = [sum(pix[x, y]) / 3 for x in range(x0, x1)]
        return sum(werte) / len(werte)

    def spalte_hell(x, y0, y1):
        werte = [sum(pix[x, y]) / 3 for y in range(y0, y1)]
        return sum(werte) / len(werte)

    # Oberkante: erste Zeile, deren Mitte hell (weisse Karte) ist
    oben = 0
    for y in range(0, h // 4):
        if zeile_hell(y, b // 4, 3 * b // 4) > 200:
            oben = y
            break
    # Linke/rechte Kante: erste helle Spalte (obere Kartenhaelfte, dort ist Weiss)
    links = 0
    for x in range(0, b // 4):
        if spalte_hell(x, oben + 5, h // 3) > 200:
            links = x
            break
    rechts = b
    for x in range(b - 1, 3 * b // 4, -1):
        if spalte_hell(x, oben + 5, h // 3) > 200:
            rechts = x + 1
            break
    # Unterkante: von unten — letzte Zeile, die klar dunkler als die
    # Kartenschwarz-Zone dperueber ist, ist Hintergrund; sonst Bildrand.
    unten = h
    print(f"  Zeilenhelligkeit unten: "
          f"{[round(zeile_hell(y, b // 3, 2 * b // 3)) for y in range(h - 12, h)]}")
    print(f"  Rand: oben {oben}, links {links}, rechts {rechts}, unten {unten}")

    karte = bild.crop((links, oben, rechts, unten)).resize((850, 550), Image.LANCZOS)
    ziel = BASIS / f"master_{name}.png"
    karte.save(ziel)
    print("  geschrieben:", ziel)

    kpix = karte.load()

    def blau_blob(cx, cy, radius=60):
        xs, ys = [], []
        for x in range(max(0, cx - radius), min(850, cx + radius)):
            for y in range(max(0, cy - radius), min(550, cy + radius)):
                r, g, bl = kpix[x, y]
                if bl > 120 and bl - r > 45:
                    xs.append(x)
                    ys.append(y)
        if not xs:
            return None
        return min(xs), max(xs), min(ys), max(ys)

    if name == "vorne":
        # Icon-Kreise: Rundheitskontrolle (Soll: Breite == Hoehe)
        for label, (cx, cy) in {
            "icon1": (75, 95), "icon2": (75, 190), "icon3": (75, 285),
        }.items():
            blob = blau_blob(cx, cy, 55)
            if blob:
                x0, x1, y0, y1 = blob
                print(f"  {label}: Breite {x1 - x0 + 1}, Hoehe {y1 - y0 + 1}, "
                      f"Zentrum ({(x0 + x1) / 2:.0f},{(y0 + y1) / 2:.0f})")

    def farbe(label, x, y):
        r = g = bl = 0
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                w = kpix[x + dx, y + dy]
                r += w[0]
                g += w[1]
                bl += w[2]
        r, g, bl = r // 25, g // 25, bl // 25
        print(f"  Farbe {label}: #{r:02x}{g:02x}{bl:02x}  ({r},{g},{bl})")

    if name == "vorne":
        farbe("weiss-mitte", 300, 60)
        farbe("band-links", 120, 430)
        farbe("band-rechts", 650, 430)
        farbe("schwarzstrip", 300, 520)
        farbe("text", 195, 88)
    else:
        farbe("weiss-mitte", 425, 100)
        farbe("band-mitte", 425, 480)
        farbe("schwarz-ecke", 60, 520)
