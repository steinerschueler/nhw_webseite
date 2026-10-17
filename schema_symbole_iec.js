/* Grundsatz in IEC-Form für das Stromlaufschema: eigene Zeichnungen der Naville Handwerk GmbH nach
   den Symbolblättern im Handbuch des Elektroinstallateurs EFZ (VSTEI 2015) und im Lehrmittel
   Brunner, Lizenz CC BY-SA 4.0. Formen wie in schema_symbole.js (Raster 10, y nach unten,
   Ursprung = Einfügepunkt); Kontakte senkrecht, oben und unten je ein Anschluss im Abstand 20
   (10 mm). Der Umriss (rahmen) wird beim Laden gerechnet; darum nach schema_kern.js laden.

   Kontakte mit dem Feld `betaetigung` ([x, y]: Punkt am Schaltglied, wo die Wirkverbindung
   ansetzt) nehmen im Zeichenblatt eine wählbare Betätigung an; window.SCHEMA_BETAETIGUNG liefert
   deren Formen. Einträge mit `nurNachschlagen` zeigen eine Betätigung im Nachschlagewerk und
   fehlen in der Palette des Zeichenblatts. */
(function () {
  "use strict";
  var Q = "Handbuch des Elektroinstallateurs EFZ (VSTEI 2015), Blatt ", BR = "Brunner, Schemakenntnisse SCK (2010), Blatt ";
  var oben = [["L", 0, -10, 0, -6, "normal"], ["A", 0, -10, "n"]];
  var unten = [["L", 0, 6, 0, 10, "normal"], ["A", 0, 10, "s"]];
  var durch = [["L", 0, -10, 0, 10, "normal"], ["A", 0, -10, "n"], ["A", 0, 10, "s"]];
  var hebelS = ["L", 0, 6, -5, -5, "normal"];                          /* Schliesser: Hebel nach links oben */
  var hebelOe = ["L", 0, 6, 3, -7, "normal"], haken = ["L", 0, -6, 4, -6, "normal"];   /* Öffner: am Haken */
  function L(x1, y1, x2, y2, s) { return ["L", x1, y1, x2, y2, s || "normal"]; }
  function taster(x, y) { return [L(x, y, -12, y, "dashed"), L(-12, y - 2.5, -12, y + 2.5), L(-12, y - 2.5, -10.5, y - 2.5), L(-12, y + 2.5, -10.5, y + 2.5)]; }
  function c(teile) { return [].concat.apply([], teile); }

  /* Betätigung durch … (Brunner Blatt 2) mit Wirkungsweise (Blatt 3). Jede Form endet rechts im
     Punkt (X, Y), an dem die gestrichelte Wirkverbindung beginnt, und liegt links davon. */
  function ellipse(cx, cy, rx, ry) {
    var p = [];
    for (var i = 0; i < 24; i++) p.push([+(cx + rx * Math.cos(i * Math.PI / 12)).toFixed(2), +(cy + ry * Math.sin(i * Math.PI / 12)).toFixed(2)]);
    return ["Z", p, 1, 0];
  }
  var ARTEN = [
    ["hand", "Hand, allgemein", function (X, Y) { return [L(X, Y - 2.5, X, Y + 2.5)]; }],
    ["druecken", "Drücken", function (X, Y) { return [L(X, Y - 2.5, X, Y + 2.5), L(X, Y - 2.5, X + 1.5, Y - 2.5), L(X, Y + 2.5, X + 1.5, Y + 2.5)]; }],
    ["ziehen", "Ziehen", function (X, Y) { return [L(X, Y - 2.5, X, Y + 2.5), L(X, Y - 2.5, X - 1.5, Y - 2.5), L(X, Y + 2.5, X - 1.5, Y + 2.5)]; }],
    ["drehen", "Drehen", function (X, Y) { return [L(X, Y - 2.5, X, Y + 2.5), L(X, Y - 2.5, X - 1.5, Y - 2.5), L(X, Y + 2.5, X + 1.5, Y + 2.5)]; }],
    ["kippen", "Kippen", function (X, Y) { return [L(X, Y - 2.5, X, Y + 2.5), L(X - 1.5, Y - 2.5, X + 1.5, Y - 2.5)]; }],
    ["schluessel", "Schlüssel", function (X, Y) {
      return [["K", X - 1.2, Y - 1.6, 0.7, 0], ["Z", [[X - 1.6, Y - 0.9], [X - 0.8, Y - 0.9], [X - 0.1, Y + 2], [X - 2.3, Y + 2]], 1, 0], L(X - 0.6, Y, X, Y)];
    }],
    ["rolle", "Rolle (Endschalter)", function (X, Y) { return [["K", X - 2, Y, 2, 0]]; }],
    ["pilz", "Pilztaster (NOT-AUS)", function (X, Y) { return [["B", X, Y, 2.5, 90, 180], L(X, Y - 2.5, X, Y + 2.5)]; }],
    ["bimetall", "Bimetall (Thermorelais)", function (X, Y) {
      return [L(X, Y - 1.5, X, Y + 1.5), L(X, Y - 1.5, X - 1.5, Y - 1.5), L(X - 1.5, Y - 1.5, X - 1.5, Y - 3), L(X, Y + 1.5, X - 1.5, Y + 1.5), L(X - 1.5, Y + 1.5, X - 1.5, Y + 3)];
    }],
    ["schwimmer", "Flüssigkeitspegel (Schwimmer)", function (X, Y) { return [ellipse(X - 2.5, Y, 2.5, 1.4)]; }],
    ["temperatur", "Temperatur (Thermostat)", function (X, Y) { return [["R", X - 6, Y - 3, 6, 6, 0], ["T", X - 4.2, Y + 1.5, "ϑ", 5.5]]; }],
    ["druck", "Druck (Manostat)", function (X, Y) { return [["R", X - 8, Y - 3, 8, 6, 0], ["T", X - 6.8, Y + 1, "p>", 4.5]]; }],
    ["annaehern", "Annähern (Sensor)", function (X, Y) {
      return [["Z", [[X, Y], [X - 3, Y - 3.5], [X - 6, Y], [X - 3, Y + 3.5]], 1, 0], L(X - 2.2, Y - 2.57, X - 2.2, Y + 2.57), L(X - 3.8, Y - 2.57, X - 3.8, Y + 2.57)];
    }],
    ["beruehren", "Berühren", function (X, Y) {
      return [["Z", [[X, Y], [X - 3, Y - 3.5], [X - 6, Y], [X - 3, Y + 3.5]], 1, 0], L(X - 2.2, Y - 2.57, X - 2.2, Y + 2.57), L(X - 3.8, Y - 2.57, X - 3.8, Y + 2.57), L(X - 6, Y - 3.5, X - 6, Y + 3.5)];
    }],
    ["uhr", "Uhr (elektrisch)", function (X, Y) { return [["K", X - 3, Y, 3, 0], L(X - 3, Y - 2.2, X - 3, Y), L(X - 3, Y, X - 4.8, Y)]; }]
  ];
  var ART = {};
  ARTEN.forEach(function (a) { ART[a[0]] = a; });
  var RAST = [["rast", "einrastend"], ["klink", "einklinkend"]];
  function betFormen(art, rast, p) {
    if (!ART[art]) return [];
    var ax = p[0], Y = p[1], X = ax - (rast ? 14 : 9.5), f = [];
    if (rast) {
      var m = ax - 7;
      f.push(L(X, Y, m - 3, Y, "dashed"), ["Z", [[m - 3, Y], [m - 0.8, Y], [m, Y + 2], [m + 0.8, Y], [m + 3, Y]], 0, 0], L(m + 3, Y, ax, Y, "dashed"));
      if (rast === "klink") f.push(L(m + 1.6, Y + 1, m + 1.6, Y + 3));
    } else f.push(L(X, Y, ax, Y, "dashed"));
    return f.concat(ART[art][2](X, Y));
  }
  window.SCHEMA_BETAETIGUNG = {
    arten: ARTEN.map(function (a) { return [a[0], a[1]]; }), rast: RAST, formen: betFormen,
    quelle: BR + "2 und 3"
  };

  var oeffnerF = [haken, hebelOe], pS = [-2.5, 0.5], pOe = [1.5, -0.5];
  function theta(x, y) { return [["K", x, y, 2, 0], L(x - 1.4, y, x + 1.4, y)]; }

  /* [id, Name, Blatt (VSTEI) oder volle Quelle, Formen, Ansatzpunkt der Betätigung] */
  var IEC = [
    ["schliesser", "Schliesser (Arbeitskontakt)", "S.1.7", c([oben, [hebelS], unten]), pS],
    ["oeffner", "Öffner (Ruhekontakt)", "S.1.7", c([oben, oeffnerF, unten]), pOe],
    ["umschalter", "Umschalter mit Unterbrechung", "S.1.7",
      [L(-10, -10, -10, -6), L(-10, -6, -6, -6), L(0, -10, 0, -6), L(0, 6, -7, -7), L(0, 6, 0, 10),
        ["A", -10, -10, "n"], ["A", 0, -10, "n"], ["A", 0, 10, "s"]], [-2.96, 0.5]],
    ["schalter_hand", "Handbetätigter Schalter, allgemein", "S.1.7",
      c([oben, [hebelS, L(-2.5, 0.5, -11, 0.5, "dashed"), L(-11, -2, -11, 3)], unten])],
    ["taster_schliesser", "Drucktaster, Schliesser", "S.1.8", c([oben, [hebelS], taster(-2.5, 0.5), unten])],
    ["taster_oeffner", "Drucktaster, Öffner", "G.2.1", c([oben, oeffnerF, taster(1.5, -0.5), unten])],
    ["not_aus", "NOT-AUS, Öffner mit Pilztaster, einrastend", BR + "2 und 3", c([oben, oeffnerF, betFormen("pilz", "rast", pOe), unten])],
    ["drehschalter", "Drehschalter, Schliesser, einrastend", BR + "3", c([oben, [hebelS], betFormen("drehen", "rast", pS), unten])],
    ["endschalter_s", "Endschalter, Schliesser", "S.1.8", c([oben, [hebelS, ["Z", [[-3.64, -2], [-6.5, -1], [-2.73, 0]], 1, 0]], unten])],
    ["endschalter_oe", "Endschalter, Öffner", "S.1.8", c([oben, oeffnerF, [["Z", [[1.85, -2], [4.8, -1], [1.38, 0]], 1, 0]], unten])],
    ["temp_schliesser", "Temperaturabhängiger Schliesser", "S.1.8", c([oben, [hebelS], theta(-9, -6), unten])],
    ["temp_oeffner", "Temperaturabhängiger Öffner", "S.1.8", c([oben, oeffnerF, theta(8.5, -6), unten])],
    ["thermokontakt", "Selbstöffnender Thermokontakt (Bimetall)", "S.1.8",
      c([oben, oeffnerF, [["Z", [[1.62, -1], [3, -1], [3, -3], [5.5, -3], [5.5, -1], [8, -1]], 0, 0]], unten])],
    ["thermorelais_oe", "Kontakt eines Thermorelais, Öffner", BR + "3", c([oben, oeffnerF, betFormen("bimetall", "", pOe), unten])],
    ["thermorelais_3", "Thermorelais (Motorschutzrelais), Auslöser dreipolig", BR + "3",
      c([-10, 0, 10].map(function (x) {
        return [L(x, -10, x, -3), L(x, -3, x + 5, -3), L(x + 5, -3, x + 5, 3), L(x + 5, 3, x, 3), L(x, 3, x, 10), ["A", x, -10, "n"], ["A", x, 10, "s"]];
      }).concat([[L(-5, 0, 20, 0, "dashed")]]))],
    ["sicherung", "Sicherung, allgemeines Symbol", "S.1.9", c([[["R", -2.5, -6, 5, 12, 0]], durch])],
    ["leitungsschutzschalter", "Leitungsschutzschalter", "S.1.9",
      c([oben, [hebelS, L(-5, -5, -9.3, -2.85), ["Z", [[-12, -1.5], [-9.86, -3.91], [-8.78, -1.77]], 1, 1]], unten])],
    ["ueberspannungsableiter", "Überspannungsableiter", "S.1.9",
      [["R", -2.5, -6, 5, 12, 0], L(0, -10, 0, 1), ["Z", [[-1.5, 1], [1.5, 1], [0, 4]], 1, 1], L(0, 6, 0, 10),
        ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["spule", "Relais- oder Schützspule", "S.1.10", [["R", -8, -4, 16, 8, 0], L(0, -10, 0, -4), L(0, 4, 0, 10), ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["spule_rueckfall", "Relais, rückfallverzögert", "S.1.10",
      [["R", -8, -4, 16, 8, 0], ["R", -8, -4, 4, 8, 1], L(0, -10, 0, -4), L(0, 4, 0, 10), ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["spule_anzug", "Relais, anzugsverzögert", "S.1.10",
      [["R", -8, -4, 16, 8, 0], ["R", -8, -4, 4, 8, 0], L(-8, -4, -4, 4), L(-8, 4, -4, -4), L(0, -10, 0, -4), L(0, 4, 0, 10), ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["lasttrennschalter", "Lasttrennschalter", "S.1.10",
      [L(0, -10, 0, -7.5), L(-1.5, -7.5, 1.5, -7.5), ["K", 0, -6.3, 1.2, 0], hebelS, ["A", 0, -10, "n"]].concat(unten)],
    ["kondensator", "Kondensator, allgemeines Symbol", "S.1.11",
      [L(0, -10, 0, -1.5), L(-5, -1.5, 5, -1.5), L(-5, 1.5, 5, 1.5), L(0, 1.5, 0, 10), ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["batterie", "Akkumulator oder galvanisches Element", "S.1.11",
      [L(0, -10, 0, -1.5), L(-5, -1.5, 5, -1.5), ["R", -2.5, 1, 5, 1, 1], L(0, 2, 0, 10), ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["klemme", "Klemme, lösbar", "S.1.2", [["K", 0, 0, 1.5, 0], L(0, -10, 0, -1.5), L(0, 1.5, 0, 10), ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["erde", "Erde, allgemeines Symbol", "S.1.2", [L(0, -10, 0, 0), L(-6, 0, 6, 0), L(-4, 2.5, 4, 2.5), L(-2, 5, 2, 5), ["A", 0, -10, "n"]]],
    ["schutzerde", "Schutzerde", "S.1.2",
      [["K", 0, 2, 8, 0], L(0, -10, 0, 0), L(-5, 0, 5, 0), L(-3.5, 2.5, 3.5, 2.5), L(-2, 5, 2, 5), ["A", 0, -10, "n"]]],
    ["masse", "Masse", "S.1.2",
      [L(0, -10, 0, 0), L(-6, 0, 6, 0), L(-5, 0, -7, 3), L(-2.5, 0, -4.5, 3), L(0, 0, -2, 3), L(2.5, 0, 0.5, 3), L(5, 0, 3, 3), ["A", 0, -10, "n"]]],
    ["transformator", "Transformator mit getrennten Wicklungen", "P.1.1",
      [["K", 0, -4, 5, 0], ["K", 0, 4, 5, 0], L(0, -10, 0, -9), L(0, 9, 0, 10), ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["motor_drehstrom", "Motor, Drehstrom", "G.2.1",
      [["K", 0, 10, 10, 0], L(-5, -10, -5, 1.34), L(0, -10, 0, 0), L(5, -10, 5, 1.34), ["T", -3.6, 12, "M", 7], ["T", -3.4, 18.5, "3~", 4.5],
        ["A", -5, -10, "n"], ["A", 0, -10, "n"], ["A", 5, -10, "n"]]],
    ["hauptkontakte_3", "Schütz-Hauptkontakte, dreipolig", "G.2.1",
      c([-10, 0, 10].map(function (x) {
        return [L(x, -10, x, -6), L(x, 6, x, 10), L(x, 6, x - 5, -5), ["A", x, -10, "n"], ["A", x, 10, "s"]];
      }).concat([[L(-12.5, 0.5, 7.5, 0.5, "dashed")]])), [-12.5, 0.5]]
  ];
  /* Nachschlagewerk: jede Betätigung am Schliesser gezeigt */
  ARTEN.forEach(function (a) {
    IEC.push(["bet_" + a[0], "Betätigung durch " + a[1], BR + "2", c([oben, [hebelS], betFormen(a[0], "", pS), unten]), null, true]);
  });
  RAST.forEach(function (r) {
    IEC.push(["wirk_" + r[0], "Wirkungsweise " + r[1] + " (am Drucktaster)", BR + "3", c([oben, [hebelS], betFormen("druecken", r[0], pS), unten]), null, true]);
  });

  var K = window.SchemaKern;
  function rahmen(formen) {
    var r = K.rahmenVon(formen);
    return [Math.floor(r[0] / 10) * 10, Math.floor(r[1] / 10) * 10, Math.max(Math.ceil(r[2] / 10) * 10, Math.floor(r[0] / 10) * 10 + 10), Math.max(Math.ceil(r[3] / 10) * 10, Math.floor(r[1] / 10) * 10 + 10)];
  }
  window.SCHEMA_SYMBOLE = (window.SCHEMA_SYMBOLE || []).concat(IEC.map(function (s) {
    var o = {id: "iec_" + s[0], name: s[1], bereich: "Stromlaufschema", schluessel: "IEC-Form",
      quelle: (s[2].indexOf("Brunner") === 0 ? s[2] : Q + s[2]) + ", IEC-Form", rahmen: rahmen(s[3]), formen: s[3]};
    if (s[4]) o.betaetigung = s[4];
    if (s[5]) o.nurNachschlagen = true;
    return o;
  }));
})();
