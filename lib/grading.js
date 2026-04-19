/**
 * Single source of truth for YO-grade thresholds (server-side mirror of
 * js/features/answerGrading.js → pointsToYoGrade). Used by routes/exercises.js
 * /api/grade and routes/exam.js final-exam grading so a given (correct, total)
 * always maps to the same letter regardless of which mode produced it.
 *
 * Official YTL lyhyt oppimäärä bands (percent of max):
 *   L ≥ 80 %, E ≥ 65 %, M ≥ 50 %, C ≥ 35 %, B ≥ 20 %, A ≥ 10 %, else I.
 */
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
