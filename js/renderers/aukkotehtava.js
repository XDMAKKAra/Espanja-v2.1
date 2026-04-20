/**
 * Aukkotehtava (gap-fill) renderer — seed-based, server-graded.
 *
 * Reuses the existing #gap-fill-area DOM from app.html.
 * Correct answer is never held client-side; the grader at
 * POST /api/grade/advisory looks it up by seed ID and returns it
 * along with explanation_fi only after the student has submitted.
 *
 * onAnswer({ isCorrect, band, score, maxScore, explanation, correctAnswer })
 */

import { $ }                             from '../ui/nav.js';
import { API, apiFetch, authHeader }     from '../api.js';
import { t }                             from '../ui/strings.js';
import { getHintStep, advanceHint, resetHint, trackWrongAttempt } from '../features/hintLadder.js';

const BAND_CLASS = {
  taydellinen:  'correct',
  ymmarrettava: 'accent-warn',
  lahella:      'accent-warn',
  vaarin:       'wrong',
};

function renderHintContent(hintEl, hintBtn, ex, step) {
  hintEl.classList.toggle('hidden', step === 0);
  hintBtn.classList.remove('hidden');

  if (step === 0) {
    hintBtn.textContent = t('hint.step', { step: 1 });
    return;
  }
  if (step === 1) {
    hintEl.textContent = ex.hint_fi || t('hint.nudge.aukko');
    hintBtn.textContent = t('hint.step', { step: 2 });
  } else if (step === 2) {
    // First letter + underscores — requires hint_partial in seed or falls back to nudge
    hintEl.textContent = ex.hint_partial || ex.hint_fi || t('hint.nudge.aukko');
    hintBtn.textContent = t('hint.showAnswer');
  } else {
    hintEl.innerHTML = ex.hint_example_es
      ? `<strong>${t('hint.example.label')}</strong> ${ex.hint_example_es}<br><em>${ex.hint_example_fi || ''}</em>`
      : (ex.hint_fi || t('hint.nudge.aukko'));
    hintBtn.classList.add('hidden');
  }
}

/**
 * @param {{ id: string, sentence: string, hint_fi?: string, hint_partial?: string, hint_example_es?: string, hint_example_fi?: string }} ex
 * @param {HTMLElement} _container  — unused; renderer owns #gap-fill-area
 * @param {{ onAnswer?: Function }} [opts]
 */
export function renderAukkotehtava(ex, _container, { onAnswer } = {}) {
  $('question-label').textContent = t('aukko.instruction');
  $('question-text').textContent  = '';
  $('options-grid').style.display = 'none';
  const kbd = $('vocab-kbd-hint');
  if (kbd) kbd.style.display = 'none';

  const area     = $('gap-fill-area');
  const sentence = $('gap-fill-sentence');
  const hintEl   = $('gap-fill-hint');
  const hintBtn  = $('gap-fill-hint-btn');
  const input    = $('gap-fill-input');
  const submit   = $('gap-fill-submit');
  const feedback = $('gap-fill-feedback');

  resetHint(ex.id);

  area.classList.remove('hidden');
  sentence.textContent = ex.sentence;

  // Hint button — always visible, advances ladder on click
  hintBtn.onclick = () => {
    const step = advanceHint(ex.id);
    renderHintContent(hintEl, hintBtn, ex, step);
  };
  renderHintContent(hintEl, hintBtn, ex, 0);

  input.value     = '';
  input.className = 'gap-fill-input';
  input.disabled  = false;
  input.placeholder = t('aukko.placeholder');
  input.focus();
  submit.disabled = false;
  submit.textContent = t('btn.submit');
  feedback.classList.add('hidden');
  feedback.textContent = '';

  async function doSubmit() {
    const answer = input.value.trim();
    if (!answer) {
      feedback.textContent = t('err.empty');
      feedback.classList.remove('hidden');
      return;
    }

    submit.disabled = true;
    input.disabled  = true;
    submit.textContent = '…';

    let result;
    try {
      const res = await apiFetch(`${API}/api/grade/advisory`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({ type: 'aukkotehtava', payload: { id: ex.id, studentAnswer: answer } }),
      });
      result = await res.json();
    } catch {
      submit.disabled   = false;
      input.disabled    = false;
      submit.textContent = t('btn.submit');
      feedback.textContent = t('err.network.title');
      feedback.classList.remove('hidden');
      return;
    }

    // Auto-advance hint on wrong answer
    if (result.band === 'vaarin') {
      const step = trackWrongAttempt(ex.id);
      if (step > 0) renderHintContent(hintEl, hintBtn, ex, step);
      // Re-enable for retry
      submit.disabled = false;
      input.disabled  = false;
      input.value     = '';
      submit.textContent = t('btn.submit');
    } else {
      hintBtn.classList.add('hidden');
    }

    const cls = BAND_CLASS[result.band] ?? 'wrong';
    input.classList.add(cls);

    const bandLabel = t(`band.${result.band}`);
    feedback.textContent = result.band === 'vaarin'
      ? `${bandLabel} — ${result.correctAnswer}`
      : bandLabel;
    feedback.className = `gap-fill-feedback ${cls}`;
    feedback.classList.remove('hidden');

    if (result.band !== 'vaarin') {
      submit.textContent = t('btn.next');
      onAnswer?.({
        isCorrect:     result.correct,
        band:          result.band,
        score:         result.score,
        maxScore:      result.maxScore,
        explanation:   result.explanation_fi ?? result.correctAnswer ?? '',
        correctAnswer: result.correctAnswer,
      });
    }
  }

  submit.onclick  = doSubmit;
  input.onkeydown = (e) => { if (e.key === 'Enter') doSubmit(); };
}
