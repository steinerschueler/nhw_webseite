/* Vertragswerk, Kern: Reiter, gemeinsame Angaben, Zählung der Ziffern, Vorschau, Begriffskärtchen
   und die Bausteine des PDF. Die Verträge selbst stehen in eigenen Dateien und melden sich in
   VW.vertraege an (vertragswerk_verleih.js, vertragswerk_arbeit.js); die Erläuterungen in
   vertragswerk_erlaeuterung.js, das Lexikon in vertragswerk_begriffe.js.
   Alles läuft im Browser: kein Speichern, keine Cookies. Die PDF entstehen mit jsPDF (vendor/).

   Aufbau eines Vertragstexts: modell(o) liefert die Ziffern als Liste [{id, titel, teil, abs: [{id, t}]}];
   was eine Variante weglässt, fällt dort heraus. Ziffern und Buchstaben werden erst danach gezählt.
   Verweise im Text sind Marken, die beim Zählen aufgelöst werden:
   {Z:ziffer} = Nummer der Ziffer, {B:ziffer.buchstabe} = Buchstabe, {R:ziffer.buchstabe} = beides
   ("7 a"). Mit "@vv" oder "@av" zeigt eine Marke in den anderen Vertrag: {R@av:lohn.a}.
   `teil` an einer Ziffer setzt einen Zwischentitel; die Buchstaben A, B, ... zählt der Kern. */
(function (G) {
  "use strict";
  var VW = G.VW = G.VW || {};
  VW.vertraege = VW.vertraege || {};
  VW.ERL = VW.ERL || {};

  VW.KANTONE = [["AG", "Aargau"], ["AI", "Appenzell Innerrhoden"], ["AR", "Appenzell Ausserrhoden"], ["BE", "Bern"],
    ["BL", "Basel-Landschaft"], ["BS", "Basel-Stadt"], ["FR", "Freiburg"], ["GE", "Genf"], ["GL", "Glarus"],
    ["GR", "Graubünden"], ["JU", "Jura"], ["LU", "Luzern"], ["NE", "Neuenburg"], ["NW", "Nidwalden"], ["OW", "Obwalden"],
    ["SG", "St. Gallen"], ["SH", "Schaffhausen"], ["SO", "Solothurn"], ["SZ", "Schwyz"], ["TG", "Thurgau"], ["TI", "Tessin"],
    ["UR", "Uri"], ["VD", "Waadt"], ["VS", "Wallis"], ["ZG", "Zug"], ["ZH", "Zürich"]];
  VW.ORDINAL = {1: "ersten", 2: "zweiten", 3: "dritten", 4: "vierten", 5: "fünften"};

  VW.chf = function (n) { return "CHF " + String(n); };
  VW.kantonName = function (k) { for (var i = 0; i < VW.KANTONE.length; i++) if (VW.KANTONE[i][0] === k) return VW.KANTONE[i][1]; return k; };
  VW.datum = function (iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? m[3] + "." + m[2] + "." + m[1] : ""; };
  var ZAHLWORT = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
  /* Zahlen bis zwölf in Worten, ab 13 in Ziffern (Formregel der Vertragstexte) */
  VW.zahlwort = function (n) { return n >= 0 && n <= 12 && n === Math.round(n) ? ZAHLWORT[n] : String(n); };
  VW.b = function (id) { return {id: id, t: Array.prototype.slice.call(arguments, 1)}; };

  /* ---------- Zählung und Marken ---------- */

  /* Nummern und Buchstaben eines Vertrags. Eine Ziffer mit nur einem Absatz trägt keinen Buchstaben. */
  VW.zaehlen = function (Z) {
    var nr = {}, bst = {}, teil = {}, t = 0;
    Z.forEach(function (z, i) {
      nr[z.id] = i + 1;
      if (z.teil) { teil[z.id] = String.fromCharCode(65 + t) + ". " + z.teil; t++; }
      z.abs.forEach(function (a, j) { bst[z.id + "." + a.id] = z.abs.length > 1 ? String.fromCharCode(97 + j) : ""; });
    });
    return {nr: nr, bst: bst, teil: teil};
  };

  /* Löst die Marken eines Texts auf; `eigen` ist der Vertrag des Texts ("vv" oder "av"),
     `zahlen` die Zählungen beider Verträge. Fehlende Ziele landen in `fehlt` und erscheinen als "?". */
  VW.aufloeser = function (eigen, zahlen, fehlt) {
    return function (s) {
      return s.replace(/\{([ZBR])(?:@(vv|av))?:([a-z0-9]+)(?:\.([a-z0-9]+))?\}/g, function (m, art, wo, zid, pid) {
        var zz = zahlen[wo || eigen];
        var n = zz ? zz.nr[zid] : undefined, k = zid + "." + pid;
        if (n === undefined || (art !== "Z" && zz.bst[k] === undefined)) { fehlt.push(m); return "?"; }
        return art === "Z" ? String(n) : art === "B" ? zz.bst[k] : (n + (zz.bst[k] ? " " + zz.bst[k] : ""));
      });
    };
  };
  function teilAufloesen(teil, auf) {
    if (typeof teil === "string") return auf(teil);
    var aus = {};
    Object.keys(teil).forEach(function (k) {
      var v = teil[k];
      if (typeof v === "string") aus[k] = auf(v);
      else if (Array.isArray(v)) aus[k] = v.map(function (x) {
        if (typeof x === "string") return auf(x);
        if (Array.isArray(x)) return x.map(function (y) { return typeof y === "string" ? auf(y) : y; });
        return teilAufloesen(x, auf);
      });
      else if (v && typeof v === "object") aus[k] = teilAufloesen(v, auf);
      else aus[k] = v;
    });
    return aus;
  }
  VW.teilAufloesen = teilAufloesen;

  /* Gezählter Vertrag: [{id, nr, titel, teil, abs: [{id, bst, t}]}], dazu .fehlt */
  VW.gezaehlt = function (Z, eigen, zahlen) {
    eigen = eigen || "vv";
    zahlen = zahlen || {};
    var z0 = VW.zaehlen(Z);
    zahlen[eigen] = z0;
    var fehlt = [], auf = VW.aufloeser(eigen, zahlen, fehlt);
    var aus = Z.map(function (z) {
      return {id: z.id, nr: z0.nr[z.id], titel: z.titel, teil: z0.teil[z.id] || "", abs: z.abs.map(function (a) {
        return {id: a.id, bst: z0.bst[z.id + "." + a.id], t: a.t.map(function (teil) { return teilAufloesen(teil, auf); })};
      })};
    });
    if (fehlt.length && typeof console !== "undefined") console.warn("Vertragswerk: Verweis ohne Ziel", fehlt);
    aus.fehlt = fehlt;
    return aus;
  };

  /* Text eines Absatzes zum Vergleich mit der Grundfassung (ohne Nummern, damit eine weggefallene
     Ziffer nicht alle folgenden als geändert markiert) */
  VW.vergleichstext = function (a) {
    return a.t.map(function (teil) { return typeof teil === "string" ? teil : JSON.stringify(teil); }).join("#")
      .replace(/Ziff\. [0-9]+( [a-z])?(, [0-9]*( ?[a-z])?)*/g, "Ziff.").replace(/Bst\. [a-z]/g, "Bst.");
  };
  VW.listeMitZeichen = function (liste) {
    return liste.map(function (p, i) { return p + (i < liste.length - 1 ? ";" : "."); });
  };

  /* Erläuterungen eines Vertrags zur Auswahl o: [{id, nr, titel, teil, bloecke}] in der Reihenfolge
     des gezählten Vertrags. Blöcke: Text, {liste}, {tabelle: {kopf, zeilen}}, {beispiel}, {hinweis},
     {quellen: [{t, url}]}. */
  VW.erlaeutert = function (art, o, f, gez, zahlen) {
    var E = VW.ERL[art] || {}, fehlt = [], auf = VW.aufloeser(art, zahlen, fehlt), aus = [];
    function bloecke(fn, z) {
      if (typeof fn !== "function") return [];
      return (fn(o, f, z) || []).filter(Boolean).map(function (bl) { return teilAufloesen(bl, auf); });
    }
    var vor = bloecke(E._vorspann, null);
    gez.forEach(function (z) {
      aus.push({id: z.id, nr: z.nr, titel: z.titel, teil: z.teil, bloecke: bloecke(E[z.id], z)});
    });
    aus.vorspann = vor;
    aus.fehlt = fehlt;
    return aus;
  };

  /* ---------- Begriffe ---------- */

  var muster = null, formZuId = {};
  function begriffMuster() {
    if (muster !== null) return muster;
    var formen = [];
    (VW.BEGRIFFE || []).forEach(function (e) {
      (e.formen || []).forEach(function (fo) { formen.push(fo); formZuId[fo.toLowerCase()] = e.id; });
    });
    formen.sort(function (a, b) { return b.length - a.length; });
    var bst = "A-Za-zÄÖÜäöüàéèêëïôç";
    muster = formen.length ? new RegExp("(^|[^" + bst + "])(" + formen.map(function (s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("|") + ")(?=$|[^" + bst + "])", "gi") : null;
    return muster;
  }
  VW.begriff = function (id) {
    var L = VW.BEGRIFFE || [];
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return null;
  };
  /* Fundstellen der Lexikon-Begriffe in einem Text: [{von, bis, id}] */
  VW.begriffeIn = function (s) {
    var re = begriffMuster(), aus = [], m;
    if (!re) return aus;
    re.lastIndex = 0;
    while ((m = re.exec(s)) !== null) {
      var von = m.index + m[1].length;
      aus.push({von: von, bis: von + m[2].length, id: formZuId[m[2].toLowerCase()]});
      re.lastIndex = von + m[2].length;
    }
    return aus;
  };

  /* ---------- PDF-Bausteine (A4 hoch, Helvetica) ---------- */

  VW.pdfNeu = function (JsPDF) {
    var d = new JsPDF({unit: "mm", format: "a4"});
    var P = {d: d, x: 20, rechts: 190, PH: 297, y: 22};
    P.B = P.rechts - P.x; P.UNTEN = P.PH - 18;
    var INK = [0, 0, 0], GRAU = [110, 107, 100], LINIE = [200, 196, 188];
    P.INK = INK; P.GRAU = GRAU; P.LINIE = LINIE;
    P.farbe = function (c) { d.setTextColor(c[0], c[1], c[2]); };
    P.schrift = function (stil, gr) { d.setFont("helvetica", stil); d.setFontSize(gr); };
    P.platz = function (h) { if (P.y + h > P.UNTEN) { d.addPage(); P.y = 22; } };
    P.seite = function () { d.addPage(); P.y = 22; };

    P.titel = function (t, unter, kopftext) {
      P.schrift("bold", 17); P.farbe(INK); d.text(t, P.x, P.y); P.y += 6.5;
      if (unter) { P.schrift("normal", 11); P.farbe(GRAU); d.text(unter, P.x, P.y); P.y += 6; }
      if (kopftext) {
        P.schrift("normal", 9); P.farbe(GRAU);
        var k = d.splitTextToSize(kopftext, P.B); d.text(k, P.x, P.y); P.y += k.length * 4 + 1;
      }
    };
    P.abschnitt = function (t) {
      P.platz(18);
      P.y += 3; P.schrift("bold", 10.5); P.farbe(INK); d.text(t, P.x, P.y);
      P.y += 1.8; d.setDrawColor(INK[0], INK[1], INK[2]); d.setLineWidth(0.35); d.line(P.x, P.y, P.rechts, P.y); P.y += 4.6;
    };
    P.LX = 58;   /* Breite der Bezeichnungsspalte */
    P.feld = function (label, w, hinweis) {
      var LX = P.LX;
      P.schrift("normal", 10);
      var zl = w ? d.splitTextToSize(String(w), P.B - LX) : [""];
      P.schrift("normal", 7);
      var hl = hinweis ? d.splitTextToSize(hinweis, LX - 3) : [];
      var h = Math.max(zl.length * 4.6, 3.4 + hl.length * 3) + 2;
      P.platz(h);
      P.schrift("normal", 9.5); P.farbe(GRAU); d.text(label, P.x, P.y);
      if (hl.length) { P.schrift("normal", 7); d.text(hl, P.x, P.y + 3.3); }
      P.schrift("normal", 10); P.farbe(INK); if (w) d.text(zl, P.x + LX, P.y);
      var ly = P.y + (zl.length - 1) * 4.6 + 1.6;
      if (hl.length) ly = Math.max(ly, P.y + 1.6);
      d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.25); d.line(P.x + LX, ly, P.rechts, ly);
      P.y += h;
    };
    /* Kleine Tabelle mit Kopfzeile in der Wertspalte (z. B. Stunden je Wochentag) */
    P.raster = function (label, hinweis, koepfe, werte) {
      var LX = P.LX;
      P.platz(17);
      P.schrift("normal", 9.5); P.farbe(GRAU); d.text(label, P.x, P.y);
      if (hinweis) { P.schrift("normal", 7.5); d.text(hinweis, P.x, P.y + 3.8); }
      var tb = (P.B - LX) / koepfe.length;
      d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.25);
      koepfe.forEach(function (k, i) {
        var tx = P.x + LX + i * tb;
        d.rect(tx, P.y - 3.6, tb, 5, "S"); d.rect(tx, P.y + 1.4, tb, 6.5, "S");
        P.schrift("normal", 8.5); P.farbe(GRAU); d.text(k, tx + tb / 2, P.y, {align: "center"});
        P.schrift("normal", 10); P.farbe(INK); if (werte[i]) d.text(String(werte[i]), tx + tb / 2, P.y + 6, {align: "center"});
      });
      P.y += 13;
    };
    /* Tabelle über die volle Breite: Spalten [{t, b}] (b = Anteil), Zeilen als Listen von Texten */
    P.tabelle = function (spalten, zeilen, gr) {
      gr = gr || 9;
      var summe = spalten.reduce(function (s, c) { return s + c.b; }, 0);
      var br = spalten.map(function (c) { return P.B * c.b / summe; });
      function zeile(werte, kopf) {
        P.schrift(kopf ? "bold" : "normal", gr);
        var zz = werte.map(function (w, i) { return d.splitTextToSize(String(w || ""), br[i] - 2); });
        var h = Math.max.apply(null, zz.map(function (z) { return z.length; })) * gr * 0.42 + 2.2;
        P.platz(h);
        var xx = P.x;
        zz.forEach(function (z, i) { P.farbe(kopf ? GRAU : INK); d.text(z, xx + 1, P.y + gr * 0.36); xx += br[i]; });
        P.y += h;
        d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.25); d.line(P.x, P.y - 0.8, P.rechts, P.y - 0.8);
      }
      zeile(spalten.map(function (c) { return c.t; }), true);
      zeilen.forEach(function (z) { zeile(z, false); });
      P.y += 2;
    };
    P.satz = function (t, stil, gr) {
      P.schrift(stil || "normal", gr || 10); P.farbe(INK);
      var z = d.splitTextToSize(t, P.B); P.platz(z.length * 4.4 + 2); d.text(z, P.x, P.y); P.y += z.length * 4.4 + 1;
    };

    /* Zweispaltiger Text mit Ziffern, Buchstaben und Zwischentiteln; danach Unterschriften.
       gez = gezählter Vertrag; opts: {titel, schluss, parteien: [[Rolle, Name]], erl: true für Erläuterungen} */
    P.spalten = function (gez, opts) {
      P.seite();
      P.schrift("bold", 13); P.farbe(INK); d.text(opts.titel, P.x, P.y); P.y += 7;
      var GAP = 6, CB = (P.B - GAP) / 2, col = 0, oben = P.y, ZH = 4.13, EIN = 5.2, GR = 9.8;
      function sx() { return P.x + col * (CB + GAP); }
      P.platz = function (h) {
        if (P.y + h <= P.UNTEN) return;
        if (col === 0) { col = 1; P.y = oben; return; }
        d.addPage(); col = 0; P.y = oben = 22;
      };
      function zeilen(liste, ein, dx, marke, bst, erste) {
        P.schrift("normal", GR); P.farbe(INK);
        liste.forEach(function (zl, k) {
          P.platz(ZH);
          if (erste.ja && bst) d.text(bst + ")", sx(), P.y);
          if (k === 0 && marke) d.text(marke, sx() + ein + 0.6, P.y);
          d.text(zl, sx() + ein + dx, P.y); P.y += ZH; erste.ja = false;
        });
      }
      function teilText(teil, ein, bst, erste) {
        P.schrift("normal", GR);
        if (typeof teil === "string") { zeilen(d.splitTextToSize(teil, CB - ein), ein, 0, null, bst, erste); return; }
        if (teil.liste) { (opts.erl ? teil.liste : VW.listeMitZeichen(teil.liste)).forEach(function (s) { zeilen(d.splitTextToSize(s, CB - ein - 3.4), ein, 3.4, "-", bst, erste); }); return; }
        if (teil.beispiel) { P.schrift("italic", GR); zeilen(d.splitTextToSize("Beispiel: " + teil.beispiel, CB - ein), ein, 0, null, bst, erste); return; }
        if (teil.hinweis) { zeilen(d.splitTextToSize(teil.hinweis, CB - ein), ein, 0, null, bst, erste); return; }
        if (teil.quellen) { zeilen(d.splitTextToSize("Grundlage: " + teil.quellen.map(function (q) { return q.t; }).join(", "), CB - ein), ein, 0, null, bst, erste); return; }
        if (teil.tabelle) {
          (teil.tabelle.zeilen || []).forEach(function (z) {
            var s = (teil.tabelle.kopf || []).map(function (k, i) { return i ? k + ": " + z[i] : z[i]; }).join("; ");
            zeilen(d.splitTextToSize(s, CB - ein - 3.4), ein, 3.4, "-", bst, erste);
          });
        }
      }
      if (opts.erl && gez.vorspann && gez.vorspann.length) {
        var erste0 = {ja: true};
        gez.vorspann.forEach(function (teil) { teilText(teil, 0, "", erste0); P.y += 1; });
        P.y += 2.2;
      }
      gez.forEach(function (z) {
        var abs = opts.erl ? [{bst: "", t: z.bloecke}] : z.abs;
        if (!abs[0].t.length) return;
        P.schrift("bold", 9.8);
        var tz = d.splitTextToSize((opts.erl ? "Ziff. " + z.nr + " " : z.nr + ". ") + z.titel, CB);
        P.platz(tz.length * 4.2 + 1.4 + 2 * ZH + (z.teil ? 6 : 0));
        if (z.teil) { P.schrift("bold", 8); P.farbe(GRAU); d.text(z.teil.toUpperCase(), sx(), P.y, {charSpace: 0.35}); P.y += 4.4; }
        P.schrift("bold", 9.8); P.farbe(INK); d.text(tz, sx(), P.y); P.y += tz.length * 4.2 + 0.8;
        abs.forEach(function (a) {
          var ein = a.bst ? EIN : 0, erste = {ja: true};
          a.t.forEach(function (teil) { teilText(teil, ein, a.bst, erste); if (opts.erl) P.y += 1; });
          P.y += 0.7;
        });
        P.y += 1.5;
      });
      if (opts.parteien) {
        P.schrift("normal", GR);
        var schluss = d.splitTextToSize(opts.schluss, CB);
        P.platz(schluss.length * ZH + 4);
        P.y += 2; P.farbe(INK); d.text(schluss, sx(), P.y); P.y += schluss.length * ZH + 4;
        opts.parteien.forEach(function (p) {
          P.platz(38);
          P.schrift("bold", 10.6); P.farbe(INK); d.text(p[0], sx(), P.y);
          if (p[1]) { P.schrift("normal", 8.5); P.farbe(GRAU); d.text(d.splitTextToSize(p[1], CB - 30)[0], sx() + 30, P.y); }
          ["Ort, Datum", "Unterschrift", "Name in Druckschrift"].forEach(function (l, i) {
            var ly = P.y + 9 + i * 10;
            d.setDrawColor(INK[0], INK[1], INK[2]); d.setLineWidth(0.3); d.line(sx(), ly, sx() + CB, ly);
            P.schrift("normal", 8.5); P.farbe(GRAU); d.text(l, sx(), ly + 3.6);
          });
          P.y += 9 + 2 * 10 + 10;
        });
      }
      P.platz = function (h) { if (P.y + h > P.UNTEN) { d.addPage(); P.y = 22; } };
    };
    P.fuss = function (text) {
      var n = d.getNumberOfPages();
      for (var i = 1; i <= n; i++) {
        d.setPage(i); P.schrift("normal", 8); P.farbe(GRAU);
        d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.25); d.line(P.x, P.PH - 13, P.rechts, P.PH - 13);
        d.text(text, P.x, P.PH - 9);
        d.text("Seite " + i + "/" + n, P.rechts, P.PH - 9, {align: "right"});
      }
    };
    return P;
  };

  /* ---------- Seite ---------- */

  if (typeof document === "undefined") {
    if (typeof module !== "undefined") module.exports = VW;
    return;
  }

  function $(id) { return document.getElementById(id); }
  VW.$ = $;
  VW.radio = function (name) { var r = document.querySelector("input[name=" + name + "]:checked"); return r ? r.value : ""; };
  VW.zahl = function (id, vorgabe) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v >= 0 ? v : vorgabe; };
  VW.wert = function (id) { var el = $(id); return el ? String(el.value || "").trim() : ""; };
  VW.zeige = function (el, an) { if (!el) return; if (an) el.removeAttribute("hidden"); else el.setAttribute("hidden", ""); };

  /* Text mit markierten Begriffen; `schon` hält fest, welche Begriffe im Abschnitt schon markiert
     sind (jeder Begriff einmal je Ziffer) */
  function textMitBegriffen(el, s, schon) {
    var treffer = VW.begriffeIn(s), pos = 0;
    treffer.forEach(function (t) {
      if (!t.id || schon[t.id]) return;
      schon[t.id] = true;
      if (t.von > pos) el.appendChild(document.createTextNode(s.slice(pos, t.von)));
      var sp = document.createElement("span");
      sp.className = "bg"; sp.tabIndex = 0; sp.setAttribute("data-b", t.id); sp.setAttribute("role", "button");
      sp.textContent = s.slice(t.von, t.bis);
      el.appendChild(sp);
      pos = t.bis;
    });
    if (pos < s.length) el.appendChild(document.createTextNode(s.slice(pos)));
  }
  VW.textMitBegriffen = textMitBegriffen;

  function absatzInhalt(t, teile, schon) {
    teile.forEach(function (teil) {
      if (typeof teil === "string") { var p = document.createElement("p"); textMitBegriffen(p, teil, schon); t.appendChild(p); return; }
      if (teil.liste) {
        var ul = document.createElement("ul");
        VW.listeMitZeichen(teil.liste).forEach(function (s) { var li = document.createElement("li"); textMitBegriffen(li, s, schon); ul.appendChild(li); });
        t.appendChild(ul);
      }
    });
  }

  /* Vorschau eines gezählten Vertrags; Absätze, die von der Grundfassung abweichen, sind hinterlegt */
  VW.vorschau = function (ziel, gez, grund) {
    ziel.textContent = "";
    gez.forEach(function (z) {
      var schon = {};
      if (z.teil) { var tt = document.createElement("div"); tt.className = "teil"; tt.textContent = z.teil; ziel.appendChild(tt); }
      var h = document.createElement("h4"); h.textContent = z.nr + ". " + z.titel; ziel.appendChild(h);
      z.abs.forEach(function (a) {
        var zeile = document.createElement("div"); zeile.className = "bst";
        var l = document.createElement("span"); l.textContent = a.bst ? a.bst + ")" : "";
        var t = document.createElement("div");
        if (grund && grund[z.id + "." + a.id] !== VW.vergleichstext(a)) t.className = "neu";
        absatzInhalt(t, a.t, schon);
        zeile.appendChild(l); zeile.appendChild(t); ziel.appendChild(zeile);
      });
    });
  };
  VW.grundKarte = function (gez) {
    var g = {};
    gez.forEach(function (z) { z.abs.forEach(function (a) { g[z.id + "." + a.id] = VW.vergleichstext(a); }); });
    return g;
  };

  /* Erläuterungen ins Ziel schreiben */
  VW.erlZeigen = function (ziel, erl, ueberschrift) {
    var schon;
    function block(el, bl) {
      if (typeof bl === "string") { var p = document.createElement("p"); textMitBegriffen(p, bl, schon); el.appendChild(p); return; }
      if (bl.liste) {
        var ul = document.createElement("ul");
        bl.liste.forEach(function (s) { var li = document.createElement("li"); textMitBegriffen(li, s, schon); ul.appendChild(li); });
        el.appendChild(ul); return;
      }
      if (bl.tabelle) {
        var wrap = document.createElement("div"); wrap.className = "tabwrap";
        var tb = document.createElement("table");
        if (bl.tabelle.kopf) {
          var tr = document.createElement("tr");
          bl.tabelle.kopf.forEach(function (k) { var th = document.createElement("th"); th.textContent = k; tr.appendChild(th); });
          var th0 = document.createElement("thead"); th0.appendChild(tr); tb.appendChild(th0);
        }
        var tbody = document.createElement("tbody");
        bl.tabelle.zeilen.forEach(function (z) {
          var tr2 = document.createElement("tr");
          z.forEach(function (c) { var td = document.createElement("td"); textMitBegriffen(td, String(c), schon); tr2.appendChild(td); });
          tbody.appendChild(tr2);
        });
        tb.appendChild(tbody); wrap.appendChild(tb); el.appendChild(wrap); return;
      }
      if (bl.beispiel) {
        var bx = document.createElement("div"); bx.className = "beispiel";
        var lb = document.createElement("span"); lb.className = "lbl"; lb.textContent = "Beispiel";
        bx.appendChild(lb); var pb = document.createElement("p"); textMitBegriffen(pb, bl.beispiel, schon); bx.appendChild(pb);
        el.appendChild(bx); return;
      }
      if (bl.hinweis) {
        var hx = document.createElement("div"); hx.className = "erlhinweis"; textMitBegriffen(hx, bl.hinweis, schon); el.appendChild(hx); return;
      }
      if (bl.quellen) {
        var q = document.createElement("p"); q.className = "q"; q.appendChild(document.createTextNode("Grundlage: "));
        bl.quellen.forEach(function (qq, i) {
          if (i) q.appendChild(document.createTextNode(" · "));
          if (qq.url) { var a = document.createElement("a"); a.href = qq.url; a.rel = "noopener"; a.target = "_blank"; a.textContent = qq.t; q.appendChild(a); }
          else q.appendChild(document.createTextNode(qq.t));
        });
        el.appendChild(q);
      }
    }
    var sek = document.createElement("div"); sek.className = "erlteil";
    if (ueberschrift) { var h3 = document.createElement("h3"); h3.className = "erlvertrag"; h3.textContent = ueberschrift; sek.appendChild(h3); }
    schon = {};
    erl.vorspann.forEach(function (bl) { block(sek, bl); });
    erl.forEach(function (z) {
      if (!z.bloecke.length) return;
      schon = {};
      if (z.teil) { var tt = document.createElement("div"); tt.className = "teil"; tt.textContent = z.teil; sek.appendChild(tt); }
      var h = document.createElement("h4"); h.textContent = "Ziff. " + z.nr + " " + z.titel; sek.appendChild(h);
      z.bloecke.forEach(function (bl) { block(sek, bl); });
    });
    ziel.appendChild(sek);
  };

  /* ---------- Begriffskärtchen ----------
     Bleibt die Maus kurz auf einem markierten Begriff stehen, erscheint das Kärtchen; sobald sie sich
     wieder bewegt, verschwindet es. Klick oder Enter öffnet den Eintrag im Lexikon. Auf Touch öffnet
     das erste Tippen das Kärtchen, das zweite den Eintrag; Tippen daneben schliesst es. */
  var karte = null, kTimer = null, kPos = null, kBegriff = null;
  function karteBauen() {
    karte = document.createElement("div");
    karte.className = "bkarte"; karte.setAttribute("role", "tooltip"); karte.hidden = true;
    document.body.appendChild(karte);
  }
  function karteZeigen(sp) {
    var e = VW.begriff(sp.getAttribute("data-b"));
    if (!e) return;
    karte.textContent = "";
    var h = document.createElement("strong"); h.textContent = e.wort; karte.appendChild(h);
    var p = document.createElement("p"); p.textContent = e.kurz; karte.appendChild(p);
    var s = document.createElement("span"); s.className = "mehr"; s.textContent = "Klick: mehr im Lexikon"; karte.appendChild(s);
    karte.hidden = false;
    var r = sp.getBoundingClientRect(), kb = Math.min(340, window.innerWidth - 24);
    karte.style.maxWidth = kb + "px";
    var x = Math.min(Math.max(12, r.left), window.innerWidth - kb - 12);
    var y = r.bottom + 8;
    karte.style.left = (x + window.pageXOffset) + "px";
    karte.style.top = (y + window.pageYOffset) + "px";
    if (karte.getBoundingClientRect().bottom > window.innerHeight - 8) karte.style.top = (r.top - karte.offsetHeight - 8 + window.pageYOffset) + "px";
    kBegriff = sp;
  }
  function karteWeg() { clearTimeout(kTimer); if (karte) karte.hidden = true; kBegriff = null; }
  function zumLexikon(id) { location.hash = "begriff-" + id; }
  function karteEinrichten() {
    karteBauen();
    document.addEventListener("mousemove", function (ev) {
      if (kPos && Math.abs(ev.clientX - kPos.x) < 3 && Math.abs(ev.clientY - kPos.y) < 3) return;
      kPos = {x: ev.clientX, y: ev.clientY};
      karteWeg();
      var sp = ev.target.closest ? ev.target.closest(".bg") : null;
      if (sp) kTimer = setTimeout(function () { karteZeigen(sp); }, 450);
    });
    document.addEventListener("click", function (ev) {
      var sp = ev.target.closest ? ev.target.closest(".bg") : null;
      if (!sp) { karteWeg(); return; }
      ev.preventDefault();
      if (ev.pointerType === "touch" || (ev.sourceCapabilities && ev.sourceCapabilities.firesTouchEvents)) {
        if (kBegriff !== sp) { karteZeigen(sp); return; }
      }
      karteWeg(); zumLexikon(sp.getAttribute("data-b"));
    });
    document.addEventListener("focusin", function (ev) { if (ev.target.classList && ev.target.classList.contains("bg")) karteZeigen(ev.target); });
    document.addEventListener("focusout", function (ev) { if (ev.target.classList && ev.target.classList.contains("bg")) karteWeg(); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") karteWeg();
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.classList && ev.target.classList.contains("bg")) { ev.preventDefault(); karteWeg(); zumLexikon(ev.target.getAttribute("data-b")); }
    });
    window.addEventListener("scroll", karteWeg, {passive: true});
  }

  /* ---------- Reiter ---------- */

  var REITER = ["verleihvertrag", "erlaeuterungen", "arbeitsvertrag", "begriffe"];
  function reiterAus(hash) {
    var h = (hash || "").replace(/^#/, "");
    if (/^begriff-/.test(h)) return "begriffe";
    return REITER.indexOf(h) >= 0 ? h : "verleihvertrag";
  }
  function reiterZeigen() {
    var h = location.hash.replace(/^#/, ""), r = reiterAus(h);
    REITER.forEach(function (k) {
      VW.zeige($("p-" + k), k === r);
      var t = $("t-" + k); if (t) { t.setAttribute("aria-selected", k === r ? "true" : "false"); t.classList.toggle("on", k === r); }
    });
    document.dispatchEvent(new Event("achse-neu"));
    if (/^begriff-/.test(h)) {
      var el = $("b-" + h.slice(8));
      if (el) {
        el.classList.add("ziel"); setTimeout(function () { el.classList.remove("ziel"); }, 1600);
        /* erst nach dem Aufbau des Reiters und der Sprungmarken rollen */
        setTimeout(function () { el.scrollIntoView({block: "center"}); }, 60);
      }
    } else if (h) {
      var tb = $("reiter"); if (tb && tb.getBoundingClientRect().top < 0) tb.scrollIntoView({block: "start"});
    }
  }

  /* Gemeinsame Angaben: Felder mit gleichem data-g zeigen denselben Wert */
  function abgleichen(ev) {
    var g = ev.target.getAttribute && ev.target.getAttribute("data-g");
    if (!g) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-g=\"" + g + "\"]"), function (el) {
      if (el !== ev.target && el.value !== ev.target.value) el.value = ev.target.value;
    });
  }

  /* ---------- Gesamtansicht ---------- */

  VW.ansicht = function () {
    var zahlen = {}, stand = {};
    ["vv", "av"].forEach(function (art) {
      var V = VW.vertraege[art];
      if (!V) return;
      var o = V.auswahl(), f = V.felder();
      if (V.ansichtFelder) V.ansichtFelder(o);
      var gez = VW.gezaehlt(V.modell(o, f), art, zahlen);
      stand[art] = {V: V, o: o, f: f, gez: gez};
    });
    /* zweiter Durchgang, damit Marken in den jeweils anderen Vertrag Ziele finden */
    Object.keys(stand).forEach(function (art) {
      var s = stand[art];
      s.gez = VW.gezaehlt(s.V.modell(s.o, s.f), art, zahlen);
      var gGrund = VW.gezaehlt(s.V.modell(s.V.GRUND, {}), art, JSON.parse(JSON.stringify(zahlen)));
      if ($(s.V.vorschauId)) VW.vorschau($(s.V.vorschauId), s.gez, VW.grundKarte(gGrund));
    });
    var ez = $("erl");
    if (ez) {
      ez.textContent = "";
      Object.keys(stand).forEach(function (art) {
        var s = stand[art];
        VW.erlZeigen(ez, VW.erlaeutert(art, s.o, s.f, s.gez, zahlen), s.V.erlTitel);
      });
    }
    VW.stand = stand; VW.zahlen = zahlen;
    VW.vorschauWeg();
  };

  /* ---------- PDF-Vorschau ---------- */

  var vorschau = {url: null, name: "", art: ""};
  VW.pdfErstellen = function (art) {
    var fe = $("fehler-" + art); VW.zeige(fe, false);
    if (!window.jspdf || !window.jspdf.jsPDF) {
      fe.textContent = "PDF-Bibliothek nicht geladen. Bitte die Seite neu laden."; VW.zeige(fe, true); return;
    }
    VW.ansicht();
    var V = VW.vertraege[art], s = VW.stand[art];
    var mit = $("erl-beilage-" + art);
    var d = V.pdf(window.jspdf.jsPDF, s.o, s.f, s.gez, VW.zahlen, !!(mit && mit.checked));
    VW.vorschauWeg();
    vorschau.url = URL.createObjectURL(d.output("blob")); vorschau.name = V.dateiname(s.f); vorschau.art = art;
    $("pdfrahmen-" + art).src = vorschau.url;
    VW.zeige($("pdfvorschau-" + art), true);
    $("pdfvorschau-" + art).scrollIntoView({behavior: "smooth", block: "start"});
  };
  VW.vorschauWeg = function () {
    if (!vorschau.url) return;
    VW.zeige($("pdfvorschau-" + vorschau.art), false); $("pdfrahmen-" + vorschau.art).removeAttribute("src");
    URL.revokeObjectURL(vorschau.url); vorschau.url = null;
  };
  function pdfHerunterladen() {
    if (!vorschau.url) return;
    var a = document.createElement("a"); a.href = vorschau.url; a.download = vorschau.name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  VW.dateiteil = function (s) {
    return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
  };

  /* ---------- Start ---------- */

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll("select.kanton"), function (sel) {
      VW.KANTONE.forEach(function (k) {
        var op = document.createElement("option"); op.value = k[0]; op.textContent = k[1];
        if (k[0] === "BE") op.selected = true;
        sel.appendChild(op);
      });
    });
    Object.keys(VW.vertraege).forEach(function (art) { if (VW.vertraege[art].einrichten) VW.vertraege[art].einrichten(); });
    if (VW.lexikonBauen) VW.lexikonBauen();
    Array.prototype.forEach.call(document.querySelectorAll(".calc-main"), function (m) {
      m.addEventListener("input", function (ev) { abgleichen(ev); VW.ansicht(); });
      m.addEventListener("change", function (ev) { abgleichen(ev); VW.ansicht(); });
    });
    ["vv", "av"].forEach(function (art) {
      if (!$("pdf-" + art)) return;
      $("pdf-" + art).addEventListener("click", function () { VW.pdfErstellen(art); });
      $("pdfdown-" + art).addEventListener("click", pdfHerunterladen);
      $("pdftab-" + art).addEventListener("click", function () { if (vorschau.url) window.open(vorschau.url, "_blank"); });
    });
    karteEinrichten();
    window.addEventListener("hashchange", reiterZeigen);
    VW.ansicht();
    reiterZeigen();
  }
  document.addEventListener("DOMContentLoaded", start);

})(typeof window !== "undefined" ? window : globalThis);
