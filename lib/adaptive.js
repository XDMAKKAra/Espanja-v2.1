// ═══════════════════════════════════════════════════════════════════════════════
// Adaptive level system — pure functions, no I/O
// LEGACY — canonical engine is lib/levelEngine.js (see plans/08-adaptive-engine-unification.md)
// New Pass 2.5+ code must not import from this file.
// ═══════════════════════════════════════════════════════════════════════════════

export const LEVEL_ORDER = ["I", "A", "B", "C", "M", "E", "L"];

export const PROMOTION_THRESHOLDS = {
  "I→A": { minAvgPct: 70, minSessionPct: 60, minQuestions: 30, minSessions: 3, minDays: 3, maxStdDev: 15 },
  "A→B": { minAvgPct: 75, minSessionPct: 65, minQuestions: 40, minSessions: 4, minDays: 5, maxStdDev: 15 },
  "B→C": { minAvgPct: 78, minSessionPct: 70, minQuestions: 50, minSessions: 5, minDays: 7, maxStdDev: 15 },
  "C→M": { minAvgPct: 82, minSessionPct: 72, minQuestions: 70, minSessions: 7, minDays: 10, maxStdDev: 15 },
  "M→E": { minAvgPct: 85, minSessionPct: 75, minQuestions: 100, minSessions: 10, minDays: 14, maxStdDev: 15 },
  "E→L": { minAvgPct: 88, minSessionPct: 78, minQuestions: 150, minSessions: 12, minDays: 21, maxStdDev: 15 },
};

const DEMOTION_MIN_DAYS = 14;
const DEMOTION_AVG_THRESHOLD = 45;
const DEMOTION_SESSION_THRESHOLD = 55;
const DEMOTION_MIN_BAD_SESSIONS = 6;
const DEMOTION_WINDOW = 8;
const MASTERY_COOLDOWN_DAYS = 3;
const DISMISS_COOLDOWN_DAYS = 7;

export function calculateAvg(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateStdDev(values) {
  if (values.length < 2) return 0;
  const avg = calculateAvg(values);
  const sqDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function daysBetween(dateA, dateB) {
  return Math.floor(Math.abs(dateA - dateB) / (24 * 60 * 60 * 1000));
}

/**
 * Check if promotion criteria are met.
 * @param {number[]} sessionPcts - Array of session percentages (most recent first)
 * @param {object} thresholds - From PROMOTION_THRESHOLDS
 * @param {number} questionsAtLevel - Total questions answered at this level
 * @param {number} daysAtLevel - Days spent at this level
 * @returns {{ ready: boolean, progress: object }}
 */
export function isPromotionReady(sessionPcts, thresholds, questionsAtLevel, daysAtLevel) {
  const { minAvgPct, minSessionPct, minQuestions, minSessions, minDays, maxStdDev } = thresholds;

  const recentSessions = sessionPcts.slice(0, minSessions);
  const avgPct = recentSessions.length >= minSessions ? Math.round(calculateAvg(recentSessions)) : 0;
  const stdDev = recentSessions.length >= 2 ? Math.round(calculateStdDev(recentSessions) * 10) / 10 : 0;
  const allAboveMin = recentSessions.length >= minSessions && recentSessions.every((p) => p >= minSessionPct);
  const consistencyOk = stdDev <= maxStdDev;

  const progress = {
    questionsDone: questionsAtLevel,
    questionsNeeded: minQuestions,
    avgPct,
    avgPctNeeded: minAvgPct,
    sessionsDone: sessionPcts.length,
    sessionsNeeded: minSessions,
    daysAtLevel,
    daysNeeded: minDays,
    consistencyOk,
    stdDev,
    maxStdDev,
    minSessionPctOk: allAboveMin,
    minSessionPct,
  };

  const ready =
    questionsAtLevel >= minQuestions &&
    daysAtLevel >= minDays &&
    sessionPcts.length >= minSessions &&
    avgPct >= minAvgPct &&
    allAboveMin &&
    consistencyOk;

  return { ready, progress };
}

/**
 * Check if demotion should be triggered.
 * @param {number[]} sessionPcts - Array of session percentages (most recent first)
 * @param {number} daysAtLevel - Days spent at this level
 * @param {Date|null} lastDemotionAt - Last demotion date or null
 * @param {number} sessionsAtLevel - Total sessions at this level
 * @param {Date} now - Current time
 * @returns {boolean}
 */
export function isDemotionTriggered(sessionPcts, daysAtLevel, lastDemotionAt, sessionsAtLevel, now = new Date()) {
  // Can't demote from I
  // (caller should check current level)

  // Grace period: not enough time or sessions at level
  if (daysAtLevel < DEMOTION_MIN_DAYS) return false;
  if (sessionsAtLevel < 5) return false;

  // Cooldown from last demotion
  if (lastDemotionAt && daysBetween(now, lastDemotionAt) < DEMOTION_MIN_DAYS) return false;

  // Need at least DEMOTION_WINDOW sessions to evaluate
  const window = sessionPcts.slice(0, DEMOTION_WINDOW);
  if (window.length < DEMOTION_WINDOW) return false;

  const avg = calculateAvg(window);
  if (avg >= DEMOTION_AVG_THRESHOLD) return false;

  const badCount = window.filter((p) => p < DEMOTION_SESSION_THRESHOLD).length;
  return badCount >= DEMOTION_MIN_BAD_SESSIONS;
}

/**
 * Compute adaptive level status for a user/mode.
 * Pure function — all data passed in, no I/O.
 *
 * @param {object} params
 * @param {string} params.currentLevel
 * @param {number[]} params.sessionPcts - Recent session %s (newest first)
 * @param {number} params.questionsAtLevel
 * @param {Date} params.levelStartedAt
 * @param {Date|null} params.masteryTestEligibleAt - Cooldown date or null
 * @param {Date|null} params.lastDemotionAt
 * @param {number} params.sessionsAtLevel
 * @param {boolean} params.adaptiveEnabled
 * @param {Date} [params.now] - Current time (for testing)
 * @returns {object} Eligibility result
 */
export function computeEligibility({
  currentLevel,
  sessionPcts,
  questionsAtLevel,
  levelStartedAt,
  masteryTestEligibleAt,
  lastDemotionAt,
  sessionsAtLevel,
  adaptiveEnabled = true,
  now = new Date(),
}) {
  const levelIdx = LEVEL_ORDER.indexOf(currentLevel);
  const daysAtLevel = daysBetween(now, levelStartedAt);

  const result = {
    currentLevel,
    nextLevel: null,
    status: "stable",
    progress: null,
    reason: "",
  };

  if (!adaptiveEnabled) {
    result.reason = "Adaptiivinen järjestelmä on pois päältä.";
    return result;
  }

  // Check promotion (if not at max level)
  if (levelIdx < LEVEL_ORDER.length - 1) {
    const nextLevel = LEVEL_ORDER[levelIdx + 1];
    const key = `${currentLevel}→${nextLevel}`;
    const thresholds = PROMOTION_THRESHOLDS[key];

    if (thresholds) {
      const { ready, progress } = isPromotionReady(sessionPcts, thresholds, questionsAtLevel, daysAtLevel);

      result.nextLevel = nextLevel;
      result.progress = progress;

      if (ready) {
        // Check cooldown
        if (masteryTestEligibleAt && now < masteryTestEligibleAt) {
          const cooldownDays = Math.ceil((masteryTestEligibleAt - now) / (24 * 60 * 60 * 1000));
          result.status = "on_cooldown";
          result.reason = `Tasokoe palautuu ${cooldownDays} päivän päästä.`;
        } else {
          result.status = "ready_for_mastery_test";
          result.reason = `Olet edistynyt hienosti ${currentLevel}-tasolla! Valmis kokeilemaan ${nextLevel}-tasoa?`;
        }
        return result;
      }

      result.status = "pending";
      result.reason = buildProgressReason(progress, currentLevel, nextLevel);
    }
  } else {
    result.status = "stable";
    result.reason = "Olet korkeimmalla tasolla!";
    return result;
  }

  // Check demotion (if not at min level and not just promoted)
  if (levelIdx > 0) {
    const demoted = isDemotionTriggered(sessionPcts, daysAtLevel, lastDemotionAt, sessionsAtLevel, now);
    if (demoted) {
      result.status = "needs_demotion";
      result.nextLevel = LEVEL_ORDER[levelIdx - 1];
      result.reason = `Suosittelemme ${LEVEL_ORDER[levelIdx - 1]}-tasoa seuraavaksi.`;
      return result;
    }
  }

  return result;
}

function buildProgressReason(progress, currentLevel, nextLevel) {
  const parts = [];
  if (progress.questionsDone < progress.questionsNeeded) {
    parts.push(`Kysymyksiä: ${progress.questionsDone}/${progress.questionsNeeded}`);
  }
  if (progress.daysAtLevel < progress.daysNeeded) {
    parts.push(`Päiviä tasolla: ${progress.daysAtLevel}/${progress.daysNeeded}`);
  }
  if (progress.sessionsDone < progress.sessionsNeeded) {
    parts.push(`Sessioita: ${progress.sessionsDone}/${progress.sessionsNeeded}`);
  }
  if (progress.avgPct < progress.avgPctNeeded) {
    parts.push(`Keskiarvo: ${progress.avgPct}%/${progress.avgPctNeeded}%`);
  }
  if (!progress.minSessionPctOk) {
    parts.push(`Jokainen sessio vähintään ${progress.minSessionPct}%`);
  }
  if (!progress.consistencyOk) {
    parts.push(`Tasaisuus: hajonta ${progress.stdDev} (max ${progress.maxStdDev})`);
  }

  if (parts.length === 0) return `Edistyt kohti ${nextLevel}-tasoa.`;
  return `${currentLevel}→${nextLevel}: ${parts.join(" · ")}`;
}

/**
 * Score a mastery test.
 * @param {Array<{correct: boolean, isHigherLevel: boolean}>} answers
 * @returns {{ passed: boolean, scorePct: number, higherLevelPct: number }}
 */
export function scoreMasteryTest(answers) {
  const total = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  const scorePct = Math.round((correct / total) * 100);

  const higherOnly = answers.filter((a) => a.isHigherLevel);
  const higherCorrect = higherOnly.filter((a) => a.correct).length;
  const higherLevelPct = higherOnly.length > 0 ? Math.round((higherCorrect / higherOnly.length) * 100) : 0;

  const passed = scorePct >= 70 && higherLevelPct >= 60;

  return { passed, scorePct, higherLevelPct };
}
