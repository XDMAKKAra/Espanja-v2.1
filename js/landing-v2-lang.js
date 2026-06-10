/* L-V412 — landing v2 language switcher (index + näyte).
 * CSP blocks inline <script>, so the demos' inline setLang lives here.
 * Generic: any page with .seg-btn[data-lang] gets:
 *   - aria-pressed toggled across the segment
 *   - [data-es][data-fr][data-de] elements text-swapped to the chosen lang
 *   - .paper[data-paper] artifacts shown/hidden by lang
 * The näyte page has no [data-es] swap targets; that path is simply a no-op. */
(function () {
  var buttons = document.querySelectorAll(".seg-btn[data-lang]");
  if (!buttons.length) return;
  var swaps = document.querySelectorAll("[data-es][data-fr][data-de]");
  var papers = document.querySelectorAll(".paper[data-paper]");

  function setLang(lang) {
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false");
    });
    swaps.forEach(function (el) {
      if (el.dataset[lang]) el.textContent = el.dataset[lang];
    });
    papers.forEach(function (p) {
      p.hidden = p.dataset.paper !== lang;
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); });
  });
})();
