/* Navigation: markiert die aktuelle Seite (.on an der Seite und an ihrer Gruppe).
   Die drei Gruppen Willkommen, Infos und Werkzeuge stehen in jeder Seite gleich im HTML
   (header.nav); Aussehen und Aufklappen regelt basis.css ohne JavaScript. Ohne JavaScript
   fehlt nur die Markierung der aktuellen Seite. */
(function () {
  "use strict";
  var datei = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var links = document.querySelectorAll(".nav-links .ng-p a");
  for (var i = 0; i < links.length; i++) {
    var a = links[i], ziel = (a.getAttribute("href") || "").split("#"), seite = (ziel[0] || "index.html").toLowerCase();
    if (seite !== datei) continue;
    var gruppe = a.parentNode.parentNode.querySelector(".ng-t");
    if (gruppe) gruppe.classList.add("on");
    /* Sprungziele der Startseite: nur das passende, sonst der Eintrag ohne Sprungziel */
    if (ziel.length > 1 ? "#" + ziel[1] === location.hash : !location.hash || !document.querySelector(".nav-links .ng-p a[href$='" + location.hash + "']")) a.classList.add("on");
  }
})();
