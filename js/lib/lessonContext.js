/**
 * L-PLAN-3 frontend — read/write the curriculum lesson context that ties the
 * exercise screens (vocab/grammar/reading) back to a curriculum lesson.
 *
 * The lesson is set in sessionStorage by js/screens/curriculum.js openLesson()
 * when the student taps "Aloita harjoittelu →". The exercise screens read it
 * to (a) inject `lesson` into their generate-API request body, and (b) hand
 * results off to the post-session lessonResults card.
 */

const KEY = "currentLesson";

export function getLessonContext() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    const kurssiKey = String(obj.kurssiKey || "").trim();
    const lessonIndex = Number(obj.lessonIndex);
    if (!kurssiKey || !Number.isInteger(lessonIndex) || lessonIndex < 1) return null;
    return {
      kurssiKey,
      lessonIndex,
      lessonFocus: typeof obj.lessonFocus === "string" ? obj.lessonFocus : "",
      lessonType:  typeof obj.lessonType  === "string" ? obj.lessonType  : "",
    };
  } catch {
    return null;
  }
}

export function clearLessonContext() {
  try { sessionStorage.removeItem(KEY); } catch { /* private mode — ignore */ }
}
