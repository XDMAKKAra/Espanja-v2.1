/**
 * Kaannos (Finnish→Spanish translation) renderer, seed-based, AI-graded.
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
import { getHintStep, advanceHint, resetHint, trackWrongAttempt } from '../features/hintLadder.js';
import { attachAccentBar }           from '../features/accentBar.js';

function scoreToBand(score) {
  if (score >= 3) return 'taydellinen';
  if (score >= 2) return 'ymmarrettava';
  if (score >= 1) return 'lahella';
  return 'vaarin';
}

function renderHintContent(hintEl, hintBtn, ex, step) {
  hintEl.classList.toggle('hidden', step === 0);
  hintBtn.classList.remove('hidden');

  if (step === 0) {
    hintBtn.textContent = t('hint.step', { step: 1 });
    return;
  }
  if (step === 1) {
    hintEl.textContent = ex.hint_fi || t('hint.nudge.kaannos');
    hintBtn.textContent = t('hint.step', { step: 2 });
  } else if (step === 2) {
    hintEl.textContent = ex.hint_partial || t('hint.nudge.kaannos');
    hintBtn.textContent = t('hint.showAnswer');
  } else {
    hintEl.innerHTML = ex.hint_example_es
      ? `<strong>${t('hint.example.label')}</strong> ${ex.hint_example_es}<br><em>${ex.hint_example_fi || ''}</em>`
      : (ex.hint_fi || t('hint.nudge.kaannos'));
    hintBtn.classList.add('hidden');
  }
}

/**
 * @param {{ id: string, prompt_fi: string, hint_fi?: string, hint_partial?: string, hint_example_es?: string, hint_example_fi?: string }} ex
 * @param {HTMLElement} _container , unused
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
  const hintEl   = $('translate-hint');
  const hintBtn  = $('translate-hint-btn');
  const input    = $('translate-input');
  const submit   = $('translate-submit');
  const feedback = $('translate-feedback');

  resetHint(ex.id);

  area.classList.remove('hidden');
  source.textContent = ex.prompt_fi;

  hintBtn.onclick = () => {
    const step = advanceHint(ex.id);
    renderHintContent(hintEl, hintBtn, ex, step);
  };
  renderHintContent(hintEl, hintBtn, ex, 0);

  input.value       = '';
  input.disabled    = false;
  input.placeholder = 'Kirjoita käännös espanjaksi…';
  attachAccentBar(input);
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
          taskId:               ex.taskId || ex.id || null,
          lang:                 ex.lang || null,
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
    const band       = scoreToBand(score);

    // Auto-advance hint on wrong answer
    if (band === 'vaarin') {
      const step = trackWrongAttempt(ex.id);
      if (step > 0) renderHintContent(hintEl, hintBtn, ex, step);
    } else {
      hintBtn.classList.add('hidden');
    }

    const scoreClass = score >= 3 ? 'correct' : score >= 2 ? 'accent-warn' : 'wrong';
    const promoteId = (ex.taskId || ex.id);
    // PR #2 — when the AI grader returned 0–1 ("wrong / barely close"), let
    // the student promote their answer ("Mielestäni oikein"). Promotion
    // requires a real taskId so freeform free-mode käännös items (which
    // don't carry a task row in Supabase) silently skip the button.
    const canPromote = score <= 1 && promoteId && !data.listHit;
    feedback.innerHTML = `
      <div class="translate-score ${scoreClass}">${score} / ${maxScore}</div>
      <div class="translate-best">
        <strong>Paras käännös:</strong> ${data.bestTranslation ?? ''}
        ${data.feedback ? `<br>${data.feedback}` : ''}
      </div>
      ${canPromote ? `
        <div class="translate-promote-row">
          <button class="translate-promote-btn" id="translate-promote-yes" type="button">Mielestäni oikein</button>
          <span class="translate-promote-hint">Vastauksesi tallennetaan hyväksyttyihin käännöksiin.</span>
        </div>
      ` : ''}
    `;
    feedback.classList.remove('hidden');
    submit.textContent = t('btn.next');

    if (canPromote) {
      const promoteBtn = document.getElementById('translate-promote-yes');
      promoteBtn?.addEventListener('click', async () => {
        promoteBtn.disabled = true;
        promoteBtn.textContent = 'Tallennetaan…';
        try {
          const res = await apiFetch(`${API}/api/translate-promote`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body:    JSON.stringify({ taskId: promoteId, answer }),
          });
          if (res.ok) {
            promoteBtn.textContent = 'Tallennettu ✓';
            // Treat as correct in the lesson runner now that the user
            // claimed responsibility. score upgrades to 2 for SR purposes.
            onAnswer?.({
              isCorrect:   true,
              band:        'ymmarrettava',
              score:       2,
              maxScore,
              explanation: data.bestTranslation ?? '',
            });
          } else {
            promoteBtn.textContent = 'Tallennus epäonnistui';
            promoteBtn.disabled = false;
          }
        } catch {
          promoteBtn.textContent = 'Tallennus epäonnistui';
          promoteBtn.disabled = false;
        }
      }, { once: true });
    }

    // Käännös hyväksytään jo "ymmärrettävä"-tasolta (score >= 2). Best-
    // translation-feedback näytetään silti. List-hits land here as score 3.
    onAnswer?.({
      isCorrect:   score >= 2,
      band,
      score,
      maxScore,
      explanation: data.explanation ?? data.bestTranslation ?? '',
    });
  }

  submit.onclick  = doSubmit;
  input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) doSubmit(); };
}
