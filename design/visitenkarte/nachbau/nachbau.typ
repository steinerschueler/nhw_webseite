// Nachbau der SocialPro-Musterkarte (85x55 mm), vermessen aus
// referenz_socialpro.jpg + Erics Draufsicht-Fotos. Seite 1 = Infoseite,
// Seite 2 = Designseite. Alle Masse in mm (Messraster: 10 px = 1 mm).

#set page(width: 85mm, height: 55mm, margin: 0mm, fill: white)
#set text(font: "Century Gothic", fallback: true)

// Farbwerte: Azur aus dem Mockup-Render (Median #53b8e4, leicht gesaettigt),
// dunkleres Azur fuer die hinteren Paneele, Tiefschwarz fuer den Balken.
#let azur = rgb("#2ea7e0")
#let azur-dunkel = rgb("#1e86bd")
#let navy = rgb("#1c4e79")
#let balken = rgb("#0b0d10")
#let textgrau = rgb("#2f3031")
#let praugrau = rgb("#8f959b")

// Personen-Glyphe: zwei Ringfiguren mit Punktkoepfen (linker Ring dunkler,
// Koepfe und grosser Ring in der Hauptfarbe), Referenzhoehe 44 Einheiten.
#let glyphe(hoehe, farbe-gross, farbe-klein) = {
  let e = hoehe / 44
  box(width: 42 * e, height: hoehe, {
    place(dx: 3 * e, dy: 17 * e, circle(radius: 8.5 * e,
      stroke: (paint: farbe-klein, thickness: 5 * e)))
    place(dx: 8 * e, dy: 5 * e, circle(radius: 3.8 * e, fill: farbe-klein))
    place(dx: 15 * e, dy: 13 * e, circle(radius: 12.5 * e,
      stroke: (paint: farbe-gross, thickness: 7.5 * e)))
    place(dx: 30 * e, dy: 2 * e, circle(radius: 5 * e, fill: farbe-gross))
  })
}

// Wortmarke: SOCIAL fett + PRO fett in Zweitfarbe; Century Gothic laeuft
// breiter als die Vorlagenschrift, deshalb horizontal auf 84% gestaucht.
#let wortmarke(groesse, farbe-social, farbe-pro, stauch: 84%) = box(scale(
  x: stauch, origin: left + horizon, reflow: true, {
    text(size: groesse, weight: "bold", fill: farbe-social, tracking: 0mm)[SOCIAL]
    text(size: groesse, weight: "bold", fill: farbe-pro, tracking: 0mm)[PRO]
  }))

// ---------------------------------------------------------------- Infoseite
// Bandhoehe beidseitig gleich: 12.8 mm wie auf der Designseite, darunter
// exakt 4 mm schwarzer Balken bis zur Unterkante (Eric 2026-08-01).
// Falzlinie 38.2, Balkenoberkante 40.3 (2.1 unter dem Falz), Paneele bis 51.
#place(dx: 0mm, dy: 40.3mm, rect(width: 85mm, height: 14.7mm, fill: balken))
// Zwischen den beiden Falzen bleibt die Karte weiss (Eric 2026-08-01):
// die Oeffnung zeigt oberhalb 40.3 Karton, kein Schwarz und kein Navy —
// dort ist schlicht nichts gezeichnet.

// Hintere Paneele (dunkler, ragen ueber den Balken)
#place(polygon(fill: azur-dunkel,
  (0mm, 38.2mm), (39.4mm, 38.2mm), (40.7mm, 40.3mm), (0mm, 40.3mm)))
#place(polygon(fill: azur-dunkel,
  (45.8mm, 38.2mm), (85mm, 38.2mm), (85mm, 40.3mm), (44.5mm, 40.3mm)))

// Vordere Paneele (Azur): reichen bis zur Falzlinie 38.2 hinauf — vorderes
// und hinteres Blau teilen die Oberkante (ein Band, ein Knick); vom dunklen
// hinteren Paneel bleibt nur das Keildreieck an der Oeffnung sichtbar.
#place(polygon(fill: azur,
  (0mm, 38.2mm), (39.4mm, 38.2mm), (33.0mm, 51mm), (0mm, 51mm)))
#place(polygon(fill: azur,
  (45.8mm, 38.2mm), (85mm, 38.2mm), (85mm, 51mm), (52.2mm, 51mm)))

// Name + Titel (linkes Paneel, im 12.8er-Band vertikal zentriert)
#place(dx: 8.6mm, dy: 41.9mm, text(size: 2.75mm, weight: "bold", fill: white,
  tracking: 0.35mm)[SMITH JOHNSON])
#place(dx: 8.6mm, dy: 45.4mm, text(size: 1.45mm, fill: rgb("#cfe8fb"),
  tracking: 0.3mm)[GRAPHIC DESIGNER])

// Wortmarke + Slogan + Glyphe (rechtes Paneel)
#place(dx: 54.2mm, dy: 42.5mm, wortmarke(3.4mm, white, rgb("#dff0fc"), stauch: 80%))
#place(dx: 54.4mm, dy: 46.0mm, text(size: 1.45mm, fill: rgb("#dff0fc"),
  tracking: 0.22mm)[UR SLOGAN HERE])
#place(dx: 69.3mm, dy: 42.1mm, glyphe(4.6mm, white, rgb("#cfe8fb")))

// Kontaktblock: drei Azur-Kreise mit Symbol, daneben je zwei Zeilen
#let icon(dy, schrift, zeichen, groesse) = {
  place(dx: 6.8mm, dy: dy, circle(radius: 3mm, fill: azur))
  place(dx: 6.8mm, dy: dy, box(width: 6mm, height: 6mm,
    align(center + horizon, text(font: schrift, size: groesse,
      fill: white, zeichen))))
}
#icon(5.1mm, "Segoe UI Symbol", "\u{260E}", 3.4mm)
#icon(13.0mm, "Segoe MDL2 Assets", "\u{E774}", 3.1mm)
#icon(20.9mm, "Segoe MDL2 Assets", "\u{E707}", 3.1mm)

#let kzeile(dy, inhalt) = place(dx: 15.2mm, dy: dy,
  box(scale(x: 87%, origin: left + horizon, reflow: true,
    text(size: 2.6mm, fill: textgrau, tracking: 0.1mm, inhalt))))
#kzeile(5.3mm)[+000 12345 6789]
#kzeile(8.5mm)[+000 12345 6789]
#kzeile(13.3mm)[urwebsitename.com]
#kzeile(16.5mm)[urname\@email.com]
#kzeile(20.8mm)[Street Address Here]
#kzeile(24.0mm)[North Canada, 56]

// QR-Code oben rechts (Platzhalterinhalt)
#place(dx: 67.3mm, dy: 10.1mm, image("qr.png", width: 11.85mm))

#pagebreak()

// -------------------------------------------------------------- Designseite
// Logoblock: Glyphe, Wortmarke (SOCIAL dunkel + PRO grau), Slogan
#place(dx: 38.5mm, dy: 14.2mm, glyphe(8.2mm, azur, navy))
#place(dx: 31.4mm, dy: 23.6mm, wortmarke(4.55mm, rgb("#23262b"), rgb("#71767c")))
#place(dx: 0mm, dy: 28.9mm, box(width: 85mm, align(center,
  text(size: 1.95mm, weight: "bold", fill: rgb("#35383c"),
    tracking: 0.24mm)[UR SLOGAN HERE])))

// Balken (Oberkante 45.5) — kein Mittelspalt auf dieser Seite
#place(dx: 0mm, dy: 45.5mm, rect(width: 85mm, height: 9.5mm, fill: balken))

// Hinteres Paneel: ragt oben ueber den Balken hinaus, verjuengt sich nach oben
#place(polygon(fill: azur-dunkel,
  (15.1mm, 42.2mm), (69.9mm, 42.2mm), (72.0mm, 45.5mm), (13.0mm, 45.5mm)))

// Vorderes Paneel: teilt die Falz-Oberkante (42.2) mit dem hinteren Paneel
// und verjuengt sich nach unten bis an die Kartenunterkante (Eric
// 2026-08-01) — der Balken bleibt nur seitlich davon sichtbar.
#place(polygon(fill: azur,
  (15.1mm, 42.2mm), (69.9mm, 42.2mm), (65.3mm, 55mm), (19.7mm, 55mm)))

// Webadresse auf dem vorderen Paneel
#place(dx: 0mm, dy: 47.9mm, box(width: 85mm, align(center,
  text(size: 1.55mm, fill: white, tracking: 0.25mm)[
    #box(baseline: 0.3mm, text(font: "Segoe MDL2 Assets", size: 1.7mm)[\u{E774}])
    #h(0.8mm) www.yourwebsite.com])))
