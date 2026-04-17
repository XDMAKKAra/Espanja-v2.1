/**
 * Placement test scoring — pure functions, no I/O.
 */

const LEVELS = ["A", "B", "C", "M"];
const LEVEL_ORDER = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };

/**
 * Score a completed diagnostic test.
 * @param {Array<{level: string, correct: boolean}>} answers - One entry per question
 * @returns {{
 *   placementLevel: string,
 *   scoreByLevel: Record<string, {correct: number, total: number, pct: number}>,
 *   totalCorrect: number,
 *   totalQuestions: number,
 *   alternativeLevel: string|null
 * }}
 */
export function scorePlacementTest(answers) {
  // Group by level
  const scoreByLevel = {};
  for (const level of LEVELS) {
    const qs = answers.filter(a => a.level === level);
    const correct = qs.filter(a => a.correct).length;
    const total = qs.length;
    scoreByLevel[level] = {
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }

  const totalCorrect = answers.filter(a => a.correct).length;
  const totalQuestions = answers.length;

  // Find placement level: highest level with >= 75% correct
  let placementLevel = "A"; // fallback
  for (const level of LEVELS) {
    if (scoreByLevel[level].total > 0 && scoreByLevel[level].pct >= 75) {
      placementLevel = level;
    }
  }

  // Alternative: one level below placement (for "start easier" option)
  const placementIdx = LEVELS.indexOf(placementLevel);
  const alternativeLevel = placementIdx > 0 ? LEVELS[placementIdx - 1] : null;

  return {
    placementLevel,
    scoreByLevel,
    totalCorrect,
    totalQuestions,
    alternativeLevel,
  };
}

/**
 * Map placement level to a suggested starting level per mode.
 * Vocab/grammar start at placement level.
 * Reading/writing start one level below (harder for productive skills).
 * @param {string} placementLevel
 * @returns {Record<string, string>}
 */
export function suggestModeLevels(placementLevel) {
  const idx = LEVELS.indexOf(placementLevel);
  const lowerIdx = Math.max(0, idx - 1);
  return {
    vocab: placementLevel,
    grammar: placementLevel,
    reading: LEVELS[lowerIdx],
    writing: LEVELS[lowerIdx],
  };
}

export { LEVELS, LEVEL_ORDER };
