/* Schema zeichnen (schema_zeichnen.html): ein Blatt A4 (quer oder hochkant) im Raster 5 mm, auf das
   der Nutzer Symbole aus schema_symbole.js setzt, mit rechtwinkligen Leitern verbindet und beschriftet.
   Gespeichert wird nur als Datei (Projekt herunterladen, später wieder öffnen); die Seite legt im
   Browser nichts ab. Ausgabe als PDF (1:1), DXF (R12) und SVG über schema_kern.js.

   Projekt (Datei .schema.json):
     {format: "naville-schema", version: 1, blatt: {lage: "quer"|"hoch"},
      kopf: {projekt, zeichnung, zeichner, datum, blatt},
      elemente: [{id, sym, x, y, dreh, spiegel, kz}],      Symbol am Einfügepunkt (x, y), gedreht, gespiegelt
      knoten:   [{id, x, y}],                             Abzweig oder Knick einer Leitung
      leiter:   [{id, a, b}],                             Enden: {el, an} (Anschluss Nr. an) oder {kn}
      texte:    [{id, x, y, text, gr}],
      symbole:  {sym: {name, quelle, formen}}}            Formen der verwendeten Symbole, damit die Datei
                                                          auch ohne diese Seite vollständig bleibt
   Koordinaten in Rastereinheiten wie die Symbole (1 Einheit = 0.5 mm). Der Weg einer Leitung wird
   aus ihren Enden gerechnet (rechtwinklig, nach der Richtung der Anschlüsse); Knicks und Abzweige
   entstehen über Knoten. */
(function () {
  "use strict";

  var K = window.SchemaKern, MM = K.MM, esc = K.esc;
  var FANG = 5, RASTER = 10, RAND = 20;          /* Fangraster 2.5 mm, Punktraster 5 mm, Rand 10 mm */
  var BLATT = {quer: [594, 420], hoch: [420, 594]};
  var SF_B = 340, SF_H = 50;                     /* Schriftfeld 170 x 25 mm */
  var TEXTGR = {5: "klein", 6: "normal", 8: "gross"};

  /* Bibliothek: Stromlauf-Symbole, IEC-Grundsatz zuerst */
  var REIHE = ["IEC-Form", "VSTEI 2015", "Brunner", "Sauter 1974"];
  var BIB = (window.SCHEMA_SYMBOLE || []).filter(function (s) { return s.bereich === "Stromlaufschema"; })
    .map(function (s, i) { s.nr = i; return s; })
    .sort(function (a, b) { return (REIHE.indexOf(a.schluessel) - REIHE.indexOf(b.schluessel)) || (a.nr - b.nr); });
  var BIB_ID = {};
  BIB.forEach(function (s) { BIB_ID[s.id] = s; });

  /* Vorschlag für das Kennzeichen beim Setzen (frei änderbar) */
  var KZ = [[/spule/, "-K"], [/lampe|glimm|meldeleuchte/, "-H"], [/motor(?!schutz)/, "-M"], [/klemme/, "-X"],
    [/sicherung|leitungsschutz|motorschutz|fi_|fehlerstrom/, "-F"], [/trafo|transformator/, "-T"], [/taster|schalter/, "-S"]];

  function $(id) { return document.getElementById(id); }
  function zeige(el, an) { el.hidden = !an; }
  function fang(v) { return Math.round(v / FANG) * FANG; }

  /* ---------- Zustand ---------- */

  function leer() {
    return {format: "naville-schema", version: 1, blatt: {lage: "quer"},
      kopf: {projekt: "", zeichnung: "", zeichner: "", datum: K.datumCH(), blatt: "1/1"},
      elemente: [], knoten: [], leiter: [], texte: []};
  }
  var P = leer(), fremd = {};             /* fremd: Symbole aus einer geöffneten Datei, die die Bibliothek nicht kennt */
  var zurueck = [], vor = [], geaendert = false, naechste = 1;
  var auswahl = [];                        /* [{art: "el"|"kn"|"le"|"tx", id}] */
  var werkzeug = "wahl", setzen = null;    /* setzen: {sym, dreh, spiegel} beim Platzieren */
  var zug = null;                          /* Leitung im Entstehen: {von: Ende, p: [x, y]} */
  var maus = [0, 0], ansicht = null;

  function neueId(p) { return p + (naechste++); }
  function sym(id) { return BIB_ID[id] || fremd[id]; }
  function nach(liste, id) { for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i]; return null; }

  function merken() {
    zurueck.push(JSON.stringify(P)); if (zurueck.length > 100) zurueck.shift();
    vor = []; geaendert = true; status();
  }
  function laden(json) { P = JSON.parse(json); auswahl = []; zeichnen(); eigenschaften(); }
  function rueckgaengig() { if (!zurueck.length) return; vor.push(JSON.stringify(P)); laden(zurueck.pop()); geaendert = true; status(); }
  function wiederholen() { if (!vor.length) return; zurueck.push(JSON.stringify(P)); laden(vor.pop()); geaendert = true; status(); }

  /* ---------- Geometrie ---------- */

  function formenVon(e) {
    var s = sym(e.sym);
    if (!s) return [];
    return K.verschiebe(K.transformiere(s.formen, e.dreh, e.spiegel), e.x, e.y);
  }
  function anschluesseVon(e) { return K.anschluesse(formenVon(e)); }
  function ende(en) {   /* [x, y, richtung oder null] */
    if (en.kn) { var k = nach(P.knoten, en.kn); return k ? [k.x, k.y, null] : null; }
    var e = nach(P.elemente, en.el); if (!e) return null;
    var a = anschluesseVon(e)[en.an]; return a ? [a[1], a[2], a[3]] : null;
  }
  function senkrecht(r) { return r === "n" || r === "s"; }

  /* Rechtwinkliger Weg von A nach B nach der Richtung der Anschlüsse */
  function weg(a, b) {
    var ax = a[0], ay = a[1], bx = b[0], by = b[1];
    if (ax === bx || ay === by) return [[ax, ay], [bx, by]];
    var va = a[2] ? senkrecht(a[2]) : (b[2] ? !senkrecht(b[2]) : true);
    var vb = b[2] ? senkrecht(b[2]) : !va;
    if (va && vb) { var my = fang((ay + by) / 2); return [[ax, ay], [ax, my], [bx, my], [bx, by]]; }
    if (!va && !vb) { var mx = fang((ax + bx) / 2); return [[ax, ay], [mx, ay], [mx, by], [bx, by]]; }
    if (va) return [[ax, ay], [ax, by], [bx, by]];
    return [[ax, ay], [bx, ay], [bx, by]];
  }
  function leiterWeg(l) { var a = ende(l.a), b = ende(l.b); return a && b ? weg(a, b) : null; }
  function anzahlAm(kn) { return P.leiter.filter(function (l) { return l.a.kn === kn || l.b.kn === kn; }).length; }

  /* Abstand Punkt zu Strecke, und der Fusspunkt im Fangraster */
  function aufStrecke(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    var t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
    var q = [a[0] + t * dx, a[1] + t * dy];
    return {d: Math.hypot(p[0] - q[0], p[1] - q[1]), q: [dx ? fang(q[0]) : a[0], dy ? fang(q[1]) : a[1]]};
  }

  /* Was liegt unter dem Punkt (für Leitungen): Anschluss, Knoten, Leitung oder nichts */
  function ziel(p) {
    var best = null, bd = 4;
    P.elemente.forEach(function (e) {
      anschluesseVon(e).forEach(function (a, i) {
        var d = Math.hypot(a[1] - p[0], a[2] - p[1]);
        if (d < bd) { bd = d; best = {art: "an", ende: {el: e.id, an: i}, p: [a[1], a[2]]}; }
      });
    });
    P.knoten.forEach(function (k) {
      var d = Math.hypot(k.x - p[0], k.y - p[1]);
      if (d < bd) { bd = d; best = {art: "kn", ende: {kn: k.id}, p: [k.x, k.y]}; }
    });
    if (best) return best;
    for (var i = 0; i < P.leiter.length; i++) {
      var w = leiterWeg(P.leiter[i]); if (!w) continue;
      for (var j = 0; j + 1 < w.length; j++) {
        var s = aufStrecke(p, w[j], w[j + 1]);
        if (s.d < 3) return {art: "le", le: P.leiter[i], p: s.q};
      }
    }
    return {art: "leer", p: [fang(p[0]), fang(p[1])]};
  }

  /* Leitung an einem Punkt teilen: neuer Knoten, zwei Leitungen */
  function teilen(l, p) {
    var k = {id: neueId("k"), x: p[0], y: p[1]};
    P.knoten.push(k);
    P.leiter.splice(P.leiter.indexOf(l), 1,
      {id: neueId("l"), a: l.a, b: {kn: k.id}}, {id: neueId("l"), a: {kn: k.id}, b: l.b});
    return {kn: k.id};
  }
  function endeAus(t) {   /* Ende für ein Ziel; legt Knoten an, wo nötig */
    if (t.art === "an" || t.art === "kn") return t.ende;
    if (t.art === "le") return teilen(t.le, t.p);
    var k = {id: neueId("k"), x: t.p[0], y: t.p[1]}; P.knoten.push(k); return {kn: k.id};
  }
  function gleich(a, b) { return a.kn ? a.kn === b.kn : (a.el === b.el && a.an === b.an); }

  /* Knoten ohne Leitung fallen weg; Knoten mit genau zwei Leitungen bleiben als Knick */
  function aufraeumen() {
    P.knoten = P.knoten.filter(function (k) { return anzahlAm(k.id) > 0; });
  }

  function loeschen() {
    if (!auswahl.length) return;
    merken();
    auswahl.forEach(function (a) {
      if (a.art === "el") {
        P.elemente = P.elemente.filter(function (e) { return e.id !== a.id; });
        P.leiter = P.leiter.filter(function (l) { return l.a.el !== a.id && l.b.el !== a.id; });
      } else if (a.art === "kn") {
        P.knoten = P.knoten.filter(function (k) { return k.id !== a.id; });
        P.leiter = P.leiter.filter(function (l) { return l.a.kn !== a.id && l.b.kn !== a.id; });
      } else if (a.art === "le") P.leiter = P.leiter.filter(function (l) { return l.id !== a.id; });
      else if (a.art === "tx") P.texte = P.texte.filter(function (t) { return t.id !== a.id; });
    });
    aufraeumen(); auswahl = []; zeichnen(); eigenschaften();
  }

  function drehen() {
    if (setzen) { setzen.dreh = (setzen.dreh + 90) % 360; zeichnen(); return; }
    var els = gewaehlt("el"); if (!els.length) return;
    merken(); els.forEach(function (e) { e.dreh = ((e.dreh || 0) + 90) % 360; }); zeichnen(); eigenschaften();
  }
  function spiegeln() {
    if (setzen) { setzen.spiegel = !setzen.spiegel; zeichnen(); return; }
    var els = gewaehlt("el"); if (!els.length) return;
    merken(); els.forEach(function (e) { e.spiegel = !e.spiegel; }); zeichnen(); eigenschaften();
  }
  function gewaehlt(art) {
    var liste = {el: P.elemente, kn: P.knoten, le: P.leiter, tx: P.texte}[art];
    return auswahl.filter(function (a) { return a.art === art; }).map(function (a) { return nach(liste, a.id); }).filter(Boolean);
  }
  function istGewaehlt(art, id) { return auswahl.some(function (a) { return a.art === art && a.id === id; }); }

  function kzVorschlag(id) {
    for (var i = 0; i < KZ.length; i++) if (KZ[i][0].test(id)) {
      var p = KZ[i][1], n = 1;
      while (P.elemente.some(function (e) { return e.kz === p + n; })) n++;
      return p + n;
    }
    return "";
  }

  /* ---------- Darstellung (SVG) ---------- */

  var svg = $("blatt");

  function groesse() { return BLATT[P.blatt.lage] || BLATT.quer; }

  /* Rahmen und Schriftfeld als Formen, für Bildschirm, PDF, SVG und DXF gleich */
  function rahmenFormen() {
    var g = groesse(), W = g[0], H = g[1], x1 = W - RAND, y1 = H - RAND, sx = x1 - SF_B, sy = y1 - SF_H;
    var k = P.kopf, f = [["R", RAND, RAND, W - 2 * RAND, H - 2 * RAND, 0], ["R", sx, sy, SF_B, SF_H, 0],
      ["L", sx, sy + 25, x1, sy + 25], ["L", sx + 220, sy, sx + 220, y1], ["L", sx + 220, sy + 25, x1, sy + 25]];
    function feld(x, y, titel, wert, gr) { f.push(["T", x + 3, y + 7, titel, 3.6]); if (wert) f.push(["T", x + 3, y + 20, wert, gr || 6]); }
    feld(sx, sy, "Projekt", k.projekt); feld(sx + 220, sy, "Datum", k.datum);
    feld(sx, sy + 25, "Zeichnung", k.zeichnung); feld(sx + 220, sy + 25, "Blatt", k.blatt);
    f.push(["L", sx + 150, sy + 25, sx + 150, y1]); feld(sx + 150, sy + 25, "Gezeichnet", k.zeichner, 5);
    f.push(["T", RAND, H - RAND + 12, "Symbole: naville-handwerk.ch/schema.html, CC BY-SA 4.0", 3.6]);
    return f;
  }

  function kzFormen(e) {   /* Kennzeichen links neben dem Symbol, auf halber Höhe */
    if (!e.kz) return [];
    var r = K.rahmenVon(formenVon(e).filter(function (f) { return f[0] !== "A" && f[0] !== "T"; }));
    return [["T", r[0] - 3, (r[1] + r[3]) / 2 + 2.8, e.kz, 6, "rechts"]];
  }

  function textSvg(f, klasse) {
    return '<text x="' + f[1] + '" y="' + f[2] + '" font-size="' + K.textGroesse(f).toFixed(2) + '"' + (f[5] === "rechts" ? ' text-anchor="end"' : "")
      + (klasse ? ' class="' + klasse + '"' : "") + ' fill="currentColor" stroke="none">' + esc(f[3]) + "</text>";
  }

  function zeichnen() {
    var g = groesse(), o = [];
    if (!ansicht) ansicht = [-10, -10, g[0] + 20, g[1] + 20];
    svg.setAttribute("viewBox", ansicht.join(" "));
    o.push('<rect class="papier" x="0" y="0" width="' + g[0] + '" height="' + g[1] + '"/>');
    o.push('<rect class="raster" x="' + RAND + '" y="' + RAND + '" width="' + (g[0] - 2 * RAND) + '" height="' + (g[1] - 2 * RAND) + '"/>');
    o.push('<g class="rahmen">' + K.svgFormen(rahmenFormen().filter(function (f) { return f[0] !== "T"; }), false)
      + rahmenFormen().filter(function (f) { return f[0] === "T"; }).map(function (f) { return textSvg(f); }).join("") + "</g>");

    P.leiter.forEach(function (l) {
      var w = leiterWeg(l); if (!w) return;
      var pkt = w.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
      o.push('<g data-le="' + l.id + '" class="leiter' + (istGewaehlt("le", l.id) ? " gew" : "") + '"><polyline points="' + pkt + '"/><polyline class="treff" points="' + pkt + '"/></g>');
    });
    P.knoten.forEach(function (k) {
      var n = anzahlAm(k.id);
      o.push('<g data-kn="' + k.id + '" class="knoten' + (istGewaehlt("kn", k.id) ? " gew" : "") + '">'
        + (n >= 3 ? '<circle cx="' + k.x + '" cy="' + k.y + '" r="1.6" class="punkt"/>' : "")
        + '<circle cx="' + k.x + '" cy="' + k.y + '" r="3" class="treff"/></g>');
    });
    P.elemente.forEach(function (e) {
      var f = formenVon(e), r = K.rahmenVon(f.filter(function (x) { return x[0] !== "A"; }));
      o.push('<g data-el="' + e.id + '" class="element' + (istGewaehlt("el", e.id) ? " gew" : "") + '">'
        + '<rect class="treff" x="' + (r[0] - 2) + '" y="' + (r[1] - 2) + '" width="' + (r[2] - r[0] + 4) + '" height="' + (r[3] - r[1] + 4) + '"/>'
        + K.svgFormen(f, werkzeug === "leiter") + kzFormen(e).map(function (x) { return textSvg(x); }).join("") + "</g>");
    });
    P.texte.forEach(function (t) {
      o.push('<g data-tx="' + t.id + '" class="freitext' + (istGewaehlt("tx", t.id) ? " gew" : "") + '">' + textSvg(["T", t.x, t.y, t.text, t.gr]) + "</g>");
    });
    o.push('<g id="ueber"></g>');
    svg.innerHTML = o.join("");
    ueberlagerung();
  }

  /* Vorschau beim Setzen, Leitung im Entstehen, Fangpunkt, Rahmen der Auswahl */
  function ueberlagerung() {
    var u = $("ueber"); if (!u) return;
    var o = [];
    if (setzen) {
      var s = sym(setzen.sym);
      if (s) o.push('<g class="geist">' + K.svgFormen(K.verschiebe(K.transformiere(s.formen, setzen.dreh, setzen.spiegel), fang(maus[0]), fang(maus[1])), true) + "</g>");
    }
    if (werkzeug === "leiter") {
      var t = ziel(maus);
      if (zug) {
        var a = ende(zug.von), b = t.art === "an" ? ende(t.ende) : [t.p[0], t.p[1], null];
        if (a && b) o.push('<polyline class="entwurf" points="' + weg(a, b).map(function (p) { return p.join(","); }).join(" ") + '"/>');
      }
      o.push('<circle class="fangpunkt' + (t.art === "leer" ? "" : " treffer") + '" cx="' + t.p[0] + '" cy="' + t.p[1] + '" r="2.2"/>');
    }
    if (rahmenZug) {
      var x = Math.min(rahmenZug.a[0], rahmenZug.b[0]), y = Math.min(rahmenZug.a[1], rahmenZug.b[1]);
      o.push('<rect class="band" x="' + x + '" y="' + y + '" width="' + Math.abs(rahmenZug.b[0] - rahmenZug.a[0]) + '" height="' + Math.abs(rahmenZug.b[1] - rahmenZug.a[1]) + '"/>');
    }
    u.innerHTML = o.join("");
  }

  /* ---------- Zoom und Verschieben der Ansicht ---------- */

  function punktAus(ev) {
    var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    var q = pt.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y];
  }
  function zoom(faktor, um) {
    var v = ansicht, c = um || [v[0] + v[2] / 2, v[1] + v[3] / 2];
    var w = Math.max(60, Math.min(1400, v[2] * faktor)), h = v[3] * w / v[2];
    ansicht = [c[0] - (c[0] - v[0]) * w / v[2], c[1] - (c[1] - v[1]) * h / v[3], w, h];
    svg.setAttribute("viewBox", ansicht.join(" "));
  }
  function ganzesBlatt() { var g = groesse(); ansicht = [-10, -10, g[0] + 20, g[1] + 20]; svg.setAttribute("viewBox", ansicht.join(" ")); }

  svg.addEventListener("wheel", function (ev) {
    ev.preventDefault(); zoom(ev.deltaY > 0 ? 1.15 : 1 / 1.15, punktAus(ev));
  }, {passive: false});

  /* ---------- Zeiger ---------- */

  var druck = null, rahmenZug = null, zeiger = {};

  svg.addEventListener("pointerdown", function (ev) {
    zeiger[ev.pointerId] = [ev.clientX, ev.clientY];
    var p = punktAus(ev); maus = p;
    svg.setPointerCapture(ev.pointerId);
    if (Object.keys(zeiger).length === 2) { druck = {art: "zwei", ansicht: ansicht.slice(), start: zweiStand()}; return; }
    if (ev.button === 1 || ev.button === 2 || (ev.pointerType === "touch" && werkzeug === "wahl" && !treffer(ev))) {
      druck = {art: "schieben", start: [ev.clientX, ev.clientY], ansicht: ansicht.slice()}; return;
    }
    if (ev.button !== 0) return;
    if (setzen) { druck = {art: "setzen"}; return; }
    if (werkzeug === "leiter") { druck = {art: "leiter"}; return; }
    if (werkzeug === "text") { druck = {art: "text"}; return; }
    var tr = treffer(ev);
    if (tr) {
      if (!istGewaehlt(tr.art, tr.id)) { if (!ev.shiftKey) auswahl = []; auswahl.push(tr); zeichnen(); eigenschaften(); }
      else if (ev.shiftKey) { auswahl = auswahl.filter(function (a) { return !(a.art === tr.art && a.id === tr.id); }); zeichnen(); eigenschaften(); return; }
      druck = {art: "ziehen", start: p, dx: 0, dy: 0, stand: JSON.stringify(P)};
    } else {
      if (!ev.shiftKey && auswahl.length) { auswahl = []; zeichnen(); eigenschaften(); }
      rahmenZug = {a: p, b: p}; druck = {art: "band"};
    }
  });

  function treffer(ev) {
    var t = ev.target.closest ? ev.target.closest("[data-el],[data-kn],[data-le],[data-tx]") : null;
    if (!t) return null;
    if (t.dataset.el) return {art: "el", id: t.dataset.el};
    if (t.dataset.kn) return {art: "kn", id: t.dataset.kn};
    if (t.dataset.le) return {art: "le", id: t.dataset.le};
    return {art: "tx", id: t.dataset.tx};
  }
  function zweiStand() {
    var z = Object.keys(zeiger).map(function (k) { return zeiger[k]; });
    return {m: [(z[0][0] + z[1][0]) / 2, (z[0][1] + z[1][1]) / 2], d: Math.hypot(z[0][0] - z[1][0], z[0][1] - z[1][1])};
  }

  svg.addEventListener("pointermove", function (ev) {
    if (zeiger[ev.pointerId]) zeiger[ev.pointerId] = [ev.clientX, ev.clientY];
    var p = punktAus(ev); maus = p;
    if (druck && druck.art === "zwei" && Object.keys(zeiger).length === 2) {
      var s = zweiStand(), r = svg.getBoundingClientRect(), f = druck.start.d / Math.max(1, s.d);
      var v = druck.ansicht, w = Math.max(60, Math.min(1400, v[2] * f)), h = v[3] * w / v[2];
      var mx = v[0] + (druck.start.m[0] - r.left) / r.width * v[2], my = v[1] + (druck.start.m[1] - r.top) / r.height * v[3];
      ansicht = [mx - (s.m[0] - r.left) / r.width * w, my - (s.m[1] - r.top) / r.height * h, w, h];
      svg.setAttribute("viewBox", ansicht.join(" ")); return;
    }
    if (druck && druck.art === "schieben") {
      var rr = svg.getBoundingClientRect(), k = druck.ansicht[2] / rr.width;
      ansicht = [druck.ansicht[0] - (ev.clientX - druck.start[0]) * k, druck.ansicht[1] - (ev.clientY - druck.start[1]) * k, druck.ansicht[2], druck.ansicht[3]];
      svg.setAttribute("viewBox", ansicht.join(" ")); return;
    }
    if (druck && druck.art === "ziehen") {
      var dx = fang(p[0] - druck.start[0]), dy = fang(p[1] - druck.start[1]);
      if (dx !== druck.dx || dy !== druck.dy) {
        verschieben(dx - druck.dx, dy - druck.dy); druck.dx = dx; druck.dy = dy; druck.bewegt = true; zeichnen();
      }
      return;
    }
    if (druck && druck.art === "band") { rahmenZug.b = p; ueberlagerung(); return; }
    ueberlagerung();
  });

  function verschieben(dx, dy) {
    gewaehlt("el").forEach(function (e) { e.x += dx; e.y += dy; });
    gewaehlt("kn").forEach(function (k) { k.x += dx; k.y += dy; });
    gewaehlt("tx").forEach(function (t) { t.x += dx; t.y += dy; });
  }

  function los(ev) {
    delete zeiger[ev.pointerId];
    var d = druck; druck = null;
    if (!d) return;
    var p = punktAus(ev);
    if (d.art === "ziehen" && d.bewegt) {
      zurueck.push(d.stand); vor = []; geaendert = true; status(); eigenschaften();
    } else if (d.art === "band") {
      var a = rahmenZug.a, b = rahmenZug.b, x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
      rahmenZug = null;
      if (x1 - x0 > 2 || y1 - y0 > 2) {
        function drin(x, y) { return x >= x0 && x <= x1 && y >= y0 && y <= y1; }
        P.elemente.forEach(function (e) { if (drin(e.x, e.y) && !istGewaehlt("el", e.id)) auswahl.push({art: "el", id: e.id}); });
        P.knoten.forEach(function (k) { if (drin(k.x, k.y) && !istGewaehlt("kn", k.id)) auswahl.push({art: "kn", id: k.id}); });
        P.texte.forEach(function (t) { if (drin(t.x, t.y) && !istGewaehlt("tx", t.id)) auswahl.push({art: "tx", id: t.id}); });
        P.leiter.forEach(function (l) {
          var w = leiterWeg(l);
          if (w && drin(w[0][0], w[0][1]) && drin(w[w.length - 1][0], w[w.length - 1][1]) && !istGewaehlt("le", l.id)) auswahl.push({art: "le", id: l.id});
        });
      }
      zeichnen(); eigenschaften();
    } else if (d.art === "setzen") {
      merken();
      var e = {id: neueId("e"), sym: setzen.sym, x: fang(p[0]), y: fang(p[1]), dreh: setzen.dreh, spiegel: setzen.spiegel, kz: kzVorschlag(setzen.sym)};
      P.elemente.push(e); auswahl = [{art: "el", id: e.id}];
      if (!ev.shiftKey) { setzen = null; markierePalette(); }
      zeichnen(); eigenschaften();
    } else if (d.art === "leiter") {
      leiterKlick(p);
    } else if (d.art === "text") {
      merken();
      var t = {id: neueId("t"), x: fang(p[0]), y: fang(p[1]), text: "Text", gr: 6};
      P.texte.push(t); auswahl = [{art: "tx", id: t.id}]; waehleWerkzeug("wahl");
      zeichnen(); eigenschaften();
      var feld = $("e-text"); if (feld) { feld.focus(); feld.select(); }
    }
  }
  svg.addEventListener("pointerup", los);
  svg.addEventListener("pointercancel", function (ev) { delete zeiger[ev.pointerId]; druck = null; rahmenZug = null; ueberlagerung(); });
  svg.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });

  /* Führt eine Änderung aus und merkt sie nur, wenn sich das Projekt wirklich geändert hat */
  function aendern(fn) {
    var vorher = JSON.stringify(P); fn();
    if (JSON.stringify(P) !== vorher) { zurueck.push(vorher); if (zurueck.length > 100) zurueck.shift(); vor = []; geaendert = true; status(); }
  }

  function leiterKlick(p) {
    var t = ziel(p);
    aendern(function () {
      if (!zug) { zug = {von: endeAus(t)}; return; }
      if ((t.art === "an" || t.art === "kn") && gleich(t.ende, zug.von)) { zug = null; aufraeumen(); return; }
      var b = endeAus(t), a = zug.von;
      if (!P.leiter.some(function (l) { return (gleich(l.a, a) && gleich(l.b, b)) || (gleich(l.a, b) && gleich(l.b, a)); }))
        P.leiter.push({id: neueId("l"), a: a, b: b});
      /* auf freier Fläche geht die Leitung vom neuen Knoten aus weiter; an Anschluss, Knoten oder Leitung endet sie */
      zug = t.art === "leer" ? {von: b} : null;
    });
    zeichnen();
  }

  function leiterAbbrechen() {
    if (!zug) return;
    zug = null; aufraeumen(); zeichnen();
  }

  /* ---------- Tasten ---------- */

  document.addEventListener("keydown", function (ev) {
    var t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    if (!$("werkstatt").contains(document.activeElement) && document.activeElement !== document.body) return;
    var k = ev.key.toLowerCase(), strg = ev.ctrlKey || ev.metaKey;
    if (strg && k === "z" && !ev.shiftKey) { ev.preventDefault(); rueckgaengig(); }
    else if (strg && (k === "y" || (k === "z" && ev.shiftKey))) { ev.preventDefault(); wiederholen(); }
    else if (strg) return;
    else if (k === "r") drehen();
    else if (k === "m") spiegeln();
    else if (k === "delete" || k === "backspace") { ev.preventDefault(); loeschen(); }
    else if (k === "escape") { if (setzen) { setzen = null; markierePalette(); zeichnen(); } else if (zug) leiterAbbrechen(); else if (werkzeug !== "wahl") waehleWerkzeug("wahl"); else { auswahl = []; zeichnen(); eigenschaften(); } }
    else if (k === "l") waehleWerkzeug("leiter");
    else if (k === "t") waehleWerkzeug("text");
    else if (k === "v") waehleWerkzeug("wahl");
    else if (k.indexOf("arrow") === 0 && auswahl.length) {
      ev.preventDefault(); merken();
      verschieben(k === "arrowleft" ? -FANG : k === "arrowright" ? FANG : 0, k === "arrowup" ? -FANG : k === "arrowdown" ? FANG : 0);
      zeichnen();
    }
  });

  /* ---------- Werkzeuge, Palette, Eigenschaften ---------- */

  function waehleWerkzeug(w) {
    werkzeug = w; setzen = null; zug = null; aufraeumen(); markierePalette();
    document.querySelectorAll("[data-werkzeug]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.werkzeug === w)); });
    svg.dataset.werkzeug = w; zeichnen();
  }

  function palette() {
    var q = $("p-suche").value.trim().toLowerCase(), html = [], gruppe = "";
    BIB.forEach(function (s) {
      if (q && (s.name + " " + s.schluessel).toLowerCase().indexOf(q) < 0) return;
      if (s.schluessel !== gruppe) { gruppe = s.schluessel; html.push('<div class="p-gruppe">' + esc(gruppe) + "</div>"); }
      var r = s.rahmen, w = Math.max(r[2] - r[0] + 6, 30), h = Math.max(r[3] - r[1] + 6, 30);
      var vb = [(r[0] + r[2]) / 2 - w / 2, (r[1] + r[3]) / 2 - h / 2, w, h].map(function (v) { return v.toFixed(1); }).join(" ");
      html.push('<button type="button" class="p-sym" data-sym="' + s.id + '" title="' + esc(s.name) + '"><svg viewBox="' + vb + '"><g stroke="currentColor" stroke-width="0.7" fill="none" stroke-linecap="round" stroke-linejoin="round">'
        + K.svgFormen(s.formen, false) + '</g></svg><span>' + esc(s.name) + "</span></button>");
    });
    $("p-liste").innerHTML = html.join("") || '<p class="p-leer">Kein Symbol gefunden.</p>';
    markierePalette();
  }
  function markierePalette() {
    document.querySelectorAll(".p-sym").forEach(function (b) { b.classList.toggle("an", !!setzen && b.dataset.sym === setzen.sym); });
  }
  $("p-liste").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-sym]"); if (!b) return;
    if (setzen && setzen.sym === b.dataset.sym) { setzen = null; markierePalette(); zeichnen(); return; }
    werkzeug = "wahl"; zug = null;
    document.querySelectorAll("[data-werkzeug]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.werkzeug === "wahl")); });
    setzen = {sym: b.dataset.sym, dreh: 0, spiegel: false}; markierePalette(); zeichnen();
    svg.focus({preventScroll: true});
  });
  $("p-suche").addEventListener("input", palette);

  function feld(id, titel, wert, art) {
    return '<label class="e-feld">' + titel + '<input id="' + id + '" type="' + (art || "text") + '" value="' + esc(wert || "") + '" autocomplete="off"></label>';
  }

  function eigenschaften() {
    var o = [], els = gewaehlt("el"), txs = gewaehlt("tx");
    if (auswahl.length === 1 && els.length === 1) {
      var e = els[0], s = sym(e.sym);
      o.push("<h3>" + esc(s ? s.name : e.sym) + "</h3>");
      if (s) o.push('<p class="e-meta">' + esc(s.schluessel || "") + (s.quelle ? " · " + esc(s.quelle) : "") + "</p>");
      o.push(feld("e-kz", "Kennzeichen", e.kz));
      o.push('<div class="e-knoepfe"><button type="button" class="zweit" data-tat="drehen">Drehen (R)</button><button type="button" class="zweit" data-tat="spiegeln">Spiegeln (M)</button><button type="button" class="zweit" data-tat="loeschen">Löschen (Entf)</button></div>');
    } else if (auswahl.length === 1 && txs.length === 1) {
      var t = txs[0];
      o.push("<h3>Text</h3>" + feld("e-text", "Inhalt", t.text));
      o.push('<label class="e-feld">Grösse<select id="e-gr">' + Object.keys(TEXTGR).map(function (g) { return '<option value="' + g + '"' + (+g === t.gr ? " selected" : "") + ">" + TEXTGR[g] + "</option>"; }).join("") + "</select></label>");
      o.push('<div class="e-knoepfe"><button type="button" class="zweit" data-tat="loeschen">Löschen (Entf)</button></div>');
    } else if (auswahl.length) {
      o.push("<h3>" + auswahl.length + " gewählt</h3>");
      o.push('<div class="e-knoepfe">' + (els.length ? '<button type="button" class="zweit" data-tat="drehen">Drehen (R)</button><button type="button" class="zweit" data-tat="spiegeln">Spiegeln (M)</button>' : "")
        + '<button type="button" class="zweit" data-tat="loeschen">Löschen (Entf)</button></div>');
    } else {
      var k = P.kopf;
      o.push("<h3>Blatt</h3>");
      o.push('<label class="e-feld">Format<select id="b-lage"><option value="quer"' + (P.blatt.lage === "quer" ? " selected" : "") + '>A4 quer</option><option value="hoch"' + (P.blatt.lage === "hoch" ? " selected" : "") + ">A4 hochkant</option></select></label>");
      o.push(feld("b-projekt", "Projekt", k.projekt) + feld("b-zeichnung", "Zeichnung", k.zeichnung) + feld("b-zeichner", "Gezeichnet", k.zeichner)
        + feld("b-datum", "Datum", k.datum) + feld("b-blatt", "Blatt", k.blatt));
    }
    $("eigen").innerHTML = o.join("");
  }

  /* Eingaben: eine Änderung je Feld zählt als ein Schritt zum Rückgängigmachen */
  var feldStand = null;
  $("eigen").addEventListener("focusin", function (ev) { if (ev.target.matches("input")) feldStand = JSON.stringify(P); });
  $("eigen").addEventListener("input", function (ev) {
    var t = ev.target, e = gewaehlt("el")[0], x = gewaehlt("tx")[0];
    if (t.id === "e-kz" && e) e.kz = t.value;
    else if (t.id === "e-text" && x) x.text = t.value;
    else if (t.id.indexOf("b-") === 0 && t.tagName === "INPUT") P.kopf[t.id.slice(2)] = t.value;
    else return;
    geaendert = true; status(); zeichnen();
  });
  $("eigen").addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.matches("input") && feldStand && feldStand !== JSON.stringify(P)) { zurueck.push(feldStand); vor = []; feldStand = JSON.stringify(P); }
    if (t.id === "e-gr") { merken(); gewaehlt("tx")[0].gr = +t.value; zeichnen(); }
    if (t.id === "b-lage") { merken(); P.blatt.lage = t.value; ansicht = null; zeichnen(); }
  });
  $("eigen").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-tat]"); if (!b) return;
    ({drehen: drehen, spiegeln: spiegeln, loeschen: loeschen})[b.dataset.tat]();
  });

  document.querySelectorAll("[data-werkzeug]").forEach(function (b) {
    b.addEventListener("click", function () { waehleWerkzeug(b.dataset.werkzeug); });
  });
  $("z-zurueck").addEventListener("click", rueckgaengig);
  $("z-vor").addEventListener("click", wiederholen);
  $("z-plus").addEventListener("click", function () { zoom(1 / 1.3); });
  $("z-minus").addEventListener("click", function () { zoom(1.3); });
  $("z-ganz").addEventListener("click", ganzesBlatt);

  function status() {
    $("stand").textContent = geaendert ? "Nicht gespeicherte Änderungen" : "Alles gespeichert";
    $("stand").classList.toggle("offen", geaendert);
    $("z-zurueck").disabled = !zurueck.length; $("z-vor").disabled = !vor.length;
  }
  window.addEventListener("beforeunload", function (ev) { if (geaendert && (P.elemente.length || P.texte.length)) { ev.preventDefault(); ev.returnValue = ""; } });

  /* ---------- Speichern und Öffnen (nur als Datei) ---------- */

  function dateiname(endung) {
    var n = (P.kopf.projekt || "schema").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return (n || "schema") + "_" + K.heute() + endung;
  }

  function projektDatei() {
    var p = JSON.parse(JSON.stringify(P)); p.symbole = {};
    P.elemente.forEach(function (e) { var s = sym(e.sym); if (s) p.symbole[e.sym] = {name: s.name, quelle: s.quelle, formen: s.formen}; });
    return JSON.stringify(p, null, 1);
  }

  $("speichern").addEventListener("click", function () {
    K.speichern(projektDatei(), "application/json", dateiname(".schema.json"));
    geaendert = false; status();
  });
  $("oeffnen").addEventListener("click", function () { $("datei").value = ""; $("datei").click(); });
  $("datei").addEventListener("change", function () {
    var f = this.files && this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var p = JSON.parse(r.result);
        if (p.format !== "naville-schema" || !Array.isArray(p.elemente)) throw new Error("kein Schema-Projekt");
        fremd = {};
        Object.keys(p.symbole || {}).forEach(function (id) { if (!BIB_ID[id]) fremd[id] = p.symbole[id]; });
        delete p.symbole;
        p.knoten = p.knoten || []; p.leiter = p.leiter || []; p.texte = p.texte || [];
        p.blatt = p.blatt || {lage: "quer"}; p.kopf = p.kopf || {};
        /* das bisherige Blatt bleibt mit Rückgängig erreichbar */
        if (P.elemente.length || P.texte.length) { zurueck.push(JSON.stringify(P)); vor = []; }
        P = p; auswahl = []; ansicht = null;
        naechste = 1 + Math.max.apply(null, [0].concat([].concat(p.elemente, p.knoten, p.leiter, p.texte).map(function (x) { return +String(x.id).replace(/\D/g, "") || 0; })));
        geaendert = false; meldung("");
        waehleWerkzeug("wahl"); eigenschaften(); status();
      } catch (e) { meldung("Die Datei lässt sich nicht öffnen: " + e.message + ". Erwartet wird eine .schema.json, die diese Seite gespeichert hat."); }
    };
    r.readAsText(f, "utf-8");
  });
  $("neu").addEventListener("click", function () {
    if (P.elemente.length || P.texte.length) merken();
    P = leer(); fremd = {}; auswahl = []; ansicht = null; geaendert = false; waehleWerkzeug("wahl"); eigenschaften(); status();
  });
  function meldung(t) { var m = $("meldung"); m.textContent = t; zeige(m, !!t); }

  /* ---------- Ausgaben ---------- */

  /* Alles, was gedruckt wird, als Formen in Blattkoordinaten (ohne Anschlusspunkte) */
  function alleFormen() {
    var f = [];
    P.leiter.forEach(function (l) { var w = leiterWeg(l); if (w) f.push(["Z", w, 0, 0]); });
    P.knoten.forEach(function (k) { if (anzahlAm(k.id) >= 3) f.push(["K", k.x, k.y, 1.6, 1]); });
    P.elemente.forEach(function (e) { f = f.concat(formenVon(e).filter(function (x) { return x[0] !== "A"; }), kzFormen(e)); });
    P.texte.forEach(function (t) { f.push(["T", t.x, t.y, t.text, t.gr]); });
    return f;
  }

  function pdfDatei(jsPDF) {
    var d = new jsPDF({unit: "mm", format: "a4", orientation: P.blatt.lage === "hoch" ? "portrait" : "landscape"});
    var rechts = alleFormen().filter(function (f) { return f[5] === "rechts"; });
    K.pdfFormen(d, rahmenFormen().concat(alleFormen().filter(function (f) { return f[5] !== "rechts"; })), 0, 0, MM);
    d.setFont("helvetica", "normal");
    rechts.forEach(function (f) { d.setFontSize(K.textGroesse(f) * MM / 0.3528); d.text(String(f[3]), f[1] * MM, f[2] * MM, {align: "right", baseline: "alphabetic"}); });
    d.setProperties({title: P.kopf.zeichnung || P.kopf.projekt || "Schema", creator: "naville-handwerk.ch/schema_zeichnen.html"});
    return d;
  }
  function svgDatei() {
    var g = groesse(), f = rahmenFormen().concat(alleFormen());
    var normal = f.filter(function (x) { return x[0] !== "T"; }), texte = f.filter(function (x) { return x[0] === "T"; });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<!-- ' + K.LIZENZ + " -->\n"
      + '<svg xmlns="http://www.w3.org/2000/svg" width="' + g[0] * MM + 'mm" height="' + g[1] * MM + 'mm" viewBox="0 0 ' + g[0] + " " + g[1] + '">\n'
      + '<rect width="100%" height="100%" fill="#fff"/>\n'
      + '<g stroke="#000" color="#000" stroke-width="0.5" fill="none" stroke-linecap="round" stroke-linejoin="round" font-family="Arial, Helvetica, sans-serif">'
      + K.svgFormen(normal, false) + texte.map(function (x) { return textSvg(x); }).join("") + "</g>\n</svg>\n";
  }
  function dxfDatei() {
    return K.dxf([["RAHMEN", 8], ["LEITER", 7], ["SYMBOL", 7], ["TEXT", 7]], null, function (w) {
      rahmenFormen().forEach(function (f) { w.form(f, f[0] === "T" ? "TEXT" : "RAHMEN"); });
      P.leiter.forEach(function (l) { var p = leiterWeg(l); if (p) w.zug(p, false, "LEITER"); });
      P.knoten.forEach(function (k) { if (anzahlAm(k.id) >= 3) w.kreis(k.x, k.y, 1.6, "LEITER", true); });
      P.elemente.forEach(function (e) {
        formenVon(e).forEach(function (f) { if (f[0] !== "A") w.form(f, "SYMBOL"); });
        kzFormen(e).forEach(function (f) { w.text(f[1], f[2], K.textGroesse(f) * 0.72 * MM, f[3], "TEXT", true); });
      });
      P.texte.forEach(function (t) { w.text(t.x, t.y, K.textGroesse(["T", 0, 0, "", t.gr]) * 0.72 * MM, t.text, "TEXT"); });
    });
  }

  $("aus-pdf").addEventListener("click", function () {
    if (!window.jspdf || !window.jspdf.jsPDF) { meldung("PDF-Bibliothek nicht geladen."); return; }
    pdfVorschau(pdfDatei(window.jspdf.jsPDF), dateiname(".pdf"));
  });
  $("aus-svg").addEventListener("click", function () { K.speichern(svgDatei(), "image/svg+xml", dateiname(".svg")); });
  $("aus-dxf").addEventListener("click", function () { K.speichern(dxfDatei(), "application/dxf", dateiname(".dxf")); });

  var vorschau = {url: null, name: ""};
  function pdfVorschau(d, name) {
    if (vorschau.url) URL.revokeObjectURL(vorschau.url);
    vorschau.url = URL.createObjectURL(d.output("blob")); vorschau.name = name;
    $("pdfrahmen").src = vorschau.url; zeige($("pdfvorschau"), true);
    $("pdfvorschau").scrollIntoView({behavior: "smooth", block: "start"});
  }
  $("pdfdown").addEventListener("click", function () { if (vorschau.url) { var a = document.createElement("a"); a.href = vorschau.url; a.download = vorschau.name; document.body.appendChild(a); a.click(); a.remove(); } });
  $("pdftab").addEventListener("click", function () { if (vorschau.url) window.open(vorschau.url, "_blank"); });

  palette(); waehleWerkzeug("wahl"); eigenschaften(); status();
})();
