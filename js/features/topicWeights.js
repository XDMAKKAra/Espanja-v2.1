// Exercise-selection multipliers derived from the onboarding profile.
//
// Weaknesses get more reps, strengths get fewer. Topics the user didn't
// flag either way are neutral. Consumers (task selector, adaptive picker)
// multiply their base selection weight by this number.
//
// NOTE: Scaffold only — not yet wired into any caller. Intended consumer
// is routes/exercises.js topic selection once we surface weak_areas /
// strong_areas from user_profile into the picker. Safe to import; no
// side effects. Delete this file if the feature is abandoned.

export const MULTIPLIER_WEAK = 2.0;
export const MULTIPLIER_NEUTRAL = 1.0;
export const MULTIPLIER_STRONG = 0.4;

/**
 * Return the selection-weight multiplier for a topic given the user's profile.
 *
 * @param {string}   topic   — canonical topic key (e.g. "subjunctive", "ser_estar")
 * @param {object}   profile — user_profile row (or any object with weak_areas / strong_areas arrays)
 * @returns {number}
 */
export function getTopicMultiplier(topic, profile) {
  if (!topic || !profile) return MULTIPLIER_NEUTRAL;
  const weak = Array.isArray(profile.weak_areas) ? profile.weak_areas : [];
  const strong = Array.isArray(profile.strong_areas) ? profile.strong_areas : [];

  if (weak.includes(topic)) return MULTIPLIER_WEAK;
  if (strong.includes(topic)) return MULTIPLIER_STRONG;
  return MULTIPLIER_NEUTRAL;
}

/**
 * Weighted-pick a topic from a list. Caller supplies candidates; this returns
 * one, biased by the user's weak/strong declarations.
 */
export function pickWeightedTopic(candidates, profile) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const weights = candidates.map(t => getTopicMultiplier(t, profile));
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return candidates[0];

  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
