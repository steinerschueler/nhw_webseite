/* Hinweisbalken oben — rendert, was window.HINWEIS verlangt (hinweis.js).
   Nicht bearbeiten; gesteuert wird über hinweis.js bzw. verfuegbarkeit.js.

   ""      -> gar kein Balken (Standard; das Element bleibt `hidden`)
   "auto"  -> Verfügbarkeits-Pille aus VERFUEGBAR_AB, rot bzw. grün
   <Text>  -> eigener Hinweis, rot hervorgehoben

   Die Verfügbarkeits-Logik bleibt bewusst vollständig erhalten, auch
   wenn sie im Standardfall nicht läuft: sie ist einen Handgriff in
   hinweis.js entfernt. */
(function () {
  var bar = document.getElementById("availbar");
  var txt = document.getElementById("availtext");
  if (!bar || !txt) return;

  var hinweis = (window.HINWEIS || "").trim();
  if (!hinweis) return;                       // nichts zu sagen — Balken bleibt weg

  if (hinweis !== "auto") {                   // eigener Text
    bar.className = "availbar av-off";
    txt.textContent = hinweis;
    bar.hidden = false;
    return;
  }

  var M = ["Januar","Februar","März","April","Mai","Juni","Juli","August",
           "September","Oktober","November","Dezember"];
  var raw = (window.VERFUEGBAR_AB || "").trim();
  var today = new Date(); today.setHours(0, 0, 0, 0);

  var off = false, dateStr = "";
  var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (m) {
    var d = new Date(+m[1], +m[2] - 1, +m[3]); d.setHours(0, 0, 0, 0);
    if (!isNaN(d.getTime()) && d.getTime() > today.getTime()) {
      off = true;
      dateStr = d.getDate() + ". " + M[d.getMonth()] + " " + d.getFullYear();
    }
  }

  if (off) {
    bar.className = "availbar av-off";
    txt.innerHTML = "Momentan nicht verfügbar · <b>ab " + dateStr + "</b> buchbar";
  } else {
    bar.className = "availbar av-on";
    txt.innerHTML = "<b>Jetzt verfügbar</b> · kurzfristige Einsätze möglich";
  }
  bar.hidden = false;
})();
