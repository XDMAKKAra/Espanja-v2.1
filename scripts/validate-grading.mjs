// L-V349 — Blind validation of the production writing-grading engine against
// YTL's official sample answers (Espanja, lyhyt oppimäärä).
//
// What this does, end to end:
//   1. Parse docs/yo-espanja-naytevastaukset.txt into structured cases
//      ({ id, taskType, aihe, title, answer, officialScore, officialRationale }).
//   2. Grade each case BLIND using the SAME production functions the
//      Treeni/landing routes use: buildGradingPrompt + callOpenAI(temp 0.2,
//      json_object) + processGradingResult. The engine never sees the official
//      score or rationale — only the student text + task context.
//   3. Compute per-task-type metrics (short vs long, because the YTL scales are
//      33 vs 66 while the engine scale is 0–20): MAE, ±2/±4 hit rate, max miss,
//      Spearman rank correlation, signed bias.
//   4. Write a raw per-case JSON + a markdown report skeleton.
//
// The engine produces a 0–20 rubric total. To compare against YTL points we
// rescale linearly: predYtl = finalScore / 20 * pointsMax (33 short / 66 long).
// Spearman is computed on the raw engine total (rank-invariant to scaling).
//
// Run: node scripts/validate-grading.mjs   (needs OPENAI_API_KEY in .env)
// Cost: ~37 gpt-4o-mini calls. No DB writes (dev cache is in-memory).

import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildGradingPrompt, processGradingResult } from "../lib/writingGrading.js";
import { callOpenAI } from "../lib/openai.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "docs", "yo-espanja-naytevastaukset.txt");
const OUT_JSON = join(ROOT, "docs", "audits", "2026-06-02-L-V349-grading-validation.json");
const OUT_MD = join(ROOT, "docs", "audits", "2026-06-02-L-V349-grading-validation.md");
const LANG = "es";

// ── Task definitions, drawn from the YTL task brief at the top of the file.
// Keyed by [taskType][aiheNumber]. situation/prompt/requirements feed the same
// task-context block the production grader builds.
const SHORT = { charMin: 160, charMax: 240, points: 33 };
const LONG = { charMin: 300, charMax: 450, points: 66 };

const TASKS = {
  short: {
    1: {
      title: "En los probadores",
      situation: "Vaatekaupan sovituskopista löydät jonkun unohtaman espanjaksi kirjoitetun päiväkirjan. Ensimmäisellä sivulla on omistajan kuva ja sähköpostiosoite. Päätät lähettää hänelle sähköpostia.",
      prompt: "Escribe un correo electrónico en español al dueño del diario: cuenta qué ha pasado y cómo puede recuperarlo.",
      requirements: ["Kerro mitä on tapahtunut", "Kerro miten päiväkirjan voi saada takaisin", "Kohtelias sähköpostin rekisteri"],
      textType: "sähköpostiviesti",
    },
    2: {
      title: "Una nueva vecina",
      situation: "Naapuriisi on äskettäin muuttanut ikäisesi tyttö Meksikosta. Kirjoita hänelle espanjaksi kortti, jonka pudotat hänen postilaatikkoonsa.",
      prompt: "Escribe en español una tarjeta de bienvenida a tu nueva vecina: preséntate, ofrécele enseñarle lugares interesantes y presentarle a jóvenes de su edad.",
      requirements: ["Esittele itsesi", "Kerro mielenkiintoisista paikoista", "Mainitse samanikäiset nuoret"],
      textType: "kortti",
    },
    3: {
      title: "Un trabajador en prácticas",
      situation: "Espanjan kurssisi argentiinalaiselle harjoittelijalle Miguelille pidettiin läksiäisjuhla, mutta et ollut paikalla. Kirjoita hänelle kohtelias viesti.",
      prompt: "Escribe un mensaje cortés a Miguel explicando por qué no asististe a su fiesta de despedida. Empieza: Querido Miguel: y termina: Saludos,",
      requirements: ["Selitä miksi et ollut paikalla", "Kohtelias rekisteri", "Aloitus 'Querido Miguel:' ja lopetus 'Saludos,'"],
      textType: "viesti",
    },
    4: {
      title: "Mensaje a un amigo",
      situation: "Espanjankielinen ystäväsi on surullinen, sillä hänelle on tapahtunut jotakin ikävää. Kirjoita hänelle viesti auttaaksesi ja ilahduttaaksesi häntä.",
      prompt: "Escribe un mensaje a tu amigo para ayudarle y animarle. Usa lengua estándar y frases completas.",
      requirements: ["Osoita myötätuntoa", "Ilahduta ystävää", "Kokonaiset virkkeet, yleiskieli"],
      textType: "viesti",
    },
  },
  long: {
    1: {
      title: "#pequeñosactos #grandescambios",
      situation: "Espanjankielisessä sosiaalisessa mediassa keskustellaan siitä, miten maailmaa voi muuttaa pienin teoin. Kirjoita, mitä sinä olet tehnyt tai voit tehdä muuttaaksesi maailmaa.",
      prompt: "Escribe una publicación en redes sociales sobre qué has hecho o puedes hacer para cambiar el mundo con pequeños actos.",
      requirements: ["Kerro konkreettisia tekoja", "Perustele näkemyksesi", "Someteksti, ota kantaa"],
      textType: "some-julkaisu",
    },
    2: {
      title: "Un estudiante chileno",
      situation: "Luokallesi on tulossa chileläinen vaihto-opiskelija. Kirjoita osuus, jossa kerrot, mitä kotipaikkakunnallasi voi tehdä vapaa-ajalla ilmaiseksi tai edullisesti.",
      prompt: "Escribe un texto contando qué se puede hacer en tu ciudad en el tiempo libre de forma gratuita o barata.",
      requirements: ["Useita ilmaisia tai edullisia aktiviteetteja", "Kuvaile paikkoja", "Sidosteinen teksti"],
      textType: "teksti",
    },
    3: {
      title: "Maneras de vivir",
      situation: "Seuraamallasi keskustelupalstalla puhutaan parhaasta asumismuodosta: vanhempien kanssa, yksin vai kavereiden kanssa. Kommentoi ja kerro oma näkemyksesi.",
      prompt: "Comenta en el foro cuál crees que es la mejor manera de vivir y por qué.",
      requirements: ["Ota kantaa", "Vertaile asumismuotoja", "Perustele näkemys"],
      textType: "foorumikommentti",
    },
    4: {
      title: "Un buen sitio para visitar",
      situation: "Kirjoita TripAdvisor-matkailusivustolle kuvaus jostakin kotikaupunkisi paikasta ja kerro, miksi suosittelet vierailemaan siellä.",
      prompt: "Escribe una reseña en TripAdvisor sobre un lugar de tu ciudad y explica por qué recomiendas visitarlo.",
      requirements: ["Kuvaile paikkaa", "Perustele suositus", "Arvostelutyyli"],
      textType: "TripAdvisor-arvio",
    },
  },
};

// ── Parse ────────────────────────────────────────────────────────────────────
function parseCases(rawText) {
  // Strip the OCR page markers so they can't land inside an answer body.
  const text = rawText.replace(/^====\s*PAGE\s*\d+\s*====\s*$/gm, "");

  // The file has two "Laajempi kirjoitustehtävä" headers: the task brief (top)
  // and the answer section (bottom). Everything after the LAST one is a long
  // answer; everything before it (in the answer region) is short.
  const longBoundary = text.lastIndexOf("Laajempi kirjoitustehtävä");
  if (longBoundary < 0) throw new Error("Could not locate the long-task answer section boundary.");

  // Each case: "Aihe N: title" → answer body → "PISTEET: X" → rationale (until
  // the next Aihe / Laajempi header / EOF).
  const re = /Aihe\s*(\d+)\s*:\s*([^\n]*)\n([\s\S]*?)PISTEET:\s*(\d+)\s*([\s\S]*?)(?=Aihe\s*\d+\s*:|Laajempi kirjoitustehtävä|$)/g;

  const cases = [];
  const unparsed = [];
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    i++;
    const aihe = parseInt(m[1], 10);
    const titleLine = m[2].trim();
    const answer = m[3].replace(/\r/g, "").trim();
    const officialScore = parseInt(m[4], 10);
    const officialRationale = m[5].replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
    const taskType = m.index > longBoundary ? "long" : "short";

    const taskDef = TASKS[taskType]?.[aihe];
    if (!taskDef) {
      unparsed.push({ seq: i, taskType, aihe, titleLine, reason: "no task definition for this aihe number" });
      continue;
    }
    if (!answer || answer.length < 20) {
      unparsed.push({ seq: i, taskType, aihe, titleLine, reason: `answer too short to grade (${answer.length} chars)` });
      continue;
    }

    cases.push({
      id: `${taskType}-${aihe}-${cases.filter((c) => c.taskType === taskType && c.aihe === aihe).length + 1}`,
      taskType,
      aihe,
      title: taskDef.title,
      titleLineRaw: titleLine,
      answer,
      officialScore,
      officialRationale,
    });
  }
  return { cases, unparsed };
}

// ── Grade one case BLIND ───────────────────────────────────────────────────────
async function gradeCase(c) {
  const base = c.taskType === "short" ? SHORT : LONG;
  const taskDef = TASKS[c.taskType][c.aihe];
  const task = {
    taskType: c.taskType,
    charMin: base.charMin,
    charMax: base.charMax,
    points: base.points,
    situation: taskDef.situation,
    prompt: taskDef.prompt,
    requirements: taskDef.requirements,
    textType: taskDef.textType,
  };
  const isShort = c.taskType === "short";
  const charCount = c.answer.replace(/\s/g, "").length;

  // Same call shape as routes/writing.js /grade-writing. studentName="" so the
  // redacted [Nimi] placeholders never leak a (fake) name and the variable is
  // held constant across all cases.
  const prompt = buildGradingPrompt(task, c.answer, isShort, LANG, "");
  const aiResult = await callOpenAI(prompt, 2500, {
    temperature: 0.2,
    responseFormat: { type: "json_object" },
  });
  delete aiResult._usage;
  const result = processGradingResult(aiResult, charCount, task.charMin, isShort, c.answer);

  const pointsMax = base.points;
  const predYtl = (result.finalScore / 20) * pointsMax;
  return {
    ...c,
    charCount,
    penalty: result.penalty,
    engineRaw20: result.finalScore,
    predYtl: Math.round(predYtl * 10) / 10,
    diff: Math.round((predYtl - c.officialScore) * 10) / 10,
    dims: {
      viestinnallisyys: result.viestinnallisyys.score,
      kielen_rakenteet: result.kielen_rakenteet.score,
      sanasto: result.sanasto.score,
      kokonaisuus: result.kokonaisuus.score,
    },
    band: result.ytlGrade,
    overall_feedback_fi: result.overall_feedback_fi,
    next_action_fi: result.next_action_fi,
  };
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function mean(a) { return a.reduce((s, x) => s + x, 0) / a.length; }

function averageRanks(values) {
  // Returns ranks (1-based) with ties averaged.
  const idx = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(values.length);
  let j = 0;
  while (j < idx.length) {
    let k = j;
    while (k + 1 < idx.length && idx[k + 1][0] === idx[j][0]) k++;
    const avg = (j + k) / 2 + 1; // average of positions j..k, 1-based
    for (let t = j; t <= k; t++) ranks[idx[t][1]] = avg;
    j = k + 1;
  }
  return ranks;
}

function pearson(x, y) {
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return NaN;
  return num / Math.sqrt(dx * dy);
}

function spearman(x, y) {
  return pearson(averageRanks(x), averageRanks(y));
}

function metricsFor(rows) {
  const diffs = rows.map((r) => r.diff);
  const absDiffs = diffs.map(Math.abs);
  const official = rows.map((r) => r.officialScore);
  const engine = rows.map((r) => r.engineRaw20);
  const n = rows.length;
  return {
    n,
    mae: round(mean(absDiffs)),
    bias: round(mean(diffs)),
    within2: round((absDiffs.filter((d) => d <= 2).length / n) * 100),
    within4: round((absDiffs.filter((d) => d <= 4).length / n) * 100),
    maxMiss: round(Math.max(...absDiffs)),
    spearman: round(spearman(engine, official)),
  };
}

function round(x) { return Math.round(x * 100) / 100; }

// ── Concurrency-limited map ────────────────────────────────────────────────────
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ── Report ──────────────────────────────────────────────────────────────────────
const PASS = {
  short: { mae: 3, maxMiss: 6, spearman: 0.8 },
  long: { mae: 6, spearman: 0.8 },
};

function verdict(metrics, type) {
  const t = PASS[type];
  const checks = [
    { name: `MAE ≤ ${t.mae}`, ok: metrics.mae <= t.mae, got: metrics.mae },
    { name: `Spearman ρ ≥ ${t.spearman}`, ok: metrics.spearman >= t.spearman, got: metrics.spearman },
  ];
  if (t.maxMiss !== undefined) {
    checks.push({ name: `max-heitto ≤ ${t.maxMiss}`, ok: metrics.maxMiss <= t.maxMiss, got: metrics.maxMiss });
  }
  return { pass: checks.every((c) => c.ok), checks };
}

function fmtTable(rows) {
  const head = "| case-id | tehtävä | YTL | moottori (0–20) | ennuste-YTL | ero | dims V/R/S/K | band |\n|---|---|---|---|---|---|---|---|";
  const body = rows
    .map((r) => `| ${r.id} | ${r.title} | ${r.officialScore} | ${r.engineRaw20} | ${r.predYtl} | ${r.diff >= 0 ? "+" : ""}${r.diff} | ${r.dims.viestinnallisyys}/${r.dims.kielen_rakenteet}/${r.dims.sanasto}/${r.dims.kokonaisuus} | ${r.band} |`)
    .join("\n");
  return `${head}\n${body}`;
}

function fmtMetrics(m, type) {
  const v = verdict(m, type);
  const lines = [
    `- **n:** ${m.n}`,
    `- **MAE:** ${m.mae} p`,
    `- **±2 p osuvuus:** ${m.within2} %`,
    `- **±4 p osuvuus:** ${m.within4} %`,
    `- **Max-heitto:** ${m.maxMiss} p`,
    `- **Spearman ρ:** ${m.spearman}`,
    `- **Bias (ennuste − YTL):** ${m.bias >= 0 ? "+" : ""}${m.bias} p ${m.bias > 0 ? "(moottori lepsu)" : m.bias < 0 ? "(moottori ankara)" : ""}`,
    "",
    `**Verdict: ${v.pass ? "PASS ✅" : "FAIL ❌"}**`,
    ...v.checks.map((c) => `  - ${c.ok ? "✅" : "❌"} ${c.name} (toteutui: ${c.got})`),
  ];
  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY puuttuu (.env). Keskeytetään.");
    process.exit(1);
  }

  const raw = readFileSync(SRC, "utf8");
  const { cases, unparsed } = parseCases(raw);
  console.log(`Parsittu ${cases.length} casea (short: ${cases.filter((c) => c.taskType === "short").length}, long: ${cases.filter((c) => c.taskType === "long").length}).`);
  if (unparsed.length) {
    console.warn(`VAROITUS: ${unparsed.length} lohkoa ei parsiutunut:`);
    for (const u of unparsed) console.warn(`  - seq ${u.seq} [${u.taskType} aihe ${u.aihe}] "${u.titleLine}": ${u.reason}`);
  }

  console.log(`Arvioidaan ${cases.length} casea sokkona (gpt-4o-mini, temp 0.2). Kesto ~1–2 min...`);
  const t0 = Date.now();
  let done = 0;
  const graded = await mapLimit(cases, 4, async (c) => {
    try {
      const r = await gradeCase(c);
      done++;
      if (done % 5 === 0 || done === cases.length) console.log(`  ...${done}/${cases.length}`);
      return r;
    } catch (err) {
      console.error(`  VIRHE casessa ${c.id}: ${err.message}`);
      return { ...c, error: err.message };
    }
  });
  console.log(`Valmis ${Math.round((Date.now() - t0) / 1000)} s.`);

  const ok = graded.filter((r) => !r.error);
  const errored = graded.filter((r) => r.error);
  const short = ok.filter((r) => r.taskType === "short").sort((a, b) => b.officialScore - a.officialScore);
  const long = ok.filter((r) => r.taskType === "long").sort((a, b) => b.officialScore - a.officialScore);

  const mShort = metricsFor(short);
  const mLong = metricsFor(long);

  // Top outliers by |diff| for the "missä pettää" analysis.
  const outliers = [...ok].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5);

  const payload = {
    generatedFor: "L-V349",
    date: "2026-06-02",
    source: "docs/yo-espanja-naytevastaukset.txt",
    engine: "lib/writingGrading.js + callOpenAI(gpt-4o-mini, temp 0.2) [production path]",
    scaleNote: "Engine total is 0–20; rescaled to YTL points (short ×33/20, long ×66/20). Spearman uses raw engine total.",
    blind: true,
    counts: { parsed: cases.length, graded: ok.length, errored: errored.length, unparsed: unparsed.length },
    unparsed,
    metrics: { short: mShort, long: mLong },
    passThresholds: PASS,
    verdict: { short: verdict(mShort, "short"), long: verdict(mLong, "long") },
    cases: ok,
    errored,
    outliers: outliers.map((o) => ({
      id: o.id, taskType: o.taskType, official: o.officialScore, predYtl: o.predYtl, diff: o.diff,
      officialRationale: o.officialRationale, engineFeedback: o.overall_feedback_fi, dims: o.dims,
    })),
  };
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = `# L-V349 — Arviointimoottorin sokkovalidointi (espanja, lyhyt oppimäärä)

**Päivä:** 2026-06-02
**Lähde:** \`docs/yo-espanja-naytevastaukset.txt\` (YTL:n viralliset näytevastaukset + pisteet)
**Moottori:** tuotannon \`lib/writingGrading.js\` + \`callOpenAI(gpt-4o-mini, temp 0.2, json_object)\` — sama polku jota \`/grade-writing\` ja landing-demo käyttävät.
**Sokkous:** moottori sai vain oppilaan tekstin + tehtäväkontekstin. \`officialScore\` ja \`officialRationale\` stripattiin ennen kutsua (ks. \`scripts/validate-grading.mjs\` → \`gradeCase\`, ei välitä niitä \`buildGradingPrompt\`:lle).
**Skaala:** moottori antaa 0–20. Vertailua varten skaalattu YTL-pisteiksi lineaarisesti (lyhyt ×33/20, laaja ×66/20). Spearman laskettu raa'asta 0–20-summasta (järjestysinvariantti).

**Caset:** parsittu ${cases.length}, arvioitu ${ok.length}, virheitä ${errored.length}, parsimatta ${unparsed.length}.
${unparsed.length ? `\n> Parsimatta jääneet:\n${unparsed.map((u) => `> - seq ${u.seq} [${u.taskType} aihe ${u.aihe}] "${u.titleLine}": ${u.reason}`).join("\n")}\n` : ""}
---

## Yhteenveto

### Lyhyt kirjoitustehtävä (max 33 p)
${fmtMetrics(mShort, "short")}

### Laaja kirjoitustehtävä (max 66 p)
${fmtMetrics(mLong, "long")}

**Läpäisyrajat (lukitut):** lyhyt MAE ≤ 3, max-heitto ≤ 6, ρ ≥ 0.8 · laaja MAE ≤ 6, ρ ≥ 0.8.

---

## Caset — lyhyt (laskeva YTL)
${fmtTable(short)}

## Caset — laaja (laskeva YTL)
${fmtTable(long)}
${errored.length ? `\n## Virheelliset caset\n${errored.map((e) => `- ${e.id}: ${e.error}`).join("\n")}\n` : ""}
---

## Suurimmat heitot (top 5 |ero|)

${outliers.map((o) => `### ${o.id} — YTL ${o.officialScore} vs moottori ${o.predYtl} (ero ${o.diff >= 0 ? "+" : ""}${o.diff})
**YTL:n perustelu:** ${o.officialRationale.slice(0, 600)}

**Moottorin palaute:** ${o.overall_feedback_fi}

**Dims V/R/S/K:** ${o.dims.viestinnallisyys}/${o.dims.kielen_rakenteet}/${o.dims.sanasto}/${o.dims.kokonaisuus}
`).join("\n")}

---

## "Missä pettää" -analyysi

_(Täytetään ajon tulosten perusteella — ks. JSON \`docs/audits/2026-06-02-L-V349-grading-validation.json\`.)_

## Caveatit
- Lähde on PDF→teksti-purettu. Osa caseista sisältää OCR-yhdistymiä (esim. "amigos eintroducir", "lugarleer", "haypuestos"), jotka EIVÄT ole oppilaan virheitä vaan purkuartefakteja. Nämä voivat hieman rankaista moottoria epäreilusti sanasto/rakenne-pisteissä.
- Tehtävänannot syötettiin tiivistettyinä (YTL antaa ne suomeksi; moottorin \`task.prompt\` on lyhyt espanjankielinen tiivistelmä). Tämä ei vaikuta arvioitavaan tekstiin, vain kehystykseen.
`;
  writeFileSync(OUT_MD, md, "utf8");

  console.log(`\nKirjoitettu:\n  ${OUT_JSON}\n  ${OUT_MD}`);
  console.log(`\nLYHYT: MAE ${mShort.mae}, ρ ${mShort.spearman}, max ${mShort.maxMiss}, bias ${mShort.bias} → ${verdict(mShort, "short").pass ? "PASS" : "FAIL"}`);
  console.log(`LAAJA: MAE ${mLong.mae}, ρ ${mLong.spearman}, max ${mLong.maxMiss}, bias ${mLong.bias} → ${verdict(mLong, "long").pass ? "PASS" : "FAIL"}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
