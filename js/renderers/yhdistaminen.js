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

const BAND_CLASS = {
  taydellinen:  'correct',
  ymmarrettava: 'accent-warn',
  lahella:      'accent-warn',
  vaarin:       'wrong',
};

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
  const statusEl = $('matching-status');

  area.classList.remove('hidden');
  leftCol.innerHTML  = '';
  rightCol.innerHTML = '';
  statusEl.className = 'matching-status';
  statusEl.textContent = '';

  const { items, shuffledFi } = ex;
  const N = items.length;

  // State
  let selectedLeft = null;       // { id, el } | null
  const pairMap    = new Map();  // id → { studentFi, rightEl, leftEl }
  const usedFi     = new Set();  // Finnish strings already assigned

  // Right column
  const rightBtnMap = new Map(); // fi → btn (for cross-pairing cleanup)
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
  const leftBtnMap = new Map(); // id → btn
  items.forEach(({ id, es }) => {
    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'matching-item';
    btn.textContent = es;
    btn.addEventListener('click', () => selectLeft(id, btn));
    leftCol.appendChild(btn);
    leftBtnMap.set(id, btn);
  });

  updateStatus();

  function selectLeft(id, el) {
    if (el.classList.contains('matched')) return;
    leftCol.querySelectorAll('.matching-item').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    selectedLeft = { id, el };
  }

  function selectRight(fi, rightEl) {
    if (!selectedLeft || rightEl.classList.contains('matched')) return;

    // Undo previous pairing for this left item
    const prevPair = pairMap.get(selectedLeft.id);
    if (prevPair) {
      usedFi.delete(prevPair.studentFi);
      prevPair.rightEl.classList.remove('pending');
      prevPair.leftEl.classList.remove('pending');
    }

    // Undo previous pairing of this right item (another left had it)
    if (usedFi.has(fi)) {
      for (const [pid, p] of pairMap) {
        if (p.studentFi === fi) {
          pairMap.delete(pid);
          p.leftEl.classList.remove('pending');
          break;
        }
      }
    }

    // Create new pairing
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

    // Per-pair feedback
    items.forEach(({ id }, idx) => {
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
