/* Oppaat-hubin suodatin: kieli- ja aihechipit. Ei riippuvuuksia. */
(function () {
  "use strict";
  var list = document.getElementById("hub-list");
  var empty = document.getElementById("hub-empty");
  if (!list) return;
  var chips = Array.prototype.slice.call(document.querySelectorAll(".hub-filter__chip"));
  var items = Array.prototype.slice.call(list.querySelectorAll(".hub-item"));

  function apply(filter) {
    var visible = 0;
    items.forEach(function (li) {
      var show = true;
      if (filter !== "all") {
        var parts = filter.split(":");
        if (parts[0] === "lang") show = li.getAttribute("data-lang") === parts[1];
        else if (parts[0] === "cat") show = li.getAttribute("data-cat") === parts[1];
      }
      // featured-asettelu vain "kaikki"-näkymässä; suodatettuna tasalista
      if (filter !== "all") li.classList.remove("is-featured");
      else if (li === items[0]) li.classList.add("is-featured");
      li.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.style.display = visible === 0 ? "block" : "none";
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      chip.setAttribute("aria-pressed", "true");
      apply(chip.getAttribute("data-filter"));
    });
  });
})();
