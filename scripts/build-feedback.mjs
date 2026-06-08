#!/usr/bin/env node
// L-V411 Vaihe B — BUILD-TIME feedback templates.
//
// Emits data/feedback/{es,de,fr}.json, consumed at runtime by
// lib/feedbackTemplates.js to replace the per-completion callOpenAI tutor
// message in routes/curriculum.js /complete. Zero runtime AI for discrete
// lessons.
//
// Structure (maps to the brief's "sävy-bucket × band × konsepti(valinnainen)"):
//   bands:        tone(3) × band(3) base templates, language-agnostic Finnish.
//                 Each cell has tm/mp (generic, interpolates {aihe}) and
//                 tm_concept/mp_concept (interpolates {konsepti} + {hint}).
//   kertaustesti: pass/fail × tone(3) — whole-course review, not single-concept.
//   concepts:     per-language { key: {label, hint} } for the grammar concepts
//                 that actually appear in that language's item bank. The hint is
//                 the concept-specific pedagogy (the part that matters). Vocab
//                 concepts are intentionally omitted -> they fall back to the
//                 generic {aihe} template (a vocab "rule hint" adds nothing).
//
// All strings authored by hand and run through the humanizer rules (no em-dash,
// no "kalibroitu/intuitiivinen", no sycophantic openers, no rule-of-three, no
// fabricated stats, sinä-muoto, max ~2 sentences). Hand-authoring beats the
// brief's AI-draft plan: higher quality, fully deterministic, no API cost.
//
// Tone buckets follow lib/curriculumProgress.js TONE_DESCRIPTORS:
//   I_A   = grades I, A  -> warm, no shame, name a concrete win
//   B_C   = grades B, C  -> direct + warm, name what is strong + one fix
//   M_E_L = grades M,E,L -> high bar, demanding but warm, nuance decides
//
// Placeholders: {aihe} lesson focus, {konsepti} concept label (sentence-initial,
// so labels stay capitalised), {hint} concept rule clause, {seuraava} next-step
// phrase, {kurssi} course name, {seuraava_kurssi} next course title.
//
// Re-run by hand: node scripts/build-feedback.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "data", "feedback");
const LANGS = ["es", "de", "fr"];

// ── tone × band base templates (shared Finnish) ─────────────────────────────
const BANDS = {
  mastered: {
    I_A: {
      tm: "{aihe} sujui sinulta nyt hyvin, ja se näkyy vastauksissa. Jatketaan tästä rauhassa {seuraava}.",
      tm_concept: "{konsepti} meni sinulta hyvin tällä kertaa. Hyvä pohja, jatketaan {seuraava}.",
      mp: "Huomaat varmaan itsekin, että {aihe_low} alkaa sujua ilman että sitä tarvitsee miettiä joka kohdassa.",
      mp_concept: "{konsepti} ei enää kompastele samalla tavalla kuin alussa, ja sen huomaa vauhdista.",
    },
    B_C: {
      tm: "{aihe} on sinulla hyvin hallussa. Siirrytään {seuraava}.",
      tm_concept: "{konsepti} meni puhtaasti läpi. Jatketaan {seuraava}.",
      mp: "{aihe} alkaa olla automatisoitunutta, eli voit luottaa siihen myös kirjoittaessa.",
      mp_concept: "{konsepti} on hallussa myös soveltavissa tehtävissä, ei vain tunnistamisessa.",
    },
    M_E_L: {
      tm: "{aihe} on hallussa tavoitetasolla. Seuraavassa oppitunnissa pääset käyttämään sitä vaativammin.",
      tm_concept: "{konsepti} oli puhdas suoritus. Pidä sama tarkkuus, kun jatkat {seuraava}.",
      mp: "Tällä tasolla ratkaisee vivahde, ja juuri se oli sinulla kohdillaan.",
      mp_concept: "{konsepti} pysyi tarkkana myös niissä kohdissa joissa moni horjuu, eli hallinta on aitoa.",
    },
  },
  almost: {
    I_A: {
      tm: "{aihe} on jo hyvällä mallilla, pari kohtaa jäi auki. Otetaan ne uudestaan ennen etenemistä.",
      tm_concept: "{konsepti} on melkein hallussa. {hint} Palataan siihen vielä, niin se lukkiutuu.",
      mp: "Virheet osuivat lähelle toisiaan, eli kyse on yhdestä kohdasta jota kannattaa toistaa.",
      mp_concept: "Suurin osa virheistä liittyi samaan kohtaan, ja sitä toistamalla loppukin loksahtaa.",
    },
    B_C: {
      tm: "{aihe} on lähes kunnossa, pari kohtaa jäi horjumaan. Korjataan ne ennen etenemistä.",
      tm_concept: "{konsepti} jäi vielä horjumaan. {hint} Sen toistaminen riittää, perusasiat ovat jo paikallaan.",
      mp: "Virheet eivät olleet sattumaa vaan osuivat samaan rakenteeseen, eli tiedät mihin keskittyä.",
      mp_concept: "Virheet osuivat juuri tähän rakenteeseen, joten kohdistettu toisto vie sinut nopeasti yli.",
    },
    M_E_L: {
      tm: "{aihe} on lähellä tavoitetasoa, mutta yksi kohta jäi auki. Hio se ennen etenemistä.",
      tm_concept: "{konsepti} on lähes tarkka. {hint} Viimeistele se, niin se kestää myös YO-tason tehtävässä.",
      mp: "Ero hyvän ja erinomaisen välillä on tässä yhdessä kohdassa, jonka jo tunnistat.",
      mp_concept: "Virheet osuivat juuri siihen vivahteeseen joka erottaa tavoitetason hyvästä yrityksestä.",
    },
  },
  struggling: {
    I_A: {
      tm: "{aihe} tuntuu vielä hankalalta, ja se on tässä vaiheessa ihan normaalia. Otetaan se rauhassa uudestaan.",
      tm_concept: "{konsepti} kaipaa vielä toistoa. {hint} Ei hätää, palataan siihen ensi kerralla.",
      mp: "Tämä on rakenne joka aukeaa toistamalla, ei uutta sääntöä opettelemalla.",
      mp_concept: "Virheet keskittyivät yhteen kohtaan, joten sitä kannattaa harjoitella vähän kerrallaan.",
    },
    B_C: {
      tm: "{aihe} kaipaa vielä työtä, eikä siinä ole mitään ihmeellistä tässä kohtaa kurssia. Käydään se läpi rauhassa.",
      tm_concept: "{konsepti} ei ole vielä hallussa. {hint} Otetaan se uudestaan ennen kuin vaikeustaso nousee.",
      mp: "Rakenne vaatii toistoa, ei uutta teoriaa, eli olet oikealla tiellä kun palaat siihen.",
      mp_concept: "Suurin osa virheistä liittyi yhteen rakenteeseen, joten sieltä kannattaa aloittaa.",
    },
    M_E_L: {
      tm: "{aihe} ei ole vielä tavoitetasolla. Käydään rakenne kunnolla läpi, koska se tulee YO-tehtävässä vastaan.",
      tm_concept: "{konsepti} ei vielä kestä tavoitetasoa. {hint} Tähän kannattaa pysähtyä ennen etenemistä.",
      mp: "Tämä rakenne ei tällä tasolla saa jäädä arvailun varaan, joten se on nyt se kohta johon panostat.",
      mp_concept: "Tämä rakenne ratkaisee tavoitetasolla, joten kohdista toisto sinne.",
    },
  },
};

// ── kertaustesti pass/fail × tone (whole-course review) ─────────────────────
const KERTAUSTESTI = {
  pass: {
    I_A: {
      tm: "Kurssin {kurssi} kertaustesti meni läpi, ja sen eteen näit töitä. Jatketaan {seuraava_kurssi}.",
      mp: "Pääsit kokoamaan kurssin asiat yhteen, ja se on iso askel.",
    },
    B_C: {
      tm: "Kurssin {kurssi} kertaustesti meni läpi. Rakenteet ovat kasassa, jatketaan {seuraava_kurssi}.",
      mp: "Osasit yhdistää kurssin rakenteet samaan testiin, mikä on eri asia kuin yksittäin osaaminen.",
    },
    M_E_L: {
      tm: "Kurssin {kurssi} kertaustesti meni läpi tavoitetasolla. Pidä sama taso, kun siirryt {seuraava_kurssi}.",
      mp: "Kokonaisuus pysyi kasassa myös vaativissa kohdissa, eli pohja kantaa eteenpäin.",
    },
  },
  fail: {
    I_A: {
      tm: "Kurssin {kurssi} kertaustesti ei vielä mennyt läpi, eikä se haittaa. Harjoitellaan rakenteita vielä rauhassa ennen etenemistä.",
      mp: "Testi näytti mitkä kohdat kaipaavat vielä toistoa, ja se on hyödyllinen tieto.",
    },
    B_C: {
      tm: "Kurssin {kurssi} kertaustesti ei vielä mennyt läpi. Käydään heikoimmat rakenteet läpi ennen kuin siirrytään seuraavaan kurssiin.",
      mp: "Testi paljasti mihin rakenteisiin kannattaa palata, joten tiedät mistä jatkaa.",
    },
    M_E_L: {
      tm: "Kurssin {kurssi} kertaustesti ei vielä yltänyt tavoitetasolle. Otetaan horjuvat rakenteet uudestaan ennen etenemistä.",
      mp: "Erot tulivat muutamasta rakenteesta, joten kohdistettu kertaus riittää nostamaan tason.",
    },
  },
};

// ── per-language grammar concepts (label sentence-initial, hint = pedagogy) ──
const CONCEPTS = {
  es: {
    subjunctive:         { label: "Subjunktiivi", hint: "epävarmuus, toive tai tunne que:n jälkeen laukaisee subjunktiivin." },
    ojala_expression:    { label: "Ojalá ja subjunktiivi", hint: "ojalá vaatii aina subjunktiivin perään." },
    ser_estar:           { label: "Ser ja estar", hint: "ser kuvaa pysyvää ominaisuutta, estar tilaa tai paikkaa." },
    preterite_imperfect: { label: "Preteriti ja imperfekti", hint: "preteriti kertoo mitä tapahtui, imperfekti millaista oli tai mikä jatkui." },
    past_tenses:         { label: "Menneet aikamuodot", hint: "mieti ensin onko kyse kertaluontoisesta teosta vai taustasta." },
    conditional:         { label: "Konditionaali", hint: "konditionaalin pääte on -ría kaikilla persoonilla." },
    future:              { label: "Futuuri", hint: "futuurin päätteet ovat samat, vain epäsäännölliset kannat muuttuvat." },
    por_para:            { label: "Por ja para", hint: "por kertoo syyn tai keinon, para tarkoituksen tai määränpään." },
    gustar_verbs:        { label: "Gustar-rakenne", hint: "gustar taipuu pidettävän asian mukaan: me gusta, me gustan." },
    articles:            { label: "Artikkelit", hint: "el ja la sekä monikko los ja las seuraavat sanan sukua." },
    reflexive_verbs:     { label: "Refleksiiviverbit", hint: "refleksiivipronomini (me, te, se) tulee taipuvan verbin eteen." },
    relative_pronouns:   { label: "Relatiivipronominit", hint: "que viittaa sekä ihmisiin että asioihin, quien vain ihmisiin." },
    regular_verbs:       { label: "Säännölliset verbit", hint: "tarkista persoonan pääte: -o, -as, -a, -amos, -áis, -an." },
    irregular_verbs:     { label: "Epäsäännölliset verbit", hint: "epäsäännöllisen verbin kanta muuttuu, mutta päätteet pysyvät." },
    negation:            { label: "Kieltomuoto", hint: "no tulee verbin eteen, ja espanjassa kaksoiskielto on sallittu (no... nada)." },
    adjective_position:  { label: "Adjektiivit", hint: "adjektiivi tulee yleensä substantiivin jälkeen ja mukautuu sukuun." },
    pronouns:            { label: "Pronominit", hint: "objektipronomini tulee taipuvan verbin eteen." },
    connectors:          { label: "Konnektorit", hint: "porque vastaa kysymykseen miksi, pero ilmaisee vastakohdan." },
  },
  de: {
    preterite_imperfect: { label: "Perfekt ja Präteritum", hint: "Perfekt sopii puhuttuun (ich habe gemacht), Präteritum kirjoitettuun." },
    past_tenses:         { label: "Menneet aikamuodot", hint: "tarkista apuverbi: useimmat haben, liikkeen ja muutoksen verbit sein." },
    conditional:         { label: "Konjunktiv II", hint: "würde + infinitiivi tai vahva muoto hätte, wäre, käme ilmaisee epätodellisen." },
    future:              { label: "Futur I", hint: "Futur I on werden + infinitiivi, ja infinitiivi menee lauseen loppuun." },
    articles:            { label: "Artikkelit ja sijat", hint: "der, die, das muuttuu sijan mukaan: Akkusativissa der muuttuu deniksi." },
    ser_estar:           { label: "Haben ja sein", hint: "haben ilmaisee omistusta, sein olemista; Perfektin apuverbi valitaan verbin mukaan." },
    word_order:          { label: "Sanajärjestys", hint: "päälauseessa verbi on toisella paikalla, sivulauseessa lauseen lopussa." },
    passive_voice:       { label: "Passiivi", hint: "passiivi muodostuu werden + Partizip II." },
    gender_agreement:    { label: "Suvun ja sijan kongruenssi", hint: "artikkeli ja adjektiivin pääte seuraavat substantiivin sukua ja sijaa." },
    prepositions:        { label: "Prepositiot ja sijat", hint: "mit, von, zu ja bei vaativat Dativin." },
    reflexive_verbs:     { label: "Refleksiiviverbit", hint: "refleksiivipronomini on Akkusativissa: ich wasche mich." },
    relative_pronouns:   { label: "Relatiivilauseet", hint: "relatiivipronomini (der, die, das) vie verbin lauseen loppuun." },
    regular_verbs:       { label: "Säännölliset verbit", hint: "tarkista persoonan pääte: -e, -st, -t, -en, -t, -en." },
    irregular_verbs:     { label: "Epäsäännölliset verbit", hint: "vahvoilla verbeillä vokaali muuttuu: ich spreche, du sprichst." },
    negation:            { label: "Kielto", hint: "nicht kieltää verbin tai lauseen, kein kieltää substantiivin." },
    adjective_position:  { label: "Adjektiivit", hint: "attribuuttiadjektiivi saa päätteen ennen substantiivia." },
    pronouns:            { label: "Pronominit", hint: "persoonapronomini taipuu sijassa: ich, mich, mir." },
    connectors:          { label: "Konnektorit", hint: "weil ja dass vievät verbin loppuun, deshalb ja trotzdem kääntävät sanajärjestyksen." },
  },
  fr: {
    subjunctive:         { label: "Subjonctif", hint: "subjonctif tulee que:n jälkeen tahdon, tunteen tai epävarmuuden yhteydessä (il faut que, bien que)." },
    preterite_imperfect: { label: "Passé composé ja imparfait", hint: "passé composé kertoo mitä tapahtui, imparfait millaista oli tai mikä jatkui." },
    past_tenses:         { label: "Menneet aikamuodot", hint: "tarkista apuverbi: useimmat avoir, liikeverbit ja refleksiivit être." },
    conditional:         { label: "Conditionnel", hint: "conditionnel lisää imperfektin päätteen futuurikantaan (-rais, -rait)." },
    future:              { label: "Futur simple", hint: "futur simple lisää infinitiiviin päätteen: -ai, -as, -a, -ons, -ez, -ont." },
    articles:            { label: "Artikkelit", hint: "le, la ja les on määräinen, du, de la ja des partitiivi; kiellon jälkeen pelkkä de." },
    ser_estar:           { label: "Être ja avoir", hint: "être ilmaisee olemista, avoir omistusta; passé composéssa apuverbi vaihtelee." },
    gender_agreement:    { label: "Suvun ja luvun mukautus", hint: "adjektiivi ja partisiippi mukautuvat sukuun ja lukuun, usein -e ja -s." },
    prepositions:        { label: "Prepositiot", hint: "maa saa prepositiokseen en, au tai aux sukunsa ja lukunsa mukaan." },
    reflexive_verbs:     { label: "Refleksiiviverbit", hint: "refleksiivipronomini (me, te, se) tulee verbin eteen ja apuverbi on être." },
    relative_pronouns:   { label: "Relatiivipronominit", hint: "qui on subjekti, que objekti; dont korvaa de-rakenteen, où ajan tai paikan." },
    regular_verbs:       { label: "Säännölliset verbit", hint: "tarkista -er-verbin pääte: -e, -es, -e, -ons, -ez, -ent." },
    irregular_verbs:     { label: "Epäsäännölliset verbit", hint: "epäsäännöllisellä verbillä kanta muuttuu, opettele yleisimmät ulkoa." },
    negation:            { label: "Kieltomuoto", hint: "kielto on kaksiosainen: ne ennen verbiä ja pas sen jälkeen." },
    adjective_position:  { label: "Adjektiivit", hint: "useimmat adjektiivit tulevat substantiivin jälkeen ja mukautuvat sukuun." },
    pronouns:            { label: "Pronominit", hint: "objektipronomini tulee taipuvan verbin eteen." },
  },
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const lang of LANGS) {
  const payload = { bands: BANDS, kertaustesti: KERTAUSTESTI, concepts: CONCEPTS[lang] };
  fs.writeFileSync(
    path.join(OUT_DIR, `${lang}.json`),
    JSON.stringify(payload, null, 2) + "\n",
    "utf8"
  );
}
console.log(`Wrote ${LANGS.map((l) => `${l}.json`).join(", ")} to data/feedback/`);
console.log(`Concepts per lang: ${LANGS.map((l) => `${l}=${Object.keys(CONCEPTS[l]).length}`).join(", ")}`);
