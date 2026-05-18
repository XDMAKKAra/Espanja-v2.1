// Accent-bar — pops up above any input / textarea on focus and lets
// the user insert the language-specific glyphs that are missing from a
// Finnish keyboard. Wired site-wide via attachAccentBar(); each input
// the renderer creates registers once.
//
// Usage:
//   attachAccentBar(inputEl)           — language auto-detected from state.language
//   attachAccentBar(inputEl, "fr")     — explicit language override
//   detachAccentBar(inputEl)           — clean up on screen unmount
//
// Behaviour:
//   - On focus → position a single shared toolbar floating above the input.
//   - Click a chip → insertText at the cursor / replace selection.
//   - Field keeps focus; cursor lands after the inserted glyph.
//   - On blur of the input (and not the toolbar) → hide toolbar after 100ms.

import { ACCENT_PALETTES } from "../lib/accentTolerance.js";
import { state } from "../state.js";

const ATTACHED = new WeakSet();
let TOOLBAR = null;
let CURRENT_INPUT = null;
let HIDE_TIMER = null;

function detectLang(override) {
  if (override && ACCENT_PALETTES[override]) return override;
  const stateLang = state?.language;
  if (stateLang && ACCENT_PALETTES[stateLang]) return stateLang;
  return "es";
}

function ensureToolbar() {
  if (TOOLBAR) return TOOLBAR;
  const t = document.createElement("div");
  t.className = "accent-bar";
  t.setAttribute("role", "toolbar");
  t.setAttribute("aria-label", "Aksentit ja erikoismerkit");
  t.hidden = true;
  document.body.appendChild(t);

  // Keep the toolbar interactive without taking focus away from the input.
  // mousedown.preventDefault stops the browser from blurring the input
  // when the chip is clicked.
  t.addEventListener("mousedown", (e) => e.preventDefault());

  TOOLBAR = t;
  return t;
}

function renderChips(lang) {
  const t = ensureToolbar();
  t.textContent = "";
  const chars = ACCENT_PALETTES[lang] || ACCENT_PALETTES.es;
  for (const ch of chars) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "accent-bar__chip";
    btn.textContent = ch;
    btn.setAttribute("aria-label", `Lisää ${ch}`);
    btn.tabIndex = -1;
    btn.addEventListener("click", () => insertAtCursor(ch));
    t.appendChild(btn);
  }
}

function insertAtCursor(text) {
  const el = CURRENT_INPUT;
  if (!el) return;
  if (typeof el.setRangeText === "function") {
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? el.value.length;
    el.setRangeText(text, s, e, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    el.value = (el.value || "") + text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  el.focus();
}

function position(input) {
  const t = ensureToolbar();
  const rect = input.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  // Default: sit above the input, hugging its left edge.
  let top = rect.top + scrollY - t.offsetHeight - 8;
  if (top < scrollY + 8) {
    // Fall back to below the input when the viewport top is in the way.
    top = rect.bottom + scrollY + 8;
  }
  const left = Math.max(8, rect.left + scrollX);
  t.style.top = `${top}px`;
  t.style.left = `${left}px`;
  t.style.maxWidth = `${Math.max(rect.width, 220)}px`;
}

function show(input, lang) {
  CURRENT_INPUT = input;
  renderChips(lang);
  const t = ensureToolbar();
  t.hidden = false;
  // Position after the toolbar renders so offsetHeight is accurate.
  requestAnimationFrame(() => position(input));
}

function hide() {
  if (!TOOLBAR) return;
  TOOLBAR.hidden = true;
  CURRENT_INPUT = null;
}

export function attachAccentBar(input, langOverride) {
  if (!input || ATTACHED.has(input)) return;
  ATTACHED.add(input);

  const onFocus = () => {
    if (HIDE_TIMER) { clearTimeout(HIDE_TIMER); HIDE_TIMER = null; }
    show(input, detectLang(langOverride));
  };
  const onBlur = () => {
    // Defer so a chip click can land before the toolbar disappears.
    HIDE_TIMER = setTimeout(() => {
      if (CURRENT_INPUT === input) hide();
    }, 120);
  };
  const onWindowResize = () => {
    if (CURRENT_INPUT === input) position(input);
  };

  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("scroll", onWindowResize, true);

  // Store off for detach.
  input.__accentBarHandlers = { onFocus, onBlur, onWindowResize };
}

export function detachAccentBar(input) {
  if (!input || !ATTACHED.has(input)) return;
  const h = input.__accentBarHandlers;
  if (h) {
    input.removeEventListener("focus", h.onFocus);
    input.removeEventListener("blur", h.onBlur);
    window.removeEventListener("resize", h.onWindowResize);
    window.removeEventListener("scroll", h.onWindowResize, true);
    delete input.__accentBarHandlers;
  }
  ATTACHED.delete(input);
}

/** Convenience for screens to wire every text input + textarea in a root. */
export function attachAccentBarAll(rootEl, langOverride) {
  if (!rootEl) return;
  rootEl.querySelectorAll('input[type="text"], textarea').forEach((el) => {
    if (el.dataset.noAccentBar === "true") return;
    attachAccentBar(el, langOverride);
  });
}
