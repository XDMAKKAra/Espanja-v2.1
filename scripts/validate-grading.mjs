// L-V349 / L-V350 / L-V351 — Blind validation of the writing-grading engine
// against YTL's official sample answers. Trilingual: Spanish (in-sample) +
// German + French (both held-out — never used to tune the prompt).
//
// L-V351 changes vs L-V350:
//   1. Grading model swapped to gpt-5.4-mini (harness-only; production default
//      in lib/openai.js is untouched until this run PASSes).
//   2. Few-shot anchoring: 6 real YTL-scored Spanish answers (lib/gradingAnchors)
//      are injected into the prompt as calibration references, and the model is
//      asked to score on the NATIVE YTL scale (0–33 short / 0–66 long) instead
//      of rescaling a 0–20 total.
//   3. Anti-leak: the 6 anchor answers are dropped from the Spanish test set
//      (isAnchorAnswer). German + French are fully held-out (anchors are
//      Spanish, so those languages never appear in the prompt).
//
// Pipeline (identical per language):
//   parse ground-truth txt → grade each case BLIND with the production
//   buildGradingPrompt + callOpenAI(gpt-5.4-mini, temp 0.2, json) +
//   processGradingResult → per-task-type metrics (MAE, ±2/±4, max miss,
//   Spearman ρ, bias) on the native YTL scale → compare to locked thresholds.
//
// Run:  node scripts/validate-grading.mjs            (all three: es+de+fr)
//       node scripts/validate-grading.mjs es         (one language)
// Needs OPENAI_API_KEY in .env. No DB writes (dev cache is in-memory).

import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildGradingPrompt, processGradingResult } from "../lib/writingGrading.js";
import { callOpenAI } from "../lib/openai.js";
import { buildFewShotBlock, isAnchorAnswer } from "../lib/gradingAnchors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDITS = join(ROOT, "docs", "audits");
const OUT_JSON = join(AUDITS, "2026-06-02-L-V351-grading-gpt54mini-fewshot.json");
const OUT_MD = join(AUDITS, "2026-06-02-L-V351-grading-gpt54mini-fewshot.md");
// L-V350 raw metrics = the "before" baseline (gpt-4o-mini, no few-shot).
const V350_JSON = join(AUDITS, "2026-06-02-L-V350-grading-calibration.json");

// Grading model for this run. Production (lib/openai.js OPENAI_MODEL) stays
// gpt-4o-mini until this harness PASSes — only the harness passes opts.model.
const GRADING_MODEL = "gpt-5.4-mini";

// Few-shot reference block (Spanish anchors) — built once, reused every language.
const FEWSHOT = buildFewShotBlock();

const SHORT = { charMin: 160, charMax: 240, points: 33 };
const LONG = { charMin: 300, charMax: 450, points: 66 };

// ── Pricing assumption for the €/100 estimate ───────────────────────────────
// gpt-5.4-mini list price is NOT hard-coded into the SDK — VERIFY before quoting
// to a customer. Token counts below are the real run; the € figure is tokens ×
// this assumed price (USD per 1M tokens, treated 1:1 as EUR).
const PRICE_IN_PER_M = 0.25;
const PRICE_OUT_PER_M = 2.00;

// ── Task definitions, keyed by [lang][taskType][taskNum] ───────────────────────
const TASK_DEFS = {
  es: {
    short: {
      1: { title: "En los probadores", situation: "Vaatekaupan sovituskopista löydät jonkun unohtaman espanjaksi kirjoitetun päiväkirjan. Ensimmäisellä sivulla on omistajan kuva ja sähköpostiosoite. Päätät lähettää hänelle sähköpostia.", prompt: "Escribe un correo electrónico en español al dueño del diario: cuenta qué ha pasado y cómo puede recuperarlo.", requirements: ["Kerro mitä on tapahtunut", "Kerro miten päiväkirjan voi saada takaisin", "Kohtelias sähköpostin rekisteri"], textType: "sähköpostiviesti" },
      2: { title: "Una nueva vecina", situation: "Naapuriisi on äskettäin muuttanut ikäisesi tyttö Meksikosta. Kirjoita hänelle espanjaksi kortti, jonka pudotat hänen postilaatikkoonsa.", prompt: "Escribe en español una tarjeta de bienvenida a tu nueva vecina: preséntate, ofrécele enseñarle lugares interesantes y presentarle a jóvenes de su edad.", requirements: ["Esittele itsesi", "Kerro mielenkiintoisista paikoista", "Mainitse samanikäiset nuoret"], textType: "kortti" },
      3: { title: "Un trabajador en prácticas", situation: "Espanjan kurssisi argentiinalaiselle harjoittelijalle Miguelille pidettiin läksiäisjuhla, mutta et ollut paikalla. Kirjoita hänelle kohtelias viesti.", prompt: "Escribe un mensaje cortés a Miguel explicando por qué no asististe a su fiesta de despedida. Empieza: Querido Miguel: y termina: Saludos,", requirements: ["Selitä miksi et ollut paikalla", "Kohtelias rekisteri", "Aloitus 'Querido Miguel:' ja lopetus 'Saludos,'"], textType: "viesti" },
      4: { title: "Mensaje a un amigo", situation: "Espanjankielinen ystäväsi on surullinen, sillä hänelle on tapahtunut jotakin ikävää. Kirjoita hänelle viesti auttaaksesi ja ilahduttaaksesi häntä.", prompt: "Escribe un mensaje a tu amigo para ayudarle y animarle. Usa lengua estándar y frases completas.", requirements: ["Osoita myötätuntoa", "Ilahduta ystävää", "Kokonaiset virkkeet, yleiskieli"], textType: "viesti" },
    },
    long: {
      1: { title: "#pequeñosactos #grandescambios", situation: "Espanjankielisessä sosiaalisessa mediassa keskustellaan siitä, miten maailmaa voi muuttaa pienin teoin. Kirjoita, mitä sinä olet tehnyt tai voit tehdä muuttaaksesi maailmaa.", prompt: "Escribe una publicación en redes sociales sobre qué has hecho o puedes hacer para cambiar el mundo con pequeños actos.", requirements: ["Kerro konkreettisia tekoja", "Perustele näkemyksesi", "Someteksti, ota kantaa"], textType: "some-julkaisu" },
      2: { title: "Un estudiante chileno", situation: "Luokallesi on tulossa chileläinen vaihto-opiskelija. Kirjoita osuus, jossa kerrot, mitä kotipaikkakunnallasi voi tehdä vapaa-ajalla ilmaiseksi tai edullisesti.", prompt: "Escribe un texto contando qué se puede hacer en tu ciudad en el tiempo libre de forma gratuita o barata.", requirements: ["Useita ilmaisia tai edullisia aktiviteetteja", "Kuvaile paikkoja", "Sidosteinen teksti"], textType: "teksti" },
      3: { title: "Maneras de vivir", situation: "Seuraamallasi keskustelupalstalla puhutaan parhaasta asumismuodosta: vanhempien kanssa, yksin vai kavereiden kanssa. Kommentoi ja kerro oma näkemyksesi.", prompt: "Comenta en el foro cuál crees que es la mejor manera de vivir y por qué.", requirements: ["Ota kantaa", "Vertaile asumismuotoja", "Perustele näkemys"], textType: "foorumikommentti" },
      4: { title: "Un buen sitio para visitar", situation: "Kirjoita TripAdvisor-matkailusivustolle kuvaus jostakin kotikaupunkisi paikasta ja kerro, miksi suosittelet vierailemaan siellä.", prompt: "Escribe una reseña en TripAdvisor sobre un lugar de tu ciudad y explica por qué recomiendas visitarlo.", requirements: ["Kuvaile paikkaa", "Perustele suositus", "Arvostelutyyli"], textType: "TripAdvisor-arvio" },
    },
  },
  de: {
    short: {
      1: { title: "Neues Hobby (Facebook)", situation: "Saksalainen ystäväsi on aloittanut uuden harrastuksen. Kirjoita hänen Facebook-seinälleen kannustava viesti, jossa annat myös jonkin neuvon.", prompt: "Schreibe deinem Freund eine ermutigende Nachricht zu seinem neuen Hobby an seine Facebook-Pinnwand und gib ihm einen Rat.", requirements: ["Kannusta ystävää", "Anna jokin neuvo", "Sopiva some-rekisteri"], textType: "Facebook-viesti" },
      2: { title: "Abschiedsparty (Einladung)", situation: "Vaihto-oppilasvuotesi Saksassa lähestyy loppuaan. Kirjoita koulutovereillesi kutsu pieneen jäähyväisjuhlaan.", prompt: "Schreibe deinen Mitschülern eine Einladung zu einer kleinen Abschiedsparty.", requirements: ["Kutsu jäähyväisjuhlaan", "Mainitse käytännön tiedot", "Sopiva rekisteri"], textType: "kutsu" },
      3: { title: "Wetter & Treffen (WhatsApp)", situation: "Olet suunnitellut tapaavasi saksankielisen ystäväsi perjantai-iltana tai lauantaina. Torstaina näet säätiedotuksen. Kirjoita WhatsApp-viesti, jossa viittaat tulevaan säähän sekä ehdotat, mitä voisitte tehdä ja milloin.", prompt: "Schreibe deinem Freund eine WhatsApp-Nachricht: beziehe dich auf das kommende Wetter und schlage vor, was ihr machen könntet und wann.", requirements: ["Viittaa tulevaan säähän", "Ehdota tekemistä", "Ehdota ajankohtaa"], textType: "WhatsApp-viesti" },
    },
    long: {
      1: { title: "Begegnung in der U-Bahn (Dialog)", situation: "Kohtaat metrossa ikäisesi nuoren, joka on hyvännäköinen ja vaikuttaa mielenkiintoiselta. Mene juttelemaan. Kirjoita vuoropuhelu.", prompt: "Du triffst in der U-Bahn einen interessanten gleichaltrigen Menschen. Schreibe den Dialog eures Gesprächs.", requirements: ["Aloita keskustelu luontevasti", "Pidä vuoropuhelu käynnissä", "Sopiva rekisteri"], textType: "vuoropuhelu" },
      2: { title: "Leserbrief: Urlaub mit Kindern", situation: "Vastaa lukijakirjeeseen: perhe on aina lomaillut lasten toiveiden mukaan (chillaus, uinti, wlan), nyt vanhemmat haluaisivat kulttuuria, mutta lapset eivät suostu. Pitäisikö varata sittenkin ranta?", prompt: "Antworte auf den Leserbrief von Martin S.: gib einen begründeten Rat, wie die Familie Kultur und die Wünsche der Kinder verbinden kann.", requirements: ["Ota kantaa pulmaan", "Perustele neuvosi", "Sopiva rekisteri lukijakirjevastauksessa"], textType: "lukijakirjevastaus" },
      3: { title: "Wie war dein Sommer (Bildergeschichte)", situation: "Ystäväsi haluaa tietää, miten kesälomasi sujui. Kirjoita oheisten lomakuviesi avulla, mitä matkalla tapahtui (lento, vuokra-auto, kolari, pyörät, jne.).", prompt: "Schreibe deinem Freund anhand deiner Urlaubsbilder, was in den Sommerferien auf der Reise passiert ist.", requirements: ["Kerro mitä matkalla tapahtui", "Käytä mennyttä aikaa johdonmukaisesti", "Sidosteinen kerronta"], textType: "viesti" },
    },
  },
  fr: {
    short: {
      1: { title: "Pardon !", situation: "Olet joutunut lähtemään kesken ranskalaisen ystäväsi syntymäpäiväjuhlista. Kirjoita hänelle Facebook-viesti, jossa pyydät anteeksi ja selität, mikä sai sinut poistumaan yllättäen.", prompt: "Écris un message Facebook à ton ami(e): demande pardon d'être parti(e) de sa fête d'anniversaire et explique ce qui t'a fait partir soudainement.", requirements: ["Pyydä anteeksi", "Selitä miksi lähdit yllättäen", "Sopiva some-rekisteri"], textType: "Facebook-viesti" },
      2: { title: "Silence !", situation: "Osallistut ranskan kesäkurssille Toulousessa ja asut asuntolassa. Naapurisi aiheuttama melu häiritsee sinua. Kirjoita hänelle viesti pudotettavaksi hänen postilaatikkoonsa.", prompt: "Écris un message à ton voisin de résidence au sujet du bruit qu'il fait et demande-lui d'en faire moins.", requirements: ["Kerro melusta", "Pyydä vähentämään melua", "Kohtelias rekisteri"], textType: "viesti" },
      3: { title: "Au restaurant", situation: "Olet käynyt ravintolassa, josta pidit erityisesti. Koulussasi on ranskalainen vaihto-oppilas, jolle haluat lähettää ääniviestin kehottaaksesi häntä käymään kyseisessä ravintolassa.", prompt: "Écris (sous forme de message vocal) à l'élève d'échange pour lui recommander un restaurant où tu es allé(e) et que tu as aimé.", requirements: ["Kerro ravintolasta", "Suosittele käymään", "Sopiva puhuttu rekisteri"], textType: "ääniviesti" },
    },
    long: {
      1: { title: "Ma meilleure soirée d'été", situation: "Nuortenlehti Phosphore valmistelee lokakuun numeroa ja pyytää lukijoita lähettämään kesämuiston otsikolla 'Ma meilleure soirée d'été'. Kirjoita oma kesämuistosi.", prompt: "Écris ton souvenir d'été « Ma meilleure soirée d'été » à envoyer au magazine Phosphore.", requirements: ["Kerro yhdestä kesäillasta", "Kuvaile mitä tapahtui", "Sidosteinen kerronta"], textType: "lehtiteksti" },
      2: { title: "La journée mondiale des animaux", situation: "Olet vaihto-oppilaana Ranskassa ja pidät koulussasi puheen kansainvälisenä eläinten päivänä 4. lokakuuta. Kirjoita puheesi ranskaksi.", prompt: "Écris ton discours en français pour la Journée mondiale des animaux (le 4 octobre).", requirements: ["Pidä puhe eläinten päivänä", "Perustele miksi eläimet ovat tärkeitä", "Puheen rekisteri"], textType: "puhe" },
      3: { title: "Au pair", situation: "Perheesi haluaa löytää ranskankielisen au pairin pikkusisaruksiasi hoitamaan. Kirjoita au paireja välittävälle sivustolle viesti, jossa kerrot, mitä perheesi odottaa au pairilta.", prompt: "Écris un message sur un site d'au pair: explique ce que ta famille attend d'un(e) au pair.", requirements: ["Kuvaile mitä perhe odottaa", "Kerro tehtävistä", "Ilmoitusrekisteri"], textType: "ilmoitus" },
    },
  },
};

// ── Parsers ────────────────────────────────────────────────────────────────────
function clean(s) {
  return s.replace(/^====\s*PAGE\s*\d+\s*====\s*$/gm, "").replace(/\r/g, "");
}

// Spanish: "Aihe N: title" → answer → "PISTEET: NN" → rationale. Long answers
// live after the SECOND "Laajempi kirjoitustehtävä" header.
function parseSpanish(raw) {
  const text = clean(raw);
  const longBoundary = text.lastIndexOf("Laajempi kirjoitustehtävä");
  if (longBoundary < 0) throw new Error("ES: long-section boundary not found.");
  const re = /Aihe\s*(\d+)\s*:\s*([^\n]*)\n([\s\S]*?)PISTEET:\s*(\d+)\s*([\s\S]*?)(?=Aihe\s*\d+\s*:|Laajempi kirjoitustehtävä|$)/g;
  const cases = [], unparsed = [];
  let m, i = 0;
  while ((m = re.exec(text)) !== null) {
    i++;
    const taskNum = parseInt(m[1], 10);
    const answer = m[3].trim();
    const officialScore = parseInt(m[4], 10);
    const officialRationale = m[5].replace(/[ \t]+/g, " ").trim();
    const taskType = m.index > longBoundary ? "long" : "short";
    const def = TASK_DEFS.es[taskType]?.[taskNum];
    if (!def) { unparsed.push({ seq: i, taskType, taskNum, reason: "no task def" }); continue; }
    if (answer.length < 20) { unparsed.push({ seq: i, taskType, taskNum, reason: `answer ${answer.length} chars` }); continue; }
    // L-V351 anti-leak: anchor answers are in the prompt, so they can't be tests.
    if (isAnchorAnswer(answer)) { unparsed.push({ seq: i, taskType, taskNum, officialScore, reason: "few-shot anchor (excluded)" }); continue; }
    cases.push(mkCase("es", taskType, taskNum, def.title, answer, officialScore, officialRationale, cases));
  }
  return { cases, unparsed };
}

// German: each case begins "#NN" then optional task code (SC_LYH2 / SC_pidempi_3
// / "SC lyhyempi _ 1", sometimes glued to the answer). Finnish rationale always
// starts "- Viesti …"; score is "NN p." on its own line. Long answers live after
// the "PISTEYTYSSKAALA (0-66" / "PITEMPI TEHTÄVÄ" header.
const DE_CODE = /SC\s*[_ ]?\s*(?:LYH(?:YEMPI)?|LYHYEMPI|LYHYT|PIT(?:EMPI|EMPI)?|PIDEMPI|PITEMPI|LAAJEMPI)\s*[_ ]?\s*(\d)/i;
function parseGerman(raw) {
  const text = clean(raw);
  let longBoundary = text.search(/PISTEYTYSSKAALA\s*\(0-66/i);
  if (longBoundary < 0) longBoundary = text.search(/PITEMPI TEHTÄVÄ/i);
  if (longBoundary < 0) throw new Error("DE: long-section boundary not found.");

  const markers = [...text.matchAll(/#(\d+)/g)];
  const cases = [], unparsed = [];
  for (let k = 0; k < markers.length; k++) {
    const start = markers[k].index;
    const end = k + 1 < markers.length ? markers[k + 1].index : text.length;
    const block = text.slice(start, end);
    const tag = markers[k][1];

    const scoreMatch = block.match(/^[ \t]*(\d{1,2})\s*p\.\s*$/m);
    if (!scoreMatch) { continue; }
    const officialScore = parseInt(scoreMatch[1], 10);
    const beforeScore = block.slice(0, scoreMatch.index);

    const vMatch = beforeScore.match(/[-–]\s*Viesti\b/);
    let answerRegion, rationale;
    if (vMatch) {
      answerRegion = beforeScore.slice(0, vMatch.index);
      rationale = beforeScore.slice(vMatch.index).replace(/[ \t]+/g, " ").trim();
    } else {
      answerRegion = beforeScore;
      rationale = "";
    }

    const codeMatch = answerRegion.match(DE_CODE);
    const taskNum = codeMatch ? parseInt(codeMatch[1], 10) : null;
    const taskType = start > longBoundary ? "long" : "short";

    let answer = answerRegion
      .replace(/^\s*#?\s*\d+\s*/, "")
      .replace(DE_CODE, "")
      .replace(/^[\s_–-]+/, "")
      .trim();

    const def = taskNum && TASK_DEFS.de[taskType]?.[taskNum];
    if (!def) { unparsed.push({ seq: k + 1, tag, taskType, taskNum, reason: "no task def / code unparsed" }); continue; }
    if (answer.length < 15) { unparsed.push({ seq: k + 1, tag, taskType, taskNum, reason: `answer ${answer.length} chars` }); continue; }
    cases.push(mkCase("de", taskType, taskNum, def.title, answer, officialScore, rationale, cases, tag));
  }
  return { cases, unparsed };
}

// French: no inline task code. Cases are separated by lines of 5+ underscores or
// dashes; each answer ends with a "Pisteet NN" line (sometimes "Pisteet: NN" or
// "Pisteet 30 (31-1. …)" → take the first number). Task number is inferred from
// distinctive keywords (classifyFrench). Long answers live after the
// "TEHTÄVÄNANNOT: laajempi" header.
const FR_KEYWORDS = {
  short: {
    1: ["anniversaire", "fête", "désolé", "désolée", "partie", "parti", "pardon"],
    2: ["bruit", "voisin", "voisine", "dormir", "silence", "résidence"],
    3: ["restaurant", "restourant", "mangé", "plat", "salmon", "fromage", "dessert", "glace"],
  },
  long: {
    1: ["soirée", "souvenir", "chalet", "londres", "pique-nique", "été"],
    2: ["animaux", "journée mondiale", "animal"],
    3: ["au pair", "pair"],
  },
};
function classifyFrench(answer, taskType) {
  const a = answer.toLowerCase();
  let best = null, bestScore = -1;
  for (const [num, kws] of Object.entries(FR_KEYWORDS[taskType])) {
    let s = 0;
    for (const kw of kws) {
      const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      s += (a.match(re) || []).length;
    }
    if (s > bestScore) { bestScore = s; best = parseInt(num, 10); }
  }
  return bestScore > 0 ? best : null;
}
function parseFrench(raw) {
  // Strip the one-off legal disclaimer so it can't bleed into the first answer.
  const text = clean(raw).replace(/Ylioppilastutkintolautakunta on saanut[\s\S]*?pisteiden menetys\.\s*/g, "");
  let longBoundary = text.search(/TEHTÄVÄNANNOT:\s*laajempi/i);
  if (longBoundary < 0) longBoundary = text.search(/laajempi kirjoitustehtävä/i);
  if (longBoundary < 0) throw new Error("FR: long-section boundary not found.");

  // Manual split on separator lines, preserving each segment's start index.
  const sepRe = /^[ \t]*[_–-]{5,}[ \t]*$/gm;
  const bounds = [];
  let m;
  while ((m = sepRe.exec(text)) !== null) bounds.push([m.index, sepRe.lastIndex]);
  const segments = [];
  let prev = 0;
  for (const [s, e] of bounds) { segments.push([prev, s]); prev = e; }
  segments.push([prev, text.length]);

  const cases = [], unparsed = [];
  let i = 0;
  for (const [s, e] of segments) {
    const block = text.slice(s, e);
    const scoreMatch = block.match(/Pisteet\s*:?\s*(\d+)/i);
    if (!scoreMatch) continue;
    i++;
    const officialScore = parseInt(scoreMatch[1], 10);
    // Strip a leading bare page-number digit (OCR leftover like "2  Salut!").
    const answer = block.slice(0, scoreMatch.index).trim().replace(/^\d{1,2}\s+/, "").trim();
    const taskType = s > longBoundary ? "long" : "short";
    const taskNum = classifyFrench(answer, taskType);
    const def = taskNum && TASK_DEFS.fr[taskType]?.[taskNum];
    if (!def) { unparsed.push({ seq: i, taskType, taskNum, officialScore, reason: "no task def / unclassified" }); continue; }
    if (answer.length < 20) { unparsed.push({ seq: i, taskType, taskNum, reason: `answer ${answer.length} chars` }); continue; }
    cases.push(mkCase("fr", taskType, taskNum, def.title, answer, officialScore, "", cases));
  }
  return { cases, unparsed };
}

function mkCase(lang, taskType, taskNum, title, answer, officialScore, officialRationale, existing, tag) {
  const n = existing.filter((c) => c.taskType === taskType && c.taskNum === taskNum).length + 1;
  return {
    id: `${lang}-${taskType[0]}${taskNum}-${n}${tag ? `(#${tag})` : ""}`,
    lang, taskType, taskNum, title, answer, officialScore, officialRationale,
  };
}

const PARSERS = { es: parseSpanish, de: parseGerman, fr: parseFrench };
const SOURCES = {
  es: join(ROOT, "docs", "yo-espanja-naytevastaukset.txt"),
  de: join(ROOT, "docs", "yo-saksa-naytevastaukset.txt"),
  fr: join(ROOT, "docs", "yo-ranska-naytevastaukset.txt"),
};
const LANG_NAME = { es: "Espanja (in-sample, ankkurit poistettu)", de: "Saksa (held-out)", fr: "Ranska (held-out)" };

// ── Token accounting (real run cost) ────────────────────────────────────────
let _tokIn = 0, _tokOut = 0, _calls = 0;

// ── Grade one case BLIND ───────────────────────────────────────────────────────
async function gradeCase(c) {
  const base = c.taskType === "short" ? SHORT : LONG;
  const def = TASK_DEFS[c.lang][c.taskType][c.taskNum];
  const task = {
    taskType: c.taskType, charMin: base.charMin, charMax: base.charMax, points: base.points,
    situation: def.situation, prompt: def.prompt, requirements: def.requirements, textType: def.textType,
  };
  const isShort = c.taskType === "short";
  const charCount = c.answer.replace(/\s/g, "").length;
  // L-V351: few-shot anchors + native-scale scoring + gpt-5.4-mini. studentName=""
  // → no name leak. officialScore/Rationale are NOT passed to the engine.
  const prompt = buildGradingPrompt(task, c.answer, isShort, c.lang, "", { nativeScale: true, fewShotBlock: FEWSHOT });
  const aiResult = await callOpenAI(prompt, 2500, { temperature: 0.2, responseFormat: { type: "json_object" }, model: GRADING_MODEL });
  const usage = aiResult._usage || {};
  _tokIn += usage.inputTokens || 0; _tokOut += usage.outputTokens || 0; _calls += 1;
  delete aiResult._usage;
  const result = processGradingResult(aiResult, charCount, task.charMin, isShort, c.answer);

  // Native-scale prediction: trust the model's ytl_points; fall back to the old
  // 0–20 rescale if the model omitted it.
  let ytlPoints = Number(aiResult.ytl_points);
  if (!Number.isFinite(ytlPoints)) ytlPoints = (result.finalScore / 20) * base.points;
  ytlPoints = Math.max(0, Math.min(base.points, ytlPoints));
  const predYtl = round1(ytlPoints);

  return {
    ...c, charCount, penalty: result.penalty,
    engineRaw20: result.finalScore,
    ytlPoints: round1(Number(aiResult.ytl_points)) || null,
    predYtl,
    diff: round1(predYtl - c.officialScore),
    dims: {
      viestinnallisyys: result.viestinnallisyys.score, kielen_rakenteet: result.kielen_rakenteet.score,
      sanasto: result.sanasto.score, kokonaisuus: result.kokonaisuus.score,
    },
    band: result.ytlGrade,
    overall_feedback_fi: result.overall_feedback_fi,
  };
}

// ── Stats ──────────────────────────────────────────────────────────────────────
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const round = (x) => Math.round(x * 100) / 100;
const round1 = (x) => Math.round(x * 10) / 10;

function averageRanks(values) {
  const idx = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(values.length);
  let j = 0;
  while (j < idx.length) {
    let k = j;
    while (k + 1 < idx.length && idx[k + 1][0] === idx[j][0]) k++;
    const avg = (j + k) / 2 + 1;
    for (let t = j; t <= k; t++) ranks[idx[t][1]] = avg;
    j = k + 1;
  }
  return ranks;
}
function pearson(x, y) {
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) { num += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
  if (dx === 0 || dy === 0) return NaN;
  return num / Math.sqrt(dx * dy);
}
const spearman = (x, y) => pearson(averageRanks(x), averageRanks(y));

function metricsFor(rows) {
  if (!rows.length) return null;
  const diffs = rows.map((r) => r.diff);
  const abs = diffs.map(Math.abs);
  const n = rows.length;
  return {
    n,
    mae: round(mean(abs)),
    bias: round(mean(diffs)),
    within2: round((abs.filter((d) => d <= 2).length / n) * 100),
    within4: round((abs.filter((d) => d <= 4).length / n) * 100),
    maxMiss: round(Math.max(...abs)),
    // Native-scale prediction vs official score (rank-invariant).
    spearman: round(spearman(rows.map((r) => r.predYtl), rows.map((r) => r.officialScore))),
  };
}

// L-V350 precomputed "before" metrics (gpt-4o-mini, no few-shot).
function metricsFromV350(lang, taskType) {
  if (!existsSync(V350_JSON)) return null;
  try {
    const p = JSON.parse(readFileSync(V350_JSON, "utf8"));
    return p.langs?.[lang]?.metricsAfter?.[taskType] || null;
  } catch { return null; }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() { while (next < items.length) { const i = next++; results[i] = await fn(items[i], i); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ── Verdict ──────────────────────────────────────────────────────────────────────
const PASS = { short: { mae: 3, maxMiss: 6, spearman: 0.8 }, long: { mae: 6, spearman: 0.8 } };
function verdict(m, type) {
  if (!m) return { pass: false, checks: [{ name: "n>0", ok: false, got: 0 }] };
  const t = PASS[type];
  const checks = [
    { name: `MAE ≤ ${t.mae}`, ok: m.mae <= t.mae, got: m.mae },
    { name: `ρ ≥ ${t.spearman}`, ok: m.spearman >= t.spearman, got: m.spearman },
  ];
  if (t.maxMiss !== undefined) checks.push({ name: `max-heitto ≤ ${t.maxMiss}`, ok: m.maxMiss <= t.maxMiss, got: m.maxMiss });
  return { pass: checks.every((c) => c.ok), checks };
}

// ── Report formatting ──────────────────────────────────────────────────────────
function fmtTable(rows) {
  const head = "| case-id | tehtävä | YTL | ennuste (natiivi) | ero | V/R/S/K | 0–20 | band |\n|---|---|---|---|---|---|---|---|";
  return head + "\n" + rows.map((r) =>
    `| ${r.id} | ${r.title} | ${r.officialScore} | ${r.predYtl} | ${r.diff >= 0 ? "+" : ""}${r.diff} | ${r.dims.viestinnallisyys}/${r.dims.kielen_rakenteet}/${r.dims.sanasto}/${r.dims.kokonaisuus} | ${r.engineRaw20} | ${r.band} |`
  ).join("\n");
}
function fmtMetrics(m, type) {
  if (!m) return "_(ei caseja)_";
  const v = verdict(m, type);
  return [
    `- n ${m.n} · MAE ${m.mae} p · ±2p ${m.within2}% · ±4p ${m.within4}% · max ${m.maxMiss} p · ρ ${m.spearman} · bias ${m.bias >= 0 ? "+" : ""}${m.bias} p ${m.bias > 0 ? "(lepsu)" : m.bias < 0 ? "(ankara)" : ""}`,
    `- **${v.pass ? "PASS ✅" : "FAIL ❌"}** ${v.checks.map((c) => `${c.ok ? "✅" : "❌"}${c.name}(${c.got})`).join(" · ")}`,
  ].join("\n");
}
function fmtBeforeAfter(before, after) {
  if (!before) return "_(L-V350 baseline puuttuu)_";
  const d = (a, b) => { const x = round(b - a); return `${x >= 0 ? "+" : ""}${x}`; };
  return [
    `| mittari | ennen (L-V350, 4o-mini) | jälkeen (L-V351, 5.4-mini+few-shot) | muutos |`,
    `|---|---|---|---|`,
    `| MAE | ${before.mae} | ${after.mae} | ${d(before.mae, after.mae)} |`,
    `| max-heitto | ${before.maxMiss} | ${after.maxMiss} | ${d(before.maxMiss, after.maxMiss)} |`,
    `| Spearman ρ | ${before.spearman} | ${after.spearman} | ${d(before.spearman, after.spearman)} |`,
    `| bias | ${before.bias} | ${after.bias} | ${d(before.bias, after.bias)} |`,
  ].join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY) { console.error("OPENAI_API_KEY puuttuu (.env)."); process.exit(1); }
  const arg = (process.argv[2] || "all").toLowerCase();

  // Dev-only: `node scripts/validate-grading.mjs parse` parses every language and
  // prints cases (no API spend) so the parsers/classification can be sanity-checked.
  if (arg === "parse") {
    for (const lang of ["es", "de", "fr"]) {
      const { cases, unparsed } = PARSERS[lang](readFileSync(SOURCES[lang], "utf8"));
      console.log(`\n[${lang}] cases ${cases.length} (short ${cases.filter((c) => c.taskType === "short").length}, long ${cases.filter((c) => c.taskType === "long").length}), unparsed ${unparsed.length}`);
      for (const c of cases) console.log(`  ${c.id.padEnd(14)} ${c.taskType.padEnd(5)} t${c.taskNum} YTL ${String(c.officialScore).padStart(2)}  ${c.answer.slice(0, 50).replace(/\n/g, " ")}`);
      for (const u of unparsed) console.log(`  UNPARSED ${JSON.stringify(u)}`);
    }
    return;
  }

  const langs = (arg === "all" || arg === "both") ? ["es", "de", "fr"] : [arg];

  // Preflight: one call with the grading model so a bad model name / param
  // mismatch fails loudly ONCE instead of erroring on every case.
  console.log(`[preflight] testaan mallia ${GRADING_MODEL}…`);
  try {
    const r = await callOpenAI('Return ONLY {"ok":true} as JSON.', 50, { temperature: 0.2, responseFormat: { type: "json_object" }, model: GRADING_MODEL });
    console.log(`[preflight] OK — malli vastasi: ${JSON.stringify(r).slice(0, 80)}`);
  } catch (e) {
    console.error(`[preflight] MALLIKUTSU EPÄONNISTUI (${GRADING_MODEL}): ${e.message}`);
    console.error(`[preflight] Keskeytetään ennen kalliita ajoja. Tarkista mallinimi / API-parametrit.`);
    process.exit(2);
  }

  const out = {
    generatedFor: "L-V351", date: "2026-06-02", model: GRADING_MODEL,
    calibration: "few-shot anchoring (lib/gradingAnchors.js, 6 ES-ankkuria) + natiiviasteikko (ytl_points 0–33/0–66)",
    blind: true, anchorsExcludedFromES: true, langs: {},
  };

  for (const lang of langs) {
    const raw = readFileSync(SOURCES[lang], "utf8");
    const { cases, unparsed } = PARSERS[lang](raw);
    console.log(`\n[${lang}] parsittu ${cases.length} (short ${cases.filter((c) => c.taskType === "short").length}, long ${cases.filter((c) => c.taskType === "long").length}), parsimatta ${unparsed.length}`);
    for (const u of unparsed) console.warn(`  parsimatta: ${JSON.stringify(u)}`);

    let done = 0;
    const graded = await mapLimit(cases, 4, async (c) => {
      try { const r = await gradeCase(c); if (++done % 5 === 0 || done === cases.length) console.log(`  [${lang}] ${done}/${cases.length}`); return r; }
      catch (e) { console.error(`  [${lang}] VIRHE ${c.id}: ${e.message}`); return { ...c, error: e.message }; }
    });

    const ok = graded.filter((r) => !r.error);
    const short = ok.filter((r) => r.taskType === "short").sort((a, b) => b.officialScore - a.officialScore);
    const long = ok.filter((r) => r.taskType === "long").sort((a, b) => b.officialScore - a.officialScore);
    out.langs[lang] = {
      counts: { parsed: cases.length, graded: ok.length, errored: graded.length - ok.length, unparsed: unparsed.length },
      unparsed,
      metricsAfter: { short: metricsFor(short), long: metricsFor(long) },
      metricsBefore: (lang === "es" || lang === "de")
        ? { short: metricsFromV350(lang, "short"), long: metricsFromV350(lang, "long") }
        : null,
      cases: ok, errored: graded.filter((r) => r.error),
    };
    const ms = metricsFor(short), ml = metricsFor(long);
    console.log(`  [${lang}] LYHYT MAE ${ms?.mae} ρ ${ms?.spearman} max ${ms?.maxMiss} → ${verdict(ms, "short").pass ? "PASS" : "FAIL"}`);
    console.log(`  [${lang}] LAAJA MAE ${ml?.mae} ρ ${ml?.spearman} → ${verdict(ml, "long").pass ? "PASS" : "FAIL"}`);
  }

  // Cost accounting from the real run.
  const costUsd = (_tokIn / 1e6) * PRICE_IN_PER_M + (_tokOut / 1e6) * PRICE_OUT_PER_M;
  out.cost = {
    calls: _calls, inputTokens: _tokIn, outputTokens: _tokOut,
    avgInPerCall: _calls ? Math.round(_tokIn / _calls) : 0,
    avgOutPerCall: _calls ? Math.round(_tokOut / _calls) : 0,
    priceAssumption: { inputPerM: PRICE_IN_PER_M, outputPerM: PRICE_OUT_PER_M, currency: "USD (≈EUR), VERIFY" },
    estPer100Usd: _calls ? round((costUsd / _calls) * 100) : 0,
  };

  writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), "utf8");
  writeFileSync(OUT_MD, renderMd(out), "utf8");
  console.log(`\nKirjoitettu:\n  ${OUT_JSON}\n  ${OUT_MD}`);
  console.log(`Kustannus: ${_calls} kutsua, in ${_tokIn} / out ${_tokOut} tok → ~$${out.cost.estPer100Usd}/100 arviointia (oletettu hinta, VARMISTA).`);
}

function renderMd(out) {
  const parts = [];
  parts.push(`# L-V351 — Arviointi: gpt-5.4-mini + few-shot-ankkurointi (espanja + saksa + ranska)

**Päivä:** 2026-06-02
**Malli:** \`${out.model}\` (harness; tuotanto pysyy gpt-4o-minissä kunnes tämä PASS).
**Kalibrointi:** few-shot-ankkurointi — 6 oikeaa YTL-pisteytettyä espanja-vastausta (\`lib/gradingAnchors.js\`, skaala 15/25/33 lyhyt + 34/50/66 laaja) upotettu promptiin + **natiiviasteikko** (\`ytl_points\` 0–33 / 0–66, ei 0–20→skaalaus).
**Anti-vuoto:** 6 ankkuria poistettu espanjan testisetistä (\`isAnchorAnswer\`). Saksa + ranska ovat täysin held-out (ankkurit ovat espanjaa → eivät esiinny promptissa näille kielille).
**Sokkous:** moottori sai vain oppilaan tekstin + tehtäväkontekstin; \`officialScore\`/\`officialRationale\` stripattiin ennen kutsua.
**Lukitut rajat:** lyhyt MAE ≤ 3, max ≤ 6, ρ ≥ 0.8 · laaja MAE ≤ 6, ρ ≥ 0.8. PASS = kaikki kolme kieltä läpäisevät molemmat tehtävätyypit.
`);

  const v = (lang, type) => verdict(out.langs[lang]?.metricsAfter?.[type], type).pass;
  const langsPresent = ["es", "de", "fr"].filter((l) => out.langs[l]);
  const allPass = langsPresent.every((l) => v(l, "short") && v(l, "long"));
  parts.push(`## Verdict\n\n**${allPass ? "PASS kaikilla kolmella kielellä ✅" : "EI PASS ❌"}** — ${allPass ? "ydin luotettava; tuotannon mallivaihto + few-shot perusteltu, scope-laajennus (englanti/ruotsi/äidinkieli) avautuu." : "katso kieli/tehtävätyyppi-kohtaiset rivit alla. Älä vaihda tuotantoa eikä laajenna ennen kuin kaikki kolme PASS."}\n`);

  // Cost
  const c = out.cost || {};
  parts.push(`## Kustannus (ajon todelliset token-luvut)
- ${c.calls} arviointikutsua · input ${c.inputTokens} tok (ka ${c.avgInPerCall}/kutsu) · output ${c.outputTokens} tok (ka ${c.avgOutPerCall}/kutsu).
- **~$${c.estPer100Usd} / 100 arviointia** oletetulla hinnalla $${c.priceAssumption?.inputPerM}/1M in + $${c.priceAssumption?.outputPerM}/1M out. ⚠️ gpt-5.4-minin listahinta on VARMISTETTAVA — token-luvut ovat todelliset, € on arvio.
- Few-shot nostaa input-tokeneita (~1500 → ${c.avgInPerCall}/kutsu) odotetusti.
`);

  for (const lang of langsPresent) {
    const L = out.langs[lang];
    const short = L.cases.filter((cc) => cc.taskType === "short").sort((a, b) => b.officialScore - a.officialScore);
    const long = L.cases.filter((cc) => cc.taskType === "long").sort((a, b) => b.officialScore - a.officialScore);
    parts.push(`\n---\n\n## ${LANG_NAME[lang]} — ${lang.toUpperCase()}\n`);
    parts.push(`Caset: parsittu ${L.counts.parsed}, arvioitu ${L.counts.graded}, virheitä ${L.counts.errored}, parsimatta/poissuljettu ${L.counts.unparsed}.`);
    if (L.unparsed.length) parts.push(`\n> Parsimatta / poissuljettu:\n${L.unparsed.map((u) => `> - ${JSON.stringify(u)}`).join("\n")}`);

    parts.push(`\n### Lyhyt (max 33 p)\n${fmtMetrics(L.metricsAfter.short, "short")}`);
    if (L.metricsBefore?.short) parts.push(`\n**Ennen vs. jälkeen:**\n${fmtBeforeAfter(L.metricsBefore.short, L.metricsAfter.short)}`);
    parts.push(`\n### Laaja (max 66 p)\n${fmtMetrics(L.metricsAfter.long, "long")}`);
    if (L.metricsBefore?.long) parts.push(`\n**Ennen vs. jälkeen:**\n${fmtBeforeAfter(L.metricsBefore.long, L.metricsAfter.long)}`);

    parts.push(`\n#### Caset — lyhyt\n${fmtTable(short)}`);
    parts.push(`\n#### Caset — laaja\n${fmtTable(long)}`);
    if (L.errored.length) parts.push(`\n#### Virheelliset\n${L.errored.map((e) => `- ${e.id}: ${e.error}`).join("\n")}`);
  }

  parts.push(`\n---\n\n## Caveatit
- **Yläpään erottelu testautuu ensisijaisesti espanjan ei-ankkuri-caseilla.** Ranska on matalapainotteinen (lyhyt huippu 30, laaja 50) eikä stressi-testaa yläpäätä; saksan huippu 62; vain espanjassa on 66 p. Ranskan PASS ei ole todiste yläpäästä.
- **Ranskan tehtävänumero päätellään avainsanoista** (classifyFrench), koska tiedostossa ei ole inline-koodia. Tarkista parsimatta-lista jos jokin case putosi.
- PDF→teksti-purku tuottaa OCR-artefakteja kaikissa kolmessa (ankkureissakin näkyy liimautuneita sanoja — jätetty tarkoituksella aidoiksi).
- temp 0.2 ei ole täysin deterministinen; "ennen"-luvut ovat L-V350:n erillisestä ajosta (gpt-4o-mini, ei few-shotia), joten pienet erot voivat olla ajovariaatiota — suunta + suuruusluokka ratkaisevat.
- ⚠️ gpt-5.4-minin parametrit: harness käyttää \`max_completion_tokens\` + oletuslämpötilaa jos malli on gpt-5-perhettä (ks. lib/openai.js). temp 0.2 toteutuu vain jos malli sallii sen.
`);
  return parts.join("\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
