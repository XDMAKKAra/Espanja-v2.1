// Pre-paint shell-mode hint — toggle auth-mode on body BEFORE first
// paint so the layout doesn't shift from 3-col grid → 1-col when JS
// detects no auth token. Eliminates the dashboard CLS root cause.
// Also resolves the saved theme so the dark palette paints on first
// frame instead of flashing the light surface.
//
// Extracted from inline <script> in app.html for strict CSP.
// Must remain a synchronous classic script (no defer/async) so it
// runs before the browser's first paint.

(function () {
  try {
    var loggedIn = !!localStorage.getItem("puheo_token");
    if (!loggedIn) {
      document.body.classList.add("auth-mode");
    }
    var saved = localStorage.getItem("puheo_theme") || "auto";
    var effective = saved;
    if (saved === "auto") {
      var m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
      effective = (m && m.matches) ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", effective);

    // BUGFIX: pick the correct initial screen based on auth state so logged-in
    // users don't flash `screen-auth` (the previous default-active screen)
    // before main.js' async checkOnboarding() routes them to the dashboard.
    // `#screen-auth` no longer has `active` baked into HTML — we apply it here
    // synchronously once the DOM is ready, *before* main.js runs.
    var hash = (location.hash || "").replace(/^#\/?/, "");
    var HASH_TO_SCREEN = {
      "koti": "screen-path",
      "oppimispolku": "screen-path",
      "sanasto": "screen-mode-vocab",
      "puheoppi": "screen-mode-grammar",
      "luetun": "screen-mode-reading",
      "kirjoitus": "screen-mode-writing",
      "asetukset": "screen-settings",
      "oma-sivu": "screen-profile"
    };
    var initial;
    if (loggedIn) {
      initial = HASH_TO_SCREEN[hash] || "screen-path";
    } else {
      // Reset-password flow keeps its own screen; everyone else lands on auth.
      initial = (hash === "reset-password") ? "screen-reset-password" : "screen-auth";
    }
    function applyInitial() {
      var el = document.getElementById(initial);
      if (el && !document.querySelector(".screen.active")) {
        el.classList.add("active");
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyInitial);
    } else {
      applyInitial();
    }
  } catch (e) {}
})();
