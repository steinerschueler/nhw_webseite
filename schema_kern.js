/* Gemeinsamer Kern der Schema-Seiten (schema.html, schema_zeichnen.html): Grundformen der Symbole
   drehen und spiegeln, als SVG, in eine DXF (R12) und in ein PDF (jsPDF) zeichnen.

   Formen in Rastereinheiten (Raster 10, y nach unten, Ursprung = Einfuegepunkt):
     ["L", x1, y1, x2, y2, strichart]   ["K", cx, cy, r, voll]   ["R", x, y, b, h, voll]
     ["Z", [[x, y], ...], geschlossen, voll]   ["B", cx, cy, r, start, winkel]
     ["T", x, y, text, groesse_pt]   ["A", x, y, richtung n/e/s/w]
   Bogenwinkel wie Qt: 0 = rechts, positiv im Gegenuhrzeigersinn auf dem Bildschirm.
   1 Einheit = 0.5 mm, ein Raster = 5 mm. */
(function () {
  "use strict";

  var K = {};
  K.MM = 0.5;
  K.LIZENZ = "Schema-Symbole, Naville Handwerk GmbH, naville-handwerk.ch/schema.html, Lizenz CC BY-SA 4.0";
  K.STRICH = {dashed: [6, 3], dotted: [1, 2], dashdotted: [6, 2, 1, 2]};   /* in halben Einheiten */
  K.RICHTUNG = {n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0]};
  var NUR_LATEIN = /^[\x20-\x7e\xa0-\xff]*$/;   /* was Helvetica im PDF darstellen kann */

  K.esc = function (t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  K.textGroesse = function (f) { return f[4] * 4 / 3; };   /* Punkt -> Einheiten, wie im Programm */
  K.heute = function () { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  K.datumCH = function () { var d = new Date(); return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear(); };

  function bogenPunkt(f, a) { var w = a * Math.PI / 180; return [f[1] + f[3] * Math.cos(w), f[2] - f[3] * Math.sin(w)]; }
  K.bogenPunkte = function (f) {
    var n = Math.max(2, Math.ceil(Math.abs(f[5]) / 5)), p = [];
    for (var i = 0; i <= n; i++) p.push(bogenPunkt(f, f[4] + f[5] * i / n));
    return p;
  };
  function textBreite(f) { return 0.6 * K.textGroesse(f) * String(f[3]).length; }

  /* ---------- Drehen und Spiegeln ---------- */

  /* Erst spiegeln (x -> -x), dann um dreh Grad im Uhrzeigersinn drehen (0, 90, 180, 270).
     Texte bleiben waagrecht; ihre Mitte wandert mit. */
  K.transformiere = function (formen, dreh, spiegel) {
    dreh = ((dreh || 0) % 360 + 360) % 360;
    if (!dreh && !spiegel) return formen;
    var n = dreh / 90;
    function P(x, y) {
      if (spiegel) x = -x;
      for (var i = 0; i < n; i++) { var t = x; x = -y; y = t; }
      return [x, y];
    }
    function winkel(a) { if (spiegel) a = 180 - a; return a - 90 * n; }
    function richtung(r) {
      if (spiegel) r = {e: "w", w: "e"}[r] || r;
      for (var i = 0; i < n; i++) r = {n: "e", e: "s", s: "w", w: "n"}[r];
      return r;
    }
    return formen.map(function (f) {
      var a, b;
      switch (f[0]) {
        case "L": a = P(f[1], f[2]); b = P(f[3], f[4]); return ["L", a[0], a[1], b[0], b[1], f[5]];
        case "K": a = P(f[1], f[2]); return ["K", a[0], a[1], f[3], f[4]];
        case "R":
          a = P(f[1], f[2]); b = P(f[1] + f[3], f[2] + f[4]);
          return ["R", Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), f[5]];
        case "Z": return ["Z", f[1].map(function (p) { return P(p[0], p[1]); }), f[2], f[3]];
        case "B":
          a = P(f[1], f[2]);
          return ["B", a[0], a[1], f[3], winkel(f[4]), spiegel ? -f[5] : f[5]];
        case "T":
          var g = K.textGroesse(f), w = textBreite(f), m = P(f[1] + w / 2, f[2] - 0.35 * g);
          return ["T", m[0] - w / 2, m[1] + 0.35 * g, f[3], f[4]];
        case "A": a = P(f[1], f[2]); return ["A", a[0], a[1], richtung(f[3])];
      }
      return f;
    });
  };

  K.verschiebe = function (formen, dx, dy) {
    return formen.map(function (f) {
      switch (f[0]) {
        case "L": return ["L", f[1] + dx, f[2] + dy, f[3] + dx, f[4] + dy, f[5]];
        case "Z": return ["Z", f[1].map(function (p) { return [p[0] + dx, p[1] + dy]; }), f[2], f[3]];
        case "R": case "K": case "B": case "T": case "A":
          var c = f.slice(); c[1] += dx; c[2] += dy; return c;
      }
      return f;
    });
  };

  /* Umriss [x0, y0, x1, y1] der Formen (ohne Anschlüsse, ausser es gibt nur solche) */
  K.rahmenVon = function (formen) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    function p(x, y) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    formen.forEach(function (f) {
      switch (f[0]) {
        case "L": p(f[1], f[2]); p(f[3], f[4]); break;
        case "K": p(f[1] - f[3], f[2] - f[3]); p(f[1] + f[3], f[2] + f[3]); break;
        case "R": p(f[1], f[2]); p(f[1] + f[3], f[2] + f[4]); break;
        case "Z": f[1].forEach(function (q) { p(q[0], q[1]); }); break;
        case "B": K.bogenPunkte(f).forEach(function (q) { p(q[0], q[1]); }); break;
        case "T": p(f[1], f[2] - 0.75 * K.textGroesse(f)); p(f[1] + textBreite(f), f[2]); break;
        case "A": p(f[1], f[2]);
      }
    });
    return x0 === Infinity ? [0, 0, 0, 0] : [x0, y0, x1, y1];
  };

  K.anschluesse = function (formen) { return formen.filter(function (f) { return f[0] === "A"; }); };

  /* ---------- SVG ---------- */

  K.svgFormen = function (formen, mitAnschluss) {
    var o = [], an = [];
    formen.forEach(function (f) {
      var st = ' fill="none"';
      switch (f[0]) {
        case "L":
          var da = K.STRICH[f[5]] ? ' stroke-dasharray="' + K.STRICH[f[5]].map(function (v) { return v / 2; }).join(" ") + '"' : "";
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
          o.push('<text x="' + f[1] + '" y="' + f[2] + '" font-size="' + K.textGroesse(f).toFixed(2) + '" fill="currentColor" stroke="none">' + K.esc(f[3]) + "</text>"); break;
        case "A":
          var d = K.RICHTUNG[f[3]];
          an.push('<circle cx="' + f[1] + '" cy="' + f[2] + '" r="1.1"/><line x1="' + f[1] + '" y1="' + f[2] + '" x2="' + (f[1] + d[0] * 3.5) + '" y2="' + (f[2] + d[1] * 3.5) + '"/>');
      }
    });
    return o.join("") + (mitAnschluss && an.length ? '<g class="ans" stroke="#C1121C" fill="none" stroke-width="0.5">' + an.join("") + "</g>" : "");
  };

  /* ---------- DXF (R12, ANSI 1252) ---------- */

  function dxfText(t) {   /* Latin-1 bleibt (die Datei ist ANSI 1252), alles andere als \U+XXXX */
    return String(t).replace(/[^\x20-\x7e\xa0-\xff]/g, function (c) { return "\\U+" + ("000" + c.charCodeAt(0).toString(16).toUpperCase()).slice(-4); });
  }
  function dxfZahl(v) { return (Math.round(v * 10000) / 10000).toString(); }

  /* Schreibt eine DXF: lagen = [[name, farbe], ...]; bloecke(w) und zeichnung(w) füllen sie.
     w.form(f, lage) schreibt eine Grundform, w.text(x, y, hoehe_mm, text, lage), w.insert(name, x, y).
     Rückgabe: Bytes in ANSI 1252. */
  K.dxf = function (lagen, bloecke, zeichnung) {
    var z = [], MM = K.MM;
    function g(code, wert) { z.push(String(code), String(wert)); }
    function pt(x, y, n) { g(10 + (n || 0), dxfZahl(x * MM)); g(20 + (n || 0), dxfZahl(-y * MM)); }
    var w = {
      linie: function (a, b, lage, typ) { g(0, "LINE"); g(8, lage); if (typ) g(6, typ); pt(a[0], a[1]); pt(b[0], b[1], 1); },
      zug: function (punkte, zu, lage, breite) {
        g(0, "POLYLINE"); g(8, lage); g(66, 1); g(70, zu ? 1 : 0); g(10, 0); g(20, 0); g(30, 0);
        if (breite) { g(40, dxfZahl(breite)); g(41, dxfZahl(breite)); }
        punkte.forEach(function (p) { g(0, "VERTEX"); g(8, lage); pt(p[0], p[1]); if (p.length > 2) g(42, p[2]); });
        g(0, "SEQEND"); g(8, lage);
      },
      flaeche: function (punkte, lage) {   /* gefüllte Fläche als Fächer aus SOLIDs (die Formen sind konvex) */
        for (var i = 1; i + 1 < punkte.length; i++) {
          var a = punkte[0], b = punkte[i], c = punkte[i + 1];
          g(0, "SOLID"); g(8, lage); pt(a[0], a[1]); pt(b[0], b[1], 1); pt(c[0], c[1], 2); pt(c[0], c[1], 3);
        }
      },
      kreis: function (x, y, r, lage, voll) {
        g(0, "CIRCLE"); g(8, lage); pt(x, y); g(40, dxfZahl(r * MM));
        if (voll) w.zug([[x - r / 2, y, 1], [x + r / 2, y, 1]], true, lage, r * MM);   /* Scheibe: breite Polylinie aus zwei Halbkreisen */
      },
      text: function (x, y, hoehe, t, lage, rechts) {
        g(0, "TEXT"); g(8, lage); pt(x, y); g(40, dxfZahl(hoehe)); g(1, dxfText(t));
        if (rechts) { g(72, 2); pt(x, y, 1); }   /* rechtsbündig: Ausrichtpunkt 11/21 */
      },
      insert: function (name, x, y, lage) { g(0, "INSERT"); g(8, lage || "0"); g(2, name); pt(x, y); },
      punkt: function (x, y, lage) { g(0, "POINT"); g(8, lage); pt(x, y); },
      form: function (f, lage) {
        switch (f[0]) {
          case "L": w.linie([f[1], f[2]], [f[3], f[4]], lage, f[5] && f[5] !== "normal" ? "DASHED" : null); break;
          case "K": w.kreis(f[1], f[2], f[3], lage, f[4]); break;
          case "R":
            var e = [[f[1], f[2]], [f[1] + f[3], f[2]], [f[1] + f[3], f[2] + f[4]], [f[1], f[2] + f[4]]];
            if (f[5]) w.flaeche(e, lage); w.zug(e, true, lage); break;
          case "Z": if (f[3]) w.flaeche(f[1], lage); w.zug(f[1], f[2], lage); break;
          case "B":
            /* y wird gespiegelt: der Qt-Winkel (Gegenuhrzeigersinn auf dem Bildschirm) ist dann der mathematische */
            if (Math.abs(f[5]) >= 360) { w.kreis(f[1], f[2], f[3], lage); break; }
            var s0 = f[5] >= 0 ? f[4] : f[4] + f[5], s1 = f[5] >= 0 ? f[4] + f[5] : f[4];
            g(0, "ARC"); g(8, lage); pt(f[1], f[2]); g(40, dxfZahl(f[3] * MM));
            g(50, dxfZahl(((s0 % 360) + 360) % 360)); g(51, dxfZahl(((s1 % 360) + 360) % 360)); break;
          case "T": w.text(f[1], f[2], K.textGroesse(f) * 0.72 * MM, f[3], lage); break;
          case "A":
            var d = K.RICHTUNG[f[3]];
            g(0, "POINT"); g(8, "ANSCHLUSS"); pt(f[1], f[2]);
            w.linie([f[1], f[2]], [f[1] + d[0] * 3, f[2] + d[1] * 3], "ANSCHLUSS");
        }
      },
      block: function (name, formen) {
        g(0, "BLOCK"); g(8, "0"); g(2, name); g(70, 0); g(10, 0); g(20, 0); g(30, 0); g(3, name);
        formen.forEach(function (f) { w.form(f, "SYMBOL"); });
        g(0, "ENDBLK"); g(8, "0");
      }
    };
    g(999, K.LIZENZ.replace(/[^\x20-\x7e]/g, ""));
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
    var alle = [["0", 7]].concat(lagen, [["ANSCHLUSS", 1]]);
    g(0, "TABLE"); g(2, "LAYER"); g(70, alle.length);
    alle.forEach(function (l) { g(0, "LAYER"); g(2, l[0]); g(70, 0); g(62, l[1]); g(6, "CONTINUOUS"); });
    g(0, "ENDTAB");
    g(0, "ENDSEC");
    g(0, "SECTION"); g(2, "BLOCKS"); if (bloecke) bloecke(w); g(0, "ENDSEC");
    g(0, "SECTION"); g(2, "ENTITIES"); zeichnung(w); g(0, "ENDSEC");
    g(0, "EOF");
    /* Bytes in ANSI 1252: nach dxfText liegt jedes Zeichen unter 0x100 */
    var text = z.join("\r\n") + "\r\n", bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
    return bytes;
  };

  /* ---------- PDF (jsPDF) ---------- */

  /* Formen als Vektorzeichnung an (ox, oy) mit k mm je Einheit; Texte ausserhalb Latin-1
     (Δ, Σ, ϑ) setzt der Browser als kleines Bild, weil Helvetica im PDF sie nicht kennt. */
  K.pdfFormen = function (d, formen, ox, oy, k, mitAnschluss) {
    function P(x, y) { return [ox + x * k, oy + y * k]; }
    function zugZeichnen(punkte, zu, voll) {
      var a = P(punkte[0][0], punkte[0][1]), deltas = [];
      for (var i = 1; i < punkte.length; i++) deltas.push([(punkte[i][0] - punkte[i - 1][0]) * k, (punkte[i][1] - punkte[i - 1][1]) * k]);
      d.lines(deltas, a[0], a[1], [1, 1], voll ? "FD" : "S", !!zu);
    }
    d.setDrawColor(0, 0, 0); d.setFillColor(0, 0, 0); d.setTextColor(0, 0, 0); d.setLineWidth(0.25);
    formen.forEach(function (f) {
      switch (f[0]) {
        case "L":
          if (K.STRICH[f[5]]) d.setLineDashPattern(K.STRICH[f[5]].map(function (v) { return v / 2 * k; }), 0);
          var a = P(f[1], f[2]), b = P(f[3], f[4]); d.line(a[0], a[1], b[0], b[1]);
          d.setLineDashPattern([], 0); break;
        case "K": var c = P(f[1], f[2]); d.circle(c[0], c[1], f[3] * k, f[4] ? "FD" : "S"); break;
        case "R": var r = P(f[1], f[2]); d.rect(r[0], r[1], f[3] * k, f[4] * k, f[5] ? "FD" : "S"); break;
        case "Z": zugZeichnen(f[1], f[2], f[3]); break;
        case "B": zugZeichnen(K.bogenPunkte(f), false, false); break;
        case "T":
          var t = P(f[1], f[2]);
          if (NUR_LATEIN.test(f[3])) {
            d.setFont("helvetica", "normal"); d.setFontSize(K.textGroesse(f) * k / 0.3528);
            d.text(String(f[3]), t[0], t[1], {baseline: "alphabetic"});
          } else textBild(d, f, ox, oy, k);
          break;
        case "A":
          if (!mitAnschluss) break;
          var q = P(f[1], f[2]); d.setDrawColor(193, 18, 28); d.circle(q[0], q[1], 0.55 * k, "S"); d.setDrawColor(0, 0, 0);
      }
    });
  };

  function textBild(d, f, ox, oy, k) {
    var px = 12, gr = K.textGroesse(f) * px, c = document.createElement("canvas"), x = c.getContext("2d");
    x.font = gr + "px Arial, Helvetica, sans-serif";
    var w = Math.ceil(x.measureText(f[3]).width) + 2, h = Math.ceil(gr * 1.3);
    c.width = w; c.height = h; x = c.getContext("2d");
    x.font = gr + "px Arial, Helvetica, sans-serif"; x.fillStyle = "#000"; x.textBaseline = "alphabetic";
    x.fillText(f[3], 1, Math.round(gr));
    d.addImage(c.toDataURL("image/png"), "PNG", ox + f[1] * k - k / px, oy + (f[2] - gr / px) * k, w / px * k, h / px * k);
  }

  /* ---------- Dateien ---------- */

  K.speichern = function (inhalt, typ, name) {
    var url = URL.createObjectURL(new Blob([inhalt], {type: typ}));
    var a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  };

  window.SchemaKern = K;
})();
