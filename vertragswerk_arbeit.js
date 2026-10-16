/* Vertragswerk, Arbeitsvertrag zwischen der Firma und ihrem Inhaber (Selbstverleih, Leiharbeit nach
   Art. 19 AVG). Vertragsblatt (Seite 1, alle Werte) und Vertragsbedingungen (18 Ziffern in fünf
   Gruppen); die Auswahl unter A steuert den Text, das Blatt unter B die Felder der ersten Seite.
   Meldet sich in VW.vertraege.av an wie der Verleihvertrag (vertragswerk_verleih.js); die
   Erläuterungen stehen am Ende dieser Datei in VW.ERL.av. */
(function (G) {
  "use strict";
  var VW = G.VW = G.VW || {};
  VW.vertraege = VW.vertraege || {};
  VW.ERL = VW.ERL || {};

  /* Grundfassung: die Vorwahl der Seite */
  var GRUND = {lohnform: "monat", ferienlohn: "angespart", dreizehnter: "dezember", wochenstunden: 40,
    ferien: "gav", ferienTage: 30, werkzeug: "inventar", ktg: "haelftig", probezeit: 0,
    kuendigung: "gesetz", kuendMonate: 3, kanton: "BE", jahr: new Date().getFullYear()};

  /* Zuschläge beim Stundenlohn nach Anhang 6 GAV: Ferien und Feiertage je Anzahl Tage, 13. Monatslohn */
  var FERIEN_PROZ = {27: 11.59, 28: 12.07, 29: 12.55, 30: 13.04, 31: 13.54, 32: 14.04, 33: 14.54, 34: 15.04,
    35: 15.56, 36: 16.07, 37: 16.59, 38: 17.12, 39: 17.65, 40: 18.18};
  var FEIERTAGE_PROZ = {1: 0.39, 2: 0.78, 3: 1.17, 4: 1.56, 5: 1.96, 6: 2.36, 7: 2.77, 8: 3.17, 9: 3.59};
  var DREIZEHN_PROZ = 8.33;
  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  /* Zahl im Text: bis zwölf in Worten, sonst mit Dezimalkomma */
  function zahl(n) {
    if (n === Math.round(n) && n >= 0 && n <= 12) return VW.zahlwort(n);
    return String(Math.round(n * 100) / 100).replace(".", ",");
  }
  function proz(p) { return p.toFixed(2).replace(".", ",") + " %"; }
  /* Betrag mit Tausender-Apostroph: "1234" -> "CHF 1'234.00"; Text bleibt Text */
  function betrag(s) {
    var t = String(s || "").replace(/^CHF\s*/i, "").replace(/'/g, "").replace(",", ".").trim();
    var n = parseFloat(t);
    return t && isFinite(n) && /^[0-9.]+$/.test(t) ? n : null;
  }
  function chf(s) {
    var n = typeof s === "number" ? s : betrag(s);
    if (n === null) return String(s || "");
    var teile = n.toFixed(2).split(".");
    return "CHF " + teile[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'") + "." + teile[1];
  }

  /* Ferien in Werktagen: [bis zum 50. Altersjahr, ab dem 50. Altersjahr] */
  function ferienTage(o) {
    if (o.ferien !== "mehr") return [27, 30];
    var t = Math.min(40, Math.max(28, Math.round(o.ferienTage || 30)));
    return [t, Math.max(t, 30)];
  }
  function stundenTag(o) { return o.wochenstunden / 5; }
  function grad(o) { return Math.round(o.wochenstunden / 40 * 100); }
  function feiertageKanton(o) {
    return o.kanton === "BE"
      ? "Feiertage nach Art. 2 Abs. 1 Bst. b und c des Gesetzes über die Ruhe an öffentlichen Feiertagen des Kantons Bern (FRG, BSG 555.1)"
      : "öffentlichen Feiertage des Kantons " + VW.kantonName(o.kanton) + " am Sitz der Arbeitgeberin";
  }
  /* Feiertage nach Art. 30.2 GAV, die im Kalenderjahr auf Montag bis Freitag fallen (Art. 30.1 GAV);
     nur für Bern bestimmt, sonst null. Karfreitag, Ostermontag, Auffahrt und Pfingstmontag fallen
     immer auf einen Werktag; Neujahr, Berchtoldstag, Bundesfeiertag, Weihnachten und Stephanstag
     je nach Jahr. */
  function feiertageImJahr(o) {
    if (o.kanton !== "BE") return null;
    var n = 4;
    [[0, 1], [0, 2], [7, 1], [11, 25], [11, 26]].forEach(function (md) {
      var w = new Date(o.jahr, md[0], md[1]).getDay();
      if (w >= 1 && w <= 5) n++;
    });
    return n;
  }
  function feiertagSatz(o) { var n = feiertageImJahr(o); return FEIERTAGE_PROZ[n === null ? 9 : n]; }
  function kuendMonate(o) { return Math.min(6, Math.max(1, Math.round(o.kuendMonate || 3))); }

  /* ---------- Vertragstext ---------- */

  function modell(o) {
    var stunde = o.lohnform === "stunde";
    var H = zahl(stundenTag(o));
    var inventar = o.werkzeug === "inventar";
    var ktgHalb = o.ktg !== "arbeitgeberin";
    var Z = [];
    function ziffer(id, titel, abs, teil) { Z.push({id: id, titel: titel, teil: teil || "", abs: abs.filter(Boolean)}); }
    var b = VW.b;

    ziffer("gegenstand", "Gegenstand und Vertragsteile", [
      b("a", "Die Arbeitgeberin stellt den Arbeitnehmer an, um ihn an Einsatzbetriebe zu verleihen: Personalverleih nach dem Arbeitsvermittlungsgesetz (AVG) in der Form der Leiharbeit nach Art. 27 Abs. 3 der Arbeitsvermittlungsverordnung (AVV). Einsatzbetrieb ist der Betrieb, dem sie den Arbeitnehmer nach einem Verleihvertrag verleiht (Art. 12 Abs. 1 AVG). Das Arbeitsverhältnis besteht unabhängig von den einzelnen Einsätzen. Die Arbeitgeberin verleiht nur ihren Inhaber und braucht dafür keine Bewilligung (Art. 28 Abs. 2 AVV)."),
      b("b", "Der Arbeitsvertrag besteht aus dem Vertragsblatt und diesen Vertragsbedingungen. Das Protokoll der Gesellschafterversammlung (Beilage) belegt die Festsetzung der Entschädigung und die Zustimmung zu diesem Vertrag; es ist nicht Vertragsbestandteil."),
      b("c", "Bei Widerspruch gilt diese Rangordnung: zwingendes Recht; die nach Art. 20 Abs. 1 AVG massgebenden Bestimmungen eines allgemeinverbindlich erklärten Gesamtarbeitsvertrags, namentlich des Gesamtarbeitsvertrags der Schweizerischen Elektrobranche (GAV), soweit dieser Vertrag nicht günstiger ist; Vertragsblatt; Vertragsbedingungen; im Übrigen das Gesetz."),
      b("werktag", "Arbeitstag ist jeder Tag, an dem der Arbeitnehmer arbeitet. Werktag ist Montag bis Freitag ohne die " + feiertageKanton(o) + ". Ferien, bezahlte Absenzen und Urlaube (Ziff. {R:verh.c}) werden in Werktagen bemessen; der GAV nennt sie Arbeitstage.")
    ], "Vertrag und Stellung");

    ziffer("stellung", "Stellung des Arbeitnehmers", [
      b("a", "Der Arbeitnehmer ist zugleich Alleingesellschafter und Geschäftsführer der Arbeitgeberin. Dieser Vertrag ist darum ein Vertrag zwischen der Gesellschaft und der Person, die sie vertritt; er ist schriftlich abgefasst (Art. 718b in Verbindung mit Art. 814 Abs. 4 OR)."),
      b("b", "Die Gesellschafterversammlung hat die Entschädigung des Geschäftsführers für seine Arbeit als Arbeitnehmer festgesetzt und diesem Vertrag zugestimmt (Art. 804 Abs. 2 Ziff. 6 OR; Beilage)."),
      b("c", "Die Parteien unterstellen ihr Verhältnis den Bestimmungen über den Einzelarbeitsvertrag (Art. 319 ff. OR) und Art. 19 AVG, soweit diese auf die Stellung des Arbeitnehmers als Alleingesellschafter anwendbar sind. Sozialversicherungs- und steuerrechtlich ist der Arbeitnehmer unselbständig erwerbend; sein Lohn ist massgebender Lohn."),
      b("organ", "Geschäftsführung und Verwaltung der Gesellschaft sind nicht Gegenstand dieses Vertrags. Der Arbeitnehmer erbringt sie als Organ der Gesellschaft unentgeltlich und ausserhalb der Arbeitszeit. Während der Arbeit handelt er als Arbeitnehmer nach den Weisungen des Einsatzbetriebs. Erklärungen zum Verleihvertrag gibt er als Geschäftsführer in der Form, die der jeweilige Verleihvertrag vorsieht."),
      b("e", "Abberufung, Rücktritt oder Ablauf der Amtsdauer als Geschäftsführer berühren diesen Vertrag nicht; die Kündigung dieses Vertrags beendet die Organstellung nicht (Art. 815 OR).")
    ]);

    ziffer("art", "Art der Arbeit und Qualifikation", [
      b("a", "Qualifikation und Art der Arbeit des Arbeitnehmers stehen im Vertragsblatt. Die Art der Arbeit je Einsatz richtet sich nach dem jeweiligen Verleihvertrag."),
      b("b", "Installationsarbeiten führt der Arbeitnehmer unter der Installationsbewilligung des Einsatzbetriebs aus, der ihn nach Art. 10b Abs. 1 Bst. b und Abs. 2 der Niederspannungs-Installationsverordnung (NIV) einbindet und über diese Arbeiten die technische Aufsicht ausübt. Schlusskontrolle und Sicherheitsnachweis bleiben Sache des Einsatzbetriebs; der Arbeitnehmer stellt keinen Sicherheitsnachweis im eigenen Namen aus."),
      b("c", "Ausbildungsnachweise legt der Arbeitnehmer der Arbeitgeberin und auf Verlangen dem Einsatzbetrieb vor.")
    ]);

    ziffer("einsatz", "Einsätze, Arbeitsort und Weisungsrecht", [
      b("a", "Einsatzbetrieb, Art der Arbeit, Arbeitsort, Beginn und Dauer jedes Einsatzes stehen im Verleihvertrag zwischen der Arbeitgeberin und dem Einsatzbetrieb. Die Arbeitgeberin händigt dem Arbeitnehmer vor dem Beginn des Einsatzes eine Kopie des Verleihvertrags und seiner Zusätze aus und hält die Übergabe mit Datum fest; die Kopie ergänzt diesen Vertrag um die Angaben je Einsatz nach Art. 19 Abs. 2 Bst. a bis d AVG."),
      b("b", "Der Arbeitnehmer nimmt die Einsätze an, die ihm die Arbeitgeberin zuweist. Vor jedem Einsatz stellt die Arbeitgeberin fest, welchem Gesamtarbeitsvertrag der Einsatzbetrieb untersteht (Ziff. {R:gav.a})."),
      b("ort", "Arbeitsort sind der Sitz des Einsatzbetriebs und seine Baustellen."),
      b("d", "Während des Einsatzes hat der Einsatzbetrieb das Weisungsrecht über die Ausführung der Arbeit im Rahmen der Art der Arbeit und bindet den Arbeitnehmer in seine Arbeitsorganisation ein (Art. 26 Abs. 1 und 2 Bst. a AVV). Der Arbeitnehmer hält die Arbeitszeiteinteilung und die Sicherheitsvorschriften des Einsatzbetriebs ein. Weisungen der Arbeitgeberin, die der jeweilige Verleihvertrag ihr vorbehält, gehen vor (Art. 321d OR). Fahrzeuge des Einsatzbetriebs führt der Arbeitnehmer nur mit der passenden Kategorie des Führerausweises; einen Entzug teilt er der Arbeitgeberin unverzüglich mit. Für Arbeitssicherheit und Gesundheitsschutz am Arbeitsort ist der Einsatzbetrieb verantwortlich (Art. 10 der Verordnung über die Unfallverhütung, VUV; Art. 9 der Verordnung 3 zum Arbeitsgesetz, ArGV 3). Das Arbeitsverhältnis besteht nur mit der Arbeitgeberin.")
    ], "Einsätze und Arbeitszeit");

    ziffer("zeit", "Arbeitszeit", [
      b("a", "Die wöchentliche Arbeitszeit steht im Vertragsblatt; sie verteilt sich im Durchschnitt auf " + H + " Stunden je Tag von Montag bis Freitag. Die Stunden je Wochentag richten sich nach dem jeweiligen Verleihvertrag; nennt er keine, gelten " + H + " Stunden je Tag von Montag bis Freitag. Innerhalb dieser Stunden teilt der Einsatzbetrieb die Arbeitszeit ein, im Rahmen des Arbeitsgesetzes (ArG) und des GAV. Nennt ein Verleihvertrag weniger Stunden, bleibt die Arbeitszeit nach dem Vertragsblatt geschuldet. Die Jahresbruttoarbeitszeit richtet sich nach Anhang 5c des GAV" +
        (o.wochenstunden < 40 ? ", im Verhältnis der wöchentlichen Arbeitszeit zu 40 Stunden" : "") +
        ", bei Beginn des Arbeitsverhältnisses im Lauf des Kalenderjahres anteilsmässig. Vorholzeit gibt es keine, solange die Arbeitgeberin sie nicht zu Beginn eines Jahres schriftlich festlegt (Art. 20.2 und 26.2 GAV)."),
      b("b", "Die wöchentliche Höchstarbeitszeit beträgt 50 Stunden (Art. 9 Abs. 1 Bst. b ArG). Pausen sind keine Arbeitszeit; die Mittagspause dauert 60 Minuten, bei höchstens neun Stunden Arbeit nach Vereinbarung 30 Minuten (Art. 28.1 bis 28.3 GAV). Bewilligungen für Nacht- und Sonntagsarbeit holt der Einsatzbetrieb ein; Nacht- und Sonntagsarbeit leistet der Arbeitnehmer nur mit seiner Zustimmung (Art. 17 Abs. 6 und 19 Abs. 5 ArG), Arbeit an Samstagen, Sonntagen und Feiertagen nur, wenn die Arbeitgeberin sie nach dem jeweiligen Verleihvertrag bestätigt hat. Die Arbeitgeberin sorgt über aufeinanderfolgende Einsätze für die Einhaltung des ArG (Höchstarbeitszeit, Ruhezeit, freier Sonntag, Ersatzruhe)."),
      b("c", "\"Fahrt zwischen Baustellen\" und \"Wartezeit während der Arbeit\" sind Arbeitszeit."),
      b("weg", "Wegzeit: Der Weg zwischen dem Wohnort des Arbeitnehmers und dem Sitz des Einsatzbetriebs ist Arbeitsweg und keine Arbeitszeit (Art. 27.2 GAV). Beginnt oder endet die Arbeit auf einer Baustelle, gilt die zeitliche Differenz, die diesen Arbeitsweg übersteigt, als Arbeitszeit (Art. 27.3 GAV)."),
      b("ueber", "Arbeit über die Stunden je Wochentag hinaus ordnet der Einsatzbetrieb im Rahmen von ArG und GAV an. Überstunden nach Art. 21 GAV sind die zwischen 6 und 23 Uhr geleisteten Stunden, die die Jahresbruttoarbeitszeit übersteigen; Ferien, Feiertage, bezahlte Absenzen und Zeit ohne Einsatz zählen mit den Stunden je Wochentag (Art. 20.1 und 21.1 GAV). Bis 100 Stunden werden sie innert Jahresfrist nach Art. 21.3 GAV ohne Lohnzuschlag durch Freizeit gleicher Dauer oder in Geld ausgeglichen; der Ausgleich wird schriftlich festgehalten. Weitere Stunden zahlt die Arbeitgeberin im Januar mit einem Lohnzuschlag von 25 % aus. Überzeit über die wöchentliche Höchstarbeitszeit hinaus zahlt die Arbeitgeberin bis zum Ende des folgenden Monats mit einem Lohnzuschlag von 25 % aus (Art. 22.2 GAV); wird für dieselben Stunden ein Lohnzuschlag nach Ziff. {R:lohn.zuschlag} bezahlt, entfällt der Überzeitzuschlag (Art. 22.3 GAV)."),
      b("ohne", "Kann die Arbeitgeberin keinen Einsatz zuweisen oder beendet der Einsatzbetrieb die Arbeit vor Ablauf der Stunden je Wochentag, bleibt sie zur Lohnzahlung verpflichtet (Art. 324 OR). Diese Zeit ohne Einsatz gilt mit den Stunden je Wochentag, ohne Verleihvertrag mit " + H + " Stunden je Tag von Montag bis Freitag, als geleistet; sie wird nicht an Überstunden, Ferien oder Lohn angerechnet. Der Arbeitnehmer hält sich in dieser Zeit für Einsätze bereit; was er daneben als Geschäftsführer tut, bleibt Organtätigkeit (Ziff. {R:stellung.organ}) und ändert daran nichts. Bleibt er aus Gründen in seiner Person der Arbeit fern, gilt diese Zeit nicht als geleistet.")
    ]);

    ziffer("rapport", "Wochenrapport", [
      b("a", "Der Arbeitnehmer erfasst seine Arbeitszeit je Kalenderwoche im Wochenrapport der Arbeitgeberin, mit Beginn, Ende und Pausen je Arbeitstag. Die Arbeitgeberin stellt den Wochenrapport dem Einsatzbetrieb zu; Bestätigung und Einwendungen richten sich nach dem jeweiligen Verleihvertrag."),
      b("b", "Die Arbeitgeberin erfasst Ferien, Feiertage und andere Absenzen und führt aus allen Angaben die monatliche Zusammenstellung nach Art. 20.6 GAV mit dem Stand der Jahresbruttoarbeitszeit; sie teilt sie dem Arbeitnehmer mit der Lohnabrechnung mit. Wochenrapporte, Zusammenstellungen und Lohnabrechnungen bilden das Verzeichnis der Arbeitszeit; die Arbeitgeberin bewahrt es mindestens fünf Jahre nach Ablauf seiner Gültigkeit auf (Art. 46 ArG, Art. 73 Abs. 2 der Verordnung 1 zum Arbeitsgesetz, ArGV 1).")
    ]);

    var dreizehn;
    if (stunde) dreizehn = "Der Anteil 13. Monatslohn beträgt 8,33 % der Summe aus Stundengrundlohn, Ferienzuschlag und Feiertagszuschlag und wird mit dem Lohn jedes Monats ausbezahlt; dies ist die Absprache nach Art. 18.2 GAV. Einen gesonderten 13. Monatslohn gibt es nicht.";
    else if (o.dreizehnter === "monatlich") dreizehn = "Der 13. Monatslohn nach dem Vertragsblatt beträgt 100 % des durchschnittlichen Monatslohns des Kalenderjahres. Er wird nach Absprache monatlich mit je einem Zwölftel des Monatslohns ausgerichtet und auf der Lohnabrechnung ausgewiesen (Art. 18.1 und 18.2 GAV); bei Beginn oder Beendigung des Arbeitsverhältnisses im Lauf des Kalenderjahres ist er damit anteilsmässig ausgerichtet.";
    else dreizehn = "Der 13. Monatslohn nach dem Vertragsblatt beträgt 100 % des durchschnittlichen Monatslohns des Kalenderjahres und wird mit dem Dezemberlohn ausgerichtet (Art. 18.1 GAV). Bei Beginn oder Beendigung des Arbeitsverhältnisses im Lauf des Kalenderjahres wird er anteilsmässig ausgerichtet.";
    ziffer("lohn", "Lohn", [
      b("a", stunde
        ? "Der Arbeitnehmer erhält für jede geleistete Arbeitsstunde den Stundengrundlohn nach dem Vertragsblatt. Dazu kommen nach Art. 35.4 und Anhang 6 GAV der Ferienzuschlag (Ziff. {R:ferien.a}), der Feiertagszuschlag (Ziff. {R:ferien.feiertage}) und der Anteil 13. Monatslohn (Bst. {B:lohn.dreizehn}); die Sätze stehen im Vertragsblatt. Der Stundengrundlohn liegt nicht unter dem Mindestlohn des GAV für die Qualifikation des Arbeitnehmers, geteilt durch 174 Stunden (Art. 16.3, 17 und Anhang 5c GAV)."
        : "Der Monatslohn steht im Vertragsblatt. Er liegt nicht unter dem Mindestlohn des GAV für die Qualifikation des Arbeitnehmers (Art. 17 und Anhang 5c GAV)."),
      b("dreizehn", dreizehn),
      b("c", "Die Arbeitgeberin zahlt den Lohn am Monatsende auf das Lohnkonto nach dem Vertragsblatt (Art. 323 Abs. 1 OR). Mit jeder Zahlung erhält der Arbeitnehmer eine Lohnabrechnung über Lohn, Arbeitszeit, Vorholzeit, Überstunden, Ferien, Spesen, Lohnzuschläge, Familienzulagen und Abzüge (Art. 323b Abs. 1 OR, Art. 35.3 GAV)." + (stunde
        ? " Sie weist Stundengrundlohn, Ferienzuschlag, Feiertagszuschlag und Anteil 13. Monatslohn je mit Satz und Betrag aus" + (o.ferienlohn === "laufend" ? "." : ", dazu den Rückbehalt für das Ferienguthaben und dessen Stand.")
        : "") + " Familienzulagen richten sich nach dem Familienzulagengesetz (FamZG) und werden mit dem Lohn ausbezahlt."),
      b("zuschlag", "Für besondere Arbeitszeiten erhält der Arbeitnehmer die Lohnzuschläge nach Art. 25 GAV in Geld: Samstag 13 bis 23 Uhr 25 %, Nacht 23 bis 6 Uhr 50 %, Sonntag und Feiertage 100 %; Grundlage ist der Stundenlohn " + (stunde ? "nach Ziff. {R:lohn.a}" : "nach Art. 16.3 GAV") + ". Überzeit: Ziff. {R:zeit.ueber}."),
      b("e", "Änderungen des " + (stunde ? "Lohns" : "Monatslohns") + " richten sich nach Ziff. {R:kuend.aenderung} und {R:schluss.nachtrag}; allgemeinverbindlich erklärte Lohnanpassungen nach dem GAV bleiben vorbehalten.")
    ], "Lohn, Abzüge und Leistungen");

    ziffer("abzuege", "Abzüge vom Lohn", [
      b("a", "Vom Bruttolohn zieht die Arbeitgeberin die Arbeitnehmeranteile nach der Tabelle im Vertragsblatt ab."),
      b("b", "Die Arbeitgeberin trägt ihre gesetzlichen und gesamtarbeitsvertraglichen Arbeitgeberanteile und Beiträge (AHV/IV/EO mit dem Verwaltungskostenbeitrag der Ausgleichskasse, ALV, Beitrag an die Familienausgleichskasse, Berufsunfallversicherung, " + (ktgHalb ? "hälftige Prämie" : "ganze Prämie") + " der Krankentaggeldversicherung, berufliche Vorsorge, Weiterbildungs- und Vollzugskostenbeitrag)."),
      b("c", "Die als provisorisch bezeichneten Abzüge ersetzt ein Nachtrag durch die definitiven, sobald " + (ktgHalb
        ? "die Einreihung durch den Unfallversicherer, die Police der Krankentaggeldversicherung der Arbeitgeberin und der Anschlussvertrag ihrer Vorsorgeeinrichtung vorliegen"
        : "die Einreihung durch den Unfallversicherer und der Anschlussvertrag der Vorsorgeeinrichtung der Arbeitgeberin vorliegen") +
        "; er braucht keinen Beschluss der Gesellschafterversammlung, solange der Lohn gleich bleibt (Ziff. {R:schluss.nachtrag}). Ein definitiver Abzug gilt bis zur nächsten Änderung durch den Versicherer oder die Vorsorgeeinrichtung. Die Arbeitgeberin teilt die definitiven Abzüge innert eines Monats schriftlich mit (Art. 19 Abs. 2 Bst. e AVG).")
    ]);

    ziffer("spesen", "Spesen", [
      b("a", "Liegt die Baustelle mehr als 15 Minuten Wegzeit vom Sitz des Einsatzbetriebs entfernt, erhält der Arbeitnehmer je Arbeitstag den Ersatz der Mehrkosten für die Verpflegung nach dem Vertragsblatt (Art. 33.1 GAV). Bei Arbeit ohne Heimkehr am Abend trägt die Arbeitgeberin Unterkunft und Verpflegung nach Art. 33.2 GAV. Fahrten und Verpflegung am Sitz des Einsatzbetriebs sind keine Spesen."),
      b("b", "Benützt der Arbeitnehmer mit ausdrücklichem Einverständnis der Arbeitgeberin sein privates Auto für Geschäftsfahrten, erhält er die Kilometerentschädigung nach dem Vertragsblatt (Art. 34.1 GAV)."),
      b("c", "Weitere notwendige Auslagen ersetzt die Arbeitgeberin gegen Beleg (Art. 327a Abs. 1 OR). Spesen sind kein Lohn.")
    ]);

    var feiertage = o.kanton === "BE"
      ? "die Feiertage nach Art. 30 GAV am Sitz der Arbeitgeberin im Kanton Bern: Neujahr, Berchtoldstag, Karfreitag, Ostermontag, Auffahrt, Pfingstmontag, Bundesfeiertag, Weihnachten und Stephanstag, soweit sie auf einen Tag von Montag bis Freitag fallen"
      : "die neun Feiertage, die Art. 30 GAV nach dem Recht des Kantons " + VW.kantonName(o.kanton) + " am Sitz der Arbeitgeberin bestimmt, soweit sie auf einen Tag von Montag bis Freitag fallen";
    ziffer("ferien", "Ferien und Feiertage", [
      b("a", (o.ferien === "mehr"
        ? "Der Ferienanspruch je Kalenderjahr steht im Vertragsblatt; er liegt über dem Anspruch nach Art. 29.1 und 29.3 GAV."
        : "Der Ferienanspruch je Kalenderjahr steht im Vertragsblatt (Art. 29.1 und 29.3 GAV).") +
        " Bei Beginn oder Beendigung des Arbeitsverhältnisses im Lauf des Kalenderjahres besteht er anteilsmässig. Der Arbeitnehmer bezieht die Ferien nach Vereinbarung mit der Arbeitgeberin und mit Rücksicht auf die laufenden Einsätze, mindestens zwei Wochen zusammenhängend (Art. 329c Abs. 1 OR). Feiertage in den Ferien zählen nicht als Ferien (Art. 31.2 GAV); bei ärztlich bescheinigter Arbeitsunfähigkeit in den Ferien gilt Art. 29.4 GAV. " +
        (!stunde
          ? "Während des Arbeitsverhältnisses werden die Ferien nicht in Geld abgegolten (Art. 329d Abs. 2 OR)."
          : o.ferienlohn === "laufend"
            ? "Der Ferienlohn wird als Ferienzuschlag nach dem Vertragsblatt mit dem laufenden Lohn ausbezahlt und auf jeder Lohnabrechnung mit Satz und Betrag ausgewiesen; beim Bezug der Ferien wird kein weiterer Lohn bezahlt."
            : "Der Ferienzuschlag nach dem Vertragsblatt gehört zum Bruttolohn des Monats, von dem die Abzüge nach Ziff. {R:abzuege.a} berechnet werden. Mit dem laufenden Lohn wird er nicht ausbezahlt (Art. 329d Abs. 2 OR): Die Arbeitgeberin behält ihn nach den Abzügen zurück und schreibt ihn einem Ferienguthaben gut. Bezieht der Arbeitnehmer Ferien, zahlt sie mit dem Lohn des Monats den Teil des Ferienguthabens aus, der den bezogenen Ferientagen im Verhältnis zu den noch offenen Ferientagen entspricht. Bei Ende des Arbeitsverhältnisses zahlt sie das restliche Ferienguthaben aus, soweit die Ferien bis dahin nicht bezogen werden können.")),
      b("b", "Ferien und andere geplante Absenzen teilt der Arbeitnehmer der Arbeitgeberin so früh mit, dass sie die Frist des jeweiligen Verleihvertrags gegenüber dem Einsatzbetrieb einhalten kann."),
      b("feiertage", (stunde
        ? "Massgebend sind " + feiertage + ". Die Feiertagsentschädigung wird als Feiertagszuschlag nach Anhang 6 GAV für die Zahl dieser Feiertage im Kalenderjahr mit dem Lohn jedes Monats ausbezahlt (Art. 31.5 GAV); der Satz für das erste Jahr steht im Vertragsblatt, für jedes folgende Jahr gilt der Satz nach derselben Regel."
        : "Bezahlt sind " + feiertage + ".") +
        " Liegt der Einsatzbetrieb in einem anderen Kanton, sind dessen gesetzliche Feiertage mindestens nach dessen Recht bezahlt.")
    ]);

    ziffer("verh", "Verhinderung des Arbeitnehmers", [
      b("a", "Krankheit: Die Arbeitgeberin versichert den Arbeitnehmer für ein Krankentaggeld; die Versicherungsbedingungen entsprechen Art. 38 GAV. Die Versicherung zahlt ein Taggeld von 80 % des Lohns nach der Police, mindestens während 720 Tagen innert 900 aufeinanderfolgenden Tagen (Art. 37.1 und 38.1 GAV); " +
        (ktgHalb ? "die Prämie tragen die Parteien je zur Hälfte." : "die Prämie trägt die Arbeitgeberin.") +
        " Während der Aufschubzeit der Versicherung zahlt die Arbeitgeberin 80 % des Lohns; der erste Krankheitstag ist Karenztag und wird nicht bezahlt. Solange keine Versicherung besteht, zahlt die Arbeitgeberin 80 % des Lohns als Lohnfortzahlung" +
        (ktgHalb ? ", und der Abzug nach dem Vertragsblatt entfällt." : ".") +
        " Ab dem dritten Krankheitstag legt der Arbeitnehmer ein Arztzeugnis vor. Diese Regelung tritt an die Stelle der gesetzlichen Lohnfortzahlung (Art. 324a Abs. 4 OR)."),
      b("b", "Unfall: Der Arbeitnehmer ist nach dem Unfallversicherungsgesetz (UVG) gegen Berufs- und Nichtberufsunfälle versichert. Die Prämie für Berufsunfälle trägt die Arbeitgeberin, die Prämie für Nichtberufsunfälle der Arbeitnehmer (Vertragsblatt). Für den Unfalltag und die zwei folgenden Tage zahlt die Arbeitgeberin 80 % des Lohns (Art. 39.2 GAV); danach treten die Leistungen des Unfallversicherers an die Stelle des Lohns (Art. 324b Abs. 1 und 3 OR, Art. 16 Abs. 2 UVG)."),
      b("c", "Militärdienst, Zivildienst und Zivilschutz sowie bezahlte Absenzen richten sich nach Art. 32.1 und 40 GAV, im Übrigen nach Art. 324a und 324b OR und dem Erwerbsersatzgesetz (EOG). Mutterschaftsurlaub (Art. 329f OR, EOG), Urlaub des andern Elternteils (Vaterschaftsurlaub; Art. 329g OR, nach Art. 32.1 GAV zehn Werktage zu 100 %) und Betreuungsurlaub (Art. 329h und 329i OR) richten sich nach dem Gesetz."),
      b("d", "Der Arbeitnehmer teilt der Arbeitgeberin eine Verhinderung, auch durch höhere Gewalt, und ihre voraussichtliche Dauer unverzüglich mit. Die Arbeitgeberin teilt dem Einsatzbetrieb Verhinderung und Dauer mit, den Grund nur nach Ziff. {R:geheim.weitere}; das Arztzeugnis erhält nur die Arbeitgeberin.")
    ]);

    ziffer("vorsorge", "Berufliche Vorsorge", [
      b("a", "Der Arbeitnehmer ist ab dem Beginn des Arbeitsverhältnisses bei der Vorsorgeeinrichtung der Arbeitgeberin für die Risiken Alter, Tod und Invalidität versichert (Bundesgesetz über die berufliche Vorsorge, BVG). Er anerkennt deren Reglement und Vorsorgeplan. Die Beiträge richten sich nach dem Reglement der Vorsorgeeinrichtung; der Beitrag der Arbeitgeberin ist mindestens gleich hoch wie der des Arbeitnehmers (Art. 66 Abs. 1 BVG). Der Arbeitnehmeranteil steht im Vertragsblatt.")
    ]);

    var verlust = "Geht Werkzeug beim Einsatzbetrieb verloren oder wird es beschädigt, macht die Arbeitgeberin die Ansprüche aus dem jeweiligen Verleihvertrag für den Arbeitnehmer geltend und leitet Erhaltenes an ihn weiter.";
    var auslagen = "Notwendige Auslagen, die bei der Arbeit entstehen, ersetzt die Arbeitgeberin gegen Beleg (Art. 327a OR).";
    ziffer("mittel", "Betriebsmittel, Werkzeug und Arbeitssicherheit", [
      inventar && b("a", "Die Arbeitgeberin stellt die Betriebsmittel, die in ihrem Betriebsmittel-Inventar stehen (Art. 327 Abs. 1 OR); sie versichert sie und trägt Instandhaltung und Ersatz (Prüfung und Kalibrierung: Ziff. {R:mittel.pruefung}). Das Inventar ist die Liste der Arbeitgeberin über ihre Betriebsmittel; sie führt es und teilt dem Arbeitnehmer Änderungen mit; es ist nicht Beilage dieses Vertrags. Der Arbeitnehmer behandelt die Betriebsmittel sorgfältig und teilt Schäden unverzüglich mit; Rückgabe nach Ziff. {R:kuend.rueckgabe}. Für Schäden an ihnen gilt Ziff. {Z:haftung}."),
      b("werkzeug", inventar
        ? "Sein persönliches Handwerkzeug einschliesslich seiner Messgeräte (Werkzeug) stellt der Arbeitnehmer der Arbeitgeberin zur Verfügung, soweit es nicht im Betriebsmittel-Inventar steht; für das Zurverfügungstellen verzichtet er auf eine Entschädigung nach Art. 327 Abs. 2 OR. " + auslagen + " " + verlust
        : "Der Arbeitnehmer stellt der Arbeitgeberin sein Handwerkzeug, sein Elektrowerkzeug und seine Messgeräte (Werkzeug) zur Verfügung; es bleibt sein Eigentum. " +
          (o.werkzeug === "entsch" ? "Dafür erhält er die Werkzeugentschädigung nach dem Vertragsblatt (Art. 327 Abs. 2 OR)." : "Für das Zurverfügungstellen verzichtet er auf eine Entschädigung nach Art. 327 Abs. 2 OR.") +
          " Er behandelt das Werkzeug sorgfältig. " + auslagen + " " + verlust),
      inventar && b("privat", "Betriebsmittel benützt der Arbeitnehmer privat nur im üblichen Rahmen."),
      b("grund", "Die persönliche Grundausrüstung (Helm, Sicherheitsschuhe, Schutzbrille, Gehörschutz, Schutzhandschuhe) und die Arbeitskleidung stellt die Arbeitgeberin auf ihre Kosten (Art. 5 und 90 VUV); der Arbeitnehmer bringt sie auf die Baustelle mit. Die einsatzbezogene Schutzausrüstung, Material, Grossgeräte, Gerüste und Hebemittel stellt der Einsatzbetrieb (Art. 10 VUV, jeweiliger Verleihvertrag)."),
      b("pruefung", "Die Arbeitgeberin sorgt für Instandhaltung, Prüfung und Kalibrierung " + (inventar ? "der Betriebsmittel und des Werkzeugs" : "des Werkzeugs") + " nach Art. 32b VUV und trägt die Kosten. Der Arbeitnehmer führt die Prüfung nach ihrem Prüfplan durch, prüft jedes Gerät vor Gebrauch auf Sicht und teilt Mängel unverzüglich mit."),
      b("gefahr", "Der Arbeitnehmer trägt die Schutzausrüstung, hält die Sicherheitsvorschriften ein und stoppt bei Gefahr die betroffene Arbeit; er teilt das unverzüglich dem Einsatzbetrieb und der Arbeitgeberin mit.")
    ], "Ausrüstung, Pflichten und Haftung");

    ziffer("geheim", "Geheimhaltung und Datenschutz", [
      b("a", "Der Arbeitnehmer wahrt die Geschäftsgeheimnisse der Arbeitgeberin und der Einsatzbetriebe, auch nach der Beendigung des Arbeitsverhältnisses, soweit es berechtigte Interessen erfordern (Art. 321a Abs. 4 OR). Pläne, Preise, Kunden und Baustellen eines Einsatzbetriebs sowie Zugangscodes gibt er nicht an Dritte weiter, auch nicht an andere Einsatzbetriebe; ausgenommen ist, was Gesetz oder Behörden verlangen oder die Abwicklung eines Einsatzes erfordert. Baustellenfotos veröffentlicht er und Referenzen nennt er nur mit Zustimmung des Einsatzbetriebs."),
      b("b", "Die Arbeitgeberin bearbeitet Personendaten des Arbeitnehmers, soweit sie seine Eignung für das Arbeitsverhältnis betreffen oder zur Durchführung dieses Vertrags erforderlich sind (Art. 328b OR, Datenschutzgesetz, DSG). Der Arbeitnehmer stimmt zu, dass die Arbeitgeberin Einsatzbetrieben seine Qualifikation, seine Ausbildungsnachweise und die Angaben bekannt gibt, die der Einsatz erfordert (Art. 47 AVV). Er kann die Zustimmung jederzeit widerrufen."),
      b("weitere", "Weitere Bekanntgaben, namentlich den Grund einer Verhinderung, Auskünfte an künftige Arbeitgeber und Referenzen, macht die Arbeitgeberin nur bei gesetzlicher Pflicht oder mit Zustimmung des Arbeitnehmers im Einzelfall."),
      b("d", "Nach der Beendigung des Arbeitsverhältnisses bewahrt die Arbeitgeberin auf, was Gesetz, Arbeitszeugnis oder ein Rechtsstreit verlangen; weitere Personendaten behält sie nur mit Zustimmung des Arbeitnehmers.")
    ]);

    ziffer("gav", "Gesamtarbeitsvertrag und Treuepflicht", [
      b("a", "Der Arbeitnehmer hat den GAV eingesehen; dieser Vertrag nimmt ihn in der jeweils gültigen Fassung in Bezug. Untersteht ein Einsatzbetrieb diesem oder einem anderen allgemeinverbindlich erklärten Gesamtarbeitsvertrag, gewährt die Arbeitgeberin dem Arbeitnehmer dessen Lohn- und Arbeitszeitbestimmungen (Art. 20 Abs. 1 AVG, Art. 48a AVV), soweit sie günstiger sind als dieser Vertrag, und leistet den Weiterbildungs- und Vollzugskostenbeitrag anteilsmässig nach der Dauer des Einsatzes (Art. 20 Abs. 1 AVG, Art. 48b Abs. 1 AVV). Der Arbeitnehmer erteilt den paritätischen Organen des GAV Auskunft."),
      b("b", "Ein Konkurrenzverbot nach Art. 340 ff. OR wird nicht vereinbart; die Pflichten des Arbeitnehmers als Geschäftsführer und Gesellschafter (Art. 812 Abs. 3 OR, Statuten der Arbeitgeberin)" +
        " bleiben unberührt. Es gilt das Verbot der Schwarzarbeit nach Art. 14.3.1 GAV, im Übrigen bleibt seine Treuepflicht vorbehalten (Art. 321a Abs. 1 und 3 OR).")
    ]);

    ziffer("haftung", "Haftung des Arbeitnehmers", [
      b("a", "Der Arbeitnehmer haftet der Arbeitgeberin für Schaden, den er ihr absichtlich oder fahrlässig zufügt (Art. 321e OR)."),
      b("b", "Ob und wieweit der Einsatzbetrieb Schäden trägt, die der Arbeitnehmer bei der Arbeit beim Einsatzbetrieb oder bei Dritten verursacht, richtet sich nach dem jeweiligen Verleihvertrag. Soweit dieser eine Schadloshaltung vorsieht, macht die Arbeitgeberin sie für den Arbeitnehmer geltend, wenn er sie nicht selbst geltend macht (Art. 112 OR).")
    ]);

    var probe = o.probezeit === 1
      ? "Der erste Monat ist Probezeit; während der Probezeit kann jede Partei das Arbeitsverhältnis jederzeit mit einer Frist von sieben Tagen kündigen (Art. 335b Abs. 1 OR)."
      : o.probezeit === 3
        ? "Die Probezeit beträgt drei Monate (Art. 335b Abs. 2 OR); während der Probezeit kann jede Partei das Arbeitsverhältnis jederzeit mit einer Frist von sieben Tagen kündigen (Art. 335b Abs. 1 OR)."
        : "Es wird keine Probezeit vereinbart (Art. 335b Abs. 2 OR).";
    var nach = o.probezeit ? "Nach Ablauf der Probezeit kann jede Partei" : "Jede Partei kann";
    var km = kuendMonate(o);
    var frist = o.kuendigung === "fest"
      ? nach + " das Arbeitsverhältnis mit einer Frist von " + (km === 1 ? "einem Monat" : VW.zahlwort(km) + " Monaten") + " kündigen, je auf das Ende eines Monats (Art. 335c Abs. 2 OR, Art. 45.1 GAV)."
      : nach + " das Arbeitsverhältnis mit einer Frist von einem Monat im ersten Dienstjahr, von zwei Monaten im zweiten bis und mit dem neunten Dienstjahr und von drei Monaten ab dem zehnten Dienstjahr kündigen, je auf das Ende eines Monats (Art. 335c Abs. 1 OR).";
    ziffer("kuend", "Dauer, Kündigung und Übertritt", [
      b("beginn", "Das Arbeitsverhältnis beginnt an dem im Vertragsblatt genannten Tag und ist unbefristet. " + probe),
      b("frist", frist + " Die Sperrfristen nach Art. 336c OR bleiben vorbehalten."),
      b("c", "Die Kündigung erfolgt schriftlich, mit eingeschriebenem Brief oder durch Übergabe gegen Empfangsbestätigung."),
      b("aenderung", "Änderungen von Beschäftigungsgrad oder Lohn, namentlich wenn die Arbeitgeberin ihre Verleihtätigkeit vorübergehend nicht ausübt, erfolgen durch Nachtrag nach Ziff. {R:schluss.nachtrag} oder durch Änderungskündigung unter Einhaltung der Kündigungsfrist."),
      b("uebertritt", "Nach Beendigung des Arbeitsverhältnisses kann der Arbeitnehmer in ein direktes Arbeitsverhältnis mit dem Einsatzbetrieb übertreten (Art. 19 Abs. 5 Bst. b AVG)."),
      b("rueckgabe", "Bei Beendigung gibt der Arbeitnehmer Unterlagen, Schlüssel und Betriebsmittel der Arbeitgeberin zurück (Art. 339a OR); Schlüssel, Badges und Unterlagen eines Einsatzbetriebs gibt er diesem am Ende des Einsatzes zurück. Die Arbeitgeberin weist ihn bei der Beendigung schriftlich auf den Übergang in die Einzelversicherung des Krankentaggelds (Art. 38.5 GAV), die Abredeversicherung nach UVG und die Nachdeckung der beruflichen Vorsorge hin.")
    ], "Dauer und Schluss");

    ziffer("schluss", "Schlussbestimmungen", [
      b("nachtrag", "Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform (Art. 12 und 16 OR); Nachträge werden fortlaufend nummeriert. Ändert ein Nachtrag den Lohn, braucht er einen Beschluss der Gesellschafterversammlung (Art. 804 Abs. 2 Ziff. 6 OR)."),
      b("b", "Es gilt schweizerisches Recht, namentlich OR, AVG mit AVV und ArG."),
      b("c", "Für Streitigkeiten aus diesem Vertrag sind die Gerichte am Wohnsitz oder Sitz der beklagten Partei oder am Ort, an dem der Arbeitnehmer gewöhnlich die Arbeit verrichtet, zuständig (Art. 34 Abs. 1 der Zivilprozessordnung, ZPO); für Klagen des Arbeitnehmers, die sich auf das AVG stützen, zudem das Gericht am Ort der Geschäftsniederlassung der Arbeitgeberin (Art. 34 Abs. 2 ZPO). Der Arbeitnehmer kann auf diese Gerichtsstände nicht zum Voraus verzichten (Art. 35 Abs. 1 Bst. d ZPO)."),
      b("d", "Dieser Vertrag wird in zwei Exemplaren ausgefertigt; je eines bleibt bei der Arbeitgeberin und beim Arbeitnehmer. Beilage: Protokoll der Gesellschafterversammlung (Ziff. {R:gegenstand.b}).")
    ]);
    return Z;
  }

  var V = {art: "av", GRUND: GRUND, modell: modell, vorschauId: "vertrag-av", erlTitel: "Arbeitsvertrag"};
  VW.vertraege.av = V;
  function $(id) { return document.getElementById(id); }

  V.auswahl = function () {
    var radio = VW.radio, z = VW.zahl;
    return {
      lohnform: radio("av-lohnform") || "monat",
      ferienlohn: radio("av-ferienlohn") || "angespart",
      jahr: parseInt(VW.wert("av-beginn").slice(0, 4), 10) || new Date().getFullYear(),
      dreizehnter: radio("av-dreizehnter") || "dezember",
      wochenstunden: radio("av-wochen") === "andere" ? Math.min(40, Math.max(1, Math.round(z("av-wochenstunden", 40) * 2) / 2)) : 40,
      ferien: radio("av-ferien") || "gav", ferienTage: Math.min(40, Math.max(28, Math.round(z("av-ferien-tage", 30)))),
      werkzeug: radio("av-werkzeug") || "inventar", ktg: radio("av-ktg") || "haelftig",
      probezeit: parseInt(radio("av-probezeit") || "0", 10),
      kuendigung: radio("av-kuendigung") || "gesetz", kuendMonate: Math.min(6, Math.max(1, Math.round(z("av-kuend-monate", 3)))),
      kanton: $("av-kanton") && $("av-kanton").value ? $("av-kanton").value : "BE"
    };
  };
  var FELDER = ["av-firma", "av-adresse", "av-vertreten", "av-name", "av-geboren", "av-wohnadresse", "av-quali", "av-ahv",
    "av-art", "av-beginn", "av-lohn", "av-grundlohn", "av-iban", "av-spesen", "av-km", "av-wz-entsch",
    "av-abz-ahv", "av-abz-alv", "av-abz-nbu", "av-abz-ktg", "av-abz-bvg", "av-abz-vk"];
  V.felder = function () {
    var f = {};
    FELDER.forEach(function (id) { f[id] = VW.wert(id); });
    return f;
  };
  V.ansichtFelder = function (o) {
    var stunde = o.lohnform === "stunde";
    VW.zeige($("av-frage-dreizehnter"), !stunde); VW.zeige($("av-frage-ferienlohn"), stunde);
    VW.zeige($("zeile-av-lohn"), !stunde); VW.zeige($("zeile-av-grundlohn"), stunde);
    VW.zeige($("zeile-av-wz"), o.werkzeug === "entsch");
    VW.zeige($("zeile-av-abz-ktg"), o.ktg !== "arbeitgeberin");
  };
  V.dateiname = function (f) { return "arbeitsvertrag" + (f["av-name"] ? "_" + VW.dateiteil(f["av-name"]) : "") + ".pdf"; };

  /* Texte des Vertragsblatts, auch für die Erläuterungen */
  function ferienText(o) {
    var t = ferienTage(o);
    return t[0] + " Werktage je Kalenderjahr" + (t[1] > t[0] ? "; ab dem Kalenderjahr, in dem der Arbeitnehmer das 50. Altersjahr vollendet, " + t[1] : "");
  }
  function rund(x) { return Math.round(x * 100) / 100; }
  /* Stundenlohn nach Anhang 6 GAV: Beträge je Stunde, auf Rappen gerundet wie in der Lohnabrechnung */
  function stundenlohnRechnung(o, grund) {
    if (grund === null) return null;
    var fe = rund(grund * FERIEN_PROZ[ferienTage(o)[0]] / 100), fei = rund(grund * feiertagSatz(o) / 100);
    var dr = rund((grund + fe + fei) * DREIZEHN_PROZ / 100), tot = rund(grund + fe + fei + dr);
    return {grund: grund, ferien: fe, feiertage: fei, dreizehn: dr, total: tot,
      ausbezahlt: o.ferienlohn === "laufend" ? tot : rund(tot - fe)};
  }
  function ferienZuschlagText(o, sl) {
    var t = ferienTage(o);
    return proz(FERIEN_PROZ[t[0]]) + (sl ? " (" + chf(sl.ferien) + ")" : "") + (t[1] > t[0] ? ", ab 50. Altersjahr " + proz(FERIEN_PROZ[t[1]]) : "") +
      (o.ferienlohn === "laufend" ? "; laufend ausbezahlt" : "; ins Ferienguthaben");
  }
  function feiertagText(o) {
    var n = feiertageImJahr(o);
    return n === null
      ? "nach Anhang 6 GAV je Feiertag auf einem Werktag (neun: " + proz(FEIERTAGE_PROZ[9]) + ")"
      : proz(FEIERTAGE_PROZ[n]) + " im Jahr " + o.jahr + " (" + VW.zahlwort(n) + " Feiertage auf Werktagen)";
  }
  function kuendText(o) {
    var km = kuendMonate(o);
    return o.kuendigung === "fest"
      ? (km === 1 ? "ein Monat" : VW.zahlwort(km) + " Monate") + ", auf das Ende eines Monats"
      : "ein bis drei Monate je nach Dienstjahr, auf das Ende eines Monats";
  }

  /* ---------- PDF ---------- */

  V.pdf = function (JsPDF, o, f, gez, zahlen, mitErl) {
    var P = VW.pdfNeu(JsPDF), d = P.d, stunde = o.lohnform === "stunde";
    f = f || {};
    function zif(id) { for (var i = 0; i < gez.length; i++) if (gez[i].id === id) return gez[i]; return null; }
    function ref(zid, pid) { var z = zif(zid); if (!z) return ""; for (var i = 0; i < z.abs.length; i++) if (z.abs[i].id === pid) return "Ziff. " + z.nr + (z.abs[i].bst ? " " + z.abs[i].bst : ""); return "Ziff. " + z.nr; }
    var LX = 44, ZH = 4.0;
    function abschnitt(t, zusatz) {
      P.platz(12);
      P.y += 1.6; P.schrift("bold", 10); P.farbe(P.INK); d.text(t, P.x, P.y);
      if (zusatz) { var w = d.getTextWidth(t); P.schrift("normal", 7.5); P.farbe(P.GRAU); d.text(zusatz, P.x + w + 2.5, P.y); }
      P.y += 1.5; d.setDrawColor(P.INK[0], P.INK[1], P.INK[2]); d.setLineWidth(0.35); d.line(P.x, P.y, P.rechts, P.y); P.y += 4.2;
    }
    /* Zeile des Blatts: Bezeichnung, Wert mit Verweis; leer = Linie, der Verweis steht dann klein am Ende */
    function zeile(label, wert, verweis) {
      var txt = wert ? wert + (verweis ? " (" + verweis + ")" : "") : "";
      P.schrift("normal", 9.5);
      var zl = txt ? d.splitTextToSize(txt, P.B - LX) : [""];
      var h = zl.length * ZH + 1.8;
      P.platz(h);
      P.schrift("normal", 9); P.farbe(P.GRAU); d.text(label, P.x, P.y);
      if (txt) { P.schrift("normal", 9.5); P.farbe(P.INK); d.text(zl, P.x + LX, P.y); }
      else if (verweis) { P.schrift("normal", 7); P.farbe(P.GRAU); d.text(verweis, P.rechts, P.y, {align: "right"}); }
      var ly = P.y + (zl.length - 1) * ZH + 1.4;
      d.setDrawColor(P.LINIE[0], P.LINIE[1], P.LINIE[2]); d.setLineWidth(0.25); d.line(P.x + LX, ly, P.rechts, ly);
      P.y += h;
    }
    function oder(w) { return betrag(w) !== null ? chf(w) : (w || "CHF ________"); }

    P.titel("Arbeitsvertrag", null, "Einzelarbeitsvertrag nach dem Obligationenrecht (OR, Art. 319 ff.) für den Personalverleih nach dem Arbeitsvermittlungsgesetz (AVG, SR 823.11) in der Form der Leiharbeit; Vertrag zwischen der Gesellschaft und der Person, die sie vertritt (Art. 718b in Verbindung mit Art. 814 Abs. 4 OR). Vertragsblatt und Vertragsbedingungen regeln zusammen die Punkte nach Art. 19 Abs. 2 AVG. GAV ist der Gesamtarbeitsvertrag der Schweizerischen Elektrobranche.");

    abschnitt("Arbeitgeberin");
    zeile("Firma", f["av-firma"]);
    zeile("Adresse", f["av-adresse"]);
    zeile("Vertreten durch", f["av-vertreten"]);

    abschnitt("Arbeitnehmer");
    var gb = VW.datum(f["av-geboren"]);
    zeile("Name", f["av-name"] ? f["av-name"] + (gb ? ", geboren am " + gb : "") : (gb ? "geboren am " + gb : ""));
    zeile("Adresse", f["av-wohnadresse"]);
    zeile("Qualifikation", f["av-quali"], ref("art", "a"));
    zeile("AHV-Nummer", f["av-ahv"]);

    abschnitt("Anstellung");
    zeile("Art der Arbeit", f["av-art"], ref("art", "a"));
    zeile("Arbeitsort", "Sitz des Einsatzbetriebs und seine Baustellen nach dem jeweiligen Verleihvertrag", ref("einsatz", "ort"));
    zeile("Beginn", VW.datum(f["av-beginn"]), ref("kuend", "beginn"));
    zeile("Dauer und Probezeit", "unbefristet; " + (o.probezeit === 1 ? "Probezeit ein Monat" : o.probezeit === 3 ? "Probezeit drei Monate" : "keine Probezeit"), ref("kuend", "beginn"));
    zeile("Arbeitszeit", String(o.wochenstunden).replace(".", ",") + " Stunden je Woche (Beschäftigungsgrad " + grad(o) + " %); Stunden je Wochentag nach dem jeweiligen Verleihvertrag", ref("zeit", "a"));
    zeile("Kündigungsfrist", kuendText(o), ref("kuend", "frist"));
    zeile("Ferien", ferienText(o), ref("ferien", "a"));

    abschnitt("Lohn");
    if (stunde) {
      var sl = stundenlohnRechnung(o, betrag(f["av-grundlohn"]));
      zeile("Stundengrundlohn", sl ? chf(sl.grund) + " je Stunde; mit den Zuschlägen " + chf(sl.total) : f["av-grundlohn"], ref("lohn", "a"));
      zeile("Ferienzuschlag", ferienZuschlagText(o, sl), ref("ferien", "a"));
      zeile("Feiertagszuschlag", feiertagText(o), ref("ferien", "feiertage"));
      zeile("13. Monatslohn", proz(DREIZEHN_PROZ) + " auf Grundlohn und Zuschläge", ref("lohn", "dreizehn"));
    } else {
      zeile("Monatslohn brutto", betrag(f["av-lohn"]) !== null ? chf(f["av-lohn"]) : f["av-lohn"], ref("lohn", "a"));
      zeile("13. Monatslohn", o.dreizehnter === "monatlich" ? "100 % des durchschnittlichen Monatslohns, monatlich zu einem Zwölftel" : "100 % des durchschnittlichen Monatslohns, mit dem Dezemberlohn", ref("lohn", "dreizehn"));
    }
    zeile("Zahltag", "am Monatsende", ref("lohn", "c"));
    zeile("Lohnkonto (IBAN)", f["av-iban"]);
    zeile("Spesen", "Verpflegung " + oder(f["av-spesen"]) + " je Arbeitstag (" + ref("spesen", "a") + "); Auto " + oder(f["av-km"]) + " je Kilometer (" + ref("spesen", "b") + ")");
    if (o.werkzeug === "entsch") zeile("Werkzeugentschädigung", f["av-wz-entsch"] ? oder(f["av-wz-entsch"]) + " je Monat" : "", ref("mittel", "werkzeug"));

    abschnitt("Abzüge vom Bruttolohn", "Arbeitnehmeranteile, Stand 2026; provisorische Abzüge ersetzt ein Nachtrag (" + ref("abzuege", "c") + ")");
    var zeilen = [
      ["AHV/IV/EO", f["av-abz-ahv"], "Art. 5 Abs. 1 AHVG, Art. 3 Abs. 1 IVG, Art. 27 Abs. 2 EOG"],
      ["Arbeitslosenversicherung (ALV)", f["av-abz-alv"], "Art. 3 Abs. 2 AVIG, bis zum Höchstbetrag des versicherten Verdienstes"],
      ["Nichtberufsunfallversicherung (NBU)", f["av-abz-nbu"], "Art. 91 Abs. 2 und 3 UVG, Art. 39.4 GAV"],
      o.ktg === "arbeitgeberin"
        ? ["Krankentaggeld (KTG)", "kein Abzug, die Prämie trägt die Arbeitgeberin", ref("verh", "a")]
        : ["Krankentaggeld (KTG), hälftig", f["av-abz-ktg"], "Art. 37.2 und 37.3 GAV"],
      ["Berufliche Vorsorge (BVG)", f["av-abz-bvg"], "Art. 66 Abs. 1 und 3 BVG"],
      ["Weiterbildungs- und Vollzugskostenbeitrag GAV", f["av-abz-vk"], "Art. 48b AVV, Art. 11 GAV; für Einsätze in Betrieben, die dem GAV unterstehen (" + ref("gav", "a") + ")"]
    ];
    P.tabelle([{t: "Abzug", b: 31}, {t: "Arbeitnehmeranteil", b: 21}, {t: "Grundlage", b: 48}], zeilen, 8.3);

    P.platz(8); P.y += 2;
    P.schrift("bold", 9.5); P.farbe(P.INK);
    d.text("Die Vertragsbedingungen (Ziff. 1 bis " + gez.length + ") und die Unterschriften folgen auf dieses Vertragsblatt.", P.x, P.y);
    V.blattSeiten = d.getNumberOfPages();

    P.spalten(gez, {titel: "Vertragsbedingungen zum Arbeitsvertrag",
      schluss: "Mit ihrer Unterschrift bestätigen die Parteien das Vertragsblatt und diese Vertragsbedingungen (Ziff. 1 bis " + gez.length + ") als Bestandteile dieses Vertrags. Jede Partei erhält ein unterzeichnetes Exemplar (" + ref("schluss", "d") + ").",
      parteien: [["Arbeitgeberin", f["av-firma"]], ["Arbeitnehmer", f["av-name"]]]});

    if (mitErl) P.spalten(VW.erlaeutert("av", o, f, gez, zahlen), {titel: "Erläuterungen zum Arbeitsvertrag", erl: true});
    P.fuss("Arbeitsvertrag" + (f["av-name"] ? " · " + f["av-name"] : ""));
    return d;
  };

  /* ---------- Erläuterungen ---------- */

  var FL = {OR: "27/317_321_377", AVG: "1991/392_392_392", AVV: "1991/408_408_408", ArG: "1966/57_57_57",
    ArGV1: "2000/243", VUV: "1983/1968_1968_1968", UVG: "1982/1676_1676_1676", BVG: "1983/797_797_797", NIV: "2002/22"};
  /* Quelle mit fedlex-Verweis; art wie "335_c" für Art. 335c */
  function q(t, g, art) { return {t: t, url: "https://www.fedlex.admin.ch/eli/cc/" + FL[g] + "/de" + (art ? "#art_" + art : "")}; }
  function gav(t) { return {t: t}; }
  function bge(ref) {
    return {t: "BGE " + ref, url: "https://www.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F" +
      ref.replace(/ /g, "-") + "%3Ade&lang=de&type=show_document"};
  }

  var E = VW.ERL.av = VW.ERL.av || {};

  E._vorspann = function () {
    return [
      "Der Arbeitsvertrag regelt das Verhältnis zwischen der Firma und ihrem Inhaber, der bei ihr angestellt ist und von ihr an Einsatzbetriebe verliehen wird. Er ist ein Einzelarbeitsvertrag nach Art. 319 ff. OR und zugleich ein Leiharbeitsvertrag nach Art. 19 AVG. Dieser verlangt die schriftliche Form und nennt die Punkte, die der Vertrag regeln muss: Art der Arbeit, Arbeitsort und Beginn des Einsatzes, Dauer oder Kündigungsfrist, Arbeitszeiten, Lohn, Spesen, Zulagen und Abzüge, die Leistungen bei Überstunden, Krankheit, Mutterschaft, Unfall, Militärdienst und Ferien sowie die Termine der Auszahlung.",
      "Jeder Wert steht einmal, im Vertragsblatt; die Ziffern der Vertragsbedingungen sagen \"nach dem Vertragsblatt\". Was je Einsatz wechselt, steht im Verleihvertrag, den der Arbeitnehmer in Kopie erhält (Ziff. {R:einsatz.a}).",
      {quellen: [q("Art. 19 AVG", "AVG", "19"), q("Art. 319 OR", "OR", "319")]}
    ];
  };

  E.gegenstand = function (o) {
    return [
      "Die Firma stellt ihren Inhaber an, um ihn zu verleihen; der Einsatzbetrieb gibt die Weisungen. Das ist Personalverleih in der Form der Leiharbeit: Das Arbeitsverhältnis besteht unabhängig von den einzelnen Einsätzen und läuft auch zwischen zwei Einsätzen weiter. Verleiht die Firma ausschliesslich ihren Inhaber, braucht sie keine Bewilligung (Art. 28 Abs. 2 AVV).",
      "Die Rangordnung in Bst. {B:gegenstand.c} setzt den allgemeinverbindlich erklärten Gesamtarbeitsvertrag über Vertragsblatt und Vertragsbedingungen, soweit der Vertrag nicht günstiger ist. Über Art. 20 AVG gelten dessen Lohn- und Arbeitszeitbestimmungen auch für den Verleih (Ziff. {R:gav.a}).",
      "Werktage sind Montag bis Freitag ohne die " + (o.kanton === "BE" ? "Feiertage nach dem bernischen Feiertagsgesetz (FRG, BSG 555.1)" : "öffentlichen Feiertage des Kantons " + VW.kantonName(o.kanton)) + ". Ferien und bezahlte Absenzen werden in Werktagen gezählt; so meint das Wort hier dasselbe wie im Verleihvertrag (Ziff. {R@vv:gegenstand.e}).",
      {quellen: [q("Art. 12 AVG", "AVG", "12"), q("Art. 20 AVG", "AVG", "20"), q("Art. 27 AVV", "AVV", "27"), q("Art. 28 AVV", "AVV", "28")]}
    ];
  };

  E.stellung = function (o) {
    return [
      "Der Inhaber steht auf beiden Seiten des Vertrags: Als Geschäftsführer vertritt er die GmbH, als Arbeitnehmer ist er ihr Vertragspartner. Ein solcher Vertrag muss schriftlich abgefasst werden (Art. 718b OR, für die GmbH über Art. 814 Abs. 4 OR). Die Entschädigung der Geschäftsführer setzt die Gesellschafterversammlung fest (Art. 804 Abs. 2 Ziff. 6 OR); ihr Beschluss liegt dem Vertrag als Protokoll bei (Ziff. {R:gegenstand.b}).",
      "Bst. {B:stellung.organ} trennt die beiden Rollen: Die Führung der Gesellschaft ist Organtätigkeit ausserhalb der Arbeitszeit und nicht Teil des Lohns; auf der Baustelle gelten die Weisungen des Einsatzbetriebs. Der Verleihvertrag sagt dasselbe aus der Sicht des Einsatzbetriebs (Ziff. {R@vv:weisung.gf}).",
      {beispiel: "Die Amtsdauer als Geschäftsführer läuft nach den Statuten ab und wird nicht erneuert. Der Arbeitsvertrag läuft weiter; er endet nur durch Kündigung nach Ziff. {Z:kuend}."},
      {quellen: [q("Art. 718b OR", "OR", "718_b"), q("Art. 804 OR", "OR", "804"), q("Art. 814 OR", "OR", "814"), q("Art. 815 OR", "OR", "815")]}
    ];
  };

  E.art = function (o, f) {
    return [
      "Qualifikation und Art der Arbeit stehen im Vertragsblatt" + (f && f["av-quali"] ? " (hier: " + f["av-quali"] + ")" : "") + "; was der einzelne Einsatz verlangt, steht im Verleihvertrag.",
      "Der Arbeitnehmer arbeitet unter der Installationsbewilligung des Einsatzbetriebs, der ihn nach Art. 10b NIV einbindet und die technische Aufsicht ausübt. Schlusskontrolle und Sicherheitsnachweis bleiben darum beim Einsatzbetrieb; der Verleihvertrag sagt dasselbe (Ziff. {R@vv:weisung.b}).",
      {quellen: [q("Art. 10b NIV", "NIV", "10_b")]}
    ];
  };

  E.einsatz = function () {
    return [
      "Was je Einsatz wechselt (Einsatzbetrieb, Art der Arbeit, Arbeitsort, Beginn, Dauer, Stunden je Wochentag), steht im Verleihvertrag. Die Kopie, die der Arbeitnehmer vor dem Einsatz erhält, ergänzt den Arbeitsvertrag um diese Angaben nach Art. 19 Abs. 2 Bst. a bis d AVG.",
      "Das Weisungsrecht über die Ausführung der Arbeit liegt beim Einsatzbetrieb (Art. 26 AVV), ebenso die Verantwortung für Arbeitssicherheit am Arbeitsort (Art. 10 VUV). Arbeitgeberin bleibt die Firma.",
      {beispiel: "Vor dem ersten Arbeitstag bei einem neuen Einsatzbetrieb legt die Arbeitgeberin die Kopie des unterzeichneten Verleihvertrags zu den Personalakten und vermerkt das Datum der Übergabe."},
      {quellen: [q("Art. 19 AVG", "AVG", "19"), q("Art. 26 AVV", "AVV", "26"), q("Art. 321d OR", "OR", "321_d"), q("Art. 10 VUV", "VUV", "10")]}
    ];
  };

  E.zeit = function (o) {
    var w = o.wochenstunden;
    return [
      "Die wöchentliche Arbeitszeit beträgt nach dem Vertragsblatt " + String(w).replace(".", ",") + " Stunden" +
        (w === 40 ? ", wie die normale Arbeitszeit nach Art. 20.2 GAV." : ", weniger als die normale Arbeitszeit von 40 Stunden nach Art. 20.2 GAV (Beschäftigungsgrad " + grad(o) + " %). Die Jahresbruttoarbeitszeit sinkt im selben Verhältnis.") +
        " Für 2026 nennt Anhang 5c GAV eine Jahresbruttoarbeitszeit von 2088 Stunden bei 40 Stunden je Woche" + (w < 40 ? "; hier also rund " + Math.round(2088 * w / 40) + " Stunden." : "."),
      "Überstunden zählt der GAV über das Jahr gegen die Jahresbruttoarbeitszeit (Art. 21 GAV). Überzeit sind Stunden über der wöchentlichen Höchstarbeitszeit von 50 Stunden (Art. 9 ArG, Art. 22 GAV).",
      "Zeit ohne Einsatz trägt die Arbeitgeberin: Kann sie keinen Einsatz zuweisen, schuldet sie den Lohn trotzdem (Art. 324 OR), und die Stunden gelten als geleistet (Bst. {B:zeit.ohne}).",
      {beispiel: "Der Einsatzbetrieb schickt den Arbeitnehmer um 14 Uhr heim, weil Material fehlt. Die restlichen Stunden des Tages gelten als geleistet, der Lohn bleibt gleich. Ob der Einsatzbetrieb diese Stunden bezahlt, regelt der Verleihvertrag (Ziff. {R@vv:ausfall.ausfall})."},
      {quellen: [q("Art. 9 ArG", "ArG", "9"), q("Art. 324 OR", "OR", "324"), gav("Art. 20 bis 22, 27 und 28 GAV, Anhang 5c")]}
    ];
  };

  E.rapport = function () {
    return [
      "Der Wochenrapport ist Grundlage für die Rechnung an den Einsatzbetrieb und für den Lohn. Aus Rapporten, Absenzen und Feiertagen entsteht die monatliche Zusammenstellung nach Art. 20.6 GAV mit dem Stand der Jahresbruttoarbeitszeit. Das Verzeichnis der Arbeitszeit wird mindestens fünf Jahre aufbewahrt.",
      {quellen: [q("Art. 46 ArG", "ArG", "46"), q("Art. 73 ArGV 1", "ArGV1", "73"), gav("Art. 20.6 GAV")]}
    ];
  };

  E.lohn = function (o, f) {
    f = f || {};
    var aus = [];
    if (o.lohnform === "stunde") {
      var g = betrag(f["av-grundlohn"]), bsp = g === null ? 40 : g, r = stundenlohnRechnung(o, bsp), t = ferienTage(o)[0];
      var nf = feiertageImJahr(o), ang = o.ferienlohn !== "laufend";
      aus.push("Gewählt ist der Stundenlohn. Der GAV sieht ihn für Einzelfälle vor (Art. 35.4 GAV); im Personalverleih ist er üblich. Zum Stundengrundlohn kommen drei Zuschläge nach Anhang 6 GAV: für die Ferien, für die Feiertage und der Anteil 13. Monatslohn. Vertrag und jede Lohnabrechnung weisen sie mit Satz und Betrag aus.");
      aus.push({tabelle: {kopf: ["Bestandteil", "Satz", "Auszahlung"], zeilen: [
        ["Stundengrundlohn", g === null ? "nach dem Vertragsblatt" : chf(g), "monatlich"],
        ["Ferienzuschlag (" + t + " Werktage)", proz(FERIEN_PROZ[t]), ang ? "beim Bezug der Ferien" : "monatlich"],
        ["Feiertagszuschlag (" + (nf === null ? "Feiertage auf Werktagen" : zahl(nf) + " Feiertage auf Werktagen " + o.jahr) + ")", proz(feiertagSatz(o)), "monatlich"],
        ["13. Monatslohn, auf Grundlohn und beide Zuschläge", proz(DREIZEHN_PROZ), "monatlich"]]}});
      aus.push("Der Feiertagszuschlag wechselt mit dem Kalender. Der GAV bezahlt neun Feiertage, aber nur, wenn sie auf einen Arbeitstag fallen (Art. 30.1 GAV); fallen der Bundesfeiertag oder der Stephanstag auf einen Samstag, sinkt der Satz nach der Tabelle in Anhang 6 GAV. 2026 sind es im Kanton Bern sieben Tage und 2,77 %.");
      aus.push({beispiel: "Stundengrundlohn " + chf(bsp) + ": Ferienzuschlag " + chf(r.ferien) + ", Feiertagszuschlag " + chf(r.feiertage) + ", Anteil 13. Monatslohn " + chf(r.dreizehn) + ", zusammen " + chf(r.total) + " je Stunde. " +
        (ang ? "Davon gehen " + chf(r.ferien) + " ins Ferienguthaben, " + chf(r.ausbezahlt) + " werden mit dem Monatslohn ausbezahlt, jeweils vor den Abzügen." : "Alles wird mit dem Monatslohn ausbezahlt.")});
    } else {
      aus.push("Gewählt ist der Monatslohn. Er bleibt gleich, auch wenn die Stunden je Woche schwanken (Art. 35.2 GAV). Der Mindestlohn richtet sich nach der Qualifikation; für Elektroinstallateure EFZ nennt Anhang 5c GAV für 2026 CHF 4'500 je Monat nach dem EFZ und CHF 5'000 nach einem vollen Jahr Branchenerfahrung.");
      aus.push(o.dreizehnter === "monatlich"
        ? "Der 13. Monatslohn wird monatlich zu einem Zwölftel ausbezahlt; das lässt Art. 18.2 GAV nach Absprache zu. Die Lohnabrechnung weist ihn getrennt aus."
        : "Der 13. Monatslohn beträgt 100 % des durchschnittlichen Monatslohns und wird mit dem Dezemberlohn ausbezahlt, in einem Jahr mit Beginn oder Ende anteilsmässig (Art. 18 GAV).");
      var ml = betrag(f["av-lohn"]);
      aus.push({beispiel: ml !== null
        ? "Monatslohn " + chf(ml) + "; bei Beginn am 1. Juli beträgt der 13. Monatslohn im ersten Jahr sechs Zwölftel, also " + chf(ml / 2) + "."
        : "Beginnt das Arbeitsverhältnis am 1. Juli, beträgt der 13. Monatslohn im ersten Jahr sechs Zwölftel des durchschnittlichen Monatslohns."});
    }
    aus.push("Lohnzuschläge für Samstag, Nacht, Sonntag und Feiertage zahlt die Arbeitgeberin in Geld (Art. 25 GAV), unabhängig davon, wie der Verleihvertrag sie dem Einsatzbetrieb verrechnet.");
    aus.push({quellen: [q("Art. 323 OR", "OR", "323"), q("Art. 323b OR", "OR", "323_b"), gav("Art. 16, 17, 18, 25 und 35 GAV, Anhang 5c und 6")]});
    return aus;
  };

  E.abzuege = function (o) {
    return [
      "Die Tabelle im Vertragsblatt nennt die Arbeitnehmeranteile mit ihrer Grundlage. Stand 2026 betragen sie für AHV/IV/EO 5,3 % und für die ALV 1,1 % des Bruttolohns. Die Prämie der Nichtberufsunfallversicherung trägt nach Art. 39.4 GAV der Arbeitnehmer; ihr Satz ergibt sich aus der Einreihung durch den Unfallversicherer. Der Weiterbildungs- und Vollzugskostenbeitrag beträgt nach Anhang 5c GAV CHF 21.00 je Monat (CHF 11.00 Vollzug, CHF 10.00 Weiterbildung).",
      o.ktg === "arbeitgeberin"
        ? "Gewählt ist, dass die Arbeitgeberin die Prämie der Krankentaggeldversicherung ganz trägt. Der GAV teilt sie je zur Hälfte (Art. 37.2 GAV); die Wahl ist für den Arbeitnehmer günstiger, und der Abzug fällt weg."
        : "Die Prämie der Krankentaggeldversicherung tragen die Parteien je zur Hälfte (Art. 37.2 GAV); der Satz steht in der Police.",
      {hinweis: "Fehlen beim Abschluss Police, Einreihung oder Anschlussvertrag, trägt das Blatt einen provisorischen Satz; ein Nachtrag ersetzt ihn (Bst. {B:abzuege.c})."},
      {quellen: [q("Art. 19 AVG", "AVG", "19"), q("Art. 48b AVV", "AVV", "48_b"), q("Art. 91 UVG", "UVG", "91"), q("Art. 66 BVG", "BVG", "66"), gav("Art. 11, 37 und 39 GAV, Anhang 5c")]}
    ];
  };

  E.spesen = function (o, f) {
    f = f || {};
    var v = betrag(f["av-spesen"]) !== null ? chf(f["av-spesen"]) : "CHF 18.00";
    return [
      "Der GAV verlangt mindestens CHF 18.00 je Tag für die Mehrkosten der Verpflegung, wenn die Baustelle mehr als 15 Minuten vom Sitz des Einsatzbetriebs entfernt liegt (Art. 33.1 GAV), und CHF 0.60 je Kilometer für das private Auto (Art. 34.1 GAV). Die Beträge stehen im Vertragsblatt.",
      {beispiel: "Die Baustelle liegt 25 Minuten vom Sitz des Einsatzbetriebs entfernt. Der Arbeitnehmer erhält je Arbeitstag " + v + " für die Verpflegung."},
      {quellen: [q("Art. 327a OR", "OR", "327_a"), gav("Art. 33 und 34 GAV")]}
    ];
  };

  E.ferien = function (o) {
    var t = ferienTage(o);
    return [
      o.ferien === "mehr"
        ? "Gewählt sind " + t[0] + " Werktage Ferien je Kalenderjahr" + (t[1] > t[0] ? ", ab dem 50. Altersjahr " + t[1] : "") + ", mehr als der GAV verlangt (27 Werktage, ab dem 50. Altersjahr 30; Art. 29.1 GAV)."
        : "Der GAV gibt 27 Werktage Ferien je Kalenderjahr, ab dem 50. Altersjahr 30 (Art. 29.1 GAV). Die höhere Stufe gilt ab dem Kalenderjahr, in dem das Altersjahr erfüllt wird (Art. 29.3 GAV).",
      o.lohnform !== "stunde"
        ? "Während des Arbeitsverhältnisses dürfen Ferien nicht in Geld abgegolten werden (Art. 329d Abs. 2 OR)."
        : o.ferienlohn === "laufend"
          ? "Gewählt ist, den Ferienzuschlag von " + proz(FERIEN_PROZ[t[0]]) + " mit jedem Lohn auszuzahlen; in den Ferien selbst fliesst dann kein Lohn. Das Gesetz verbietet, Ferien während des Arbeitsverhältnisses in Geld abzugelten (Art. 329d Abs. 2 OR). Das Bundesgericht lässt die laufende Auszahlung nur ausnahmsweise zu: bei unregelmässiger Beschäftigung, mit dem Satz im schriftlichen Vertrag und mit dem Betrag auf jeder Lohnabrechnung (BGE 129 III 493 E. 3.2 und 3.3). Bei voller Beschäftigung bei derselben Arbeitgeberin ist die Ausnahme ausgeschlossen (BGE 149 III 202 E. 2.2.3). Fehlt eine Voraussetzung, ist der Ferienlohn ein zweites Mal geschuldet. Die Wahl passt darum nur zu kurzen oder sehr unregelmässigen Einsätzen."
          : "Beim Stundenlohn wird der Ferienzuschlag von " + proz(FERIEN_PROZ[t[0]]) + " jeden Monat einem Ferienguthaben gutgeschrieben und erst beim Bezug der Ferien ausbezahlt. So halten es auch die Temporärfirmen bei längeren Einsätzen: Der Zuschlag zählt zum Bruttolohn, auf dem AHV und die übrigen Abzüge berechnet werden; danach wird er als Rückbehalt abgezogen. Das Ferienguthaben ist also ein Nettobetrag, beim Bezug fallen keine Abzüge mehr an. Den Ferienzuschlag mit jedem Lohn auszuzahlen, wäre bei voller Beschäftigung bei derselben Arbeitgeberin unzulässig (Art. 329d Abs. 2 OR; BGE 149 III 202 E. 2.2.3).",
      "Bezahlt sind neun Feiertage nach dem Recht am Sitz der Arbeitgeberin" + (o.kanton === "BE" ? " im Kanton Bern" : ", hier im Kanton " + VW.kantonName(o.kanton)) + ", soweit sie auf einen Arbeitstag fallen (Art. 30 GAV). Ferien meldet der Arbeitnehmer früh genug, denn der Verleihvertrag verlangt eine Frist gegenüber dem Einsatzbetrieb (Ziff. {R@vv:verh.c}).",
      {beispiel: "Wer im März 50 wird, hat schon im ganzen Kalenderjahr Anspruch auf " + t[1] + " Werktage."},
      {quellen: [q("Art. 329c OR", "OR", "329_c"), q("Art. 329d OR", "OR", "329_d"), gav("Art. 29 bis 31 GAV, Anhang 6")].concat(o.lohnform === "stunde" ? [bge("129 III 493"), bge("149 III 202")] : [])}
    ];
  };

  E.verh = function (o) {
    return [
      "Der GAV verpflichtet die Arbeitgeberin, ein Krankentaggeld von 80 % zu versichern, mindestens während 720 Tagen innert 900 Tagen (Art. 37.1 und 38.1 GAV). Während einer Aufschubzeit zahlt die Arbeitgeberin selbst 80 % des Lohns; der erste Krankheitstag ist Karenztag (Art. 37.7 GAV). " +
        (o.ktg === "arbeitgeberin" ? "Die Prämie trägt nach der Wahl die Arbeitgeberin ganz." : "Die Prämie tragen die Parteien je zur Hälfte (Art. 37.2 GAV)."),
      "Beim Unfall zahlt die Arbeitgeberin für den Unfalltag und die zwei folgenden Tage 80 % des Lohns (Art. 39.2 GAV); danach zahlt der Unfallversicherer.",
      "Dem Einsatzbetrieb teilt die Arbeitgeberin nur Verhinderung und Dauer mit; der Verleihvertrag regelt, dass für diese Tage nichts in Rechnung gestellt wird (Ziff. {R@vv:verh.a}).",
      {beispiel: "Krank ab Montag, Arztzeugnis ab Mittwoch: Der Montag ist Karenztag und wird nicht bezahlt; ab Dienstag zahlt die Arbeitgeberin während der Aufschubzeit 80 % des Lohns."},
      {quellen: [q("Art. 324a OR", "OR", "324_a"), q("Art. 324b OR", "OR", "324_b"), q("Art. 16 UVG", "UVG", "16"), gav("Art. 32, 37 bis 40 GAV")]}
    ];
  };

  E.vorsorge = function () {
    return [
      "Die Beiträge an die berufliche Vorsorge richten sich nach dem Reglement der Vorsorgeeinrichtung; die Arbeitgeberin zahlt mindestens gleich viel wie der Arbeitnehmer (Art. 66 Abs. 1 BVG). Der Arbeitnehmeranteil steht in der Tabelle des Vertragsblatts.",
      {quellen: [q("Art. 66 BVG", "BVG", "66")]}
    ];
  };

  E.mittel = function (o) {
    var aus = [];
    if (o.werkzeug === "inventar") aus.push("Gewählt ist, dass die Arbeitgeberin die Betriebsmittel stellt, die in ihrem Inventar stehen; das ist die Regel des Gesetzes (Art. 327 Abs. 1 OR). Das persönliche Handwerkzeug stellt der Arbeitnehmer zur Verfügung und verzichtet auf eine Entschädigung, was Art. 327 Abs. 2 OR zulässt.");
    else if (o.werkzeug === "entsch") aus.push("Gewählt ist, dass der Arbeitnehmer sein ganzes Werkzeug zur Verfügung stellt und dafür die Werkzeugentschädigung nach dem Vertragsblatt erhält. Ohne Abrede wäre er angemessen zu entschädigen (Art. 327 Abs. 2 OR); der Betrag im Blatt legt die Entschädigung fest.");
    else aus.push("Gewählt ist, dass der Arbeitnehmer sein ganzes Werkzeug zur Verfügung stellt, ohne Entschädigung. Art. 327 Abs. 2 OR lässt diese Abrede zu; ohne sie wäre er angemessen zu entschädigen.");
    aus.push("Die persönliche Grundausrüstung bezahlt die Arbeitgeberin (Art. 5 und 90 VUV), die einsatzbezogene Schutzausrüstung stellt der Einsatzbetrieb. Im Verleihvertrag steht, was der Arbeitnehmer mitbringt (Ziff. {R@vv:sicher.werkzeug}).");
    aus.push({beispiel: "Auf einer Baustelle wird eine Bohrmaschine des Arbeitnehmers gestohlen. Die Arbeitgeberin macht die Ansprüche aus dem Verleihvertrag geltend und leitet das Erhaltene an den Arbeitnehmer weiter."});
    aus.push({quellen: [q("Art. 327 OR", "OR", "327"), q("Art. 327a OR", "OR", "327_a"), q("Art. 32b VUV", "VUV", "32_b"), q("Art. 90 VUV", "VUV", "90")]});
    return aus;
  };

  E.geheim = function () {
    return [
      "Die Arbeitgeberin gibt Einsatzbetrieben nur bekannt, was der Einsatz erfordert; dafür braucht es die Zustimmung des Arbeitnehmers (Art. 47 AVV), die er jederzeit widerrufen kann. Den Grund einer Verhinderung erfährt der Einsatzbetrieb nur mit Zustimmung im Einzelfall.",
      {quellen: [q("Art. 321a OR", "OR", "321_a"), q("Art. 328b OR", "OR", "328_b"), q("Art. 47 AVV", "AVV", "47")]}
    ];
  };

  E.gav = function (o) {
    return [
      "Untersteht der Einsatzbetrieb einem allgemeinverbindlich erklärten Gesamtarbeitsvertrag, muss die Arbeitgeberin dessen Lohn- und Arbeitszeitbestimmungen einhalten (Art. 20 Abs. 1 AVG); welche das sind, zählt Art. 48a AVV auf. Der Weiterbildungs- und Vollzugskostenbeitrag ist ab dem ersten Arbeitstag geschuldet (Art. 48b AVV).",
      "Ein Konkurrenzverbot gibt es nicht. Als Geschäftsführer darf der Inhaber ohnehin keine konkurrenzierende Tätigkeit ausüben, soweit Statuten oder Gesellschafter nichts anderes zulassen (Art. 812 Abs. 3 OR).",
      {quellen: [q("Art. 20 AVG", "AVG", "20"), q("Art. 48a AVV", "AVV", "48_a"), q("Art. 48b AVV", "AVV", "48_b"), q("Art. 812 OR", "OR", "812")]}
    ];
  };

  E.haftung = function () {
    return [
      "Gegenüber der Arbeitgeberin haftet der Arbeitnehmer nach Gesetz für Schaden, den er absichtlich oder fahrlässig verursacht (Art. 321e OR).",
      "Schäden beim Einsatzbetrieb und bei Dritten regelt der Verleihvertrag: Der Einsatzbetrieb trägt sie und hält Verleiher und Arbeitnehmer schadlos, ausser bei Absicht oder grober Fahrlässigkeit (Ziff. {R@vv:haft.schaden}). Der Arbeitnehmer kann die Schadloshaltung selbst geltend machen; sonst tut es die Arbeitgeberin für ihn (Art. 112 OR).",
      {quellen: [q("Art. 112 OR", "OR", "112"), q("Art. 321e OR", "OR", "321_e")]}
    ];
  };

  E.kuend = function (o) {
    var aus = [];
    aus.push(o.probezeit === 0
      ? "Gewählt ist keine Probezeit. Ohne schriftliche Abrede gälte der erste Monat als Probezeit (Art. 335b Abs. 1 OR)."
      : "Gewählt ist eine Probezeit von " + (o.probezeit === 1 ? "einem Monat, wie im Gesetz" : "drei Monaten, dem Höchstmass nach Art. 335b Abs. 2 OR") + ". In der Probezeit gilt eine Kündigungsfrist von sieben Tagen; fällt Arbeit wegen Krankheit oder Unfall aus, verlängert sich die Probezeit entsprechend (Art. 335b Abs. 1 und 3 OR).");
    if (o.kuendigung === "fest") {
      var n = kuendMonate(o);
      aus.push("Gewählt ist eine feste Frist von " + (n === 1 ? "einem Monat" : VW.zahlwort(n) + " Monaten") + " in jedem Dienstjahr. Eine schriftliche Abrede darf die Fristen des Gesetzes ändern, aber nicht unter einen Monat senken (Art. 335c Abs. 2 OR, Art. 45.1 GAV).");
      aus.push({beispiel: "Die Kündigung geht am 10. März zu. Das Arbeitsverhältnis endet am Ende des Monats " + MONATE[(2 + n) % 12] + "."});
    } else {
      aus.push("Es gelten die Fristen des Gesetzes: ein Monat im ersten Dienstjahr, zwei Monate im zweiten bis neunten, drei Monate ab dem zehnten, je auf das Ende eines Monats (Art. 335c Abs. 1 OR). Die kurzen Fristen der Temporärarbeit nach Art. 19 Abs. 4 AVG gelten bei der Leiharbeit nicht (Art. 49 AVV).");
      aus.push({beispiel: "Die Kündigung geht im dritten Dienstjahr am 10. März zu. Die Frist beträgt zwei Monate auf das Ende eines Monats; das Arbeitsverhältnis endet am 31. Mai."});
    }
    aus.push("Der Übertritt zum Einsatzbetrieb nach dem Ende des Arbeitsverhältnisses darf nicht verhindert werden (Art. 19 Abs. 5 Bst. b AVG); der Verleihvertrag regelt ihn aus der Sicht des Einsatzbetriebs (Ziff. {R@vv:kuend.uebertritt}).");
    aus.push({quellen: [q("Art. 335b OR", "OR", "335_b"), q("Art. 335c OR", "OR", "335_c"), q("Art. 336c OR", "OR", "336_c"), q("Art. 19 AVG", "AVG", "19"), q("Art. 49 AVV", "AVV", "49"), gav("Art. 43 bis 45 GAV")]});
    return aus;
  };

  E.schluss = function (o) {
    return [
      "Änderungen brauchen die Schriftform, weil schon der Vertrag sie braucht (Art. 19 Abs. 1 AVG, Art. 718b OR). Ändert ein Nachtrag den Lohn, entscheidet die Gesellschafterversammlung (Art. 804 Abs. 2 Ziff. 6 OR).",
      "Den Gerichtsstand im Arbeitsrecht bestimmt die Zivilprozessordnung; der Arbeitnehmer kann nicht zum Voraus darauf verzichten (Art. 34 und 35 ZPO).",
      {quellen: [q("Art. 12 OR", "OR", "12"), q("Art. 16 OR", "OR", "16"), q("Art. 718b OR", "OR", "718_b"), {t: "Art. 34 und 35 ZPO"}]}
    ];
  };
})(typeof window !== "undefined" ? window : globalThis);
