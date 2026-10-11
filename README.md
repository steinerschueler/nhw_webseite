# naville-handwerk.ch — öffentliche Webseite

Statischer Webauftritt der **Naville Handwerk GmbH** (Personalverleih im Handwerk, Raum Bern).
Reines HTML/CSS/JS, kein Server nötig.

> **Rolle in der `nhw_*`-Landschaft:** das **öffentliche** Repo (GitHub Pages) — nur
> Website-Dateien, nie private oder Echtdaten. Die massgebliche Landkarte und das Doku-Register
> aller vier `nhw_*`-Verzeichnisse führt der Hub `nhw_tool/doku/landschaft.md`; hier steht nur
> die eigene Rolle, keine zweite Landschafts-Tabelle.

## Inhalt

- `basis.css` — **gemeinsames Grundgerüst** aller Seiten (Schrift, Farbvariablen, Reset,
  Typo, Kopf/Nav + Burger, Verfügbarkeits-Banner, Footer). Design-Änderungen daran wirken
  auf alle Seiten; das `<link>` steht auf jeder Seite **vor** dem `<style>`-Block, darum
  gewinnt bei gleicher Spezifität immer die seitenspezifische Inline-Regel (Overrides).
  Seitenspezifisches CSS bleibt bewusst im jeweiligen `<style>` — kein Build-System.
- `achse.css` — **die Gestaltung «Achse»** (weisser Grund; auf jeder Seite führt eine dünne
  senkrechte Linie von der Navigation bis zum Seitenschluss, die Abschnitte hängen als
  Stationen mit Nummer, Jahr oder Buchstabe daran). Das `<link>` steht auf jeder Seite **nach**
  dem `<style>`-Block und geht darum `basis.css` und den Seiten-Styles vor; ältere Regeln dort
  (Cremegrund, Trennlinien, zentrierte Karten) werden hier übersteuert. Neue Abschnitte bekommen
  ihre Station über die vorhandenen Klassen (`.sec > .eyebrow`, `.tblock`, `.chap-block`,
  `.icard`, `.cal-year`, `.calc-main h2`); ein Abschnitt ohne solche Klasse trägt die Linie über
  die Klasse `achse`.
- `achse.js` — Sprungmarken an den Stationen (hohle Dreiecke: vorheriger und nächster Punkt,
  ganz nach oben, ganz nach unten; im Kalender zusätzlich über dem laufenden Monat). Reines
  Verhalten, die Lage regelt `achse.css`; ohne JavaScript fehlen nur die Marken.
- **Navigation** (Kopfzeile jeder Seite, `<nav class="nav-links">`): drei Gruppen mit ihren
  Seiten, in jeder Seite derselbe HTML-Block. **Willkommen**: Startseite und ihre Abschnitte
  (Wann ich einspringe, Zur Firma, Über mich, Wie ich arbeite, Kontakt) · **Infos**: Was du von
  mir hast, FAQ (später Dokumente) · **Werkzeuge**: Kalender, Preisrechner, Rayon-Rechner.
  Breit stehen die Gruppen in der Kopfzeile und klappen beim Schweben oder per Tastatur auf,
  schmal öffnet der Burger drei Kacheln mit allen Seiten; Regeln in `basis.css`. `nav.js`
  markiert die aktuelle Seite. Eine neue Seite kommt in den Block aller sieben Seiten
  (`index`, `leistungen`, `preisrechner`, `rayon`, `faq`, `kalender`, `impressum`), sonst
  nirgends.
- `index.html` — Startseite
- `leistungen.html` — Was du von mir hast (✓/✗)
- `preisrechner.html` — Stundenansatz-Rechner (Felder verlinkt/rückwärts rechenbar; erzeugt eine
  PDF-Vereinbarung; jsPDF lokal in `vendor/`)
- `rayon.html` + `rayon.js` — Rayon-Rechner zu Ziff. 4 des Verleihvertrags: Wegzeit mit dem Auto
  vom Sitz des Verleihers und vom Sitz des Einsatzbetriebs zur Baustelle, mit Verkehrsprognose
  zur gewählten Abfahrtszeit; beide 15-Minuten-Gebiete auf einer swisstopo-Karte; PDF als Beilage
  zum Einsatzblatt (Abschnitt «Rayon-Rechner» unten)
- `faq.html` — Häufige Fragen (nach Themen gegliedert; Kapitel „Verfügbarkeit")
- `kalender.html` — Jahreskalender (Verfügbarkeit; freie Tage per E-Mail anfragen, kein Backend)
- `impressum.html` — Impressum / Datenschutz
- `verfuegbarkeit.js` — Datum, ab dem wieder Tage buchbar sind; **wird vom Admin-Toolkit
  generiert** (siehe unten). Im Kalender erscheinen alle Tage davor grau.
- `hinweis.js` — der Hinweisbalken oben: leer = kein Balken (Normalfall), `"auto"` =
  Verfügbarkeits-Anzeige aus `verfuegbarkeit.js`, eigener Text = roter Hinweis. Das Toolkit
  fasst diese Datei nie an. `banner.js` rendert den Balken.
- `kalender.js` — belegte Tage; **wird vom Admin-Toolkit generiert**; die Logik liegt in `kalender.html`
- `bilder/` — die von der Seite **ausgelieferten** Bilder: Kopf-Emblem (`emblem.png`) + Favicon-Satz.
  Die **Design-Quellen** (Logos, Merch, Visitenkarte) liegen privat im Marken-Hub des
  Daten-Repos — **nicht** in diesem öffentlichen Repo.
- `fonts/archivo-600.woff2` (+ `OFL.txt`) — Display-Schrift (self-hosted)
- Icons: `favicon.svg` (Root) + `bilder/` (`favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`); `site.webmanifest`
- `404.html`, `robots.txt`, `sitemap.xml`, `CNAME`

## Verfügbarkeit & Kalender pflegen

Beides pflegt das Admin-Toolkit: Termine in der Werkbank (Reiter «Kalender») bzw.
`naville kalender erfassen …`, dann `naville kalender webexport [--verfuegbar-ab JJJJ-MM-TT]`
— der Export schreibt `kalender.js` und `verfuegbarkeit.js` in diesen Klon (Kopfkommentar
«NICHT von Hand ändern»; Inhalt nur Farbe + Datum, keine internen Angaben). Danach committen
und `main` pushen (Deploy).

Notweg ohne Toolkit — in `verfuegbarkeit.js` die eine Zeile von Hand anpassen:

```js
window.VERFUEGBAR_AB = "2026-09-01";   // Format JJJJ-MM-TT;  "" = sofort verfügbar (grün)
```

Der **Jahreskalender** (`kalender.html`) liest dieses Datum: alle Tage **vor** `VERFUEGBAR_AB`
erscheinen grau (noch nicht buchbar). Ein Balken oben auf der Seite erscheint nur, wenn
`hinweis.js` es verlangt (`"auto"`: rot "nicht verfügbar, ab … buchbar", danach grün "jetzt
verfügbar"). Die belegten Einsatztage
stehen in `kalender.js` (gleicher Notweg möglich; der nächste Toolkit-Export überschreibt
Handeinträge).

## Rayon-Rechner (`rayon.html`, `rayon.js`)

Die Seite misst, ob eine Baustelle im Rayon liegt (höchstens 15 Minuten Fahrzeit mit dem Auto ab
einem der beiden Sitze). Sie ist statisch und ruft zwei fremde Dienste direkt aus dem Browser
auf, als reine Datenabfragen ohne Anbieter-Bibliothek, ohne Cookies und ohne Speicherung:

| Dienst | Wofür | Schlüssel | Attribution |
|---|---|---|---|
| swisstopo, `api3.geo.admin.ch` (SearchServer) und `wms.geo.admin.ch` (GetMap) | Adressen zu Koordinaten; Kartenbild (Landeskarte grau, LV95) | keiner | «© swisstopo» |
| Esri ArcGIS Location Platform, `route-api.arcgis.com` (Route, Service areas) | Fahrzeit mit Verkehrsprognose je Sitz; 15-Minuten-Gebiete | `ESRI_KEY` in `rayon.js` | «Powered by Esri», Strassen- und Verkehrsdaten TomTom |

An Esri gehen nur Koordinaten und die Abfahrtszeit, keine Adresstexte. Die
Datenschutzerklärung in `impressum.html` nennt beide Dienste; wer einen Dienst wechselt, passt
sie im selben Zug an, ebenso die Content-Security-Policy der Seite (`connect-src`, `img-src`).

**Der Esri-Schlüssel** ist ein Browser-Schlüssel: Er steht sichtbar in `rayon.js`, ist im
Esri-Konto (Element «Rayon-Rechner Webseite», Typ API-Schlüssel, öffentliche Anwendung) auf
die Referrer `https://naville-handwerk.ch` und `https://www.naville-handwerk.ch` beschränkt
und auf die zwei Berechtigungen «Einfaches Routing» und «Einzugsgebiet» unter
Positionsservices, und er läuft nach höchstens einem Jahr ab. Esri prüft den Referrer
serverseitig: Aufrufe ohne oder mit fremdem Referrer erhalten «Invalid Token». Das Konto hat kein Zahlungsmittel; wird das
Freikontingent (Routen und Service areas je Monat) überschritten, sperrt Esri bis zum
Monatsanfang, es entstehen keine Kosten. Erneuern oder ersetzen: im Esri-Dashboard einen neuen
Schlüssel mit denselben Einstellungen anlegen, `ESRI_KEY` in `rayon.js` ersetzen, committen,
pushen auf Wort des Inhabers; den alten Schlüssel löschen. **Jede Änderung am Esri-Element**
(Referrer, Berechtigungen) macht den bestehenden Schlüssel sofort ungültig; danach immer neu
generieren und eintragen, sonst meldet die Seite «Invalid Token». Ohne Schlüssel (leer) laufen Adressen
und Karte weiter, nur die Fahrzeit nicht; die Seite sagt das dann.

Vorbelegen lässt sich die Seite über die Adresse: `rayon.html?v=<Sitz Verleiher>&e=<Sitz
Einsatzbetrieb>&b=<Baustelle>&zeit=07:00`.

## Deployment (GitHub Pages)

1. Dieses Repo ist selbst die Pages-Quelle (Branch `main`, Root; `CNAME` liegt bei) —
   **Push auf `main` = Publikation.** Gepusht wird nur auf ausdrücklichen Auftrag des
   Inhabers. Vor der Arbeit und vor dem Push `git fetch` und `git status`: Ein Klon kann
   hinterherhinken.
2. In den Repo-Einstellungen unter *Pages* die Custom Domain `naville-handwerk.ch` setzen und die Domain
   **verifizieren** (TXT-Challenge), **bevor** die DNS-Records gesetzt werden (Schutz vor Takeover).
3. **„Enforce HTTPS"** aktivieren.
4. DNS bei Infomaniak: Apex-A/AAAA auf die GitHub-Pages-IPs, `www` als CNAME, **CAA `0 issue "letsencrypt.org"`**
   (sonst kein HTTPS-Zertifikat). E-Mail (MX/SPF/DKIM/DMARC) läuft getrennt über Infomaniak.

## Sicherheit — bitte unbedingt beachten

- **Nur Website-Dateien gehören in dieses öffentliche Repo.** Interne Notizen, Strategie- und
  Geschäftsdokumente liegen getrennt in den privaten Arbeitsrepos — nie hierher kopieren.
  Das gilt auch für Kommentare im Quelltext: Sie werden mit ausgeliefert und tragen keine
  internen Überlegungen (Preisstrategie, wer wann was entschied).
- **Niemals Geheimnisse oder Personendaten committen:** keine API-Keys, Passwörter, SMTP-/DKIM-Schlüssel,
  keine Kundendaten, Wochenrapporte oder Rechnungen. Ein öffentliches Repo ist weltweit lesbar und bleibt
  **dauerhaft in der Git-History** (auch nach dem Löschen). `.gitignore` ist **keine** Sicherheitsschicht.
- In den Repo-Einstellungen **Secret Scanning + Push Protection** aktivieren (gratis für öffentliche Repos).
- Bei versehentlichem Leak: **zuerst den Schlüssel rotieren/widerrufen**, dann die History bereinigen.
- **jsPDF ist bewusst lokal** in `vendor/jspdf.umd.min.js` eingebunden (Version 2.5.1), nicht über ein CDN —
  das vermeidet Supply-Chain-Risiken. SRI-Hash zur Kontrolle:
  `sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==`
- Jede Seite trägt eine Content-Security-Policy (per `<meta>`). Echte Header (HSTS, X-Frame-Options) kann
  GitHub Pages nicht setzen — bei Bedarf Cloudflare (gratis) davorschalten. `rayon.html` erlaubt
  zusätzlich die Dienste von swisstopo und Esri (`connect-src`, `img-src`), sonst nichts Fremdes.
- **Ausnahme vom Schlüssel-Verbot:** Der Esri-Schlüssel in `rayon.js` ist kein Geheimnis. Er steht
  in der ausgelieferten Seite, ist auf die Referrer dieser Domain und das Privileg Routing
  beschränkt, läuft nach höchstens einem Jahr ab, und das Konto hat kein Zahlungsmittel (Abschnitt
  «Rayon-Rechner»). Jeder andere Schlüssel bleibt draussen.

## Geschützte Funktionen gehören NICHT hierher

Login, Wochenrapporte, Rechnungen und Automatisierung dürfen **nicht** auf GitHub Pages laufen (statisch,
öffentlich). Sie gehören als **getrennte App mit Backend** (Auth + Datenbank) auf eine eigene Subdomain
(z. B. `app.naville-handwerk.ch`). Das Sicherheitskonzept dazu ist intern dokumentiert.

## Lokale Arbeitsdateien

`tmp/` (gitignoriert) hält Ansichten, Design-Versuche und Prüfwerkzeuge; es wird nie
ausgeliefert. `graphify-out/` ist der lokale Wissensgraph des Codes.
