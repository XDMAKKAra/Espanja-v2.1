/**
 * Server-side grading dispatcher.
 *
 * Mirrors the client-side `renderers` registry pattern (see
 * js/screens/exerciseRenderer.js). Gates B–D each register one grader:
 *   registerGrader("yhdistaminen",      gradeYhdistaminen)      Gate B
 *   registerGrader("aukkotehtava",      gradeAukkotehtava)       Gate C
 *   registerGrader("lauseen_muodostus", gradeLauseenMuodostus)   Gate C
 *   registerGrader("kaannos",           gradeKaannos)            Gate D
 *   registerGrader("tekstinymmarrys",   gradeTekstinymmarrys)    Gate D
 *
 * Dispatcher invariants:
 *   - The `correct` field returned to the client is ALWAYS computed by
 *     the grader, never echoed from the submission. A client that sends
 *     `{correct: true}` on a wrong answer still gets `{correct: false}`.
 *   - `band` belongs to the SHARED.md §3 band set: "taydellinen" |
 *     "ymmarrettava" | "lahella" | "vaarin".
 *   - Unknown type → structured error response, not a thrown exception
 *     (lets the route handler return 400 with a translatable message).
 */

import { gradeMonivalinta }  from './monivalinta.js';
import { gradeAukkotehtava } from './aukkotehtava.js';
import { gradeYhdistaminen } from './yhdistaminen.js';
import { gradeCorrection }   from './correction.js';

/** @type {Record<string, (payload: object) => object>} */
export const graders = {
  monivalinta:  gradeMonivalinta,
  aukkotehtava: gradeAukkotehtava,
  yhdistaminen: gradeYhdistaminen,
  correction:   gradeCorrection,
};

/**
 * Register a grader for a new exercise type.
 *
 * @param {string} type
 * @param {(payload: object) => object} fn
 */
export function registerGrader(type, fn) {
  if (typeof fn !== 'function') {
    throw new Error(`registerGrader: "${type}" must be a function`);
  }
  graders[type] = fn;
}

/**
 * Dispatch a grading submission to the registered grader for its type.
 *
 * @param {{type: string, exerciseId?: string, payload?: object}} submission
 * @returns {object} grader-specific result, or `{ok: false, error: string}`.
 */
export function dispatchGrade(submission) {
  if (!submission || typeof submission !== 'object') {
    return { ok: false, error: 'submission must be an object' };
  }
  const fn = graders[submission.type];
  if (!fn) {
    return { ok: false, error: `no grader registered for type "${submission.type}"` };
  }
  return fn(submission.payload || {});
}
