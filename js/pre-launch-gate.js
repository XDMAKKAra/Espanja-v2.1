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
  // Bypass the gate for search-engine crawlers + Lighthouse audits — otherwise
  // window.prompt() returns null in headless mode, the wrong-password branch
  // wipes documentElement, and Google/Lighthouse index a "Väärä salasana"
  // page (no <title>, no meta-description → SEO score tanks).
  var ua = (navigator && navigator.userAgent) || "";
  if (/bot|crawl|spider|lighthouse|googlebot|bingbot|yandex|duckduckbot|baiduspider|slurp|chrome-lighthouse|headlesschrome|pagespeed|prerender|adsbot|applebot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot/i.test(ua)) {
    return;
  }
  try {
    if (localStorage.getItem(KEY) === "1") return;
  } catch (e) { /* localStorage may be unavailable; fall through */ }
  // Some mobile browsers + automation harnesses (Playwright iOS UA) either block
  // prompt() outright or return null without showing UI. Wrap so we don't throw
  // an UNCAUGHT error in those contexts — the wipe below stops the page either way.
  var input = null;
  try {
    input = window.prompt("Salasana:");
  } catch (e) {
    input = null;
  }
  if (input === PASSWORD) {
    try { localStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }
    return;
  }
  // Wipe DOM so the page is unusable without throwing; the wipe alone is enough
  // to halt remaining inline/deferred scripts that haven't started yet.
  document.documentElement.innerHTML = "<body style=\"background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;\">V&auml;&auml;r&auml; salasana.</body>";
})();
