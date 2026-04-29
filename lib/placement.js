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

/**
 * Decide whether the student's response timing suggests guessing.
 *
 * Per CURRICULUM_SPEC §6 / L-PLAN-1: if the median answer time across
 * the test is under 4 000 ms, treat the placement as low-confidence and
 * start the student one kurssi lower than scored.
 *
 * @param {Array<{time_ms?: number}>} answers
 * @returns {{ confidence: "high"|"low", medianMs: number|null }}
 */
export function placementConfidence(answers) {
  const times = (answers || [])
    .map((a) => Number(a?.time_ms))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((x, y) => x - y);
  if (times.length === 0) return { confidence: "high", medianMs: null };
  const mid = Math.floor(times.length / 2);
  const medianMs = times.length % 2
    ? times[mid]
    : Math.round((times[mid - 1] + times[mid]) / 2);
  return {
    confidence: medianMs < 4000 ? "low" : "high",
    medianMs,
  };
}

/**
 * Map a placement level + confidence to a starting kurssi key (1..8).
 * See CURRICULUM_SPEC §3 for the kurssi definitions.
 *
 * @param {string} placementLevel - One of A|B|C|M|E|L (or M_hard)
 * @param {"high"|"low"} confidence
 * @returns {string} kurssi_1 .. kurssi_8
 */
export function suggestStartingKurssi(placementLevel, confidence = "high") {
  const baseKurssi = {
    I: 1, A: 1,
    B: 3,
    C: 5,
    M: 7, E: 7, L: 7,
    M_hard: 7,
  }[placementLevel] ?? 1;
  const adjusted = confidence === "low" ? Math.max(1, baseKurssi - 1) : baseKurssi;
  return `kurssi_${adjusted}`;
}

export { LEVELS, LEVEL_ORDER };
