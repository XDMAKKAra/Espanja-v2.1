// SM-2 Spaced Repetition (Supabase-backed for logged-in users, localStorage fallback)

import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";

// ─── localStorage fallback for guests ──────────────────────────────────────

const SR_KEY = "kielio_sr_queue";
const SR_MAX = 20;

function memLoad() {
  try { return JSON.parse(localStorage.getItem(SR_KEY)) || []; }
  catch { return []; }
}

function memSave(queue) {
  localStorage.setItem(SR_KEY, JSON.stringify(queue.slice(0, SR_MAX)));
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Record an SR review for a word/question.
 * @param {object} ex - The exercise object (needs .question)
 * @param {number} grade - SM-2 grade: 0=Again, 1=Hard, 3=Good, 4=Easy, 5=Perfect
 * @param {string} [language='spanish']
 */
export async function srReview(ex, grade, language = "spanish") {
  if (!isLoggedIn()) {
    // Guest fallback: simple FIFO
    if (grade < 3) {
      const queue = memLoad();
      if (!queue.some((q) => q.question === ex.question)) {
        queue.unshift({ ...ex, _sr: true });
        memSave(queue);
      }
    } else {
      const queue = memLoad().filter((q) => q.question !== ex.question);
      memSave(queue);
    }
    return;
  }

  // Logged in: call SM-2 API
  const word = ex.question || ex.sentence || ex.word || "";
  try {
    await apiFetch(`${API}/api/sr/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ word, question: ex.question, language, grade }),
    });
  } catch { /* silent */ }
}

/**
 * Get due SR cards for review.
 * @param {number} [limit=20]
 * @param {string} [language='spanish']
 * @returns {Promise<Array>} Array of due cards
 */
export async function srGetDue(limit = 20, language = "spanish") {
  if (!isLoggedIn()) {
    // Guest fallback
    return memLoad().slice(0, limit).map((ex) => ({ ...ex, _sr: true }));
  }

  try {
    const res = await apiFetch(`${API}/api/sr/due?language=${language}&limit=${limit}`, {
      headers: authHeader(),
    });
    const data = await res.json();
    return (data.cards || []).map((card) => ({
      question: card.question || card.word,
      word: card.word,
      _sr: true,
      _srCardId: card.id,
      ease_factor: card.ease_factor,
      interval_days: card.interval_days,
      repetitions: card.repetitions,
    }));
  } catch {
    return [];
  }
}

/**
 * Get count of due SR cards.
 * @param {string} [language='spanish']
 * @returns {Promise<number>}
 */
export async function srDueCount(language = "spanish") {
  if (!isLoggedIn()) {
    return memLoad().length;
  }

  try {
    const res = await apiFetch(`${API}/api/sr/count?language=${language}`, {
      headers: authHeader(),
    });
    const data = await res.json();
    return data.count || 0;
  } catch {
    return 0;
  }
}

// ─── Legacy compat (used by vocab.js) ──────────────────────────────────────

export function srAddWrong(ex) {
  srReview(ex, 0);
}

export function srMarkCorrect(ex) {
  srReview(ex, 4);
}

export function srPop(n = 2) {
  // Sync fallback for guests only (async version in srGetDue)
  if (!isLoggedIn()) {
    const queue = memLoad();
    const items = queue.splice(0, n);
    memSave(queue);
    return items;
  }
  return []; // Logged-in users use srGetDue async
}
