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
    // L-V346 — teemavalitsin poistettu; appi on aina vaalea (WordDive-paletti).
    // Siivoa vanha tallennettu valinta, ettei aiempi "dark" jää data-themeen.
    try { localStorage.removeItem("puheo_theme"); } catch (e2) {}
    document.documentElement.setAttribute("data-theme", "light");

    // BUGFIX: pick the correct initial screen based on auth state so logged-in
    // users don't flash `screen-auth` (the previous default-active screen)
    // before main.js' async checkOnboarding() routes them to the dashboard.
    // `#screen-auth` no longer has `active` baked into HTML — we apply it here
    // synchronously once the DOM is ready, *before* main.js runs.
    var hash = (location.hash || "").replace(/^#\/?/, "");
    // Only the static, content-ready screens are pre-painted. The dynamic
    // hashes (koti / oppimispolku / the legacy sanasto+puheoppi that main.js
    // redirects to oppimispolku) are left UNPAINTED — main.js paints them once
    // their data resolves. L-V400: these previously pointed at the hidden
    // #screen-path (display:none = blank), so "no pre-paint" is behaviour-
    // identical and avoids flashing an empty home shell before async routing
    // (e.g. onboarding) decides.
    var HASH_TO_SCREEN = {
      "luetun": "screen-mode-reading",
      "kirjoitus": "screen-mode-writing",
      "asetukset": "screen-settings",
      "oma-sivu": "screen-profile"
    };
    var initial;
    if (loggedIn) {
      initial = HASH_TO_SCREEN[hash] || null;
    } else {
      // Reset-password flow keeps its own screen; everyone else lands on auth.
      initial = (hash === "reset-password") ? "screen-reset-password" : "screen-auth";
    }
    function applyInitial() {
      if (!initial) return;
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
