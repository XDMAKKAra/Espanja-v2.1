/* Puheo landing — hero course-card language switcher (L-V385).
   The hero right column is a course/price card (Lara-style). The ES/FR/DE
   tablist swaps the card context (which language's path you're looking at)
   without changing the price, since the course is one product across all three
   languages. Replaces the old screenshot swapper. ARIA tablist + Left/Right/
   Home/End keyboard nav. Idempotent; bails if markup is missing. */
(function () {
  if (typeof document === "undefined") return;

  var CONTEXT = {
    es: {
      context: "Espanjan koko oppimispolku",
      arc: "Tervehdyksistä subjunktiiviin, A-tasolta YO-kokeeseen",
    },
    fr: {
      context: "Ranskan koko oppimispolku",
      arc: "Présentistä subjonctifiin, A-tasolta YO-kokeeseen",
    },
    de: {
      context: "Saksan koko oppimispolku",
      arc: "Präsensistä Konjunktiv II:een, A-tasolta YO-kokeeseen",
    },
  };

  function init() {
    var tablist = document.getElementById("hero-lang-switch");
    var card = document.getElementById("hero-offer");
    if (!tablist || !card) return;

    var contextEl = card.querySelector("[data-offer-context]");
    var arcEl = card.querySelector("[data-offer-arc]");

    var tabs = Array.prototype.slice.call(
      tablist.querySelectorAll(".offer-card__tab")
    );
    if (!tabs.length) return;

    function setLang(lang, focusActiveTab) {
      var conf = CONTEXT[lang];
      if (!conf) return;
      if (contextEl) contextEl.textContent = conf.context;
      if (arcEl) arcEl.textContent = conf.arc;
      card.setAttribute("data-lang", lang);
      tabs.forEach(function (tab) {
        var match = tab.dataset.lang === lang;
        tab.setAttribute("aria-selected", match ? "true" : "false");
        tab.setAttribute("tabindex", match ? "0" : "-1");
        if (match && focusActiveTab) tab.focus();
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

    // Default to the browser language when it's FR or DE, else Spanish.
    var nav = (navigator.language || "").slice(0, 2).toLowerCase();
    var initial = CONTEXT[nav] ? nav : "es";
    setLang(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
