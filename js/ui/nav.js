// ─── DOM helpers & screen navigation ────────────────────────────────────────

export const $ = (id) => document.getElementById(id);

// Auth-family screens render full-width, no sidebar, no rail
const AUTH_SCREENS = new Set([
  "screen-auth",
  "screen-reset-password",
]);

function applyShellMode(id) {
  // Rail is dashboard-only (Spec §3.2), collapse grid on non-dashboard screens
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

// L-MODAL-BLEED-1: any transient modal that lived on body (exam resume
// dialog, paywall, confirm-dialog) used to survive a screen change and
// reappear over the next screen — most visibly on Asetukset, which is
// where users instinctively go to "get out of" a stuck flow. Force-
// close every confirm-dialog-root + paywall-modal-root on navigation
// so the new screen always renders solo. The dismiss button keeps the
// existing Promise resolution path (resolves "dismiss"), so callers
// awaiting the modal don't leak.
function closeTransientModals(nextId) {
  document.querySelectorAll(".confirm-dialog-root.is-open").forEach((root) => {
    const dismissBtn = root.querySelector('[id$="-dismiss"]')
      || root.querySelector('[data-close="1"]');
    if (dismissBtn) {
      dismissBtn.click();
    } else {
      root.classList.remove("is-open");
      root.hidden = true;
    }
  });
  // Paywall modal lives at #paywall-modal-root with .is-open; same shape.
  const paywall = document.getElementById("paywall-modal-root");
  if (paywall && paywall.classList.contains("is-open") && nextId !== "screen-pricing") {
    paywall.classList.remove("is-open");
    paywall.hidden = true;
  }
}

export const show = (id) => {
  closeTransientModals(id);
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  applyShellMode(id);
  // L-PLAN-4 UPDATE 2, reset scroll on every screen change so the new screen's
  // H1 lands at the top instead of inheriting the previous screen's scroll
  // position (which made e.g. "Aloita →" jumps look like the heading vanished).
  // `scroll-padding-top` on <html> keeps any subsequent in-screen anchor jumps
  // below the fixed top-bar.
  if (typeof window !== "undefined") {
    try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch { /* noop */ }
  }
};

// Sync shell mode on initial load, the default-active screen is set by HTML,
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
