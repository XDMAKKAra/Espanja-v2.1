/**
 * LauseenMuodostus (sentence construction) renderer — seed-based, AI-graded.
 *
 * Reuses the existing #translate-area DOM from app.html.
 * Required words are shown as chips inside #translate-source.
 * Student writes a Spanish sentence containing all required_words.
 * Submitted to POST /api/grade-translate; AI evaluates free-text quality
 * and whether required words are present.
 *
 * onAnswer({ isCorrect, band, score, maxScore, explanation })
 */

import { $ }                         from '../ui/nav.js';
import { API, apiFetch, authHeader } from '../api.js';
import { t }                         from '../ui/strings.js';

function scoreToBand(score) {
  if (score >= 3) return 'taydellinen';
  if (score >= 2) return 'ymmarrettava';
  if (score >= 1) return 'lahella';
  return 'vaarin';
}

/**
 * @param {{ id: string, prompt_fi: string, required_words: string[], hint_fi?: string }} ex
 * @param {HTMLElement} _container  — unused
 * @param {{ onAnswer?: Function }} [opts]
 */
export function renderLauseenMuodostus(ex, _container, { onAnswer } = {}) {
  $('question-label').textContent = t('lauseen.instruction');
  $('question-text').textContent  = '';
  $('options-grid').style.display = 'none';
  const kbd = $('vocab-kbd-hint');
  if (kbd) kbd.style.display = 'none';

  const area     = $('translate-area');
  const source   = $('translate-source');
  const input    = $('translate-input');
  const submit   = $('translate-submit');
  const feedback = $('translate-feedback');

  area.classList.remove('hidden');

  // Build source: prompt, required-word chips, optional hint
  source.innerHTML = '';

  const promptEl = document.createElement('div');
  promptEl.className   = 'lauseen-prompt';
  promptEl.textContent = ex.prompt_fi;
  source.appendChild(promptEl);

  if (ex.required_words?.length) {
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'lauseen-chips';
    const label = document.createElement('span');
    label.className   = 'lauseen-chips-label';
    label.textContent = 'Käytä sanoja: ';
    chipsWrap.appendChild(label);
    ex.required_words.forEach((w) => {
      const chip = document.createElement('span');
      chip.className   = 'lauseen-chip';
      chip.textContent = w;
      chipsWrap.appendChild(chip);
    });
    source.appendChild(chipsWrap);
  }

  if (ex.hint_fi) {
    const hintEl = document.createElement('div');
    hintEl.className   = 'translate-hint';
    hintEl.textContent = `Vihje: ${ex.hint_fi}`;
    source.appendChild(hintEl);
  }

  input.value       = '';
  input.disabled    = false;
  input.placeholder = 'Muodosta lause espanjaksi…';
  input.focus();
  submit.disabled    = false;
  submit.textContent = t('btn.submit');
  feedback.classList.add('hidden');
  feedback.innerHTML = '';

  // Include required words in grader context so AI checks them
  const gradingContext = ex.prompt_fi +
    (ex.required_words?.length
      ? ` (Käytä lauseessa: ${ex.required_words.join(', ')})`
      : '');

  async function doSubmit() {
    const answer = input.value.trim();
    if (!answer) {
      feedback.textContent = t('err.empty');
      feedback.classList.remove('hidden');
      return;
    }

    submit.disabled    = true;
    input.disabled     = true;
    submit.textContent = '…';

    let data;
    try {
      const res = await apiFetch(`${API}/api/grade-translate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({
          userAnswer:           answer,
          acceptedTranslations: [],
          finnishSentence:      gradingContext,
        }),
      });
      data = await res.json();
    } catch {
      submit.disabled    = false;
      input.disabled     = false;
      submit.textContent = t('btn.submit');
      feedback.textContent = t('err.network.title');
      feedback.classList.remove('hidden');
      return;
    }

    const score      = data.score ?? 0;
    const maxScore   = data.maxScore ?? 3;
    const scoreClass = score >= 3 ? 'correct' : score >= 2 ? 'accent-warn' : 'wrong';

    feedback.innerHTML = `
      <div class="translate-score ${scoreClass}">${score} / ${maxScore}</div>
      <div class="translate-best">
        <strong>Esimerkkilause:</strong> ${data.bestTranslation ?? ''}
        ${data.feedback ? `<br>${data.feedback}` : ''}
      </div>
    `;
    feedback.classList.remove('hidden');
    submit.textContent = t('btn.next');

    onAnswer?.({
      isCorrect:   score >= 3,
      band:        scoreToBand(score),
      score,
      maxScore,
      explanation: data.explanation ?? data.bestTranslation ?? '',
    });
  }

  submit.onclick  = doSubmit;
  input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) doSubmit(); };
}
