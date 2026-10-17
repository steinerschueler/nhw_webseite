/* Schema-Symbole (schema.html): Nachschlagewerk der eigenen Schema-Symbole in Schweizer Form.
   Die Symbole stehen in schema_symbole.js, das Zeichnen (SVG, DXF, PDF) in schema_kern.js.
   Alles im Browser; nichts wird gespeichert oder uebermittelt. */
(function () {
  "use strict";

  var K = window.SchemaKern, MM = K.MM, esc = K.esc, heute = K.heute, speichern = K.speichern;

  /* Reihenfolge: Bereiche wie auf der Baustelle gebraucht, je Bereich die Schweizer Lehrmittel zuerst */
  var BEREICHE = ["Stromlaufschema", "Installationsplan", "HLK-Anlagenschema"];
  var SCHLUESSEL = ["IEC-Form", "VSTEI 2015", "Brunner", "Sauter 1974", "Siemens", "elfero", "Gilgien, Uhlmann & Partner"];
  var SYMBOLE = (window.SCHEMA_SYMBOLE || []).map(function (s, i) { s.nr = i; return s; }).sort(function (a, b) {
    return (BEREICHE.indexOf(a.bereich) - BEREICHE.indexOf(b.bereich)) || (SCHLUESSEL.indexOf(a.schluessel) - SCHLUESSEL.indexOf(b.schluessel)) || (a.nr - b.nr);
  });

  function $(id) { return document.getElementById(id); }
  function zeige(el, an) { el.hidden = !an; }
  function nachId(id) { for (var i = 0; i < SYMBOLE.length; i++) if (SYMBOLE[i].id === id) return SYMBOLE[i]; return null; }

  /* ---------- SVG ---------- */

  function rahmenMit(s, rand) { var r = s.rahmen; return [r[0] - rand, r[1] - rand, r[2] - r[0] + 2 * rand, r[3] - r[1] + 2 * rand]; }

  /* Ansicht auf der Seite: kleine Symbole bleiben klein, damit die Grössen vergleichbar sind */
  function svgAnsicht(s, mindest) {
    var r = rahmenMit(s, 3), w = Math.max(r[2], mindest), h = Math.max(r[3], mindest);
    var x = r[0] - (w - r[2]) / 2, y = r[1] - (h - r[3]) / 2;
    return '<svg viewBox="' + [x, y, w, h].map(function (v) { return v.toFixed(2); }).join(" ") + '" role="img" aria-label="' + esc(s.name) + '">'
      + '<g stroke="currentColor" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round" font-family="Archivo, sans-serif">'
      + K.svgFormen(s.formen, true) + "</g></svg>";
  }

  /* Datei zum Herunterladen: Masse in mm (1 Einheit = 0.5 mm), ohne Anschlusspunkte */
  function svgDatei(s) {
    var r = rahmenMit(s, 2);
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
      + "<!-- " + s.name + " (" + s.schluessel + "). Vorlage: " + s.quelle + ". " + K.LIZENZ + " -->\n"
      + '<svg xmlns="http://www.w3.org/2000/svg" width="' + (r[2] * MM) + 'mm" height="' + (r[3] * MM) + 'mm" viewBox="' + r.join(" ") + '">\n'
      + "<title>" + esc(s.name) + "</title>\n"
      + '<g stroke="#000" color="#000" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" font-family="Arial, Helvetica, sans-serif">'
      + K.svgFormen(s.formen, false) + "</g>\n</svg>\n";
  }

  /* ---------- DXF: je Symbol ein Block, alle nebeneinander, Name darunter ---------- */

  function dxfDatei(liste) {
    return K.dxf([["SYMBOL", 7]], function (w) {
      liste.forEach(function (s) { w.block(s.id.toUpperCase(), s.formen); });
    }, function (w) {
      var x = 0, y = 0, zeileH = 0, BREITE = 750;
      liste.forEach(function (s) {
        var r = s.rahmen, b = (r[2] - r[0]) + 30, h = (r[3] - r[1]) + 30;
        if (x > 0 && x + b > BREITE) { x = 0; y += zeileH; zeileH = 0; }
        w.insert(s.id.toUpperCase(), x - r[0] + 10, y - r[1] + 10, "SYMBOL");
        w.text(x + 10, y + (r[3] - r[1]) + 18, 1.5, s.name, "0");
        x += Math.max(b, 150); zeileH = Math.max(zeileH, h + 10);
      });
    });
  }

  /* ---------- PDF-Spickzettel (jsPDF, A4 hoch) ---------- */

  var INK = [27, 26, 23], GRAU = [110, 106, 98], LINIE = [216, 214, 208];

  function pdfErstellen() {
    var liste = auswahlListe();
    if (!liste.length) return;
    if (!window.jspdf || !window.jspdf.jsPDF) { meldung("PDF-Bibliothek nicht geladen."); return; }
    var d = new window.jspdf.jsPDF({unit: "mm", format: "a4"});
    var PH = 297, x0 = 14, rechts = 196, SP = 4, ZB = (rechts - x0) / SP, ZH = 36, y = 0;

    function kopf(erste) {
      d.setFont("helvetica", "bold"); d.setFontSize(erste ? 16 : 11); d.setTextColor(INK[0], INK[1], INK[2]);
      d.text("Schema-Symbole", x0, 20);
      d.setFont("helvetica", "normal"); d.setFontSize(9); d.setTextColor(GRAU[0], GRAU[1], GRAU[2]);
      d.text(liste.length + " Symbole · Massstab 1:1, ein Raster = 5 mm · Stand " + K.datumCH(), rechts, 20, {align: "right"});
      y = 30;
    }
    kopf(true);
    var gruppe = "", spalte = 0;
    liste.forEach(function (s) {
      var gr = s.bereich + " · " + s.schluessel;
      if (gr !== gruppe) {
        if (spalte) { y += ZH; spalte = 0; }
        if (y + 8 + ZH > PH - 18) { d.addPage(); kopf(false); }
        d.setFont("helvetica", "bold"); d.setFontSize(10); d.setTextColor(INK[0], INK[1], INK[2]);
        d.text(gr, x0, y + 4);
        d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.3); d.line(x0, y + 5.5, rechts, y + 5.5);
        y += 9; gruppe = gr;
      }
      if (spalte === 0 && y + ZH > PH - 18) { d.addPage(); kopf(false); }
      var cx = x0 + spalte * ZB, r = s.rahmen, w = r[2] - r[0], h = r[3] - r[1];
      var k = Math.min(MM, (ZB - 6) / w, (ZH - 13) / h);               /* 1:1, nur Grosses wird verkleinert */
      var ox = cx + (ZB - w * k) / 2 - r[0] * k, oy = y + 2 + (ZH - 13 - h * k) / 2 - r[1] * k;
      K.pdfFormen(d, s.formen, ox, oy, k);
      d.setFont("helvetica", "normal"); d.setFontSize(7.5); d.setTextColor(INK[0], INK[1], INK[2]);
      var zeilen = d.splitTextToSize(s.name + (k < MM ? " (verkleinert)" : ""), ZB - 4).slice(0, 2);
      d.text(zeilen, cx + ZB / 2, y + ZH - 9, {align: "center"});
      spalte = (spalte + 1) % SP; if (!spalte) y += ZH;
    });

    var n = d.getNumberOfPages();
    for (var i = 1; i <= n; i++) {
      d.setPage(i); d.setFont("helvetica", "normal"); d.setFontSize(7.5); d.setTextColor(GRAU[0], GRAU[1], GRAU[2]);
      d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.3); d.line(x0, PH - 13, rechts, PH - 13);
      d.text("Hausschlüssel sind keine Norm: Ein Zeichen gilt auf den Schemas des Büros, das es verwendet. Vorlage je Symbol auf der Webseite.", x0, PH - 9);
      d.text(K.LIZENZ, x0, PH - 5.5);
      d.text("Seite " + i + "/" + n, rechts, PH - 5.5, {align: "right"});
    }
    pdfVorschau(d, "schema_symbole_" + heute() + ".pdf");
  }

  var vorschau = {url: null, name: ""};
  function pdfVorschau(d, name) {
    if (vorschau.url) URL.revokeObjectURL(vorschau.url);
    vorschau.url = URL.createObjectURL(d.output("blob")); vorschau.name = name;
    $("pdfrahmen").src = vorschau.url;
    zeige($("pdfvorschau"), true);
    $("pdfvorschau").scrollIntoView({behavior: "smooth", block: "start"});
  }
  function vorschauWeg() {
    if (!vorschau.url) return;
    zeige($("pdfvorschau"), false); $("pdfrahmen").removeAttribute("src");
    URL.revokeObjectURL(vorschau.url); vorschau.url = null;
  }

  function meldung(t) { var m = $("meldung"); m.textContent = t; zeige(m, !!t); }

  /* ---------- Seite: Suche, Filter, Karten, Auswahl ---------- */

  var auswahl = {}, offen = null;
  function auswahlListe() { return SYMBOLE.filter(function (s) { return auswahl[s.id]; }); }

  function normal(t) { return t.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue"); }
  function passt(s) {
    var b = $("f-bereich").value, k = $("f-schluessel").value, q = normal($("suche").value.trim());
    if (b && s.bereich !== b) return false;
    if (k && s.schluessel !== k) return false;
    if (!q) return true;
    var heu = normal(s.name + " " + s.schluessel + " " + s.bereich);
    return q.split(/\s+/).every(function (w) { return heu.indexOf(w) >= 0; });
  }
  function sichtbare() { return SYMBOLE.filter(passt); }

  function optionen() {
    function fuellen(sel, feld) {
      var werte = [];
      SYMBOLE.forEach(function (s) { if (werte.indexOf(s[feld]) < 0) werte.push(s[feld]); });
      werte.forEach(function (w) { var o = document.createElement("option"); o.value = w; o.textContent = w; sel.appendChild(o); });
    }
    fuellen($("f-bereich"), "bereich"); fuellen($("f-schluessel"), "schluessel");
  }

  function karten() {
    var liste = sichtbare(), html = [];
    liste.forEach(function (s) {
      html.push('<div class="karte' + (auswahl[s.id] ? " gewaehlt" : "") + '" data-id="' + s.id + '">'
        + '<button type="button" class="k-bild" data-oeffnen="' + s.id + '" aria-expanded="' + (offen === s.id) + '">' + svgAnsicht(s, 34)
        + '<span class="k-name">' + esc(s.name) + '</span><span class="k-sl">' + esc(s.schluessel) + "</span></button>"
        + '<label class="k-wahl"><input type="checkbox" data-wahl="' + s.id + '"' + (auswahl[s.id] ? " checked" : "") + "> auswählen</label></div>");
      if (offen === s.id) html.push(detail(s));
    });
    $("raster").innerHTML = html.join("") || '<p class="leer">Kein Symbol passt zu dieser Suche.</p>';
    $("treffer").textContent = liste.length === SYMBOLE.length ? SYMBOLE.length + " Symbole" : liste.length + " von " + SYMBOLE.length + " Symbolen";
    $("raster").classList.toggle("ohne-ans", !$("anschluesse").checked);
  }

  function detail(s) {
    return '<div class="detail" id="detail" tabindex="-1">'
      + '<div class="d-bild">' + svgAnsicht(s, 30) + "</div>"
      + '<div class="d-text"><h3>' + esc(s.name) + "</h3>"
      + '<p class="d-meta">' + esc(s.bereich) + " · Hausschlüssel " + esc(s.schluessel) + "</p>"
      + "<p><strong>Vorlage:</strong> " + esc(s.quelle) + "</p>"
      + '<p class="d-meta">Rote Punkte: Anschlüsse, die Striche zeigen, wohin der Leiter abgeht. Gezeichnet im Raster 5 mm.</p>'
      + '<div class="knopfreihe"><button type="button" data-svg="' + s.id + '">SVG herunterladen</button>'
      + '<button type="button" class="zweit" data-dxf="' + s.id + '">DXF herunterladen</button>'
      + '<button type="button" class="zweit" data-wahl-knopf="' + s.id + '">' + (auswahl[s.id] ? "Aus der Auswahl nehmen" : "Zur Auswahl") + "</button>"
      + '<button type="button" class="zweit" data-zu="1">Schliessen</button></div></div></div>';
  }

  function auswahlZeigen() {
    var n = auswahlListe().length;
    $("anzahl").textContent = n ? n + (n === 1 ? " Symbol" : " Symbole") + " ausgewählt" : "Noch nichts ausgewählt. Wähle Symbole in der Liste aus oder übernimm alle, die die Suche gerade zeigt.";
    $("pdf").disabled = !n; $("dxf").disabled = !n; $("leeren").disabled = !n;
    vorschauWeg();
  }

  function oeffnen(id) {
    offen = offen === id ? null : id;
    karten();
    if (offen) {
      var d = $("detail"); d.focus({preventScroll: true});
      d.scrollIntoView({behavior: "smooth", block: "nearest"});
      if (history.replaceState) history.replaceState(null, "", "#" + id);
    } else if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
  }

  function waehlen(id, an) { if (an) auswahl[id] = true; else delete auswahl[id]; karten(); auswahlZeigen(); }

  $("raster").addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-oeffnen],[data-svg],[data-dxf],[data-wahl-knopf],[data-zu]");
    if (!t) return;
    if (t.dataset.oeffnen) oeffnen(t.dataset.oeffnen);
    else if (t.dataset.svg) { var s = nachId(t.dataset.svg); speichern(svgDatei(s), "image/svg+xml", s.id + ".svg"); }
    else if (t.dataset.dxf) { var s2 = nachId(t.dataset.dxf); speichern(dxfDatei([s2]), "application/dxf", s2.id + ".dxf"); }
    else if (t.dataset.wahlKnopf) waehlen(t.dataset.wahlKnopf, !auswahl[t.dataset.wahlKnopf]);
    else if (t.dataset.zu) oeffnen(offen);
  });
  $("raster").addEventListener("change", function (ev) {
    if (ev.target.dataset.wahl) waehlen(ev.target.dataset.wahl, ev.target.checked);
  });
  ["suche", "f-bereich", "f-schluessel"].forEach(function (id) {
    $(id).addEventListener(id === "suche" ? "input" : "change", function () { offen = null; karten(); });
  });
  $("anschluesse").addEventListener("change", function () { $("raster").classList.toggle("ohne-ans", !this.checked); });
  $("alle").addEventListener("click", function () { sichtbare().forEach(function (s) { auswahl[s.id] = true; }); karten(); auswahlZeigen(); });
  $("leeren").addEventListener("click", function () { auswahl = {}; karten(); auswahlZeigen(); });
  $("pdf").addEventListener("click", pdfErstellen);
  $("dxf").addEventListener("click", function () { speichern(dxfDatei(auswahlListe()), "application/dxf", "schema_symbole_" + heute() + ".dxf"); });
  $("pdfdown").addEventListener("click", function () { if (vorschau.url) { var a = document.createElement("a"); a.href = vorschau.url; a.download = vorschau.name; document.body.appendChild(a); a.click(); a.remove(); } });
  $("pdftab").addEventListener("click", function () { if (vorschau.url) window.open(vorschau.url, "_blank"); });

  /* Vorbelegen über die Adresse: schema.html?q=<Suche> und #<Symbol> öffnet ein Symbol */
  var q = new URLSearchParams(location.search);
  if (q.has("q")) $("suche").value = q.get("q");
  optionen();
  var anker = decodeURIComponent(location.hash.slice(1));
  if (anker && nachId(anker)) offen = anker;
  karten(); auswahlZeigen();
  if (offen) window.addEventListener("load", function () { setTimeout(function () { $("detail").scrollIntoView({block: "center"}); }, 50); });
})();
