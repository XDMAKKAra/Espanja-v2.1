// L-V411 Vaihe B — runtime feedback lookup (replaces per-completion callOpenAI).
//
// Pure, deterministic. Loads data/feedback/<lang>.json (built by
// scripts/build-feedback.mjs) once and resolves a tutor message +
// metacognitive prompt from tone-bucket × band (× optional concept). Zero AI.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEEDBACK_DIR = path.resolve(__dirname, "..", "data", "feedback");

const _cache = new Map();
function loadFeedback(lang) {
  const key = ["es", "de", "fr"].includes(lang) ? lang : "es";
  if (_cache.has(key)) return _cache.get(key);
  let data = null;
  try {
    data = JSON.parse(fs.readFileSync(path.join(FEEDBACK_DIR, `${key}.json`), "utf8"));
  } catch (err) {
    console.warn(`[feedbackTemplates] load ${key} failed:`, err.message);
    data = null;
  }
  _cache.set(key, data);
  return data;
}

const TONE_BUCKETS = { I: "I_A", A: "I_A", B: "B_C", C: "B_C", M: "M_E_L", E: "M_E_L", L: "M_E_L" };
const BANDS = ["mastered", "almost", "struggling"];

/** YTL grade (I/A/B/C/M/E/L) -> tone bucket key. Defaults to B_C. */
export function toneBucketFor(grade) {
  return TONE_BUCKETS[String(grade || "").toUpperCase()] || "B_C";
}

/**
 * Score band relative to the target pass threshold.
 * mastered = at/above threshold; almost = within 0.15 below; else struggling.
 */
export function bandFor(passPct, threshold) {
  const p = Number(passPct) || 0;
  const t = Number(threshold) || 0.8;
  if (p >= t) return "mastered";
  if (p >= t - 0.15) return "almost";
  return "struggling";
}

function interpolate(str, vars) {
  return String(str || "").replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : ""
  ).replace(/\s{2,}/g, " ").trim();
}

/**
 * Resolve feedback for a completed lesson.
 *
 * @param {object} opts
 * @param {string} opts.lang        es|de|fr
 * @param {string} opts.toneBucket  I_A|B_C|M_E_L (from toneBucketFor)
 * @param {string} [opts.band]      mastered|almost|struggling (discrete lessons)
 * @param {string} [opts.concept]   taxonomy key of the concentration concept
 * @param {"pass"|"fail"} [opts.kertaustesti]  course-review result (overrides band)
 * @param {object} [opts.vars]      { aihe, kurssi, seuraava, seuraava_kurssi }
 * @returns {{tutorMessage:string, metacognitivePrompt:string}|null}
 */
export function pickFeedback({ lang, toneBucket, band, concept, kertaustesti, vars = {} }) {
  const data = loadFeedback(lang);
  if (!data) return null;

  const tone = data.bands?.[band]?.[toneBucket] ? toneBucket : "B_C";

  // Whole-course review: pass/fail templates, never concept-specific.
  if (kertaustesti === "pass" || kertaustesti === "fail") {
    const cell = data.kertaustesti?.[kertaustesti]?.[tone]
      || data.kertaustesti?.[kertaustesti]?.B_C;
    if (!cell) return null;
    return {
      tutorMessage: interpolate(cell.tm, vars),
      metacognitivePrompt: interpolate(cell.mp, vars),
    };
  }

  const safeBand = BANDS.includes(band) ? band : "struggling";
  const cell = data.bands?.[safeBand]?.[tone] || data.bands?.[safeBand]?.B_C;
  if (!cell) return null;

  // Concept-specific only when the concept has authored pedagogy (grammar).
  // Vocab / unmapped concepts fall back to the generic {aihe} template.
  const conceptEntry = concept ? data.concepts?.[concept] : null;
  // The hint is authored as a lowercase clause but always lands sentence-initial
  // (right after a period in the templates), so capitalise its first letter.
  const hint = conceptEntry?.hint
    ? conceptEntry.hint.charAt(0).toUpperCase() + conceptEntry.hint.slice(1)
    : "";
  const full = {
    ...vars,
    aihe: vars.aihe || "tämä aihe",
    aihe_low: (vars.aihe || "tämä aihe").charAt(0).toLowerCase() + (vars.aihe || "tämä aihe").slice(1),
    konsepti: conceptEntry?.label || "",
    hint,
  };

  const tm = conceptEntry ? cell.tm_concept : cell.tm;
  const mp = conceptEntry ? cell.mp_concept : cell.mp;
  return {
    tutorMessage: interpolate(tm, full),
    metacognitivePrompt: interpolate(mp, full),
  };
}

/**
 * Pick the concentration concept from the graded wrong answers: the topic_key
 * that appears most often (ties broken by first occurrence). Returns null when
 * there are no tagged wrongs.
 */
export function concentrationConcept(effectiveWrong) {
  if (!Array.isArray(effectiveWrong) || !effectiveWrong.length) return null;
  const counts = new Map();
  for (const w of effectiveWrong) {
    const k = w?.topic_key;
    if (!k) continue;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let best = null, bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) { best = k; bestN = n; }
  }
  return best;
}
