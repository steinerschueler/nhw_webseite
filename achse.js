/* Sprungmarken an den Stationen der Achse (Gestaltung: achse.css).
   Jede Station (Punkt auf der senkrechten Linie) bekommt kleine Marken, hohle Dreiecke:
     nach oben:  ganz nach oben (mit Querstrich) · zum vorherigen Punkt
     nach unten: zum nächsten Punkt · ganz nach unten (mit Querstrich)
   Der oberste Punkt hat nur die Marken nach unten, der letzte keine zum nächsten.

   Breites Fenster: die Marken stehen links der Linie, über und unter der Zahl.
   Nach einem Sprung steht die Zahl direkt unter der Navigation; die oberen
   Marken liegen dann knapp darüber und erscheinen erst, wenn man leicht nach
   oben rollt.
   Schmales Fenster (Handy): die Marken stehen als Reihe rechts, bei Textzeilen
   auf der Zeile, bei Karten über der rechten oberen Ecke.
   Kalender: eine weitere Reihe steht über dem laufenden Monat.

   Lage und Aussehen regelt achse.css (.pf-reihe, .pf), hier steht nur das
   Verhalten. Ohne JavaScript fehlen die Marken, die Seite bleibt vollständig. */
(function () {
  "use strict";

  var STATIONEN = ".kick, .sec > .eyebrow, .tblock, .chap-block, .icard, .cal-year, .calc-main h2, .cta p";
  var OHNE_ZAHL = ".kick, .cta p";
  var KARTEN = ".tblock, .chap-block, .icard";      /* schmal: Marken sitzen über der Karte */
  var SCHMAL = "(max-width:820px)";                 /* gleiche Grenze wie in achse.css */

  var ZEICHEN = {
    anfang:  '<path d="M2.5 2H13.5"/><path class="fl" d="M8 5 13.5 14H2.5Z"/>',
    zurueck: '<path class="fl" d="M8 3.5 13.5 12.5H2.5Z"/>',
    weiter:  '<path class="fl" d="M2.5 3.5H13.5L8 12.5Z"/>',
    ende:    '<path class="fl" d="M2.5 2H13.5L8 11Z"/><path d="M2.5 14H13.5"/>'
  };

  var punkte = Array.prototype.slice.call(document.querySelectorAll(STATIONEN));
  if (punkte.length < 2) return;

  function trifft(abfrage) {
    return !!(window.matchMedia && window.matchMedia(abfrage).matches);
  }
  function rollen(y) {
    var ruhig = trifft("(prefers-reduced-motion: reduce)");
    window.scrollTo({top: Math.max(0, y), behavior: ruhig ? "instant" : "smooth"});
  }
  /* Höhe dessen, was oben am Fenster kleben bleibt (Navigation, Kalenderleiste) */
  function kopf() {
    var h = 0;
    ["header.nav", ".cal-toolbar"].forEach(function (s) {
      var e = document.querySelector(s);
      if (e && getComputedStyle(e).position === "sticky") h += e.offsetHeight;
    });
    return h;
  }
  function ohneZahl(el) {
    return el.matches(OHNE_ZAHL) || (el.matches(".calc-main h2") && !el.querySelector(".st"));
  }
  function zuPunkt(el) {
    var oberkante = window.pageYOffset + el.getBoundingClientRect().top;
    if (trifft(SCHMAL)) {
      /* Stationszeile samt Markenreihe unter den Kopf setzen */
      rollen(oberkante - kopf() - (el.matches(KARTEN) ? 44 : 14));
      return;
    }
    /* Zahl (oder Quadrat) knapp unter den Kopf setzen, die oberen Marken liegen dann dahinter */
    var oben = parseFloat(getComputedStyle(el).getPropertyValue("--st-oben")) || 4;
    rollen(oberkante + el.clientTop + oben - (ohneZahl(el) ? 4 : 14) - kopf());
  }

  function marke(art, titel, ziel) {
    var a = document.createElement("a");
    a.href = "#";
    a.title = titel;
    a.setAttribute("aria-label", titel);
    a.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true">' + ZEICHEN[art] + "</svg>";
    a.addEventListener("click", function (e) { e.preventDefault(); ziel(); });
    return a;
  }
  function gruppe(klasse, marken) {
    var g = document.createElement("span");
    g.className = klasse;
    marken.forEach(function (m) { g.appendChild(m); });
    return g;
  }

  punkte.forEach(function (el, i) {
    var auf = [], ab = [], gruppen = [];
    if (i > 0) {
      auf.push(marke("anfang", "Ganz nach oben", function () { rollen(0); }));
      auf.push(marke("zurueck", "Zum vorherigen Punkt", function () { zuPunkt(punkte[i - 1]); }));
      gruppen.push(gruppe("pf pf-auf", auf));
    }
    if (i < punkte.length - 1) {
      ab.push(marke("weiter", "Zum nächsten Punkt", function () { zuPunkt(punkte[i + 1]); }));
    }
    ab.push(marke("ende", "Ganz nach unten", function () { rollen(document.documentElement.scrollHeight); }));
    gruppen.push(gruppe("pf pf-ab", ab));
    if (ohneZahl(el)) el.classList.add("pf-ohne");
    /* als erstes Kind: schmal schwebt die Reihe rechts auf der ersten Textzeile */
    el.insertBefore(gruppe("pf-reihe", gruppen), el.firstChild);
  });

  /* Kalender: eine weitere Reihe über dem laufenden Monat, weil die Seite dort
     aufgeht und die Jahres-Station weit darüber liegt. Sie führt zum Anfang
     dieses und des nächsten Jahres sowie ganz nach oben und ganz nach unten.
     Die Monatskarte heisst m-JJJJ-M (M ab 0), wie in kalender.html. */
  var heute = new Date();
  var karte = document.getElementById("m-" + heute.getFullYear() + "-" + heute.getMonth());
  if (karte) {
    var dieses = karte.parentNode.previousElementSibling;   /* .cal-year vor den Monaten dieses Jahres */
    var naechstes = karte.parentNode.nextElementSibling;    /* .cal-year des Folgejahrs, falls gezeigt */
    var reihe = [marke("anfang", "Ganz nach oben", function () { rollen(0); })];
    if (dieses && dieses.matches(".cal-year")) {
      reihe.push(marke("zurueck", "Zum Jahresanfang " + dieses.textContent.trim(), function () { zuPunkt(dieses); }));
    }
    if (naechstes && naechstes.matches(".cal-year")) {
      reihe.push(marke("weiter", "Zum Jahresanfang " + naechstes.textContent.trim(), function () { zuPunkt(naechstes); }));
    }
    reihe.push(marke("ende", "Ganz nach unten", function () { rollen(document.documentElement.scrollHeight); }));
    karte.classList.add("pf-hier");
    karte.insertBefore(gruppe("pf pf-monat", reihe), karte.firstChild);
  }
})();
