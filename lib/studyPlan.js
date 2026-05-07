// L-ONBOARDING-REDESIGN-1 — study-plan computation shared between server
// (POST /api/onboarding/complete) and client reveal screen.
//
// Inputs: current_level + target_grade (I/A/B/C/M/E/L), exam_date (YYYY-MM-DD).
// Output: weeks until exam, courses needed, total lessons, lessons/week, min/week.

const GRADE_IDX = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };
const LESSONS_PER_COURSE = 12;
const MIN_PER_LESSON = 8;

export function computeStudyPlan({ current_level, target_grade, exam_date, today = new Date() }) {
  const examDate = exam_date ? new Date(exam_date) : null;
  const validExam = examDate && !Number.isNaN(examDate.getTime());

  const weeksUntilExam = validExam
    ? Math.max(4, Math.ceil((examDate - today) / (1000 * 60 * 60 * 24 * 7)))
    : 12;

  const cur = GRADE_IDX[current_level] ?? 1;
  const tgt = GRADE_IDX[target_grade] ?? 3;
  const coursesNeeded = Math.max(1, tgt - cur);
  const totalLessons = coursesNeeded * LESSONS_PER_COURSE;
  const lessonsPerWeek = Math.ceil(totalLessons / weeksUntilExam);
  const minutesPerWeek = lessonsPerWeek * MIN_PER_LESSON;

  return {
    weeksUntilExam,
    coursesNeeded,
    totalLessons,
    lessonsPerWeek,
    minutesPerWeek,
    examDate: validExam ? examDate.toISOString().slice(0, 10) : null,
  };
}
