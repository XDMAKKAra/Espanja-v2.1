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
      // L-PLAN-5 UPDATE 5 — drives single-batch sizing in vocab.
      lessonExerciseCount: Number.isInteger(obj.lessonExerciseCount) && obj.lessonExerciseCount > 0
        ? obj.lessonExerciseCount
        : null,
      // L-PLAN-6 — surfaced for the Syvennä callout decision + tone hint.
      targetGrade: typeof obj.targetGrade === "string" && obj.targetGrade ? obj.targetGrade : "B",
    };
  } catch {
    return null;
  }
}

export function clearLessonContext() {
  try {
    sessionStorage.removeItem(KEY);
    // L-PLAN-6 — clear the deepen flag along with the lesson so a stale
    // flag can't leak into the next free-practice or curriculum session.
    sessionStorage.removeItem("currentLessonDeepen");
  } catch { /* private mode — ignore */ }
}

// L-PLAN-6 — deepen run flag. When true, the next exercise generation
// for this lesson runs in `mode: "deepen"`: 4 harder items aimed at L
// students who already passed the lesson with ≥85%. The flag is set by
// lessonResults.js when the student clicks "Tee 4 lisätehtävää" and
// cleared once the deepen run finishes.
const DEEPEN_KEY = "currentLessonDeepen";

export function isDeepenRun() {
  try { return sessionStorage.getItem(DEEPEN_KEY) === "1"; }
  catch { return false; }
}

export function setDeepenRun(on) {
  try {
    if (on) sessionStorage.setItem(DEEPEN_KEY, "1");
    else sessionStorage.removeItem(DEEPEN_KEY);
  } catch { /* private mode — ignore */ }
}
