// Hint ladder — item-level state machine for progressive hint reveal.
// Pure module-level state; no DOM. Renderers call these functions and
// handle their own rendering based on the returned step number.
//
// Steps: 0 = hidden, 1 = nudge, 2 = partial, 3 = worked example
// Step 4 (answer+explanation) is triggered by submission, not this module.

const _steps       = new Map(); // itemId → current step (0-3)
const _wrongCounts = new Map(); // itemId → wrong attempt count

/** Current step for an item (0 if never seen). */
export function getHintStep(itemId) {
  return _steps.get(itemId) ?? 0;
}

/** Advance one step (max 3). Returns new step. */
export function advanceHint(itemId) {
  const next = Math.min((getHintStep(itemId)) + 1, 3);
  _steps.set(itemId, next);
  return next;
}

/** Reset state for an item (call on each new render). */
export function resetHint(itemId) {
  _steps.delete(itemId);
  _wrongCounts.delete(itemId);
}

/**
 * Record a wrong attempt. Auto-advances to step 1 on the 2nd wrong
 * attempt if still at step 0. Returns the current step after update.
 */
export function trackWrongAttempt(itemId) {
  const count = (_wrongCounts.get(itemId) ?? 0) + 1;
  _wrongCounts.set(itemId, count);
  if (count >= 2 && getHintStep(itemId) === 0) {
    _steps.set(itemId, 1);
  }
  return getHintStep(itemId);
}

/** Wrong attempt count for an item. */
export function getWrongCount(itemId) {
  return _wrongCounts.get(itemId) ?? 0;
}
