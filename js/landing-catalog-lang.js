/* Puheo Ship 1.5 — Course catalog language switcher.
   Toggles the active language pill and swaps catalog-card titles via
   data-es / data-fr / data-de attributes. Idempotent and bailout-safe. */
(function () {
  if (typeof document === "undefined") return;

  function init() {
    var switchEl = document.querySelector(".catalog__lang-switch");
    var gridEl = document.getElementById("catalog-grid");
    if (!switchEl || !gridEl) return;

    var buttons = switchEl.querySelectorAll(".catalog__lang-btn");
    if (!buttons.length) return;

    function setLang(lang) {
      if (!lang) return;
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
      });
      gridEl.setAttribute("data-active-lang", lang);
      // Swap both titles and bodies — per-language grammar focus differs
      // even when the theme is shared.
      var i18nNodes = gridEl.querySelectorAll(".catalog-card__title, .catalog-card__body");
      i18nNodes.forEach(function (el) {
        var v = el.getAttribute("data-" + lang);
        if (v) {
          el.textContent = v;
          // Only title gets lang attribute (target-language phrase);
          // body is Finnish description regardless of selected lang.
          if (el.classList.contains("catalog-card__title")) {
            el.setAttribute("lang", lang);
          }
        }
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.dataset.lang);
      });
    });

    var initial = gridEl.getAttribute("data-active-lang") || "es";
    setLang(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
