// Landing grader-card error tooltip positioning.
//
// The `.ge-tip` element is a child of an inline `.ge` span. When the
// trigger wraps across line boundaries, `position: relative` on an
// inline element doesn't establish a clean positioning context, so
// the absolute child anchors to a fragment box that doesn't match
// the visible trigger. The CSS used to compensate with hardcoded
// :nth-last-child rules, which broke as soon as multiple cards
// (triptyykki) had different .ge counts.
//
// Fix: tooltip is `position: fixed`, positioned via JS using the
// trigger's first ClientRect. Arrow tracks the trigger centre via
// the --ge-arrow-x custom property. Tooltip flips above the trigger
// when there's no room below.
//
// Idempotent. Reduced-motion-safe (no animation logic — pure CSS
// transition handles the fade).

const ARROW_INSET = 12;          // keep arrow at least this far from tooltip edge
const VIEWPORT_GUTTER = 8;       // tooltip never closer than this to viewport edge
const VERTICAL_GAP = 10;         // space between trigger and tooltip
let active = null;

function firstRect(el) {
  const rects = el.getClientRects();
  return rects.length > 0 ? rects[0] : el.getBoundingClientRect();
}

function position(trigger, tip) {
  // Reveal at 0,0 to measure
  tip.dataset.visible = "true";
  tip.style.left = "0px";
  tip.style.top = "0px";
  const tipRect = tip.getBoundingClientRect();
  const triggerRect = firstRect(trigger);
  const triggerCentre = triggerRect.left + triggerRect.width / 2;

  // Default: tooltip below trigger
  let placement = "bottom";
  let top = triggerRect.bottom + VERTICAL_GAP;
  // Flip above if not enough room below
  if (top + tipRect.height + VIEWPORT_GUTTER > window.innerHeight) {
    placement = "top";
    top = triggerRect.top - VERTICAL_GAP - tipRect.height;
  }

  // Horizontal: centre on trigger, clamp to viewport
  let left = triggerCentre - tipRect.width / 2;
  left = Math.max(VIEWPORT_GUTTER, Math.min(window.innerWidth - tipRect.width - VIEWPORT_GUTTER, left));

  // Arrow tracks the actual trigger centre, relative to tooltip's left
  let arrowX = triggerCentre - left;
  arrowX = Math.max(ARROW_INSET, Math.min(tipRect.width - ARROW_INSET, arrowX));

  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
  tip.style.setProperty("--ge-arrow-x", `${Math.round(arrowX)}px`);
  tip.dataset.placement = placement;
}

function show(trigger) {
  const tip = trigger.querySelector(".ge-tip");
  if (!tip) return;
  if (active && active !== trigger) hide();
  active = trigger;
  position(trigger, tip);
}

function hide() {
  if (!active) return;
  const tip = active.querySelector(".ge-tip");
  if (tip) {
    tip.dataset.visible = "false";
    tip.removeAttribute("data-placement");
  }
  active = null;
}

let installed = false;
export function initGeTip() {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  // Pointer + focus open. Pointer-leave / blur close.
  document.addEventListener("pointerenter", (e) => {
    const t = e.target?.nodeType === 1 ? e.target.closest(".ge") : null;
    if (t) show(t);
  }, true);
  document.addEventListener("pointerleave", (e) => {
    const t = e.target?.nodeType === 1 ? e.target.closest(".ge") : null;
    if (t === active) hide();
  }, true);
  document.addEventListener("focusin", (e) => {
    const t = e.target?.closest?.(".ge");
    if (t) show(t);
  });
  document.addEventListener("focusout", (e) => {
    const t = e.target?.closest?.(".ge");
    if (t === active) hide();
  });
  // Touch: tap-to-open, tap outside closes
  document.addEventListener("pointerdown", (e) => {
    if (!active) return;
    const el = e.target?.nodeType === 1 ? e.target : null;
    if (!el) return;
    if (el.closest(".ge-tip")) return;
    if (el.closest(".ge") !== active) hide();
  });
  // Esc closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && active) {
      active.blur();
      hide();
    }
  });
  // Reposition on scroll / resize while open
  window.addEventListener("scroll", () => { if (active) hide(); }, { passive: true });
  window.addEventListener("resize", () => { if (active) hide(); }, { passive: true });
}
