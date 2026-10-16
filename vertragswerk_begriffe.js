/* Vertragswerk, Lexikon der Rechtsbegriffe: Daten und Aufbau des Reiters.
   Ein Eintrag: {id, wort, formen, kurz, bedeutung, abgrenzung: [{wort, id?, text}], quellen: [{t, url}]}.
   `formen` sind die Wortformen, die in Verträgen und Erläuterungen als Begriff markiert werden
   (Gross- und Kleinschreibung egal, nur ganze Wörter); `kurz` steht im Begriffskärtchen.
   Ein Verweis-Eintrag hat statt der Bedeutung `siehe` (id des geltenden Begriffs) und `text`. */
(function (G) {
  "use strict";
  var VW = G.VW = G.VW || {};

  VW.BEGRIFFE = [
    {id: "verleiher", wort: "Verleiher", formen: ["Verleiher", "Verleihers"], kurz: "Die Firma, die den Arbeitnehmer anstellt und ihn einem Einsatzbetrieb überlässt.", bedeutung: "Arbeitgeber, der einem Einsatzbetrieb Arbeitnehmer überlässt und ihm wesentliche Weisungsbefugnisse abtritt.", abgrenzung: [], quellen: [{t: "Art. 12 Abs. 1 AVG", url: "https://www.fedlex.admin.ch/eli/cc/1991/392_392_392/de#art_12"}]}
  ];

  /* Anfangsbuchstabe für die Gruppierung (Umlaute zum Grundbuchstaben) */
  function buchstabe(w) {
    var c = w.charAt(0).toUpperCase();
    return {"Ä": "A", "Ö": "O", "Ü": "U"}[c] || c;
  }
  VW.lexikonSortiert = function () {
    return VW.BEGRIFFE.slice().sort(function (a, b) { return a.wort.localeCompare(b.wort, "de"); });
  };

  if (typeof document === "undefined") return;

  VW.lexikonBauen = function () {
    var ziel = document.getElementById("lex"), abc = document.getElementById("lex-abc"), suche = document.getElementById("lex-suche");
    if (!ziel) return;
    var L = VW.lexikonSortiert(), gruppen = {};
    ziel.textContent = "";
    L.forEach(function (e) {
      var bu = buchstabe(e.wort);
      if (!gruppen[bu]) {
        gruppen[bu] = document.createElement("div");
        var h = document.createElement("div"); h.className = "lbuchst"; h.id = "lex-" + bu; h.textContent = bu;
        gruppen[bu].appendChild(h); ziel.appendChild(gruppen[bu]);
      }
      var el = document.createElement("div"); el.className = "le" + (e.siehe ? " siehe" : ""); el.id = "b-" + e.id;
      el.setAttribute("data-such", (e.wort + " " + (e.formen || []).join(" ") + " " + (e.bedeutung || e.text || "")).toLowerCase());
      var h4 = document.createElement("h4"); h4.textContent = e.wort;
      el.appendChild(h4);
      if (e.siehe) {
        var z = VW.begriff(e.siehe), p0 = document.createElement("p");
        p0.appendChild(document.createTextNode("Siehe "));
        var a0 = document.createElement("a"); a0.className = "sv"; a0.href = "#begriff-" + e.siehe; a0.textContent = z ? z.wort : e.siehe;
        p0.appendChild(a0);
        if (e.text) p0.appendChild(document.createTextNode(". " + e.text));
        el.appendChild(p0);
      } else {
        var p = document.createElement("p"); p.textContent = e.bedeutung; el.appendChild(p);
        (e.abgrenzung || []).forEach(function (ab) {
          var pa = document.createElement("p"); pa.className = "abgr";
          pa.appendChild(document.createTextNode("Abgrenzung zu "));
          var b = document.createElement("b");
          if (ab.id) { var a1 = document.createElement("a"); a1.href = "#begriff-" + ab.id; a1.textContent = ab.wort; a1.style.color = "inherit"; b.appendChild(a1); }
          else b.textContent = ab.wort;
          pa.appendChild(b); pa.appendChild(document.createTextNode(": " + ab.text));
          el.appendChild(pa);
        });
      }
      if (e.quellen && e.quellen.length) {
        var q = document.createElement("p"); q.className = "q"; q.appendChild(document.createTextNode("Quelle: "));
        e.quellen.forEach(function (qq, i) {
          if (i) q.appendChild(document.createTextNode(" · "));
          if (qq.url) { var a = document.createElement("a"); a.href = qq.url; a.rel = "noopener"; a.target = "_blank"; a.textContent = qq.t; q.appendChild(a); }
          else q.appendChild(document.createTextNode(qq.t));
        });
        el.appendChild(q);
      }
      gruppen[bu].appendChild(el);
    });
    abc.textContent = "";
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (bu) {
      var x;
      if (gruppen[bu]) {
        x = document.createElement("a"); x.href = "#lex-" + bu; x.textContent = bu;
        x.addEventListener("click", function (ev) { ev.preventDefault(); document.getElementById("lex-" + bu).scrollIntoView({behavior: "smooth", block: "start"}); });
      } else { x = document.createElement("span"); x.textContent = bu; }
      abc.appendChild(x);
    });
    suche.addEventListener("input", function () {
      var t = suche.value.trim().toLowerCase();
      Object.keys(gruppen).forEach(function (bu) {
        var sichtbar = 0;
        Array.prototype.forEach.call(gruppen[bu].querySelectorAll(".le"), function (el) {
          var an = !t || el.getAttribute("data-such").indexOf(t) >= 0;
          el.hidden = !an; if (an) sichtbar++;
        });
        gruppen[bu].hidden = !sichtbar;
      });
    });
  };
})(typeof window !== "undefined" ? window : globalThis);
