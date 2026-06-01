// Landing live-demo grading — slimmed YTL writing grader for the anonymous
// "Kokeile itse" section on the landing page. NOT the full app grader:
// returns one communicative-effectiveness score (0–18) plus 1–3 concrete
// error observations. No rubric breakdown, no corrected text, no annotations.
// Deterministic (low temperature) so the same input feels stable.

import { LANG_LABEL } from "./openai.js";

export const DEMO_SCORE_MAX = 18;
export const DEMO_MIN_CHARS = 80;
export const DEMO_MAX_CHARS = 200;
export const DEMO_VALID_LANGS = new Set(["es", "fr", "de"]);

// Build the slim demo grading prompt. lang is an ISO code (es|fr|de).
export function buildDemoGradingPrompt(lang, text) {
  const label = LANG_LABEL[lang] || LANG_LABEL.es;
  const langEn = label.en; // "Spanish" | "French" | "German"

  return `You are a YTL (Finnish matriculation board) examiner giving a SHORT preview grade of a ${langEn} writing sample from a Finnish high-school student (lyhyt oppimäärä, target B1). This is a one-shot landing-page demo, so keep it tight.

The student was asked: "Kirjoita 1-3 lausetta ${langEn === "Spanish" ? "espanjaksi" : langEn === "French" ? "ranskaksi" : "saksaksi"}: kerro mitä teit viime kesälomalla." (Tell what you did last summer holiday.)

STUDENT'S TEXT:
"""
${text}
"""

GRADING:
- Judge VIESTINNÄLLISYYS (communicative effectiveness) on a 0–18 scale: does the message come across, is it on topic, is the register fine for an informal account.
- This is lyhyt oppimäärä. Errors are expected and normal. Do NOT grade against a native ceiling. A clear message with noticeable but non-blocking errors lands around 10–13.
- ALWAYS surface 1–3 concrete observations, even when the text is good. If the text is essentially correct, point at the single most refinable spot (a word choice, an accent, a tense) so the student always learns something.
- Each error excerpt MUST be a character-exact substring of the student's text.
- explanation_fi: Finnish, short, explains WHY it is wrong (reference the rule), not just the fix.

OUTPUT: return ONLY this JSON, no markdown:
{
  "score": <integer 0-18>,
  "errors": [
    { "excerpt": "<exact substring from the student's text>", "corrected": "<fix>", "explanation_fi": "<short Finnish explanation>" }
  ]
}

Rules:
- 1 to 3 items in "errors". Never zero, never more than 3.
- If the text is clearly not ${langEn} (mostly Finnish/English/other), set score 0 and put one error explaining in Finnish that the text must be written in ${label.fi}.`;
}

// Normalise the model output into the shape the landing expects:
// { score, scoreMax, errors: [{excerpt, corrected, explanation_fi}] }.
// Clamps score, trims to 3 errors, drops malformed entries.
export function shapeDemoResult(raw) {
  const score = Math.max(0, Math.min(DEMO_SCORE_MAX, Math.round(Number(raw?.score) || 0)));
  const errorsIn = Array.isArray(raw?.errors) ? raw.errors : [];
  const errors = errorsIn
    .filter((e) => e && typeof e.excerpt === "string" && e.excerpt.trim().length > 0)
    .slice(0, 3)
    .map((e) => ({
      excerpt: String(e.excerpt).slice(0, 120),
      corrected: typeof e.corrected === "string" ? e.corrected.slice(0, 120) : "",
      explanation_fi: typeof e.explanation_fi === "string" ? e.explanation_fi.slice(0, 280) : "",
    }));
  return { score, scoreMax: DEMO_SCORE_MAX, errors };
}
