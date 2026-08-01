# Visitenkarte — Arbeitsordner

Design-Arbeitsordner für die Visitenkarte der Naville Handwerk GmbH und für
Referenzstudien. Stand 2026-08-01.

## Inhalt

| Pfad | Was |
|---|---|
| `referenz_socialpro.jpg` | Externes Vorbild: Mockup-Foto der «SocialPro»-Musterkarte (zwei Stapel, perspektivisch gedreht). Eric besitzt die **physische Karte**. |
| `referenz_gerade.png` | Dasselbe Foto, nur um 45° rotiert (Altversuch, wenig nützlich — Karten dadurch nicht entzerrt). |
| `nachbau/` | **Kompletter Typst-Nachbau der SocialPro-Karte** (2026-08-01) samt Mess-Pipeline und Vergleichsbildern. Details: `nachbau/README.md`. |

## Wo ist die Konzept-A-Arbeit?

Laut früherer Session (vgl. Claude-Memory `visitenkarte-design`) lagen hier
Analyse, Entwürfe und ein Typst-Prototyp «Konzept A» für die **eigene**
NHW-Karte (Archivo-Pipeline, echte Kontaktdaten); der `.gitignore`-Kommentar
referenziert noch `bauen.py` und eine `.typ`-Quelle mit der
Geschäfts-Telefonnummer. **In diesem Windows-Klon ist davon nichts vorhanden**
(Ordner ist komplett untracked, nie committet). Bei Bedarf auf dem
Ubuntu-Rechner suchen, bevor etwas neu gebaut wird.

## Git-Lage (wichtig)

- Der ganze Ordner ist **untracked**; committet wird laut `.gitignore`-Kommentar
  nur Quelltext (`.typ`/`.py`), Reports (`.md`), README — Bilder/PDFs nie.
- `nhw_webseite` ist ein **öffentliches** Repo. Der Nachbau ist die Studie eines
  **fremden** Templates und die Referenzfotos sind fremdes Material — beides
  gehört nicht in den öffentlichen Auftritt. Commit/Push nur auf Erics Wort.
