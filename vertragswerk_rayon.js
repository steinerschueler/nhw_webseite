/* Vertragswerk, Rayon-Karte fürs Einsatzblatt: misst das Fahrzeitgebiet ab dem gewählten Sitz
   (Ziff. 4 des Verleihvertrags) und zeichnet es auf die Landeskarte; das Bild geht ins PDF.
   Dienste wie im Rayon-Rechner (rayon.js): swisstopo für Adresse und Karte, Esri für das
   Fahrzeitgebiet mit Verkehrsprognose. Der Esri-Schlüssel steht in esri_schluessel.js
   (ESRI_SCHLUESSEL); fehlt er, bleibt im PDF der leere Rahmen zum Einzeichnen.
   An die Dienste gehen nur die eingegebenen Adressen und die Abfahrtszeit. */
(function (G) {
  "use strict";
  var VW = G.VW = G.VW || {};
  if (typeof document === "undefined") return;

  var SUCHE = "https://api3.geo.admin.ch/rest/services/ech/SearchServer";
  var WMS = "https://wms.geo.admin.ch/";
  var GEBIET = "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";
  var FARBE = {blau: "#1B2A4A", blauF: "rgba(27,42,74,0.18)", orange: "#EA8C1B", orangeF: "rgba(234,140,27,0.22)", schwarz: "#000000"};
  var KANTE = 1200;
  var WOCHENTAG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  function $(id) { return document.getElementById(id); }
  function zweistellig(n) { return (n < 10 ? "0" : "") + n; }
  function datumCH(d) { return zweistellig(d.getDate()) + "." + zweistellig(d.getMonth() + 1) + "." + d.getFullYear(); }

  function wgs84ToLv95(lat, lon) {
    var p = (lat * 3600 - 169028.66) / 10000, l = (lon * 3600 - 26782.5) / 10000;
    return {
      E: 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l * l * l,
      N: 1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p - 194.56 * l * l * p + 119.79 * p * p * p
    };
  }
  function suche(t, origins) {
    var url = SUCHE + "?type=locations&sr=2056&limit=1&origins=" + origins + "&searchText=" + encodeURIComponent(t);
    return fetch(url, {credentials: "omit"}).then(function (r) { return r.json(); }).then(function (j) {
      var a = j && j.results && j.results[0] && j.results[0].attrs;
      if (!a) return null;
      var E = a.y, N = a.x;
      if (E < 2000000 && N > 2000000) { var h = E; E = N; N = h; }
      return {label: String(a.label || "").replace(/<[^>]+>/g, ""), lat: a.lat, lon: a.lon, E: E, N: N};
    });
  }
  function geokodiere(t) {
    t = (t || "").trim();
    if (!t) return Promise.resolve(null);
    return suche(t, "address").then(function (p) { return p || suche(t, "zipcode,gg25"); });
  }
  /* Abfahrt: Beginn des Einsatzes um 7 Uhr, sonst der nächste Werktag */
  function abfahrt(beginnIso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(beginnIso || ""), d;
    if (m) d = new Date(+m[1], +m[2] - 1, +m[3]);
    else { d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1); }
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return {esriMs: Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 7, 0, 0), text: WOCHENTAG[d.getDay()] + ", " + datumCH(d) + ", 07:00 Uhr"};
  }
  function gebiet(sitz, minuten, esriMs) {
    var q = {facilities: sitz.lon + "," + sitz.lat, defaultBreaks: String(minuten), impedanceAttributeName: "TravelTime",
      timeOfDay: String(esriMs), timeOfDayIsUTC: "false", travelDirection: "esriNATravelDirectionFromFacility",
      outputPolygons: "esriNAOutputPolygonSimplified", outSR: "4326", f: "json", token: G.ESRI_SCHLUESSEL};
    var qs = Object.keys(q).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(q[k]); }).join("&");
    return fetch(GEBIET + "?" + qs, {credentials: "omit"}).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.error) throw new Error("Routing-Dienst: " + (j.error.message || ("Fehler " + j.error.code)));
      var f = j.saPolygons && j.saPolygons.features && j.saPolygons.features[0];
      if (!f || !f.geometry || !f.geometry.rings) throw new Error("Kein Fahrzeitgebiet erhalten.");
      return f.geometry.rings.map(function (ring) { return ring.map(function (pt) { return wgs84ToLv95(pt[1], pt[0]); }); });
    });
  }
  function grenzen(punkte, gebiete) {
    var g = {Emin: Infinity, Emax: -Infinity, Nmin: Infinity, Nmax: -Infinity};
    function nimm(p) { if (p.E < g.Emin) g.Emin = p.E; if (p.E > g.Emax) g.Emax = p.E; if (p.N < g.Nmin) g.Nmin = p.N; if (p.N > g.Nmax) g.Nmax = p.N; }
    punkte.forEach(nimm);
    gebiete.forEach(function (r) { r.forEach(function (ring) { ring.forEach(nimm); }); });
    var b = Math.max(g.Emax - g.Emin, g.Nmax - g.Nmin, 4000) * 1.16, mE = (g.Emin + g.Emax) / 2, mN = (g.Nmin + g.Nmax) / 2;
    return {Emin: mE - b / 2, Emax: mE + b / 2, Nmin: mN - b / 2, Nmax: mN + b / 2, m: b};
  }
  function kartenbild(bbox) {
    return new Promise(function (ok, nein) {
      var im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = function () { ok(im); };
      im.onerror = function () { nein(new Error("Kartenbild nicht geladen (swisstopo).")); };
      im.src = WMS + "?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=ch.swisstopo.pixelkarte-grau&STYLES=default&CRS=EPSG:2056&FORMAT=image/png&LANG=de" +
        "&BBOX=" + [bbox.Emin, bbox.Nmin, bbox.Emax, bbox.Nmax].map(function (v) { return v.toFixed(1); }).join(",") + "&WIDTH=" + KANTE + "&HEIGHT=" + KANTE;
    });
  }
  function zeichnen(im, bbox, punkte, gebiete, zeilen) {
    var cv = $("rayon-cv"), c = cv.getContext("2d"), mpp = bbox.m / KANTE;
    function px(p) { return {x: (p.E - bbox.Emin) / mpp, y: (bbox.Nmax - p.N) / mpp}; }
    c.clearRect(0, 0, KANTE, KANTE);
    c.drawImage(im, 0, 0, KANTE, KANTE);
    [["v", FARBE.blauF, FARBE.blau], ["e", FARBE.orangeF, FARBE.orange]].forEach(function (g) {
      var ringe = gebiete[g[0]]; if (!ringe) return;
      c.beginPath();
      ringe.forEach(function (ring) { ring.forEach(function (p, i) { var q = px(p); if (i === 0) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y); }); c.closePath(); });
      c.fillStyle = g[1]; c.fill("evenodd"); c.lineWidth = 3; c.strokeStyle = g[2]; c.lineJoin = "round"; c.stroke();
    });
    function marke(p, farbe, s) {
      var q = px(p);
      c.fillStyle = farbe; c.fillRect(q.x - 12, q.y - 12, 24, 24); c.lineWidth = 3; c.strokeStyle = "#fff"; c.strokeRect(q.x - 12, q.y - 12, 24, 24);
      c.font = "600 26px Archivo, 'Segoe UI', sans-serif"; c.textBaseline = "middle"; c.textAlign = "left";
      c.lineWidth = 7; c.strokeStyle = "rgba(255,255,255,0.92)"; c.strokeText(s, q.x + 22, q.y); c.fillStyle = FARBE.schwarz; c.fillText(s, q.x + 22, q.y);
    }
    if (punkte.v) marke(punkte.v, FARBE.blau, "Sitz des Verleihers");
    if (punkte.e) marke(punkte.e, FARBE.orange, "Sitz des Einsatzbetriebs");
    var laenge = 500;
    [500, 1000, 2000, 5000, 10000].forEach(function (k) { if (k <= bbox.m * 0.25) laenge = k; });
    var lpx = laenge / mpp, x0 = 34, y0 = KANTE - 58;
    c.fillStyle = "rgba(255,255,255,0.88)"; c.fillRect(x0 - 10, y0 - 34, lpx + 20, 52);
    c.fillStyle = FARBE.schwarz; c.fillRect(x0, y0, lpx, 5); c.fillRect(x0, y0 - 8, 3, 13); c.fillRect(x0 + lpx - 3, y0 - 8, 3, 13);
    c.font = "600 20px Archivo, 'Segoe UI', sans-serif"; c.textAlign = "left"; c.textBaseline = "bottom";
    c.fillText(laenge >= 1000 ? (laenge / 1000) + " km" : laenge + " m", x0, y0 - 10);
    c.font = "500 18px 'Segoe UI', system-ui, sans-serif"; c.textAlign = "right"; c.textBaseline = "bottom";
    var w = Math.max.apply(null, zeilen.map(function (z) { return c.measureText(z).width; })) + 24;
    c.fillStyle = "rgba(255,255,255,0.88)"; c.fillRect(KANTE - w - 16, KANTE - 16 - zeilen.length * 26 - 8, w, zeilen.length * 26 + 12);
    c.fillStyle = FARBE.schwarz;
    zeilen.forEach(function (z, i) { c.fillText(z, KANTE - 28, KANTE - 18 - (zeilen.length - 1 - i) * 26); });
  }

  /* Ergebnis der letzten Messung; gilt nur, solange Adressen, Messpunkt und Minuten gleich sind */
  VW.rayon = {karte: null, schluessel: function () { return !!G.ESRI_SCHLUESSEL; }};
  function kennung(o, f) { return [o.rayon, o.rayonMin, f["v-adresse"], f["e-adresse"], f["a-beginn"]].join("|"); }
  VW.rayon.gilt = function (o, f) { return !!(VW.rayon.karte && VW.rayon.karte.kennung === kennung(o, f)); };

  function meldung(s, fehler) { var el = $("rayon-st"); el.textContent = s; el.className = "rstatus" + (fehler ? " fehler" : ""); }

  VW.rayon.messen = function () {
    var V = VW.vertraege.vv, o = V.auswahl(), f = V.felder();
    var brauchtV = o.rayon !== "einsatz", brauchtE = o.rayon !== "verleiher";
    if (!G.ESRI_SCHLUESSEL) { meldung("Die Messung ist auf dieser Seite nicht verfügbar. Miss den Rayon mit dem Rayon-Rechner und füge die Karte von Hand ein.", true); return; }
    if ((brauchtV && !f["v-adresse"]) || (brauchtE && !f["e-adresse"])) {
      meldung("Für die Messung braucht es unter B die Adresse " + (brauchtV && !f["v-adresse"] ? "des Verleihers" : "des Einsatzbetriebs") + ".", true); return;
    }
    var ab = abfahrt(f["a-beginn"]), punkte = {}, gebiete = {};
    meldung("Adressen werden gesucht …");
    Promise.all([brauchtV ? geokodiere(f["v-adresse"]) : null, brauchtE ? geokodiere(f["e-adresse"]) : null]).then(function (p) {
      if ((brauchtV && !p[0]) || (brauchtE && !p[1])) throw new Error("Adresse nicht gefunden. Bitte Strasse, Hausnummer, PLZ und Ort prüfen.");
      if (p[0]) punkte.v = p[0];
      if (p[1]) punkte.e = p[1];
      meldung("Fahrzeitgebiet wird gemessen …");
      return Promise.all([p[0] ? gebiet(p[0], o.rayonMin, ab.esriMs) : null, p[1] ? gebiet(p[1], o.rayonMin, ab.esriMs) : null]);
    }).then(function (r) {
      if (r[0]) gebiete.v = r[0];
      if (r[1]) gebiete.e = r[1];
      var liste = ["v", "e"].filter(function (k) { return punkte[k]; }).map(function (k) { return punkte[k]; });
      var bbox = grenzen(liste, ["v", "e"].filter(function (k) { return gebiete[k]; }).map(function (k) { return gebiete[k]; }));
      return kartenbild(bbox).then(function (im) {
        var jetzt = new Date();
        var zeilen = ["Rayon: " + o.rayonMin + " Minuten mit dem Auto ab " + {verleiher: "Sitz des Verleihers", einsatz: "Sitz des Einsatzbetriebs", beide: "Sitz des Verleihers oder des Einsatzbetriebs"}[o.rayon] + ", Abfahrt " + ab.text,
          "gemessen am " + datumCH(jetzt) + " · Karte: © swisstopo · Fahrzeitgebiete: Powered by Esri"];
        zeichnen(im, bbox, punkte, gebiete, zeilen);
        VW.rayon.karte = {kennung: kennung(o, f), bild: $("rayon-cv").toDataURL("image/jpeg", 0.86), zeilen: zeilen,
          legende: ["v", "e"].filter(function (k) { return gebiete[k]; })};
        VW.zeige($("rayon-bild"), true);
        meldung("Gemessen. Die Karte kommt ins Einsatzblatt.");
        VW.vorschauWeg();
      });
    }).catch(function (err) { meldung(err.message || "Messung fehlgeschlagen.", true); });
  };
  document.addEventListener("DOMContentLoaded", function () {
    var k = $("rayon-messen");
    if (k) k.addEventListener("click", VW.rayon.messen);
  });
})(typeof window !== "undefined" ? window : globalThis);
