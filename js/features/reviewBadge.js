/**
 * L-PLAN-7 — render the "Kertaus: …" pill on review exercises.
 *
 * Backend (lib/lessonContext.js + routes/exercises.js) tags review items
 * with `is_review: true` + `review_source` + `review_source_label`.
 * This module syncs a small badge into the host header element of the
 * active exercise screen. Idempotent — safe to call from every render.
 */
import { formatReviewLabel } from "../lib/lessonLabels.js";

const BADGE_CLASS = "ex-review-badge";

function ensureBadge(host) {
  if (!host) return null;
  let badge = host.querySelector(`.${BADGE_CLASS}`);
  if (!badge) {
    badge = document.createElement("div");
    badge.className = BADGE_CLASS;
    badge.setAttribute("role", "note");
    badge.innerHTML = `
      <span class="${BADGE_CLASS}__icon" aria-hidden="true">↻</span>
      <span class="${BADGE_CLASS}__text"></span>
    `;
    host.appendChild(badge);
  }
  return badge;
}

export function setReviewBadge(exercise, hostSelector) {
  const host = typeof hostSelector === "string"
    ? document.querySelector(hostSelector)
    : hostSelector;
  if (!host) return;
  const badge = ensureBadge(host);
  if (!badge) return;

  const isReview = !!(exercise && exercise.is_review);
  if (!isReview) {
    badge.classList.add("hidden");
    badge.querySelector(`.${BADGE_CLASS}__text`).textContent = "";
    return;
  }
  const label = String(exercise.review_source_label || "").trim()
    || formatReviewLabel(exercise.review_source, { focus: exercise.topic_key });
  badge.classList.remove("hidden");
  badge.querySelector(`.${BADGE_CLASS}__text`).textContent = `Kertaus: ${label}`;
}

export function clearReviewBadge(hostSelector) {
  const host = typeof hostSelector === "string"
    ? document.querySelector(hostSelector)
    : hostSelector;
  const badge = host?.querySelector?.(`.${BADGE_CLASS}`);
  if (!badge) return;
  badge.classList.add("hidden");
  const t = badge.querySelector(`.${BADGE_CLASS}__text`);
  if (t) t.textContent = "";
}
