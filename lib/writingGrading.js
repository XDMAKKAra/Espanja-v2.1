// YTL writing grading utilities — pure functions
// 4-dimension rubric: viestinnallisyys, kielen_rakenteet, sanasto, kokonaisuus
// Each 0–5, total 0–20. Band thresholds are YTL lyhyt oppimäärä absolute values
// (80/65/50/35/20/10 on 100-scale) linearly mapped to 20 (divide by 5, floor).

import { LANG_LABEL } from "./openai.js";
import { pointsToYoGrade } from "./grading.js";

export const RUBRIC_MAX = 20;

// Both short and long tasks now use the 0–20 rubric scale.
// These exports keep routes/writing.js import-compatible.
export const SHORT_MAX = 20;
export const LONG_MAX  = 20;

// Under-length penalty: 1pt per 40 chars below minimum.
// Rescaled from the old 1pt/10chars on a 99-scale so the penalty keeps the
// same real weight on the new 20-scale.
export function calculatePenalty(charCount, charMin) {
  if (charCount >= charMin) return 0;
  const deficit = charMin - charCount;
  return Math.ceil(deficit / 40);
}

// Sum the four rubric dimension scores.
export function sumScores(dims) {
  return (dims.viestinnallisyys?.score || 0) +
         (dims.kielen_rakenteet?.score  || 0) +
         (dims.sanasto?.score           || 0) +
         (dims.kokonaisuus?.score       || 0);
}

export function applyPenalty(rawScore, penalty) {
  return Math.max(0, rawScore - penalty);
}

// YTL lyhyt oppimäärä bands on the 0–20 rubric scale. Delegates to the single
// source of truth in lib/grading.js (pointsToYoGrade) so the percent bands
// (80/65/50/35/20/10) live in one place. On a /20 scale this is exactly
// L≥16, E≥13, M≥10, C≥7, B≥4, A≥2, else I. M anchor: 10/20 = "3 on every dim".
export function pointsToGrade(total) {
  return pointsToYoGrade(total, RUBRIC_MAX);
}

// ── L-V352 — Affine post-calibration of the native-scale YTL prediction ─────
// V351 proved the ranking is solved (Spearman ρ 0.84–0.95) but the absolute
// score is systematically harsh, ~constant per task type (short ≈ −6 p,
// long ≈ −11 p). A positive affine map `corrected = a·pred + b` removes that
// systematic bias WITHOUT touching rank order (ρ is invariant under a positive
// affine transform), so it cannot hurt the ranking the model already got right.
//
// `(a,b)` are fitted by least squares (`official ≈ a·pred_native + b`) on the
// SPANISH non-anchor cases only (train), separately for short and long, by
// scripts/validate-grading.mjs. German + French are held-out.
//
// NOT WIRED INTO PRODUCTION — the 2026-06-02 fit FAILED held-out validation
// (see docs/audits/2026-06-02-L-V352-grading-affine-remap.md). The single-(a,b)-
// applied-to-all-languages approach is dead, for two reasons:
//   1. The bias is NOT a language-independent constant: ES short −4.7, DE short
//      −9.2, FR short +0.7 p. One ES-fit cannot fix three different offsets, so
//      DE/FR short fail after remap (ES's +4 shift even overcorrects FR).
//   2. The long fit was degenerate (R² 0.13, ρ 0.42): the model's long ranking
//      collapsed this run, so least-squares regressed to the mean — lower MAE on
//      ES but it destroys the score on held-out FR long (MAE 13).
// The fitted-but-rejected values were short {a 1.038, b 3.940}, long {a 0.346,
// b 37.96}. They are deliberately NOT baked; AFFINE_REMAP stays identity so
// remapPrediction() is a no-op until a future approach PASSes held-out.
//
// L-V353 (offline, 0 API; docs/audits/2026-06-02-L-V353-per-kieli-kalibrointi.md):
// the PER-LANGUAGE affine IS the right lever (vs V352's dead universal one).
// LOOCV on V351's saved preds passes 2/6 cells held-out (es-long, de-long) with
// bias→0 and MAE collapsing (es-long 11.9→3.4, de-long 11.2→4.6). GATE still
// FAILED: global PASS needs French, but FR n=6/cell is too thin (one mis-read
// swings MAE 4+, ρ 0.13) and de-short has broad residual scatter. No paid run was
// spent. AFFINE_REMAP stays identity; the per-language (a,b) candidates live in
// the audit doc, NOT baked — baking single-draw fits would repeat V352's mistake.
// Real blockers now: (1) collect more scored FR samples, (2) short-task variance
// (ensemble median-of-3) — both deferred until FR data is thicker.
export const AFFINE_REMAP = {
  short: { a: 1.0, b: 0, max: 33 }, // identity — no validated calibration yet
  long:  { a: 1.0, b: 0, max: 66 }, // identity — no validated calibration yet
  fittedOn: null,
};

// Pure affine remap + clamp + integer round. Shared by the validation harness
// (called with the live-fitted params) and production (called via
// remapPrediction with the baked AFFINE_REMAP), so the two code paths are
// identical by construction — same arithmetic, same numbers.
export function affineRemap(predNative, { a, b, max }) {
  return Math.max(0, Math.min(max, Math.round(a * predNative + b)));
}

// Production wrapper: remap a native-scale prediction with the baked constants.
export function remapPrediction(predNative, isShort) {
  const p = isShort ? AFFINE_REMAP.short : AFFINE_REMAP.long;
  return affineRemap(predNative, p);
}

// Native-scale band cutoffs = the 0–20 pointsToGrade thresholds scaled to the
// task's native max (×max/20). The band shown to the student follows the
// CORRECTED native score, not the raw 0–20 total.
const GRADE_CUTS_20 = [[16, "L"], [13, "E"], [10, "M"], [7, "C"], [4, "B"], [2, "A"]];
export function pointsToGradeNative(corrected, max) {
  for (const [t20, g] of GRADE_CUTS_20) {
    if (corrected >= t20 * (max / 20)) return g;
  }
  return "I";
}

// ── L-V354 — coverage-calibrated SCORE RANGES ───────────────────────────────
// The engine's ranking is solved (ρ 0.84–0.95) but the absolute YTL point is
// systematically harsh and not calibratable to a tight single number (V349–V353).
// So we stop showing one exact number and show a RANGE that absorbs the bias +
// noise. Built OFFLINE (0 API) by scripts/calibrate-ranges.mjs from V351's saved
// predictions — and V351 ran the SAME pipeline production runs after L-V354
// (gpt-5.4-mini + few-shot anchors + native-scale ytl_points), so these offsets
// describe the live model's error, not a different one (the V352 mistake).
//
// Per (lang × taskType): [lo, hi] is the tightest interval over the residuals
// (officialScore − predYtl) that covers ≥80 % of the validation cases. Production
// range = [pred + lo, pred + hi] clamped to [0, max]. `coverage` is the actual
// fraction landing inside on the n cases; `n` is the sample size.
//
// Source: docs/audits/2026-06-02-L-V354-pistehaarukka-kalibrointi.json (2026-06-02).
// CAVEAT: fr-short / fr-long rest on n=6 (V353: French data is structurally thin;
// one misread swings MAE 4+). They are shown as ranges but carry lower confidence
// than es/de. AFFINE_REMAP stays identity — the range, not a point fit, is the
// robustness mechanism here.
export const SCORE_RANGE_CAL = {
  "es-short": { lo: 3,  hi: 9,  mode: "range", max: 33, coverage: 0.87, n: 15 },
  "es-long":  { lo: 6,  hi: 19, mode: "range", max: 66, coverage: 0.81, n: 16 },
  "de-short": { lo: 2,  hi: 11, mode: "range", max: 33, coverage: 0.83, n: 12 },
  "de-long":  { lo: 6,  hi: 18, mode: "range", max: 66, coverage: 0.89, n: 9  },
  "fr-short": { lo: -6, hi: 2,  mode: "range", max: 33, coverage: 0.83, n: 6  },
  "fr-long":  { lo: 4,  hi: 14, mode: "range", max: 66, coverage: 0.83, n: 6  },
};

const RANGE_CAL_FALLBACK = { short: "es-short", long: "es-long" };

// A native-scale prediction below this is not a real kirjotelma attempt (it is
// the "too short to assess" edge or a micro/sentence-level input) → no range.
export const MICRO_CHAR_FLOOR = 80;

// Build the display range for a native-scale prediction.
// Returns { lo, hi, mid, band, mode, coverage, max }.
//   mode "range" → show "lo–hi / max"; mode "band" → show the band letter only
//   (reserved for cells whose 80 % width is too wide to be a useful number).
export function computeScoreRange(predNative, lang, isShort) {
  const taskType = isShort ? "short" : "long";
  const max = isShort ? 33 : 66;
  const key = `${lang}-${taskType}`;
  const cal = SCORE_RANGE_CAL[key] || SCORE_RANGE_CAL[RANGE_CAL_FALLBACK[taskType]];
  const clamp = (x) => Math.max(0, Math.min(max, Math.round(x)));
  const pred = Number.isFinite(predNative) ? predNative : 0;
  const lo = clamp(pred + cal.lo);
  const hi = Math.max(lo, clamp(pred + cal.hi));
  const mid = Math.round((lo + hi) / 2);
  return { lo, hi, mid, band: pointsToGradeNative(mid, max), mode: cal.mode, coverage: cal.coverage, max };
}

// Build the OpenAI grading prompt — YTL-aligned 4-dimension rubric (RUBRIC.md §4).
// lang: ISO-639-1 code ('es' | 'de' | 'fr'). Defaults to 'es' for back-compat.
export function buildGradingPrompt(task, studentText, isShort, lang = "es", studentName = "", opts = {}) {
  const charCount = studentText.replace(/\s/g, "").length;
  const label = LANG_LABEL[lang] || LANG_LABEL.es;
  const langEn = label.en; // e.g. "Spanish" | "German" | "French"
  // L-V346 — first name only, used to make overall_feedback_fi feel like a real
  // teacher addressing the student. Route already sanitises; clamp again here.
  const name = String(studentName || "").trim().split(/\s+/)[0].slice(0, 40);

  // L-V351 — opt-in calibration extras (validation harness only; production
  // callers omit opts so the output is byte-identical to before):
  //  - opts.fewShotBlock: a string of real YTL-scored reference answers injected
  //    as few-shot anchors so the model calibrates against concrete examples.
  //  - opts.nativeScale: ask for the final score directly on the native YTL
  //    scale (0–33 short / 0–66 long) instead of rescaling the 0–20 total.
  const pointsMax = isShort ? 33 : 66;
  const fewShot = opts.fewShotBlock ? `\n${opts.fewShotBlock}\n` : "";
  const nativeBlock = opts.nativeScale ? `
FINAL CALIBRATED SCORE — also score on the native YTL point scale, NOT only 0–20:
- After scoring the four dimensions (which justify the feedback), assign ONE final score \`ytl_points\` directly on this ${isShort ? "SHORT" : "LONG"} task's native scale of 0–${pointsMax}.
- Calibrate \`ytl_points\` against the reference examples above: place this answer on the same ladder. If it reads like the top reference, score it near ${pointsMax}; if like the lowest reference, score it down there.
- Use the full range. Do NOT mechanically multiply the 0–20 total by ${pointsMax}/20 — the native scale has more room at the top; a fully successful answer must reach the upper band.
` : "";
  const ytlPointsField = opts.nativeScale ? `
  "ytl_points": <integer 0–${pointsMax} — the final calibrated YTL score on the native scale; THIS is the authoritative score>,` : "";
  const ytlPointsCheck = opts.nativeScale ? `
- ytl_points MUST be on the 0–${pointsMax} scale, calibrated against the reference examples, NOT a mechanical ×${pointsMax}/20 of the total.` : "";

  return `You are a YTL (Finnish matriculation board) examiner grading a ${langEn} writing sample from a Finnish high school student taking the ${langEn} lyhyt oppimäärä (short syllabus) yo-koe. Target level is B1. Apply YTL lyhyt oppimäärä standards, NOT CEFR-generic or university standards.

STUDENT'S FIRST NAME: ${name || "(unknown)"}

TASK CONTEXT:
Situation: ${task.situation}
Instruction (in ${langEn}): ${task.prompt}
Requirements: ${(task.requirements || []).join(" | ")}
Task type: ${isShort ? "SHORT task (lyhyt kirjoitelma, 160–240 chars)" : "LONG task (pitkä kirjoitelma, 300–450 chars)"}
Min chars (no spaces): ${task.charMin}
Actual chars (no spaces): ${charCount}

STUDENT'S TEXT:
"""
${studentText}
"""
${fewShot}
GRADING PHILOSOPHY — READ CAREFULLY:
- This is lyhyt oppimäärä, not pitkä. A B1 student with noticeable errors that do NOT block meaning can legitimately score M (50 / 100 in YTL terms, 10–12 / 20 here).
- Do NOT grade against a native-speaker ceiling. Do NOT grade against a pitkä-oppimäärä ceiling.
- Score the text that was written, not the text you wish had been written. Absence of advanced structures is not a fault at this level.
- Errors are expected. Penalise errors only to the extent that they (a) block meaning, (b) cluster so densely that the reader loses the thread, or (c) are on structures a B1 short-syllabus student is clearly expected to control (present tense, basic agreement, everyday word choice).

SCORE EACH OF FOUR YTL DIMENSIONS ON A 0–5 INTEGER SCALE:

1) VIESTINNÄLLISYYS (communicative effectiveness): task completion, clarity, register (tú/usted, formality), text-type conventions.
   - 3 = M anchor: most requirements met, message clear with occasional ambiguity, register mostly right.
   - 4 = all requirements met, clear first-read, register consistent, format respected.
   - 5 = nuanced communication, text-type conventions fully observed, effortless to read.
   - 2 = partial completion, reader re-reads, register inconsistent.
   - 1 = one requirement partly met, register wrong, reader must guess.
   - 0 = task ignored or text unintelligible.

${lang === "es" ? `2) KIELEN RAKENTEET (grammatical structures): accuracy AND range of B1 structures — present, pretérito indefinido/perfecto, imperfecto, ser/estar, gustar-type, basic subjunctive in fixed expressions, agreement, pronouns.
   - 3 = M anchor: present + one past tense mostly correct, agreement errors present but not dominant, ser/estar right in common cases, some subordination.
   - 4 = multiple tenses mostly correct, subjunctive attempted in fixed expressions, varied structures.
   - 5 = range of B1 structures accurate, few errors, none block meaning.
   - 2 = present mostly OK, past tense errors frequent, agreement shaky, mostly SVO.
   - 1 = only present tense partially works, pervasive agreement errors, ser/estar random.
   - 0 = grammar so broken most sentences fail.` : `2) KIELEN RAKENTEET (grammatical structures): accuracy AND range of B1 structures appropriate for ${langEn} — present and past tenses, basic modal/conditional structures, agreement, pronoun use.
   - 3 = M anchor: present + one past tense mostly correct, agreement errors present but not dominant, some subordination.
   - 4 = multiple tenses mostly correct, varied structures.
   - 5 = range of B1 structures accurate, few errors, none block meaning.
   - 2 = present mostly OK, past tense errors frequent, agreement shaky, mostly SVO.
   - 1 = only present tense partially works, pervasive agreement errors.
   - 0 = grammar so broken most sentences fail.`}

${lang === "es" ? `3) SANASTO (vocabulary): range and precision of word choice appropriate to the topic and level.
   - 3 = M anchor: everyday vocabulary correct, 1–2 topic-specific words attempted, some wrong-word errors (saber/conocer, pedir/preguntar) but meaning recoverable.
   - 4 = topic-specific vocabulary mostly correct, some idiomatic collocations, little repetition.
   - 5 = precise word choice, idiomatic collocations used naturally, topic-specific vocabulary handled with confidence.
   - 2 = everyday vocabulary mostly correct, noticeable repetition, anglicisms/fennicisms when topic words are needed.
   - 1 = only basic words repeated, wrong-word errors cause meaning failure.
   - 0 = vocabulary absent or non-Spanish.` : `3) SANASTO (vocabulary): range and precision of word choice appropriate to the topic and level.
   - 3 = M anchor: everyday vocabulary correct, 1–2 topic-specific words attempted, some wrong-word errors but meaning recoverable.
   - 4 = topic-specific vocabulary mostly correct, some idiomatic collocations, little repetition.
   - 5 = precise word choice, idiomatic collocations used naturally, topic-specific vocabulary handled with confidence.
   - 2 = everyday vocabulary mostly correct, noticeable repetition, anglicisms/fennicisms when topic words are needed.
   - 1 = only basic words repeated, wrong-word errors cause meaning failure.
   - 0 = vocabulary absent or not in ${langEn}.`}

${lang === "es" ? `4) KOKONAISUUS (overall / cohesion): connectors, flow, text-type formatting (greeting+closing for email/letter, stance for forum post), paragraph structure for long tasks.
   - 3 = M anchor: 2–4 connectors used, opening + closing both present where required, text reads as a text with minor flow issues.
   - 4 = range of connectors (además, sin embargo, por eso, aunque), clear progression, format well observed.
   - 5 = varied connectors used correctly, reference chains, formatting fully conforms to text type.
   - 2 = some connectors (y, pero, porque), either greeting OR closing missing, flow interrupted.
   - 1 = disconnected sentences, no connectors, no greeting/closing where required.
   - 0 = not a connected text (fragments, bullet list, copied prompt).` : `4) KOKONAISUUS (overall / cohesion): connectors, flow, text-type formatting (greeting+closing for email/letter, stance for forum post), paragraph structure for long tasks.
   - 3 = M anchor: 2–4 connectors used, opening + closing both present where required, text reads as a text with minor flow issues.
   - 4 = range of connectors appropriate for ${langEn}, clear progression, format well observed.
   - 5 = varied connectors used correctly, reference chains, formatting fully conforms to text type.
   - 2 = some basic connectors, either greeting OR closing missing, flow interrupted.
   - 1 = disconnected sentences, no connectors, no greeting/closing where required.
   - 0 = not a connected text (fragments, bullet list, copied prompt).`}

SCORING CALIBRATION — READ BEFORE ASSIGNING SCORES (this corrects a tendency to cluster every text at M):
- A lyhyt oppimäärä performance that completes the task fully and has only minor errors that do NOT block meaning DESERVES E or L (total 16–20). Do NOT cap a clearly successful, fully-on-task text at M just because it is not native-level.
- Dimension scores of 4 and 5 are NORMAL for strong B1 writing. They do not require error-free or native-level prose. Reserve 0–2 for a dimension that genuinely breaks down, not for "not native".
- KIELEN RAKENTEET specifically: a 5 does NOT mean error-free. At B1 short-syllabus level a text that controls a range of structures with only occasional errors that don't block meaning still earns 5; 4 is right for solid control with a few clear errors. Do not default a competent text to 3.
${isShort ? "" : `- LONG-TASK DEPTH: reward breadth and depth. A long text that develops several angles, gives reasons, and sustains the text type must score higher on VIESTINNÄLLISYYS and KOKONAISUUS than one that competently repeats a single idea. The strongest long answers must separate clearly from competent-but-thin ones — do not give them the same score.
`}- This calibration does NOT cancel the earlier warning against grading toward a native/pitkä ceiling: a text with frequent meaning-blocking errors still scores low. Balance both — do not inflate broken texts, and do not suppress successful ones.

Total = V + R + S + K (0–20).
Band mapping (apply strictly): 16+ L, 13–15 E, 10–12 M, 7–9 C, 4–6 B, 2–3 A, 0–1 I.
${nativeBlock}
ALSO RETURN:
- \`corrected_text\`: the student's text with ONLY real errors fixed (grammar, agreement, conjugation, accents, wrong word). Preserve content, style, sentence count, AND the student's voice — do NOT rewrite "good enough" sentences into more advanced ones. If the original is already correct ${langEn}, return it unchanged. Max length: ${Math.floor(charCount * 1.5)} characters.
- \`errors\`: up to 10 most impactful errors. Each: {excerpt (the SHORTEST exact span from the student's text that contains the error — typically 1–6 words, never include words that are not part of the mistake), corrected, category (grammar|vocabulary|spelling|register), explanation_fi (Finnish — must explain WHY the original is wrong, not just what to change. Reference the rule.)}.
- \`annotations\`: 2–4 positive highlights. Each: {excerpt (exact from student), comment_fi (briefly say WHAT works — connector use, idiomatic phrasing, register match), type:"positive"}.
- \`next_action_fi\`: ONE concrete study tip (Finnish, ≤ 18 words). Anchor to the lowest-scoring dimension. Be specific, NOT generic like "Kirjoita lisää." Name the structure or word group to revise.

FEEDBACK VOICE — overall_feedback_fi must read like a real teacher talking to this student, not a robot listing faults:
- Write 3–4 Finnish sentences as a short paragraph.
- ${name ? `Open by addressing the student by their first name "${name}" (e.g. "${name}, ...").` : `Open warmly without a name (no name is known).`}
- First say something genuinely true and SPECIFIC that worked in THIS text (a phrase, a tense, the register, the structure). Point at what they actually did, not empty praise.
- Then name the 1–2 most useful things to work on next, in plain Finnish, without dumping every error.
- Keep an encouraging, calm teacher tone. Honest, not flattering.
- Hard bans (these read as machine-written): no em dash (use comma, colon or period), no "Hienoa että...", "Hienoa työtä", "Loistavaa", "Mahtavaa" type empty openers, no "Toivottavasti tämä auttaa" type closers, no rule-of-three lists, no exclamation spam. One natural paragraph.
- Do NOT repeat the score or band number in the paragraph.

EDGE CASES — handle these BEFORE scoring:
- If \`studentText\` is empty, < 30 characters, or only whitespace: return all dimension scores 0, total 0, band "I", overall_feedback_fi explaining "Vastaus oli liian lyhyt arvioitavaksi.", next_action_fi pointing at minimum length.
- If the text is clearly not ${langEn} (mostly English / Finnish / other language): return all dimension scores 0, total 0, band "I", overall_feedback_fi explaining "Vastaus ei ole ${label.fi}ksi — kirjoita ${label.fi}ksi.", errors=[], annotations=[], corrected_text=studentText.
- If the text is clearly off-topic (does not address ANY of the requirements at all — e.g. requirements ask about ympäristönsuojelu and the student writes about their dog): score viestinnallisyys=0, score the other dimensions normally for any ${langEn} that IS present, overall_feedback_fi explains the off-topic problem in Finnish.

OUTPUT: return ONLY this JSON, no markdown, no prose outside the JSON:

{
  "viestinnallisyys": { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "kielen_rakenteet": { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "sanasto":          { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "kokonaisuus":      { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "total": <0-20 integer>,${ytlPointsField}
  "band": "<one of: L, E, M, C, B, A, I>",
  "overall_feedback_fi": "<3–4 Finnish sentences in a teacher's voice: ${name ? `address ${name} by name, ` : ""}open with a specific genuine positive, then the 1–2 most useful things to work on. Warm, honest, no em dash, no empty praise.>",
  "corrected_text": "<student's text with only real errors fixed>",
  "errors": [
    { "excerpt": "<exact 3–8 words>", "corrected": "<fix>", "category": "grammar|vocabulary|spelling|register", "explanation_fi": "<brief Finnish>" }
  ],
  "annotations": [
    { "excerpt": "<exact from student>", "comment_fi": "<why this is good>", "type": "positive" }
  ],
  "next_action_fi": "<one concrete Finnish next step, ≤ 18 words, anchored to the weakest dimension>"
}

Self-check before emitting:
- total MUST equal the sum of the four dimension scores.
- band MUST follow the table above given total.
- Every \`excerpt\` MUST be a character-exact substring of the student's text.
- If the text is already correct ${langEn}, \`errors\` MUST be [] — do NOT invent errors.
- next_action_fi must address the dimension with the LOWEST score. Tie → kielen_rakenteet.${ytlPointsCheck}
- overall_feedback_fi MUST contain no em dash, no empty praise opener, and ${name ? `MUST start by addressing "${name}".` : `must open warmly.`} It must reference something specific from the student's own text.`;
}

export const MAX_ERRORS = 10;
export const CORRECTED_LENGTH_FACTOR = 1.5;

export function enforceGuardrails(aiResult, studentText) {
  const out = { ...aiResult };
  if (Array.isArray(out.errors) && out.errors.length > MAX_ERRORS) {
    out.errors = out.errors.slice(0, MAX_ERRORS);
    out._truncatedErrors = true;
  }
  if (typeof out.corrected_text === "string" && studentText) {
    const maxLen = Math.floor(studentText.length * CORRECTED_LENGTH_FACTOR);
    if (out.corrected_text.length > maxLen) {
      out.corrected_text = out.corrected_text.slice(0, maxLen);
      out._truncatedCorrectedText = true;
    }
  }
  return out;
}

// Process the AI response into the final grading result.
// total and band are recomputed server-side — the model's values are ignored.
export function processGradingResult(aiResult, charCount, charMin, _isShort, studentText) {
  const penalty   = calculatePenalty(charCount, charMin);
  const rawScore  = sumScores(aiResult);
  const finalScore = applyPenalty(rawScore, penalty);
  const ytlGrade  = pointsToGrade(finalScore);
  const guarded   = enforceGuardrails(aiResult, studentText || "");

  return {
    rawScore,
    penalty,
    finalScore,
    maxScore: RUBRIC_MAX,
    ytlGrade,
    viestinnallisyys:    guarded.viestinnallisyys    || { score: 0, feedback_fi: "" },
    kielen_rakenteet:    guarded.kielen_rakenteet     || { score: 0, feedback_fi: "" },
    sanasto:             guarded.sanasto              || { score: 0, feedback_fi: "" },
    kokonaisuus:         guarded.kokonaisuus          || { score: 0, feedback_fi: "" },
    corrected_text:      guarded.corrected_text       || studentText || "",
    errors:              guarded.errors               || [],
    annotations:         guarded.annotations          || [],
    overall_feedback_fi: guarded.overall_feedback_fi  || "",
    next_action_fi:      guarded.next_action_fi       || "",
    _meta: {
      truncatedErrors:        !!guarded._truncatedErrors,
      truncatedCorrectedText: !!guarded._truncatedCorrectedText,
    },
  };
}
