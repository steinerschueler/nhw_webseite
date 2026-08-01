# naville-handwerk.ch — öffentliche Webseite

Statischer Webauftritt der **Naville Handwerk GmbH i.G.** (Personalverleih im Handwerk, Raum Bern).
Reines HTML/CSS/JS, kein Server nötig.

## Inhalt

- `index.html` — Startseite
- `leistungen.html` — Was du von mir hast (✓/✗)
- `preisrechner.html` — Stundenansatz-Rechner (Felder verlinkt/rückwärts rechenbar; erzeugt eine
  PDF-Vereinbarung; jsPDF lokal in `vendor/`)
- `faq.html` — Häufige Fragen (nach Themen gegliedert; Kapitel „Normaltarif & Notstromer")
- `kalender.html` — Jahreskalender (Verfügbarkeit; freie Tage per E-Mail anfragen, kein Backend)
- `impressum.html` — Impressum / Datenschutz
- `verfuegbarkeit.js` — Verfügbarkeits-Datum; **wird vom Admin-Toolkit generiert** (siehe unten);
  `banner.js` rendert die Anzeige
- `kalender.js` — belegte Tage; **wird vom Admin-Toolkit generiert**; die Logik liegt in `kalender.html`
- `design/logo/` — grosse Embleme + Claim-Lockups (`design/grafiken/` = Arbeitsmaterial Piktogramme)
- `fonts/archivo-600.woff2` (+ `OFL.txt`) — Display-Schrift (self-hosted)
- Icons: `favicon.svg` (Root) + `design/icon/` (`favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`); `site.webmanifest`
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

Bis zu diesem Datum zeigt die Seite oben einen roten Balken „nicht verfügbar · ab … buchbar", danach
automatisch grün „jetzt verfügbar". Der **Jahreskalender** (`kalender.html`) liest dasselbe Datum:
alle Tage **vor** `VERFUEGBAR_AB` erscheinen grau (noch nicht buchbar). Die belegten Einsatztage
stehen in `kalender.js` (gleicher Notweg möglich; der nächste Toolkit-Export überschreibt
Handeinträge).

## Deployment (GitHub Pages)

1. Dieses Repo ist selbst die Pages-Quelle (Branch `main`, Root; `CNAME` liegt bei) —
   **Push auf `main` = Publikation.**
2. In den Repo-Einstellungen unter *Pages* die Custom Domain `naville-handwerk.ch` setzen und die Domain
   **verifizieren** (TXT-Challenge), **bevor** die DNS-Records gesetzt werden (Schutz vor Takeover).
3. **„Enforce HTTPS"** aktivieren.
4. DNS bei Infomaniak: Apex-A/AAAA auf die GitHub-Pages-IPs, `www` als CNAME, **CAA `0 issue "letsencrypt.org"`**
   (sonst kein HTTPS-Zertifikat). E-Mail (MX/SPF/DKIM/DMARC) läuft getrennt über Infomaniak.

## Sicherheit — bitte unbedingt beachten

- **Nur Website-Dateien gehören in dieses öffentliche Repo.** Interne Notizen, Strategie- und
  Geschäftsdokumente liegen getrennt in den privaten Arbeitsrepos — nie hierher kopieren.
- **Niemals Geheimnisse oder Personendaten committen:** keine API-Keys, Passwörter, SMTP-/DKIM-Schlüssel,
  keine Kundendaten, Wochenrapporte oder Rechnungen. Ein öffentliches Repo ist weltweit lesbar und bleibt
  **dauerhaft in der Git-History** (auch nach dem Löschen). `.gitignore` ist **keine** Sicherheitsschicht.
- In den Repo-Einstellungen **Secret Scanning + Push Protection** aktivieren (gratis für öffentliche Repos).
- Bei versehentlichem Leak: **zuerst den Schlüssel rotieren/widerrufen**, dann die History bereinigen.
- **jsPDF ist bewusst lokal** in `vendor/jspdf.umd.min.js` eingebunden (Version 2.5.1), nicht über ein CDN —
  das vermeidet Supply-Chain-Risiken. SRI-Hash zur Kontrolle:
  `sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==`
- Jede Seite trägt eine Content-Security-Policy (per `<meta>`). Echte Header (HSTS, X-Frame-Options) kann
  GitHub Pages nicht setzen — bei Bedarf Cloudflare (gratis) davorschalten.

## Geschützte Funktionen gehören NICHT hierher

Login, Wochenrapporte, Rechnungen und Automatisierung dürfen **nicht** auf GitHub Pages laufen (statisch,
öffentlich). Sie gehören als **getrennte App mit Backend** (Auth + Datenbank) auf eine eigene Subdomain
(z. B. `app.naville-handwerk.ch`). Details: Sicherheitskonzept `Sicherheit_Naville_Handwerk.md`
im privaten Arbeitsrepo.
