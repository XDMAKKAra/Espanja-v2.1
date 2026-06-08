// L-V411 Vaihe C — pure construction of the synthetic review phase.
// Kept DOM-free (no apiFetch / no document) so it is unit-testable; the
// lessonRunner owns the fetch + DOM injection around it.

export const REVIEW_PHASE_ID = "lr-review-v411";

/**
 * Build a synthetic "Kertaus" phase from a review-queue payload. Rendered by the
 * existing phase machinery (no new item type). Each item is tagged with `topics`
 * (from its _concept) so the server-side SR capture routes the calibration to
 * the right concept: a correct review answer pushes next_review out, a wrong one
 * brings it back.
 *
 * @param {{items: Array}} queue
 * @returns {object} lesson-phase-shaped object with _isReview:true
 */
export function buildReviewPhase(queue) {
  const items = (queue.items || []).map((it) => ({
    ...it,
    topics: Array.isArray(it.topics) && it.topics.length
      ? it.topics
      : (it._concept ? [it._concept] : []),
  }));
  return {
    phase_id: REVIEW_PHASE_ID,
    phase_type: "review_mixed",
    title: "Kertaus",
    instruction: "Aloitetaan kertaamalla pari kohtaa jotka kaipasivat vielä toistoa.",
    mastery_threshold: { I: 0.5, A: 0.5, B: 0.5, C: 0.5, M: 0.5, E: 0.5, L: 0.5 },
    skip_for_targets: [],
    items,
    _isReview: true,
  };
}
