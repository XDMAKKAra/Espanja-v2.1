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
  sb.dataset.mode = mode;
  currentMode = mode;
  currentCtx = ctx;
  if (mode === "mode") renderModeNav(ctx);
  if (mode === "home") clearModeNav();
}

function clearModeNav() {
  const itemsEl = document.getElementById("sidebar-mode-items");
  const titleEl = document.getElementById("sidebar-mode-title");
  if (itemsEl) itemsEl.innerHTML = "";
  if (titleEl) titleEl.textContent = "—";
}

function renderModeNav({ modeKey, modeLabel, items = [] }) {
  const titleEl = document.getElementById("sidebar-mode-title");
  const itemsEl = document.getElementById("sidebar-mode-items");
  const label = modeLabel || MODE_LABELS[modeKey] || "";
  if (titleEl) titleEl.textContent = label;
  if (!itemsEl) return;
  itemsEl.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-item";
    if (item.active) btn.classList.add("active");
    btn.dataset.action = "open-lesson";
    if (item.key) btn.dataset.lessonKey = item.key;
    btn.textContent = item.label || item.key || "Lesson";
    if (typeof item.onClick === "function") {
      btn.addEventListener("click", item.onClick);
    }
    li.appendChild(btn);
    itemsEl.appendChild(li);
  }
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
