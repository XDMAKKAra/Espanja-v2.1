// L-V356 — per-language abikurssi landings hand the chosen language to the
// app. onboardingV4 reads the language from localStorage["puheo:lang"]
// (resolveLanguage() in js/screens/onboardingV4.js). On a signup CTA click we
// write that key so the onboarding/placement flow preselects es / de / fr.
//
// Set on CLICK only (not on page load): a logged-in visitor browsing a
// language page must not have their active language silently overwritten —
// only an explicit "Aloita" intent should change it.
//
// External file (no inline JS) so the strict CSP without 'unsafe-inline' holds.

(function () {
  var VALID = { es: true, de: true, fr: true };

  function resolvePageLang() {
    // ?lang= wins (lets ads/social links force a language), else <html data-page-lang>.
    try {
      var q = new URLSearchParams(window.location.search).get("lang");
      if (q && VALID[q]) return q;
    } catch (_) { /* URLSearchParams unsupported — fall through */ }
    var d = document.documentElement.getAttribute("data-page-lang");
    return d && VALID[d] ? d : null;
  }

  var lang = resolvePageLang();
  if (!lang) return;

  function persistLang() {
    try {
      localStorage.setItem("puheo:lang", lang);
    } catch (_) { /* storage blocked — onboarding falls back to its own default */ }
  }

  var ctas = document.querySelectorAll("[data-lang-cta]");
  for (var i = 0; i < ctas.length; i++) {
    // pointerdown fires before the anchor navigates, so the write always
    // completes; click is the keyboard/fallback path.
    ctas[i].addEventListener("pointerdown", persistLang);
    ctas[i].addEventListener("click", persistLang);
  }
})();
