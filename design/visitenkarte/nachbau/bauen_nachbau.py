# QR erzeugen, nachbau.typ nach PNG kompilieren (10 px/mm) und ein
# Vergleichsblatt Referenz-Master vs. Nachbau erstellen.
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASIS = Path(__file__).parent

# --- QR (Platzhalterinhalt wie im Template ueblich) ---
qr_datei = BASIS / "qr.png"
if not qr_datei.exists():
    import qrcode

    qr = qrcode.QRCode(border=0, box_size=8)
    qr.add_data("https://www.yourwebsitename.com")
    qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(qr_datei)
    print("QR geschrieben:", qr_datei)

# --- Font-Probe: ist Century Gothic wirklich verfuegbar? ---
import typst

for name, schrift in (("probe_cg", "Century Gothic"), ("probe_fallback", "Zz-Nix")):
    (BASIS / f"{name}.typ").write_text(
        '#set page(width: 30mm, height: 10mm, margin: 0mm)\n'
        f'#text(font: "{schrift}", size: 5mm)[Rag0a]\n', encoding="utf-8")
probe = [typst.compile(BASIS / f"{n}.typ", format="png", ppi=254.0)
         for n in ("probe_cg", "probe_fallback")]
print("Century Gothic aktiv:", probe[0] != probe[1])

seiten = typst.compile(
    BASIS / "nachbau.typ",
    format="png",
    ppi=254.0,  # 10 px/mm; Systemfonts sind per Default eingebunden
)
namen = ["nachbau_vorne.png", "nachbau_hinten.png"]
for name, daten in zip(namen, seiten):
    (BASIS / name).write_bytes(daten)
    print("geschrieben:", BASIS / name)

# --- Vergleichsblatt: oben Referenz, darunter Nachbau, je Seite ---
FONT = ImageFont.truetype("arial.ttf", 22)
for seite in ("vorne", "hinten"):
    ref = Image.open(BASIS / f"master_{seite}.png").convert("RGB")
    bau = Image.open(BASIS / f"nachbau_{seite}.png").convert("RGB")
    if bau.size != (850, 550):
        bau = bau.resize((850, 550), Image.LANCZOS)
    blatt = Image.new("RGB", (850, 550 * 2 + 90), (235, 235, 235))
    z = ImageDraw.Draw(blatt)
    z.text((10, 4), f"Referenz ({seite})", fill=(0, 0, 0), font=FONT)
    blatt.paste(ref, (0, 30))
    z.text((10, 550 + 34), "Nachbau", fill=(0, 0, 0), font=FONT)
    blatt.paste(bau, (0, 550 + 60))
    ziel = BASIS / f"vergleich_{seite}.png"
    blatt.save(ziel)
    print("geschrieben:", ziel)
