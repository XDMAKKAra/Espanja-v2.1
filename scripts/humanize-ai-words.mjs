// Humanization pass 2: drop "tekoäly"/"AI" branding from user-facing
// landing copy per ship1_ai_slop_mistakes memory rule. 18-year-old buyers
// recognize AI-slop instantly; YTL-rubric language reads as product, not
// marketing.
import fs from "node:fs";

const replacements = [
  // SEO meta + JSON-LD descriptions — drop "tekoälyllä" / "tekoälyavusteinen"
  [/Espanjan YO-koe harjoittelu tekoälyllä/g, "Espanjan YO-koe ja kirjoitusten arviointi"],
  [/Ranskan YO-koe harjoittelu tekoälyllä/g, "Ranskan YO-koe ja kirjoitusten arviointi"],
  [/Saksan YO-koe harjoittelu tekoälyllä/g, "Saksan YO-koe ja kirjoitusten arviointi"],
  [/Tekoälyavusteinen /g, ""],
  [/tekoälyavusteinen /g, ""],

  // Hero subs
  [/Puheo on tekoälyvalmentaja, joka tuntee YO-rubriikin\./g,
   "Puheo arvioi kirjoituksesi samalla rubriikilla jolla YTL:n sensorit pisteyttävät kokeen."],
  [/Puheo on tekoälyvalmentaja, joka tuntee YTL:n rubriikin\./g,
   "Puheo arvioi kirjoituksesi YTL:n omalla rubriikilla."],

  // Pillar body — "Tekoäly arvioi kirjoituksesi YTL:n rubriikin mukaisesti"
  [/Tekoäly arvioi kirjoituksesi YTL:n rubriikin mukaisesti/g,
   "Saat kirjoituksesta YTL-rubriikin mukaisen arvion"],

  // CTA/feature bullets
  [/AI-arviointi YTL-rubriikilla/g, "YTL-rubriikin arviointi"],
  [/AI-arviointi yTL-rubriikilla/g, "YTL-rubriikin arviointi"],
  [/\+ AI-arviointi/g, "+ YTL-arviointi"],
  [/AI-arviointi/g, "YTL-rubriikin arviointi"],

  // Footer
  [/Tekoälyvalmentaja, joka tuntee YTL:n rubriikin\./g,
   "Lyhyen oppimäärän valmennus YTL:n rubriikilla."],
  [/Tekoälyvalmentaja, tulossa keväällä 2027\./g,
   "Lyhyen ranskan valmennus, avautuu keväällä 2027."],
  [/Tekoälyvalmentaja, tulossa syksyllä 2026\./g,
   "Lyhyen saksan valmennus, avautuu syksyllä 2026."],

  // Generic phrases in long meta descriptions
  [/Tekoälyvalmennus saksan YO-kokeen lyhyeen oppimäärään/g,
   "Lyhyen oppimäärän saksan YO-koevalmennus"],
  [/Tekoälyvalmennus ranskan YO-kokeen lyhyeen oppimäärään/g,
   "Lyhyen oppimäärän ranskan YO-koevalmennus"],
  [/Tekoälyvalmennus, joka noudattaa YTL:n rubriikin AI-arviointia/g,
   "Kirjoitusten arviointi YTL:n omalla rubriikilla"],

  // FAQ question about "Voiko tekoäly korvata oikean opettajan?" — keep, it's a real student question

  // Promotional puff
  [/Ei AI-trackingia/g, "Ei rubriikkiarviointia"],

  // Pricing card title fragments
  [/Tekoälyvalmentaja, joka tuntee YTL:n rubriikin\./g,
   "YTL:n rubriikilla pisteytetty kirjoitusten arviointi."],
];

const files = [
  "index.html",
  "pricing.html",
  "public/landing/espanja.html",
  "public/landing/saksa.html",
  "public/landing/ranska.html",
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
    const diffCount = orig.length - txt.length;
    fs.writeFileSync(f, txt);
    console.log(`${f}: ${diffCount} bytes diff`);
    total++;
  }
}
console.log(`Files changed: ${total}`);
