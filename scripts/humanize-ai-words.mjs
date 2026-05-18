// Humanization pass: drop "tekoäly"/"AI" branding from user-facing copy
// per ship1_ai_slop_mistakes memory rule. Educational/contextual uses
// (FAQ "Voiko tekoäly korvata opettajan?", vocabulary examples) are
// kept intentionally — only marketing/promotional uses are replaced.
import fs from "node:fs";

const replacements = [
  // Generic noun chains in SEO meta and JSON-LD descriptions
  [/Espanjan YO-koe harjoittelu tekoälyllä/g, "Espanjan YO-koe ja kirjoitusten arviointi"],
  [/Ranskan YO-koe harjoittelu tekoälyllä/g, "Ranskan YO-koe ja kirjoitusten arviointi"],
  [/Saksan YO-koe harjoittelu tekoälyllä/g, "Saksan YO-koe ja kirjoitusten arviointi"],
  [/Tekoälyavusteinen /g, ""],
  [/tekoälyavusteinen /g, ""],
  [/tekoälyvetoinen /g, ""],

  // Hero subs and section headlines
  [/Puheo on tekoälyvalmentaja, joka tuntee YO-rubriikin\./g,
   "Puheo arvioi kirjoituksesi samalla rubriikilla jolla YTL:n sensorit pisteyttävät kokeen."],
  [/Puheo on tekoälyvalmentaja, joka tuntee YTL:n rubriikin\./g,
   "Puheo arvioi kirjoituksesi YTL:n omalla rubriikilla."],
  [/Tekoälyvalmentaja, joka tuntee YTL:n rubriikin\./g,
   "Lyhyen oppimäärän valmennus YTL:n rubriikilla."],
  [/Tekoälyvalmentaja, tulossa keväällä 2027\./g,
   "Lyhyen ranskan valmennus, avautuu keväällä 2027."],
  [/Tekoälyvalmentaja, tulossa syksyllä 2026\./g,
   "Lyhyen saksan valmennus, avautuu syksyllä 2026."],

  // Pillar body
  [/Tekoäly arvioi kirjoituksesi YTL:n rubriikin mukaisesti/g,
   "Saat kirjoituksesta YTL-rubriikin mukaisen arvion"],

  // Feature bullets
  [/AI-arviointi YTL-rubriikilla/g, "YTL-rubriikin arviointi"],
  [/\+ AI-arviointi/g, "+ YTL-arviointi"],
  [/AI-arviointi/g, "YTL-rubriikin arviointi"],

  // Long meta description noun chains
  [/Tekoälyvalmennus saksan YO-kokeen lyhyeen oppimäärään/g,
   "Lyhyen oppimäärän saksan YO-koevalmennus"],
  [/Tekoälyvalmennus ranskan YO-kokeen lyhyeen oppimäärään/g,
   "Lyhyen oppimäärän ranskan YO-koevalmennus"],
  [/Tekoälyvalmennus, joka noudattaa YTL:n rubriikin AI-arviointia/g,
   "Kirjoitusten arviointi YTL:n omalla rubriikilla"],

  // app.html metas + UI fragments
  [/Puheo, tekoälyvetoinen sovellus espanjan YO-kokeeseen/g,
   "Puheo, espanjan YO-koevalmennus"],
  [/Harjoittele espanjan YO-koetta \(lyhyt oppimäärä\) tekoälyn avulla\./g,
   "Harjoittele espanjan YO-koetta lyhyellä oppimäärällä."],
  [/Adaptiivinen tekoälyharjoittelu ylioppilaskirjoituksiin/g,
   "Adaptiivinen harjoittelu lyhyen oppimäärän YO-kirjoituksiin"],
  [/Kirjoitustehtävä \+ YTL-kriteerien mukainen AI-arviointi/g,
   "Kirjoitustehtävä, pisteytys YTL-kriteerien mukaisesti"],
  [/Kirjoittaminen, YTL-kriteerien mukainen AI-arviointi/g,
   "Kirjoittaminen, YTL-kriteerien mukainen arviointi"],

  // App runtime loading copy
  [/Kirjoitustehtävät arvioidaan tekoälyllä/g,
   "Kirjoitustehtävät arvioidaan rubriikin mukaan"],

  // Blog footer boilerplate — appears in every blog post
  [/Puheo on suomalainen tekoälyavusteinen espanjan YO-kokeen valmennusalusta\./g,
   "Puheo on suomalainen YO-kokeen valmennusalusta lyhyen oppimäärän espanjaan, ranskaan ja saksaan."],

  // Blog body — softer mentions in articles
  [/Puheon tekoäly rakentaa sinulle/g, "Puheo rakentaa sinulle"],
  [/Puheon tekoäly tunnistaa/g, "Puheo tunnistaa"],
  [/tekoälyllä avustettu harjoittelu antaa suurinta hyötyä/g,
   "kohdistettu harjoittelu antaa suurinta hyötyä"],
  [/tekoälyavusteinen harjoittelualusta, joka tunnistaa heikot kohtasi/g,
   "harjoittelualusta, joka tunnistaa heikot kohtasi"],
  [/Puheo on tekoälyavusteinen espanjan YO-kokeen valmennusalusta\./g,
   "Puheo on lyhyen oppimäärän YO-koevalmennus espanjaan, ranskaan ja saksaan."],

  // Promotional puff
  [/Ei AI-trackingia/g, "Ei rubriikkiarviointia"],
];

const files = [
  "index.html",
  "pricing.html",
  "app.html",
  "public/landing/espanja.html",
  "public/landing/saksa.html",
  "public/landing/ranska.html",
  "blog/index.html",
  "blog/ser-vs-estar-milloin-kumpaakin.html",
  "blog/preteriti-vs-imperfekti-opas.html",
  "blog/por-vs-para-selkea-ero.html",
  "blog/ojala-subjunktiivi-yleisimmat-virheet.html",
  "blog/espanja-yo-koe-2026-lyhyt-oppimaara.html",
  "js/screens/fullExam.js",
];

let total = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let txt = fs.readFileSync(f, "utf8");
  const orig = txt;
  for (const [re, sub] of replacements) {
    txt = txt.replace(re, sub);
  }
  if (txt !== orig) {
    fs.writeFileSync(f, txt);
    console.log(`${f}: ${(orig.length - txt.length)} bytes diff`);
    total++;
  }
}
console.log(`Files changed: ${total}`);
