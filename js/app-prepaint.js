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
    if (!localStorage.getItem("puheo_token")) {
      document.body.classList.add("auth-mode");
    }
    var saved = localStorage.getItem("puheo_theme") || "auto";
    var effective = saved;
    if (saved === "auto") {
      var m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
      effective = (m && m.matches) ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", effective);
  } catch (e) {}
})();
