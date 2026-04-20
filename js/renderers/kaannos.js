/**
 * Kaannos (Finnish→Spanish translation) renderer — seed-based, AI-graded.
 *
 * Reuses the existing #translate-area DOM from app.html.
 * Student types a Spanish translation of a Finnish prompt. Submitted to
 * POST /api/grade-translate (AI grader) which returns score/feedback.
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
 * @param {{ id: string, prompt_fi: string, hint_fi?: string }} ex
 * @param {HTMLElement} _container  — unused
 * @param {{ onAnswer?: Function }} [opts]
 */
export function renderKaannos(ex, _container, { onAnswer } = {}) {
  $('question-label').textContent = t('kaannos.instruction');
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

  // Populate source: prompt + optional hint
  source.innerHTML = '';
  const promptNode = document.createTextNode(ex.prompt_fi);
  source.appendChild(promptNode);
  if (ex.hint_fi) {
    const hintEl = document.createElement('div');
    hintEl.className   = 'translate-hint';
    hintEl.textContent = `Vihje: ${ex.hint_fi}`;
    source.appendChild(hintEl);
  }

  input.value       = '';
  input.disabled    = false;
  input.placeholder = 'Kirjoita käännös espanjaksi…';
  input.focus();
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

    let data;
    try {
      const res = await apiFetch(`${API}/api/grade-translate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({
          userAnswer:           answer,
          acceptedTranslations: [],
          finnishSentence:      ex.prompt_fi,
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
        <strong>Paras käännös:</strong> ${data.bestTranslation ?? ''}
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
