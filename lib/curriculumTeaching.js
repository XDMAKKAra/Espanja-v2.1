// L-V399 Vaihe C — teaching-page prompt + fallback builders extracted from
// routes/curriculum.js to shrink that god route file. Behavior-preserving:
// these are pure string builders (no routing, DB, or side effects), moved
// verbatim. HUMANIZER_RULES stays private; only the builders are exported.
import { KURSSI_META } from "./curriculum.js";

// L-V316b: prompts are prefixed with HUMANIZER_RULES so model output
// stops shipping the screenshot's slop tells (em-dashes in bullets,
// rule-of-four summary cards, fake-Finnish "yleisin ansa" tone).
const HUMANIZER_RULES = [
  "KIRJOITUSTYYLI, kovat kiellot (rikkominen = vastauksen hylkäys):",
  '  - ÄLÄ käytä em-dashia (—). Käytä pilkkua, kaksoispistettä, sulkeita tai erillistä virkettä. Tämä koskee otsikoita, taulukoita, esimerkkejä ja prosessitekstiä.',
  '  - ÄLÄ pakota asioita kolmen tai neljän bulletin listoiksi. Jos kaksi pointtia riittää, kaksi pointtia. Symmetria ei ole arvo.',
  '  - ÄLÄ käytä AI-brand-sanoja: kalibroitu, räätälöity, monipuolinen, intuitiivinen, saumaton, monisyinen, ydinmerkitys.',
  '  - ÄLÄ aloita sycophantilla ("Hienoa että opit X!", "Erinomainen kysymys!") äläkä päätä geneerisellä rohkaisulla ("Toivottavasti tämä auttoi!", "Onnea matkaan!").',
  '  - ÄLÄ käytä fake-Finnish AI-sanontoja: "yleisin ansa", "paljastaa persoonan", "kantaa merkityksen", "avaa polku". Kysy: kirjoittaisiko lukio-opettaja näin?',
  "",
  "POSITIIVINEN OHJE: kirjoita kuin lukio-opettaja. Lyhyt virke voittaa pitkän. Konkreettiset esimerkit (yo hablo, tú hablas) toimivat paremmin kuin abstraktit määritelmät. Saa olla suora ja epämuodollinen.",
  "",
].join("\n");

export function buildTeachingPrompt(lesson, kurssiKey) {
  const kurssiName = KURSSI_META[kurssiKey]?.name || kurssiKey;
  const focus = lesson.focus;

  if (lesson.type === "vocab") {
    return [
      HUMANIZER_RULES,
      "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
      "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
      "Älä mainitse abstrakteja tasoja (A/B/C/M/E/L). Älä käytä bullet-listoja paitsi taulukoissa.",
      "Käytä sinä-muotoa.",
      "",
      `Aihe: ${focus}`,
      `Konteksti: ${kurssiName}.`,
      "",
      "Kirjoita opetussivu Markdownina. Rakenne TARKASTI:",
      "# [Otsikko, sanastoaihe lyhyesti]",
      "[1 kappale (max 80 sanaa) selkokielistä suomea. Kerro mistä sanastosta on kyse, miksi se on tärkeä, ja miten YO-koe testaa sitä.]",
      "## Tärkeimmät sanat",
      "| Suomeksi | Espanjaksi | Esimerkki |",
      "|----------|-----------|-----------|",
      "[Listaa 8–12 ydinsanaa tästä aiheesta. Esimerkkisarakkeessa lyhyt lause espanjaksi.]",
      "## Muista nämä",
      "[2 tai 3 lausetta yleisimmistä sudenkuopista. Esim. ääntämys, kirjoitusasu tai sukumuoto.]",
      "## YO-vinkki",
      "[1 tai 2 lausetta YO-kokeen näkökulmasta. Mitä testataan, mitä kannattaa hallita.]",
      "",
      'Palauta JSON: { "contentMd": "..." }',
    ].join("\n");
  }

  if (lesson.type === "reading") {
    return [
      HUMANIZER_RULES,
      "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
      "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
      "Älä käytä bullet-listoja paitsi vinkkien kohdalla.",
      "Käytä sinä-muotoa.",
      "",
      `Aihe: ${focus}`,
      `Konteksti: ${kurssiName}.`,
      "",
      "Kirjoita lyhyt valmistautumissivu ENNEN luetun ymmärtämistehtävää. Rakenne TARKASTI:",
      "# [Otsikko, luetun ymmärtäminen aiheesta]",
      "[1 kappale (max 70 sanaa) selkokielistä suomea: rauhoita lukijaa, muistuta että koko tekstiä ei tarvitse ymmärtää sana sanalta. Mainitse mitä sanastoa kannattaa odottaa.]",
      "## Lukustrategia",
      "[Lyhyitä bullet-pointteja: silmäile ensin, etsi avainsanoja, vasta sitten yksityiskohdat.]",
      "## YO-vinkki",
      "[1 tai 2 lausetta YO-luetun ymmärtämisen näkökulmasta. Mitä monivalinnoissa testataan.]",
      "",
      'Palauta JSON: { "contentMd": "..." }',
    ].join("\n");
  }

  if (lesson.type === "writing") {
    return [
      HUMANIZER_RULES,
      "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
      "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
      "Käytä sinä-muotoa. Bullet-listoja saa käyttää rakenne-osassa.",
      "",
      `Aihe: ${focus}`,
      `Konteksti: ${kurssiName}.`,
      "",
      "Kirjoita opetussivu kirjoitustehtävälle. Rakenne TARKASTI:",
      "# [Tehtävän otsikko, esim. \"Kirjoita itsestäsi\"]",
      "[1 kappale (max 70 sanaa): mistä kirjoitat, mitkä aikamuodot oletettavasti tarvitset, mistä saat pisteitä.]",
      "## Vinkki rakenteeseen",
      "- [Aloitus: 1 lyhyt lause]",
      "- [Keskikohta: 1 lyhyt lause]",
      "- [Lopetus: 1 lyhyt lause]",
      "## Mistä saat pisteitä",
      "| Osa-alue | Mitä testataan |",
      "|----------|----------------|",
      "| Viestinnällisyys | [...] |",
      "| Kielen rakenteet | [...] |",
      "| Sanasto | [...] |",
      "| Kokonaisuus | [...] |",
      "## Esimerkkilause",
      "> [yksi malli-lause espanjaksi + suomennos suluissa]",
      "",
      'Palauta JSON: { "contentMd": "..." }',
    ].join("\n");
  }

  // grammar / mixed (default)
  return [
    HUMANIZER_RULES,
    "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
    "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
    "Älä mainitse abstrakteja tasoja (A/B/C/M/E/L). Älä käytä bullet-listoja paitsi taulukoissa.",
    "Älä kirjoita ylimääräisiä otsikoita. Käytä TARKASTI alla olevaa rakennetta.",
    "",
    `Aihe: ${focus}`,
    `Oppituntityyppi: ${lesson.type === "mixed" ? "yhdistelmä (kielioppi + sanasto)" : "kielioppi"}`,
    `Konteksti: ${kurssiName}.`,
    "",
    "Kirjoita opetussivu Markdownina. Rakenne TARKASTI:",
    "# [Otsikko, lyhyt ja konkreettinen, ei aikamuotojen latinaa]",
    "[1 kappale, max 80 sanaa, selkokielinen suomi, ilman jargonia]",
    "## Muodostus",
    "[Joko taulukko tai muutama lyhyt rivi. Vain jos aihe sitä vaatii.]",
    "## Esimerkki",
    "> [1 tai 2 lausetta espanjaksi, suomenkieliset käännökset suluissa]",
    "## YO-vinkki",
    "[1 tai 2 konkreettista lausetta siitä mitä YO-koe testaa tästä aiheesta.]",
    "",
    'Palauta JSON: { "contentMd": "..." }',
  ].join("\n");
}

export function buildTeachingFallback(lesson) {
  const focus = lesson.focus;
  const snippet = lesson.teaching_snippet || "";

  if (lesson.type === "vocab") {
    return [
      `# ${focus}`,
      "",
      snippet || `Tämä oppitunti käsittelee aihetta "${focus}". Opit ydinsanaston ennen harjoittelua.`,
      "",
      "## Tärkeimmät sanat",
      "",
      "| Suomeksi | Espanjaksi | Esimerkki |",
      "|----------|-----------|-----------|",
      "| (sanasto avautuu harjoittelun aikana) | … | … |",
      "",
      "## Muista nämä",
      "",
      "Kiinnitä huomiota oikeinkirjoitukseen ja sanan sukuun (el / la). Pieni ero kirjaimissa muuttaa merkityksen.",
      "",
      "## YO-vinkki 💡",
      "",
      "Sanasto-osiossa testataan sekä tunnistus (espanja → suomi) että tuotanto (suomi → espanja). Kannattaa hallita molemmat.",
    ].join("\n");
  }

  if (lesson.type === "reading") {
    return [
      `# ${focus}`,
      "",
      snippet || "Tämä on luetun ymmärtämisen tehtävä. Lue rauhassa — sinun ei tarvitse ymmärtää joka sanaa.",
      "",
      "## Lukustrategia",
      "",
      "- Silmäile teksti ensin nopeasti läpi.",
      "- Etsi avainsanoja jotka liittyvät kysymyksiin.",
      "- Lue sen jälkeen tarkemmin vain ne kohdat joissa vastaus on.",
      "",
      "## YO-vinkki 💡",
      "",
      "YO-luetun ymmärtämisessä monivalinnat testaavat usein synonyymejä — älä etsi tekstistä täsmälleen samoja sanoja kuin kysymyksessä.",
    ].join("\n");
  }

  if (lesson.type === "writing") {
    return [
      `# ${focus}`,
      "",
      snippet || `Tässä kirjoitustehtävässä harjoittelet aihetta "${focus}". Lue ohje rauhassa ennen kuin aloitat.`,
      "",
      "## Vinkki rakenteeseen",
      "",
      "- Aloita lyhyellä esittelyllä.",
      "- Kerro keskellä ydintieto tai tarina.",
      "- Päätä yhteenvetoon tai tunnelmaan.",
      "",
      "## Mistä saat pisteitä",
      "",
      "| Osa-alue | Mitä testataan |",
      "|----------|----------------|",
      "| Viestinnällisyys | Saatko viestin perille? |",
      "| Kielen rakenteet | Aikamuodot, sanajärjestys, sukumuoto. |",
      "| Sanasto | Aiheeseen sopiva sanavalinta. |",
      "| Kokonaisuus | Onko teksti sidottu yhteen? |",
      "",
      "## Esimerkkilause",
      "",
      "> Me llamo Anna y tengo diecisiete años. (Nimeni on Anna ja olen 17-vuotias.)",
    ].join("\n");
  }

  // grammar / mixed (default)
  return [
    `# ${focus}`,
    "",
    snippet || "Tämä aihe sisältää kielioppirakenteen, jota harjoitellaan tässä oppitunnissa.",
    "",
    "## Esimerkki",
    "",
    "> Harjoittelu alkaa heti: ratkaiset 8 lyhyttä tehtävää.",
    "",
    "## YO-vinkki 💡",
    "",
    "Tämä rakenne esiintyy YO-kokeen rakenteet-osiossa lähes joka vuosi.",
  ].join("\n");
}
