/**
 * L-COURSE-1 UPDATE 3 — normalise lesson payloads from /api/curriculum/:k/lesson/:i.
 *
 * Two response shapes:
 *  - Pre-generated: `{ pregenerated: <full schemas/lesson.json object> }`
 *  - Legacy runtime: `{ lesson, lessonContext, teachingPage }`
 *
 * `normalizeLesson(payload)` returns:
 *   {
 *     mode: "pregenerated" | "legacy",
 *     pregenerated: <object or null>,
 *     legacy: <object or null>,
 *   }
 */
export function normalizeLesson(payload) {
  if (payload && payload.pregenerated && Array.isArray(payload.pregenerated.phases)) {
    return { mode: "pregenerated", pregenerated: payload.pregenerated, legacy: null };
  }
  return { mode: "legacy", pregenerated: null, legacy: payload };
}

/**
 * Resolve mastery threshold for a phase + target_grade. Falls back to 0.7.
 */
export function masteryThresholdFor(phase, targetGrade) {
  const t = phase?.mastery_threshold;
  if (!t) return 0.7;
  if (typeof t[targetGrade] === "number") return t[targetGrade];
  return t.B ?? 0.7;
}

/**
 * Should this phase be skipped for the given target_grade?
 */
export function isPhaseSkipped(phase, targetGrade) {
  const arr = phase?.skip_for_targets;
  return Array.isArray(arr) && arr.includes(targetGrade);
}
