/**
 * L-PLAN-5 UPDATE 4 — re-readable teaching page.
 *
 * The student can tap "📖 Opetussivu" while doing exercises in lesson mode
 * and the teaching content slides in as a side-panel (desktop ≥ 880 px) or
 * full-screen modal (mobile < 880 px). The content is cached in
 * sessionStorage by js/screens/curriculum.js openLesson() so opening the
 * panel costs zero network calls.
 *
 * Visibility:
 *   - The floating trigger button is mounted once at boot.
 *   - It shows when the lesson context is active AND the current screen is
 *     an exercise screen (#screen-exercise / #screen-grammar /
 *     #screen-reading / #screen-writing).
 *   - It hides on every other screen — including the lesson page itself
 *     (the teaching content is already on screen there).
 *
 * A11y:
 *   - role="dialog" + aria-modal="true" on the panel.
 *   - Focus moves to the close button on open, returns to the trigger on close.
 *   - Escape closes the panel.
 *   - Click on the backdrop closes the panel.
 *   - prefers-reduced-motion gates the slide animation.
 */

import { renderMarkdown } from "../screens/curriculum.js";
import { getLessonContext, clearLessonContext } from "../lib/lessonContext.js";
import { confirmDialog } from "./confirmDialog.js";

const EXERCISE_SCREENS = new Set([
  "screen-exercise",
  "screen-grammar",
  "screen-reading",
  "screen-writing",
  // L-COURSE-1 hotfix — the new pregenerated lesson runner stays on
  // screen-lesson while the student answers items, so the re-read
  // Opetussivu trigger needs to surface there too. Without this entry the
  // floating button either never shows, or shows briefly and clicking it
  // does nothing (no teaching md cached for the runner's screen-id).
  "screen-lesson",
]);

// Map exercise screen IDs to the natural top-bar element where the lesson
// badge can be appended without disturbing existing layout.
const SCREEN_BADGE_HOSTS = {
  "screen-exercise": ".exercise__top",
  "screen-grammar":  ".gram-top, .exercise__top",
  "screen-reading":  ".reading-top, .exercise__top",
  "screen-writing":  ".writing-top, .exercise__top",
};

let _refs = null;
let _lastFocus = null;
let _isOpen = false;

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function buildDom() {
  // Trigger button — fixed, top-right of the viewport, visible only when
  // a lesson is active and we're on an exercise screen.
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "teaching-panel-trigger";
  btn.className = "teaching-panel-trigger";
  btn.setAttribute("aria-haspopup", "dialog");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "teaching-panel");
  btn.hidden = true;
  btn.innerHTML = `
    <svg class="teaching-panel-trigger__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
    <span class="teaching-panel-trigger__label">Opetussivu</span>
  `;
  document.body.appendChild(btn);

  // Backdrop + panel container.
  const root = document.createElement("div");
  root.id = "teaching-panel-root";
  root.className = "teaching-panel-root";
  root.hidden = true;
  root.innerHTML = `
    <div class="teaching-panel__backdrop" data-close="1" aria-hidden="true"></div>
    <aside class="teaching-panel" id="teaching-panel" role="dialog" aria-modal="true" aria-labelledby="teaching-panel-title">
      <header class="teaching-panel__head">
        <button type="button" class="teaching-panel__close" id="teaching-panel-close" aria-label="Sulje opetussivu">← Sulje</button>
        <p class="teaching-panel__title" id="teaching-panel-title">Opetussivu</p>
      </header>
      <div class="teaching-panel__body" id="teaching-panel-body" tabindex="0"></div>
    </aside>
  `;
  document.body.appendChild(root);

  return {
    btn,
    root,
    panel: root.querySelector(".teaching-panel"),
    backdrop: root.querySelector(".teaching-panel__backdrop"),
    close: root.querySelector("#teaching-panel-close"),
    title: root.querySelector("#teaching-panel-title"),
    body: root.querySelector("#teaching-panel-body"),
  };
}

function open() {
  if (!_refs || _isOpen) return;
  const ctx = getLessonContext();
  const md = (() => {
    try { return sessionStorage.getItem("currentLessonTeachingMd") || ""; }
    catch { return ""; }
  })();
  const focus = ctx?.lessonFocus || "Opetussivu";
  _refs.title.textContent = focus;
  _refs.body.innerHTML = md
    ? `<article class="teaching-panel__article curr-teaching">${renderMarkdown(md)}</article>`
    : `<p class="teaching-panel__empty">Tämän oppitunnin opetussivu ei ole vielä saatavilla. Voit jatkaa tehtävää.</p>`;
  _refs.btn.setAttribute("aria-expanded", "true");
  _refs.root.hidden = false;
  // Force reflow so the transition kicks in.
  // eslint-disable-next-line no-unused-expressions
  _refs.panel.offsetHeight;
  _refs.root.classList.add("is-open");
  _lastFocus = document.activeElement;
  _refs.close.focus();
  document.addEventListener("keydown", onKeydown);
  _isOpen = true;
}

function close() {
  if (!_refs || !_isOpen) return;
  _refs.root.classList.remove("is-open");
  _refs.btn.setAttribute("aria-expanded", "false");
  document.removeEventListener("keydown", onKeydown);
  _isOpen = false;
  // After the slide-out completes, hide the root entirely.
  setTimeout(() => {
    if (!_isOpen) _refs.root.hidden = true;
  }, 260);
  if (_lastFocus && typeof _lastFocus.focus === "function") {
    _lastFocus.focus();
  }
  _lastFocus = null;
}

function onKeydown(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    close();
    return;
  }
  if (e.key === "Tab" && _refs) {
    // Simple focus trap — keep tab inside the panel.
    const focusables = _refs.panel.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])");
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function escapeBadge(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// L-PLAN-5 UPDATE 3 — lesson-mode badge in the exercise top bar. Shown
// when a curriculum lesson is active. Includes an "x" button that asks for
// confirmation before clearing the lesson context.
function syncBadge(ctx, screenId) {
  // Remove any existing badge first.
  document.querySelectorAll(".lesson-mode-badge").forEach((el) => el.remove());
  if (!ctx || !EXERCISE_SCREENS.has(screenId)) return;
  const hostSelector = SCREEN_BADGE_HOSTS[screenId];
  if (!hostSelector) return;
  const screenEl = document.getElementById(screenId);
  const host = screenEl?.querySelector(hostSelector);
  if (!host) return;

  const badge = document.createElement("span");
  badge.className = "lesson-mode-badge";
  badge.setAttribute("role", "status");
  badge.setAttribute("aria-live", "polite");
  badge.innerHTML = `
    <span class="lesson-mode-badge__label">Oppitunti ${ctx.lessonIndex}: ${escapeBadge(ctx.lessonFocus || "harjoitus")}</span>
    <button type="button" class="lesson-mode-badge__exit" aria-label="Lopeta oppitunti" title="Lopeta oppitunti">×</button>
  `;
  // Insert as the first child so it doesn't push the close-× off the right.
  host.insertBefore(badge, host.firstChild);

  badge.querySelector(".lesson-mode-badge__exit").addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: "Lopetetaanko oppitunti?",
      body: `Sinulla on käynnissä oppitunti "${ctx.lessonFocus || "harjoitus"}". Edistyminen ei tallennu jos lopetat nyt.`,
      confirmLabel: "Lopeta",
      cancelLabel: "Jatka oppituntia",
    });
    if (ok) {
      clearLessonContext();
      try { sessionStorage.removeItem("currentLessonTeachingMd"); } catch { /* ignore */ }
      // Bounce back to the curriculum overview.
      const lc = await import("../screens/curriculum.js");
      lc.loadCurriculum();
    }
  });
}

function syncTrigger() {
  if (!_refs) return;
  const ctx = getLessonContext();
  const activeScreen = document.querySelector(".screen.active");
  const screenId = activeScreen?.id || "";
  const shouldShow = !!ctx && EXERCISE_SCREENS.has(screenId);
  _refs.btn.hidden = !shouldShow;
  if (!shouldShow && _isOpen) close();
  syncBadge(ctx, screenId);
}

export function initTeachingPanel() {
  if (_refs) return;
  _refs = buildDom();

  _refs.btn.addEventListener("click", open);
  _refs.close.addEventListener("click", close);
  _refs.backdrop.addEventListener("click", close);

  // Watch for screen changes — every show() in nav.js toggles .active on the
  // matching screen. A MutationObserver on the body covers all paths.
  const obs = new MutationObserver(() => syncTrigger());
  obs.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  // Also re-evaluate when sessionStorage changes (e.g. lesson context cleared
  // by another tab) — best-effort.
  window.addEventListener("storage", (e) => {
    if (e.key === "currentLesson" || e.key === null) syncTrigger();
  });

  syncTrigger();
}

export function refreshTeachingPanel() {
  syncTrigger();
}
