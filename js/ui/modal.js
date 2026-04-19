/**
 * Modal shell — design-system/DESIGN.md §8.8
 *
 * Responsibilities (what an existing app modal gets for free):
 *   - Focus trap while open (Tab + Shift+Tab stay inside the panel).
 *   - Escape closes.
 *   - Backdrop click closes (any element with [data-modal-dismiss]).
 *   - Body scroll lock while open.
 *   - Restores focus to the element that opened the modal on close.
 *
 * Usage:
 *   import { openModal } from "./ui/modal.js";
 *   const close = openModal(document.getElementById("my-modal"));
 *   // later: close();
 *
 * Works with any element that matches the markup in modal.css header.
 */

let openCount = 0;
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableWithin(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => {
    // Skip zero-size or hidden
    if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

export function openModal(modalEl, options = {}) {
  if (!modalEl) return () => {};
  const panel = modalEl.querySelector(".modal__panel") || modalEl;
  const previouslyFocused = document.activeElement;

  modalEl.removeAttribute("hidden");
  modalEl.setAttribute("aria-hidden", "false");
  modalEl.setAttribute("role", modalEl.getAttribute("role") || "dialog");
  modalEl.setAttribute("aria-modal", "true");

  if (openCount === 0) document.body.classList.add("modal-open");
  openCount++;

  // Move focus to the first focusable inside the panel, or the panel itself.
  const initial = options.initialFocus
    ? modalEl.querySelector(options.initialFocus)
    : (focusableWithin(panel)[0] || panel);
  if (initial && !panel.contains(document.activeElement)) {
    if (!initial.hasAttribute("tabindex")) initial.setAttribute("tabindex", "-1");
    initial.focus({ preventScroll: true });
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const list = focusableWithin(panel);
    if (list.length === 0) { e.preventDefault(); return; }
    const first = list[0];
    const last  = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function onClick(e) {
    const dismiss = e.target.closest("[data-modal-dismiss]");
    if (dismiss && modalEl.contains(dismiss)) {
      close();
    }
  }

  modalEl.addEventListener("keydown", onKeydown);
  modalEl.addEventListener("click", onClick);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    modalEl.removeEventListener("keydown", onKeydown);
    modalEl.removeEventListener("click", onClick);
    modalEl.setAttribute("hidden", "");
    modalEl.setAttribute("aria-hidden", "true");
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) document.body.classList.remove("modal-open");
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      try { previouslyFocused.focus({ preventScroll: true }); } catch { /* ignore */ }
    }
    if (typeof options.onClose === "function") options.onClose();
  }

  return close;
}

export default { openModal };
