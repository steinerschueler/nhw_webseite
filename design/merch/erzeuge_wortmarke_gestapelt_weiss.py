#!/usr/bin/env python3
# Gestapelte T-Shirt-Wortmarke fuer WEISSE/helle Shirts: wie
# erzeuge_wortmarke_gestapelt.py, aber OHNE Creme-Karte -> voll transparenter
# Hintergrund, die Schrift sitzt direkt auf dem (weissen) Stoff.
#   "naville" (schwarz) ueber "handwerk" (rot), naville auf handwerk-Breite.
#
#   PYTHONUTF8=1 python design/merch/erzeuge_wortmarke_gestapelt_weiss.py
#
# Schrift: Marken-Archivo SemiBold (design/brand/archivo-600.ttf).
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

HIER = Path(__file__).parent
TTF = HIER.parent / "brand" / "archivo-600.ttf"
ZIEL = HIER / "tshirt_wortmarke_gestapelt_weiss.png"

SCHWARZ = (0, 0, 0, 255)       # naville
ROT = (193, 18, 28, 255)       # #C1121C  handwerk

ZIEL_TEXTBREITE = 2600         # px der Zeilenbreite -> Druckaufloesung
GAP = 0.18                     # Zeilenabstand als Anteil der (naville-)Schriftgroesse
PAD = 0.06                     # schmaler transparenter Rand (verhindert Beschnitt)


def bbox(font, wort):
    l, t, r, b = font.getbbox(wort)
    return l, t, r - l, b - t


# "handwerk" auf ZIEL_TEXTBREITE -> Schriftgroesse F; "naville" auf gleiche Breite
mess = ImageFont.truetype(str(TTF), 1000)
F = round(1000 * ZIEL_TEXTBREITE / bbox(mess, "handwerk")[2])
font_h = ImageFont.truetype(str(TTF), F)
lh, th, wh, hh = bbox(font_h, "handwerk")

F_n = round(1000 * wh / bbox(mess, "naville")[2])
font_n = ImageFont.truetype(str(TTF), F_n)
ln, tn, wn, hn = bbox(font_n, "naville")

gap = round(GAP * F_n)
pad = round(PAD * F_n)

card_w = max(wn, wh) + 2 * pad
card_h = hn + gap + hh + 2 * pad

# Voll transparenter Hintergrund -- keine Karte
karte = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
d = ImageDraw.Draw(karte)
d.text(((card_w - wn) / 2 - ln, pad - tn), "naville", font=font_n, fill=SCHWARZ)
d.text(((card_w - wh) / 2 - lh, pad + hn + gap - th), "handwerk", font=font_h, fill=ROT)

karte.save(ZIEL)
print(f"{ZIEL.name}: {card_w}x{card_h} px  transparent  "
      f"(naville {F_n}px / handwerk {F}px, bei 300 dpi ≈ {card_w/300*2.54:.1f} cm breit)")
