# master_hinten korrekt bauen: k=0.64 (Glyphe quadratisch, durch die interne
# Ratio-Probe bestaetigt: (Bandoberkante-Wortmarke)/Kapitaelchenhoehe passt),
# oben geankert (Foto-Oberkante = Kartenoberkante), fehlender Rest unten =
# schwarzer Balken.
from pathlib import Path

from PIL import Image

BASIS = Path(__file__).parent

bild = Image.open(BASIS / "referenz_eric_hinten.jpg").convert("RGB")
b, h = bild.size
sx = 850.0 / b
sy = sx * 0.64
inhalt_hoehe = round(h * sy)
print(f"sx={sx:.3f} sy={sy:.3f} Inhaltshoehe {inhalt_hoehe} "
      f"(unten ergaenzt: {550 - inhalt_hoehe})")

master = Image.new("RGB", (850, 550), (10, 12, 15))
inhalt = bild.resize((850, inhalt_hoehe), Image.LANCZOS)
master.paste(inhalt, (0, 0))
master.save(BASIS / "master_hinten.png")
print("geschrieben: master_hinten.png (oben geankert)")
