// lib/constants.js
// Single source of truth for cross-module constants.
//
// Zero dependencies on purpose: any server module can import these without
// pulling in the OpenAI or Supabase client. This matters for dependency-free
// units like lib/gradeThreshold.js, which previously inlined these values
// specifically to avoid importing lib/openai.js (and through it, supabase).
//
// The client bundle (js/) cannot import server modules, so it keeps its own
// mirrors in js/state.js. Those are documented as controlled copies.

// The three shipped product languages. A Set for O(1) membership checks.
// Treat as immutable — never mutated, shared by reference across modules.
export const PRODUCT_LANGS = new Set(["es", "de", "fr"]);

// YTL matriculation grades, weakest → strongest (lyhyt oppimäärä ladder).
export const GRADES = ["I", "A", "B", "C", "M", "E", "L"];
export const GRADE_ORDER = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };

// Time constants (milliseconds).
export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;
