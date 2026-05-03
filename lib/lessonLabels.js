/**
 * L-PLAN-7 — map review-source keys to human-readable Finnish labels.
 *
 * Source keys are emitted by lib/lessonContext.js when a review item is
 * injected into a lesson:
 *   - `kurssi_X_lesson_Y`  — internal or SR-personal review of lesson Y in kurssi X
 *   - `kurssi_X_review`    — cross-kurssi general review of kurssi X
 *
 * Labels are surfaced (a) on the in-exercise "Kertaus: …" badge and
 * (b) in the post-results "Kertasit myös tätä" -osio. Mirrored verbatim
 * by js/lib/lessonLabels.js for the frontend so the two never drift.
 */

import { CURRICULUM_KURSSIT, lessonsForKurssi, findKurssi } from "./curriculumData.js";

function kurssiNumberFromKey(kurssiKey) {
  const m = /^kurssi_(\d+)$/.exec(String(kurssiKey || ""));
  return m ? Number(m[1]) : null;
}

export function getLessonLabel(sourceKey) {
  if (!sourceKey || typeof sourceKey !== "string") return "";

  if (sourceKey.endsWith("_review")) {
    const kurssiKey = sourceKey.replace(/_review$/, "");
    const kurssi = findKurssi(kurssiKey);
    if (!kurssi) return sourceKey;
    return `${kurssi.title} · yleiskertaus`;
  }

  const m = /^(kurssi_\d+)_lesson_(\d+)$/.exec(sourceKey);
  if (!m) return sourceKey;

  const kurssiKey = m[1];
  const lessonIdx = Number(m[2]);
  const kurssi = findKurssi(kurssiKey);
  if (!kurssi) return sourceKey;

  const lessons = lessonsForKurssi(kurssiKey);
  const lesson = lessons.find((l) => l.sort_order === lessonIdx);
  const kurssiNum = kurssiNumberFromKey(kurssiKey);
  const kurssiTag = kurssiNum != null ? `Kurssi ${kurssiNum}` : kurssi.title;
  if (!lesson) return `${kurssiTag} · oppitunti ${lessonIdx}`;
  return `${kurssiTag} · oppitunti ${lessonIdx}: ${lesson.focus}`;
}

export { CURRICULUM_KURSSIT };
