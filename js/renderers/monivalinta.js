/**
 * Monivalinta renderer — paints N option buttons into a container and
 * fires `onAnswer` on click. That's it.
 *
 * Deliberately does not own prompt/context/feedback/explanation paint;
 * those live in each screen's existing DOM slots (#question-text,
 * #explanation-block, etc.). The renderer's job is only to replace the
 * inline "forEach(opt)" option-painting pattern duplicated across
 * vocab.js / grammar.js / adaptive.js with a single shared
 * implementation — so when Gates B–D land new types, each gets a
 * renderer file that owns its full UI without having to compete with
 * legacy DOM slot conventions.
 *
 * Accepts ONLY the unified ExerciseBase shape. Legacy items must be
 * translated via `toUnified()` at the call site.
 *
 * Per approved override #1, MC grading remains client-authoritative;
 * the renderer reports `isCorrect` to the caller, the caller does with
 * it what it wants (state updates, SR scheduling, advisory server call).
 */

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * @param {import('../../lib/exerciseTypes.js').ExerciseBase} ex  unified shape
 * @param {HTMLElement} container  element the option buttons will be appended into; existing children are removed
 * @param {{onAnswer?: (r: {chosenIndex: number, correctIndex: number, isCorrect: boolean, button: HTMLButtonElement}) => void}} [opts]
 */
export function renderMonivalinta(ex, container, { onAnswer } = {}) {
  if (ex?.type !== 'monivalinta') {
    throw new Error(`renderMonivalinta: expected type "monivalinta", got "${ex?.type}"`);
  }
  const mc = ex.payload?.monivalinta;
  if (!mc || !Array.isArray(mc.options)) {
    throw new Error('renderMonivalinta: missing payload.monivalinta.options');
  }

  container.replaceChildren();

  mc.options.forEach((text, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.dataset.idx = String(idx);
    const letter = OPTION_LETTERS[idx] || String(idx + 1);
    btn.textContent = `${letter}) ${text}`;
    btn.addEventListener('click', () => {
      onAnswer?.({
        chosenIndex: idx,
        correctIndex: mc.correctIndex,
        isCorrect: idx === mc.correctIndex,
        button: btn,
      });
    });
    container.appendChild(btn);
  });
}
