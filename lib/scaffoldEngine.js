/**
 * Scaffold Engine — session-internal micro-adjustment.
 *
 * Scaffold level 0–3 controls how much help the user gets:
 *   3 = hints + options + translation (full help)
 *   2 = hints + options
 *   1 = hint only
 *   0 = raw exercise (no help)
 *
 * Adjusts based on 3-correct-streak (scaffold down) and
 * 2-wrong-streak (scaffold up) within a session.
 */

import supabase from "../supabase.js";
import { defaultScaffoldForLevel } from "./levelEngine.js";

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min = same session

/**
 * Get or create session state for a user+topic.
 * Resets if last update was > 30 min ago.
 */
export async function getSessionState(userId, topic, currentLevel) {
  const { data, error } = await supabase
    .from("user_session_state")
    .select("*")
    .eq("user_id", userId)
    .eq("topic", topic)
    .single();

  const defaultScaffold = defaultScaffoldForLevel(currentLevel);

  if (error || !data) {
    // Create new session state
    const row = {
      user_id: userId,
      topic,
      scaffold_level: defaultScaffold,
      correct_streak: 0,
      wrong_streak: 0,
      session_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await supabase.from("user_session_state").upsert(row, { onConflict: "user_id,topic" });
    return row;
  }

  // Check if session has expired (> 30 min since last update)
  const lastUpdate = new Date(data.updated_at).getTime();
  if (Date.now() - lastUpdate > SESSION_TTL_MS) {
    // Reset for new session, but keep scaffold near the level default
    const resetRow = {
      scaffold_level: defaultScaffold,
      correct_streak: 0,
      wrong_streak: 0,
      session_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await supabase
      .from("user_session_state")
      .update(resetRow)
      .eq("user_id", userId)
      .eq("topic", topic);
    return { ...data, ...resetRow };
  }

  return data;
}

/**
 * Process an answer and adjust scaffold level.
 * Returns { scaffoldLevel, scaffoldChanged, direction }.
 */
export async function processAnswer(userId, topic, isCorrect, currentLevel) {
  const state = await getSessionState(userId, topic, currentLevel);
  let { scaffold_level, correct_streak, wrong_streak } = state;

  let scaffoldChanged = false;
  let direction = null;

  if (isCorrect) {
    correct_streak++;
    wrong_streak = 0;

    // 3 correct in a row → reduce scaffolding
    if (correct_streak >= 3 && scaffold_level > 0) {
      scaffold_level--;
      correct_streak = 0;
      scaffoldChanged = true;
      direction = "down"; // less help
    }
  } else {
    wrong_streak++;
    correct_streak = 0;

    // 2 wrong in a row → increase scaffolding
    if (wrong_streak >= 2 && scaffold_level < 3) {
      scaffold_level++;
      wrong_streak = 0;
      scaffoldChanged = true;
      direction = "up"; // more help
    }
  }

  // Clamp
  scaffold_level = Math.max(0, Math.min(3, scaffold_level));

  await supabase
    .from("user_session_state")
    .update({
      scaffold_level,
      correct_streak,
      wrong_streak,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("topic", topic);

  return {
    scaffoldLevel: scaffold_level,
    scaffoldChanged,
    direction,
    correctStreak: correct_streak,
    wrongStreak: wrong_streak,
  };
}

/**
 * Describe what scaffolding features are active at a given level.
 */
export function describeScaffold(scaffoldLevel) {
  return {
    showOptions: scaffoldLevel >= 2,      // multiple-choice options visible
    showHint: scaffoldLevel >= 1,         // grammatical hint / infinitive
    showTranslation: scaffoldLevel >= 3,  // Finnish translation visible
    level: scaffoldLevel,
  };
}

/**
 * Build scaffold instructions for the AI prompt.
 */
export function scaffoldPromptFragment(scaffoldLevel) {
  if (scaffoldLevel >= 3) {
    return `SCAFFOLDING: FULL — provide 4 multiple-choice options, a grammatical hint in parentheses (infinitive + tense/mood), AND the Finnish translation of the target phrase. This is maximum support.`;
  }
  if (scaffoldLevel >= 2) {
    return `SCAFFOLDING: MEDIUM — provide 4 multiple-choice options AND a hint (infinitive + form). Do NOT provide the Finnish translation.`;
  }
  if (scaffoldLevel >= 1) {
    return `SCAFFOLDING: MINIMAL — provide only a hint (infinitive or grammatical category). Do NOT provide multiple-choice options — the student must produce the answer. No Finnish translation.`;
  }
  return `SCAFFOLDING: NONE — no hints, no options, no translation. The student must produce the answer entirely from memory. This is the hardest mode.`;
}
