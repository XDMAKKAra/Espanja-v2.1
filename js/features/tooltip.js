// Global tooltip — sourced from shadcn/ui Tooltip pattern (Radix Tooltip
// primitive: dark popover with arrow, ~50-100ms open delay, fade-in).
// Vanilla port. Targets any element carrying a `data-tooltip` attribute.
//
// Why not just rely on native `title=`? Native tooltips have a 1s+ delay,
// system styling that ignores tokens, no positioning control, and no
// fade animation. Shadcn-style tooltips are the de-facto premium default.
//
// Idempotent — `installTooltip()` is safe to call multiple times; only
// the first call attaches handlers.

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 80;

let installed = false;
let popover = null;
let openTimer = null;
let closeTimer = null;
let activeTarget = null;
// Track suppressed `title` attributes so we can restore them on leave.
const suppressedTitles = new WeakMap();

function ensurePopover() {
  if (popover) return popover;
  popover = document.createElement("div");
  popover.className = "tt-popover";
  popover.setAttribute("role", "tooltip");
  popover.hidden = true;
  // Interactive mode (HTML tooltips with clickable CTAs) needs the popover
  // itself to keep the tooltip open when the pointer crosses from the
  // target into the floating popover. Cancel any pending close timer.
  popover.addEventListener("pointerenter", () => {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  });
  popover.addEventListener("pointerleave", () => {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(hide, CLOSE_DELAY_MS);
  });
  document.body.appendChild(popover);
  return popover;
}

function position(el) {
  const r = el.getBoundingClientRect();
  const pop = ensurePopover();
  // Measure after content set; default top placement, flip if too close
  // to top of viewport.
  pop.hidden = false;
  pop.style.visibility = "hidden";
  pop.style.left = "0px";
  pop.style.top = "0px";

  const pr = pop.getBoundingClientRect();
  const margin = 8;

  let placement = "top";
  if (r.top - pr.height - margin < 0) placement = "bottom";

  let left = r.left + (r.width / 2) - (pr.width / 2);
  // Clamp to viewport with 8px gutter.
  left = Math.max(8, Math.min(window.innerWidth - pr.width - 8, left));

  const top = placement === "top"
    ? r.top - pr.height - margin
    : r.bottom + margin;

  pop.dataset.placement = placement;
  pop.style.left = `${Math.round(left + window.scrollX)}px`;
  pop.style.top  = `${Math.round(top  + window.scrollY)}px`;
  pop.style.visibility = "visible";
}

function show(target) {
  const text = target.getAttribute("data-tooltip");
  if (!text) return;
  // Suppress native title to avoid double tooltips during the hover.
  if (target.hasAttribute("title")) {
    suppressedTitles.set(target, target.getAttribute("title"));
    target.setAttribute("title", "");
  }
  const pop = ensurePopover();
  // Interactive HTML mode (used by Free-card missing rows that embed a
  // clickable trial CTA). Author-controlled content only — never user input.
  const isHtml = target.getAttribute("data-tooltip-html") === "true";
  if (isHtml) {
    pop.innerHTML = text;
    pop.classList.add("tt-popover--interactive");
  } else {
    pop.textContent = text;
    pop.classList.remove("tt-popover--interactive");
  }
  pop.classList.remove("tt-popover--out");
  position(target);
  // Force layout, then trigger the in-class for the fade keyframe.
  // requestAnimationFrame is enough — no need for double-rAF here.
  requestAnimationFrame(() => pop.classList.add("tt-popover--in"));
  activeTarget = target;
}

function hide() {
  if (!popover) return;
  popover.classList.remove("tt-popover--in");
  popover.classList.add("tt-popover--out");
  // Restore any suppressed title.
  if (activeTarget && suppressedTitles.has(activeTarget)) {
    activeTarget.setAttribute("title", suppressedTitles.get(activeTarget));
    suppressedTitles.delete(activeTarget);
  }
  activeTarget = null;
  // Hide fully after the fade.
  setTimeout(() => {
    if (popover && !popover.classList.contains("tt-popover--in")) {
      popover.hidden = true;
      popover.classList.remove("tt-popover--out");
    }
  }, 180);
}

function asElement(node) {
  // Guard against Document / Window / text-node targets in the capture phase.
  return node && node.nodeType === 1 ? node : null;
}

function onEnter(e) {
  const el = asElement(e.target);
  if (!el) return;
  const target = el.closest("[data-tooltip]");
  if (!target) return;
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  if (openTimer)  clearTimeout(openTimer);
  openTimer = setTimeout(() => show(target), OPEN_DELAY_MS);
}

function onLeave(e) {
  const el = asElement(e.target);
  if (!el) return;
  const target = el.closest("[data-tooltip]");
  if (!target) return;
  if (openTimer)  { clearTimeout(openTimer);  openTimer  = null; }
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(hide, CLOSE_DELAY_MS);
}

export function installTooltip() {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;
  // Use pointer events so the same handler covers mouse + pen. Touch
  // pointers fire pointerenter on tap which is fine — the tooltip dismisses
  // on the next document tap (handled below).
  document.addEventListener("pointerenter", onEnter, true);
  document.addEventListener("pointerleave", onLeave, true);
  document.addEventListener("focusin", (e) => {
    const el = asElement(e.target); if (!el) return;
    const t = el.closest("[data-tooltip]");
    if (t) show(t);
  });
  document.addEventListener("focusout", (e) => {
    const el = asElement(e.target); if (!el) return;
    if (el.closest("[data-tooltip]")) hide();
  });
  // Touch dismiss: tap anywhere outside the active target (and outside the
  // popover itself, so users can click an interactive CTA inside it) hides.
  document.addEventListener("pointerdown", (e) => {
    if (!activeTarget) return;
    const el = asElement(e.target); if (!el) return;
    if (el.closest(".tt-popover")) return;
    if (el.closest("[data-tooltip]") !== activeTarget) hide();
  });
  window.addEventListener("scroll", hide, { passive: true });
}
