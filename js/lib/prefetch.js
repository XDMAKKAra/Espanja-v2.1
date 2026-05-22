/**
 * prefetch — hover-intent based chunk + data warming (v282 perf-pass).
 *
 * `prefetchChunk(key, factory)` runs the dynamic-import factory exactly
 * once per page lifetime. Caller passes a string key so repeat hovers on
 * different rows that point to the same chunk dedupe correctly. The
 * factory is held until first call so esbuild can split the chunk; the
 * import promise is fire-and-forget — only the side-effect of populating
 * the browser's module cache matters.
 *
 * `onHoverIntent(el, fn)` debounces mouseenter/focus by 80 ms so we only
 * fire on real intent — flicking the cursor across a card grid won't
 * spray a dozen requests. Cancelled if the pointer leaves before the
 * threshold.
 *
 * Failed prefetches drop the dedupe key so the real navigation can try
 * again on a clean slate.
 */

const _chunkPrefetched = new Set();

export function prefetchChunk(key, factory) {
  if (_chunkPrefetched.has(key)) return;
  _chunkPrefetched.add(key);
  try {
    factory().catch(() => _chunkPrefetched.delete(key));
  } catch {
    _chunkPrefetched.delete(key);
  }
}

const HOVER_INTENT_MS = 80;

export function onHoverIntent(el, fn) {
  if (!el || typeof fn !== "function") return;
  let timer = null;
  let fired = false;
  const trigger = () => {
    if (fired) return;
    fired = true;
    try { fn(); } catch { /* swallow — prefetch is best-effort */ }
  };
  const onEnter = () => {
    if (timer || fired) return;
    timer = setTimeout(() => { timer = null; trigger(); }, HOVER_INTENT_MS);
  };
  const onLeave = () => {
    if (timer) { clearTimeout(timer); timer = null; }
  };
  el.addEventListener("mouseenter", onEnter, { passive: true });
  el.addEventListener("touchstart", trigger, { passive: true, once: true });
  el.addEventListener("focus", onEnter, true);
  el.addEventListener("mouseleave", onLeave, { passive: true });
  el.addEventListener("blur", onLeave, true);
}
