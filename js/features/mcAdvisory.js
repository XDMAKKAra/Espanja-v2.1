/**
 * Monivalinta advisory-mode grading + divergence telemetry.
 *
 * Per approved override #1, MC grading is client-authoritative; the
 * client verdict is what the user actually sees. This helper fires the
 * submission at `/api/grade/advisory` in parallel so we can detect
 * bugs when the server's recomputation disagrees with the client's.
 *
 * Fire-and-forget. Never blocks the UI. Network / parse errors are
 * swallowed silently, matching the `reportAdaptiveAnswer` +
 * `logMistake` idioms in js/screens/vocab.js.
 *
 * On divergence, emits a PostHog event `mc_grading_divergence` with
 * the minimum diagnostic data (exerciseId prefix, both verdicts,
 * both indices). No PII, no exercise content.
 */

import { API, authHeader, apiFetch } from '../api.js';
import { track } from '../analytics.js';

/**
 * @param {{exerciseId?: string|number, chosenIndex: number, correctIndex: number, clientIsCorrect: boolean}} submission
 */
export async function reportMcAdvisory(submission) {
  const { exerciseId, chosenIndex, correctIndex, clientIsCorrect } = submission;
  try {
    const res = await apiFetch(`${API}/api/grade/advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({
        type: 'monivalinta',
        exerciseId: exerciseId == null ? undefined : String(exerciseId),
        payload: { chosenIndex, correctIndex },
      }),
    });
    if (!res.ok) return;
    const server = await res.json();
    if (typeof server.correct !== 'boolean') return;
    if (server.correct !== clientIsCorrect) {
      track('mc_grading_divergence', {
        exerciseId: exerciseId == null ? null : String(exerciseId).slice(0, 60),
        chosenIndex,
        correctIndex,
        clientIsCorrect,
        serverIsCorrect: server.correct,
      });
    }
  } catch {
    /* silent — advisory must never surface a UI error */
  }
}
