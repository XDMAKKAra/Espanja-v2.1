// L-V293-ONBOARDING-DIAGNOSTIC-1a — mini-YO test engine (infra-stub).
//
// Loads diagnostic content per (language, part), tracks per-question progress
// via /api/onboarding/diagnostic/state + /diagnostic/answer, and supports
// pause-resume (user closes tab, returns, test continues where they left off).
//
// In commit 1a the content JSON files are placeholders (status: "placeholder",
// questions: []). The engine detects this and renders a "sisältö tulossa, voit
// jatkaa" empty state with a skip button — same pause-resume infra, no broken
// path. Real content arrives in L-V293-1b/1c/1d (Part A per language) and
// L-V293-1e (Part B + C).

import { API, apiFetch } from "../api.js";

const SUPPORTED_LANGS = ["es", "de", "fr"];
const PART_FILE = {
  a_grammar: "part_a_grammar.json",
  b_reading: "part_b_reading.json",
  c_writing: "part_c_writing.json",
};

const partCache = new Map();

/**
 * Fetch a diagnostic part JSON from /data/diagnostic/{lang}/{part_file}.
 * Returns the parsed JSON; on network error returns a placeholder-shaped
 * object so the UI degrades gracefully without throwing.
 */
export async function loadPart(language, part) {
  if (!SUPPORTED_LANGS.includes(language)) return placeholderPart(language, part);
  if (!PART_FILE[part]) return placeholderPart(language, part);

  const key = `${language}:${part}`;
  if (partCache.has(key)) return partCache.get(key);

  try {
    const res = await fetch(`/data/diagnostic/${language}/${PART_FILE[part]}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    partCache.set(key, data);
    return data;
  } catch (err) {
    console.warn(`miniYO loadPart ${key} failed:`, err.message);
    return placeholderPart(language, part);
  }
}

function placeholderPart(language, part) {
  return {
    lang: language,
    part,
    version: 0,
    status: "placeholder",
    questions: [],
  };
}

/**
 * Question array helper. Returns the questions array regardless of part type.
 * Part A / B return `questions: []`; Part C has no questions (single prompt).
 */
export function questionsFor(partData) {
  if (!partData) return [];
  if (Array.isArray(partData.questions)) return partData.questions;
  return [];
}

/**
 * True if this part has no usable content yet (placeholder). The UI uses
 * this to switch to the empty-state CTA ("sisältö tulossa, jatka").
 */
export function isPlaceholder(partData) {
  if (!partData) return true;
  if (partData.status === "placeholder") return true;
  if (partData.version === 0) return true;
  if (partData.part === "c_writing") return !partData.prompt;
  if (partData.part === "b_reading") return !partData.passage || questionsFor(partData).length === 0;
  return questionsFor(partData).length === 0;
}

/**
 * Load saved per-question progress for resume. Returns { diagnostic, progress }.
 * `progress` is an array of { part, question_index, question_id, user_answer, is_correct }.
 */
export async function loadServerState(language) {
  try {
    const url = `${API}/api/onboarding/diagnostic/state?language=${encodeURIComponent(language)}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("miniYO loadServerState failed:", err.message);
    return { diagnostic: null, progress: [] };
  }
}

/**
 * UPSERT one answer to the backend. Latest answer per question wins. Awaited
 * to keep the UI in sync, but failures are non-fatal: a transient network
 * error shouldn't block the user from moving to the next question. The
 * answer stays in the client-side `answers` map and gets retried on
 * subsequent saves of the same question_index.
 */
export async function saveAnswer({ language, part, questionIndex, questionId, userAnswer, isCorrect }) {
  try {
    const res = await apiFetch(`${API}/api/onboarding/diagnostic/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        part,
        question_index: questionIndex,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: typeof isCorrect === "boolean" ? isCorrect : null,
      }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return true;
  } catch (err) {
    console.warn("miniYO saveAnswer failed (non-fatal):", err.message);
    return false;
  }
}

/**
 * Mark the mini-YO as completed/partial/skipped. Optionally include
 * textbook_key (only set if step 4 disambiguator was shown).
 */
export async function completeDiagnostic({ language, status, textbookKey }) {
  try {
    const body = { language, mini_yo_status: status };
    if (textbookKey) body.textbook_key = textbookKey;
    const res = await apiFetch(`${API}/api/onboarding/diagnostic/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (err) {
    console.warn("miniYO completeDiagnostic failed:", err.message);
    return false;
  }
}

/**
 * Compute completion stats from server progress for a given part:
 * `{ answered: N, total: M }`. M comes from the content JSON; N is the
 * number of distinct question_index values the server has stored.
 */
export function partProgress(progressArray, part, totalQuestions) {
  if (!Array.isArray(progressArray)) return { answered: 0, total: totalQuestions };
  const indices = new Set(
    progressArray.filter(p => p.part === part).map(p => p.question_index),
  );
  return { answered: indices.size, total: totalQuestions };
}

/**
 * For Part A multi-choice scoring: count correct answers per topic to feed
 * the L-V294 reasoner. Called by /diagnostic/complete client-side then
 * sent as `mini_yo_part_a_scores` jsonb. Returns `{ topic: { correct, total } }`.
 *
 * Implementation note: only used once real content lands. In commit 1a this
 * function is exported but unreachable (no real questions in placeholders).
 */
export function topicScores(progressArray, partData) {
  const out = {};
  if (!Array.isArray(progressArray) || !partData) return out;
  const byIndex = new Map();
  for (const q of questionsFor(partData)) byIndex.set(q.id, q);

  for (const p of progressArray) {
    if (p.part !== "a_grammar") continue;
    const q = byIndex.get(p.question_id);
    if (!q || !q.topic) continue;
    const slot = out[q.topic] || { correct: 0, total: 0 };
    slot.total += 1;
    if (p.is_correct === true) slot.correct += 1;
    out[q.topic] = slot;
  }
  return out;
}
