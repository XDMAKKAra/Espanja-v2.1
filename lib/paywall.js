// Pass 4 Commit 7 — decides when a Pro upsell is allowed to fire.
// Pure function: no DOM, no network, no localStorage. The caller is
// responsible for (a) reading session count + lastFiredAt from whichever
// store and (b) rendering soft-copy vs modal based on the decision.

export const FREQUENCY_CAP_MS = 48 * 60 * 60 * 1000; // 48 h

// Triggers that legitimately re-use the modal — enumerate so the caller
// can't typo-drift. Matches PAYWALL.md Rule 4 table.
export const UPSELL_TRIGGERS = /** @type {const} */ ({
  FIRST_SESSION_END: "first_session_end",
  LOCKED_TILE_WRITING: "locked_tile_writing",
  LOCKED_TILE_READING: "locked_tile_reading",
  DAILY_CAP: "daily_cap",
  WEEK2_DASHBOARD: "week2_dashboard",
});

/**
 * @param {object} params
 * @param {number} params.sessionCount   Completed-session count (from server count or localStorage).
 * @param {number|null} params.lastFiredAt   Timestamp of the last modal render, or null.
 * @param {string} params.trigger        One of UPSELL_TRIGGERS values.
 * @param {number} [params.now]          Injected for testing.
 * @returns {{ allow: boolean, reason: string|null }}
 */
export function shouldFireUpsell({ sessionCount, lastFiredAt, trigger, now = Date.now() }) {
  // Rule 1 — never during the first session. Zero completed exercises.
  if (!sessionCount || sessionCount === 0) {
    return { allow: false, reason: "first_session" };
  }

  // Rule 6 — 48 h frequency cap. Applies to all triggers uniformly.
  if (lastFiredAt && now - lastFiredAt < FREQUENCY_CAP_MS) {
    return { allow: false, reason: "frequency_cap" };
  }

  // DAILY_CAP trigger shouldn't render as a modal — it's a soft banner on
  // the result screen. Callers should handle it separately; we reject here
  // as a safety net so a regression-wire can't silently blast modals.
  if (trigger === UPSELL_TRIGGERS.DAILY_CAP) {
    return { allow: false, reason: "daily_cap_is_banner_not_modal" };
  }

  return { allow: true, reason: null };
}

// Helper for callers: returns the key used by lib/paywall client storage.
export const LAST_FIRED_KEY = "puheo_pro_upsell_last_fired_at";
export const SESSION_COUNT_KEY = "puheo_completed_sessions";
