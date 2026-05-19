/* Puheo landing — Näyte arvioinnista language switcher.
   Mirrors landing-catalog-lang.js: one tab per language, toggles the
   visible grader-card panel. Keyboard nav (Left/Right/Home/End) for
   the tablist follows ARIA Authoring Practices.
   Idempotent. Bails out if section markup is missing. */
(function () {
  if (typeof document === "undefined") return;

  function init() {
    var tablist = document.querySelector(".proof__lang-switch");
    var panels = document.querySelector(".proof__panels");
    if (!tablist || !panels) return;

    var tabs = Array.prototype.slice.call(
      tablist.querySelectorAll(".proof__lang-btn")
    );
    if (!tabs.length) return;

    function setLang(lang, focusActiveTab) {
      if (!lang) return;
      panels.setAttribute("data-active-lang", lang);
      tabs.forEach(function (tab) {
        var match = tab.dataset.lang === lang;
        tab.setAttribute("aria-selected", match ? "true" : "false");
        tab.setAttribute("tabindex", match ? "0" : "-1");
        if (match && focusActiveTab) tab.focus();
      });
      var panelEls = panels.querySelectorAll(".grader-card");
      panelEls.forEach(function (panel) {
        var match = panel.dataset.lang === lang;
        if (match) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "");
        }
      });
    }

    tabs.forEach(function (tab, idx) {
      tab.addEventListener("click", function () {
        setLang(tab.dataset.lang);
      });
      tab.addEventListener("keydown", function (e) {
        var nextIdx = null;
        if (e.key === "ArrowRight") nextIdx = (idx + 1) % tabs.length;
        else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") nextIdx = 0;
        else if (e.key === "End") nextIdx = tabs.length - 1;
        if (nextIdx !== null) {
          e.preventDefault();
          setLang(tabs[nextIdx].dataset.lang, true);
        }
      });
    });

    // Initial language from data-active-lang or first tab.
    var initial = panels.getAttribute("data-active-lang") ||
                  (tabs[0] && tabs[0].dataset.lang) ||
                  "es";
    setLang(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
