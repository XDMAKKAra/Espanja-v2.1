/**
 * Correction exercise grader.
 *
 * Student submits a corrected version of an erroneous Spanish sentence.
 * Matching tiers:
 *   taydellinen  — exact match (after trim)
 *   ymmarrettava — diacritic-folded match (missing/wrong accents only)
 *   lahella      — token-level Levenshtein ≤ 2 across error positions
 *   vaarin       — no match
 */

import { getSeedItemById } from '../seedBank.js';

function foldDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function tokenEditDistance(target, student, errors) {
  const targetTokens  = target.trim().split(/\s+/);
  const studentTokens = student.trim().split(/\s+/);

  if (targetTokens.length !== studentTokens.length) {
    // Length mismatch — fall back to full sentence Levenshtein
    return levenshtein(target.toLowerCase(), student.toLowerCase());
  }

  const errorIndices = new Set((errors || []).map(e => e.token_index));
  let totalDist = 0;

  for (let i = 0; i < targetTokens.length; i++) {
    const t = targetTokens[i].toLowerCase().replace(/[.,;!?¿¡]/g, '');
    const s = studentTokens[i].toLowerCase().replace(/[.,;!?¿¡]/g, '');
    if (t !== s) {
      // Only penalise differences at known error positions
      if (errorIndices.has(i)) {
        totalDist += levenshtein(t, s);
      } else {
        // Unexpected change — penalise heavily
        totalDist += 3;
      }
    }
  }
  return totalDist;
}

/**
 * @param {{ id: string, studentCorrection: string }} payload
 */
export function gradeCorrection({ id, studentCorrection }) {
  if (!id || typeof studentCorrection !== 'string') {
    return { ok: false, band: 'vaarin', score: 0, error: 'id ja studentCorrection vaaditaan' };
  }

  const item = getSeedItemById(id, 'correction');
  if (!item) {
    return { ok: false, band: 'vaarin', score: 0, error: `Tehtävää ei löydy: ${id}` };
  }

  const student = studentCorrection.trim();

  // No correction made — student submitted the erroneous sentence unchanged
  if (foldDiacritics(student) === foldDiacritics(item.erroneous_sentence?.trim() ?? '')) {
    return {
      ok: true, correct: false, band: 'vaarin', score: 0, maxScore: 3,
      correctSentence: item.correct_sentence,
      explanation_fi:  item.explanation_fi,
    };
  }

  const targets = [item.correct_sentence, ...(item.alt_corrections || [])].map(s => s.trim());

  // Tier 1 — exact match
  if (targets.some(t => t === student)) {
    return {
      ok: true, correct: true, band: 'taydellinen', score: 3, maxScore: 3,
      correctSentence: item.correct_sentence,
      explanation_fi:  item.explanation_fi,
    };
  }

  // Tier 2 — diacritic-folded match
  const studentFolded = foldDiacritics(student);
  if (targets.some(t => foldDiacritics(t) === studentFolded)) {
    return {
      ok: true, correct: true, band: 'ymmarrettava', score: 2, maxScore: 3,
      correctSentence: item.correct_sentence,
      explanation_fi:  'Tarkista aksenttimerkit.',
    };
  }

  // Tier 3 — token-level Levenshtein ≤ 2
  const minDist = Math.min(
    ...targets.map(t => tokenEditDistance(t, student, item.errors))
  );
  if (minDist <= 2) {
    return {
      ok: true, correct: false, band: 'lahella', score: 1, maxScore: 3,
      correctSentence: item.correct_sentence,
      explanation_fi:  item.explanation_fi,
    };
  }

  return {
    ok: true, correct: false, band: 'vaarin', score: 0, maxScore: 3,
    correctSentence: item.correct_sentence,
    explanation_fi:  item.explanation_fi,
  };
}
