// L-V354 — Coverage-calibrated SCORE RANGES, built OFFLINE from V351's saved
// predictions. NOLLA API-kutsua: kaikki ennusteet luetaan V351:n ajosta
// (docs/audits/2026-06-02-L-V351-*.json), joka käytti TÄSMÄLLEEN saman putken
// kuin tuotanto nyt L-V354:n jälkeen (gpt-5.4-mini + few-shot + natiiviasteikko).
//
// Idea (EI V352:n hauras pistefit): moottorin ranking on hyvä (ρ 0.84–0.95),
// absoluuttinen ennuste systemaattisesti vino. Sen sijaan että pakottaisimme
// yhden tarkan luvun, näytämme VÄLJÄN INTERVALLIN joka absorboi sekä vinouman
// että kohinan. Per (kieli × tehtävätyyppi):
//   1. residuaali r_i = officialScore_i − predYtl_i  (kuinka paljon virallinen
//      on raakaennustetta korkeampi; positiivinen koska moottori on ankara)
//   2. tightin intervalli [lo, hi] joka kattaa ≥80 % residuaaleista, niin kapea
//      kuin tuo kattavuus sallii (liukuva ikkuna lajitelluissa residuaaleissa)
//   3. tuotannossa haarukka = [pred+lo, pred+hi] clampattuna [0,max]
//   4. jos toteutunut leveys on absurdi numeroiksi → solu merkitään band-only:ksi
//      (ei pakoteta hyödytöntä lukua; brief §18 + §45)
//
// Robustius tulee LEVEYDESTÄ + kattavuustavoitteesta, ei mallin täsmäosumasta.
//
// Run: node scripts/calibrate-ranges.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const V351_JSON = join(ROOT, "docs", "audits", "2026-06-02-L-V351-grading-gpt54mini-fewshot.json");

const COVERAGE_TARGET = 0.80;
const MAX = { short: 33, long: 66 };

// Width threshold above which a numeric range is useless → show band only.
// Documented choice: a range is informative if it pins the score to roughly a
// third of the scale or tighter. short(0–33): ≤11; long(0–66): ≤22.
// (Brief example "±10/66 → 38–58" = width 20 is borderline-useless; we keep the
// long bar at 22 = exactly a third, anything wider collapses to band.)
const WIDTH_LIMIT = { short: 11, long: 22 };

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const round = (x) => Math.round(x * 100) / 100;

// Native-scale band cutoffs (mirror lib/writingGrading.js pointsToGradeNative).
const GRADE_CUTS_20 = [[16, "L"], [13, "E"], [10, "M"], [7, "C"], [4, "B"], [2, "A"]];
function bandNative(score, max) {
  for (const [t20, g] of GRADE_CUTS_20) if (score >= t20 * (max / 20)) return g;
  return "I";
}

// Tightest [lo,hi] window (over sorted residuals) covering >= k points.
function tightestWindow(residuals, k) {
  const s = [...residuals].sort((a, b) => a - b);
  const n = s.length;
  k = Math.min(k, n);
  let best = null;
  for (let i = 0; i + k - 1 < n; i++) {
    const lo = s[i], hi = s[i + k - 1], width = hi - lo;
    if (!best || width < best.width) best = { lo, hi, width };
  }
  return best;
}

// ── Load V351 saved predictions ───────────────────────────────────────────────
const v351 = JSON.parse(readFileSync(V351_JSON, "utf8"));
const cells = {};
for (const lang of ["es", "de", "fr"]) {
  const cs = v351.langs?.[lang]?.cases || [];
  for (const c of cs) {
    if (!Number.isFinite(c.predYtl) || !Number.isFinite(c.officialScore)) continue;
    const key = `${lang}-${c.taskType}`;
    (cells[key] ||= { lang, taskType: c.taskType, preds: [], officials: [], ids: [] });
    cells[key].preds.push(c.predYtl);
    cells[key].officials.push(c.officialScore);
    cells[key].ids.push(c.id);
  }
}

const ORDER = ["es-short", "es-long", "de-short", "de-long", "fr-short", "fr-long"];
const baked = {};
console.log("\n=== L-V354 — pistehaarukan kattavuus-kalibrointi (OFFLINE, 0 API) ===\n");
console.log("Lähde: V351:n tallennetut raakaennusteet (predYtl), sama putki kuin tuotanto L-V354:n jälkeen.\n");
console.log(`Kattavuustavoite ${COVERAGE_TARGET * 100}%. Leveysraja numeroille: short ≤${WIDTH_LIMIT.short}, long ≤${WIDTH_LIMIT.long}.\n`);

for (const key of ORDER) {
  const cell = cells[key];
  if (!cell) { console.log(`${key}: EI DATAA\n`); continue; }
  const { lang, taskType, preds, officials } = cell;
  const max = MAX[taskType];
  const n = preds.length;

  // Residuals: how much higher the official score is than the raw prediction.
  const resid = preds.map((p, i) => officials[i] - p);
  const k = Math.ceil(COVERAGE_TARGET * n);
  const { lo, hi, width } = tightestWindow(resid, k);

  // Actual coverage of [lo,hi] (may exceed target due to ties).
  const covered = resid.filter((r) => r >= lo && r <= hi).length;
  const coverage = round(covered / n);
  const biasRaw = round(mean(resid)); // mean(official − pred): + = engine harsh

  const mode = width <= WIDTH_LIMIT[taskType] ? "range" : "band";

  baked[key] = { lang, taskType, max, n, lo, hi, width, coverage, mode };

  console.log(`── ${key.toUpperCase()} (n=${n}, max=${max}) ──`);
  console.log(`  raaka bias (official−pred): ${biasRaw >= 0 ? "+" : ""}${biasRaw}  → moottori ${biasRaw > 0 ? "ankara" : "leppeä"}`);
  console.log(`  ${COVERAGE_TARGET * 100}%-intervalli residuaaleista: [${lo >= 0 ? "+" : ""}${lo}, ${hi >= 0 ? "+" : ""}${hi}]  leveys ${width}`);
  console.log(`  toteutunut kattavuus: ${(coverage * 100).toFixed(0)}% (${covered}/${n})`);
  console.log(`  → haarukka tuotannossa: [pred${lo >= 0 ? "+" : ""}${lo}, pred${hi >= 0 ? "+" : ""}${hi}] clamp[0,${max}]`);
  console.log(`  NÄYTTÖTAPA: ${mode === "range" ? "NUMEROHAARUKKA ✅" : `BAND-ONLY ⚠️ (leveys ${width} > ${WIDTH_LIMIT[taskType]})`}\n`);
}

// ── Paste-ready constant for lib/writingGrading.js ──────────────────────────────
console.log("=== BAKE-VALMIS VAKIO (lib/writingGrading.js) ===\n");
const constLines = ORDER.filter((k) => baked[k]).map((k) => {
  const b = baked[k];
  return `  "${k}": { lo: ${b.lo}, hi: ${b.hi}, mode: "${b.mode}", max: ${b.max}, coverage: ${b.coverage}, n: ${b.n} },`;
});
console.log("export const SCORE_RANGE_CAL = {\n" + constLines.join("\n") + "\n};");

const rangeCells = ORDER.filter((k) => baked[k] && baked[k].mode === "range");
const bandCells = ORDER.filter((k) => baked[k] && baked[k].mode === "band");
console.log(`\nNumerohaarukka: ${rangeCells.join(", ") || "(ei yhtään)"}`);
console.log(`Band-only:      ${bandCells.join(", ") || "(ei yhtään)"}`);

// Example renders so the frontend impact is visible.
console.log("\n=== ESIMERKKIRENDERÖINNIT ===");
for (const k of ORDER) {
  const b = baked[k];
  if (!b) continue;
  const examplePred = b.taskType === "short" ? 22 : 44;
  const rLo = Math.max(0, Math.min(b.max, Math.round(examplePred + b.lo)));
  const rHi = Math.max(0, Math.min(b.max, Math.round(examplePred + b.hi)));
  const mid = Math.round((rLo + rHi) / 2);
  const band = bandNative(mid, b.max);
  if (b.mode === "range") {
    console.log(`  ${k}: pred ${examplePred} → "${rLo}–${rHi} / ${b.max}"  (taso ${band})`);
  } else {
    console.log(`  ${k}: pred ${examplePred} → "Taso ${band}"  (band-only, leveys ${b.width})`);
  }
}

const dump = { generatedFor: "L-V354", source: "V351 saved preds (gpt-5.4-mini + few-shot + native scale)", coverageTarget: COVERAGE_TARGET, widthLimit: WIDTH_LIMIT, cells: baked };
const OUT_JSON = join(ROOT, "docs", "audits", "2026-06-02-L-V354-pistehaarukka-kalibrointi.json");
writeFileSync(OUT_JSON, JSON.stringify(dump, null, 2), "utf8");
console.log(`\nKirjoitettu: ${OUT_JSON}`);
