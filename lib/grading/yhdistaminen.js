/**
 * Server-side yhdistaminen (matching) grader — fully authoritative.
 *
 * The client submits the IDs of seed items it was shown, together with
 * the student's selected Finnish match for each Spanish item. Correct
 * answers are looked up from the seed bank server-side.
 *
 * Band logic (N pairs):
 *   täydellinen  — all pairs correct (100 %)
 *   ymmärrettävä — ≥ 75 % correct
 *   lähellä      — ≥ 50 % correct
 *   väärin       — < 50 % correct
 */

import { getSeedItemById } from '../seedBank.js';

/**
 * @param {object} payload
 * @param {Array<{id: string, studentFi: string}>} payload.pairs
 *   Each entry: the seed item ID and the Finnish text the student chose.
 * @returns {{ ok: boolean, correct: boolean, band: string, score: number,
 *             maxScore: number, correctCount: number, totalCount: number,
 *             results: Array<{id, correct, expected}> }
 *           | { ok: false, error: string }}
 */
export function gradeYhdistaminen(payload = {}) {
  const { pairs } = payload;

  if (!Array.isArray(pairs) || pairs.length === 0) {
    return { ok: false, error: 'pairs must be a non-empty array' };
  }

  let correctCount = 0;
  const results = [];

  for (const { id, studentFi } of pairs) {
    if (typeof id !== 'string' || !id) {
      return { ok: false, error: 'each pair must have a string id' };
    }
    const item = getSeedItemById(id, 'matching');
    if (!item) {
      return { ok: false, error: `unknown item id: ${id}` };
    }
    const isCorrect = typeof studentFi === 'string'
      && studentFi.trim() === item.fi.trim();
    results.push({ id, correct: isCorrect, expected: item.fi });
    if (isCorrect) correctCount++;
  }

  const total = pairs.length;
  const ratio = correctCount / total;

  let band, score;
  if (ratio === 1)      { band = 'taydellinen';  score = 3; }
  else if (ratio >= 0.75) { band = 'ymmarrettava'; score = 2; }
  else if (ratio >= 0.5)  { band = 'lahella';      score = 1; }
  else                    { band = 'vaarin';        score = 0; }

  return {
    ok: true,
    correct: ratio === 1,
    band,
    score,
    maxScore: 3,
    correctCount,
    totalCount: total,
    results,
  };
}
