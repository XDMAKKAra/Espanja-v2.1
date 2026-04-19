/**
 * Feature flags — localStorage-backed, dev-friendly.
 *
 * Usage from DevTools:
 *   localStorage.setItem("ff_side_panel", "1"); location.reload();
 *
 * Applied at module import time (called from js/main.js on boot). Each flag
 * sets data-ff-<key>="1" on <body> so CSS can scope rules without a JS
 * rerender round-trip.
 */

const FLAGS = [
  "side_panel",      // Gate C.5 pilot — vocab exercise right-side panel at ≥1200px
];

export function applyFeatureFlags() {
  if (typeof document === "undefined" || !document.body) return;
  for (const key of FLAGS) {
    let on = false;
    try { on = localStorage.getItem(`ff_${key}`) === "1"; } catch { /* private-mode */ }
    const attr = `data-ff-${key.replace(/_/g, "-")}`;
    if (on) {
      document.body.setAttribute(attr, "1");
    } else {
      document.body.removeAttribute(attr);
    }
  }
}

export function isFlagOn(key) {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(`ff_${key}`) === "1";
}

export default { applyFeatureFlags, isFlagOn };
