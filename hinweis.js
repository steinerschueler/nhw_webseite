/* ================================================================
   HINWEISBALKEN OBEN  —  hier nur die letzte Zeile anpassen.

   Der Balken ganz oben auf jeder Seite. Standard: er erscheint gar
   nicht. Drei Möglichkeiten:

   ""        kein Balken. Die Seite beginnt direkt mit dem Kopf.
             (Das ist der Normalfall.)

   "auto"    Verfügbarkeits-Pille aus verfuegbarkeit.js:
             liegt VERFUEGBAR_AB in der Zukunft, erscheint rot
             "Momentan nicht verfügbar - ab <Datum> buchbar";
             sonst grün "Jetzt verfügbar - kurzfristige Einsätze
             möglich".

   "<Text>"  Dein eigener Hinweis, rot hervorgehoben. Zum Beispiel:
             "Betriebsferien vom 20. Dezember bis 4. Januar"
             "Neu: Notstromer-Einsätze auch am Wochenende"
             Kurz halten, der Balken ist eine Zeile.

   ---------------------------------------------------------------
   Nicht zu verwechseln mit verfuegbarkeit.js: das Datum dort färbt
   ausserdem alle Kalendertage davor grau. Diese Datei steuert nur,
   ob und was oben im Balken steht - und das Toolkit fasst sie nie
   an, dein Text bleibt also über jeden Kalender-Export hinweg stehen.
   ================================================================ */

window.HINWEIS = "";
