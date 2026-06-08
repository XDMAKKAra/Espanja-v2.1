// L-V411 Vaihe C — pure construction of the synthetic review phase + graded
// payload mapping. Kept DOM-free (no apiFetch / no document) so it is
// unit-testable; lessonRunner + digikirja own the fetch + DOM injection around it.

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

/**
 * Map one graded item + its result into the capture payload shape that the
 * server's sanitiseGradedItems / captureAdaptiveSignals expect. Pure (no DOM):
 * `res` is the answer-state object ({correct, choiceIndex} for mc,
 * {correct, userAnswer} for typed/gap/translate).
 *
 * @param {object} item   lesson item
 * @param {object} res    grading result
 * @param {object} phase  the phase the item belongs to (phase_type/title)
 * @returns {object} graded item for /capture
 */
export function toGradedItem(item, res, phase = {}) {
  const choices = Array.isArray(item.choices) ? item.choices : [];
  const studentAnswer =
    item.item_type === "mc" ? (choices[res.choiceIndex] ?? "")
    : item.item_type === "gap_fill" ? (Array.isArray(res.userAnswer) ? res.userAnswer.join(", ") : "")
    : item.item_type === "match" ? ""
    : (res.userAnswer != null ? String(res.userAnswer) : "");
  const correctAnswer =
    item.item_type === "mc" ? (choices[item.correct_index] ?? "")
    : (item.item_type === "typed" || item.item_type === "translate")
      ? (Array.isArray(item.accept) ? item.accept[0] : "")
    : item.item_type === "gap_fill"
      ? (Array.isArray(item.answers) ? item.answers.map((a) => (Array.isArray(a) ? a[0] : a)).join(", ") : "")
    : "";
  const question = item.stem || item.prompt || item.source || item.sentence_template || phase.title || "";
  return {
    itemType: item.item_type || "unknown",
    correct: !!res.correct,
    question: String(question).slice(0, 300),
    studentAnswer: String(studentAnswer || "").slice(0, 200),
    correctAnswer: String(correctAnswer || "").slice(0, 200),
    explanation: String(item.explanation || "").slice(0, 300),
    phaseType: phase.phase_type || "",
    // review items carry _concept; authored items rely on server-side inference
    topics: Array.isArray(item.topics) && item.topics.length
      ? item.topics.slice(0, 3)
      : (item._concept ? [item._concept] : []),
  };
}
