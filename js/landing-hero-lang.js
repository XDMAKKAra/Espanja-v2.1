/* Puheo landing — hero screenshot language switcher (L-V376).
   The eyebrow ES/FR/DE tablist swaps the hero product shot between the three
   captured language versions, so a French or German visitor sees the product
   in their language with one click. Mirrors landing-proof-lang.js: ARIA
   tablist + Left/Right/Home/End keyboard nav. Idempotent; bails if markup
   is missing. */
(function () {
  if (typeof document === "undefined") return;

  var SHOTS = {
    es: {
      src: "/public/shots/app-writing-rubric-es.png",
      alt: "Puheon kirjoitustehtävä espanjaksi: tehtävänanto, vastauskenttä ja YTL:n arviointikriteerit sivupalkissa",
    },
    fr: {
      src: "/public/shots/app-writing-rubric-fr.png",
      alt: "Puheon kirjoitustehtävä ranskaksi: tehtävänanto, vastauskenttä ja YTL:n arviointikriteerit sivupalkissa",
    },
    de: {
      src: "/public/shots/app-writing-rubric-de.png",
      alt: "Puheon kirjoitustehtävä saksaksi: tehtävänanto, vastauskenttä ja YTL:n arviointikriteerit sivupalkissa",
    },
  };

  function init() {
    var tablist = document.getElementById("hero-lang-switch");
    var shot = document.getElementById("hero-shot");
    if (!tablist || !shot) return;

    var tabs = Array.prototype.slice.call(
      tablist.querySelectorAll(".hero__lang-link")
    );
    if (!tabs.length) return;

    function setLang(lang, focusActiveTab) {
      var conf = SHOTS[lang];
      if (!conf) return;
      // Only touch src if it actually changes, so we don't re-trigger loads.
      if (shot.getAttribute("src") !== conf.src) {
        shot.setAttribute("src", conf.src);
      }
      shot.setAttribute("alt", conf.alt);
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
    var initial = SHOTS[nav] ? nav : "es";
    setLang(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
