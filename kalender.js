/* ================================================================
   JAHRESKALENDER  —  hier nur die DATEN pflegen, sonst nichts.

   Jede Zeile unten ist eine Liste von Tagen. Nicht eingetragene
   Tage sind automatisch GRÜN (frei — hier kann angefragt werden).
   Feiertage NICHT eintragen, die rechnet der Kalender selbst aus.

   ---------------------------------------------------------------
   SO SCHREIBST DU EIN DATUM
   ---------------------------------------------------------------
   Immer im Format  "JJJJ-MM-TT"  (Jahr-Monat-Tag), z. B. "2026-09-14".

   Einzelner Tag :  "2026-09-23"
   Mehrere Tage  :  "2026-09-14/2026-09-18"   (von / bis, beide inkl.)
                    -> das sind Mo 14. bis Fr 18. September.

   Mehrere Einträge mit Komma trennen, alle in [ eckigen Klammern ]:
       normal: ["2026-09-14/2026-09-18", "2026-10-01"],

   ---------------------------------------------------------------
   DIE FÜNF LISTEN — WAS WELCHE FARBE GIBT
   ---------------------------------------------------------------
   normal        ORANGE  Einsatz zum Normaltarif 67.-
   notstromer    ROT     Notstromer-Einsatz 76.50
                 (verdrängt: schlägt einen orangen/grünen Tag)

   Die restlichen drei werden alle GRAU ("nicht verfügbar"). Der
   Listenname bestimmt nur, welches Wort auf dem Tag steht:
   ferien        GRAU, Wort "Ferien"
   weiterbildung GRAU, Wort "Weiterbildung / Messe"
   termin        GRAU, Wort "Termin"   (Bank, Arzt, Anwalt …)
   ausfall       GRAU, Wort "krank / Unfall"

   Warum getrennte Listen, wenn eh alles grau ist? Damit du sie
   bequem pflegen kannst und der richtige Text von selbst erscheint.

   ---------------------------------------------------------------
   ZWEI DINGE MUSST DU NICHT EINTRAGEN — die rechnet der Kalender:
   1. Feiertage (Kanton Bern) stehen bewusst NICHT drin.
   2. Alle Tage VOR dem Startdatum (verfuegbarkeit.js -> VERFUEGBAR_AB,
      z. Zt. 1. September 2026) werden automatisch grau. Vorher nimmt
      die Firma noch nicht auf; du musst diese Monate nicht füllen.

   Trag hier also nur deine echten Tage AB dem Start ein.
   ================================================================ */

window.KALENDER = {
  normal:     [],                 // ORANGE — Einsatz zu 67.-
  notstromer: [],                 // ROT    — Einsatz zu 76.50

  ferien:        [],              // grau, „Ferien"
  weiterbildung: ["2026-09-09"],  // grau, „Weiterbildung / Messe" — Ineltec (Elektrikermesse)
  termin:        [],              // grau, „Termin"
  ausfall:       [],              // grau, „krank / Unfall"
};
