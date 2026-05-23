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
 * Grade a user's answer against the expected answer for one question.
 * Returns { correct: boolean, normalizedAnswer }. Tolerant for fill-type:
 * lowercases, trims, strips trailing punctuation. Accent-tolerant against
 * `accepted_alternates`.
 *
 * @param {Object} question — question payload from the diagnostic JSON
 * @param {number|string} userInput — option index (mc) or string (fill)
 */
export function gradeQuestion(question, userInput) {
  if (!question) return { correct: false, normalizedAnswer: userInput };
  if (question.type === "mc") {
    const idx = Number(userInput);
    return { correct: Number.isInteger(idx) && idx === question.answer, normalizedAnswer: idx };
  }
  if (question.type === "fill") {
    const raw = String(userInput || "").trim().toLowerCase();
    const target = String(question.answer || "").trim().toLowerCase();
    if (raw === target) return { correct: true, normalizedAnswer: raw };
    const alts = Array.isArray(question.accepted_alternates) ? question.accepted_alternates : [];
    if (alts.map(a => String(a).trim().toLowerCase()).includes(raw)) {
      return { correct: true, normalizedAnswer: raw };
    }
    return { correct: false, normalizedAnswer: raw };
  }
  return { correct: false, normalizedAnswer: userInput };
}

/**
 * Render one diagnostic question into a target element. Returns the
 * elements needed by the caller (submit button, input/options) so the
 * caller can wire submit/advance logic.
 *
 * Style: sentence-case, no italic, no em-dash, no UPPERCASE chips.
 *
 * @param {HTMLElement} root — container; innerHTML is replaced
 * @param {Object} question — question payload
 * @param {Object} opts — { index, total }
 * @returns {{ submitBtn: HTMLButtonElement|null, getValue: () => any }}
 */
export function renderQuestion(root, question, { index = 0, total = 0 } = {}) {
  if (!root || !question) return { submitBtn: null, getValue: () => null };

  const counter = total > 0 ? `Kysymys ${index + 1} / ${total}` : `Kysymys ${index + 1}`;
  const prompt = escapeHtml(question.question || "");
  const sentence = buildSentenceHtml(question);
  const verbHint = question.type === "fill" && question.verb_infinitive
    ? `<p class="ob4-q__verb-hint">Verbi: <b>${escapeHtml(question.verb_infinitive)}</b></p>`
    : "";

  let inputBlockHtml = "";
  if (question.type === "mc" && Array.isArray(question.options)) {
    inputBlockHtml = `<div class="ob4-q__options" role="radiogroup" aria-label="Vaihtoehdot">${question.options
      .map((opt, i) =>
        `<button type="button" class="ob4-q__option" data-option-index="${i}">${escapeHtml(String(opt))}</button>`,
      ).join("")}</div>`;
  } else if (question.type === "fill") {
    inputBlockHtml = `
      <div class="ob4-q__fill">
        <label class="ob4-q__fill-label" for="ob-v4-q-input">Vastauksesi</label>
        <input type="text" class="ob4-q__input" id="ob-v4-q-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      </div>
    `;
  }

  root.innerHTML = `
    <div class="ob4-q">
      <p class="ob4-q__counter">${escapeHtml(counter)}</p>
      <p class="ob4-q__prompt">${prompt}</p>
      <p class="ob4-q__sentence">${sentence}</p>
      ${verbHint}
      ${inputBlockHtml}
      <div class="ob4-q__feedback" hidden></div>
      <div class="ob4-q__actions">
        <button type="button" class="ob4-btn ob4-btn--primary ob4-q__submit" disabled>Tarkista</button>
      </div>
    </div>
  `;

  const submitBtn = root.querySelector(".ob4-q__submit");
  const optionBtns = root.querySelectorAll(".ob4-q__option");
  const fillInput = root.querySelector(".ob4-q__input");

  let selectedIndex = null;

  if (question.type === "mc") {
    optionBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        optionBtns.forEach(b => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selectedIndex = Number(btn.dataset.optionIndex);
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  } else if (question.type === "fill") {
    fillInput?.addEventListener("input", () => {
      if (submitBtn) submitBtn.disabled = fillInput.value.trim().length === 0;
    });
  }

  const getValue = () => {
    if (question.type === "mc") return selectedIndex;
    if (question.type === "fill") return fillInput?.value || "";
    return null;
  };

  return { submitBtn, getValue };
}

/**
 * Render feedback after a user submits an answer. Mutates the rendered
 * question container to show correct/incorrect + explanation.
 */
export function renderFeedback(root, question, userAnswer, correct) {
  const fb = root?.querySelector(".ob4-q__feedback");
  if (!fb) return;
  const status = correct ? "Oikein" : "Ei vielä oikein";
  const correctText = question.type === "mc" && Array.isArray(question.options)
    ? escapeHtml(String(question.options[question.answer] ?? ""))
    : escapeHtml(String(question.answer ?? ""));
  const correctRow = correct ? "" : `<p class="ob4-q__fb-correct">Oikea vastaus: <b>${correctText}</b></p>`;
  const explanation = question.explanation
    ? `<p class="ob4-q__fb-explain">${escapeHtml(question.explanation)}</p>`
    : "";

  fb.hidden = false;
  fb.classList.toggle("is-correct", !!correct);
  fb.classList.toggle("is-incorrect", !correct);
  fb.innerHTML = `<p class="ob4-q__fb-status">${status}</p>${correctRow}${explanation}`;

  // Disable further input on the question
  root.querySelectorAll(".ob4-q__option").forEach(b => { b.disabled = true; });
  const input = root.querySelector(".ob4-q__input");
  if (input) input.disabled = true;
  const submit = root.querySelector(".ob4-q__submit");
  if (submit) submit.disabled = true;
}

function buildSentenceHtml(question) {
  const prefix = escapeHtml(question.sentence_prefix || "");
  const suffix = escapeHtml(question.sentence_suffix || "");
  const blank = `<span class="ob4-q__blank">${escapeHtml(question.sentence_blank || "____")}</span>`;
  // Join with a single space; trim leading/trailing whitespace artefacts.
  return [prefix, blank, suffix].filter(s => s.length > 0).join(" ");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
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
