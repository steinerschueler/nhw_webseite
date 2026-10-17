/* Grundsatz in IEC-Form für das Stromlaufschema: eigene Zeichnungen der Naville Handwerk GmbH nach
   den Symbolblättern im Handbuch des Elektroinstallateurs EFZ (VSTEI 2015), Lizenz CC BY-SA 4.0.
   Formen wie in schema_symbole.js (Raster 10, y nach unten, Ursprung = Einfügepunkt); Kontakte
   senkrecht, oben und unten je ein Anschluss im Abstand 20 (10 mm). Der Umriss (rahmen) wird beim
   Laden gerechnet; darum nach schema_kern.js laden. */
(function () {
  "use strict";
  var Q = "Handbuch des Elektroinstallateurs EFZ (VSTEI 2015), Blatt ";
  var oben = [["L", 0, -10, 0, -6, "normal"], ["A", 0, -10, "n"]];
  var unten = [["L", 0, 6, 0, 10, "normal"], ["A", 0, 10, "s"]];
  var durch = [["L", 0, -10, 0, 10, "normal"], ["A", 0, -10, "n"], ["A", 0, 10, "s"]];
  var hebelS = ["L", 0, 6, -5, -5, "normal"];                          /* Schliesser: Hebel nach links oben */
  var hebelOe = ["L", 0, 6, 3, -7, "normal"], haken = ["L", 0, -6, 4, -6, "normal"];   /* Öffner: am Haken */
  function L(x1, y1, x2, y2, s) { return ["L", x1, y1, x2, y2, s || "normal"]; }
  function taster(x, y) { return [L(x, y, -12, y, "dashed"), L(-12, y - 2.5, -12, y + 2.5), L(-12, y - 2.5, -10.5, y - 2.5), L(-12, y + 2.5, -10.5, y + 2.5)]; }
  function c(teile) { return [].concat.apply([], teile); }

  var IEC = [
    ["schliesser", "Schliesser (Arbeitskontakt)", "S.1.7", c([oben, [hebelS], unten])],
    ["oeffner", "Öffner (Ruhekontakt)", "S.1.7", c([oben, [haken, hebelOe], unten])],
    ["umschalter", "Umschalter mit Unterbrechung", "S.1.7",
      [L(-10, -10, -10, -6), L(-10, -6, -6, -6), L(0, -10, 0, -6), L(0, 6, -7, -7), L(0, 6, 0, 10),
        ["A", -10, -10, "n"], ["A", 0, -10, "n"], ["A", 0, 10, "s"]]],
    ["schalter_hand", "Handbetätigter Schalter, allgemein", "S.1.7",
      c([oben, [hebelS, L(-2.5, 0.5, -11, 0.5, "dashed"), L(-11, -2, -11, 3)], unten])],
    ["taster_schliesser", "Drucktaster, Schliesser", "S.1.8", c([oben, [hebelS], taster(-2.5, 0.5), unten])],
    ["taster_oeffner", "Drucktaster, Öffner", "G.2.1", c([oben, [haken, hebelOe], taster(1.5, -0.5), unten])],
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
      }).concat([[L(-12.5, 0.5, 7.5, 0.5, "dashed")]]))]
  ];

  var K = window.SchemaKern;
  function rahmen(formen) {
    var r = K.rahmenVon(formen);
    return [Math.floor(r[0] / 10) * 10, Math.floor(r[1] / 10) * 10, Math.max(Math.ceil(r[2] / 10) * 10, Math.floor(r[0] / 10) * 10 + 10), Math.max(Math.ceil(r[3] / 10) * 10, Math.floor(r[1] / 10) * 10 + 10)];
  }
  window.SCHEMA_SYMBOLE = (window.SCHEMA_SYMBOLE || []).concat(IEC.map(function (s) {
    return {id: "iec_" + s[0], name: s[1], bereich: "Stromlaufschema", schluessel: "IEC-Form",
      quelle: Q + s[2] + ", IEC-Form", rahmen: rahmen(s[3]), formen: s[3]};
  }));
})();
