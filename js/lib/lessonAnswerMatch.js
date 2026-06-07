// L-V399 C3 — typed/translate answer-matching core extracted from
// js/screens/lessonRunner.js to start shrinking that god-screen and to make
// the (previously uncovered) accent-tolerant grading logic unit-testable.
// Behavior-preserving: normalizeAnswer + answerMatches moved verbatim.
// js/features/answerGrading.js keeps its own mirror (different call site) and
// is intentionally untouched here.
import { isAcceptable } from "./accentTolerance.js";

// Normalise answers for typed/translate: lowercase, trim, strip diacritics.
export function normalizeAnswer(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}
/**
 * Matches a typed answer against a list of accepted strings using
 * accent-tolerant comparison. Returns:
 *   { ok: true,  hint: null }                    — strict match
 *   { ok: true,  hint: "Muista aksentit: …" }    — match once diacritics
 *                                                  stripped on user side
 *   { ok: false, hint: null }                    — neither matched
 *
 * `hint` is the upgrade-path microcopy the feedback band surfaces so
 * the user knows the missing accent without being rejected.
 */
export function answerMatches(input, accepts, lang = "es") {
  const list = accepts || [];
  // First pass: strict normalized equality.
  const norm = normalizeAnswer(input);
  if (norm && list.some((a) => normalizeAnswer(a) === norm)) {
    return { ok: true, hint: null };
  }
  // Second pass: accent-tolerant match (with critical-pair guard).
  for (const exp of list) {
    const r = isAcceptable(input, exp, lang);
    if (r.ok) return r;
  }
  return { ok: false, hint: null };
}
