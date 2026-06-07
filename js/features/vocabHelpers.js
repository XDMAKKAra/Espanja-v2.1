// L-V399 C3 — pure vocab helpers extracted from js/screens/vocab.js to shrink
// that god-screen. Behavior-preserving: fmtElapsed, extractClientHeadwordKey
// and dedupe are pure (no DOM, no state, no IO), moved verbatim.

export function fmtElapsed(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}:${String(r).padStart(2, "0")}` : `${m} min`;
}

// Mirror of lib/exerciseHelpers.js extractHeadwordKey (server side): derive a
// Spanish lemma from the correct option so we can ask the next /generate call
// to avoid it. Kept as a documented client mirror — the server lib pulls in
// server-only deps, so the two cannot share a module across the bundle split.
export function extractClientHeadwordKey(ex) {
  try {
    if (!ex?.correct || !Array.isArray(ex.options)) return null;
    const idx = "ABCDEFGH".indexOf(String(ex.correct).trim().toUpperCase());
    if (idx < 0 || idx >= ex.options.length) return null;
    const raw = String(ex.options[idx] || "")
      .replace(/^[A-H]\)\s*/, "")
      .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, "")
      .toLowerCase()
      .trim();
    return raw || null;
  } catch { return null; }
}

export function dedupe(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = x.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(x); }
  }
  return out;
}
