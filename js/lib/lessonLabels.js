/**
 * L-PLAN-7 frontend mirror — render review-source keys as Finnish labels.
 *
 * The backend (lib/lessonLabels.js) is the source of truth for the rich
 * label text and ships it on each exercise (`review_source_label`) and
 * each `reviewSummary` entry. This mirror exists so the badge / results
 * card can degrade gracefully when an exercise comes through without a
 * pre-computed label (e.g. cached client, partial response).
 *
 * Format: "Kurssi N · oppitunti M" or "Kurssi N · yleiskertaus".
 * The richer "…: focus" suffix only renders when the caller already has
 * the focus string (passed through `extra` arg).
 */

export function formatReviewLabel(sourceKey, extra = {}) {
  if (!sourceKey || typeof sourceKey !== "string") return "Kertaus";

  if (sourceKey.endsWith("_review")) {
    const m = /^kurssi_(\d+)_review$/.exec(sourceKey);
    return m ? `Kurssi ${m[1]} · yleiskertaus` : "Yleiskertaus";
  }

  const m = /^kurssi_(\d+)_lesson_(\d+)$/.exec(sourceKey);
  if (!m) return "Kertaus";
  const kurssi = `Kurssi ${m[1]}`;
  const lesson = `oppitunti ${m[2]}`;
  const focus = typeof extra.focus === "string" && extra.focus.trim()
    ? `: ${extra.focus.trim()}`
    : "";
  return `${kurssi} · ${lesson}${focus}`;
}
