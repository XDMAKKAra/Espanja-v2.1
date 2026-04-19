/**
 * Monivalinta renderer — consumes the unified ExerciseBase shape.
 *
 * Accepts ONLY the unified shape (see lib/exerciseTypes.js). Legacy
 * monivalinta items must be translated via `toUnified()` before they
 * reach this renderer. No legacy-shape tolerance by design — commit 2b
 * wires call sites to pass unified items, not "wire + adapt."
 *
 * Per approved override #1, MC grading remains client-side; the server
 * verdict is advisory. The caller receives `{chosenIndex, correctIndex,
 * isCorrect}` via onAnswer and is responsible for any server reporting,
 * SR scheduling, mistake logging, and advance-to-next wiring. This
 * renderer only paints and grades.
 */

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Render a monivalinta exercise into `container`.
 *
 * @param {import('../../lib/exerciseTypes.js').ExerciseBase} ex - unified shape.
 * @param {HTMLElement} container
 * @param {{onAnswer?: (result: {chosenIndex:number, correctIndex:number, isCorrect:boolean}) => void}} [opts]
 */
export function renderMonivalinta(ex, container, { onAnswer } = {}) {
  if (ex.type !== 'monivalinta') {
    throw new Error(`renderMonivalinta: expected type "monivalinta", got "${ex.type}"`);
  }
  const mc = ex.payload?.monivalinta;
  if (!mc || !Array.isArray(mc.options)) {
    throw new Error('renderMonivalinta: missing payload.monivalinta.options');
  }

  container.replaceChildren();

  const promptEl = document.createElement('div');
  promptEl.className = 'mc-prompt';
  promptEl.textContent = ex.prompt || '';
  container.appendChild(promptEl);

  if (ex.context) {
    const ctx = document.createElement('div');
    ctx.className = 'mc-context';
    ctx.textContent = ex.context;
    container.appendChild(ctx);
  }

  const optionsEl = document.createElement('div');
  optionsEl.className = 'mc-options';
  optionsEl.setAttribute('role', 'radiogroup');
  optionsEl.setAttribute('aria-label', ex.instruction || 'Vastausvaihtoehdot');

  const buttons = mc.options.map((text, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mc-option';
    btn.dataset.idx = String(idx);
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    const letter = OPTION_LETTERS[idx] || String(idx + 1);
    btn.textContent = `${letter}) ${text}`;
    return btn;
  });
  buttons.forEach((b) => optionsEl.appendChild(b));
  container.appendChild(optionsEl);

  const feedback = document.createElement('div');
  feedback.className = 'mc-feedback';
  feedback.hidden = true;
  feedback.setAttribute('aria-live', 'polite');
  container.appendChild(feedback);

  const onPick = (chosenIndex) => {
    const isCorrect = chosenIndex === mc.correctIndex;
    buttons.forEach((b, i) => {
      b.disabled = true;
      b.setAttribute('aria-checked', i === chosenIndex ? 'true' : 'false');
      if (i === mc.correctIndex) b.classList.add('mc-option--correct');
      if (i === chosenIndex && !isCorrect) b.classList.add('mc-option--wrong');
    });
    feedback.hidden = false;
    feedback.classList.toggle('mc-feedback--correct', isCorrect);
    feedback.classList.toggle('mc-feedback--wrong', !isCorrect);
    feedback.textContent = isCorrect ? 'Oikein!' : (ex.explanation || 'Väärin');
    onAnswer?.({ chosenIndex, correctIndex: mc.correctIndex, isCorrect });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => onPick(Number(btn.dataset.idx)));
  });
}
