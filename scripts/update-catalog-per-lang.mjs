// Make catalog cards reflect actual per-language grammar focus, not just
// a translated title. Pulls accurate bodies from lib/curriculumData.js:
//   - Title varies per language (already done)
//   - Body now varies per language (NEW)
//   - landing-catalog-lang.js will swap both on language change
import fs from "node:fs";

// Per-language bodies, mirroring lib/curriculumData.js grammar_focus + theme.
const BODIES = {
  1: {
    es: "Tervehdykset, perhe, päivärytmi. Preesens säännölliset, ser/estar perusteet.",
    fr: "Tervehdykset, perhe, päivärytmi. Présent säännölliset (-er), määräiset artikkelit le/la/les, negaatio ne...pas.",
    de: "Tervehdykset, perhe, päivärytmi. Präsens säännölliset, artikkelit Nominativissa.",
  },
  2: {
    es: "Arki, ruoka, kulttuuri. Preesens epäsäännölliset, gustar-rakenne.",
    fr: "Arki, ruoka. Présent epäsäännölliset (être/avoir/aller/faire), partitiivit du/de la/des, suvun ja luvun kongruenssi.",
    de: "Arki, harrastukset, ruoka. Präsens epäsäännölliset, Akkusativ, modaaliverbit.",
  },
  3: {
    es: "Matkustaminen, kaupungit, suunnistus. Preteriti säännölliset ja yleisimmät epäsäännölliset.",
    fr: "Matkat ja muistot. Passé composé avoir/être-jako, partisiipin accord, prepositiot en/au/aux.",
    de: "Matkustaminen ja kulkuvälineet. Perfekt haben/sein, partisiipin perfekti, V2-sääntö.",
  },
  4: {
    es: "Lapsuus ja luonto. Imperfekti, preteriti vs imperfekti — YO-klassikko.",
    fr: "Lapsuus ja luonto. Imparfait ja passé composé vs imparfait, keskeytysrakenne.",
    de: "Lapsuus ja luonto. Präteritum (kirjoitettu kieli), Dativ-prepositiot, sivulauseet weil/dass.",
  },
  5: {
    es: "Tulevaisuus, työ, teknologia. Futuuri ja konditionaali.",
    fr: "Tulevaisuus, työ, teknologia. Futur simple ja proche, conditionnel présent (kohteliaisuusmuodot).",
    de: "Tulevaisuus, työ, teknologia. Futur I, wenn-sivulauseet, V-loppu sivulauseessa.",
  },
  6: {
    es: "Ympäristö ja yhteiskunta. Subjunktiivin preesens (ojalá, es importante que), mielipidekirjoitus.",
    fr: "Ympäristö ja yhteiskunta. Subjonctif présent (il faut que, je veux que, bien que), mielipiteen ilmaisu.",
    de: "Ympäristö ja yhteiskunta. Passiivi (werden + Partizip II), Konjunktiv II kohteliaisuusmuodot.",
  },
  7: {
    es: "Kulttuuri, media. Subjunktiivi syvemmin, pluskvamperfekti.",
    fr: "Kulttuuri, taide. Plus-que-parfait, subjonctif syvemmin, suhteelliset pronominit qui/que/dont/où.",
    de: "DACH-kulttuuri ja media. Konjunktiv II (wenn ich hätte), Genitiv perusteet, sivulauseet obwohl/damit.",
  },
  8: {
    es: "Mallikokeet aikarajalla, YTL-rubriikilla pisteytetyt simulaatiot, subjunktiivi imperfekti (si tuviera).",
    fr: "Mallikokeet aikarajalla. Si-hypoteesilauseet (présent/imparfait/plus-que-parfait + conditionnel), kertaus.",
    de: "Mallikokeet aikarajalla. Konjunktiv II syvemmin, indirekte Rede, kaikkien rakenteiden kertaus.",
  },
};

const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
let html = fs.readFileSync("index.html", "utf8");

for (let i = 0; i < 8; i++) {
  const n = i + 1;
  const numStr = numerals[i] + ".";
  const b = BODIES[n];
  // Match the existing card body (any text) and replace with i18n-attributed body.
  // Locate by card data-icon="N" (added in PR #68).
  const re = new RegExp(
    `(<li class="catalog-card" data-icon="${n}">[\\s\\S]*?<h3 class="catalog-card__title"[\\s\\S]*?</h3>\\s*)<p class="catalog-card__body">[^<]*</p>`,
    "m",
  );
  if (!re.test(html)) {
    console.error(`MISS card ${n} (${numStr})`);
    continue;
  }
  const i18nBody = `<p class="catalog-card__body" data-i18n="body-${n}" data-es="${b.es}" data-fr="${b.fr}" data-de="${b.de}">${b.es}</p>`;
  html = html.replace(re, `$1${i18nBody}`);
  console.log(`card ${n}: body i18n-ified`);
}

fs.writeFileSync("index.html", html);
console.log("done");
