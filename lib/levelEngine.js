/**
 * Level Engine — slow-moving, persistent mastery indicator.
 *
 * Level (I→A→B→C→M→E→L) changes ONLY at checkpoint boundaries.
 * Rolling 30-day accuracy determines checkpoint eligibility.
 */

import supabase from "../supabase.js";

export const LEVELS = ["I", "A", "B", "C", "M", "E", "L"];
const LEVEL_IDX = {};
LEVELS.forEach((l, i) => (LEVEL_IDX[l] = i));

const CHECKPOINT_THRESHOLD = 0.70; // 70% rolling accuracy to be offered checkpoint
const CHECKPOINT_PASS = 0.80;      // 80% on checkpoint test to level up
const LEVEL_DOWN_THRESHOLD = 0.40; // Below 40% for 30 days → warn, then demote
const MIN_SESSIONS_FOR_CHECKPOINT = 15; // Need at least 15 sessions in 30 days

/**
 * Get or create a user's level record.
 */
export async function getUserLevel(userId) {
  const { data, error } = await supabase
    .from("user_level")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Create default level
    const row = {
      user_id: userId,
      current_level: "B",
      rolling_accuracy_30d: 0,
      rolling_sessions_30d: 0,
    };
    await supabase.from("user_level").upsert(row);
    return row;
  }
  return data;
}

/**
 * Compute 30-day rolling accuracy from exercise_logs.
 * Returns { accuracy, sessionCount, byTopic }.
 */
export async function computeRollingAccuracy(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: logs, error } = await supabase
    .from("exercise_logs")
    .select("mode, score_correct, score_total, created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo)
    .not("score_total", "is", null)
    .gt("score_total", 0);

  if (error || !logs?.length) {
    return { accuracy: 0, sessionCount: 0, byTopic: {} };
  }

  let totalCorrect = 0;
  let totalQuestions = 0;
  const byTopic = {};

  for (const log of logs) {
    totalCorrect += log.score_correct || 0;
    totalQuestions += log.score_total || 0;

    const topic = log.mode || "general";
    if (!byTopic[topic]) byTopic[topic] = { correct: 0, total: 0 };
    byTopic[topic].correct += log.score_correct || 0;
    byTopic[topic].total += log.score_total || 0;
  }

  for (const t in byTopic) {
    byTopic[t].accuracy = byTopic[t].total > 0
      ? byTopic[t].correct / byTopic[t].total
      : 0;
  }

  return {
    accuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
    sessionCount: logs.length,
    byTopic,
  };
}

/**
 * Update the user_level record with fresh rolling stats.
 * Returns the updated level record + checkpoint eligibility.
 */
export async function refreshUserLevel(userId) {
  const level = await getUserLevel(userId);
  const rolling = await computeRollingAccuracy(userId);

  const updates = {
    rolling_accuracy_30d: Math.round(rolling.accuracy * 1000) / 1000,
    rolling_sessions_30d: rolling.sessionCount,
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("user_level")
    .update(updates)
    .eq("user_id", userId);

  const currentIdx = LEVEL_IDX[level.current_level] ?? 1;
  const nextLevel = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;

  // Checkpoint eligibility
  const canCheckpoint =
    nextLevel &&
    rolling.accuracy >= CHECKPOINT_THRESHOLD &&
    rolling.sessionCount >= MIN_SESSIONS_FOR_CHECKPOINT &&
    (!level.last_checkpoint_at ||
      Date.now() - new Date(level.last_checkpoint_at).getTime() > 7 * 24 * 60 * 60 * 1000); // 7 day cooldown

  // Level-down warning
  const shouldWarnDown =
    currentIdx > 0 &&
    rolling.accuracy < LEVEL_DOWN_THRESHOLD &&
    rolling.sessionCount >= 10 &&
    !level.level_down_warned;

  return {
    ...level,
    ...updates,
    nextLevel,
    canCheckpoint,
    shouldWarnDown,
    rolling,
  };
}

/**
 * Process a checkpoint result. If passed, level up.
 */
export async function processCheckpointResult(userId, correct, total) {
  const pct = total > 0 ? correct / total : 0;
  const passed = pct >= CHECKPOINT_PASS;
  const level = await getUserLevel(userId);

  const updates = {
    last_checkpoint_at: new Date().toISOString(),
    checkpoint_passed: passed,
    updated_at: new Date().toISOString(),
  };

  if (passed) {
    const currentIdx = LEVEL_IDX[level.current_level] ?? 1;
    if (currentIdx < LEVELS.length - 1) {
      updates.current_level = LEVELS[currentIdx + 1];
      updates.level_since = new Date().toISOString();
      updates.level_down_warned = false;
    }
  }

  await supabase
    .from("user_level")
    .update(updates)
    .eq("user_id", userId);

  return {
    passed,
    score: correct,
    total,
    pct: Math.round(pct * 100),
    newLevel: updates.current_level || level.current_level,
    previousLevel: level.current_level,
  };
}

/**
 * Force level down (after sustained low performance + warning).
 */
export async function levelDown(userId) {
  const level = await getUserLevel(userId);
  const currentIdx = LEVEL_IDX[level.current_level] ?? 1;

  if (currentIdx <= 0) return level;

  const newLevel = LEVELS[currentIdx - 1];
  await supabase
    .from("user_level")
    .update({
      current_level: newLevel,
      level_since: new Date().toISOString(),
      level_down_warned: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return { ...level, current_level: newLevel };
}

/**
 * Get scaffold default for a given level.
 * Higher levels start with less scaffolding.
 */
export function defaultScaffoldForLevel(level) {
  const map = { I: 3, A: 3, B: 2, C: 2, M: 1, E: 1, L: 0 };
  return map[level] ?? 2;
}

/**
 * Calculate what % the user is towards the next level.
 * Based on rolling accuracy relative to checkpoint threshold.
 */
export function progressToNextLevel(rollingAccuracy, sessionCount) {
  if (sessionCount < 3) return 0;
  const sessionProgress = Math.min(sessionCount / MIN_SESSIONS_FOR_CHECKPOINT, 1);
  const accuracyProgress = Math.min(rollingAccuracy / CHECKPOINT_THRESHOLD, 1);
  return Math.round(Math.min(sessionProgress * 0.3 + accuracyProgress * 0.7, 1) * 100);
}
