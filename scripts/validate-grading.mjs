// L-V349 / L-V350 / L-V351 / L-V352 — Blind validation of the writing-grading
// engine against YTL's official sample answers. Trilingual: Spanish (in-sample)
// + German + French (both held-out — never used to tune the prompt or the fit).
//
// L-V351 layers (kept): gpt-5.4-mini + few-shot anchoring (lib/gradingAnchors,
// 6 real YTL-scored Spanish answers) + native-scale scoring (ytl_points
// 0–33 short / 0–66 long). Anti-leak: the 6 anchors are dropped from the Spanish
// test set; DE+FR never enter the prompt (anchors are Spanish).
//
// L-V352 new layer — AFFINE POST-CALIBRATION:
//   V351 proved ranking is solved (ρ 0.84–0.95) but the absolute score is
//   systematically harsh, ~constant per task type. We fit `official ≈ a·pred + b`
//   by least squares on the SPANISH non-anchor cases ONLY (train), separately
//   for short and long, then apply the SAME (a,b) to every language. DE+FR are
//   held-out: they are never used to fit (a,b), so they measure generalisation.
//   ρ is invariant under a positive affine map, so ranking is preserved.
//   The fitted (a,b) are baked into lib/writingGrading.js (AFFINE_REMAP) so
//   production applies the identical transform; this harness applies them via the
//   shared affineRemap() so report == production by construction.
//
// Metrics (MAE, ±2/±4, max miss, ρ, bias) are reported on BOTH the raw native
// prediction and the affine-CORRECTED score; the locked thresholds are checked
// against the CORRECTED score. Band shown follows the corrected score.
//
// Run:  node scripts/validate-grading.mjs            (all three: es+de+fr)
//       node scripts/validate-grading.mjs es         (one language)
// Needs OPENAI_API_KEY in .env. No DB writes (dev cache is in-memory).

import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildGradingPrompt, processGradingResult, affineRemap, pointsToGradeNative } from "../lib/writingGrading.js";
import { callOpenAI } from "../lib/openai.js";
import { buildFewShotBlock, isAnchorAnswer } from "../lib/gradingAnchors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDITS = join(ROOT, "docs", "audits");
const OUT_JSON = join(AUDITS, "2026-06-02-L-V352-grading-affine-remap.json");
const OUT_MD = join(AUDITS, "2026-06-02-L-V352-grading-affine-remap.md");
// L-V350 raw metrics = the earliest baseline (gpt-4o-mini, no few-shot).
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
    rawDiff: round1(predYtl - c.officialScore),
    // corrected / corrDiff / bandCorr are filled in main() after the affine fit.
    corrected: null, corrDiff: null, bandCorr: null,
    dims: {
      viestinnallisyys: result.viestinnallisyys.score, kielen_rakenteet: result.kielen_rakenteet.score,
      sanasto: result.sanasto.score, kokonaisuus: result.kokonaisuus.score,
    },
    band20: result.ytlGrade,
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

// Least-squares fit of `official ≈ a·pred + b`. Returns slope, intercept, R²
// (fraction of variance in `official` explained by the fitted line) and n.
function fitAffine(preds, officials) {
  const n = preds.length;
  if (n < 2) return { a: 1, b: 0, r2: NaN, n };
  const mp = mean(preds), mo = mean(officials);
  let cov = 0, vp = 0, vo = 0;
  for (let i = 0; i < n; i++) {
    cov += (preds[i] - mp) * (officials[i] - mo);
    vp += (preds[i] - mp) ** 2;
    vo += (officials[i] - mo) ** 2;
  }
  const a = vp === 0 ? 1 : cov / vp;
  const b = mo - a * mp;
  // R² = 1 − SS_res/SS_tot of the fitted line on the training points.
  let ssRes = 0;
  for (let i = 0; i < n; i++) { const e = officials[i] - (a * preds[i] + b); ssRes += e * e; }
  const r2 = vo === 0 ? NaN : 1 - ssRes / vo;
  return { a: round(a * 1000) / 1000, b: round(b * 1000) / 1000, r2: round(r2 * 1000) / 1000, n };
}

// Metrics over a set of rows for a given diff field ("rawDiff" or "corrDiff").
// Spearman is always computed on predYtl (rank-invariant under the affine map,
// so raw and corrected ρ are identical) vs the official score.
function metricsFromRows(rows, diffKey) {
  if (!rows.length) return null;
  const diffs = rows.map((r) => r[diffKey]);
  const abs = diffs.map(Math.abs);
  const n = rows.length;
  return {
    n,
    mae: round(mean(abs)),
    bias: round(mean(diffs)),
    within2: round((abs.filter((d) => d <= 2).length / n) * 100),
    within4: round((abs.filter((d) => d <= 4).length / n) * 100),
    maxMiss: round(Math.max(...abs)),
    spearman: round(spearman(rows.map((r) => r.predYtl), rows.map((r) => r.officialScore))),
  };
}
const metricsCorr = (rows) => metricsFromRows(rows, "corrDiff");
const metricsRaw = (rows) => metricsFromRows(rows, "rawDiff");

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
  const head = "| case-id | tehtävä | YTL | raaka | korjattu | ero | V/R/S/K | 0–20 | band |\n|---|---|---|---|---|---|---|---|---|";
  return head + "\n" + rows.map((r) =>
    `| ${r.id} | ${r.title} | ${r.officialScore} | ${r.predYtl} | ${r.corrected} | ${r.corrDiff >= 0 ? "+" : ""}${r.corrDiff} | ${r.dims.viestinnallisyys}/${r.dims.kielen_rakenteet}/${r.dims.sanasto}/${r.dims.kokonaisuus} | ${r.engineRaw20} | ${r.bandCorr} |`
  ).join("\n");
}
function fmtMetrics(mCorr, mRaw, type) {
  if (!mCorr) return "_(ei caseja)_";
  const v = verdict(mCorr, type);
  const line = (label, m) => `- ${label}: n ${m.n} · MAE ${m.mae} p · ±2p ${m.within2}% · ±4p ${m.within4}% · max ${m.maxMiss} p · ρ ${m.spearman} · bias ${m.bias >= 0 ? "+" : ""}${m.bias} p ${m.bias > 0 ? "(lepsu)" : m.bias < 0 ? "(ankara)" : ""}`;
  return [
    mRaw ? line("raaka (ennen remapia)", mRaw) : null,
    line("**korjattu (affiininen remap)**", mCorr),
    `- **${v.pass ? "PASS ✅" : "FAIL ❌"}** ${v.checks.map((cc) => `${cc.ok ? "✅" : "❌"}${cc.name}(${cc.got})`).join(" · ")}`,
  ].filter(Boolean).join("\n");
}
// Before→after chain: V350 (4o-mini) → this run RAW (5.4-mini+few-shot) → this
// run CORRECTED (+affine remap). Columns are emitted only where data exists.
function fmtChain(v350, raw, corr) {
  if (!corr) return "_(ei dataa)_";
  const cells = (pick) => [
    v350 ? pick(v350) : null,
    raw ? pick(raw) : null,
    pick(corr),
  ].filter((x) => x !== null);
  const heads = [v350 ? "L-V350 (4o-mini)" : null, raw ? "raaka (5.4+few-shot)" : null, "korjattu (+remap)"].filter(Boolean);
  const row = (label, pick) => `| ${label} | ${cells(pick).join(" | ")} |`;
  return [
    `| mittari | ${heads.join(" | ")} |`,
    `|${" --- |".repeat(heads.length + 1)}`,
    row("MAE", (m) => m.mae),
    row("max-heitto", (m) => m.maxMiss),
    row("Spearman ρ", (m) => m.spearman),
    row("bias", (m) => `${m.bias >= 0 ? "+" : ""}${m.bias}`),
  ].join("\n");
}
function fmtFit(fit) {
  const f = (p) => `a=${p.a}, b=${p.b >= 0 ? "+" : ""}${p.b}, R²=${p.r2} (n=${p.n}, max=${p.max})`;
  return [
    `- **Lyhyt:** \`korjattu = ${fit.short.a}·raaka ${fit.short.b >= 0 ? "+ " + fit.short.b : "− " + Math.abs(fit.short.b)}\` → ${f(fit.short)}`,
    `- **Laaja:** \`korjattu = ${fit.long.a}·raaka ${fit.long.b >= 0 ? "+ " + fit.long.b : "− " + Math.abs(fit.long.b)}\` → ${f(fit.long)}`,
  ].join("\n");
}

// Apply the fitted affine map to one row (mutates it): corrected score, corrected
// diff vs official, and the native-scale band derived from the corrected score.
function applyRemapToRow(r, fit) {
  const p = r.taskType === "short" ? fit.short : fit.long;
  r.corrected = affineRemap(r.predYtl, { a: p.a, b: p.b, max: p.max });
  r.corrDiff = round1(r.corrected - r.officialScore);
  r.bandCorr = pointsToGradeNative(r.corrected, p.max);
  return r;
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
    generatedFor: "L-V352", date: "2026-06-02", model: GRADING_MODEL,
    calibration: "few-shot anchoring (6 ES) + natiiviasteikko (0–33/0–66) + affiininen remap (fit ES-train, sovellettu kaikkiin)",
    blind: true, anchorsExcludedFromES: true, langs: {},
  };

  // ── Phase 1: grade every case in every language BLIND, store raw rows. ──────
  const parsed = {};
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
    parsed[lang] = {
      ok: graded.filter((r) => !r.error),
      errored: graded.filter((r) => r.error),
      counts: { parsed: cases.length },
      unparsed,
    };
  }

  // ── Phase 2: fit the affine map on SPANISH non-anchor cases ONLY (train). ───
  // Separate (a,b) for short and long. DE+FR are NEVER used here → held-out.
  const esOk = parsed.es ? parsed.es.ok : [];
  const esShort = esOk.filter((r) => r.taskType === "short");
  const esLong = esOk.filter((r) => r.taskType === "long");
  let fit;
  if (esShort.length >= 2 && esLong.length >= 2) {
    fit = {
      short: { ...fitAffine(esShort.map((r) => r.predYtl), esShort.map((r) => r.officialScore)), max: 33 },
      long: { ...fitAffine(esLong.map((r) => r.predYtl), esLong.map((r) => r.officialScore)), max: 66 },
      fittedOn: "ES non-anchor train (es+de+fr ajossa); DE+FR held-out",
    };
  } else {
    // Single-language run without ES (e.g. `node … de`): cannot fit. Fall back to
    // identity so raw == corrected, and warn loudly. The PASS verdict needs ES.
    console.warn("[fit] VAROITUS: espanjaa ei ajettu → ei voida sovittaa affiinia. Identiteetti (a=1,b=0). Aja `all`.");
    fit = { short: { a: 1, b: 0, r2: NaN, n: esShort.length, max: 33 }, long: { a: 1, b: 0, r2: NaN, n: esLong.length, max: 66 }, fittedOn: "IDENTITY (es puuttui ajosta)" };
  }
  out.fit = fit;
  console.log(`\n[fit] LYHYT korjattu = ${fit.short.a}·raaka + ${fit.short.b} (R² ${fit.short.r2}, n ${fit.short.n})`);
  console.log(`[fit] LAAJA  korjattu = ${fit.long.a}·raaka + ${fit.long.b} (R² ${fit.long.r2}, n ${fit.long.n})`);

  // ── Phase 3: apply the SAME (a,b) to every row, compute corrected metrics. ──
  for (const lang of langs) {
    const P = parsed[lang];
    const ok = P.ok.map((r) => applyRemapToRow(r, fit));
    const short = ok.filter((r) => r.taskType === "short").sort((a, b) => b.officialScore - a.officialScore);
    const long = ok.filter((r) => r.taskType === "long").sort((a, b) => b.officialScore - a.officialScore);
    out.langs[lang] = {
      counts: { parsed: P.counts.parsed, graded: ok.length, errored: P.errored.length, unparsed: P.unparsed.length },
      unparsed: P.unparsed,
      metricsAfter: { short: metricsCorr(short), long: metricsCorr(long) },   // corrected — checked vs thresholds
      metricsRaw: { short: metricsRaw(short), long: metricsRaw(long) },        // pre-remap (V351-style)
      metricsV350: (lang === "es" || lang === "de")
        ? { short: metricsFromV350(lang, "short"), long: metricsFromV350(lang, "long") }
        : null,
      cases: ok, errored: P.errored,
    };
    const ms = metricsCorr(short), ml = metricsCorr(long);
    console.log(`  [${lang}] LYHYT korjattu MAE ${ms?.mae} ρ ${ms?.spearman} max ${ms?.maxMiss} → ${verdict(ms, "short").pass ? "PASS" : "FAIL"}`);
    console.log(`  [${lang}] LAAJA korjattu MAE ${ml?.mae} ρ ${ml?.spearman} → ${verdict(ml, "long").pass ? "PASS" : "FAIL"}`);
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
  // Only bake into lib/writingGrading.js AFFINE_REMAP if held-out (DE+FR) PASSes.
  // A flat/degenerate long fit (low R²) or a failing held-out means the single
  // ES-fit does not generalise — baking it would ship a miscalibrated transform.
  console.log(`\n>>> Sovitetut (a,b) — BAKE lib/writingGrading.js:ään VAIN jos held-out PASS:`);
  console.log(`    short: { a: ${fit.short.a}, b: ${fit.short.b}, max: 33 },  (R² ${fit.short.r2})`);
  console.log(`    long:  { a: ${fit.long.a}, b: ${fit.long.b}, max: 66 },  (R² ${fit.long.r2})`);
  console.log(`Kustannus: ${_calls} kutsua, in ${_tokIn} / out ${_tokOut} tok → ~$${out.cost.estPer100Usd}/100 arviointia (oletettu hinta, VARMISTA).`);
}

function renderMd(out) {
  const parts = [];
  parts.push(`# L-V352 — Arviointi: affiininen jälkikalibrointi (espanja + saksa + ranska)

**Päivä:** 2026-06-02
**Malli:** \`${out.model}\` (harness; tuotanto pysyy gpt-4o-minissä kunnes tämä PASS).
**Kerrokset:** few-shot-ankkurointi (6 ES-vastausta, \`lib/gradingAnchors.js\`) + **natiiviasteikko** (\`ytl_points\` 0–33 / 0–66) + **affiininen remap** (\`korjattu = a·raaka + b\`, sovitettu ES-trainilla, sovellettu kaikkiin kieliin).
**Sovitus puhtaasti:** \`(a,b)\` sovitettu VAIN espanjan ei-ankkuri-caseilla (pienin neliösumma, erikseen lyhyt/laaja). **Saksa + ranska held-out** — niitä ei käytetty sovitukseen, joten ne mittaavat yleistymistä. ρ on invariantti positiivisen affiinin alla → ranking säilyy.
**Anti-vuoto:** 6 ankkuria poistettu espanjan testisetistä (\`isAnchorAnswer\`); DE+FR eivät esiinny promptissa (ankkurit espanjaa).
**Sokkous:** moottori sai vain oppilaan tekstin + tehtäväkontekstin; \`officialScore\`/\`officialRationale\` stripattiin.
**Lukitut rajat (korjatuista pisteistä):** lyhyt MAE ≤ 3, max ≤ 6, ρ ≥ 0.8 · laaja MAE ≤ 6, ρ ≥ 0.8. PASS = kaikki kolme kieltä läpäisevät molemmat tehtävätyypit; **päämittari = held-out DE+FR**.
`);

  const v = (lang, type) => verdict(out.langs[lang]?.metricsAfter?.[type], type).pass;
  const langsPresent = ["es", "de", "fr"].filter((l) => out.langs[l]);
  const heldOut = langsPresent.filter((l) => l !== "es");
  const allPass = langsPresent.every((l) => v(l, "short") && v(l, "long"));
  const heldOutPass = heldOut.length > 0 && heldOut.every((l) => v(l, "short") && v(l, "long"));
  parts.push(`## Verdict\n\n**${allPass ? "PASS kaikilla kolmella kielellä ✅" : "EI PASS ❌"}** — held-out (DE+FR) ${heldOutPass ? "läpäisi ✅" : "EI läpäissyt ❌"} (tämä on päämittari; ES on in-sample ja näyttää aina paremmalta). ${allPass ? "Tuotannon mallivaihto + remap perusteltu." : "Älä vaihda tuotantoa ennen kuin kaikki kolme PASS; katso rivit alla + reunaehto-osio."}\n`);

  parts.push(`## Affiininen sovitus (ES-train, pienin neliösumma)\n${fmtFit(out.fit)}\n\n_R² on sovitussuoran selitysaste espanjan train-pisteillä; korkea R² = lähes lineaarinen vinouma, jonka suora poistaa. Matala R² (laaja) = sovitus regressoi keskiarvoon eikä kalibroi. \`(a,b)\` baketaan \`lib/writingGrading.js\` → \`AFFINE_REMAP\`:iin VAIN jos held-out PASS; muuten AFFINE_REMAP pysyy identiteettinä (remap pois päältä tuotannossa)._`);

  // Cost
  const c = out.cost || {};
  parts.push(`## Kustannus (ajon todelliset token-luvut)
- ${c.calls} arviointikutsua · input ${c.inputTokens} tok (ka ${c.avgInPerCall}/kutsu) · output ${c.outputTokens} tok (ka ${c.avgOutPerCall}/kutsu).
- **~$${c.estPer100Usd} / 100 arviointia** oletetulla hinnalla $${c.priceAssumption?.inputPerM}/1M in + $${c.priceAssumption?.outputPerM}/1M out. ⚠️ gpt-5.4-minin listahinta on VARMISTETTAVA — token-luvut todelliset, € on arvio.
- Remap on ilmainen (matematiikka). Few-shot pitää input-tokenit ~${c.avgInPerCall}/kutsu.
`);

  for (const lang of langsPresent) {
    const L = out.langs[lang];
    const heldTag = lang === "es" ? "in-sample (sovitusdata)" : "**held-out**";
    const short = L.cases.filter((cc) => cc.taskType === "short").sort((a, b) => b.officialScore - a.officialScore);
    const long = L.cases.filter((cc) => cc.taskType === "long").sort((a, b) => b.officialScore - a.officialScore);
    parts.push(`\n---\n\n## ${LANG_NAME[lang]} — ${lang.toUpperCase()} · ${heldTag}\n`);
    parts.push(`Caset: parsittu ${L.counts.parsed}, arvioitu ${L.counts.graded}, virheitä ${L.counts.errored}, parsimatta/poissuljettu ${L.counts.unparsed}.`);
    if (L.unparsed.length) parts.push(`\n> Parsimatta / poissuljettu:\n${L.unparsed.map((u) => `> - ${JSON.stringify(u)}`).join("\n")}`);

    parts.push(`\n### Lyhyt (max 33 p)\n${fmtMetrics(L.metricsAfter.short, L.metricsRaw?.short, "short")}`);
    parts.push(`\n**Ketju L-V350 → raaka → korjattu:**\n${fmtChain(L.metricsV350?.short, L.metricsRaw?.short, L.metricsAfter.short)}`);
    parts.push(`\n### Laaja (max 66 p)\n${fmtMetrics(L.metricsAfter.long, L.metricsRaw?.long, "long")}`);
    parts.push(`\n**Ketju L-V350 → raaka → korjattu:**\n${fmtChain(L.metricsV350?.long, L.metricsRaw?.long, L.metricsAfter.long)}`);

    parts.push(`\n#### Caset — lyhyt\n${fmtTable(short)}`);
    parts.push(`\n#### Caset — laaja\n${fmtTable(long)}`);
    if (L.errored.length) parts.push(`\n#### Virheelliset\n${L.errored.map((e) => `- ${e.id}: ${e.error}`).join("\n")}`);
  }

  parts.push(`\n---\n\n## Caveatit
- **Affiininen remap korjaa keskiarvon ja laajan, muttei yksittäisten caseiden jäännöshajontaa.** Jos lyhyt failaa \`max-heitto ≤ 6\` remapin jälkeen, syy on case-kohtainen (ei systemaattinen vinouma) — katso lyhyt-taulukon suurimmat \`ero\`-arvot. Niitä ei viritetä paramilla pois.
- **Held-out DE+FR on päämittari.** Jos ES PASS mutta DE/FR FAIL, ES-trainin \`(a,b)\` ei yleisty → vinouma ei ole kieliriippumaton vakio (oletus pettää). Tämä näkyy DE/FR-biasissa korjauksen jälkeen.
- **Yläpään erottelu** testautuu lähinnä espanjalla (ainoa 66 p); ranska matalapainotteinen (lyhyt huippu 30, laaja 50). Ranskan PASS ei todista yläpäätä.
- Ranskan tehtävänumero päätellään avainsanoista (classifyFrench); tarkista parsimatta-lista.
- PDF→teksti-purku tuottaa OCR-artefakteja; alkuperäisiä YTL-PDF:iä ei ole repossa, joten OCR-pohjaista uudelleentranskriptiota ei voitu tehdä — silppuuntuneet caset jäävät aidoiksi jäännösheitoiksi.
- temp 0.2 ei ole täysin deterministinen; "L-V350"-luvut ovat erillisestä 4o-mini-ajosta. Suunta + suuruusluokka ratkaisevat.
`);
  return parts.join("\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
