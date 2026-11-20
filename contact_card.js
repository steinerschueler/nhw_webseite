/* "Kontakt speichern" on the home page: builds a vCard from the contact details already on the page (the
   structured data in the head and the phone link in the contact section) and hands it to the browser as a
   .vcf file. The details stay in one place, and the phone number never needs a second copy in the repo.
   Without JavaScript, or if a detail is missing, the button stays hidden. */
(function () {
  var button = document.getElementById("save-contact");
  var tel = document.querySelector('#kontakt a[href^="tel:"]');
  var ld = document.querySelector('script[type="application/ld+json"]');
  if (!button || !tel || !ld || !window.Blob || !window.URL || !URL.createObjectURL) return;
  var org;
  try { org = JSON.parse(ld.textContent); } catch (e) { return; }
  var person = org.founder || {};
  var adr = org.address || {};
  if (!person.name || !org.name || !org.email) return;

  // vCard 3.0 text values escape backslash, comma, semicolon and line breaks (RFC 2426, 4.)
  function esc(v) {
    return String(v || "").replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\;").replace(/\r?\n/g, "\\n");
  }
  var parts = String(person.name).split(" ");
  var given = parts.shift();
  var lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:" + esc(parts.join(" ")) + ";" + esc(given) + ";;;",
    "FN:" + esc(person.name),
    "ORG:" + esc(org.name),
    "TITLE:" + esc(person.jobTitle),
    "TEL;TYPE=CELL,VOICE:" + tel.getAttribute("href").replace(/^tel:/, ""),
    "EMAIL;TYPE=INTERNET,WORK:" + org.email,
    "URL:" + org.url,
    "ADR;TYPE=WORK:;;;" + esc(adr.addressLocality) + ";;" + esc(adr.postalCode) + ";Schweiz",
    "NOTE:" + esc("Personalverleih für Elektroinstallationsfirmen, " + ((org.areaServed || {}).name || "")),
    "END:VCARD"
  ];
  var file = lines.join("\r\n") + "\r\n";

  button.hidden = false;
  button.addEventListener("click", function () {
    var url = URL.createObjectURL(new Blob([file], { type: "text/vcard;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = "Naville Handwerk GmbH.vcf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  });
})();
