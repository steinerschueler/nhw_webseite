/* Vertragswerk, Erläuterungen: entstehen aus der Auswahl des Nutzers.
   VW.ERL.vv und VW.ERL.av enthalten je Ziffer-ID eine Funktion (o, f, z) -> Blöcke; o ist die
   Auswahl, f die Felder des Blatts, z die gezählte Ziffer (z.abs mit Buchstaben). `_vorspann` steht
   vor der ersten Ziffer. Blöcke: Text; {liste: [...]}; {tabelle: {kopf: [...], zeilen: [[...]]}};
   {beispiel: "..."}; {hinweis: "..."}; {quellen: [{t, url}]}. Texte dürfen die Marken der
   Vertragstexte enthalten ({R:ort.rayon}, {Z@av:lohn}). */
(function (G) {
  "use strict";
  var VW = G.VW = G.VW || {};
  VW.ERL = VW.ERL || {};
  VW.ERL.vv = VW.ERL.vv || {};
  VW.ERL.av = VW.ERL.av || {};
})(typeof window !== "undefined" ? window : globalThis);
