Naville Handwerk — Merch (Druckdateien fuer Shirts, Aufkleber usw.)
==================================================================
Stand: 2026-08-01. Abgeleitet aus den Master-Quellen in ../brand/
(Wortmarke, Emblem, Archivo-Schrift). Merch wird schon vor der Gruendung
produziert -> standardmaessig OHNE "i.G." (siehe entferne_ig-Skripte).

Farben: Rot #C1121C · Schwarz #000000 · Anthrazit #23252B · Creme #EFEEE8


Gestapelte Wortmarke (T-Shirt, NEU 2026-08-01)
----------------------------------------------
- tshirt_wortmarke_gestapelt.png     Bestell-/Druckdatei
- erzeuge_wortmarke_gestapelt.py     Quelle/Regenerator (PIL + Archivo-TTF)

  "naville" (schwarz) ueber "handwerk" (rot), zentriert und gestapelt, auf
  abgerundeter Creme-Karte (#EFEEE8); ausserhalb der Rundung transparent,
  laeuft also auf jeder Shirt-Farbe. Eine Datei fuer linke Brust (klein) und
  Ruecken (gross) -- im Druck einfach skalieren. Aktuell 3088x1599 px
  (~26 cm bei 300 dpi).

  Gestaltungs-Entscheid (Eric): "naville" ist so weit vergroessert, dass es
  exakt dieselbe Breite wie "handwerk" hat -> beide Zeilen kantenbuendig,
  "naville" tritt als grosse Kopfzeile hervor. "naville" bewusst reines
  SCHWARZ (nicht das Marken-Anthrazit der einzeiligen Wortmarke).

  Stellschrauben oben im Skript: ZIEL_TEXTBREITE (Aufloesung), GAP
  (Zeilenabstand), PAD_X/PAD_Y (Innenrand), RADIUS (Ecken). Neu bauen:
      PYTHONUTF8=1 python design/merch/erzeuge_wortmarke_gestapelt.py

  Verworfene Varianten (nicht mehr im Ordner): gleich grosse Zeilen
  (naville = handwerk-Groesse) sowie Zwischenstufen mit mehr Rand / engerem
  Zeilenabstand. Zum Zurueckholen im Skript F_n = F setzen bzw. PAD_*/GAP
  anpassen.


Weitere Merch-Dateien (bestehend)
---------------------------------
- tshirt_vorderseite_wortmarke.png   einzeilige Wortmarke auf weisser Karte
- tshirt_rueckseite_velo.png         Emblem (Lastenvelo + Anhaenger), ohne i.G.
- erzeuge_tshirt_logos.py            erzeugt die zwei obigen (weisse Rundkarte)
- entferne_ig.py                     entfernt "i.G." vom Emblem (Master)
- entferne_ig_logos.py               entfernt "i.G." satzweise mit_iG/ -> logo/

Alle PNGs sind regenerierbar; Quelle der Wahrheit sind ../brand/ + die Skripte.
