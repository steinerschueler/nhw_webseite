/* Rayon-Rechner (rayon.html): misst die Fahrzeit mit dem Auto vom Firmensitz des Arbeitgebers und,
   bei Personalverleih, vom Sitz des Einsatzbetriebs zu einer Baustelle, wertet sie getrennt nach
   GAV Elektro Art. 27.4 (Wegzeit) und Art. 33.1 (Verpflegung) aus und zeichnet die 15-Minuten-
   Gebiete auf ein swisstopo-Kartenbild.

   Dienste, alle als reine Datenabfragen (fetch, Bilder mit crossOrigin "anonymous"; keine
   Cookies, keine Anbieter-Bibliothek, nichts wird gespeichert):
     swisstopo  api3.geo.admin.ch  SearchServer   Adressen zu Koordinaten (LV95 und WGS84)
     swisstopo  wms.geo.admin.ch   GetMap         Kartenbild (Landeskarte grau, EPSG:2056)
     Esri       route-api.arcgis.com               Fahrzeit (Route) und Fahrzeitgebiet (Service area)
                                                  mit Verkehrsprognose zur Abfahrtszeit
   Attribution: "© swisstopo" und "Powered by Esri" stehen auf der Seite, im Bild und im PDF.

   Esri-Schluessel: ein Browser-Schluessel, auf die Referrer der Webseite beschraenkt und auf das
   Privileg Routing; er steht hier bewusst im Quelltext (er ist in der ausgelieferten Seite
   ohnehin sichtbar). Er laeuft nach hoechstens einem Jahr ab; Erneuerung: README.md. Leer =
   Routing aus, Adressen und Karte laufen trotzdem. */
(function () {
  "use strict";

  var ESRI_KEY = "AAPTaZh70gdMw1s1M3ytocFv0jA..WZ8oRYSDRJ27x0_UPtgWDkOWkEpy-cBw8w2Muj8xV0KAMvDGon1uy4pb-ZjtNRdw123-seV_vrnm55SlB7vd9kR__yK2QlbrtMX84EQOO_nym8grJB5hCVxGKoVCkn8TnbQKEG-Q6Ba6rskWM62JyG-4zpQNsy3x9C5iAmEmK65G6dSh5HeHz5UsewuPiYUVQa-tImtvkr_IhhPqyrvPfnqU9ofBE53cY2uKvSdb3blK1hncyw..AT1_AmXggOTB";
  var RAYON_MIN = 15;

  var SUCHE = "https://api3.geo.admin.ch/rest/services/ech/SearchServer";
  var WMS = "https://wms.geo.admin.ch/";
  var ROUTE = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve";
  var GEBIET = "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";

  var FARBE = {
    blau: "#1B2A4A", blauF: "rgba(27,42,74,0.18)",
    orange: "#EA8C1B", orangeF: "rgba(234,140,27,0.22)",
    rot: "#C1121C", gruen: "#127A3C", grau: "#6E6B64", schwarz: "#000000"
  };
  var KANTE = 1500;                                  /* Kartenbild in Pixel, quadratisch */

  var $ = function (id) { return document.getElementById(id); };
  var felder = {
    v: {eingabe: $("adr-v"), status: $("st-v"), name: "Firmensitz des Arbeitgebers"},
    e: {eingabe: $("adr-e"), status: $("st-e"), name: "Sitz des Einsatzbetriebs", optional: true},
    b: {eingabe: $("adr-b"), status: $("st-b"), name: "Baustelle"}
  };
  var stand = {punkte: {}, zeiten: {}, gebiete: {}, abfahrt: null, gemessen: null, karteOk: false, ohneE: false};
  var VERPFLEGUNG_CHF = 18;                          /* GAV Art. 33.1, GAV 2026 bis 2029; beim naechsten GAV nachfuehren */
  /* Ergebnistexte, auf der Seite und im PDF gleich */
  var TXT = {
    wegIm: "Innerhalb des 15-Minuten-Rayons ab Firmensitz: Mit einem Rayon nach Art. 27.4 gilt die Wegzeit zu dieser Baustelle nicht als Arbeitszeit; ohne Rayon gilt Art. 27.3.",
    wegAus: "Ausserhalb des 15-Minuten-Rayons ab Firmensitz: Die Wegzeit zur Baustelle ist bezahlte Arbeitszeit, auch mit einem Rayon nach Art. 27.4.",
    verpIm: "Höchstens 15 Minuten ab Firmendomizil: keine Verpflegungsentschädigung nach Art. 33.1.",
    verpAus: "Mehr als 15 Minuten ab Firmendomizil: Anspruch auf Verpflegungsentschädigung von mindestens CHF " + VERPFLEGUNG_CHF + " je Tag (Art. 33.1), wenn die Arbeit am Morgen beginnt und am Nachmittag fortgesetzt wird.",
    offen: "Keine Fahrzeit gemessen."
  };
  var marke = {emblem: null, wort: null};

  /* ---------- Hilfen ---------- */

  function text(el, s) { el.textContent = s; }
  function zeige(el, sichtbar) { el.hidden = !sichtbar; }
  function fehler(s) { var f = $("fehler"); text(f, s); zeige(f, !!s); }

  function wgs84ToLv95(lat, lon) {
    /* Naeherungsformeln von swisstopo (Genauigkeit rund 1 m); genug fuer das Kartenbild */
    var p = (lat * 3600 - 169028.66) / 10000, l = (lon * 3600 - 26782.5) / 10000;
    return {
      E: 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l * l * l,
      N: 1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p - 194.56 * l * l * p + 119.79 * p * p * p
    };
  }

  function zweistellig(n) { return (n < 10 ? "0" : "") + n; }
  function datumCH(d) { return zweistellig(d.getDate()) + "." + zweistellig(d.getMonth() + 1) + "." + d.getFullYear(); }
  function zeitCH(d) { return zweistellig(d.getHours()) + ":" + zweistellig(d.getMinutes()); }
  var WOCHENTAG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  function naechsterWerktag() {
    var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d;
  }
  function isoDatum(d) { return d.getFullYear() + "-" + zweistellig(d.getMonth() + 1) + "-" + zweistellig(d.getDate()); }

  function abfahrtLesen() {
    var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec($("datum").value || "");
    var zm = /^(\d{2}):(\d{2})/.exec($("zeit").value || "");
    if (!dm || !zm) return null;
    var lokal = new Date(+dm[1], +dm[2] - 1, +dm[3], +zm[1], +zm[2], 0, 0);
    /* Esri erwartet die Ortszeit am ersten Punkt als Millisekunden "wie UTC" (startTimeIsUTC=false) */
    var esriMs = Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +zm[1], +zm[2], 0, 0);
    return {lokal: lokal, esriMs: esriMs,
      text: WOCHENTAG[lokal.getDay()] + ", " + datumCH(lokal) + ", " + zeitCH(lokal) + " Uhr"};
  }

  function minutenText(m) { return (Math.round(m * 10) / 10).toFixed(1) + " Minuten"; }
  function kmText(km) { return (Math.round(km * 10) / 10).toFixed(1) + " km"; }

  /* ---------- swisstopo: Adresse zu Punkt ---------- */

  function suche(textEingabe, origins) {
    var url = SUCHE + "?type=locations&sr=2056&limit=1&origins=" + origins +
      "&searchText=" + encodeURIComponent(textEingabe);
    return fetch(url, {credentials: "omit"}).then(function (r) { return r.json(); }).then(function (j) {
      var t = j && j.results && j.results[0];
      if (!t) return null;
      var a = t.attrs;
      /* bei sr=2056 liefert der Dienst Ost in "y" und Nord in "x" (geprueft am 11.10.2026); zur
         Sicherheit nach Groessenordnung sortieren */
      var E = a.y, N = a.x;
      if (E < 2000000 && N > 2000000) { var h = E; E = N; N = h; }
      return {label: String(a.label || "").replace(/<[^>]+>/g, ""), lat: a.lat, lon: a.lon, E: E, N: N, art: a.origin};
    });
  }
  function geokodiere(textEingabe) {
    var t = textEingabe.trim();
    if (!t) return Promise.resolve(null);
    return suche(t, "address").then(function (p) { return p || suche(t, "zipcode,gg25"); });
  }

  function statusSetzen(k, klasse, s) { var el = felder[k].status; el.className = "status" + (klasse ? " " + klasse : ""); text(el, s); }

  function punktHolen(k) {
    var eingabe = felder[k].eingabe.value.trim();
    var alt = stand.punkte[k];
    if (alt && alt.eingabe === eingabe) return Promise.resolve(alt);
    if (!eingabe) {
      if (felder[k].optional) { statusSetzen(k, "", ""); return Promise.resolve(null); }
      statusSetzen(k, "fehler", "Bitte eine Adresse eingeben."); return Promise.resolve(null);
    }
    statusSetzen(k, "", "suche …");
    return geokodiere(eingabe).then(function (p) {
      if (!p) { statusSetzen(k, "fehler", "Adresse nicht gefunden. Bitte Strasse, Hausnummer, PLZ und Ort prüfen."); delete stand.punkte[k]; return null; }
      p.eingabe = eingabe;
      stand.punkte[k] = p;
      statusSetzen(k, "ok", "gefunden: " + p.label + (p.art === "gg25" || p.art === "zipcode" ? " (Ortsmitte, ohne Hausnummer)" : ""));
      return p;
    }).catch(function () { statusSetzen(k, "fehler", "Adresssuche nicht erreichbar (swisstopo). Bitte später noch einmal."); return null; });
  }

  /* ---------- Esri: Fahrzeit und Fahrzeitgebiet ---------- */

  function esri(url, params) {
    params.f = "json"; params.token = ESRI_KEY;
    var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(url + "?" + q, {credentials: "omit"}).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.error) throw new Error("Routing-Dienst: " + (j.error.message || ("Fehler " + j.error.code)));
      return j;
    });
  }

  function fahrzeit(von, nach, esriMs) {
    return esri(ROUTE, {
      stops: von.lon + "," + von.lat + ";" + nach.lon + "," + nach.lat,
      impedanceAttributeName: "TravelTime",
      startTime: String(esriMs), startTimeIsUTC: "false",
      returnRoutes: "true", returnDirections: "false", returnStops: "false", outSR: "4326"
    }).then(function (j) {
      var f = j.routes && j.routes.features && j.routes.features[0];
      if (!f) throw new Error("Keine Route gefunden.");
      var a = f.attributes || {}, min = null, km = null;
      Object.keys(a).forEach(function (k) {
        if (/^Total_TravelTime$/i.test(k)) min = a[k];
        else if (min === null && /^Total_(Minutes|TruckTravelTime|WalkTime)$/i.test(k)) min = a[k];
        if (/^Total_Kilometers$/i.test(k)) km = a[k];
      });
      if (min === null) throw new Error("Die Antwort enthält keine Fahrzeit.");
      return {minuten: min, km: km};
    });
  }

  function fahrzeitgebiet(sitz, esriMs) {
    return esri(GEBIET, {
      facilities: sitz.lon + "," + sitz.lat,
      defaultBreaks: String(RAYON_MIN),
      impedanceAttributeName: "TravelTime",
      timeOfDay: String(esriMs), timeOfDayIsUTC: "false",
      travelDirection: "esriNATravelDirectionFromFacility",
      outputPolygons: "esriNAOutputPolygonSimplified",      /* die detaillierte Form besteht aus tausend Ringen entlang der Strassen */
      outSR: "4326"
    }).then(function (j) {
      var f = j.saPolygons && j.saPolygons.features && j.saPolygons.features[0];
      if (!f || !f.geometry || !f.geometry.rings) throw new Error("Kein Fahrzeitgebiet erhalten.");
      return f.geometry.rings.map(function (ring) {
        return ring.map(function (pt) { return wgs84ToLv95(pt[1], pt[0]); });
      });
    });
  }

  /* ---------- Karte ---------- */

  function grenzen(punkte, gebiete) {
    var g = {Emin: Infinity, Emax: -Infinity, Nmin: Infinity, Nmax: -Infinity};
    function nimm(p) { if (p.E < g.Emin) g.Emin = p.E; if (p.E > g.Emax) g.Emax = p.E; if (p.N < g.Nmin) g.Nmin = p.N; if (p.N > g.Nmax) g.Nmax = p.N; }
    punkte.forEach(nimm);
    gebiete.forEach(function (ringe) { ringe.forEach(function (ring) { ring.forEach(nimm); }); });
    var breite = Math.max(g.Emax - g.Emin, g.Nmax - g.Nmin, 4000) * 1.16;     /* Rand 8 %, mindestens 4 km */
    var mE = (g.Emin + g.Emax) / 2, mN = (g.Nmin + g.Nmax) / 2;
    return {Emin: mE - breite / 2, Emax: mE + breite / 2, Nmin: mN - breite / 2, Nmax: mN + breite / 2, m: breite};
  }

  function kartenbild(bbox) {
    return new Promise(function (ok, nein) {
      var im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = function () { ok(im); };
      im.onerror = function () { nein(new Error("Kartenbild nicht geladen (swisstopo).")); };
      im.src = WMS + "?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=ch.swisstopo.pixelkarte-grau&STYLES=default&CRS=EPSG:2056&FORMAT=image/png&LANG=de" +
        "&BBOX=" + [bbox.Emin, bbox.Nmin, bbox.Emax, bbox.Nmax].map(function (v) { return v.toFixed(1); }).join(",") +
        "&WIDTH=" + KANTE + "&HEIGHT=" + KANTE;
    });
  }

  function schriftLaden() {
    if (document.fonts && document.fonts.load) {
      return Promise.all([document.fonts.load("600 32px Archivo"), document.fonts.load("600 26px Archivo")]).catch(function () {});
    }
    return Promise.resolve();
  }

  function zeichne(im, bbox, punkte, gebiete) {
    var cv = $("cv"), c = cv.getContext("2d");
    var mpp = bbox.m / KANTE;
    function px(p) { return {x: (p.E - bbox.Emin) / mpp, y: (bbox.Nmax - p.N) / mpp}; }
    c.clearRect(0, 0, KANTE, KANTE);
    c.drawImage(im, 0, 0, KANTE, KANTE);

    /* Fahrzeitgebiete */
    [["v", FARBE.blauF, FARBE.blau], ["e", FARBE.orangeF, FARBE.orange]].forEach(function (g) {
      var ringe = gebiete[g[0]]; if (!ringe) return;
      c.beginPath();
      ringe.forEach(function (ring) { ring.forEach(function (p, i) { var q = px(p); if (i === 0) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y); }); c.closePath(); });
      c.fillStyle = g[1]; c.fill("evenodd");
      c.lineWidth = 3.5; c.strokeStyle = g[2]; c.lineJoin = "round"; c.stroke();
    });

    /* Marker mit Beschriftung */
    function etikett(q, s, dy) {
      c.font = "600 30px Archivo, 'Segoe UI', sans-serif"; c.textBaseline = "middle"; c.textAlign = "left";
      c.lineWidth = 8; c.strokeStyle = "rgba(255,255,255,0.92)"; c.lineJoin = "round";
      c.strokeText(s, q.x + 26, q.y + dy); c.fillStyle = FARBE.schwarz; c.fillText(s, q.x + 26, q.y + dy);
    }
    if (punkte.v) { var qv = px(punkte.v); c.fillStyle = FARBE.blau; c.fillRect(qv.x - 15, qv.y - 15, 30, 30); c.lineWidth = 4; c.strokeStyle = "#fff"; c.strokeRect(qv.x - 15, qv.y - 15, 30, 30); etikett(qv, "Firmensitz Arbeitgeber", 0); }
    if (punkte.e) { var qe = px(punkte.e); c.fillStyle = FARBE.orange; c.fillRect(qe.x - 15, qe.y - 15, 30, 30); c.lineWidth = 4; c.strokeStyle = "#fff"; c.strokeRect(qe.x - 15, qe.y - 15, 30, 30); etikett(qe, "Sitz Einsatzbetrieb", 0); }
    if (punkte.b) {
      var qb = px(punkte.b);
      c.beginPath(); c.arc(qb.x, qb.y, 17, 0, Math.PI * 2);
      c.fillStyle = FARBE.schwarz; c.fill();
      c.lineWidth = 4; c.strokeStyle = "#fff"; c.stroke();
      etikett(qb, "Baustelle", 0);
    }

    /* Massstab unten links */
    var kandidaten = [500, 1000, 2000, 5000, 10000], laenge = 500;
    kandidaten.forEach(function (k) { if (k <= bbox.m * 0.25) laenge = k; });
    var lpx = laenge / mpp, x0 = 40, y0 = KANTE - 70;
    c.fillStyle = "rgba(255,255,255,0.88)"; c.fillRect(x0 - 12, y0 - 40, lpx + 24, 62);
    c.fillStyle = FARBE.schwarz; c.fillRect(x0, y0, lpx, 6); c.fillRect(x0, y0 - 10, 4, 16); c.fillRect(x0 + lpx - 4, y0 - 10, 4, 16);
    c.font = "600 24px Archivo, 'Segoe UI', sans-serif"; c.textAlign = "left"; c.textBaseline = "bottom";
    c.fillText(laenge >= 1000 ? (laenge / 1000) + " km" : laenge + " m", x0, y0 - 12);

    /* Quelle und Zeitstempel unten rechts */
    c.font = "500 22px 'Segoe UI', system-ui, sans-serif"; c.textAlign = "right"; c.textBaseline = "bottom";
    var z1 = "Karte: © swisstopo · Fahrzeitgebiete: Powered by Esri";
    var z2 = stand.gemessen ? "gemessen am " + datumCH(stand.gemessen) + ", " + zeitCH(stand.gemessen) + (stand.abfahrt ? " · Abfahrt " + stand.abfahrt.text : "") : "";
    var w = Math.max(c.measureText(z1).width, c.measureText(z2).width) + 28;
    c.fillStyle = "rgba(255,255,255,0.88)"; c.fillRect(KANTE - w - 20, KANTE - (z2 ? 84 : 52), w, z2 ? 70 : 38);
    c.fillStyle = FARBE.schwarz; c.fillText(z1, KANTE - 34, KANTE - (z2 ? 50 : 18));
    if (z2) c.fillText(z2, KANTE - 34, KANTE - 18);
  }

  function karteZeichnen() {
    var punkte = stand.punkte, gebiete = stand.gebiete;
    var liste = ["v", "e", "b"].filter(function (k) { return punkte[k]; }).map(function (k) { return punkte[k]; });
    if (!liste.length) return Promise.resolve();
    var bbox = grenzen(liste, ["v", "e"].filter(function (k) { return gebiete[k]; }).map(function (k) { return gebiete[k]; }));
    return Promise.all([kartenbild(bbox), schriftLaden()]).then(function (r) {
      zeichne(r[0], bbox, punkte, gebiete);
      stand.karteOk = true;
      zeige($("legende"), true);
      zeige($("lg-e-zeile"), !!gebiete.e);
      $("png").disabled = false;
    });
  }

  /* ---------- Ergebnis ---------- */

  /* Eine Regel: Messzeile (Minuten, Strecke) und farbiger Kasten mit dem Ergebnistext */
  function regelZeigen(prefix, z, imText, ausText) {
    var el = $("r-" + prefix), km = $("r-" + prefix + "-km"), box = $("u-" + prefix), t = $("u-" + prefix + "-text");
    if (!z) { el.className = "w offen"; text(el, "nicht gemessen"); text(km, ""); box.className = "out big"; text(t, TXT.offen); return null; }
    var im = z.minuten <= RAYON_MIN;
    el.className = "w " + (im ? "im" : "aus");
    text(el, minutenText(z.minuten));
    text(km, z.km != null ? "Strecke " + kmText(z.km) : "");
    box.className = "out big " + (im ? "im" : "aus");
    text(t, im ? imText : ausText);
    return im;
  }

  function ergebnisZeigen() {
    /* Wegzeit (27.4) immer ab Firmensitz; Verpflegung (33.1) ab Sitz des Einsatzbetriebs, ohne
       Einsatzbetrieb ab Firmensitz (Firmendomizil = Einstellungsort) */
    var zWeg = stand.zeiten.v, zVerp = stand.ohneE ? stand.zeiten.v : stand.zeiten.e;
    $("r-verp-l").firstChild.nodeValue = stand.ohneE ? "Firmensitz des Arbeitgebers zur Baustelle (kein Einsatzbetrieb angegeben)" : "Sitz des Einsatzbetriebs zur Baustelle";
    regelZeigen("weg", zWeg, TXT.wegIm, TXT.wegAus);
    regelZeigen("verp", zVerp, TXT.verpIm, TXT.verpAus);
  }

  function messungZeile(fehlerText) {
    var s = "";
    if (stand.gemessen) {
      s = "Gemessen am " + datumCH(stand.gemessen) + " um " + zeitCH(stand.gemessen) + " Uhr";
      if (stand.abfahrt) s += ", Abfahrt " + stand.abfahrt.text;
      s += ". Effektive Fahrzeit mit dem Auto, ein Weg, mit Verkehrsprognose (Powered by Esri). Das Ergebnis ändert sich mit dem Verkehr; massgebend sind der GAV und der Arbeits- oder Verleihvertrag.";
    }
    if (fehlerText) s += (s ? " " : "") + fehlerText;
    text($("messung"), s);
  }

  /* ---------- Ablauf ---------- */

  function rechnen() {
    fehler("");
    var knopf = $("rechnen"); knopf.disabled = true; text(knopf, "misst …");
    $("pdf").disabled = true; $("png").disabled = true; vorschauWeg();
    stand.zeiten = {}; stand.gebiete = {}; stand.karteOk = false;
    var abfahrt = abfahrtLesen();
    if (!abfahrt) { fehler("Bitte Datum und Uhrzeit der Abfahrt angeben."); knopf.disabled = false; text(knopf, "Wegzeit messen"); return; }
    stand.abfahrt = abfahrt;

    Promise.all([punktHolen("v"), punktHolen("e"), punktHolen("b")]).then(function (p) {
      var v = p[0], e = p[1], b = p[2];
      var eLeer = !felder.e.eingabe.value.trim();              /* Einsatzbetrieb ist optional */
      if (!v || !b || (!e && !eLeer)) throw new Error("Bitte die Adressen so eingeben, dass sie gefunden werden.");
      stand.ohneE = eLeer;
      if (eLeer) delete stand.punkte.e;
      stand.gemessen = new Date();
      if (!ESRI_KEY) {
        ergebnisZeigen();
        messungZeile("Der Routing-Dienst ist noch nicht freigeschaltet; die Karte zeigt nur die Punkte.");
        return karteZeichnen();
      }
      var meldungen = [];
      function sicher(pr, name) { return pr.catch(function (err) { meldungen.push(name + ": " + err.message); return null; }); }
      var keine = Promise.resolve(null);
      return Promise.all([
        sicher(fahrzeit(v, b, abfahrt.esriMs), "Fahrzeit ab Firmensitz des Arbeitgebers"),
        e ? sicher(fahrzeit(e, b, abfahrt.esriMs), "Fahrzeit ab Sitz des Einsatzbetriebs") : keine,
        sicher(fahrzeitgebiet(v, abfahrt.esriMs), "Fahrzeitgebiet Arbeitgeber"),
        e ? sicher(fahrzeitgebiet(e, abfahrt.esriMs), "Fahrzeitgebiet Einsatzbetrieb") : keine
      ]).then(function (r) {
        stand.zeiten = {v: r[0], e: r[1]};
        if (r[2]) stand.gebiete.v = r[2];
        if (r[3]) stand.gebiete.e = r[3];
        ergebnisZeigen();
        messungZeile(meldungen.length ? "Nicht vollständig: " + meldungen.join("; ") + "." : "");
        return karteZeichnen().then(function () { if (r[0]) $("pdf").disabled = false; });
      });
    }).catch(function (err) {
      fehler(err.message || String(err));
    }).then(function () { knopf.disabled = false; text(knopf, "Wegzeit messen"); });
  }

  /* ---------- PDF (jsPDF, A4 hoch) ---------- */

  function markeLaden(pfad, ziel) {
    var im = new Image();
    im.onload = function () { try { var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext("2d").drawImage(im, 0, 0); marke[ziel] = c.toDataURL("image/png"); } catch (e) {} };
    im.src = pfad;
  }
  markeLaden("bilder/emblem-2x.png", "emblem");     /* 250 x 80 px -> 31.3 x 10 mm */
  markeLaden("bilder/wortmarke-2x.png", "wort");    /* 474 x 46 px -> 47.4 x 4.6 mm */

  function pdfErstellen() {
    if (!window.jspdf || !window.jspdf.jsPDF) { fehler("PDF-Bibliothek nicht geladen. Es öffnet sich die Druckansicht; dort \"Als PDF speichern\" wählen."); window.print(); return; }
    var neutral = $("neutral").checked;                /* ohne Logo und ohne Hinweis auf die GmbH */
    var d = new window.jspdf.jsPDF({unit: "mm", format: "a4"});
    var x = 20, rechts = 190, PH = 297, y;
    var INK = [0, 0, 0], GRAU = [110, 107, 100], LINIE = [220, 214, 203], ROT = [193, 18, 28], GRN = [18, 122, 60];
    function abschnitt(t) {
      y += 5; d.setFont("helvetica", "bold"); d.setFontSize(11); d.setTextColor(INK[0], INK[1], INK[2]); d.text(t, x, y);
      y += 2.5; d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.3); d.line(x, y, rechts, y); y += 6.5;
      d.setFont("helvetica", "normal"); d.setFontSize(10);
    }
    function zeile(l, w, farbe) {
      d.setFont("helvetica", "normal"); d.setFontSize(10); d.setTextColor(GRAU[0], GRAU[1], GRAU[2]); d.text(l, x, y);
      d.setFont("helvetica", "bold"); var f = farbe || INK; d.setTextColor(f[0], f[1], f[2]);
      var zl = d.splitTextToSize(String(w), rechts - x - 62); d.text(zl, x + 62, y); y += 5.5 * zl.length;
    }
    function kasten(im, t) {
      var f = im ? GRN : ROT;
      d.setFont("helvetica", "bold"); d.setFontSize(10.5);
      var zl = d.splitTextToSize(t, rechts - x), h = 4.6 * zl.length + 5;
      d.setFillColor(f[0], f[1], f[2]); d.roundedRect(x - 3, y - 5, (rechts - x) + 6, h, 1.2, 1.2, "F");
      d.setTextColor(255, 255, 255); d.text(zl, x, y + 0.5);
      y += h + 2;
    }
    if (neutral) {
      y = 24;
    } else {
      /* Kopf im Hausdesign: rote Linie, Emblem links, Wortmarke rechts, feine Trennlinie */
      d.setFillColor(ROT[0], ROT[1], ROT[2]); d.rect(0, 10, 210, 0.8, "F");
      if (marke.emblem) d.addImage(marke.emblem, "PNG", x, 14, 31.3, 10);
      if (marke.wort) d.addImage(marke.wort, "PNG", rechts - 47.4, 17.4, 47.4, 4.6);
      d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.3); d.line(x, 27, rechts, 27);
      y = 37;
    }
    d.setFont("helvetica", "bold"); d.setFontSize(16); d.setTextColor(INK[0], INK[1], INK[2]);
    d.text("Rayon nach GAV Elektro, Art. 27.4 und 33.1", x, y); y += 6;
    d.setFont("helvetica", "normal"); d.setFontSize(9.5); d.setTextColor(GRAU[0], GRAU[1], GRAU[2]);
    d.text((neutral ? "Gemessen" : "Rayon-Rechner naville-handwerk.ch  ·  gemessen") + " am " + datumCH(stand.gemessen) + " um " + zeitCH(stand.gemessen) + " Uhr  ·  Abfahrt " + stand.abfahrt.text, x, y); y += 3;

    abschnitt("Adressen");
    zeile("Firmensitz des Arbeitgebers", stand.punkte.v.label);
    zeile("Sitz des Einsatzbetriebs", stand.ohneE ? "keiner angegeben (Verpflegung ab Firmensitz gemessen)" : stand.punkte.e.label);
    zeile("Baustelle", stand.punkte.b.label);

    abschnitt("Fahrzeit mit dem Auto, ein Weg, Verkehrsprognose zur Abfahrtszeit");
    var zWeg = stand.zeiten.v, zVerp = stand.ohneE ? stand.zeiten.v : stand.zeiten.e;
    function wert(z) { return z ? minutenText(z.minuten) + (z.km != null ? " (" + kmText(z.km) + ")" : "") : "nicht gemessen"; }
    function farbe(z) { return z ? (z.minuten <= RAYON_MIN ? GRN : ROT) : GRAU; }
    zeile("Wegzeit, Art. 27.4", "ab Firmensitz des Arbeitgebers: " + wert(zWeg), farbe(zWeg));
    zeile("Verpflegung, Art. 33.1", (stand.ohneE ? "ab Firmensitz des Arbeitgebers: " : "ab Sitz des Einsatzbetriebs: ") + wert(zVerp), farbe(zVerp));
    y += 3;
    if (zWeg) kasten(zWeg.minuten <= RAYON_MIN, "Wegzeit: " + (zWeg.minuten <= RAYON_MIN ? TXT.wegIm : TXT.wegAus));
    if (zVerp) kasten(zVerp.minuten <= RAYON_MIN, "Verpflegung: " + (zVerp.minuten <= RAYON_MIN ? TXT.verpIm : TXT.verpAus));
    d.setFont("helvetica", "normal"); d.setFontSize(9); d.setTextColor(GRAU[0], GRAU[1], GRAU[2]);
    var hinweis = d.splitTextToSize("Richtwert: Die Fahrzeit hängt vom Verkehr ab und ändert sich von Tag zu Tag. Gemessen nach der Vorgabe der PLK Elektro: effektive Fahrzeit mit dem Auto zu den Arbeitszeiten, Abfahrt ab der Firma, unter den tatsächlichen Verkehrsbedingungen; der Wohnort des Arbeitnehmers spielt keine Rolle. Der Rayon nach Art. 27.4 gilt nur, wenn der Arbeitgeber ihn im Betriebsreglement oder im Arbeitsvertrag festgelegt hat (nach PLK nur Mitglieder von EIT.swiss). Art. 33.1 ist allgemeinverbindlich; bei Personalverleih zählt der Sitz des Einsatzbetriebs. Massgebend sind der GAV und der Arbeits- oder Verleihvertrag. Fahrzeiten und Fahrzeitgebiete: Powered by Esri, Strassen- und Verkehrsdaten TomTom.", rechts - x);
    d.text(hinweis, x, y); y += hinweis.length * 4.2;

    if (stand.karteOk) {
      if (PH - 18 - 14 - (y + 14) < 100) { d.addPage(); y = 12; }   /* Karte samt Titel auf die naechste Seite */
      abschnitt(stand.gebiete.e ? "Karte: beide 15-Minuten-Gebiete und die Baustelle" : "Karte: 15-Minuten-Gebiet und Baustelle");
      var seite = Math.min(rechts - x, PH - 18 - 14 - y);          /* bis zur Fusszeile, mit Legende */
      try {
        d.addImage($("cv").toDataURL("image/jpeg", 0.86), "JPEG", x + ((rechts - x) - seite) / 2, y, seite, seite);
      } catch (e) {}
      y += seite + 5;
      d.setFont("helvetica", "normal"); d.setFontSize(8.5); d.setTextColor(GRAU[0], GRAU[1], GRAU[2]);
      var lx = x;
      d.setFillColor(27, 42, 74); d.rect(lx, y - 3, 3.5, 3.5, "F"); d.text("15 Minuten ab Firmensitz des Arbeitgebers", lx + 5.5, y); lx += 72;
      if (stand.gebiete.e) { d.setFillColor(234, 140, 27); d.rect(lx, y - 3, 3.5, 3.5, "F"); d.text("15 Minuten ab Sitz des Einsatzbetriebs", lx + 5.5, y); lx += 68; }
      d.setFillColor(INK[0], INK[1], INK[2]); d.circle(lx + 1.8, y - 1.3, 1.8, "F"); d.text("Baustelle", lx + 5.5, y);
      y += 4.5; d.text("Karte: © swisstopo", x, y);
    }

    var fuss = (neutral ? "" : "Rayon-Rechner · naville-handwerk.ch/rayon.html · ") + "Fahrzeitmessung nach GAV Elektro Art. 27.4 und 33.1";
    var n = d.getNumberOfPages();
    for (var i = 1; i <= n; i++) {
      d.setPage(i); d.setFont("helvetica", "normal"); d.setFontSize(8); d.setTextColor(GRAU[0], GRAU[1], GRAU[2]);
      d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.3); d.line(x, PH - 13, rechts, PH - 13);
      d.text(fuss, x, PH - 9);
      d.text("Seite " + i + "/" + n, rechts, PH - 9, {align: "right"});
    }
    pdfVorschau(d, "rayon_" + isoDatum(stand.gemessen) + ".pdf");
  }

  /* Vorschau: das PDF erscheint zuerst in einem Rahmen auf der Seite; herunterladen erst danach,
     mit dem richtigen Dateinamen (ein Blob-Link; der Betrachter im Rahmen hiesse die Datei sonst
     nach der Blob-Kennung) */
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
  function pdfHerunterladen() {
    if (!vorschau.url) return;
    var a = document.createElement("a"); a.href = vorschau.url; a.download = vorschau.name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function pdfNeuerTab() { if (vorschau.url) window.open(vorschau.url, "_blank"); }

  function pngSpeichern() {
    try {
      $("cv").toBlob(function (b) {
        if (!b) { fehler("Bild konnte nicht erzeugt werden."); return; }
        var a = document.createElement("a"); a.href = URL.createObjectURL(b);
        a.download = "rayon_karte_" + isoDatum(stand.gemessen || new Date()) + ".png"; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      }, "image/png");
    } catch (e) { fehler("Bild konnte nicht erzeugt werden: " + e.message); }
  }

  /* ---------- Start ---------- */

  $("datum").value = isoDatum(naechsterWerktag());
  var q = new URLSearchParams(location.search);            /* Vorbelegung ueber die Adresse der Seite: ?v=…&e=…&b= */
  ["v", "e", "b"].forEach(function (k) { if (q.get(k)) felder[k].eingabe.value = q.get(k); });
  if (q.get("zeit") && /^\d{2}:\d{2}$/.test(q.get("zeit"))) $("zeit").value = q.get("zeit");
  if (q.has("neutral")) $("neutral").checked = q.get("neutral") !== "0";   /* Vorgabe: neutral */
  zeige($("hinweis-key"), !ESRI_KEY);

  $("rechnen").addEventListener("click", rechnen);
  $("pdf").addEventListener("click", pdfErstellen);
  $("pdfdown").addEventListener("click", pdfHerunterladen);
  $("pdftab").addEventListener("click", pdfNeuerTab);
  $("neutral").addEventListener("change", vorschauWeg);
  $("png").addEventListener("click", pngSpeichern);
  ["v", "e", "b"].forEach(function (k) {
    felder[k].eingabe.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); rechnen(); } });
    felder[k].eingabe.addEventListener("change", function () { if (!felder[k].eingabe.value.trim()) statusSetzen(k, "", ""); });
  });
})();
