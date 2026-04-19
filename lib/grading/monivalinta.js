/**
 * Server-side monivalinta grader — advisory-only per approved override #1.
 *
 * The client computes and displays its own verdict; this grader is invoked
 * in parallel via POST /api/grade/advisory so a divergence can be logged
 * as telemetry (`mc_grading_divergence`). The client verdict is what the
 * student actually sees — the server's job is sanity-check, not truth.
 *
 * Why advisory rather than authoritative: the real server-trust fix
 * requires persisting exercise items server-side so the correct answer
 * isn't supplied by the client. That lands with the first new type
 * (yhdistäminen in Gate B) which has server-stored `correctPairs`.
 * For monivalinta today the correct index comes from the same OpenAI
 * response the client receives, so an authoritative server grader has
 * nothing extra to check. Advisory-mode catches bugs, not bad actors.
 *
 * Contract: the grader IGNORES any `correct` / `isCorrect` field from
 * the client. `isCorrect` is recomputed from `chosenIndex === correctIndex`.
 * If the client claims `correct: true` but the indices disagree, the
 * server responds `correct: false`. This enforces the minimum server-trust
 * invariant the dispatcher applies to every type.
 *
 * @param {object} payload
 * @param {number} payload.chosenIndex
 * @param {number} payload.correctIndex
 * @returns {{ok: true, correct: boolean, band: string, score: number, maxScore: number, chosenIndex: number, correctIndex: number}
 *   | {ok: false, error: string}}
 */
export function gradeMonivalinta(payload = {}) {
  const cIdx = Number(payload.chosenIndex);
  const aIdx = Number(payload.correctIndex);
  if (!Number.isInteger(cIdx) || cIdx < 0) {
    return { ok: false, error: 'chosenIndex must be a non-negative integer' };
  }
  if (!Number.isInteger(aIdx) || aIdx < 0) {
    return { ok: false, error: 'correctIndex must be a non-negative integer' };
  }
  const correct = cIdx === aIdx;
  return {
    ok: true,
    correct,
    band: correct ? 'taydellinen' : 'vaarin',
    score: correct ? 1 : 0,
    maxScore: 1,
    chosenIndex: cIdx,
    correctIndex: aIdx,
  };
}
