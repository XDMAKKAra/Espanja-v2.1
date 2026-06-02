// L-V353 VAIHE 0 — per-kieli, per-tehtävätyyppi -affiinikalibroinnin OFFLINE-
// rakennus + LOOCV-deriskaus. NOLLA API-kutsua: kaikki ennusteet luetaan
// V351:n tallennetusta ajosta (docs/audits/2026-06-02-L-V351-*.json).
//
// Tuottaa per (lang × taskType):
//   - raaka MAE / bias / Spearman ρ (predYtl vs officialScore)
//   - täysi affiinisovitus corrected = a·pred + b (pienin neliösumma) + R²
//   - LOOCV-korjattu MAE / max-heitto (jokainen case ennustettu saman solun
//     MUISTA caseista sovitetulla (a,b):llä → held-out-vastaava ilman erillistä
//     testisettiä; välttämätön koska FR n=6/solu)
//   - projektio: läpäiseekö LOOCV-korjattu solun lukitut rajat
//
// ρ on invariantti positiivisen affiinin alla → LOOCV-ρ ≈ raaka-ρ; raportoidaan
// raaka-ρ projektion ρ-portiksi (rehellinen: kalibrointi EI korjaa rankingia).
//
// Run: node scripts/calibrate-offline.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const V351_JSON = join(ROOT, "docs", "audits", "2026-06-02-L-V351-grading-gpt54mini-fewshot.json");

const PASS = { short: { mae: 3, maxMiss: 6, spearman: 0.8, max: 33 }, long: { mae: 6, spearman: 0.8, max: 66 } };

// ── Stats ────────────────────────────────────────────────────────────────────
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const round = (x) => Math.round(x * 100) / 100;
const round3 = (x) => Math.round(x * 1000) / 1000;

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

// Least-squares fit official ≈ a·pred + b. Returns {a,b,r2,n}.
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
  let ssRes = 0;
  for (let i = 0; i < n; i++) { const e = officials[i] - (a * preds[i] + b); ssRes += e * e; }
  const r2 = vo === 0 ? NaN : 1 - ssRes / vo;
  return { a: round3(a), b: round3(b), r2: round3(r2), n };
}

// Production-identical remap: clamp [0,max] + integer round.
function applyAffine(pred, a, b, max) {
  return Math.max(0, Math.min(max, Math.round(a * pred + b)));
}

// LOOCV: for each case, fit (a,b) on the OTHER cases of the same cell, predict
// the held-out one. Returns array of corrected predictions aligned to input.
function loocv(preds, officials, max) {
  const n = preds.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const trP = [], trO = [];
    for (let k = 0; k < n; k++) if (k !== i) { trP.push(preds[k]); trO.push(officials[k]); }
    const { a, b } = fitAffine(trP, trO);
    out[i] = applyAffine(preds[i], a, b, max);
  }
  return out;
}

function maeMetrics(preds, officials) {
  const diffs = preds.map((p, i) => p - officials[i]);
  const abs = diffs.map(Math.abs);
  return {
    n: preds.length,
    mae: round(mean(abs)),
    bias: round(mean(diffs)),
    maxMiss: round(Math.max(...abs)),
    within2: round((abs.filter((d) => d <= 2).length / preds.length) * 100),
  };
}

// ── Load V351 saved predictions ───────────────────────────────────────────────
const v351 = JSON.parse(readFileSync(V351_JSON, "utf8"));
const cells = {}; // cells[`${lang}-${taskType}`] = {preds:[], officials:[], cases:[]}
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

// ── Per-cell analysis ──────────────────────────────────────────────────────────
const ORDER = ["es-short", "es-long", "de-short", "de-long", "fr-short", "fr-long"];
const results = {};
console.log("\n=== L-V353 VAIHE 0 — per-kieli-affiinikalibrointi (OFFLINE, 0 API) ===\n");
console.log("Lähde: V351:n tallennetut raakaennusteet (gpt-5.4-mini + few-shot, yksi veto/case)\n");

for (const key of ORDER) {
  const cell = cells[key];
  if (!cell) { console.log(`${key}: EI DATAA`); continue; }
  const { lang, taskType, preds, officials } = cell;
  const gate = PASS[taskType];

  const rawM = maeMetrics(preds, officials);
  const rho = round(spearman(preds, officials));
  const fit = fitAffine(preds, officials);

  // In-sample corrected (full-fit applied to own data) — optimistic floor.
  const insample = preds.map((p) => applyAffine(p, fit.a, fit.b, gate.max));
  const insM = maeMetrics(insample, officials);

  // LOOCV corrected — honest held-out-equivalent.
  const loo = loocv(preds, officials, gate.max);
  const looM = maeMetrics(loo, officials);

  // Projection: does LOOCV-corrected pass the locked cell thresholds?
  // ρ is rank-invariant under the affine map → use raw ρ as the ρ gate.
  const maePass = looM.mae <= gate.mae;
  const rhoPass = rho >= gate.spearman;
  const maxPass = taskType === "short" ? looM.maxMiss <= gate.maxMiss : true;
  const cellPass = maePass && rhoPass && maxPass;

  results[key] = { lang, taskType, n: preds.length, rawM, rho, fit, insM, looM, maePass, rhoPass, maxPass, cellPass, loo };

  console.log(`── ${key.toUpperCase()} (n=${preds.length}, max=${gate.max}) ──`);
  console.log(`  raaka:       MAE ${rawM.mae}  bias ${rawM.bias}  max ${rawM.maxMiss}  ρ ${rho}`);
  console.log(`  affiini fit: corrected = ${fit.a}·pred ${fit.b >= 0 ? "+ " + fit.b : "− " + Math.abs(fit.b)}  (R² ${fit.r2})`);
  console.log(`  in-sample:   MAE ${insM.mae}  max ${insM.maxMiss}  (optimistinen alaraja)`);
  console.log(`  LOOCV:       MAE ${looM.mae}  bias ${looM.bias}  max ${looM.maxMiss}  ±2p ${looM.within2}%`);
  const gateStr = taskType === "short"
    ? `MAE≤3 ${maePass ? "✅" : "❌"}(${looM.mae}) · ρ≥0.8 ${rhoPass ? "✅" : "❌"}(${rho}) · max≤6 ${maxPass ? "✅" : "❌"}(${looM.maxMiss})`
    : `MAE≤6 ${maePass ? "✅" : "❌"}(${looM.mae}) · ρ≥0.8 ${rhoPass ? "✅" : "❌"}(${rho})`;
  console.log(`  PROJEKTIO:   ${cellPass ? "PASS ✅" : "FAIL ❌"}  [${gateStr}]\n`);
}

// ── GATE ──────────────────────────────────────────────────────────────────────
const allCells = ORDER.filter((k) => results[k]);
const passing = allCells.filter((k) => results[k].cellPass);
const failing = allCells.filter((k) => !results[k].cellPass);
const gatePass = failing.length === 0;

console.log("=== GATE ===");
console.log(`Soluja: ${allCells.length}  ·  PASS ${passing.length}  ·  FAIL ${failing.length}`);
if (gatePass) {
  console.log("GATE: PASS ✅ — projektio läpäisee kaikki solut. VAIHE 1 (maksullinen ensemble-ajo) perusteltu.");
} else {
  console.log("GATE: FAIL ❌ — ÄLÄ aja maksullista testiä. Kaatuvat solut:");
  for (const k of failing) {
    const r = results[k];
    const reasons = [];
    if (!r.maePass) reasons.push(`MAE ${r.looM.mae}>${PASS[r.taskType].mae}`);
    if (!r.rhoPass) reasons.push(`ρ ${r.rho}<0.8 (RANKING — affiini ei korjaa)`);
    if (!r.maxPass) reasons.push(`max ${r.looM.maxMiss}>6`);
    console.log(`  - ${k}: ${reasons.join(", ")}`);
  }
}

// ── Sensitivity: is each failing cell 1-outlier-driven (ensemble-rescuable) or
//    broad scatter / thin data (ensemble won't help)? Drop the single worst LOOCV
//    residual and recompute. Still 0 API. ───────────────────────────────────────
console.log("\n=== HERKKYYS — pudota yksittäinen pahin LOOCV-jäännös ===");
console.log("(testaa onko kaatuminen yhden outlierin varassa → ensemble-mediaani voisi auttaa,");
console.log(" vai laaja hajonta / liian ohut data → ensemble ei pelasta)\n");
for (const k of failing) {
  const r = results[k];
  const { preds, officials } = cells[k];
  const absResid = r.loo.map((p, i) => Math.abs(p - officials[i]));
  const worst = absResid.indexOf(Math.max(...absResid));
  const subP = preds.filter((_, i) => i !== worst);
  const subO = officials.filter((_, i) => i !== worst);
  const subLoo = loocv(subP, subO, PASS[r.taskType].max);
  const subM = maeMetrics(subLoo, subO);
  const subRho = round(spearman(subP, subO));
  console.log(`  ${k}: pudotettu ${cells[k].ids[worst]} (jäännös ${round(absResid[worst])})`);
  console.log(`     n-1=${subP.length}: LOOCV MAE ${subM.mae}  max ${subM.maxMiss}  ρ ${subRho}`);
}

// JSON dump for the audit doc.
const dump = { generatedFor: "L-V353-phase0", source: "V351 saved preds", gatePass, passing, failing, cells: {} };
for (const k of allCells) {
  const r = results[k];
  dump.cells[k] = {
    lang: r.lang, taskType: r.taskType, n: r.n,
    raw: r.rawM, rho: r.rho, affine: { a: r.fit.a, b: r.fit.b, r2: r.fit.r2 },
    inSampleMAE: r.insM.mae, loocv: r.looM,
    projection: { maePass: r.maePass, rhoPass: r.rhoPass, maxPass: r.maxPass, cellPass: r.cellPass },
  };
}
const OUT_JSON = join(ROOT, "docs", "audits", "2026-06-02-L-V353-per-kieli-kalibrointi.json");
writeFileSync(OUT_JSON, JSON.stringify(dump, null, 2), "utf8");
console.log(`\nKirjoitettu: ${OUT_JSON}`);
