// Pass 6 C18 — server-side feature flag reads.
//
// Exam-week mode is the kill switch for AI-dependent paths during the
// 2026-09-28 YO-koe and the week around it. When EXAM_WEEK=true in env:
//   - callOpenAI throws ExamWeekBlockedError (callers must fall back to
//     seedBank or simplified templates).
//   - New-feature code paths guarded by isFeatureDisabled() are skipped.
//   - The /api/status response surfaces examWeek: true.
//
// Also gates OPENAI_DISABLED — a manual override independent of exam week
// (e.g. dev hitting quota, or an ops kill-switch during an OpenAI outage).

export function isExamWeek() {
  return process.env.EXAM_WEEK === "true";
}

export function isOpenAIDisabled() {
  return isExamWeek() || process.env.OPENAI_DISABLED === "true";
}

export class ExamWeekBlockedError extends Error {
  constructor(message = "Koeviikkotila: sisältö palvellaan pankkista.") {
    super(message);
    this.name = "ExamWeekBlockedError";
    this.code = "EXAM_WEEK_BLOCKED";
  }
}

// Features that should be disabled during exam week to reduce risk.
// Additions must be conservative — anything that touches grading, SR, or
// placement should keep working. This list is for *new* code paths only.
const DISABLED_DURING_EXAM_WEEK = new Set([
  "experimental_grammar_drill_v2",
  "new_reading_genre",
  "personalised_drip_v2",
]);

export function isFeatureDisabled(featureName) {
  if (!isExamWeek()) return false;
  return DISABLED_DURING_EXAM_WEEK.has(featureName);
}
