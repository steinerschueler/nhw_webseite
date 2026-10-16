/* Sprungmarken an den Stationen der Achse (Gestaltung: achse.css).
   Jede Station (Punkt auf der senkrechten Linie) bekommt kleine Marken, hohle Dreiecke:
     nach oben:  ganz nach oben (mit Querstrich) · zum vorherigen Punkt
     nach unten: zum nächsten Punkt · ganz nach unten (mit Querstrich)
   Der oberste Punkt hat nur die Marken nach unten, der letzte keine zum nächsten.

   Ein System für alle Seiten: Nach jedem Sprung steht die Markengruppe der Zielstation
   an derselben Stelle des Fensters wie die Gruppe der obersten Station bei Seitenanfang.
   So führt dieselbe Marke unter dem Zeiger mit jedem Klick eine Station weiter, bis zum
   Schluss der Seite (erst dort, wo die Seite nicht mehr weiter rollen kann, weicht die
   Lage ab). Breites Fenster: die Marken stehen links der Linie, über und unter der Zahl;
   die oberen Marken liegen nach dem Sprung knapp unter der Navigation. Schmales Fenster
   (Handy): die Marken stehen als Reihe rechts, bei Textzeilen auf der Zeile, bei Karten
   über der rechten oberen Ecke.
   Kalender: Stationen sind die Jahre und jede weitere Monatsreihe (die erste Karte jeder
   Reihe); die Reihen hängen von der Fensterbreite ab, darum werden die Marken nach einer
   Grössenänderung neu gesetzt.

   Seiten mit Reitern lösen nach einem Wechsel das Ereignis "achse-neu" aus.

   Lage und Aussehen regelt achse.css (.pf-reihe, .pf), hier steht nur das
   Verhalten. Ohne JavaScript fehlen die Marken, die Seite bleibt vollständig. */
(function () {
  "use strict";

  var STATIONEN = ".kick, .sec > .eyebrow, .tblock, .chap-block, .icard, .cal-year, .cal-month, .calc-main h2, .cta p";
  var OHNE_ZAHL = ".kick, .cta p";
  var SCHMAL = "(max-width:820px)";                 /* gleiche Grenze wie in achse.css */
  var MINDEST = {breit: 32, schmal: 14};            /* Abstand der Markengruppe zum Kopf, wenn die oberste Station näher sitzt */

  var ZEICHEN = {
    anfang:  '<path d="M2.5 2H13.5"/><path class="fl" d="M8 5 13.5 14H2.5Z"/>',
    zurueck: '<path class="fl" d="M8 3.5 13.5 12.5H2.5Z"/>',
    weiter:  '<path class="fl" d="M2.5 3.5H13.5L8 12.5Z"/>',
    ende:    '<path class="fl" d="M2.5 2H13.5L8 11Z"/><path d="M2.5 14H13.5"/>'
  };

  var punkte = [];

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
  function oberkante(node) {
    return window.pageYOffset + node.getBoundingClientRect().top;
  }
  /* Der Anker einer Station ist die Gruppe, die nach dem Sprung unter dem Zeiger liegen soll:
     breit die Marken nach unten (die Reihe selbst hat als display:contents keinen Kasten),
     schmal die ganze Reihe */
  function anker(el) {
    return el.querySelector(trifft(SCHMAL) ? ".pf-reihe" : ".pf-ab") || el;
  }
  /* Abstand des Ankers zum Kopf nach einem Sprung: so weit, wie der Anker der obersten
     Station bei Seitenanfang unter dem Kopf steht, mindestens aber MINDEST */
  function landung() {
    var schmal = trifft(SCHMAL), mindest = schmal ? MINDEST.schmal : MINDEST.breit;
    if (!punkte.length || !punkte[0].matches(".kick")) return mindest;
    return Math.max(mindest, oberkante(anker(punkte[0])) - kopf());
  }
  function zuPunkt(el) {
    rollen(oberkante(anker(el)) - kopf() - landung());
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

  /* Kalender: eine Monatskarte ist Station, wenn sie eine neue Reihe beginnt, ausser der
     ersten Karte eines Jahres (dort steht schon die Jahres-Station). */
  function istStation(el) {
    if (!el.matches(".cal-month")) return true;
    var vor = el.previousElementSibling;
    return !!vor && vor.offsetTop !== el.offsetTop;
  }

  function abbauen() {
    Array.prototype.forEach.call(document.querySelectorAll(".pf-reihe"), function (r) { r.parentNode.removeChild(r); });
    Array.prototype.forEach.call(document.querySelectorAll(".pf-ohne, .pf-station"), function (el) {
      el.classList.remove("pf-ohne"); el.classList.remove("pf-station");
    });
  }

  function bauen() {
    abbauen();
    punkte = Array.prototype.slice.call(document.querySelectorAll(STATIONEN)).filter(function (el) { return el.getClientRects().length > 0; }).filter(istStation);
    if (punkte.length < 2) { punkte = []; return; }

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
      if (el.matches(".cal-month")) el.classList.add("pf-station");
      /* als erstes Kind: schmal schwebt die Reihe rechts auf der ersten Textzeile */
      el.insertBefore(gruppe("pf-reihe", gruppen), el.firstChild);
    });
  }

  bauen();
  /* Seiten mit Reitern (Vertragswerk) melden einen Wechsel; versteckte Stationen zählen nicht */
  document.addEventListener("achse-neu", bauen);

  /* Die Monatsreihen des Kalenders und die Grenze breit/schmal hängen von der Fensterbreite ab */
  var timer = null;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(bauen, 150);
  });
})();
