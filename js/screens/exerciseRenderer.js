/**
 * Exercise renderer dispatcher.
 *
 * Object-map registry (not a switch) so Pass 0's five new types register
 * with one line each. No call sites yet — commit 2b wires vocab, grammar,
 * and adaptive to this dispatcher. Reading/exam/fullExam remain on their
 * inline render paths until Gate D per exercises/DEFERRED.md.
 *
 * Consumes unified ExerciseBase items only (see lib/exerciseTypes.js).
 * Callers must translate legacy items via `toUnified()` upstream.
 */

import { renderMonivalinta }      from '../renderers/monivalinta.js';
import { renderAukkotehtava }     from '../renderers/aukkotehtava.js';
import { renderYhdistaminen }     from '../renderers/yhdistaminen.js';
import { renderKaannos }          from '../renderers/kaannos.js';
import { renderLauseenMuodostus } from '../renderers/lauseenMuodostus.js';

/** @type {Record<string, (ex: object, container: HTMLElement, opts?: object) => void>} */
export const renderers = {
  monivalinta:       renderMonivalinta,
  aukkotehtava:      renderAukkotehtava,
  yhdistaminen:      renderYhdistaminen,
  kaannos:           renderKaannos,
  lauseen_muodostus: renderLauseenMuodostus,
};

/**
 * Register a renderer for a new exercise type.
 * Pass 0 Gates B–D each add one call: `registerRenderer("yhdistaminen", renderYhdistaminen)`, etc.
 *
 * @param {string} type
 * @param {(ex: object, container: HTMLElement, opts?: object) => void} fn
 */
export function registerRenderer(type, fn) {
  if (typeof fn !== 'function') {
    throw new Error(`registerRenderer: "${type}" must be a function`);
  }
  renderers[type] = fn;
}

/**
 * Dispatch a unified exercise to its registered renderer.
 *
 * @param {object} ex - unified ExerciseBase
 * @param {HTMLElement} container
 * @param {object} [opts] - passed through to the renderer (onAnswer, etc.)
 */
export function renderExercise(ex, container, opts) {
  const fn = renderers[ex?.type];
  if (!fn) {
    throw new Error(`renderExercise: no renderer registered for type "${ex?.type}"`);
  }
  return fn(ex, container, opts);
}
