/* Vertragswerk: Verleihvertrag für den Selbstverleih (Einsatzblatt und Vertragsbedingungen).
   Die Auswahl unter A steuert den Text der Vertragsbedingungen, das Einsatzblatt unter B die
   Felder der ersten Seite. Alles läuft im Browser: kein Speichern, keine Cookies, keine Abfragen.
   Das PDF entsteht mit jsPDF (lokal in vendor/), immer neutral.

   Aufbau des Vertragstexts: modell(o) liefert die Ziffern mit ihren Buchstaben als Liste; was eine
   Variante weglässt, fällt dort heraus. Ziffern und Buchstaben werden erst danach gezählt, und die
   Verweise im Text sind Marken, die beim Zählen aufgelöst werden:
   {Z:ziffer} = Nummer der Ziffer, {B:ziffer.buchstabe} = Buchstabe, {R:ziffer.buchstabe} = beides
   ("7 a"). So stimmen die Verweise auch, wenn eine Variante einen Buchstaben weglässt. */
(function () {
  "use strict";

  var KANTONE = [["AG", "Aargau"], ["AI", "Appenzell Innerrhoden"], ["AR", "Appenzell Ausserrhoden"], ["BE", "Bern"],
    ["BL", "Basel-Landschaft"], ["BS", "Basel-Stadt"], ["FR", "Freiburg"], ["GE", "Genf"], ["GL", "Glarus"],
    ["GR", "Graubünden"], ["JU", "Jura"], ["LU", "Luzern"], ["NE", "Neuenburg"], ["NW", "Nidwalden"], ["OW", "Obwalden"],
    ["SG", "St. Gallen"], ["SH", "Schaffhausen"], ["SO", "Solothurn"], ["SZ", "Schwyz"], ["TG", "Thurgau"], ["TI", "Tessin"],
    ["UR", "Uri"], ["VD", "Waadt"], ["VS", "Wallis"], ["ZG", "Zug"], ["ZH", "Zürich"]];
  var ORDINAL = {1: "ersten", 2: "zweiten", 3: "dritten", 4: "vierten", 5: "fünften"};

  /* Grundfassung: die Vorwahl der Seite; Abweichungen davon werden in der Ansicht hinterlegt */
  var GRUND = {absage: 2, kuendigung: 2, rechnung: "woche", zahlfrist: 30, mahn: [10, 20], verrechnung: true,
    zurueck: true, mwst: true, rabatt: false, tagesmin: true, zu: {sa: 25, na: 50, so: 100, ue: 25},
    rayon: "karte", rayonMin: 30, selbst: true, bewilligung: "frei", werkzeug: true, uebertritt: "frei",
    kanton: "BE", gericht: "verleiher", gerichtOrt: ""};

  function chf(n) { return "CHF " + String(n); }
  function kantonName(k) { for (var i = 0; i < KANTONE.length; i++) if (KANTONE[i][0] === k) return KANTONE[i][1]; return k; }

  /* ---------- Vertragstext ---------- */

  function modell(o) {
    var tm = o.tagesmin;
    var zuTeile = [];
    if (o.zu.sa > 0) zuTeile.push("Samstag 13 bis 23 Uhr " + o.zu.sa + " %");
    if (o.zu.na > 0) zuTeile.push("Nacht 23 bis 6 Uhr " + o.zu.na + " %");
    if (o.zu.so > 0) zuTeile.push("Sonntag und Feiertage " + o.zu.so + " %");
    if (o.zu.ue > 0) zuTeile.push("Überzeit nach dem ArG " + o.zu.ue + " %");
    var zu = zuTeile.length > 0;
    var besondere = o.zu.sa > 0 || o.zu.na > 0 || o.zu.so > 0;
    var stundenTag = tm ? "das Tagesminimum des Wochentags (Ziff. {R:tm.min})" : "die Stunden je Wochentag nach dem Einsatzblatt für diesen Tag";

    var Z = [];
    function ziffer(id, titel, abs) { Z.push({id: id, titel: titel, abs: abs.filter(Boolean)}); }
    function b(id) { return {id: id, t: Array.prototype.slice.call(arguments, 1)}; }

    ziffer("gegenstand", "Gegenstand und Vertragsteile", [
      b("a", "Der Verleiher verleiht dem Einsatzbetrieb gegen Bezahlung der Kosten des Verleihs (Ziff. {Z:kosten}) den im Einsatzblatt genannten verliehenen Arbeitnehmer (nachfolgend Arbeitnehmer) im Personalverleih nach AVG (SR 823.11). Er schuldet weder ein Werk noch die Besorgung eines Auftrags."),
      b("b", "Der Verleihvertrag besteht aus dem Einsatzblatt und diesen Vertragsbedingungen."),
      b("c", "Bei Widerspruch gilt diese Rangordnung: zwingendes Recht; die nach Art. 20 AVG massgebenden Bestimmungen des Gesamtarbeitsvertrags der Schweizerischen Elektrobranche (GAV); Einsatzblatt; Vertragsbedingungen; im Übrigen das Gesetz."),
      b("d", "Allgemeine Geschäftsbedingungen des Einsatzbetriebs gelten nur, soweit das Einsatzblatt oder ein Zusatz zum Verleihvertrag sie mit Titel und Fassung ausdrücklich übernimmt. Ein Verweis in einer Bestellung oder Auftragsbestätigung genügt nicht."),
      b("e", "Arbeitstag ist jeder Tag, an dem der Arbeitnehmer beim Einsatzbetrieb arbeitet. Werktag ist Montag bis Freitag ohne die " +
        (o.kanton === "BE" ? "Feiertage nach Art. 2 des Gesetzes über die Ruhe an öffentlichen Feiertagen des Kantons Bern (BSG 555.1)."
          : "öffentlichen Feiertage des Kantons " + kantonName(o.kanton) + "."))
    ]);

    ziffer("an", "Arbeitnehmer und Qualifikation", [
      b("a", "Der Verleiher verleiht nur den im Einsatzblatt genannten Arbeitnehmer. Er verleiht keinen anderen Arbeitnehmer an Stelle des genannten."),
      b("qual", "Der Verleiher steht dafür ein, dass der Arbeitnehmer die im Einsatzblatt genannte Qualifikation hat."),
      b("c", "Verlangt die Art der Arbeit Kenntnisse oder Ausbildungsnachweise über diese Qualifikation hinaus (Anforderungsprofil), nennt der Einsatzbetrieb sie, bevor die Parteien den Verleihvertrag unterzeichnen; sie stehen im Einsatzblatt."),
      b("d", "Ausbildungsnachweise legt der Arbeitnehmer auf Verlangen vor. Kopien behält der Einsatzbetrieb nur so lange, wie er sie als Nachweis braucht.")
    ]);

    ziffer("weisung", "Weisungsrecht und Einbindung", [
      b("a", "Der Einsatzbetrieb hat das Weisungsrecht über die Ausführung der Arbeit im Rahmen der Art der Arbeit. Er bindet den Arbeitnehmer in seine Arbeitsorganisation ein. Arbeitgeber bleibt der Verleiher."),
      b("b", "Installationsarbeiten führt der Arbeitnehmer unter der Installationsbewilligung des Einsatzbetriebs aus, der ihn nach Art. 10b NIV einbindet und über diese Arbeiten die technische Aufsicht ausübt. Schlusskontrolle und Sicherheitsnachweis macht der Einsatzbetrieb durch seine fachkundigen oder kontrollberechtigten Personen."),
      o.selbst && b("gf", "Der Arbeitnehmer ist zugleich Geschäftsführer des Verleihers. Während der Arbeit handelt er als Arbeitnehmer nach den Weisungen des Einsatzbetriebs; als Geschäftsführer handelt er nur bei Erklärungen zu diesem Vertrag."),
      b("d", "Der Einsatzbetrieb verleiht den Arbeitnehmer nicht weiter und räumt keinem Dritten ein Weisungsrecht über ihn ein (Art. 26 Abs. 3 AVV). Arbeit auf Baustellen, auf denen andere Unternehmen tätig sind, bleibt zulässig. Für Arbeit in einer Arbeitsgemeinschaft braucht es die Zustimmung des Verleihers (E-Mail genügt).")
    ]);

    ziffer("ort", "Arbeitsort, Rayon und Wegzeit", [
      b("a", "Arbeitsort sind der Sitz des Einsatzbetriebs und seine Baustellen. Ausserhalb des Rayons braucht es die Zustimmung des Verleihers (E-Mail genügt)."),
      b("rayon", (o.rayon === "karte" ? "Der Rayon steht als Karte im Einsatzblatt."
        : "Der Rayon umfasst die Orte, die vom Sitz des Einsatzbetriebs mit dem Auto in höchstens " + o.rayonMin + " Minuten Fahrzeit erreichbar sind.") +
        " Im Rayon ist die Wegzeit im Ansatz enthalten; ausserhalb wird sie als Arbeitszeit in Rechnung gestellt."),
      b("unterkunft", "Bei Arbeit ohne Heimkehr am Abend kommen die Kosten für Unterkunft und Verpflegung dazu.")
    ]);

    ziffer("zeit", "Arbeitszeit", [
      b("a", "Die Stunden je Wochentag stehen im Einsatzblatt. Der Einsatzbetrieb teilt die Arbeitszeit ein."),
      b("b", "Arbeit über die Stunden je Wochentag hinaus ordnet der Einsatzbetrieb im Rahmen von Arbeitsgesetz (ArG) und GAV an. Nachtarbeit braucht die Zustimmung des Arbeitnehmers (formlos, auch mündlich); Arbeit an Tagen, die keine Werktage sind, braucht die Bestätigung nach Ziff. {R:absage.weitere}. Bewilligungen holt der Einsatzbetrieb ein."),
      b("c", "Für die Einhaltung des ArG (wöchentliche Höchstarbeitszeit, Pausen, Ruhezeit) ist der Einsatzbetrieb verantwortlich. Pausen sind keine Arbeitszeit."),
      b("warte", "\"Fahrt zwischen Baustellen\" und \"Wartezeit während der Arbeit\" sind Arbeitszeit.")
    ]);

    var imAnsatz = ["der Lohn des Arbeitnehmers mit allen Sozialleistungen, Zulagen, Spesen und Nebenleistungen"];
    if (o.werkzeug) imAnsatz.push("sein persönliches Handwerkzeug, seine Kleingeräte und seine persönliche Grundausrüstung");
    imAnsatz.push("die Weiterbildungs- und Vollzugskosten nach dem GAV", "Verwaltungsaufwand und Gewinn des Verleihers");
    var dazu = ["die Wegzeit ausserhalb des Rayons und bei Arbeit ohne Heimkehr am Abend die Kosten für Unterkunft und Verpflegung (Ziff. {R:ort.rayon}, {B:ort.unterkunft})"];
    if (zu && tm) dazu.push("die Zuschläge und die Aufrundung auf das Tagesminimum (Ziff. {R:tm.min}, {B:tm.zuschlag})");
    else if (tm) dazu.push("die Aufrundung auf das Tagesminimum (Ziff. {R:tm.min})");
    else if (zu) dazu.push("die Zuschläge (Ziff. {R:tm.zuschlag})");
    dazu.push((tm ? "das Tagesminimum" : "die Stunden") + " später abgesagter Werktage und bei Arbeitsausfall (Ziff. {R:absage.absage}, {R:ausfall.ausfall})");
    dazu.push((o.mahn ? "die Konventionalstrafe für Mahnungen und die Kosten einer Betreibung" : "die Kosten einer Betreibung") + " (Ziff. {R:rechnung.mahnung})");

    ziffer("kosten", "Kosten des Verleihs", [
      b("a", "Der Einsatzbetrieb bezahlt für jede Stunde geleisteter Arbeitszeit den Ansatz nach dem Einsatzblatt."),
      b("b", "Im Ansatz enthalten sind:", {liste: imAnsatz}, "Die Spesen des Arbeitnehmers sind Sache des Verleihers."),
      b("c", "Zum Ansatz kommen nur dazu:", {liste: dazu}),
      o.rabatt && b("rabatt", "Ein Rabatt nach dem Einsatzblatt gilt auf den Ansatz für die geleistete Arbeitszeit, bis zum dort genannten Datum."),
      b("mwst", o.mwst ? "Zu allen Preisen kommt die Mehrwertsteuer (MWST) zum gesetzlichen Satz."
        : "Der Verleiher ist nicht mehrwertsteuerpflichtig; auf die Preise kommt keine Mehrwertsteuer (MWST)."),
      b("f", "Einen neuen Ansatz teilt der Verleiher mindestens zwei Monate im Voraus per E-Mail mit. Er gilt ab dem mitgeteilten Datum, sobald beide Parteien einen Zusatz zum Verleihvertrag unterzeichnet haben. Kommt kein Zusatz zustande, kann jede Partei den Verleihvertrag mit der Frist nach Ziff. {R:kuend.frist} kündigen, auch wenn das Einsatzblatt ein Ende des Einsatzes nennt.")
    ]);

    if (tm || zu) {
      var zuSatz = "";
      if (zu) {
        zuSatz = "Für geleistete Arbeitszeit " + (besondere && o.zu.ue > 0 ? "zu besonderen Arbeitszeiten und für Überzeit" : besondere ? "zu besonderen Arbeitszeiten" : "für Überzeit") +
          " kommt ein Zuschlag auf den Ansatz dazu: " + zuTeile.join(", ") + ".";
        if (zuTeile.length > 1) zuSatz += " Trifft mehr als ein Zuschlag zu, gilt nur der höchste.";
        if (tm) zuSatz += " Die Aufrundung auf das Tagesminimum erhält keinen Zuschlag.";
      }
      ziffer("tm", tm && zu ? "Tagesminimum und Zuschläge" : tm ? "Tagesminimum" : "Zuschläge", [
        tm && b("min", "An jedem Werktag, an dem der Arbeitnehmer arbeitet, stellt der Verleiher mindestens die Stunden je Wochentag nach dem Einsatzblatt für diesen Tag in Rechnung (Tagesminimum), auch wenn der Einsatzbetrieb den Arbeitnehmer früher heimschickt. Darüber gilt die geleistete Arbeitszeit."),
        tm && b("frueh", "Geht der Arbeitnehmer aus Gründen in seiner Person früher oder bricht der Verleiher den Arbeitstag ab, wird nur die geleistete Arbeitszeit in Rechnung gestellt. An Tagen, die keine Werktage sind, gilt kein Tagesminimum."),
        zu && b("zuschlag", zuSatz),
        tm && b("vermerk", "Abweichungen vom Tagesminimum gelten nur mit einem Vermerk des Verleihers im Wochenrapport.")
      ]);
    }

    ziffer("rapport", "Wochenrapport", [
      b("a", "Der Verleiher erfasst die geleistete Arbeitszeit je Kalenderwoche im Wochenrapport, mit Beginn, Ende und Pausen je Arbeitstag. Der Wochenrapport ist Grundlage der Rechnung."),
      b("b", "Die Kontaktperson nach dem Einsatzblatt ist ermächtigt, den Wochenrapport für den Einsatzbetrieb zu unterzeichnen und Einwendungen zu erheben. Sie unterzeichnet von Hand auf Papier oder auf dem Bildschirm."),
      b("einw", "Einwendungen sind innert fünf Werktagen nach der Unterschrift per E-Mail zu erheben; sie nennen den bestrittenen Arbeitstag und den Grund. Danach gilt der Wochenrapport als anerkannt; offensichtliche Schreib- und Rechenfehler bleiben vorbehalten. Der unbestrittene Teil der Rechnung bleibt bis zum Fälligkeitsdatum (Ziff. {R:rechnung.faellig}) zu bezahlen."),
      b("zust", "Unterzeichnet der Einsatzbetrieb nicht, stellt der Verleiher den Wochenrapport per E-Mail zu; die Frist nach Bst. {B:rapport.einw} läuft ab dem Zugang.")
    ]);

    ziffer("rechnung", "Rechnung und Zahlung", [
      b("faellig", "Der Verleiher stellt je " + (o.rechnung === "monat" ? "Kalendermonat" : "Kalenderwoche") + " Rechnung. Fälligkeitsdatum ist der " + o.zahlfrist + ". Tag nach dem Rechnungsdatum oder, wenn dieser kein Werktag ist, der nächste Werktag. Die Rechnung nennt das Fälligkeitsdatum; es ist Verfalltag."),
      b("b", "Der Rechnungsbetrag ist ohne Abzug bis zum Fälligkeitsdatum über den QR-Zahlteil der Rechnung zu bezahlen."),
      o.verrechnung && b("verrechnung", "Der Einsatzbetrieb verzichtet darauf, Forderungen des Verleihers mit Gegenforderungen zu verrechnen (Art. 126 OR). Einwendungen nach Ziff. {Z:rapport} bleiben vorbehalten."),
      b("mahnung", "Nach einer kostenlosen Zahlungserinnerung mahnt der Verleiher höchstens zweimal. " +
        (o.mahn ? "Für die Mahnung schuldet der Einsatzbetrieb " + chf(o.mahn[0]) + ", für die letzte Mahnung " + chf(o.mahn[1]) + ", als Konventionalstrafe für die verspätete Zahlung. " : "") +
        "Die Kosten einer Betreibung trägt der Einsatzbetrieb."),
      o.zurueck && b("zurueck", "Ist eine fällige Rechnung offen, kann der Verleiher nach Mitteilung per E-Mail die Arbeit an weiteren vereinbarten Tagen bis zur Zahlung zurückhalten, ohne dadurch ersatzpflichtig zu werden.")
    ]);

    ziffer("absage", "Weitere Tage, Absage und Verschiebung", [
      b("a", "Vereinbart sind die Werktage, für die das Einsatzblatt Stunden vorsieht, und die Tage, die der Verleiher nach Bst. {B:absage.weitere} bestätigt hat."),
      b("absage", "Der Einsatzbetrieb kann vereinbarte Tage absagen. Die Absage ist ohne Kosten, wenn sie dem Verleiher bis 17 Uhr am " + ORDINAL[o.absage] + " Werktag vor dem abgesagten Tag per E-Mail zugeht. Für jeden später abgesagten Werktag stellt der Verleiher " + stundenTag + " in Rechnung."),
      b("c", "Eine Absage umfasst höchstens zehn zusammenhängende Werktage. Eine längere Absage braucht die Zustimmung des Verleihers (E-Mail genügt); im Übrigen gilt Ziff. {Z:kuend}."),
      b("d", "Eine Verschiebung ist eine Absage nach Bst. {B:absage.absage}, verbunden mit einer Anfrage nach Bst. {B:absage.weitere}."),
      b("weitere", "Weitere Tage fragt der Einsatzbetrieb per E-Mail an. Sie sind vereinbart, wenn der Verleiher sie per E-Mail bestätigt."),
      b("f", "Teilt der Einsatzbetrieb vor einem vereinbarten Tag mit, dass an diesem nicht gearbeitet wird, ist das eine Absage, gleich aus welchem Grund. Hindernisse am Tag selbst regelt Ziff. {Z:ausfall}.")
    ]);

    ziffer("ausfall", "Arbeitsausfall", [
      b("ausfall", "Kann der Arbeitnehmer an einem vereinbarten Werktag wegen eines Hindernisses nicht oder nicht voll arbeiten (Arbeitsausfall), stellt der Verleiher mindestens " + stundenTag + " in Rechnung, auch ohne Verschulden des Einsatzbetriebs. Hindernis ist jeder Umstand ausser höherer Gewalt (Ziff. {Z:hg}), der weder in der Person des Arbeitnehmers noch beim Verleiher liegt, etwa fehlendes Material, Wetter oder ein Halt durch andere Unternehmen, die Bauleitung oder die Bauherrschaft."),
      b("b", "Der Einsatzbetrieb kann Ersatzarbeit zuweisen, im Rahmen der Art der Arbeit (Ziff. {R:weisung.a}) und an einem Arbeitsort nach Ziff. {Z:ort}. Die Zeit der Ersatzarbeit ist geleistete Arbeitszeit."),
      b("c", "Teilt der Einsatzbetrieb ein Hindernis vor dem Tag mit, gilt Ziff. {Z:absage}. Wartezeit regelt Ziff. {R:zeit.warte}, höhere Gewalt Ziff. {Z:hg}.")
    ]);

    ziffer("verh", "Verhinderung des Arbeitnehmers", [
      b("a", "Ist der Arbeitnehmer wegen Krankheit, Unfall oder aus einem anderen Grund in seiner Person verhindert, ruht der Einsatz. Für vereinbarte Tage, an denen er verhindert ist, stellt der Verleiher nichts in Rechnung; " +
        (tm ? "für den Tag, an dem die Verhinderung während der Arbeit eintritt, gilt Ziff. {R:tm.frueh}." : "für den Tag, an dem die Verhinderung während der Arbeit eintritt, stellt er nur die geleistete Arbeitszeit in Rechnung.") +
        " Ein Ende des Einsatzes nach dem Einsatzblatt bleibt."),
      b("b", "Der Verleiher teilt die Verhinderung und ihre voraussichtliche Dauer sofort der Kontaktperson mit (formlos, auch mündlich). Den Grund nennt er nur mit Zustimmung des Arbeitnehmers."),
      b("c", "Ferien und andere geplante Abwesenheiten des Arbeitnehmers teilt der Verleiher mindestens vier Wochen im Voraus per E-Mail mit; er nimmt dabei Rücksicht auf den Einsatzbetrieb. Diese Tage sind keine vereinbarten Tage.")
    ]);

    ziffer("hg", "Höhere Gewalt", [
      b("a", "Höhere Gewalt ist ein unvorhersehbares, aussergewöhnliches Ereignis, das von aussen kommt und sich nicht abwenden lässt, etwa Krieg, Naturkatastrophe oder Epidemie mit behördlichen Massnahmen. Gewöhnliches Wetter und andere Hindernisse nach Ziff. {R:ausfall.ausfall} sind keine höhere Gewalt."),
      b("b", "Soweit und solange höhere Gewalt die Arbeit hindert, ruht der Einsatz: Der Verleiher stellt für die betroffenen vereinbarten Tage nichts in Rechnung, und keine Partei haftet für die Folgen. Geldschulden bleiben bestehen."),
      b("c", "Die betroffene Partei teilt das Ereignis der anderen Partei sofort mit (formlos, auch mündlich).")
    ]);

    ziffer("haft", "Haftung", [
      b("a", "Der Verleiher haftet nur für die Qualifikation nach Ziff. {R:an.qual}. Für das Ergebnis der Arbeit haftet er nicht; Nachbesserung und Minderung sind ausgeschlossen. Für Folgen einer Verhinderung des Arbeitnehmers (Ziff. {Z:verh}) haftet er nicht."),
      b("b", "Die im anerkannten Wochenrapport (Ziff. {R:rapport.einw}, {B:rapport.zust}) erfasste Arbeit gilt als auf Weisung des Einsatzbetriebs geleistet, soweit der Einsatzbetrieb nicht das Gegenteil beweist."),
      b("schaden", "Schäden, die der Arbeitnehmer bei der Arbeit verursacht, trägt der Einsatzbetrieb. Das gilt für Schäden bei ihm selbst, an Sachen, die er dem Arbeitnehmer zur Verfügung stellt, und bei Dritten. Er hält den Verleiher und den Arbeitnehmer schadlos, auch gegen jeden Rückgriff eines Versicherers."),
      b("d", "Bei Absicht oder grober Fahrlässigkeit des Arbeitnehmers gilt Bst. {B:haft.schaden} nicht.")
    ]);

    ziffer("vers", "Versicherungen", [
      b("a", "Der Verleiher versichert den Arbeitnehmer nach Gesetz und Arbeitsvertrag (Unfall, Krankentaggeld, berufliche Vorsorge) und hat eine Betriebshaftpflichtversicherung für den Personalverleih."),
      b("b", "Schäden an Sachen, an oder mit denen der Arbeitnehmer arbeitet, und an Sachen, die ihm zum Gebrauch zur Verfügung gestellt oder zur Aufbewahrung übergeben sind (Bearbeitungs- und Obhutsschäden), versichert der Einsatzbetrieb; ebenso Bauwerk, Material, Grossgeräte und Installationen, soweit nicht die Bauherrschaft sie versichert."),
      b("c", "Die Betriebshaftpflichtversicherung des Einsatzbetriebs schliesst den Arbeitnehmer bei der Arbeit ein; dafür steht der Einsatzbetrieb ein."),
      b("d", "Fahrzeuge stellt der Einsatzbetrieb dem Arbeitnehmer nur zur Verfügung, wenn dessen Führerausweis die Kategorie deckt. Halterhaftpflicht und Kasko samt Selbstbehalt sind Sache des Einsatzbetriebs; für Schäden gilt Ziff. {Z:haft}.")
    ]);

    ziffer("sicher", "Arbeitssicherheit, Ausrüstung und Werkzeug", [
      b("a", "Der Einsatzbetrieb hat gegenüber dem Arbeitnehmer die Pflichten zur Arbeitssicherheit und zum Gesundheitsschutz wie gegenüber seinen eigenen Mitarbeitern (Art. 10 VUV). Er instruiert ihn zu Beginn des Einsatzes, auf jeder neuen Baustelle und bei jeder wesentlichen Änderung und stellt sichere Arbeitsmittel und die einsatzbezogene Schutzausrüstung."),
      o.werkzeug && b("grund", "Die persönliche Grundausrüstung (Helm, Sicherheitsschuhe, Schutzbrille, Gehörschutz) bringt der Arbeitnehmer mit."),
      b("werkzeug", o.werkzeug
        ? "Der Arbeitnehmer bringt sein persönliches Handwerkzeug und seine Kleingeräte (Werkzeug) mit. Material, Grossgeräte, Gerüste, Hebemittel und Verbrauchsmaterial stellt der Einsatzbetrieb."
        : "Die persönliche Grundausrüstung (Helm, Sicherheitsschuhe, Schutzbrille, Gehörschutz), Handwerkzeug, Kleingeräte, Material, Grossgeräte, Gerüste, Hebemittel und Verbrauchsmaterial stellt der Einsatzbetrieb."),
      b("gefahr", "Bei Gefahr stoppt der Arbeitnehmer die betroffene Arbeit und teilt das sofort der Kontaktperson mit (formlos, auch mündlich). Bis eine Lösung gefunden ist, gilt Ziff. {Z:ausfall}."),
      o.werkzeug && b("aufbewahrung", "Stellt der Einsatzbetrieb für das Werkzeug einen abschliessbaren Raum oder Behälter zur Verfügung, haftet er für Verlust und Beschädigung dort; andere gebrauchen das Werkzeug nur mit Zustimmung des Arbeitnehmers (formlos, auch mündlich). Sonst ist die Aufbewahrung Sache des Arbeitnehmers.")
    ]);

    var fristSatz = "Sonst kann jede Partei ihn mit einer Frist von " + o.kuendigung + " Werktagen per E-Mail kündigen.";
    if (o.kuendigung === 2) fristSatz += " Als Entgegenkommen des Verleihers gilt diese kurze Frist auch dann, wenn der Einsatz schon lange dauert. Der Verleiher bittet darum, eine Kündigung wenn möglich eine Woche vor dem gewünschten Ende zu erklären, damit er für den Arbeitnehmer einen neuen Einsatz finden kann; verbindlich bleibt die Frist von zwei Werktagen.";
    ziffer("kuend", "Dauer, Kündigung und Übertritt", [
      b("frist", "Nennt das Einsatzblatt ein Ende des Einsatzes, endet der Verleihvertrag an diesem Tag ohne Kündigung. " + fristSatz),
      b("b", "Wird nach dem Ende des Einsatzes mit Wissen beider Parteien weitergearbeitet, gilt der Verleihvertrag ohne Ende weiter und ist nach Bst. {B:kuend.frist} kündbar."),
      o.zurueck && b("sofort", "Ist eine Rechnung nach Ablauf der Zahlungsfrist der letzten Mahnung noch offen, kann der Verleiher den Verleihvertrag per E-Mail auf sofort kündigen."),
      b("uebertritt", o.uebertritt === "frei"
        ? "Nach dem Ende des Einsatzes kann der Einsatzbetrieb den Arbeitnehmer anstellen (Übertritt in ein direktes Arbeitsverhältnis); eine Entschädigung schuldet er dafür nicht."
        : "Nach dem Ende des Einsatzes kann der Einsatzbetrieb den Arbeitnehmer anstellen (Übertritt in ein direktes Arbeitsverhältnis). Hat der Einsatz weniger als drei Monate gedauert und tritt der Arbeitnehmer weniger als drei Monate nach dessen Ende über, schuldet der Einsatzbetrieb die Entschädigung nach dem Einsatzblatt (Art. 22 Abs. 3 und 4 AVG).")
    ]);

    ziffer("geheim", "Geheimhaltung, Datenschutz und Kontrollen der paritätischen Organe", [
      b("a", "Die Parteien wahren gegenseitig ihre Geschäftsgeheimnisse, auch nach dem Ende des Einsatzes. Der Verleiher gibt Pläne, Preise, Kunden und Baustellen des Einsatzbetriebs sowie Zugangscodes und Schlüssel nicht an Dritte weiter, auch nicht an andere Einsatzbetriebe; ausgenommen ist, was Gesetz oder Behörden verlangen oder die Abwicklung des Verleihvertrags erfordert. Der Verleiher verpflichtet den Arbeitnehmer gleich."),
      b("b", "Personendaten bearbeiten die Parteien zur Abwicklung des Verleihvertrags und zur Pflege der Geschäftsbeziehung. Über den Arbeitnehmer gibt der Verleiher nur bekannt, was der Einsatz erfordert; der Einsatzbetrieb verwendet diese Daten nur für den Einsatz."),
      b("c", "Fotos von Baustellen veröffentlicht der Verleiher und den Einsatzbetrieb nennt er als Referenz nur mit dessen Zustimmung (E-Mail genügt)."),
      b("d", "Der Einsatzbetrieb duldet Kontrollen der paritätischen Organe, gewährt ihnen während der Arbeitszeit Zutritt zum Arbeitsort und erteilt die Auskünfte zum Einsatz, die sie dafür brauchen.")
    ]);

    var gericht = o.gericht === "einsatz" ? "der Sitz des Einsatzbetriebs" : o.gericht === "ort" && o.gerichtOrt ? o.gerichtOrt : "der Sitz des Verleihers";
    ziffer("schluss", "Schlussbestimmungen", [
      b("a", "Erklärungen per E-Mail nach diesen Vertragsbedingungen gehen an die E-Mail-Adressen im Einsatzblatt. Erklärungen des Einsatzbetriebs per E-Mail kommen von den E-Mail-Adressen im Einsatzblatt; weitere Absender benennt er per E-Mail. Eine E-Mail geht zu, wenn sie im Postfach eintrifft; trifft sie nach 17 Uhr oder an einem Tag ein, der kein Werktag ist, geht sie am nächsten Werktag zu. Erklärungen an den Arbeitnehmer während der Arbeit ersetzen die E-Mail nicht."),
      b("b", "Änderungen und Ergänzungen des Einsatzblatts oder der Vertragsbedingungen gelten nur, wenn beide Parteien sie als Zusatz zum Verleihvertrag unterzeichnen. Erklärungen per E-Mail nach diesen Vertragsbedingungen ändern den Verleihvertrag nicht."),
      b("c", "Ist eine Bestimmung nichtig, bleibt der Verleihvertrag im Übrigen gültig; an ihre Stelle tritt die gültige Regelung, die ihrem Zweck am nächsten kommt."),
      b("d", "Forderungen aus dem Verleihvertrag tritt keine Partei ohne Zustimmung der anderen Partei ab (E-Mail genügt)."),
      b("e", "Es gilt schweizerisches Recht. Gerichtsstand ist " + gericht + ".")
    ]);
    return Z;
  }

  /* Zählt Ziffern und Buchstaben und löst die Verweis-Marken auf. Eine Ziffer mit nur einem
     Absatz trägt keinen Buchstaben. Ergebnis: [{nr, titel, abs: [{id, bst, t}]}]. */
  function gezaehlt(Z) {
    var nr = {}, bst = {}, fehlt = [];
    Z.forEach(function (z, i) {
      nr[z.id] = i + 1;
      z.abs.forEach(function (a, j) { bst[z.id + "." + a.id] = z.abs.length > 1 ? String.fromCharCode(97 + j) : ""; });
    });
    function aufloesen(s) {
      return s.replace(/\{([ZBR]):([a-z]+)(?:\.([a-z]+))?\}/g, function (m, art, zid, pid) {
        var n = nr[zid], k = zid + "." + pid;
        if (n === undefined || (art !== "Z" && bst[k] === undefined)) { fehlt.push(m); return "?"; }
        return art === "Z" ? String(n) : art === "B" ? bst[k] : (n + (bst[k] ? " " + bst[k] : ""));
      });
    }
    var aus = Z.map(function (z) {
      return {id: z.id, nr: nr[z.id], titel: z.titel, abs: z.abs.map(function (a) {
        return {id: a.id, bst: bst[z.id + "." + a.id], t: a.t.map(function (teil) {
          return typeof teil === "string" ? aufloesen(teil) : {liste: teil.liste.map(aufloesen)};
        })};
      })};
    });
    if (fehlt.length && typeof console !== "undefined") console.warn("Vertragswerk: Verweis ohne Ziel", fehlt);
    aus.fehlt = fehlt;
    return aus;
  }

  /* Text eines Absatzes zum Vergleich mit der Grundfassung (ohne Nummern, damit eine weggefallene
     Ziffer nicht alle folgenden als geändert markiert) */
  function vergleichstext(a) {
    return a.t.map(function (teil) { return typeof teil === "string" ? teil : teil.liste.join("|"); }).join("#")
      .replace(/Ziff\. [0-9]+( [a-z])?(, [0-9]*( ?[a-z])?)*/g, "Ziff.").replace(/Bst\. [a-z]/g, "Bst.");
  }
  function listeMitZeichen(liste) {
    return liste.map(function (p, i) { return p + (i < liste.length - 1 ? ";" : "."); });
  }

  /* ---------- Seite ---------- */

  if (typeof document === "undefined") {
    if (typeof module !== "undefined") module.exports = {modell: modell, gezaehlt: gezaehlt, GRUND: GRUND, pdfBauen: pdfBauen};
    return;
  }

  function $(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector("input[name=" + name + "]:checked"); return r ? r.value : ""; }
  function zahl(id, vorgabe) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v >= 0 ? v : vorgabe; }
  function wert(id) { return String($(id).value || "").trim(); }
  function zeige(el, an) { if (an) el.removeAttribute("hidden"); else el.setAttribute("hidden", ""); }

  function auswahl() {
    return {
      absage: parseInt(radio("absage"), 10), kuendigung: parseInt(radio("kuendigung"), 10),
      rechnung: radio("rechnung"), zahlfrist: parseInt(radio("zahlfrist"), 10),
      mahn: radio("mahnung") === "ja" ? [zahl("mahn1", 10), zahl("mahn2", 20)] : null,
      verrechnung: radio("verrechnung") === "ja", zurueck: radio("zurueck") === "ja", mwst: radio("mwst") === "ja",
      rabatt: radio("rabatt") === "ja", tagesmin: radio("tagesmin") === "ja",
      zu: {sa: zahl("zu-sa", 0), na: zahl("zu-na", 0), so: zahl("zu-so", 0), ue: zahl("zu-ue", 0)},
      rayon: radio("rayon"), rayonMin: Math.max(1, Math.round(zahl("rayon-min", 30))),
      selbst: radio("selbst") === "ja", bewilligung: radio("bewilligung"), werkzeug: radio("werkzeug") === "ja",
      uebertritt: radio("uebertritt"), kanton: $("kanton").value, gericht: radio("gericht"), gerichtOrt: wert("gericht-ort")
    };
  }
  function felder() {
    var f = {};
    ["v-firma", "v-adresse", "v-vertreten", "v-mail", "v-bewilligung", "v-stelle", "e-firma", "e-adresse", "e-kontakt", "e-mail",
      "a-name", "a-quali", "a-profil", "a-art", "a-beginn", "a-ende", "h-mo", "h-di", "h-mi", "h-do", "h-fr",
      "k-ansatz", "k-rabatt", "k-rabatt-bis", "k-entsch"].forEach(function (id) { f[id] = wert(id); });
    return f;
  }

  function ansicht() {
    var o = auswahl();
    zeige($("rayon-min-feld"), o.rayon === "minuten");
    zeige($("gericht-ort"), o.gericht === "ort");
    zeige($("zeile-bewilligung"), o.bewilligung === "vorhanden");
    zeige($("zeile-rabatt"), o.rabatt); zeige($("zeile-rabatt-bis"), o.rabatt);
    zeige($("zeile-entsch"), o.uebertritt === "entsch");
    var grund = {};
    gezaehlt(modell(GRUND)).forEach(function (z) { z.abs.forEach(function (a) { grund[z.id + "." + a.id] = vergleichstext(a); }); });
    var ziel = $("vertrag");
    ziel.textContent = "";
    gezaehlt(modell(o)).forEach(function (z) {
      var h = document.createElement("h4"); h.textContent = z.nr + ". " + z.titel; ziel.appendChild(h);
      z.abs.forEach(function (a) {
        var zeile = document.createElement("div"); zeile.className = "bst";
        var l = document.createElement("span"); l.textContent = a.bst ? a.bst + ")" : "";
        var t = document.createElement("div");
        if (grund[z.id + "." + a.id] !== vergleichstext(a)) t.className = "neu";
        a.t.forEach(function (teil) {
          if (typeof teil === "string") { var p = document.createElement("p"); p.textContent = teil; t.appendChild(p); return; }
          var ul = document.createElement("ul");
          listeMitZeichen(teil.liste).forEach(function (s) { var li = document.createElement("li"); li.textContent = s; ul.appendChild(li); });
          t.appendChild(ul);
        });
        zeile.appendChild(l); zeile.appendChild(t); ziel.appendChild(zeile);
      });
    });
    vorschauWeg();
  }

  /* ---------- PDF ---------- */

  function pdfErstellen() {
    zeige($("fehler"), false);
    if (!window.jspdf || !window.jspdf.jsPDF) {
      $("fehler").textContent = "PDF-Bibliothek nicht geladen. Bitte die Seite neu laden.";
      zeige($("fehler"), true); return;
    }
    var d = pdfBauen(window.jspdf.jsPDF, auswahl(), felder());
    pdfVorschau(d, "verleihvertrag" + (wert("e-firma") ? "_" + dateiteil(wert("e-firma")) : "") + ".pdf");
  }
  function dateiteil(s) {
    return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
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
  function pdfHerunterladen() {
    if (!vorschau.url) return;
    var a = document.createElement("a"); a.href = vorschau.url; a.download = vorschau.name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- Start ---------- */

  KANTONE.forEach(function (k) {
    var op = document.createElement("option"); op.value = k[0]; op.textContent = k[1];
    if (k[0] === GRUND.kanton) op.selected = true;
    $("kanton").appendChild(op);
  });
  document.querySelector(".calc-main").addEventListener("input", ansicht);
  document.querySelector(".calc-main").addEventListener("change", ansicht);
  $("pdf").addEventListener("click", pdfErstellen);
  $("pdfdown").addEventListener("click", pdfHerunterladen);
  $("pdftab").addEventListener("click", function () { if (vorschau.url) window.open(vorschau.url, "_blank"); });
  ansicht();

  /* ---------- PDF-Aufbau (A4 hoch, Helvetica) ---------- */

  function pdfBauen(JsPDF, o, f) {
    var Z = gezaehlt(modell(o));
    function zif(id) { for (var i = 0; i < Z.length; i++) if (Z[i].id === id) return Z[i]; return null; }
    function ref(zid, pid) { var z = zif(zid); if (!z) return ""; for (var i = 0; i < z.abs.length; i++) if (z.abs[i].id === pid) return z.nr + (z.abs[i].bst ? " " + z.abs[i].bst : ""); return String(z.nr); }
    function datum(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? m[3] + "." + m[2] + "." + m[1] : ""; }

    var d = new JsPDF({unit: "mm", format: "a4"});
    var x = 20, rechts = 190, B = rechts - x, PH = 297, UNTEN = PH - 18, y = 22;
    var INK = [0, 0, 0], GRAU = [110, 107, 100], LINIE = [200, 196, 188];
    function farbe(c) { d.setTextColor(c[0], c[1], c[2]); }
    function schrift(stil, gr) { d.setFont("helvetica", stil); d.setFontSize(gr); }
    function platz(h) { if (y + h > UNTEN) { d.addPage(); y = 22; } }

    /* Einsatzblatt */
    schrift("bold", 17); farbe(INK); d.text("Verleihvertrag", x, y); y += 6.5;
    schrift("normal", 11); farbe(GRAU); d.text("Einsatzblatt", x, y); y += 6;
    schrift("normal", 9); farbe(GRAU);
    var kopf = d.splitTextToSize("Personalverleih nach dem Arbeitsvermittlungsgesetz (AVG, SR 823.11). Vor Beginn des Einsatzes schriftlich abzuschliessen, in zwei Exemplaren (Art. 22 Abs. 1 AVG, Art. 50 AVV).", B);
    d.text(kopf, x, y); y += kopf.length * 4 + 1;

    function abschnitt(t) {
      platz(18);
      y += 3; schrift("bold", 10.5); farbe(INK); d.text(t, x, y);
      y += 1.8; d.setDrawColor(INK[0], INK[1], INK[2]); d.setLineWidth(0.35); d.line(x, y, rechts, y); y += 4.6;
    }
    var LX = 58;   /* Breite der Bezeichnungsspalte */
    function feld(label, w, hinweis) {
      schrift("normal", 10);
      var zl = w ? d.splitTextToSize(String(w), B - LX) : [""];
      schrift("normal", 7);
      var hl = hinweis ? d.splitTextToSize(hinweis, LX - 3) : [];
      var h = Math.max(zl.length * 4.6, 3.4 + hl.length * 3) + 2;
      platz(h);
      schrift("normal", 9.5); farbe(GRAU); d.text(label, x, y);
      if (hl.length) { schrift("normal", 7); d.text(hl, x, y + 3.3); }
      schrift("normal", 10); farbe(INK); if (w) d.text(zl, x + LX, y);
      var ly = y + (zl.length - 1) * 4.6 + 1.6;
      if (hl.length) ly = Math.max(ly, y + 1.6);
      d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.25); d.line(x + LX, ly, rechts, ly);
      y += h;
    }

    abschnitt("Verleiher");
    feld("Firma", f["v-firma"]);
    feld("Adresse", f["v-adresse"]);
    feld("Vertreten durch", f["v-vertreten"]);
    feld("E-Mail", f["v-mail"]);
    feld("Bewilligung", o.bewilligung === "frei" ? "Keine Bewilligung erforderlich: Der Verleiher verleiht ausschliesslich seinen Inhaber (Art. 28 Abs. 2 AVV)." : f["v-bewilligung"]);
    feld("Zuständige kantonale Stelle", f["v-stelle"]);

    abschnitt("Einsatzbetrieb");
    feld("Firma", f["e-firma"]);
    feld("Adresse", f["e-adresse"]);
    feld("Kontaktperson", f["e-kontakt"], "unterzeichnet die Wochenrapporte (Ziff. " + ref("rapport", "b") + ")");
    feld("E-Mail", f["e-mail"]);

    abschnitt("Einsatz");
    feld("Arbeitnehmer", f["a-name"]);
    feld("Berufliche Qualifikation", f["a-quali"]);
    feld("Anforderungsprofil", f["a-profil"], "nur wenn verlangt (Ziff. " + ref("an", "c") + ")");
    feld("Art der Arbeit", f["a-art"]);
    feld("Arbeitsort", "Sitz des Einsatzbetriebs und seine Baustellen (Ziff. " + ref("ort", "a") + ")");
    if (o.rayon === "minuten") feld("Rayon", "Orte bis " + o.rayonMin + " Minuten Fahrzeit mit dem Auto ab Sitz des Einsatzbetriebs (Ziff. " + ref("ort", "rayon") + ")");
    feld("Beginn des Einsatzes", datum(f["a-beginn"]));
    feld("Ende des Einsatzes", datum(f["a-ende"]), "leer: ohne Ende, kündbar nach Ziff. " + ref("kuend", "frist"));

    /* Stunden je Wochentag als kleine Tabelle */
    platz(17);
    schrift("normal", 9.5); farbe(GRAU); d.text("Stunden je Wochentag", x, y);
    schrift("normal", 7.5); d.text("Ziff. " + ref("zeit", "a"), x, y + 3.8);
    var tage = [["Mo", "h-mo"], ["Di", "h-di"], ["Mi", "h-mi"], ["Do", "h-do"], ["Fr", "h-fr"]], tb = (B - LX) / 5;
    d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.25);
    tage.forEach(function (t, i) {
      var tx = x + LX + i * tb;
      d.rect(tx, y - 3.6, tb, 5, "S"); d.rect(tx, y + 1.4, tb, 6.5, "S");
      schrift("normal", 8.5); farbe(GRAU); d.text(t[0], tx + tb / 2, y, {align: "center"});
      schrift("normal", 10); farbe(INK); if (f[t[1]]) d.text(f[t[1]], tx + tb / 2, y + 6, {align: "center"});
    });
    y += 13;

    if (o.rayon === "karte") feld("Rayon", "Karte auf der nächsten Seite (Ziff. " + ref("ort", "rayon") + ")");

    abschnitt("Kosten des Verleihs");
    feld("Ansatz je Stunde", f["k-ansatz"] ? "CHF " + f["k-ansatz"] : "", (o.mwst ? "zuzüglich MWST" : "ohne MWST, nicht mehrwertsteuerpflichtig") + " (Ziff. " + ref("kosten", "a") + ", " + ref("kosten", "mwst").split(" ")[1] + ")");
    if (o.rabatt) feld("Rabatt", f["k-rabatt"] || f["k-rabatt-bis"] ? (f["k-rabatt"] ? f["k-rabatt"] + " % auf den Ansatz" : "") + (f["k-rabatt-bis"] ? " bis " + datum(f["k-rabatt-bis"]) : "") : "", "Ziff. " + ref("kosten", "rabatt"));
    if (o.uebertritt === "entsch") feld("Entschädigung bei Übertritt", f["k-entsch"] ? "CHF " + f["k-entsch"] : "", "Ziff. " + ref("kuend", "uebertritt") + ", Art. 22 Abs. 3 und 4 AVG");

    platz(10); y += 4;
    schrift("bold", 10); farbe(INK);
    d.text("Die Vertragsbedingungen und die Unterschriften folgen auf dieses Einsatzblatt.", x, y);

    /* Rayon als Karte: eigene Seite des Einsatzblatts mit einem Rahmen zum Einfügen */
    if (o.rayon === "karte") {
      d.addPage(); y = 22;
      schrift("bold", 13); farbe(INK); d.text("Einsatzblatt: Rayon", x, y); y += 6;
      schrift("normal", 9); farbe(GRAU);
      var rz = d.splitTextToSize("Karte des Rayons einfügen oder einzeichnen: Sitz des Einsatzbetriebs und Grenze des Rayons (Ziff. " + ref("ort", "rayon") + "). Im Rayon ist die Wegzeit im Ansatz enthalten, ausserhalb wird sie als Arbeitszeit in Rechnung gestellt.", B);
      d.text(rz, x, y); y += rz.length * 4 + 3;
      d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.3); d.rect(x, y, B, Math.min(B, UNTEN - y - 4), "S");
    }

    /* Vertragsbedingungen, zweispaltig; Spaltenwechsel und Seitenumbruch über platz() */
    d.addPage(); y = 22;
    schrift("bold", 13); farbe(INK); d.text("Vertragsbedingungen zum Verleihvertrag", x, y); y += 7;
    var GAP = 6, CB = (B - GAP) / 2, col = 0, oben = y, ZH = 4.13, EIN = 5.2, GR = 9.8;
    function sx() { return x + col * (CB + GAP); }
    platz = function (h) {
      if (y + h <= UNTEN) return;
      if (col === 0) { col = 1; y = oben; return; }
      d.addPage(); col = 0; y = oben = 22;
    };
    Z.forEach(function (z) {
      schrift("normal", GR);
      var erste = z.abs[0].t[0];
      var ersteZeilen = Math.min(2, d.splitTextToSize(typeof erste === "string" ? erste : erste.liste[0], CB - EIN).length);
      var tz = d.splitTextToSize(z.nr + ". " + z.titel, CB); schrift("bold", 9.8); tz = d.splitTextToSize(z.nr + ". " + z.titel, CB);
      platz(tz.length * 4.2 + 1.4 + ersteZeilen * ZH);
      schrift("bold", 9.8); farbe(INK); d.text(tz, sx(), y); y += tz.length * 4.2 + 0.8;
      z.abs.forEach(function (a) {
        var ein = a.bst ? EIN : 0, ersteZeile = true;
        function zeilen(liste, dx, marke) {
          schrift("normal", GR); farbe(INK);
          liste.forEach(function (zl, k) {
            platz(ZH);
            if (ersteZeile && a.bst) d.text(a.bst + ")", sx(), y);
            if (k === 0 && marke) d.text(marke, sx() + ein + 0.6, y);
            d.text(zl, sx() + ein + dx, y); y += ZH; ersteZeile = false;
          });
        }
        a.t.forEach(function (teil) {
          schrift("normal", GR);
          if (typeof teil === "string") { zeilen(d.splitTextToSize(teil, CB - ein), 0, null); return; }
          listeMitZeichen(teil.liste).forEach(function (s) { zeilen(d.splitTextToSize(s, CB - ein - 3.4), 3.4, "-"); });
        });
        y += 1.1;
      });
      y += 2.2;
    });

    /* Unterschriften: in der Spalte, je Partei ein zusammenhängender Block */
    schrift("normal", GR);
    var schluss = d.splitTextToSize("Mit ihrer Unterschrift bestätigen die Parteien das Einsatzblatt und diese Vertragsbedingungen. Jede Partei erhält ein unterzeichnetes Exemplar.", CB);
    platz(schluss.length * ZH + 4);
    y += 2; farbe(INK); d.text(schluss, sx(), y); y += schluss.length * ZH + 4;
    [["Verleiher", f["v-firma"]], ["Einsatzbetrieb", f["e-firma"]]].forEach(function (p) {
      platz(38);
      schrift("bold", 10.6); farbe(INK); d.text(p[0], sx(), y);
      if (p[1]) { schrift("normal", 8.5); farbe(GRAU); d.text(d.splitTextToSize(p[1], CB)[0], sx() + 26, y); }
      ["Ort, Datum", "Unterschrift", "Name in Druckschrift"].forEach(function (l, i) {
        var ly = y + 9 + i * 10;
        d.setDrawColor(INK[0], INK[1], INK[2]); d.setLineWidth(0.3); d.line(sx(), ly, sx() + CB, ly);
        schrift("normal", 8.5); farbe(GRAU); d.text(l, sx(), ly + 3.6);
      });
      y += 9 + 2 * 10 + 10;
    });

    var n = d.getNumberOfPages();
    for (var i = 1; i <= n; i++) {
      d.setPage(i); schrift("normal", 8); farbe(GRAU);
      d.setDrawColor(LINIE[0], LINIE[1], LINIE[2]); d.setLineWidth(0.25); d.line(x, PH - 13, rechts, PH - 13);
      d.text("Verleihvertrag" + (f["e-firma"] ? " · " + f["e-firma"] : ""), x, PH - 9);
      d.text("Seite " + i + "/" + n, rechts, PH - 9, {align: "right"});
    }
    return d;
  }
})();
