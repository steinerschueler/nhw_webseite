# SocialPro-Nachbau — Doku für die nächste Instanz

Typst-Nachbau (85×55 mm, zwei Seiten) der physischen SocialPro-Musterkarte,
entstanden 2026-08-01 als Test «JPG verstehen und nachbauen» (mit Opus 4.8
war das zuvor praktisch unmöglich). Eric hat die physische Karte in der Hand
und hat den Nachbau in mehreren Runden abgenommen («Sauber!»).

**Massraster überall: 10 px = 1 mm** (Master-Bilder 850×550 = Karte 85×55).

## Endprodukte

| Datei | Was |
|---|---|
| `nachbau.typ` | Die Quelle. Alle Masse in mm, Entscheide als Kommentare mit Datum. |
| `nachbau.pdf` / `nachbau_vorne.png` / `nachbau_hinten.png` | Kompilate (PNG mit 254 ppi = 10 px/mm). |
| `vergleich_vorne.png` / `vergleich_hinten.png` | Referenz oben, Nachbau unten. |
| `master_vorne.png` / `master_hinten.png` | Entzerrte Mess-Referenzen aus Erics Fotos. |

## Bauen

Aus der nhw_tool-Umgebung (dort liegen Pillow + typst-py):

```
cd C:\nhw_tool
uv run --with qrcode python C:\nhw_webseite\design\visitenkarte\nachbau\bauen_nachbau.py
uv run python -c "import typst; typst.compile(r'...\nachbau.typ', output=r'...\nachbau.pdf')"
```

`--with qrcode` ist nur nötig, solange `qr.png` fehlt (wird sonst übersprungen).
typst-py 0.15 → Typst mit `curve()` (kein `path()` mehr!); Systemfonts sind
automatisch eingebunden (`Century Gothic` vorhanden, Probe im Build-Skript).

## Konstruktionsmodell (von Eric validiert)

Ein **gefaltetes Band über einem schwarzen Balken**, auf beiden Seiten gleich:

1. Hinteres Paneel (dunkleres Azur) steigt **hinter** dem Balken auf, ragt
   2.1 mm über dessen Oberkante und verjüngt sich nach oben.
2. An der **Falzlinie** knickt es (parallel zum Balken); vorderes Paneel
   (helles Azur) hängt ab der Falzlinie **vor** dem Balken und verjüngt sich
   nach unten. **Beide Paneele teilen die Oberkante** — sonst wirkt das Blau
   zweiteilig (Eric-Korrektur). Vom hinteren Paneel bleiben nur Keildreiecke
   sichtbar (Infoseite: an der Öffnung; Designseite: aussen).
3. Infoseite: Band **zweigeteilt**, öffnet sich in der Mitte nach unten.
   Zwischen den beiden Falzen ist die Karte **weiss** (nicht schwarz, nicht
   navy — dort ist nichts gezeichnet); Schwarz beginnt erst an der
   Balkenoberkante (Eric: «Balken bleibt unter dem Knick»).

## Geometrie aktuell (Eric-Spez) vs. gemessene Referenz

Eric hat nach der Abnahme der Konstruktion **bewusst Proportionen geändert** —
der aktuelle Stand ist also Karte + Erics Feinschliff, nicht mehr 1:1 das
Original:

| Grösse | Gemessen (Original) | Aktuell (Eric) |
|---|---|---|
| Bandhöhe vorne | 9.6 mm (Falz 30.5, Unterkante 40.1) | **12.8 mm** (Falz 38.2, bis 51.0) — gleich wie hinten |
| Schwarz unter dem Band vorne | ~14.9 mm | **4.0 mm** (51→55) |
| Balkenoberkante vorne | Falz + 2.1 | unverändert Falz + 2.1 (= 40.3) |
| Paneelunterkante hinten | ~52.4 (extrapoliert) | **55.0** — Blau berührt die Unterkante |
| Falz/Balken hinten | 42.2 / 45.5 | unverändert |

Unverändert übernommen (gemessen): Öffnungsgeometrie vorne (hintere Keile
39.4→40.7 bzw. 45.8→44.5 über die 2.1 mm; vordere Innenkanten mit Steigung
0.5 nach aussen), Kontaktblock (Icons Ø 6 mm, Zentren x 9.8 / y 8.1, 16.0,
23.9; Text ab x 15.2, Zeilenraster 3.2 mm), QR 11.85 mm bei (67.3, 10.1),
Designseite-Logoblock (Glyphe 8.2 mm ab y 14.2, Wortmarke ab 23.6, Slogan
28.9 — horizontal auf Kartenmitte 42.5 zentriert; Erics Foto war links
beschnitten, darum wirkt die Referenz nach rechts versetzt).

## Farben & Schrift

- Azur `#2ea7e0`, dunkles Azur `#1e86bd`, Navy (kleine Ringfigur) `#1c4e79`,
  Balken `#0b0d10`, Textgrau `#2f3031`, PRO-Grau hinten `#71767c`.
- **Farbwahrheit = Mockup-Render** (`referenz_socialpro.jpg`, Median #53b8e4).
  Erics Frontfoto zeigt das Band weissabgleich-bedingt royalblau — nicht
  übernehmen; sein Rückseitenfoto (#09aef1) bestätigt Azur.
- Schrift: **Century Gothic** (installiert), läuft breiter als die
  Vorlagenschrift → horizontal gestaucht: Wortmarke 84 % (vorne 80 %),
  Kontakttext 87 % (`scale(x: …)`-Trick in `nachbau.typ`).
- «PRO» ist **fett wie SOCIAL, nur grau** (nicht dünn). Icons: `☎` aus
  Segoe UI Symbol, Globus `\u{E774}` und Ortsmarke `\u{E707}` aus Segoe MDL2
  Assets (E717/E718 sind die falschen Glyphen: moderner Hörer / Pinnnadel).

## Bekannte Näherungen

QR-Inhalt ist Platzhalter (Original nicht dekodierbar) · Logo-Glyphe aus
Kreisen/Punkten nachgebaut (Original evtl. mit variabler Strichstärke) ·
Eckenradius (~3 mm, gestanzt) wird nicht gezeichnet · Rückseiten-Vertikallage
trug ±2–3 mm Unsicherheit (Foto unten mitten im Band beschnitten).

## Mess-Pipeline (Skript-Inventar)

Gültig / zuletzt massgeblich:

- `aufbereiten2.py` — Master **vorne**: Y-Skala über Icon-Rundheit (k = 0.77),
  QR-Quadrat als unabhängige Bestätigung (118×119 ✓).
- `aufbereiten4.py` — Master **hinten**: k = 0.64 (Glyphe ~quadratisch),
  oben geankert; bestätigt über die k-freie interne Ratio-Probe
  (Bandoberkante−Wortmarke)/Kapitälchenhöhe.
- `messdetails.py`, `messdetails2.py` — Detailmasse: Bandzeilen-Läufe,
  Öffnungsprofil, Textboxen, QR-Bbox, Mockup-Farbquartile.
- `zoomvergleich.py` — Zonen-Zooms Referenz/Nachbau übereinander.
- `bauen_nachbau.py` — QR + Kompilat + Vergleichsblätter + Font-Probe.

Überholt (als Methoden-Doku behalten): `gitter.py`, `eckenhilfe.py`,
`entzerren.py`, `uebersicht.py`, `kantenfenster.py`, `messkanten*.py`
(Homographie-Entzerrung des Mockups — scheiterte an den zu hellen
Schattenfugen der aufgefächerten Unterkarten), `aufbereiten.py`/`aufbereiten3.py`
(falsche Kalibrier-Annahmen, durch v2/v4 ersetzt).

## Lehren für künftige Bild-Nachbauten

1. **Nie aus Read-Anzeigen ablesen** — die Anzeigegrösse erzeugter Bilder ist
   unvorhersehbar (mal 1:1, mal 4× verkleinert). Numerisch messen.
2. **Rundheits-/Quadrat-Anker** (Icon-Kreise, QR) lösen anisotrope
   Foto-Verzerrung; k-freie interne Verhältnisse als Gegenprobe.
3. Mockup-Render = Farbwahrheit, gerades Foto = Geometriewahrheit,
   **physische Karte (Eric) schlägt beides** — die Weiss-Zone zwischen den
   Falzen war im Foto komplett abgesoffen (als «dunkel» gemessen) und nur
   durch Erics Blick zu klären.
4. Iterieren in kleinen Runden mit Vergleichsblatt (Referenz oben / Nachbau
   unten); Erics Beschreibungen in Konstruktions-Sprache («knickt sich,
   konisch, öffnet sich») ernst nehmen — sie waren jedes Mal präziser als
   meine Pixel-Deutung.
