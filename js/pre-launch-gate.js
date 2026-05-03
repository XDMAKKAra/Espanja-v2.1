// ─── Pre-launch password gate ──────────────────────────────────────────
// Simple client-side lock so casual visitors can't see the site while
// it's pre-launch. NOT real security — anyone who opens DevTools can
// read the password below. Real secrets (API keys) live on the server,
// never in this file. Remove this file (and the matching <script src>
// tags in index.html and app.html) once the site is launched.
//
// Extracted from inline <script> in L-SECURITY-3 so a strict CSP
// (script-src without 'unsafe-inline') can ship.

(function () {
  var KEY = "puheo_gate_ok_v1";
  var PASSWORD = "Espanjamarcel123";
  try {
    if (localStorage.getItem(KEY) === "1") return;
  } catch (e) { /* localStorage may be unavailable; fall through */ }
  var input = window.prompt("Salasana:");
  if (input === PASSWORD) {
    try { localStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }
    return;
  }
  document.documentElement.innerHTML = "<body style=\"background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;\">V&auml;&auml;r&auml; salasana.</body>";
  // Stop further script execution on this page.
  throw new Error("gate");
})();
