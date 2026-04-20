/**
 * Server-side aukkotehtava (gap-fill) grader — fully authoritative.
 *
 * The client submits {id, studentAnswer}. The correct answer and
 * alt_answers are looked up from the seed bank server-side and never
 * sent to the client in the exercise response.
 *
 * Band logic (single-word answers):
 *   täydellinen  — exact match OR alt_answers match
 *   ymmärrettävä — diacritic-folded match (right word, wrong accent)
 *   lähellä      — Levenshtein distance ≤ 1 to correct or any alt (typo)
 *   väärin       — everything else
 */

import { getSeedItemById } from '../seedBank.js';

/** Iterative Levenshtein distance (O(m·n) time, O(n) space). */
function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
}

/** Strip all combining diacritical marks and lowercase. */
function foldDiacritics(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * @param {object} payload
 * @param {string} payload.id           — seed item ID
 * @param {string} payload.studentAnswer — student's typed answer
 * @returns {{ ok: boolean, correct: boolean, band: string, score: number,
 *             maxScore: number, correctAnswer: string, explanation_fi: string }
 *           | { ok: false, error: string }}
 */
export function gradeAukkotehtava(payload = {}) {
  const { id, studentAnswer } = payload;

  if (typeof id !== 'string' || !id) {
    return { ok: false, error: 'id is required' };
  }
  if (typeof studentAnswer !== 'string' || !studentAnswer.trim()) {
    return { ok: false, error: 'studentAnswer is required' };
  }

  const item = getSeedItemById(id, 'aukkotehtava');
  if (!item) {
    return { ok: false, error: `unknown exercise id: ${id}` };
  }

  const student  = studentAnswer.trim().toLowerCase();
  const correct  = item.answer.trim().toLowerCase();
  const alts     = (item.alt_answers ?? []).map(a => a.trim().toLowerCase());

  const reveal = {
    correctAnswer: item.answer,
    explanation_fi: item.explanation_fi ?? '',
  };

  // 1. Exact match
  if (student === correct || alts.includes(student)) {
    return { ok: true, correct: true,  band: 'taydellinen',  score: 3, maxScore: 3, ...reveal };
  }

  // 2. Diacritic-folded match (e.g. "esta" instead of "está")
  const sf = foldDiacritics(student);
  const cf = foldDiacritics(correct);
  if (sf === cf || alts.some(a => foldDiacritics(a) === sf)) {
    return { ok: true, correct: false, band: 'ymmarrettava', score: 2, maxScore: 3, ...reveal };
  }

  // 3. Single-character typo
  const dist    = levenshtein(student, correct);
  const altDist = alts.length ? Math.min(...alts.map(a => levenshtein(student, a))) : Infinity;
  if (dist <= 1 || altDist <= 1) {
    return { ok: true, correct: false, band: 'lahella',      score: 1, maxScore: 3, ...reveal };
  }

  return { ok: true, correct: false, band: 'vaarin',        score: 0, maxScore: 3, ...reveal };
}
