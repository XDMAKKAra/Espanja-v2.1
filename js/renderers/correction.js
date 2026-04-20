/**
 * Correction exercise renderer — seed-based, server-graded.
 *
 * Reuses the existing #translate-area DOM from app.html.
 * Student reads an erroneous Spanish sentence and types the corrected version.
 * Submitted to POST /api/grade/advisory with type "correction".
 *
 * onAnswer({ isCorrect, band, score, maxScore, explanation, correctAnswer })
 */

import { $ }                         from '../ui/nav.js';
import { API, apiFetch, authHeader } from '../api.js';
import { t }                         from '../ui/strings.js';
import { resetHint, advanceHint, trackWrongAttempt } from '../features/hintLadder.js';

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
  const catKey = `correction.hint.cat.${ex.error_category}`;
  if (step === 1) {
    hintEl.textContent = ex.hint_fi || t(catKey) || t('hint.nudge.correction');
    hintBtn.textContent = t('hint.step', { step: 2 });
  } else if (step === 2) {
    hintEl.textContent = t(catKey) || t('hint.nudge.correction');
    hintBtn.classList.add('hidden');
  } else {
    hintEl.textContent = t(catKey) || t('hint.nudge.correction');
    hintBtn.classList.add('hidden');
  }
}

/**
 * @param {{ id: string, erroneous_sentence: string, hint_fi?: string, error_category?: string }} ex
 * @param {HTMLElement} _container  — unused
 * @param {{ onAnswer?: Function }} [opts]
 */
export function renderCorrection(ex, _container, { onAnswer } = {}) {
  $('question-label').textContent = t('correction.instruction');
  $('question-text').textContent  = '';
  $('options-grid').style.display = 'none';
  const kbd = $('vocab-kbd-hint');
  if (kbd) kbd.style.display = 'none';

  const area     = $('translate-area');
  const source   = $('translate-source');
  const hintEl   = $('translate-hint');
  const hintBtn  = $('translate-hint-btn');
  const input    = $('translate-input');
  const submit   = $('translate-submit');
  const feedback = $('translate-feedback');

  resetHint(ex.id);
  area.classList.remove('hidden');

  // Show erroneous sentence as the source to correct
  source.textContent = ex.erroneous_sentence;

  hintBtn.onclick = () => {
    const step = advanceHint(ex.id);
    renderHintContent(hintEl, hintBtn, ex, step);
  };
  renderHintContent(hintEl, hintBtn, ex, 0);

  // Pre-fill with erroneous sentence so student can edit in place
  input.value       = ex.erroneous_sentence;
  input.disabled    = false;
  input.placeholder = t('correction.placeholder');
  input.focus();
  input.select();
  submit.disabled    = false;
  submit.textContent = t('btn.submit');
  feedback.classList.add('hidden');
  feedback.innerHTML = '';

  async function doSubmit() {
    const answer = input.value.trim();
    if (!answer) {
      feedback.textContent = t('err.empty');
      feedback.classList.remove('hidden');
      return;
    }

    submit.disabled   = true;
    input.disabled    = true;
    submit.textContent = '…';

    let result;
    try {
      const res = await apiFetch(`${API}/api/grade/advisory`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({ type: 'correction', payload: { id: ex.id, studentCorrection: answer } }),
      });
      result = await res.json();
    } catch {
      submit.disabled    = false;
      input.disabled     = false;
      submit.textContent = t('btn.submit');
      feedback.textContent = t('err.network.title');
      feedback.classList.remove('hidden');
      return;
    }

    const cls = BAND_CLASS[result.band] ?? 'wrong';

    if (result.band === 'vaarin') {
      const step = trackWrongAttempt(ex.id);
      if (step > 0) renderHintContent(hintEl, hintBtn, ex, step);
      // Re-enable for retry
      submit.disabled    = false;
      input.disabled     = false;
      submit.textContent = t('btn.submit');
    } else {
      hintBtn.classList.add('hidden');
      submit.textContent = t('btn.next');
    }

    const bandLabel = t(`band.${result.band}`);
    feedback.innerHTML = result.band === 'vaarin'
      ? `<span class="${cls}">${bandLabel}</span>`
      : `<span class="${cls}">${bandLabel}</span><br><strong>Oikea:</strong> ${result.correctSentence ?? ''}
         ${result.explanation_fi ? `<br><em>${result.explanation_fi}</em>` : ''}`;
    feedback.classList.remove('hidden');

    if (result.band !== 'vaarin') {
      onAnswer?.({
        isCorrect:     result.correct,
        band:          result.band,
        score:         result.score,
        maxScore:      result.maxScore,
        explanation:   result.explanation_fi ?? '',
        correctAnswer: result.correctSentence ?? '',
      });
    }
  }

  submit.onclick  = doSubmit;
  input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) doSubmit(); };
}
