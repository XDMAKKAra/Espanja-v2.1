// charCounter — replaces the legacy word counter on writing tasks.
// User-requested 2026-05-18: count characters everywhere, not words,
// so a 50–80 sanaa target reads as e.g. 250–500 merkkiä in real time.
//
// Usage:
//   attachCharCounter(textarea, counterEl, { minChars, maxChars })
//
// Behaviour:
//   - Live updates `counterEl` text to "<n> / <minChars>–<maxChars>".
//   - Adds .is-met when n >= minChars, .is-too-long when n > maxChars.
//   - Returns a small handle with .stop() to detach the listener.

export function attachCharCounter(textarea, counterEl, { minChars = 0, maxChars = 0 } = {}) {
  if (!textarea || !counterEl) return { stop() {} };
  const targetLabel = (minChars || maxChars)
    ? `${minChars}–${maxChars}` /* en-dash */
    : "";
  function update() {
    const n = (textarea.value || "").length;
    counterEl.textContent = targetLabel ? `${n} / ${targetLabel} merkkiä` : `${n} merkkiä`;
    counterEl.classList.toggle("is-met", minChars > 0 && n >= minChars);
    counterEl.classList.toggle("is-too-long", maxChars > 0 && n > maxChars);
  }
  textarea.addEventListener("input", update);
  update();
  return {
    stop() { textarea.removeEventListener("input", update); },
  };
}

/** Convert a word-target (legacy "X sanaa") into a character target.
 *  Heuristic: 1 sana ≈ 6 merkkiä Suomi-Espanja-mediaanissa, ja YTL:n
 *  sanamääräohjeet ovat ~5–6 merkkiä per sana. */
export function wordsToChars(words) {
  return Math.round((words || 0) * 6);
}
