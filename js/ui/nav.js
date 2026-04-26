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
