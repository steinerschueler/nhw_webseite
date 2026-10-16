/* Schema-Symbole (schema.html): Nachschlagewerk der eigenen Schema-Symbole in Schweizer Form.
   Die Symbole stehen in schema_symbole.js als Grundformen in Rastereinheiten (Raster 10, y nach
   unten, Ursprung = Einfuegepunkt). Daraus zeichnet die Seite SVG fuer die Ansicht und den
   Download, eine DXF (R12, ein Block je Symbol) und einen Spickzettel als PDF (jsPDF).
   Alles im Browser; nichts wird gespeichert oder uebermittelt. */
(function () {
  "use strict";

  /* Reihenfolge: Bereiche wie auf der Baustelle gebraucht, je Bereich die Schweizer Lehrmittel zuerst */
  var BEREICHE = ["Stromlaufschema", "Installationsplan", "HLK-Anlagenschema"];
  var SCHLUESSEL = ["VSTEI 2015", "Brunner", "Sauter 1974", "Siemens", "elfero", "Gilgien, Uhlmann & Partner"];
  var SYMBOLE = (window.SCHEMA_SYMBOLE || []).map(function (s, i) { s.nr = i; return s; }).sort(function (a, b) {
    return (BEREICHE.indexOf(a.bereich) - BEREICHE.indexOf(b.bereich)) || (SCHLUESSEL.indexOf(a.schluessel) - SCHLUESSEL.indexOf(b.schluessel)) || (a.nr - b.nr);
  });
  var MM = 0.5;                       /* 1 Rastereinheit = 0.5 mm, also 1 Raster (10) = 5 mm */
  var LIZENZ = "Schema-Symbole, Naville Handwerk GmbH, naville-handwerk.ch/schema.html, Lizenz CC BY-SA 4.0";
  var STRICH = {dashed: [6, 3], dotted: [1, 2], dashdotted: [6, 2, 1, 2]};   /* in halben Einheiten */
  var RICHTUNG = {n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0]};

  function $(id) { return document.getElementById(id); }
  function zeige(el, an) { el.hidden = !an; }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function nachId(id) { for (var i = 0; i < SYMBOLE.length; i++) if (SYMBOLE[i].id === id) return SYMBOLE[i]; return null; }
  function heute() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function datumCH() { var d = new Date(); return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear(); }

  /* Punkte eines Bogens (Winkel wie Qt: 0 = rechts, positiv im Gegenuhrzeigersinn) */
  function bogenPunkt(f, a) { var w = a * Math.PI / 180; return [f[1] + f[3] * Math.cos(w), f[2] - f[3] * Math.sin(w)]; }
  function bogenPunkte(f) {
    var n = Math.max(2, Math.ceil(Math.abs(f[5]) / 5)), p = [];
    for (var i = 0; i <= n; i++) p.push(bogenPunkt(f, f[4] + f[5] * i / n));
    return p;
  }
  function textGroesse(f) { return f[4] * 4 / 3; }   /* Punkt -> Einheiten, wie im Programm */

  /* ---------- SVG ---------- */

  function rahmenMit(s, rand) { var r = s.rahmen; return [r[0] - rand, r[1] - rand, r[2] - r[0] + 2 * rand, r[3] - r[1] + 2 * rand]; }

  function svgFormen(s, mitAnschluss) {
    var o = [], an = [];
    s.formen.forEach(function (f) {
      var st = ' fill="none"';
      switch (f[0]) {
        case "L":
          var da = STRICH[f[5]] ? ' stroke-dasharray="' + STRICH[f[5]].map(function (v) { return v / 2; }).join(" ") + '"' : "";
          o.push('<line x1="' + f[1] + '" y1="' + f[2] + '" x2="' + f[3] + '" y2="' + f[4] + '"' + da + "/>"); break;
        case "K":
          o.push('<circle cx="' + f[1] + '" cy="' + f[2] + '" r="' + f[3] + '"' + (f[4] ? ' fill="currentColor"' : st) + "/>"); break;
        case "R":
          o.push('<rect x="' + f[1] + '" y="' + f[2] + '" width="' + f[3] + '" height="' + f[4] + '"' + (f[5] ? ' fill="currentColor"' : st) + "/>"); break;
        case "Z":
          var pkt = f[1].map(function (p) { return p[0] + "," + p[1]; }).join(" ");
          o.push("<" + (f[2] ? "polygon" : "polyline") + ' points="' + pkt + '"' + (f[3] ? ' fill="currentColor"' : st) + "/>"); break;
        case "B":
          if (Math.abs(f[5]) >= 360) { o.push('<circle cx="' + f[1] + '" cy="' + f[2] + '" r="' + f[3] + '"' + st + "/>"); break; }
          var a = bogenPunkt(f, f[4]), b = bogenPunkt(f, f[4] + f[5]);
          o.push('<path d="M' + a[0].toFixed(2) + " " + a[1].toFixed(2) + " A" + f[3] + " " + f[3] + " 0 " + (Math.abs(f[5]) > 180 ? 1 : 0) + " " + (f[5] > 0 ? 0 : 1) + " " + b[0].toFixed(2) + " " + b[1].toFixed(2) + '"' + st + "/>"); break;
        case "T":
          o.push('<text x="' + f[1] + '" y="' + f[2] + '" font-size="' + textGroesse(f).toFixed(2) + '" fill="currentColor" stroke="none">' + esc(f[3]) + "</text>"); break;
        case "A":
          var d = RICHTUNG[f[3]];
          an.push('<circle cx="' + f[1] + '" cy="' + f[2] + '" r="1.1"/><line x1="' + f[1] + '" y1="' + f[2] + '" x2="' + (f[1] + d[0] * 3.5) + '" y2="' + (f[2] + d[1] * 3.5) + '"/>');
      }
    });
    return o.join("") + (mitAnschluss && an.length ? '<g class="ans" stroke="#C1121C" fill="none" stroke-width="0.5">' + an.join("") + "</g>" : "");
  }

  /* Ansicht auf der Seite: kleine Symbole bleiben klein, damit die Grössen vergleichbar sind */
  function svgAnsicht(s, mindest) {
    var r = rahmenMit(s, 3), w = Math.max(r[2], mindest), h = Math.max(r[3], mindest);
    var x = r[0] - (w - r[2]) / 2, y = r[1] - (h - r[3]) / 2;
    return '<svg viewBox="' + [x, y, w, h].map(function (v) { return v.toFixed(2); }).join(" ") + '" role="img" aria-label="' + esc(s.name) + '">'
      + '<g stroke="currentColor" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round" font-family="Archivo, sans-serif">'
      + svgFormen(s, true) + "</g></svg>";
  }

  /* Datei zum Herunterladen: Masse in mm (1 Einheit = 0.5 mm), ohne Anschlusspunkte */
  function svgDatei(s) {
    var r = rahmenMit(s, 2);
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
      + "<!-- " + s.name + " (" + s.schluessel + "). Vorlage: " + s.quelle + ". " + LIZENZ + " -->\n"
      + '<svg xmlns="http://www.w3.org/2000/svg" width="' + (r[2] * MM) + 'mm" height="' + (r[3] * MM) + 'mm" viewBox="' + r.join(" ") + '">\n'
      + "<title>" + esc(s.name) + "</title>\n"
      + '<g stroke="#000" color="#000" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" font-family="Arial, Helvetica, sans-serif">'
      + svgFormen(s, false) + "</g>\n</svg>\n";
  }

  /* ---------- DXF (R12, ASCII) ---------- */

  function dxfText(t) {   /* alles ausser ASCII als \U+XXXX */
    return String(t).replace(/[^\x20-\x7e\xa0-\xff]/g, function (c) { return "\\U+" + ("000" + c.charCodeAt(0).toString(16).toUpperCase()).slice(-4); });
  }
  function dxfZahl(v) { return (Math.round(v * 10000) / 10000).toString(); }

  function dxfDatei(liste) {
    var z = [];
    function g(code, wert) { z.push(String(code), String(wert)); }
    function pt(x, y, n) { g(10 + (n || 0), dxfZahl(x * MM)); g(20 + (n || 0), dxfZahl(-y * MM)); }
    g(999, LIZENZ.replace(/[^\x20-\x7e]/g, ""));
    g(0, "SECTION"); g(2, "HEADER");
    g(9, "$ACADVER"); g(1, "AC1009");
    g(9, "$DWGCODEPAGE"); g(3, "ANSI_1252");
    g(9, "$INSUNITS"); g(70, 4);
    g(9, "$MEASUREMENT"); g(70, 1);
    g(0, "ENDSEC");
    g(0, "SECTION"); g(2, "TABLES");
    g(0, "TABLE"); g(2, "LTYPE"); g(70, 2);
    g(0, "LTYPE"); g(2, "CONTINUOUS"); g(70, 0); g(3, "Solid line"); g(72, 65); g(73, 0); g(40, 0);
    g(0, "LTYPE"); g(2, "DASHED"); g(70, 0); g(3, "__ __ __"); g(72, 65); g(73, 2); g(40, 2.25); g(49, 1.5); g(49, -0.75);
    g(0, "ENDTAB");
    g(0, "TABLE"); g(2, "LAYER"); g(70, 3);
    [["0", 7, "CONTINUOUS"], ["SYMBOL", 7, "CONTINUOUS"], ["ANSCHLUSS", 1, "CONTINUOUS"]].forEach(function (l) {
      g(0, "LAYER"); g(2, l[0]); g(70, 0); g(62, l[1]); g(6, l[2]);
    });
    g(0, "ENDTAB");
    g(0, "ENDSEC");

    g(0, "SECTION"); g(2, "BLOCKS");
    liste.forEach(function (s) {
      g(0, "BLOCK"); g(8, "0"); g(2, s.id.toUpperCase()); g(70, 0); g(10, 0); g(20, 0); g(30, 0); g(3, s.id.toUpperCase());
      s.formen.forEach(function (f) { dxfForm(f, g, pt); });
      g(0, "ENDBLK"); g(8, "0");
    });
    g(0, "ENDSEC");

    /* Zeichnung: alle Blöcke nebeneinander, Name darunter */
    g(0, "SECTION"); g(2, "ENTITIES");
    var x = 0, y = 0, zeileH = 0, BREITE = 750;
    liste.forEach(function (s) {
      var r = s.rahmen, w = (r[2] - r[0]) + 30, h = (r[3] - r[1]) + 30;
      if (x > 0 && x + w > BREITE) { x = 0; y += zeileH; zeileH = 0; }
      var ix = x - r[0] + 10, iy = y - r[1] + 10;
      g(0, "INSERT"); g(8, "SYMBOL"); g(2, s.id.toUpperCase()); pt(ix, iy);
      g(0, "TEXT"); g(8, "0"); pt(x + 10, y + (r[3] - r[1]) + 18); g(40, dxfZahl(1.5)); g(1, dxfText(s.name));
      x += Math.max(w, 150); zeileH = Math.max(zeileH, h + 10);
    });
    g(0, "ENDSEC");
    g(0, "EOF");
    /* Bytes in ANSI 1252: nach dxfText liegt jedes Zeichen unter 0x100 */
    var text = z.join("\r\n") + "\r\n", bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
    return bytes;
  }

  function dxfForm(f, g, pt) {
    var lage = f[0] === "A" ? "ANSCHLUSS" : "SYMBOL";
    function linie(a, b, typ) { g(0, "LINE"); g(8, lage); if (typ) g(6, typ); pt(a[0], a[1]); pt(b[0], b[1], 1); }
    function zug(punkte, zu, breite) {
      g(0, "POLYLINE"); g(8, lage); g(66, 1); g(70, zu ? 1 : 0); g(10, 0); g(20, 0); g(30, 0);
      if (breite) { g(40, dxfZahl(breite)); g(41, dxfZahl(breite)); }
      punkte.forEach(function (p) { g(0, "VERTEX"); g(8, lage); pt(p[0], p[1]); if (p.length > 2) g(42, p[2]); });
      g(0, "SEQEND"); g(8, lage);
    }
    function flaeche(punkte) {   /* gefüllte Fläche als Fächer aus SOLIDs (die Formen sind konvex) */
      for (var i = 1; i + 1 < punkte.length; i++) {
        var a = punkte[0], b = punkte[i], c = punkte[i + 1];
        g(0, "SOLID"); g(8, lage); pt(a[0], a[1]); pt(b[0], b[1], 1); pt(c[0], c[1], 2); pt(c[0], c[1], 3);
      }
    }
    switch (f[0]) {
      case "L": linie([f[1], f[2]], [f[3], f[4]], f[5] !== "normal" ? "DASHED" : null); break;
      case "K":
        g(0, "CIRCLE"); g(8, lage); pt(f[1], f[2]); g(40, dxfZahl(f[3] * MM));
        if (f[4]) zug([[f[1] - f[3] / 2, f[2], 1], [f[1] + f[3] / 2, f[2], 1]], true, f[3] * MM);   /* Scheibe: breite Polylinie aus zwei Halbkreisen */
        break;
      case "R":
        var e = [[f[1], f[2]], [f[1] + f[3], f[2]], [f[1] + f[3], f[2] + f[4]], [f[1], f[2] + f[4]]];
        if (f[5]) flaeche(e); zug(e, true); break;
      case "Z":
        if (f[3]) flaeche(f[1]); zug(f[1], f[2]); break;
      case "B":
        /* y wird gespiegelt: der Qt-Winkel (Gegenuhrzeigersinn auf dem Bildschirm) ist dann der mathematische */
        if (Math.abs(f[5]) >= 360) { g(0, "CIRCLE"); g(8, lage); pt(f[1], f[2]); g(40, dxfZahl(f[3] * MM)); break; }
        var s0 = f[5] >= 0 ? f[4] : f[4] + f[5], s1 = f[5] >= 0 ? f[4] + f[5] : f[4];
        g(0, "ARC"); g(8, lage); pt(f[1], f[2]); g(40, dxfZahl(f[3] * MM));
        g(50, dxfZahl(((s0 % 360) + 360) % 360)); g(51, dxfZahl(((s1 % 360) + 360) % 360)); break;
      case "T":
        g(0, "TEXT"); g(8, lage); pt(f[1], f[2]); g(40, dxfZahl(textGroesse(f) * 0.72 * MM)); g(1, dxfText(f[3])); break;
      case "A":
        var d = RICHTUNG[f[3]];
        g(0, "POINT"); g(8, lage); pt(f[1], f[2]);
        linie([f[1], f[2]], [f[1] + d[0] * 3, f[2] + d[1] * 3]);
    }
  }

  /* ---------- PDF-Spickzettel (jsPDF, A4 hoch) ---------- */

  var INK = [27, 26, 23], GRAU = [110, 106, 98], LINIE = [216, 214, 208];
  var NUR_LATEIN = /^[\x20-\x7e\xa0-\xff]*$/;   /* was Helvetica im PDF darstellen kann */

  /* Symbol als Vektorzeichnung; Texte mit Zeichen ausserhalb Latin-1 (Δ, Σ, ϑ) liefert bild() */
  function pdfSymbol(d, s, ox, oy, k) {
    function P(x, y) { return [ox + x * k, oy + y * k]; }
    function zugZeichnen(punkte, zu, voll) {
      var a = P(punkte[0][0], punkte[0][1]), deltas = [];
      for (var i = 1; i < punkte.length; i++) deltas.push([(punkte[i][0] - punkte[i - 1][0]) * k, (punkte[i][1] - punkte[i - 1][1]) * k]);
      d.lines(deltas, a[0], a[1], [1, 1], voll ? "FD" : "S", !!zu);
    }
    d.setDrawColor(0, 0, 0); d.setFillColor(0, 0, 0); d.setTextColor(0, 0, 0); d.setLineWidth(0.25);
    s.formen.forEach(function (f) {
      switch (f[0]) {
        case "L":
          if (STRICH[f[5]]) d.setLineDashPattern(STRICH[f[5]].map(function (v) { return v / 2 * k; }), 0);
          var a = P(f[1], f[2]), b = P(f[3], f[4]); d.line(a[0], a[1], b[0], b[1]);
          d.setLineDashPattern([], 0); break;
        case "K": var c = P(f[1], f[2]); d.circle(c[0], c[1], f[3] * k, f[4] ? "FD" : "S"); break;
        case "R": var r = P(f[1], f[2]); d.rect(r[0], r[1], f[3] * k, f[4] * k, f[5] ? "FD" : "S"); break;
        case "Z": zugZeichnen(f[1], f[2], f[3]); break;
        case "B": zugZeichnen(bogenPunkte(f), false, false); break;
        case "T":
          var t = P(f[1], f[2]);
          d.setFont("helvetica", "normal"); d.setFontSize(textGroesse(f) * k / 0.3528);
          if (NUR_LATEIN.test(f[3])) d.text(f[3], t[0], t[1], {baseline: "alphabetic"});
      }
    });
  }

  /* Texte ausserhalb Latin-1 als Bild (der Browser setzt sie; Helvetica im PDF kennt sie nicht) */
  function textBilder(d, s, ox, oy, k) {
    s.formen.forEach(function (f) {
      if (f[0] !== "T" || NUR_LATEIN.test(f[3])) return;
      var px = 12, gr = textGroesse(f) * px, c = document.createElement("canvas"), x = c.getContext("2d");
      x.font = gr + "px Arial, Helvetica, sans-serif";
      var w = Math.ceil(x.measureText(f[3]).width) + 2, h = Math.ceil(gr * 1.3);
      c.width = w; c.height = h; x = c.getContext("2d");
      x.font = gr + "px Arial, Helvetica, sans-serif"; x.fillStyle = "#000"; x.textBaseline = "alphabetic";
      x.fillText(f[3], 1, Math.round(gr));
      d.addImage(c.toDataURL("image/png"), "PNG", ox + f[1] * k - k / px, oy + (f[2] - gr / px) * k, w / px * k, h / px * k);
    });
  }

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
      d.text(liste.length + " Symbole · Massstab 1:1, ein Raster = 5 mm · Stand " + datumCH(), rechts, 20, {align: "right"});
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
      pdfSymbol(d, s, ox, oy, k); textBilder(d, s, ox, oy, k);
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
      d.text(LIZENZ, x0, PH - 5.5);
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

  function speichern(inhalt, typ, name) {
    var url = URL.createObjectURL(inhalt instanceof Blob ? inhalt : new Blob([inhalt], {type: typ}));
    var a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
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
