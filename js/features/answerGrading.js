// Pure grading helpers extracted from js/screens/vocab.js (lines 358-365, 448, 545-546,
// 642-643) and routes/exam.js (lines 123-136). Kept behavior-identical so tests can pin
// current semantics before any refactor. vocab.js still uses its inline copies; Step 5
// will wire it through this module.

export function stripAccents(s) {
  return String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeAnswer(s) {
  return stripAccents(String(s ?? "").toLowerCase()).trim();
}

/**
 * Gap-fill grading — mirrors vocab.js:357-366.
 * Returns { isCorrect, isAccentError }.
 * - Exact match OR alternative match  → isCorrect = true
 * - Accent-only mismatch              → isCorrect = false, isAccentError = true
 * - Everything else                   → both false
 */
export function gradeGapFill(userInput, correctAnswer, alternativeAnswers = []) {
  const answer = String(userInput ?? "").trim();
  const correct = String(correctAnswer ?? "");
  if (!answer) return { isCorrect: false, isAccentError: false };

  const exactMatch = answer.toLowerCase() === correct.toLowerCase();
  const lenientMatch = normalizeAnswer(answer) === normalizeAnswer(correct);
  const altMatch = (alternativeAnswers || []).some(
    a => answer.toLowerCase() === String(a).toLowerCase() ||
         normalizeAnswer(answer) === normalizeAnswer(a),
  );

  const isCorrect = exactMatch || altMatch;
  const isAccentError = !exactMatch && !altMatch && lenientMatch;
  return { isCorrect, isAccentError };
}

/** Multiple-choice — mirrors vocab.js:659. Exact single-letter compare. */
export function gradeMultipleChoice(chosenLetter, correctLetter) {
  return String(chosenLetter ?? "").trim() === String(correctLetter ?? "").trim();
}

/** Matching — mirrors vocab.js:448. Case-insensitive pair check. */
export function gradeMatchingPair(userSpanish, userFinnish, correctSpanish, correctFinnish) {
  return String(userSpanish ?? "").toLowerCase() === String(correctSpanish ?? "").toLowerCase() &&
         String(userFinnish ?? "").toLowerCase() === String(correctFinnish ?? "").toLowerCase();
}

/**
 * Pure matching-game state helper (Commit 12).
 *
 * State shape: { pairs: [{spanish, finnish}], matched: Set<string>, selected: string|null }
 *
 * pairUp(srcSpanish, dstSpanish, state) attempts to pair two items:
 * - If the destination's `spanish` equals the selected source, returns a
 *   new state with `matched` including that spanish and `selected = null`
 *   and `outcome: "matched"`.
 * - If they don't match, returns a new state with `selected` unchanged
 *   and `outcome: "miss"`.
 * - If no selection is active, stores `selected = srcSpanish` and
 *   returns `outcome: "selected"`.
 *
 * The UI layer calls this on every click and renders the returned state.
 */
export function pairUp(srcSpanish, dstSpanish, state = {}) {
  const pairs = Array.isArray(state.pairs) ? state.pairs : [];
  const matched = new Set(state.matched || []);
  const selected = state.selected || null;

  // Second click: attempt pairing
  if (selected && dstSpanish) {
    if (matched.has(dstSpanish)) return { ...state, matched, selected, outcome: "ignored" };
    if (selected === dstSpanish) {
      matched.add(dstSpanish);
      const done = matched.size === pairs.length;
      return { ...state, matched, selected: null, outcome: "matched", done };
    }
    return { ...state, matched, selected, outcome: "miss" };
  }
  // First click: select source
  if (srcSpanish && !matched.has(srcSpanish)) {
    return { ...state, matched, selected: srcSpanish, outcome: "selected" };
  }
  return { ...state, matched, selected, outcome: "noop" };
}

/** Reorder — mirrors vocab.js:545-546. Case-insensitive word-by-word match. */
export function gradeReorder(userWords, correctWords) {
  const a = (userWords || []).map(w => String(w ?? "").toLowerCase());
  const b = (correctWords || []).map(w => String(w ?? "").toLowerCase());
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Translate-mini — mirrors server decision at vocab.js:608 (accepted if score >= 2). */
export function isTranslationAccepted(score) {
  return Number.isFinite(score) && score >= 2;
}

/**
 * Reading short-answer — mirrors routes/exam.js:131-136.
 * Accepted if userAnswer.includes(accepted) OR accepted.includes(userAnswer) for any accepted entry.
 * Case-insensitive, accent-preserving (matches current server behavior).
 */
export function gradeShortAnswer(userAnswer, acceptedAnswers = []) {
  const u = String(userAnswer ?? "").trim().toLowerCase();
  if (!u) return false;
  const list = (acceptedAnswers || []).map(a => String(a ?? "").trim().toLowerCase()).filter(Boolean);
  return list.some(a => u.includes(a) || a.includes(u));
}

/** YO-grade threshold mapping — mirrors routes/exam.js:94-109 (199-point exam). */
export const GRADE_THRESHOLDS_PCT = [
  { minPct: 80, grade: "L" },
  { minPct: 65, grade: "E" },
  { minPct: 50, grade: "M" },
  { minPct: 35, grade: "C" },
  { minPct: 20, grade: "B" },
  { minPct: 10, grade: "A" },
  { minPct: 0,  grade: "I" },
];

export function pointsToYoGrade(points, maxPoints) {
  if (!Number.isFinite(points) || !Number.isFinite(maxPoints) || maxPoints <= 0) return "I";
  const pct = (points / maxPoints) * 100;
  for (const t of GRADE_THRESHOLDS_PCT) if (pct >= t.minPct) return t.grade;
  return "I";
}
