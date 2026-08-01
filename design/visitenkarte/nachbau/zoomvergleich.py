# Zoomvergleich einzelner Zonen: Referenz-Ausschnitt ueber Nachbau-Ausschnitt,
# 2x vergroessert — fuer Icon-Glyphen, Bandtexte und Glyphe.
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASIS = Path(__file__).parent
FONT = ImageFont.truetype("arial.ttf", 18)

ZONEN = {
    "zoom_icons.png": ("vorne", (40, 30, 320, 290)),
    "zoom_bandrechts.png": ("vorne", (460, 300, 850, 420)),
    "zoom_glyphe.png": ("hinten", (330, 120, 560, 330)),
}

for ziel, (seite, (x0, y0, x1, y1)) in ZONEN.items():
    ref = Image.open(BASIS / f"master_{seite}.png").convert("RGB").crop(
        (x0, y0, x1, y1))
    bau = Image.open(BASIS / f"nachbau_{seite}.png").convert("RGB")
    if bau.size != (850, 550):
        bau = bau.resize((850, 550), Image.LANCZOS)
    bau = bau.crop((x0, y0, x1, y1))
    b, h = ref.size
    f = 2
    blatt = Image.new("RGB", (b * f, h * 2 * f + 60), (235, 235, 235))
    z = ImageDraw.Draw(blatt)
    z.text((8, 3), "Referenz", fill=(0, 0, 0), font=FONT)
    blatt.paste(ref.resize((b * f, h * f), Image.LANCZOS), (0, 26))
    z.text((8, h * f + 30), "Nachbau", fill=(0, 0, 0), font=FONT)
    blatt.paste(bau.resize((b * f, h * f), Image.LANCZOS), (0, h * f + 56))
    blatt.save(BASIS / ziel)
    print("geschrieben:", BASIS / ziel, blatt.size)
