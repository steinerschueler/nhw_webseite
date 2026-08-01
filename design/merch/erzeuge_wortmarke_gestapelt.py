#!/usr/bin/env python3
# Gestapelte, zentrierte T-Shirt-Wortmarke (linke Brust klein / Ruecken gross):
#   "naville" (schwarz) ueber "handwerk" (rot #C1121C), auf abgerundeter
#   Creme-Karte; ausserhalb der Rundung transparent -> sitzt auf jeder
#   Shirt-Farbe. Eine Datei, im Druck skaliert.
#
# Gestaltung (Eric-Entscheid 2026-08-01): "naville" ist so weit vergroessert,
# dass es exakt dieselbe Breite wie "handwerk" hat -> beide Zeilen kantenbuendig,
# "naville" tritt als grosse Kopfzeile hervor.
#
#   PYTHONUTF8=1 python design/merch/erzeuge_wortmarke_gestapelt.py
#
# Schrift: Marken-Archivo SemiBold (design/brand/archivo-600.ttf).
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

HIER = Path(__file__).parent
TTF = HIER.parent / "brand" / "archivo-600.ttf"
ZIEL = HIER / "tshirt_wortmarke_gestapelt.png"

CREME = (239, 238, 232, 255)   # #EFEEE8  (Website/Icon-Creme)
SCHWARZ = (0, 0, 0, 255)       # naville
ROT = (193, 18, 28, 255)       # #C1121C  handwerk

ZIEL_TEXTBREITE = 2600         # px der Zeilenbreite -> Druckaufloesung
GAP = 0.18                     # Zeilenabstand als Anteil der (naville-)Schriftgroesse
PAD_X = 0.28                   # Innenrand seitlich
PAD_Y = 0.22                   # Innenrand oben/unten
RADIUS = 0.20                  # Eckenradius als Anteil der Kartenhoehe
SS = 3                         # Supersampling der Rundungs-Maske (glatte Ecken)


def bbox(font, wort):
    l, t, r, b = font.getbbox(wort)
    return l, t, r - l, b - t          # links, oben, breite, hoehe (Ink-Box)


# "handwerk" auf ZIEL_TEXTBREITE bringen -> Schriftgroesse F
mess = ImageFont.truetype(str(TTF), 1000)
F = round(1000 * ZIEL_TEXTBREITE / bbox(mess, "handwerk")[2])
font_h = ImageFont.truetype(str(TTF), F)
lh, th, wh, hh = bbox(font_h, "handwerk")

# "naville" so gross skalieren, dass seine Breite == handwerk-Breite
F_n = round(1000 * wh / bbox(mess, "naville")[2])
font_n = ImageFont.truetype(str(TTF), F_n)
ln, tn, wn, hn = bbox(font_n, "naville")

# Raender/Gap an der groesseren Schrift (naville) ausrichten
gap = round(GAP * F_n)
pad_x = round(PAD_X * F_n)
pad_y = round(PAD_Y * F_n)

card_w = max(wn, wh) + 2 * pad_x
card_h = hn + gap + hh + 2 * pad_y
radius = round(RADIUS * card_h)

# Creme-Karte mit transparenten Aussenecken (glatte Rundung via Supersampling)
maske = Image.new("L", (card_w * SS, card_h * SS), 0)
ImageDraw.Draw(maske).rounded_rectangle(
    [0, 0, card_w * SS - 1, card_h * SS - 1], radius=radius * SS, fill=255)
maske = maske.resize((card_w, card_h), Image.LANCZOS)

karte = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
karte = Image.composite(Image.new("RGBA", (card_w, card_h), CREME), karte, maske)

d = ImageDraw.Draw(karte)
d.text(((card_w - wn) / 2 - ln, pad_y - tn), "naville", font=font_n, fill=SCHWARZ)
d.text(((card_w - wh) / 2 - lh, pad_y + hn + gap - th), "handwerk", font=font_h, fill=ROT)

karte.save(ZIEL)
print(f"{ZIEL.name}: {card_w}x{card_h} px  "
      f"(naville {F_n}px / handwerk {F}px, Breiten {wn} vs {wh}, "
      f"bei 300 dpi ≈ {card_w/300*2.54:.1f} cm breit)")
