// Daily challenge, a curated micro-mission rotated deterministically by UTC day.
// Surfaces on the dashboard to give the student a concrete focus for today.
// Each challenge has a `mode` field that points at one of the existing modes;
// the dashboard wires the "Aloita →" button to navigate accordingly.

const CHALLENGES = [
  { mode: "writing", titleFi: "Viesti ystävälle", descFi: "Kirjoita 4 lausetta espanjaksi suunnitelmistasi viikonlopulle.", tag: "kirjoittaminen" },
  { mode: "grammar", titleFi: "Ser vai estar?", descFi: "Treenaa pysyvän ja tilapäisen tilan eroa kymmenellä lauseella.", tag: "kielioppi" },
  { mode: "vocab", titleFi: "Ympäristösanasto", descFi: "Opettele 8 ympäristöön liittyvää sanaa kontekstissa.", tag: "sanasto" },
  { mode: "reading", titleFi: "Lue espanjalainen artikkeli", descFi: "Vastaa kolmeen kysymykseen autenttisen tyylisestä YO-tekstistä.", tag: "luetun ymmärtäminen" },
  { mode: "grammar", titleFi: "Preteriti vs. imperfekti", descFi: "10 lausetta kontekstissa, kerto vs. kuvaus.", tag: "kielioppi" },
  { mode: "writing", titleFi: "Mielipidekirjoitus", descFi: "Kirjoita lyhyt mielipide aiheesta sosiaalinen media (3 lausetta).", tag: "kirjoittaminen" },
  { mode: "vocab", titleFi: "Yhteiskuntasanastoa", descFi: "8 sanaa yhteiskunnasta ja politiikasta, kontekstissa.", tag: "sanasto" },
  { mode: "grammar", titleFi: "Subjunktiivi 'ojalá' jälkeen", descFi: "Treenaa konditionaalin sijaan subjunktiivia toivomuksissa.", tag: "kielioppi" },
  { mode: "reading", titleFi: "Matkailuteksti", descFi: "Lue kuvaus ja vastaa, sanaston sijainti ja päätelmä.", tag: "luetun ymmärtäminen" },
  { mode: "writing", titleFi: "Sähköposti opettajalle", descFi: "Kirjoita kohtelias sähköposti, tuttavallinen rekisteri pois.", tag: "kirjoittaminen" },
  { mode: "vocab", titleFi: "Terveys-sanasto", descFi: "8 sanaa hyvinvoinnista, liikunnasta ja mielenterveydestä.", tag: "sanasto" },
  { mode: "grammar", titleFi: "Pronominien järjestys", descFi: "10 lausetta, 'me lo dijo' eikä 'lo me dijo'.", tag: "kielioppi" },
  { mode: "reading", titleFi: "Kulttuurihaastattelu", descFi: "Lue lyhyt haastattelu ja päättele kahden ilmauksen merkitys.", tag: "luetun ymmärtäminen" },
  { mode: "writing", titleFi: "Foorumiviesti", descFi: "Kirjoita 3 lauseen kommentti väitteeseen, perustele kanta.", tag: "kirjoittaminen" },
  { mode: "vocab", titleFi: "Työ-sanasto", descFi: "8 sanaa työstä, taloudesta ja tulevaisuudensuunnitelmista.", tag: "sanasto" },
  { mode: "grammar", titleFi: "Hay vai estar?", descFi: "10 lausetta olemassaolosta vs. sijainnista, 'hay' ei artikkelia.", tag: "kielioppi" },
  { mode: "writing", titleFi: "Suunnitelmat tulevaisuuteen", descFi: "Kirjoita 3 lausetta käyttäen 'voy a' tai 'pienso'.", tag: "kirjoittaminen" },
  { mode: "vocab", titleFi: "Matka-sanasto", descFi: "8 sanaa lentokentästä, majoituksesta ja kuljetuksista.", tag: "sanasto" },
  { mode: "grammar", titleFi: "Konditionaali kohteliaasti", descFi: "10 pyyntöä 'me gustaría' ja 'podrías' -muodoissa.", tag: "kielioppi" },
  { mode: "reading", titleFi: "Ympäristöartikkeli", descFi: "Lue ja vastaa, pääajatus, yksityiskohta, sanaston merkitys.", tag: "luetun ymmärtäminen" },
  { mode: "writing", titleFi: "Päiväkirjamerkintä", descFi: "Kirjoita 4 lausetta menneestä päivästä, preteriti + imperfekti.", tag: "kirjoittaminen" },
  { mode: "vocab", titleFi: "Kulttuurisanasto", descFi: "8 sanaa musiikista, taiteesta ja perinteistä.", tag: "sanasto" },
  { mode: "grammar", titleFi: "Suhteelliset pronominit", descFi: "10 lausetta, 'que', 'quien', 'donde' kontekstissa.", tag: "kielioppi" },
  { mode: "writing", titleFi: "Ohjeet tekemiseen", descFi: "Kirjoita 3-vaiheiset ohjeet käyttäen imperatiivimuotoa.", tag: "kirjoittaminen" },
  { mode: "vocab", titleFi: "Idiomeja ja sanontoja", descFi: "8 yleistä espanjankielistä idiomia esimerkkien kanssa.", tag: "sanasto" },
];

export function pickChallengeIndex(epoch = Date.now()) {
  const day = Math.floor(epoch / 86400000);
  return ((day % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length;
}

export function getDailyChallenge(epoch = Date.now()) {
  return CHALLENGES[pickChallengeIndex(epoch)];
}

export function getChallengeCount() {
  return CHALLENGES.length;
}

const DONE_KEY = "puheo_dailychallenge_done";

function dayNumber(epoch = Date.now()) {
  return Math.floor(epoch / 86400000);
}

function markDoneToday(epoch = Date.now()) {
  try { localStorage.setItem(DONE_KEY, String(dayNumber(epoch))); } catch { /* ignore */ }
}

// Called from dashboard.saveProgress after every session. Only flips the
// done flag when the just-completed mode matches today's challenge.
export function markModeCompletedToday(mode, epoch = Date.now()) {
  if (!mode) return;
  const c = getDailyChallenge(epoch);
  if (c && c.mode === mode) markDoneToday(epoch);
}
