// L-V349 / L-V350 — Blind validation of the production writing-grading engine
// against YTL's official sample answers. Multilingual: Spanish (in-sample, the
// set the L-V349 bias was diagnosed on) + German (held-out, never used to tune
// the calibration prompt — the key methodological control).
//
// Pipeline (identical for every language):
//   1. Parse the language's ground-truth txt into cases
//      ({ id, taskType, taskNum, title, answer, officialScore, officialRationale }).
//   2. Grade each case BLIND with the SAME production functions the routes use:
//      buildGradingPrompt + callOpenAI(temp 0.2, json_object) + processGradingResult.
//      The engine never sees officialScore / officialRationale.
//   3. Per-task-type metrics (short vs long; YTL scales 33 vs 66, engine 0–20):
//      MAE, ±2/±4 hit rate, max miss, Spearman ρ, signed bias.
//   4. Compare against the locked L-V349 thresholds.
//
// Engine total is 0–20; rescaled to YTL points: predYtl = finalScore/20*pointsMax
// (33 short / 66 long). Spearman uses the raw 0–20 total (rank-invariant).
//
// Run:  node scripts/validate-grading.mjs            (both languages)
//       node scripts/validate-grading.mjs es         (one language)
// Needs OPENAI_API_KEY in .env. No DB writes (dev cache is in-memory).

import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildGradingPrompt, processGradingResult } from "../lib/writingGrading.js";
import { callOpenAI } from "../lib/openai.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDITS = join(ROOT, "docs", "audits");
const OUT_JSON = join(AUDITS, "2026-06-02-L-V350-grading-calibration.json");
const OUT_MD = join(AUDITS, "2026-06-02-L-V350-grading-calibration.md");
// L-V349 raw per-case JSON = the pre-calibration Spanish baseline ("before").
const V349_JSON = join(AUDITS, "2026-06-02-L-V349-grading-validation.json");

const SHORT = { charMin: 160, charMax: 240, points: 33 };
const LONG = { charMin: 300, charMax: 450, points: 66 };

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

  // Block-split on the "#NN" case markers.
  const markers = [...text.matchAll(/#(\d+)/g)];
  const cases = [], unparsed = [];
  for (let k = 0; k < markers.length; k++) {
    const start = markers[k].index;
    const end = k + 1 < markers.length ? markers[k + 1].index : text.length;
    const block = text.slice(start, end);
    const tag = markers[k][1];

    const scoreMatch = block.match(/^[ \t]*(\d{1,2})\s*p\.\s*$/m);
    if (!scoreMatch) { continue; } // not a scored case block (e.g. a "#tag" inside prose)
    const officialScore = parseInt(scoreMatch[1], 10);
    const beforeScore = block.slice(0, scoreMatch.index);

    // Split answer / rationale at the first Finnish rationale bullet.
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

    // Strip the leading "#NN" remnant + the task-code token wherever it sits
    // (handles "SC_LYH1Hallo!" glued to the answer). Then drop a leading bare
    // tag number / separators.
    let answer = answerRegion
      .replace(/^\s*#?\s*\d+\s*/, "")  // strip the leading "#NN" case marker
      .replace(DE_CODE, "")             // strip the task code (incl. glued "SC_LYH1Hallo!")
      .replace(/^[\s_–-]+/, "")
      .trim();

    const def = taskNum && TASK_DEFS.de[taskType]?.[taskNum];
    if (!def) { unparsed.push({ seq: k + 1, tag, taskType, taskNum, reason: "no task def / code unparsed" }); continue; }
    if (answer.length < 15) { unparsed.push({ seq: k + 1, tag, taskType, taskNum, reason: `answer ${answer.length} chars` }); continue; }
    cases.push(mkCase("de", taskType, taskNum, def.title, answer, officialScore, rationale, cases, tag));
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

const PARSERS = { es: parseSpanish, de: parseGerman };
const SOURCES = {
  es: join(ROOT, "docs", "yo-espanja-naytevastaukset.txt"),
  de: join(ROOT, "docs", "yo-saksa-naytevastaukset.txt"),
};
const LANG_NAME = { es: "Espanja (in-sample)", de: "Saksa (held-out)" };

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
  // Same call as routes/writing.js /grade-writing. studentName="" → no name leak,
  // held constant. officialScore/Rationale are NOT passed to the engine.
  const prompt = buildGradingPrompt(task, c.answer, isShort, c.lang, "");
  const aiResult = await callOpenAI(prompt, 2500, { temperature: 0.2, responseFormat: { type: "json_object" } });
  delete aiResult._usage;
  const result = processGradingResult(aiResult, charCount, task.charMin, isShort, c.answer);
  const predYtl = (result.finalScore / 20) * base.points;
  return {
    ...c, charCount, penalty: result.penalty,
    engineRaw20: result.finalScore,
    predYtl: round1(predYtl),
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
    spearman: round(spearman(rows.map((r) => r.engineRaw20), rows.map((r) => r.officialScore))),
  };
}

// Recompute metrics from L-V349 raw cases (pre-calibration ES baseline).
function metricsFromV349(taskType) {
  if (!existsSync(V349_JSON)) return null;
  try {
    const p = JSON.parse(readFileSync(V349_JSON, "utf8"));
    const rows = (p.cases || []).filter((c) => c.taskType === taskType && !c.error);
    return rows.length ? metricsFor(rows) : null;
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
  const head = "| case-id | tehtävä | YTL | moottori 0–20 | ennuste-YTL | ero | V/R/S/K | band |\n|---|---|---|---|---|---|---|---|";
  return head + "\n" + rows.map((r) =>
    `| ${r.id} | ${r.title} | ${r.officialScore} | ${r.engineRaw20} | ${r.predYtl} | ${r.diff >= 0 ? "+" : ""}${r.diff} | ${r.dims.viestinnallisyys}/${r.dims.kielen_rakenteet}/${r.dims.sanasto}/${r.dims.kokonaisuus} | ${r.band} |`
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
function fmtBeforeAfter(before, after, type) {
  if (!before) return "_(L-V349 baseline puuttuu)_";
  const d = (a, b) => { const x = round(b - a); return `${x >= 0 ? "+" : ""}${x}`; };
  return [
    `| mittari | ennen (L-V349) | jälkeen (L-V350) | muutos |`,
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
  const arg = (process.argv[2] || "both").toLowerCase();
  const langs = arg === "both" ? ["es", "de"] : [arg];

  const out = { generatedFor: "L-V350", date: "2026-06-02", calibration: "lib/writingGrading.js buildGradingPrompt — SCORING CALIBRATION -lohko (E/L-yläpää-ankkuri, rakenne-5 pehmennys, laajan syvyyspalkkio)", blind: true, langs: {} };

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
      metricsBefore: lang === "es" ? { short: metricsFromV349("short"), long: metricsFromV349("long") } : null,
      cases: ok, errored: graded.filter((r) => r.error),
    };
    const ms = metricsFor(short), ml = metricsFor(long);
    console.log(`  [${lang}] LYHYT MAE ${ms?.mae} ρ ${ms?.spearman} max ${ms?.maxMiss} → ${verdict(ms, "short").pass ? "PASS" : "FAIL"}`);
    console.log(`  [${lang}] LAAJA MAE ${ml?.mae} ρ ${ml?.spearman} → ${verdict(ml, "long").pass ? "PASS" : "FAIL"}`);
  }

  writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), "utf8");
  writeFileSync(OUT_MD, renderMd(out), "utf8");
  console.log(`\nKirjoitettu:\n  ${OUT_JSON}\n  ${OUT_MD}`);
}

function renderMd(out) {
  const parts = [];
  parts.push(`# L-V350 — Arviointimoottorin kalibrointi + held-out-validointi (espanja + saksa)

**Päivä:** 2026-06-02
**Kalibrointi:** \`lib/writingGrading.js\` → \`buildGradingPrompt\` sai \`SCORING CALIBRATION\` -lohkon: (a) eksplisiittinen E/L-yläpää-ankkuri, (b) \`kielen_rakenteet\`-5 ei vaadi virheettömyyttä, (c) laajan tehtävän syvyyspalkkio. **Lukittu ENNEN saksan ajoa** (anti-ylisovitus).
**Sokkous:** moottori sai vain oppilaan tekstin + tehtäväkontekstin; \`officialScore\`/\`officialRationale\` stripattiin ennen kutsua.
**Skaala:** moottori 0–20 → YTL-pisteet ×33/20 (lyhyt), ×66/20 (laaja). Spearman raa'asta 0–20-summasta.
**Metodi:** espanja = in-sample (sama setti jolla L-V349 diagnosoi biaksen, "ennen" = L-V349:n pre-kalibrointiluvut). **Saksa = held-out** (uusi setti, EI käytetty promptin viritykseen) → yleistymistesti.
**Lukitut rajat:** lyhyt MAE ≤ 3, max ≤ 6, ρ ≥ 0.8 · laaja MAE ≤ 6, ρ ≥ 0.8.
`);

  // Overall verdict line
  const v = (lang, type) => verdict(out.langs[lang]?.metricsAfter?.[type], type).pass;
  const allPass = ["es", "de"].filter((l) => out.langs[l]).every((l) => v(l, "short") && v(l, "long"));
  parts.push(`## Verdict\n\n**${allPass ? "PASS molemmilla kielillä ✅" : "EI vielä PASS ❌"}** — ${allPass ? "ydin luotettava; scope-laajennus (englanti/ruotsi/äidinkieli) perusteltu." : "katso kieli/tehtävätyyppi-kohtaiset rivit alla. Älä laajenna ennen kuin molemmat PASS."}\n`);

  for (const lang of Object.keys(out.langs)) {
    const L = out.langs[lang];
    const short = L.cases.filter((c) => c.taskType === "short").sort((a, b) => b.officialScore - a.officialScore);
    const long = L.cases.filter((c) => c.taskType === "long").sort((a, b) => b.officialScore - a.officialScore);
    parts.push(`\n---\n\n## ${LANG_NAME[lang]} — ${lang.toUpperCase()}\n`);
    parts.push(`Caset: parsittu ${L.counts.parsed}, arvioitu ${L.counts.graded}, virheitä ${L.counts.errored}, parsimatta ${L.counts.unparsed}.`);
    if (L.unparsed.length) parts.push(`\n> Parsimatta:\n${L.unparsed.map((u) => `> - ${JSON.stringify(u)}`).join("\n")}`);

    parts.push(`\n### Lyhyt (max 33 p)\n${fmtMetrics(L.metricsAfter.short, "short")}`);
    if (L.metricsBefore?.short) parts.push(`\n**Ennen vs. jälkeen (kalibroinnin vaikutus):**\n${fmtBeforeAfter(L.metricsBefore.short, L.metricsAfter.short, "short")}`);
    parts.push(`\n### Laaja (max 66 p)\n${fmtMetrics(L.metricsAfter.long, "long")}`);
    if (L.metricsBefore?.long) parts.push(`\n**Ennen vs. jälkeen:**\n${fmtBeforeAfter(L.metricsBefore.long, L.metricsAfter.long, "long")}`);

    parts.push(`\n#### Caset — lyhyt\n${fmtTable(short)}`);
    parts.push(`\n#### Caset — laaja\n${fmtTable(long)}`);
    if (L.errored.length) parts.push(`\n#### Virheelliset\n${L.errored.map((e) => `- ${e.id}: ${e.error}`).join("\n")}`);
  }

  parts.push(`\n---\n\n## Caveatit
- Saksan setissä ei ole 66 p -huippua (korkein 62 p), joten laajan yläpää-erottelu testautuu hieman heikommin kuin espanjassa.
- PDF→teksti-purku tuottaa OCR-artefakteja molemmissa kielissä. Saksan caset tarkistettu silmämääräisesti parsittaessa (Viesti-ankkuri erottaa vastauksen rationaalista).
- Tehtävänannot syötettiin tiivistettyinä (YTL antaa ne suomeksi). Ei vaikuta arvioitavaan tekstiin.
- Anti-ylisovitus: prompt-muutos tehtiin pelkästään L-V349:n espanja-diagnoosista ja lukittiin ennen saksan ajoa. Saksa ajettiin kerran. Jos saksa ei läpäise, sitä EI viritetä erikseen.
- temp 0.2 ei ole täysin deterministinen; "ennen"-luvut ovat L-V349:n erillisestä ajosta, joten pienet erot voivat johtua myös ajovariaatiosta, eivät pelkästä promptista. Suunta + suuruusluokka ovat silti todisteita.
`);
  return parts.join("\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
