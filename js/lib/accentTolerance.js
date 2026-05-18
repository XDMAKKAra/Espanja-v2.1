// Accent tolerance + per-language accent palettes for the in-app
// answer fields. YTL counts missing accents as style errors, not
// meaning errors, in most contexts (sí vs si is an exception — see
// the criticalDiacriticPairs list). We mirror that: an answer that
// only differs by missing diacritics is treated as correct + flagged
// with an "Aksentit puuttuu" hint, never auto-rejected.

const DIACRITIC_CRITICAL_PAIRS = {
  es: [["si", "sí"], ["el", "él"], ["tu", "tú"], ["mi", "mí"], ["te", "té"], ["se", "sé"], ["mas", "más"], ["solo", "sólo"], ["aun", "aún"]],
  fr: [["a", "à"], ["la", "là"], ["ou", "où"], ["sur", "sûr"], ["du", "dû"]],
  de: [], // umlauts rarely flip meaning, ß/ss is the main case
};

// Per-language character chips for the accent bar. Order is the
// Finnish-keyboard-missing set first, then symbols / punctuation.
export const ACCENT_PALETTES = {
  es: ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"],
  fr: ["à", "â", "ç", "é", "è", "ê", "ë", "î", "ï", "ô", "ù", "û", "ü", "œ", "æ", "ÿ"],
  de: ["ä", "ö", "ü", "ß"],
};

/** Strip diacritics for a tolerant string compare. */
function stripDiacritics(s) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** Normalize for comparison: trim, lowercase, collapse whitespace. */
function normalize(s) {
  return String(s || "")
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[¿¡.,;:?!"]/g, "");
}

/**
 * Compare a user answer against an expected answer with accent
 * tolerance. Returns:
 *   { match: "exact" }                          — strict equality
 *   { match: "missing-accents", hint }          — equal once diacritics
 *                                                 stripped on the user side
 *   { match: "none" }                           — neither matches
 *
 * `hint` is the expected answer in its full-diacritic form, ready to
 * surface as "Muista aksentit: <hint>" microcopy.
 */
export function compareAnswer(userAnswer, expected) {
  const u = normalize(userAnswer);
  const e = normalize(expected);
  if (!u || !e) return { match: "none" };
  if (u === e) return { match: "exact" };
  if (stripDiacritics(u) === stripDiacritics(e)) {
    return { match: "missing-accents", hint: expected };
  }
  return { match: "none" };
}

/**
 * Check a user answer against a list of accepted strings — used by
 * the hybrid translation grader in PR #2. Falls back to the AI grader
 * when nothing matches.
 */
export function matchesAnyAccepted(userAnswer, acceptedList = []) {
  for (const exp of acceptedList) {
    const r = compareAnswer(userAnswer, exp);
    if (r.match !== "none") return r;
  }
  return { match: "none" };
}

/**
 * Detect whether two strings only differ by a critical pair (sí/si,
 * él/el). When true, the missing accent IS a meaning error and we do
 * NOT treat it as a soft warning.
 */
export function isCriticalDiacriticMiss(userAnswer, expected, lang = "es") {
  const u = normalize(userAnswer);
  const e = normalize(expected);
  if (u === e) return false;
  const pairs = DIACRITIC_CRITICAL_PAIRS[lang] || [];
  for (const [unaccented, accented] of pairs) {
    if (u.includes(unaccented) && e.includes(accented.toLowerCase())) return true;
  }
  return false;
}

/** Convenience for callers that just want a boolean "treat as correct". */
export function isAcceptable(userAnswer, expected, lang = "es") {
  const r = compareAnswer(userAnswer, expected);
  if (r.match === "exact") return { ok: true, hint: null };
  if (r.match === "missing-accents" && !isCriticalDiacriticMiss(userAnswer, expected, lang)) {
    return { ok: true, hint: `Muista aksentit: ${r.hint}` };
  }
  return { ok: false, hint: null };
}
