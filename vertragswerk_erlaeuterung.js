/* Vertragswerk, Erläuterungen: entstehen aus der Auswahl des Nutzers.
   VW.ERL.vv und VW.ERL.av enthalten je Ziffer-ID eine Funktion (o, f, z) -> Blöcke; o ist die
   Auswahl, f die Felder des Blatts, z die gezählte Ziffer (z.abs mit Buchstaben). `_vorspann` steht
   vor der ersten Ziffer. Blöcke: Text; {liste: [...]}; {tabelle: {kopf: [...], zeilen: [[...]]}};
   {beispiel: "..."}; {hinweis: "..."}; {quellen: [{t, url}]}. Texte dürfen die Marken der
   Vertragstexte enthalten ({R:ort.rayon}, {Z@av:lohn}). */
(function (G) {
  "use strict";
  var VW = G.VW = G.VW || {};
  VW.ERL = VW.ERL || {};
  VW.ERL.vv = VW.ERL.vv || {};
  VW.ERL.av = VW.ERL.av || {};

  /* ---------- Hilfen ---------- */

  var FED = "https://www.fedlex.admin.ch/eli/cc/";
  var ELI = {AVG: "1991/392_392_392", AVV: "1991/408_408_408", OR: "27/317_321_377", ArG: "1966/57_57_57",
    "ArGV 1": "2000/243", VUV: "1983/1968_1968_1968", NIV: "2002/22", MWSTG: "2009/615", SchKG: "11/529_488_529",
    ZPO: "2010/262", DSG: "2022/491", StGB: "54/757_781_799"};
  /* Artikel eines Bundeserlasses mit Anker: art("OR", "102", "Abs. 2") */
  function art(erlass, nr, zusatz) {
    var anker = String(nr).replace(/^(\d+)([a-z]+)$/, "$1_$2");
    return {t: "Art. " + nr + (zusatz ? " " + zusatz : "") + " " + erlass, url: FED + ELI[erlass] + "/de#art_" + anker};
  }
  function bge(ref) {
    return {t: "BGE " + ref, url: "https://www.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F" +
      ref.replace(/ /g, "-") + "%3Ade&lang=de&type=show_document"};
  }
  var GAV = function (a) { return {t: "GAV Elektrobranche Art. " + a}; };
  var SECO_W = function (z) { return {t: "SECO, Weisungen und Erläuterungen zum AVG, Ziff. " + z}; };
  var BBL = {t: "BBL, Merkblatt Abgrenzung Personalverleih und Aufträge", url: "https://www.perimap.admin.ch/goto_bbl01_file_37290_download.html"};
  var BR = {t: "Bundesrat, Weisungen zum Abschluss von Personalverleihverträgen (BBl 2015 6309)", url: "https://www.newsd.admin.ch/newsd/message/attachments/40645.pdf"};
  var BR1 = {t: "Bundesrat, Weisungen Personalverleih, Anhang 1", url: "https://www.newsd.admin.ch/newsd/message/attachments/40648.pdf"};
  var TG = {t: "AWA Thurgau, Kommentar zum Leiharbeitsvertrag", url: "https://awa.tg.ch/public/upload/assets/163797/Kommentar%20Leiharbeit.pdf?fp=1"};
  var BS = {t: "AWA Basel-Stadt, Merkblatt 15 Temporärbeschäftigte", url: "https://media.bs.ch/original_file/8739291899ab028e258ee263d3d80204a0638adf/15-merkblatt-fuer-temporaerbeschaeftigte.pdf"};
  var STEC = {t: "suissetec, Personalverleih, Temporärarbeit: Aufgaben des Einsatzbetriebs", url: "https://suissetec.ch/files/PDFs/Arbeitssicherheit/Themen%20ASGS_de/Themen/215a010_Personalverleih%20-%20Tempor%C3%A4rarbeit.pdf"};
  var PLK27 = {t: "PLK Elektro, Merkblatt zu Art. 27 GAV (Arbeitsweg)", url: "https://www.plk-elektro.ch/documents/783/Bezahlung_der_Reisezeit_gem._Art._27.pdf"};
  var PLK27W = {t: "PLK Elektro, Weisung zu Art. 27 GAV ab 1.1.2027", url: "https://www.plk-elektro.ch/documents/829/Weisung_Bezahlung_der_Reisezeit_gem._Art._27_GAV_g%C3%BCltig_ab_01.01.2027.pdf"};
  var PLKEA = {t: "PLK Elektro, Merkblatt Ein-/Anstellungsort, Firmendomizil", url: "https://www.plk-elektro.ch/documents/757/Ein-_Anstellungsort_Firmendomizil_DE_XDjS675.pdf"};
  var EIT274 = {t: "EIT.swiss, Anwendung von Art. 27.4 GAV", url: "https://www.eit.swiss/fileadmin/user_upload/documents/Branche/GAV/_de/Anwendbarkeit_von_Art._27.4_Deutsch.pdf"};
  var SUVA = {t: "Suva, Arbeitssicherheit in Personalverleih und Temporärarbeit", url: "https://www.suva.ch/de-ch/praevention/nach-branchen/arbeitssicherheit-in-personalverleih-und-temporaerarbeit"};
  var PLK = {t: "PLK Elektro", url: "https://www.plk-elektro.ch"};

  var WT = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
  var WTG = ["Montags", "Dienstags", "Mittwochs", "Donnerstags", "Freitags"];
  var HK = ["h-mo", "h-di", "h-mi", "h-do", "h-fr"];
  var TAG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  var MONAT = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  var GAVZU = {sa: 25, na: 50, so: 100, ue: 25};
  var ZUNAME = {sa: "Samstag 13 bis 23 Uhr", na: "Nacht 23 bis 6 Uhr", so: "Sonntag und Feiertage", ue: "Überzeit nach dem ArG"};

  function feld(f, k) { return f && f[k] ? String(f[k]) : ""; }
  function zahl(s) { var v = parseFloat(String(s == null ? "" : s).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; }
  function std(n) { n = Math.round(n * 100) / 100; return n === Math.round(n) ? VW.zahlwort(n) : String(n).replace(".", ","); }
  function stunden(n) { return std(n) + (n === 1 ? " Stunde" : " Stunden"); }
  function chf(n) {
    var t = (Math.round(n * 100) / 100).toFixed(2).split(".");
    return "CHF " + t[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'") + "." + t[1];
  }
  function ansatz(f) { return zahl(feld(f, "k-ansatz")); }
  function hTag(f, i) { return zahl(feld(f, HK[i])); }
  function datumText(d) { return TAG[d.getUTCDay()] + ", " + d.getUTCDate() + ". " + MONAT[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  /* Was bei später Absage und Arbeitsausfall in Rechnung kommt, kurz */
  function tagesWert(o, i) {
    return o.tagesmin ? "das Tagesminimum des " + WTG[i] : "die Stunden je Wochentag für den " + WT[i];
  }
  function tagesBetrag(o, f, i) {
    var h = hTag(f, i), a = ansatz(f);
    if (!h) return "";
    return " (nach dem Einsatzblatt " + stunden(h) + (a ? ", beim Ansatz von " + chf(a) + " also " + chf(h * a) : "") + ")";
  }
  function wochenStunden(f) { var s = 0; for (var i = 0; i < 5; i++) s += hTag(f, i); return s; }

  var E = VW.ERL.vv;

  /* ---------- Vorspann ---------- */

  E._vorspann = function (o) {
    var b = [
      "Diese Erläuterungen erklären die Vertragsbedingungen Ziffer für Ziffer, so wie sie nach der getroffenen Auswahl lauten: wozu eine Ziffer dient, was die gewählte Variante bewirkt und worauf sie sich stützt. Sie sind nicht Bestandteil des Verleihvertrags (Ziff. {R:gegenstand.b}); es gilt allein der unterzeichnete Text. Werden sie beim Abschluss übergeben, kann ein Gericht sie zur Auslegung beiziehen (BGE 144 III 93 E. 5.2.3). Sie ersetzen keine Rechtsberatung.",
      "Selbstverleih heisst: Eine Firma (GmbH oder AG) verleiht ihren Inhaber, der bei ihr als Arbeitnehmer angestellt ist, an einen Einsatzbetrieb. Rechtlich ist das Personalverleih nach dem Arbeitsvermittlungsgesetz (AVG): Die Firma ist Verleiher und Arbeitgeber, der Einsatzbetrieb erteilt die Weisungen zur Arbeit. Der Inhaber ist zugleich Arbeitnehmer und Geschäftsführer des Verleihers; die Vertragsbedingungen nennen ihn \"der Arbeitnehmer\"."
    ];
    if (o.bewilligung === "vorhanden") {
      b.push("Die Auswahl geht von einem Verleiher mit Bewilligung aus. Eine Bewilligung braucht, wer gewerbsmässig verleiht (Art. 12 Abs. 1 AVG); befreit ist nur ein Betrieb, der ausschliesslich den Inhaber oder die Mitbesitzer verleiht (Art. 28 Abs. 2 AVV). Das Einsatzblatt nennt die Bewilligung (Art. 22 Abs. 1 Bst. a AVG). Die Vertragsbedingungen bleiben auf eine einzige verliehene Person zugeschnitten (Ziff. {R:an.a}). Ein Verleiher mit Bewilligung fällt zudem in den Geltungsbereich des GAV Personalverleih (dort Art. 2 Abs. 1); wie dieser neben dem GAV der Elektrobranche gilt, bildet die Vorlage nicht ab.");
    } else {
      b.push("Verleiht die Firma ausschliesslich ihren Inhaber, braucht sie keine Bewilligung (Art. 28 Abs. 2 AVV). Inhaber ist bei einer Ein-Personen-AG der Alleinaktionär, bei einer Ein-Personen-GmbH der alleinige Gesellschafter (SECO, Weisung 2014/1, Ziff. 2); für Mitbesitzer nennt die Weisung eigene Kriterien. Verleiht die Firma eine weitere Person, entfällt die Befreiung; ohne die nötige Bewilligung wäre der Verleihvertrag nichtig (Art. 22 Abs. 5 AVG). Den schriftlichen Verleihvertrag braucht es in jedem Fall (Art. 22 Abs. 1 AVG).");
    }
    var tmZ = o.tagesmin ? ", {Z:tm}" : "";
    b.push("Verleiher und Einsatzbetrieb verfolgen teils dieselben, teils entgegengesetzte Ziele. Beim Selbstverleih fallen die Ziele von Verleiher und Arbeitnehmer zusammen: Was der Verleiher einnimmt, trägt den Lohn seines Inhabers. Zwei Überlegungen bestimmen die meisten Punkte:");
    b.push({liste: [
      "Der Ansatz bezahlt neben dem Lohn alles, was der Verleiher auch ohne geleistete Stunde trägt: Ferien, Feiertage, 13. Monatslohn, Sozialabgaben, Versicherungen, Werkzeug, Zeit ohne Einsatz und die Kosten der Firma. Je mehr Stunden im Jahr verrechnet werden, desto kleiner ist dieser Anteil je Stunde. Für den Verleih eignen sich darum Einsätze mit vollen Wochen und langen Tagen. Wer nur wenige Stunden arbeiten kann, fährt mit einer Festanstellung besser; dort trägt der Arbeitgeber das Risiko leerer Stunden.",
      "Eine zusätzliche Stunde lohnt sich für den, der an ihr verdient. Ein Lernender erhält für eine Stunde Überzeit wenig, der Betrieb verrechnet sie zum vollen Preis; seine Überzeit nützt vor allem dem Betrieb. Im Selbstverleih deckt der Ansatz die Kosten, und jede weitere verrechnete Stunde trägt zum Ertrag bei. Der Arbeitnehmer will darum möglichst viele Stunden, der Einsatzbetrieb nur so viele, wie er braucht."
    ]});
    b.push({tabelle: {kopf: ["Punkt", "Verleiher und Arbeitnehmer", "Einsatzbetrieb", "Ausgleich im Vertrag"], zeilen: [
      ["Stunden je Tag", "möglichst viele verrechnete Stunden; kein Heimschicken am Nachmittag", "nur die Stunden, die er braucht", "Ziff. {Z:zeit}" + tmZ],
      ["Ansatz", "deckt alle Kosten, auch die Stunden ohne Einsatz", "tief; Rabatt für lange Einsätze", "Ziff. {Z:kosten}"],
      ["Wegzeit", "kleiner Rayon, Wegzeit verrechnet", "grosser Rayon, Wegzeit im Ansatz", "Ziff. {Z:ort}"],
      ["Absage und Ausfall", "früh wissen, ob gearbeitet wird; späte Absage bezahlt", "kurzfristig und ohne Kosten absagen", "Ziff. {Z:absage}, {Z:ausfall}"],
      ["Dauer", "lange Einsätze; Frist, um einen Anschluss zu finden", "rasch beenden können", "Ziff. {Z:kuend}"],
      ["Zahlung", "kurze Zahlungsfrist", "lange Zahlungsfrist", "Ziff. {Z:rechnung}"],
      ["Schäden", "Haftung nur für eigene Pflichten", "Ersatz für Schäden aus der Arbeit", "Ziff. {Z:haft}"]
    ]}});
    b.push("Gemeinsam ist beiden das Interesse an sicherer Arbeit, an einem sauberen Wochenrapport und an guter Arbeit, die zu weiteren Einsätzen führt.");
    b.push("Die Ziffern sind in Buchstaben (Bst.) gegliedert: \"Ziff. {R:rapport.einw}\" meint Buchstabe {B:rapport.einw} der Ziffer {Z:rapport}. Die Nummern hängen von der Auswahl ab, weil Ziffern und Buchstaben wegfallen können. Abkürzungen: OR Obligationenrecht; ArG Arbeitsgesetz; AVV Arbeitsvermittlungsverordnung; GAV Gesamtarbeitsvertrag der Schweizerischen Elektrobranche, PLK dessen Paritätische Landeskommission; NIV Niederspannungs-Installationsverordnung; VUV Verordnung über die Unfallverhütung.");
    b.push("Die Vertragsbedingungen regeln vor allem den Streitfall. Im Alltag lösen die Parteien vieles im Gespräch; der Vertrag sagt, was gilt, wenn das nicht gelingt.");
    b.push({quellen: [art("AVG", "22"), art("AVG", "12", "Abs. 1"), art("AVV", "28", "Abs. 2"), bge("144 III 93")]});
    return b;
  };

  /* ---------- A. Vertrag und Leistung ---------- */

  E.gegenstand = function (o) {
    var b = [
      "Die Ziffer sagt, was der Vertrag ist und woraus er besteht. Ob Personalverleih vorliegt, entscheidet die tatsächliche Ausgestaltung, nicht die Bezeichnung (Art. 18 OR; Bundesrat, Weisungen Personalverleih, Anhang 1). Darum tragen erst Weisungsrecht (Ziff. {Z:weisung}) und Haftung (Ziff. {Z:haft}) den Verleih im Alltag. Die Merkmale nach den Behörden:",
      {tabelle: {kopf: ["Merkmal", "Personalverleih", "Werkvertrag"], zeilen: [
        ["Weisungen zur Arbeit", "Einsatzbetrieb", "Unternehmer an seine eigenen Leute"],
        ["Einbindung", "in die Organisation des Einsatzbetriebs", "der Unternehmer organisiert selbst"],
        ["Werkzeug, Material, Geräte", "überwiegend vom Einsatzbetrieb", "vom Unternehmer"],
        ["Risiko für das Ergebnis", "Einsatzbetrieb; keine Nachbesserung durch den Verleiher", "Unternehmer; Mängelrechte des Bestellers (Art. 368 OR)"]
      ]}},
      "Rangordnung (Bst. {B:gegenstand.c}): Zwingendes Recht und die nach Art. 20 AVG massgebenden Bestimmungen des GAV gelten ohnehin; der GAV ist bis Ende 2029 allgemeinverbindlich, ausser in Genf und Wallis. Das Einsatzblatt geht den Vertragsbedingungen vor, weil eine individuelle Abrede allgemeinen Bedingungen vorgeht (BGE 125 III 263). Bedingungen des Einsatzbetriebs (Bst. {B:gegenstand.d}), etwa Einkaufsbedingungen in einer Bestellung, gelten nur mit Titel und Fassung im Einsatzblatt oder in einem Zusatz. Ob eine solche Abwehrklausel fremde Bedingungen sicher ausschliesst, ist gerichtlich nicht entschieden; der Verleiher liest sie darum vor der Unterschrift."
    ];
    if (o.kanton === "BE") {
      b.push("Werktag (Bst. {B:gegenstand.e}) ist Montag bis Freitag ohne die Feiertage nach Art. 2 des bernischen Feiertagsgesetzes; von Montag bis Freitag können das sein: 1. und 2. Januar, Karfreitag, Ostermontag, Auffahrt, Pfingstmontag, 1. August, 25. und 26. Dezember. Die Liste gilt, gleich wo gearbeitet wird; Absage, Einwendungen und Kündigung zählen in diesen Werktagen.");
    } else {
      b.push("Werktag (Bst. {B:gegenstand.e}) ist Montag bis Freitag ohne die öffentlichen Feiertage des Kantons " + VW.kantonName(o.kanton) + "; welche das sind, bestimmt das Recht dieses Kantons. Gezählt wird danach, gleich wo gearbeitet wird; Absage, Einwendungen und Kündigung zählen in diesen Werktagen.");
    }
    b.push("Wörter anderer Verträge und ihre Entsprechung hier:", {liste: [
      "Arbeitsrapport, Visum: Wochenrapport, Unterschrift",
      "Reisezeit: Wegzeit; Stundensatz, Entgelt: Ansatz, Kosten des Verleihs",
      "Annullierung, Stornierung: Absage",
      "Übernahme, Festanstellung: Übertritt in ein direktes Arbeitsverhältnis"
    ]});
    b.push({quellen: [art("AVG", "22", "Abs. 1"), art("AVG", "20"), art("OR", "18"), bge("125 III 263"), BBL, BR1]});
    return b;
  };

  E.an = function (o, f) {
    var q = feld(f, "a-quali"), p = feld(f, "a-profil");
    return [
      "Verliehen wird nur der genannte Arbeitnehmer; fällt er aus, ruht der Einsatz (Ziff. {Z:verh}). " + (o.bewilligung === "vorhanden"
        ? "Auch mit Bewilligung stellt der Verleiher nach dieser Fassung keinen anderen; ein Wechsel bräuchte einen Zusatz (Ziff. {R:schluss.b})."
        : "Beim Selbstverleih folgt das aus dem Rahmen: Verliehe die Firma eine andere Person, entfiele die Befreiung von der Bewilligung (Art. 28 Abs. 2 AVV)."),
      "Der Verleiher steht für die Qualifikation ein" + (q ? ", hier \"" + q + "\"" : ", etwa \"Elektroinstallateur EFZ\"") + ". Mit dem EFZ darf der Arbeitnehmer installieren und erstmalig in Betrieb nehmen, unter der Installationsbewilligung des Einsatzbetriebs (Art. 10a, 10b NIV). Für das Ergebnis der Arbeit haftet er nicht (Ziff. {R:haft.a}).",
      "Braucht die Arbeit mehr, etwa einen Ausbildungsnachweis für Hubarbeitsbühnen, Stapler oder Absturzsicherung (Art. 8 VUV), nennt der Einsatzbetrieb das vor der Unterschrift als Anforderungsprofil" + (p ? " (hier: \"" + p + "\")" : "") + ". Was nicht im Einsatzblatt steht, ist nicht geschuldet. Kopien von Nachweisen behält er nur, solange er sie braucht (Art. 6 DSG).",
      {quellen: [art("AVG", "22", "Abs. 1 Bst. b"), art("AVV", "28", "Abs. 2"), art("NIV", "10a"), art("VUV", "8")]}
    ];
  };

  E.weisung = function () {
    return [
      "Der Verleiher tritt dem Einsatzbetrieb wesentliche Weisungsbefugnisse ab (Art. 12 Abs. 1 AVG, Art. 26 AVV). Die Arbeitgeberfunktion ist damit geteilt: Der Einsatzbetrieb bestimmt, was und wie gearbeitet wird. Beim Verleiher bleiben Arbeitsvertrag und Lohn, Ferien (Ziff. {R:verh.c}), die Kündigung des Arbeitsverhältnisses und die Versicherungen (Ziff. {R:vers.a}).",
      "Einzelpersonen, die sich selbst verleihen, bindet der Einsatzbetrieb ein wie betriebseigene Personen; die Verantwortung für die Installation bleibt in jedem Fall bei ihm (Art. 10b NIV). Den Sicherheitsnachweis unterzeichnet seine kontrollberechtigte Person; der Arbeitnehmer höchstens die Erstprüfung, die er selbst gemacht hat (Art. 37 Abs. 2 NIV).",
      "Auf der Baustelle ist der Arbeitnehmer Arbeitnehmer; er vertritt dort weder den Verleiher noch den Einsatzbetrieb, auch nicht gegenüber der Bauherrschaft. Als Geschäftsführer handelt er nur bei Erklärungen zu diesem Vertrag (Bst. {B:weisung.gf}).",
      "Weiterverleih ist verboten (Art. 26 Abs. 3 AVV); braucht eine andere Firma den Arbeitnehmer, schliesst sie einen eigenen Verleihvertrag. Regelt die Bauleitung eines Generalunternehmers Zutritt und Abläufe, ist das Hausrecht und kein Weiterverleih.",
      {quellen: [art("AVG", "12", "Abs. 1"), art("AVV", "26"), art("NIV", "10b"), art("NIV", "37"), SECO_W("3.11.4"), STEC]}
    ];
  };

  /* ---------- B. Arbeitsort und Arbeitszeit ---------- */

  E.ort = function (o) {
    var m = o.rayonMin, mw = VW.zahlwort(m), b = [
      "Arbeitsort sind der Sitz des Einsatzbetriebs und alle seine Baustellen; ein Wechsel der Baustelle ändert den Vertrag nicht. Ausserhalb des Rayons wird nur mit Zustimmung des Verleihers gearbeitet (E-Mail genügt).",
      "Der Rayon ist eine Preisregel zwischen den Firmen: Im Rayon ist die Wegzeit im Ansatz enthalten, ausserhalb stellt der Verleiher sie als Arbeitszeit in Rechnung. Was der Arbeitnehmer als Wegzeit erhält, regeln GAV und Arbeitsvertrag: Im Lohnverhältnis gilt GAV Art. 27.3 (Arbeitszeit ist, was den Weg vom Wohnort zum Betrieb übersteigt). Der Rayon nach GAV Art. 27.4 ist nicht allgemeinverbindlich erklärt; nach der PLK steht er nur Mitgliedern von EIT.swiss offen.",
      "Ausserhalb des Rayons kommt die ganze Wegzeit in Rechnung, hin und zurück " + VW.WEG_AB[o.rayon] + ", nicht nur der Teil über den Rayon-Minuten. Der Verleiher bezahlt dem Arbeitnehmer die Wegzeit nach GAV Art. 27.3; liegt sein Sitz in der Wohnung des Inhabers, wie oft beim Selbstverleih, ist der normale Arbeitsweg null und jede Fahrt zur Baustelle Arbeitszeit. Mit der ganzen Wegzeit kann er verrechnen, was er als Lohn schuldet. Die Rechnung \"Weg minus 15 Minuten\" der PLK-Weisung ab 2027 betrifft den Lohn bei EIT.swiss-Mitgliedern, nicht den Preis zwischen den Firmen."
    ];
    if (o.rayon === "verleiher") b.push("Gewählt ist der Messpunkt am Sitz des Verleihers, wie GAV Art. 27.4, der ab dem Firmensitz des Arbeitgebers misst. Vorteil: ein fester Punkt und eine Karte für alle Einsatzbetriebe. Liegt der Einsatzbetrieb weit weg, können Baustellen in seiner Umgebung ausserhalb liegen; dort kommt die Wegzeit dazu.");
    else if (o.rayon === "einsatz") b.push("Gewählt ist der Messpunkt am Sitz des Einsatzbetriebs, wie der GAV die Verpflegungsentschädigung bei Temporären misst (\"Sitz der Einsatzfirma\", GAV Art. 33.1). Der Rayon deckt die Umgebung des Einsatzbetriebs wie bei seinen Monteuren; liegt der Verleiher weit weg, trägt er den längeren Weg im Ansatz. Die Grundfassung misst ab dem Sitz des Verleihers.");
    else b.push("Gewählt: Im Rayon liegt jeder Ort, der von einem der beiden Sitze in der Zeit erreichbar ist. Das grösste Gebiet; der Einsatzbetrieb bezahlt am seltensten Wegzeit, der Verleiher trägt am meisten im Ansatz. Die Grundfassung misst nur ab dem Sitz des Verleihers.");
    b.push(m === 15 ? "Grösse: 15 Minuten, wie GAV Art. 27.4." : m > 15
      ? "Grösse: " + mw + " Minuten, mehr als die 15 Minuten des GAV; mehr Baustellen liegen im Rayon, zugunsten des Einsatzbetriebs."
      : "Grösse: " + mw + " Minuten, weniger als die 15 Minuten des GAV; weniger Baustellen liegen im Rayon, zugunsten des Verleihers.");
    b.push("Gemessen wird wie bei der PLK: effektive Wegzeit für einen Weg mit dem Auto, Abfahrt zur Zeit des Arbeitsbeginns, mit dem Verkehr zu dieser Zeit. " + (o.rayonKarte
      ? "Massgebend ist die Karte im Einsatzblatt mit Messdatum und Abfahrtszeit; eine spätere Messung mit anderem Verkehr ändert nichts."
      : "Ohne Karte legt der Vertrag die Messregel nicht fest; im Einzelfall entscheidet die Messung. Baustellen am Rand des Rayons misst man darum früh und hält das Ergebnis per E-Mail fest."));
    b.push({beispiel: "Eine Baustelle " + VW.zahlwort(Math.max(1, m - 3)) + " Minuten " + (o.rayon === "einsatz" ? "vom Sitz des Einsatzbetriebs" : o.rayon === "beide" ? "vom näheren Sitz" : "vom Sitz des Verleihers") + ": im Rayon. Eine Woche in Thun, " + (m + 25) + " Minuten entfernt: Anfrage und Zustimmung per E-Mail, die Wegzeit steht im Wochenrapport und kommt ganz als Arbeitszeit in Rechnung, täglich 2 × " + (m + 25) + " Minuten; Spesen bleiben im Ansatz. Zwei Wochen im Wallis ohne Heimkehr am Abend: Unterkunft und Verpflegung kommen dazu (GAV Art. 33.2)."});
    b.push({quellen: [art("AVG", "22", "Abs. 1 Bst. c"), GAV("27.3, 27.4, 33"), PLK27, PLK27W, PLKEA, EIT274]});
    return b;
  };

  E.zeit = function (o, f) {
    var w = wochenStunden(f), teile = [];
    for (var i = 0; i < 5; i++) if (hTag(f, i)) teile.push(WT[i] + " " + std(hTag(f, i)));
    return [
      "Das Einsatzblatt nennt die Stunden je Wochentag (Art. 22 Abs. 1 Bst. e AVG)" + (w ? ": " + teile.join(", ") + ", zusammen " + stunden(w) + " je Woche" : "") + "; innerhalb davon teilt der Einsatzbetrieb ein." + (o.tagesmin ? " Die Stunden sind zugleich das Tagesminimum (Ziff. {R:tm.min})." : ""),
      "Arbeit über die Stunden je Wochentag hinaus kommt zum Ansatz in Rechnung. Überstunden sind Arbeit über die vertragliche Arbeitszeit, nach GAV gemessen an der Jahresarbeitszeit (Art. 21). Überzeit ist Arbeit über die Höchstarbeitszeit von 50 Stunden je Woche (Art. 9 ArG; GAV Art. 22.1), höchstens zwei Stunden je Tag (Art. 12 ArG)." +
        (o.zu.ue > 0 ? " Nur Überzeit erhält einen Zuschlag (Ziff. {R:tm.zuschlag})." : " Einen Zuschlag für Überzeit sieht die gewählte Fassung nicht vor."),
      "Nachtarbeit braucht die Zustimmung des Arbeitnehmers (Art. 17 Abs. 6 ArG). Samstag, Sonntag und Feiertage werden erst mit Bestätigung per E-Mail vereinbarte Tage (Ziff. {R:absage.weitere}). Für das ArG ist der Einsatzbetrieb verantwortlich, weil er einteilt.",
      "Pausen sind keine Arbeitszeit: Mittagspause nach GAV 60 Minuten, dazu eine unbezahlte Pause je Halbtag (GAV Art. 28). Fahrt zwischen Baustellen und Wartezeit sind Arbeitszeit (Art. 13 ArGV 1); wer eine Stunde auf Material wartet und dann weiterarbeitet, hat geleistete Arbeitszeit, keinen Arbeitsausfall.",
      {quellen: [art("AVG", "22", "Abs. 1 Bst. e"), art("ArG", "9"), art("ArG", "12"), art("ArG", "17"), art("ArGV 1", "13"), GAV("21, 22, 28")]}
    ];
  };

  /* ---------- C. Kosten und Abrechnung ---------- */

  E.kosten = function (o, f) {
    var a = ansatz(f), tm = o.tagesmin, zu = o.zu.sa > 0 || o.zu.na > 0 || o.zu.so > 0 || o.zu.ue > 0;
    var im = ["Lohn, auch für Ferien, Feiertage und Verhinderung", "Beiträge an AHV, IV, EO, ALV und Familienausgleichskasse", "Unfallversicherung, Krankentaggeld, berufliche Vorsorge", "Beiträge an Vollzug und Weiterbildung (GAV Art. 11.2)", "Spesen, etwa die Verpflegungsentschädigung (GAV Art. 33.1)"];
    if (o.werkzeug) im.push("Werkzeug und persönliche Grundausrüstung");
    im.push("Verwaltungsaufwand und Gewinn");
    var b = ["Die Ziffer nennt die Kosten des Verleihs abschliessend (Art. 22 Abs. 1 Bst. f AVG)" + (a ? "; Ansatz nach dem Einsatzblatt " + chf(a) + " je Stunde" : "") + ". Im Ansatz stecken namentlich:", {liste: im},
      "Was dazukommen kann, zählt Bst. {B:kosten.c} abschliessend auf. Die MWST fehlt dort, weil ein steuerpflichtiger Einsatzbetrieb sie als Vorsteuer abzieht."];
    if (!tm) b.push("Ohne Tagesminimum kommt an einem Arbeitstag nur die geleistete Arbeitszeit in Rechnung, auch wenn der Einsatzbetrieb ohne Hindernis früher heimschickt; den Lohn schuldet der Verleiher trotzdem (Art. 324 OR). Bei später Absage und Arbeitsausfall gelten die Stunden je Wochentag.");
    if (!tm && !zu) b.push("Ohne Zuschläge kommt auch Arbeit am Samstagnachmittag, in der Nacht, am Sonntag oder als Überzeit zum Ansatz in Rechnung; Lohnzuschläge nach GAV deckt dann der Ansatz.");
    if (o.rabatt) {
      var r = zahl(feld(f, "k-rabatt")), bis = VW.datum(feld(f, "k-rabatt-bis"));
      b.push("Der Rabatt (Bst. {B:kosten.rabatt}) gilt auf den Ansatz für geleistete Arbeitszeit" + (r ? ", " + std(r) + " %" : "") + (bis ? " bis " + bis : " bis zum Datum im Einsatzblatt") + (a && r ? " (" + chf(a * (1 - r / 100)) + " je Stunde)" : "") + "; danach gilt ohne Zusatz der volle Ansatz. Zuschläge" + (tm ? ", Aufrundung auf das Tagesminimum" : "") + " und die Posten nach Bst. {B:kosten.c} erhalten keinen Rabatt.");
    } else {
      b.push("Ein Rabatt ist nicht gewählt; die andere Variante erlaubt einen befristeten Rabatt im Einsatzblatt, der am genannten Datum ohne Zusatz wegfällt.");
    }
    b.push(o.mwst ? "Die MWST kommt zum gesetzlichen Satz dazu (Art. 25 MWSTG); der Satz steht nicht im Vertrag, damit eine Änderung keinen Zusatz braucht."
      : "Der Verleiher ist nicht mehrwertsteuerpflichtig; steuerpflichtig wird ein Unternehmen in der Regel ab CHF 100'000 Umsatz im Jahr (Art. 10 MWSTG). Ändert sich das, braucht es einen Zusatz (Ziff. {R:schluss.b}).");
    b.push("Einen neuen Ansatz, etwa nach der Lohnrunde des GAV, teilt der Verleiher zwei Monate im Voraus mit; er gilt nur mit Zusatz, sonst kann jede Partei mit " + VW.zahlwort(o.kuendigung) + " Werktagen kündigen (Ziff. {R:kuend.frist}).");
    b.push({quellen: [art("AVG", "22", "Abs. 1 Bst. f"), art("MWSTG", "25"), GAV("11.2, 33.1"), {t: "SECO, Muster Verleihvertrag, Ziff. 4"}]});
    return b;
  };

  E.tm = function (o, f) {
    var tm = o.tagesmin, a = ansatz(f), b = [];
    if (tm) {
      var h = hTag(f, 1) || 8, g = h >= 6 ? 5 : h / 2;
      b.push("Das Tagesminimum ist eine Preisregel: Schickt der Einsatzbetrieb den Arbeitnehmer früher heim, schuldet der Verleiher ihm den Lohn trotzdem (Art. 324 OR); das Tagesminimum legt dieses Risiko in den Preis. Weil Minima in der Praxis oft kleiner sind, steht es ausdrücklich im Vertrag. Geht der Arbeitnehmer aus Gründen in seiner Person früher oder bricht der Verleiher ab, gilt nur die geleistete Arbeitszeit; an Tagen, die keine Werktage sind, gilt kein Tagesminimum. Verzichtet der Verleiher im Einzelfall, genügt sein Vermerk im Wochenrapport.");
      b.push({beispiel: "Dienstag mit " + stunden(h) + " nach dem Einsatzblatt; nach " + stunden(g) + " schickt die Kontaktperson den Arbeitnehmer heim. In Rechnung: " + stunden(g) + " geleistet und " + stunden(h - g) + " Aufrundung als eigene Position" + (zuGewaehlt(o) ? ", ohne Zuschlag" : "") + (o.rabatt ? " und ohne Rabatt" : "") + (a ? ", zusammen " + chf(h * a) : "") + ". Geht er um 15 Uhr zum Zahnarzt, zählt nur die geleistete Arbeitszeit."});
    } else {
      b.push("Ein Tagesminimum ist nicht gewählt; die Ziffer regelt nur die Zuschläge (zur Folge Ziff. {Z:kosten}).");
    }
    var zeilen = [], abw = [];
    ["sa", "na", "so", "ue"].forEach(function (k) {
      var p = o.zu[k];
      if (p > 0) zeilen.push([ZUNAME[k], p + " %", a ? chf(a * (1 + p / 100)) : (100 + p) + " % des Ansatzes"]);
      if (p !== GAVZU[k]) abw.push(ZUNAME[k] + " " + p + " % (GAV " + GAVZU[k] + " %)");
    });
    if (zeilen.length) {
      b.push("Die Zuschläge decken die Lohnzuschläge nach GAV (Art. 25.1, 22.2); sie stehen im Vertrag, weil sie Teil der Kosten des Verleihs sind." + (zeilen.length > 1 ? " Trifft mehr als einer zu, gilt der höchste (wie GAV Art. 22.3)." : "") + (tm ? " Die Aufrundung erhält keinen Zuschlag." : ""));
      b.push({tabelle: {kopf: ["Zeit", "Zuschlag", "je Stunde"], zeilen: zeilen}});
    } else {
      b.push("Zuschläge sind nicht gewählt: Arbeit am Samstagnachmittag, in der Nacht, am Sonntag oder als Überzeit kommt zum Ansatz in Rechnung; Lohnzuschläge nach GAV deckt der Ansatz.");
    }
    if (abw.length) b.push("Abweichend vom GAV gewählt: " + abw.join("; ") + ". Höhere Werte gehen zulasten des Einsatzbetriebs; tiefere decken den Lohnzuschlag nach GAV nicht ganz, den Rest trägt der Verleiher.");
    b.push({quellen: [art("OR", "324"), art("AVG", "22", "Abs. 1 Bst. f"), GAV("22, 25.1")]});
    return b;
  };
  function zuGewaehlt(o) { return o.zu.sa > 0 || o.zu.na > 0 || o.zu.so > 0 || o.zu.ue > 0; }

  E.rapport = function () {
    return [
      "Der Wochenrapport ist Grundlage der Rechnung und zugleich die Zeiterfassung des Verleihers (Art. 73 ArGV 1). Die Kontaktperson ist ermächtigt zu unterzeichnen und Einwendungen zu erheben (Art. 33 Abs. 3 OR); sie unterzeichnet auf Papier oder auf dem Bildschirm, ohne Treffen: Der Wochenrapport kommt als PDF per E-Mail und geht unterzeichnet zurück.",
      "Nach fünf Werktagen ohne Einwendung gilt er als anerkannt. Eine solche Abrede ist zulässig; der unterzeichnete Wochenrapport begründet eine Vermutung, der Gegenbeweis bleibt (BGer 4C.20/2003, 4A_377/2021). Offensichtliche Schreibfehler bleiben korrigierbar, der unbestrittene Teil der Rechnung bleibt zu bezahlen.",
      "Für eine Betreibung taugt als Schuldanerkennung voraussichtlich nur ein von Hand auf Papier unterzeichneter Wochenrapport (Art. 82 SchKG; BGer 5A_50/2017); bei Bildschirm-Unterschrift oder Anerkennung durch Fristablauf bleibt die Klage.",
      {beispiel: "Unterschrift am Freitag: Einwendungen bis und mit dem folgenden Freitag, bei einem Feiertag dazwischen einen Werktag länger. Unterzeichnet niemand, läuft die Frist ab dem Zugang der E-Mail (Bst. {B:rapport.zust})."},
      {quellen: [art("OR", "33"), art("ArGV 1", "73"), art("SchKG", "82")]}
    ];
  };

  E.rechnung = function (o) {
    var n = o.zahlfrist, b = [];
    b.push(o.rechnung === "monat"
      ? "Gewählt: Rechnung je Kalendermonat. Weniger Rechnungen für den Einsatzbetrieb; der Verleiher leistet länger vor. Je Kalenderwoche passte jede Rechnung zu einem Wochenrapport."
      : "Gewählt: Rechnung je Kalenderwoche, passend zu je einem Wochenrapport; der Verleiher leistet kurz vor. Je Kalendermonat wären es weniger Rechnungen, der Verleiher wartete länger.");
    b.push("Fälligkeitsdatum ist der " + n + ". Tag nach dem Rechnungsdatum, gezählt werden alle Tage" + (n !== 30 ? " (Grundfassung 30)" : "") + ". Es ist Verfalltag: Wer bis dahin nicht bezahlt, ist ohne Mahnung im Zahlungsverzug (Art. 102 Abs. 2 OR); ab dem Tag danach ist Verzugszins von 5 % geschuldet (Art. 104 Abs. 1 OR). Die Regel steht in den Vertragsbedingungen, weil Gerichte ein Zahlungsziel nur auf der Rechnung unterschiedlich beurteilen.");
    var d = new Date(Date.UTC(2026, 9, 2)), f0 = new Date(d.getTime() + n * 86400000), f1 = new Date(f0.getTime());
    while (f1.getUTCDay() === 0 || f1.getUTCDay() === 6) f1 = new Date(f1.getTime() + 86400000);
    b.push({beispiel: "Rechnung vom " + datumText(d) + ": Der " + n + ". Tag danach ist " + datumText(f0) + (f1.getTime() !== f0.getTime() ? ", kein Werktag; fällig ist " + datumText(f1) : ", das Fälligkeitsdatum") + ". Danach folgen kostenlose Zahlungserinnerung, Mahnung, letzte Mahnung und Betreibung."});
    b.push((o.mahn
      ? "Für die Mahnung schuldet der Einsatzbetrieb " + VW.chf(o.mahn[0]) + ", für die letzte " + VW.chf(o.mahn[1]) + ", als Konventionalstrafe: ohne Nachweis eines Schadens, bei Übermass vom Gericht herabsetzbar (Art. 160, 163 Abs. 3 OR)." + (o.mahn[0] !== 10 || o.mahn[1] !== 20 ? " Die Grundfassung nennt CHF 10 und CHF 20." : "")
      : "Mahngebühren sind nicht gewählt; Mahnungen kosten nichts, es bleiben Verzugszins und Betreibungskosten.") +
      " Die Kosten einer Betreibung trägt der Einsatzbetrieb (Art. 68 SchKG).");
    b.push(o.verrechnung
      ? "Mit dem Verrechnungsverzicht (Art. 126 OR) kürzt der Einsatzbetrieb keine Rechnung um eigene Forderungen, etwa für einen behaupteten Schaden; er macht sie getrennt geltend. Einwendungen nach Ziff. {Z:rapport} bleiben möglich."
      : "Ohne Verrechnungsverzicht kann der Einsatzbetrieb eine Gegenforderung mit einer Rechnung verrechnen, auch eine bestrittene (Art. 120 OR); der Streit darüber verzögert dann die Zahlung.");
    b.push(o.zurueck
      ? "Ist eine fällige Rechnung offen, kann der Verleiher nach Mitteilung per E-Mail die Arbeit an weiteren Tagen zurückhalten (nach dem Gedanken von Art. 82 OR); den Lohn schuldet er weiter. Endgültig ist die Kündigung auf sofort (Ziff. {R:kuend.sofort})."
      : "Zurückhalten und Kündigung auf sofort sind nicht gewählt; bei offenen Rechnungen bleiben Mahnung, Betreibung und die Kündigung nach Ziff. {R:kuend.frist}.");
    b.push({quellen: [art("OR", "102", "Abs. 2"), art("OR", "104", "Abs. 1"), art("OR", o.verrechnung ? "126" : "120"), art("OR", "160"), art("OR", "82"), art("SchKG", "68")]});
    return b;
  };

  /* ---------- D. Störungen ---------- */

  E.absage = function (o, f) {
    var n = o.absage, ord = VW.ORDINAL[n], frist = 3 - n, vor = frist < 0, fWt = WT[(frist + 5) % 5] + (vor ? " der Vorwoche" : "");
    var b = [
      "Jede Mitteilung vor einem vereinbarten Tag, dass nicht gearbeitet wird, ist eine Absage, gleich aus welchem Grund; über den Grund wird so nicht gestritten. Was am Tag selbst geschieht, regelt Ziff. {Z:ausfall}. Die Absage ist ein Recht mit Preis: Der Verleiher schuldet den Lohn auch für abgesagte Tage (Art. 324 OR; SECO-Weisungen Ziff. 3.8.22), das Risiko fehlender Einsätze liegt bei ihm (AWA Thurgau). Eine späte Absage kostet darum je Werktag " + (o.tagesmin ? "das Tagesminimum" : "die Stunden je Wochentag") + ", nicht mehr, als der Tag gekostet hätte.",
      "Gewählt: ohne Kosten bis 17 Uhr am " + ord + " Werktag davor. " + (n === 1 ? "Die kürzeste Frist; der Verleiher hat kaum Vorlauf." : n === 2 ? "Der Werktag dazwischen dient der Planung von Werkzeug und Material." : "Mehr Vorlauf für den Verleiher; der Einsatzbetrieb muss früher planen.") + (n !== 2 ? " Die Grundfassung nennt den zweiten Werktag." : "") + " Eine Absage kostet höchstens " + VW.zahlwort(n) + (n === 1 ? " Werktag" : " Werktage"),
      "Eine Absage umfasst höchstens zehn zusammenhängende Werktage; so bleibt der Vertrag nicht mit Absagen offen, ohne dass bezahlt oder gekündigt wird. Längere Betriebsferien gehen mit Zustimmung des Verleihers. Weitere Tage sind Anfragen und erst mit Bestätigung per E-Mail vereinbart; eine Verschiebung ist Absage plus Anfrage.",
      {beispiel: "E-Mail am Dienstag um 18 Uhr für den Donnerstag; sie geht am Mittwoch zu (Ziff. {R:schluss.a}). Die Frist lief bis " + fWt + " 17 Uhr: " + (n === 1 ? "rechtzeitig, ohne Kosten." : "zu spät, in Rechnung kommt " + tagesWert(o, 3) + tagesBetrag(o, f, 3) + ".") +
        (o.kanton === "BE" ? " Für Dienstag, 30. März 2027 (nach Ostern) muss die E-Mail bis " + {1: "Donnerstag, 25. März", 2: "Mittwoch, 24. März", 3: "Dienstag, 23. März", 5: "Freitag, 19. März"}[n] + ", 17 Uhr zugehen." : "")},
      {quellen: [art("OR", "324"), SECO_W("3.8.22"), TG]}
    ];
    b[1] += "; spätere Tage sind im Zeitpunkt der Mitteilung noch rechtzeitig abgesagt.";
    return b;
  };

  E.ausfall = function (o, f) {
    var wert = o.tagesmin ? "das Tagesminimum" : "die Stunden je Wochentag";
    var b = [
      "Arbeitsausfall ist der vereinbarte Werktag, an dem der Arbeitnehmer wegen eines Hindernisses nicht oder nicht voll arbeiten kann: fehlendes Material, Wetter, ein Halt durch andere Unternehmen, Bauleitung oder Bauherrschaft. In Rechnung kommt mindestens " + wert + ", auch ohne Verschulden des Einsatzbetriebs. Grund: Das Betriebsrisiko trägt der Arbeitgeber, der Verleiher schuldet den Lohn weiter (Art. 324 OR; BGE 150 III 22; AWA Basel-Stadt, Merkblatt 15). Das Gesetz erlaubt, diese Gefahr vertraglich dem Einsatzbetrieb zuzuweisen (Art. 119 Abs. 3 OR); er organisiert die Baustelle und klärt mit den Beteiligten, wer das Hindernis verursacht hat.",
      "Wetter ist ein Hindernis wie jedes andere; eine Schlechtwetterentschädigung gibt es für Elektroinstallationen nicht (Art. 65 AVIV). Mit Ersatzarbeit (Bst. {B:ausfall.b}) rettet der Einsatzbetrieb den Tag; dann zählt die geleistete Arbeitszeit.",
      {tabelle: {kopf: ["Lage", "Regel", "In Rechnung"], zeilen: [
        ["Warten, danach geht es weiter", "Wartezeit, Ziff. {R:zeit.warte}", "geleistete Arbeitszeit"],
        ["Ersatzarbeit, auch auf anderer Baustelle", "Ersatzarbeit, Ziff. {R:ausfall.b}", "geleistete Arbeitszeit"],
        ["am Tag selbst geht nichts mehr", "Arbeitsausfall, Ziff. {R:ausfall.ausfall}", "mindestens " + wert],
        ["Mitteilung vor dem Tag", "Absage, Ziff. {R:absage.absage}", "nichts oder " + wert],
        ["Schliessung aller Baustellen durch Behörden", "höhere Gewalt, Ziff. {Z:hg}", "nichts"],
        ["Arbeitnehmer krank", "Verhinderung, Ziff. {Z:verh}", "nichts"]
      ]}},
      {beispiel: "Mittwoch 10 Uhr: Das Material kommt heute nicht, der Arbeitnehmer geht heim. In Rechnung kommt " + tagesWert(o, 2) + tagesBetrag(o, f, 2) + "."},
      {quellen: [art("OR", "324"), art("OR", "119", "Abs. 3"), bge("150 III 22"), BS]}
    ];
    return b;
  };

  E.verh = function (o) {
    return [
      "Bei Krankheit, Unfall oder Ferien ruht der Einsatz; der Verleiher stellt nichts in Rechnung und keinen anderen Arbeitnehmer. Am Tag, an dem die Verhinderung während der Arbeit eintritt, zählt nur die geleistete Arbeitszeit" + (o.tagesmin ? " (Ziff. {R:tm.frueh})" : "") + ". Den Lohn trägt der Verleiher (Art. 324a OR; Krankentaggeld nach GAV Art. 37), die Kosten stecken im Ansatz. Bei langer Verhinderung kann der Einsatzbetrieb mit " + VW.zahlwort(o.kuendigung) + " Werktagen kündigen (Ziff. {R:kuend.frist}).",
      "Der Einsatzbetrieb erfährt, dass und wie lange der Arbeitnehmer fehlt, den Grund nur mit dessen Zustimmung: Schon \"krank\" ist ein besonders schützenswertes Gesundheitsdatum (Art. 5 Bst. c DSG). Das Arztzeugnis erhält der Verleiher (GAV Art. 37.5). Ferien teilt der Verleiher vier Wochen im Voraus mit; den Zeitpunkt bestimmt der Arbeitgeber (Art. 329c Abs. 2 OR), mit Rücksicht auf den Einsatzbetrieb.",
      {quellen: [art("OR", "324a"), art("OR", "329c", "Abs. 2"), art("DSG", "5"), GAV("37")]}
    ];
  };

  E.hg = function (o) {
    return [
      "Ohne diese Ziffer fiele etwa die Schliessung aller Baustellen durch die Behörden unter den Arbeitsausfall, und der Einsatzbetrieb schuldete " + (o.tagesmin ? "das Tagesminimum" : "die Stunden je Wochentag") + ", obwohl der Verleiher bei einer allgemeinen behördlichen Massnahme keinen Lohn aus Annahmeverzug schuldet (BGE 150 III 22). Höhere Gewalt ist unvorhersehbar, aussergewöhnlich, kommt von aussen und lässt sich nicht abwenden (BGE 102 Ib 257); ein gewöhnlicher Herbststurm genügt wohl nicht (BGE 123 III 183). Beispiele, wenn alle Merkmale im Einzelfall erfüllt sind:",
      {liste: ["Erdbeben, Hochwasser, Lawine, Felssturz, aussergewöhnlicher Sturm", "Krieg, Aufruhr, Terroranschlag", "behördliche Schliessung aller Baustellen, Ausgangssperre, Epidemie mit Massnahmen", "grossflächiger, länger dauernder Stromausfall; Kontingentierung in einer Mangellage", "Generalstreik oder branchenweiter Streik bei Dritten"]},
      "Keine höhere Gewalt: gewöhnliches Wetter und Hindernisse auf der Baustelle (Ziff. {Z:ausfall}), Lieferengpässe, fehlendes Geld (Geldschulden werden nie unmöglich, BGer 4A_474/2009), Defekte an eigenen Geräten, Krankheit des Arbeitnehmers (Ziff. {Z:verh}), Absehbares. Die Wirkung reicht nur so weit und so lange, wie das Ereignis die Arbeit hindert; Geldschulden bleiben. Im Zweifel klären die Parteien es, bevor sich eine Seite darauf beruft.",
      {quellen: [{t: "BGE 102 Ib 257 E. 5"}, bge("123 III 183"), bge("150 III 22"), art("OR", "119")]}
    ];
  };

  /* ---------- E. Haftung, Versicherung und Sicherheit ---------- */

  E.haft = function () {
    return [
      "Der Verleiher schuldet die sorgfältige Auswahl, kein Ergebnis der Arbeit. Die Ergebnisverantwortung trägt der Einsatzbetrieb (Bundesrat, Weisungen Personalverleih, Ziff. 2.4); Nachbesserung und Preisminderung gibt es nicht (BBL, Merkblatt Abgrenzung, Kriterium 4). Beim Verleih einer Person besteht die Auswahl in der Qualifikation (Ziff. {R:an.qual}). Der anerkannte Wochenrapport begründet eine widerlegbare Vermutung, dass auf Weisung gearbeitet wurde (BGer 4A_377/2021).",
      "Schäden bei der Arbeit trägt der Einsatzbetrieb über seine Versicherung, wie bei eigenen Monteuren; er hält Verleiher und Arbeitnehmer schadlos, auch gegen den Rückgriff privater Versicherer und der Suva. Gegenüber Geschädigten wirkt die Klausel nicht; sie regelt, wer den Schaden am Ende trägt. Der letzte Satz von Bst. {B:haft.schaden} stützt sich auf Art. 112 Abs. 2 OR: Ein Dritter kann die Erfüllung eines Vertrags zu seinen Gunsten selbständig fordern, wenn es dem Willen der Parteien entspricht. Wie Gerichte das beim Personalverleih anwenden, ist nicht geklärt.",
      "Bei Absicht oder grober Fahrlässigkeit gilt die Schadloshaltung nicht; diese Haftung lässt sich nicht im Voraus wegbedingen (Art. 100 Abs. 1 OR).",
      {beispiel: "Leicht fahrlässig angebohrte Wasserleitung: Der Versicherer des Einsatzbetriebs zahlt und greift nicht auf Arbeitnehmer oder Verleiher zurück. Arbeit an einer Anlage ohne Freischalten gegen die Weisung der Kontaktperson: grobe Fahrlässigkeit, der Einsatzbetrieb kann Schadenersatz verlangen."},
      {quellen: [art("OR", "100", "Abs. 1"), art("OR", "112", "Abs. 2"), BBL, BR]}
    ];
  };

  E.vers = function () {
    return [
      "Der Verleiher versichert den Arbeitnehmer gegen Unfall bei der Suva (für Verleiher vorgeschrieben, Art. 66 Abs. 1 Bst. o UVG), mit Krankentaggeld (GAV Art. 37) und in der beruflichen Vorsorge; dazu hat er eine Betriebshaftpflichtversicherung für den Personalverleih. Solche Versicherungen schliessen Schäden an Sachen, die der Arbeitnehmer bearbeitet oder in Obhut hat, üblicherweise aus; diese Bearbeitungs- und Obhutsschäden versichert der Einsatzbetrieb (Bst. {B:vers.b}).",
      "Übliche Betriebshaftpflichtversicherungen des Einsatzbetriebs schliessen geliehene Arbeitnehmer ein; für den Arbeitnehmer ist das die Deckung gegenüber Dritten. Bei Fahrzeugen ist der Einsatzbetrieb Halter (Art. 58 SVG); er prüft die Ausweiskategorie (B bis 3500 kg, darüber C1) und trägt Kasko und Selbstbehalt.",
      {beispiel: "Eine Kabelrolle des Einsatzbetriebs reisst beim Einziehen: Bearbeitungsschaden, Sache seiner Versicherung. Ein fallendes Werkzeug verletzt einen Passanten: Die Haftpflicht des Einsatzbetriebs deckt den Arbeitnehmer."},
      {quellen: [{t: "Art. 66 UVG"}, {t: "Art. 58 SVG"}, {t: "Art. 3 VZV"}, GAV("37")]}
    ];
  };

  E.sicher = function (o) {
    var b = [
      "Der Einsatzbetrieb hat gegenüber dem Arbeitnehmer dieselben Pflichten zur Arbeitssicherheit wie gegenüber eigenen Mitarbeitern (Art. 10 VUV). Ablauf: vor dem Einsatz Anforderungsprofil (Ziff. {R:an.c}) und nötige Schutzausrüstung klären; am ersten Tag und auf jeder neuen Baustelle instruieren (Fluchtwege, Absperrungen, Freischaltung, Geräte), während der Arbeitszeit (Art. 6 VUV); bei jeder wesentlichen Änderung erneut; am Ende Schlüssel und Badges zurück."
    ];
    if (o.werkzeug) {
      b.push("Gewählt: Der Arbeitnehmer bringt persönliche Grundausrüstung, Handwerkzeug und Kleingeräte mit, im Ansatz enthalten. Material, Grossgeräte, Gerüste und einsatzbezogene Schutzausrüstung (Störlichtbogen-Schutz, Absturzsicherung) stellt der Einsatzbetrieb. Eigenes Werkzeug kann gegen Verleih sprechen (Art. 26 Abs. 2 Bst. b AVV; BBL, Kriterium 3), ist aber ein Merkmal unter mehreren; darum nur Handwerkzeug und Kleingeräte. Stellt der Einsatzbetrieb einen abschliessbaren Raum, haftet er dort wie bei einer Hinterlegung (Art. 472 OR).");
    } else {
      b.push("Gewählt: Der Einsatzbetrieb stellt alles, auch Grundausrüstung und Werkzeug. Das stärkt das Bild des Verleihs, weil mit seinen Werkzeugen gearbeitet wird (Art. 26 Abs. 2 Bst. b AVV); die Kosten trägt er selbst. In der Grundfassung bringt der Arbeitnehmer sie mit, im Ansatz enthalten.");
    }
    b.push("Bei Gefahr stoppt der Arbeitnehmer die Arbeit und teilt es der Kontaktperson mit (Suva: \"STOPP bei Gefahr\"). Bis zur Lösung gilt Ziff. {Z:ausfall}: Ersatzarbeit oder " + (o.tagesmin ? "das Tagesminimum" : "die Stunden je Wochentag") + ".");
    b.push({quellen: [art("VUV", "10"), art("VUV", "6"), art("AVV", "26", "Abs. 2"), SUVA, STEC]});
    return b;
  };

  /* ---------- F. Dauer und Schluss ---------- */

  function kuendEnde(k) {
    var d = 0, i;
    for (i = 0; i < k; i++) { d++; if (d % 7 === 5) d += 2; }
    var w = Math.floor(d / 7), name = WT[d % 7];
    return w === 0 ? name : w === 1 ? name + " der folgenden Woche" : name + " in " + VW.zahlwort(w) + " Wochen";
  }

  E.kuend = function (o, f) {
    var k = o.kuendigung, n = o.absage, ende = VW.datum(feld(f, "a-ende")), tw = o.tagesmin ? "das Tagesminimum" : "die Stunden je Wochentag";
    var b = [
      "Nennt das Einsatzblatt ein Ende" + (ende ? " (" + ende + ")" : "") + ", endet der Vertrag ohne Kündigung. Das Ende ist ein Datum; \"bis die Arbeit fertig ist\" gilt als Einsatz ohne Ende (AWA Basel-Stadt, Merkblatt 15). Wird danach mit Wissen beider weitergearbeitet, gilt der Vertrag ohne Ende weiter. Das Arbeitsverhältnis berührt das Ende nicht: Bei der Leiharbeit wechselt mit einem Einsatz nur der Arbeitsort (AWA Thurgau).",
      k === 2 ? "Gewählt: zwei Werktage, gleich wie die Grundfrist der Absage, als Entgegenkommen auch bei langen Einsätzen; die Bitte um eine Woche Vorlauf ist unverbindlich. Mehr Sicherheit erhält der Verleiher nur über ein Ende im Einsatzblatt."
        : "Gewählt: " + VW.zahlwort(k) + " Werktage. Der Verleiher hat mehr Vorlauf für einen neuen Einsatz, der Einsatzbetrieb bindet sich länger. Die Grundfassung nennt zwei Werktage.",
      {tabelle: {kopf: ["", "Absage", "Kündigung"], zeilen: [
        ["Zweck", "Pause an einzelnen Tagen", "Ende des Einsatzes"],
        ["Frist", "17 Uhr am " + VW.ORDINAL[n] + " Werktag davor", VW.zahlwort(k) + " Werktage, nur ohne Ende"],
        ["Kosten", "später " + tw + " je Werktag", "die Tage der Frist werden gearbeitet"],
        ["Umfang", "höchstens zehn zusammenhängende Werktage", "Tage der Frist absagbar nach Ziff. {R:absage.absage}"]
      ]}},
      {beispiel: "Kündigung per E-Mail am Montag um 16 Uhr: Die Frist läuft ab Dienstag, der Vertrag endet am " + kuendEnde(k) + "."}
    ];
    if (o.zurueck) b.push("Bleibt eine Rechnung nach der letzten Mahnung offen, kann der Verleiher auf sofort kündigen, ohne Nachfrist nach Art. 107 OR.");
    if (o.uebertritt === "frei") {
      b.push("Übertritt: Ein Verbot oder eine Erschwerung wäre nichtig (Art. 22 Abs. 2 AVG). Die Fassung verzichtet auf eine Entschädigung; ob der Arbeitnehmer übertritt, entscheidet er selbst.");
    } else {
      var e = zahl(feld(f, "k-entsch"));
      b.push("Übertritt mit Entschädigung" + (e ? " (" + chf(e) + ")" : "") + ": nur, wenn der Einsatz weniger als drei Monate gedauert hat und der Übertritt innert drei Monaten nach dem Ende erfolgt; höchstens Verwaltungsaufwand und Gewinn eines dreimonatigen Einsatzes, Bezahltes angerechnet (Art. 22 Abs. 3, 4 AVG). Ohne Entschädigung, wie in der Grundfassung, wäre der Übertritt frei.");
    }
    b.push({quellen: [art("AVG", "22", "Abs. 1 Bst. d"), art("AVG", "22", "Abs. 2 bis 4"), art("OR", "107"), TG, BS]});
    return b;
  };

  E.geheim = function () {
    return [
      "Die Geheimhaltung ist beidseitig und gilt nach dem Ende weiter, ohne Konventionalstrafe; den Arbeitnehmer verpflichtet der Verleiher, weil er mit dem Einsatzbetrieb keinen Vertrag hat. Wer ein vertraglich zu wahrendes Geschäftsgeheimnis verrät, macht sich strafbar (Art. 162 StGB).",
      "Zum Einsatzbetrieb bearbeitet der Verleiher Firma, Adressen, Namen der Kontaktperson und weiterer Erklärender, Baustellen, Wochenrapporte sowie Rechnungs- und Zahlungsdaten. Empfänger sind die Bank, gegebenenfalls eine Treuhand, bei Zahlungsverzug das Betreibungsamt; Aufbewahrung zehn Jahre (Art. 958f OR). Das dient der Information nach Art. 19 DSG. Über den Arbeitnehmer erfährt der Einsatzbetrieb nur, was der Einsatz erfordert (Art. 18 Abs. 3 AVG).",
      "Kontrollen der paritätischen Organe: Die PLK kontrolliert den Verleiher (Art. 20 AVG). Eine Pflicht des Einsatzbetriebs mitzuwirken schafft erst Bst. {B:geheim.d}, eng gefasst: Zutritt während der Arbeitszeit und Auskünfte zum Einsatz, etwa die Arbeitszeiten nach den Wochenrapporten, keine Lohndaten anderer Mitarbeiter.",
      {quellen: [art("StGB", "162"), art("DSG", "19"), art("AVG", "18", "Abs. 3"), art("OR", "958f"), art("AVV", "48d"), PLK]}
    ];
  };

  E.schluss = function (o) {
    var g = o.gericht;
    if (g === "ort" && !o.gerichtOrt) g = "leer";
    return [
      "Erklärungen gehen per E-Mail an die Adressen im Einsatzblatt; nach 17 Uhr oder an einem Tag, der kein Werktag ist, geht eine E-Mail am nächsten Werktag zu. Geprüft wird die Adresse, nicht die Vollmacht: Eine Absage vom Polier gilt, wenn sie von einer genannten Adresse kommt. Was dem Arbeitnehmer auf der Baustelle gesagt wird, ersetzt die E-Mail nicht.",
      "Ein Zusatz ist jede Änderung, die beide unterzeichnen, etwa eine Verlängerung oder ein neuer Ansatz. Eine Absage oder Zustimmung per E-Mail übt ein vorgesehenes Recht aus und ändert den Vertrag nicht. Nichtige Teile lassen den Rest gültig (Art. 20 Abs. 2 OR); Forderungen tritt keine Partei ohne Zustimmung der anderen ab (Art. 164 OR).",
      (g === "einsatz" ? "Gewählt: Gerichtsstand am Sitz des Einsatzbetriebs, ein Entgegenkommen an ihn. Die Grundfassung nennt wie das SECO-Muster den Sitz des Verleihers."
        : g === "ort" ? "Gewählt: Gerichtsstand " + o.gerichtOrt + ", ein fester Ort, der bei einem Sitzwechsel bleibt. Die Grundfassung nennt den Sitz des Verleihers."
        : "Gewählt: Gerichtsstand am Sitz des Verleihers, wie im SECO-Muster." + (g === "leer" ? " Bei der Variante \"Ort\" fehlt die Ortsangabe; darum gilt der Sitz des Verleihers." : "")) +
        " Unter Unternehmen ist der Gerichtsstand frei vereinbar (Art. 17 ZPO); die Betreibung läuft am Sitz des Schuldners (Art. 46 SchKG).",
      {beispiel: "Absage am Montag um 17.20 Uhr per E-Mail: Sie geht am Dienstag zu. Sagt die Kontaktperson dem Arbeitnehmer mündlich ab, ist das eine Absage; ohne Kosten erst mit rechtzeitiger E-Mail."},
      {quellen: [art("OR", "20", "Abs. 2"), art("OR", "164"), art("ZPO", "17"), art("SchKG", "46")]}
    ];
  };
})(typeof window !== "undefined" ? window : globalThis);
