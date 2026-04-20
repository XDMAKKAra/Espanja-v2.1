/**
 * Yhdistaminen (matching) renderer — seed-based, server-graded.
 *
 * Renders two columns: Spanish items on the left, shuffled Finnish items on
 * the right. User clicks a Spanish item then a Finnish item to pair them.
 * Any pairing can be revised until all N items are matched, at which point
 * the pairs are submitted to POST /api/grade/advisory for authoritative scoring.
 *
 * onAnswer({ isCorrect, band, score, maxScore, correctCount, totalCount })
 */

import { $ }                         from '../ui/nav.js';
import { API, apiFetch, authHeader } from '../api.js';
import { t }                         from '../ui/strings.js';
import { resetHint, advanceHint } from '../features/hintLadder.js';

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
  // Step 1: nudge
  if (step === 1) {
    hintEl.textContent = t('hint.nudge.yhdista');
    hintBtn.textContent = t('hint.step', { step: 2 });
    return;
  }
  // Step 2: reveal one correct pair (done in caller via revealOnePair)
  if (step === 2) {
    hintEl.textContent = t('hint.nudge.yhdista');
    hintBtn.textContent = t('hint.showAnswer');
    return;
  }
  // Step 3: word glosses (if available) or repeat nudge
  hintEl.innerHTML = ex.items?.length
    ? ex.items.slice(0, 3).map(item =>
        item.hint_fi ? `<em>${item.es}</em> ≈ ${item.hint_fi}` : ''
      ).filter(Boolean).join(' · ') || t('hint.nudge.yhdista')
    : t('hint.nudge.yhdista');
  hintBtn.classList.add('hidden');
}

/**
 * @param {{ type: string, items: Array<{id,es}>, shuffledFi: string[] }} ex
 * @param {HTMLElement} _container  — unused
 * @param {{ onAnswer?: Function }} [opts]
 */
export function renderYhdistaminen(ex, _container, { onAnswer } = {}) {
  $('question-label').textContent = t('yhdista.instruction');
  $('question-text').textContent  = '';
  $('options-grid').style.display = 'none';
  const kbd = $('vocab-kbd-hint');
  if (kbd) kbd.style.display = 'none';

  const area     = $('matching-area');
  const leftCol  = $('matching-left');
  const rightCol = $('matching-right');
  const hintEl   = $('matching-hint');
  const hintBtn  = $('matching-hint-btn');
  const statusEl = $('matching-status');

  // Use first item's id as key for the ladder (group exercise)
  const ladderKey = ex.items?.[0]?.id ?? 'yhdista';
  resetHint(ladderKey);

  area.classList.remove('hidden');
  leftCol.innerHTML  = '';
  rightCol.innerHTML = '';
  statusEl.className = 'matching-status';
  statusEl.textContent = '';

  const { items, shuffledFi } = ex;
  const N = items.length;

  // State
  let selectedLeft = null;
  const pairMap    = new Map();
  const usedFi     = new Set();
  const rightBtnMap = new Map();

  // Right column
  shuffledFi.forEach((fi) => {
    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'matching-item';
    btn.textContent = fi;
    btn.addEventListener('click', () => selectRight(fi, btn));
    rightCol.appendChild(btn);
    rightBtnMap.set(fi, btn);
  });

  // Left column
  const leftBtnMap = new Map();
  items.forEach(({ id, es }) => {
    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'matching-item';
    btn.textContent = es;
    btn.addEventListener('click', () => selectLeft(id, btn));
    leftCol.appendChild(btn);
    leftBtnMap.set(id, btn);
  });

  // Hint button
  hintBtn.onclick = () => {
    const step = advanceHint(ladderKey);
    renderHintContent(hintEl, hintBtn, ex, step);
    if (step === 2) revealOnePair();
  };
  renderHintContent(hintEl, hintBtn, ex, 0);

  updateStatus();

  function revealOnePair() {
    // Reveal the first unmatched left item's correct pair
    for (const { id } of items) {
      if (pairMap.has(id)) continue;
      const correctFi = shuffledFi.find(fi => {
        // We don't know which fi is correct without server data; use first available
        return !usedFi.has(fi);
      });
      if (!correctFi) break;
      const leftEl  = leftBtnMap.get(id);
      const rightEl = rightBtnMap.get(correctFi);
      if (leftEl && rightEl) {
        usedFi.add(correctFi);
        pairMap.set(id, { studentFi: correctFi, rightEl, leftEl });
        leftEl.classList.add('pending');
        rightEl.classList.add('pending');
        const badge = document.createElement('span');
        badge.className   = 'matching-hint-badge';
        badge.textContent = t('hint.pair.revealed');
        leftEl.appendChild(badge);
        updateStatus();
        if (pairMap.size === N) autoSubmit();
      }
      break;
    }
  }

  function selectLeft(id, el) {
    if (el.classList.contains('matched')) return;
    leftCol.querySelectorAll('.matching-item').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    selectedLeft = { id, el };
  }

  function selectRight(fi, rightEl) {
    if (!selectedLeft || rightEl.classList.contains('matched')) return;

    const prevPair = pairMap.get(selectedLeft.id);
    if (prevPair) {
      usedFi.delete(prevPair.studentFi);
      prevPair.rightEl.classList.remove('pending');
      prevPair.leftEl.classList.remove('pending');
    }

    if (usedFi.has(fi)) {
      for (const [pid, p] of pairMap) {
        if (p.studentFi === fi) {
          pairMap.delete(pid);
          p.leftEl.classList.remove('pending');
          break;
        }
      }
    }

    usedFi.add(fi);
    pairMap.set(selectedLeft.id, { studentFi: fi, rightEl, leftEl: selectedLeft.el });
    selectedLeft.el.classList.remove('selected');
    selectedLeft.el.classList.add('pending');
    rightEl.classList.add('pending');
    selectedLeft = null;

    updateStatus();
    if (pairMap.size === N) autoSubmit();
  }

  function updateStatus() {
    statusEl.textContent = `${pairMap.size} / ${N} yhdistetty`;
  }

  async function autoSubmit() {
    leftCol.querySelectorAll('.matching-item').forEach(b => { b.disabled = true; });
    rightCol.querySelectorAll('.matching-item').forEach(b => { b.disabled = true; });
    hintBtn.classList.add('hidden');
    statusEl.textContent = '…';

    const pairs = items.map(({ id }) => ({
      id,
      studentFi: pairMap.get(id)?.studentFi ?? '',
    }));

    let result;
    try {
      const res = await apiFetch(`${API}/api/grade/advisory`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({ type: 'yhdistaminen', payload: { pairs } }),
      });
      result = await res.json();
    } catch {
      statusEl.textContent = t('err.network.title');
      leftCol.querySelectorAll('.matching-item').forEach(b => { b.disabled = false; });
      rightCol.querySelectorAll('.matching-item').forEach(b => { b.disabled = false; });
      return;
    }

    items.forEach(({ id }) => {
      const pairResult = (result.results ?? []).find(r => r.id === id);
      const cls = pairResult?.correct ? 'matched' : 'wrong';
      const leftBtn = leftBtnMap.get(id);
      const pair    = pairMap.get(id);
      if (leftBtn) { leftBtn.classList.remove('pending'); leftBtn.classList.add(cls); }
      if (pair) {
        pair.rightEl.classList.remove('pending');
        pair.rightEl.classList.add(cls);
        if (!pairResult?.correct && pairResult?.expected) {
          pair.rightEl.title = `Oikea: ${pairResult.expected}`;
        }
      }
    });

    const bandClass = BAND_CLASS[result.band] ?? 'wrong';
    statusEl.textContent = `${result.correctCount ?? 0} / ${result.totalCount ?? N} oikein`;
    statusEl.className   = `matching-status ${bandClass}`;

    onAnswer?.({
      isCorrect:   result.correct,
      band:        result.band,
      score:       result.score,
      maxScore:    result.maxScore,
      explanation: '',
      correctCount: result.correctCount,
      totalCount:   result.totalCount,
    });
  }
}
