// SidebarShell v277 — single controller for [data-mode] on .app-sidebar.
// Three states: "home" (default), "mode" (one of vocab/grammar/reading/
// writing/exam), "book" (digikirja screen). CSS in css/components/sidebar-shell.css
// handles the visual reveal — this file only mutates data-mode + fills
// the #sidebar-mode-items slot.

const MODE_LABELS = {
  vocab: "Sanasto",
  grammar: "Kielioppi",
  reading: "Luetun ymmärtäminen",
  writing: "Kirjoittaminen",
  exam: "Koeharjoitus",
};

let currentMode = "home";
let currentCtx = null;

function getSidebar() {
  return document.querySelector(".app-sidebar");
}

export function setSidebarMode(mode, ctx = {}) {
  const sb = getSidebar();
  if (!sb) return;
  // Strip any stray inline display set by old code paths (settings.js
  // sign-out kludge, manual show/hide). Layout is data-mode-driven now.
  if (sb.style.display) sb.style.display = "";

  // L-SIDEBAR-FLICKER-1: mutate the mode-slot BEFORE flipping data-mode.
  // Old order set data-mode="mode" first → CSS revealed an empty (or
  // stale) slot for one paint frame, then renderModeNav populated it.
  // On home transitions the previous mode-slot's last frame leaked
  // through. Mutate while the target slot is still hidden, then flip
  // — one repaint, no flicker.
  currentMode = mode;
  currentCtx = ctx;
  if (mode === "mode") { renderModeNav(ctx); wireModeItemDelegation(); }
  if (mode === "home") clearModeNav();
  sb.dataset.mode = mode;
}

function clearModeNav() {
  const itemsEl = document.getElementById("sidebar-mode-items");
  const titleEl = document.getElementById("sidebar-mode-title");
  if (itemsEl) itemsEl.replaceChildren();
  // L-SIDEBAR-FLICKER-1: drop the em-dash placeholder. It was a visible
  // AI-slop signal whenever a transition let the hidden mode-slot title
  // leak for a frame; an empty string costs nothing and removes the
  // artifact.
  if (titleEl) titleEl.textContent = "";
}

function renderModeNav({ modeKey, modeLabel, items = [] }) {
  const titleEl = document.getElementById("sidebar-mode-title");
  const itemsEl = document.getElementById("sidebar-mode-items");
  const label = modeLabel || MODE_LABELS[modeKey] || "";
  if (titleEl) titleEl.textContent = label;
  if (!itemsEl) return;

  // L-SIDEBAR-FLICKER-1: build off-DOM, swap atomically. The old code
  // did `innerHTML = ""` + a per-item appendChild loop — when the async
  // items-hydration call replayed renderModeNav, the list briefly
  // collapsed to height 0 between clear and append, which the eye
  // catches as flicker. DocumentFragment + replaceChildren mutates the
  // live DOM once.
  const frag = document.createDocumentFragment();
  for (const item of items) {
    if (item.type === "heading") {
      const li = document.createElement("li");
      li.className = "sidebar-section-heading";
      li.setAttribute("role", "presentation");
      li.textContent = item.label || "";
      frag.appendChild(li);
      continue;
    }
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-item sidebar-item--lesson";
    if (item.active) btn.classList.add("active");
    if (item.completed) btn.classList.add("is-done");
    if (item.locked) {
      btn.classList.add("is-locked");
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    }
    btn.dataset.action = "open-lesson";
    if (item.key) btn.dataset.lessonKey = item.key;
    if (item.kurssiKey) btn.dataset.kurssiKey = item.kurssiKey;
    if (item.lessonIndex != null) btn.dataset.lessonIndex = String(item.lessonIndex);
    btn.textContent = item.label || item.key || "Oppitunti";
    if (typeof item.onClick === "function") {
      btn.addEventListener("click", item.onClick);
    }
    li.appendChild(btn);
    frag.appendChild(li);
  }
  itemsEl.replaceChildren(frag);
}

// Event delegation: any open-lesson click in the MODE list dispatches a
// puheo:open-lesson event so main.js can route to the lesson runner without
// this component knowing about screen/route internals.
let _delegationWired = false;
function wireModeItemDelegation() {
  if (_delegationWired) return;
  const itemsEl = document.getElementById("sidebar-mode-items");
  if (!itemsEl) return;
  itemsEl.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="open-lesson"]');
    if (!btn || btn.disabled) return;
    const kurssiKey = btn.dataset.kurssiKey || "";
    const lessonIndex = Number(btn.dataset.lessonIndex);
    if (!kurssiKey || !Number.isFinite(lessonIndex)) return;
    document.dispatchEvent(new CustomEvent("puheo:open-lesson", {
      detail: { kurssiKey, lessonIndex, lessonKey: btn.dataset.lessonKey || "" },
    }));
  });
  _delegationWired = true;
}

export function getSidebarMode() {
  return currentMode;
}

export function getSidebarCtx() {
  return currentCtx;
}

// No extra event delegation needed — the in-MODE back-Aloitus button
// uses data-nav="home", which the existing main.js sidebar listener
// already routes through navigateTo("home"), which calls
// setSidebarMode("home") via the MODE_LABELS gate.
