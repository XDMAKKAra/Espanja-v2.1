// ─── DOM helpers & screen navigation ────────────────────────────────────────

export const $ = (id) => document.getElementById(id);

// Auth-family screens render full-width — no sidebar, no rail
const AUTH_SCREENS = new Set([
  "screen-auth",
  "screen-reset-password",
]);

function applyShellMode(id) {
  // Rail is dashboard-only (Spec §3.2) — collapse grid on non-dashboard screens
  const shell = document.getElementById("app-shell");
  if (shell) {
    if (id === "screen-dashboard") shell.removeAttribute("data-rail");
    else shell.setAttribute("data-rail", "off");
  }
  // Auth-family screens hide sidebar, rail, countdown, mobile nav
  if (AUTH_SCREENS.has(id)) {
    document.body.classList.add("auth-mode");
  } else {
    document.body.classList.remove("auth-mode");
  }
}

export const show = (id) => {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  applyShellMode(id);
  // L-PLAN-4 UPDATE 2 — reset scroll on every screen change so the new screen's
  // H1 lands at the top instead of inheriting the previous screen's scroll
  // position (which made e.g. "Aloita →" jumps look like the heading vanished).
  // `scroll-padding-top` on <html> keeps any subsequent in-screen anchor jumps
  // below the fixed top-bar.
  if (typeof window !== "undefined") {
    try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch { /* noop */ }
  }
};

// Sync shell mode on initial load — the default-active screen is set by HTML,
// not by show(), so we need to read it once at startup.
function syncShellModeFromActiveScreen() {
  const active = document.querySelector(".screen.active");
  if (!active) return;
  applyShellMode(active.id);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", syncShellModeFromActiveScreen);
} else {
  syncShellModeFromActiveScreen();
}
