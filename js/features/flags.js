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
  if (typeof document === "undefined") return;
  for (const key of FLAGS) {
    const on = localStorage.getItem(`ff_${key}`) === "1";
    if (on) {
      document.body.setAttribute(`data-ff-${key.replace(/_/g, "-")}`, "1");
    } else {
      document.body.removeAttribute(`data-ff-${key.replace(/_/g, "-")}`);
    }
  }
}

export function isFlagOn(key) {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(`ff_${key}`) === "1";
}

export default { applyFeatureFlags, isFlagOn };
