/* Puheo — Landing YO-countdown
   Reads the nearest future YO-koe date and updates the d/h/m/s readout
   once per second. Idempotent: safe to load on any landing page; bails
   silently if .yo-countdown is not present.

   YTL aikataulu lähde:
   - Syksy 2026 lyhyt vieras kieli (espanja/saksa/ranska B): 2026-09-28 (vahvistettu)
   - Kevät 2027 / Syksy 2027 / Kevät 2028: arviot YTL:n julkaisemasta
     vuosittaisesta perjantai-päiväkuviosta (lyhyt kieli osuu yleensä
     vk 12 maaliskuussa ja vk 39 syyskuussa). TODO: tarkista YTL.fi
     kun viralliset päivät julkaistaan. */
(function () {
  if (typeof document === "undefined") return;

  var YO_DATES = [
    { season: "syksy 2026", date: "2026-09-28T09:00:00+03:00" },
    // TODO: vahvista YTL:n virallisesta aikataulusta
    { season: "kevät 2027", date: "2027-03-22T09:00:00+02:00" },
    { season: "syksy 2027", date: "2027-09-27T09:00:00+03:00" },
    { season: "kevät 2028", date: "2028-03-20T09:00:00+02:00" }
  ];

  function getNearestYoDate(now) {
    var nowMs = now.getTime();
    for (var i = 0; i < YO_DATES.length; i++) {
      var t = new Date(YO_DATES[i].date).getTime();
      if (t > nowMs) return { ms: t, season: YO_DATES[i].season };
    }
    return null;
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function init() {
    var root = document.querySelector(".yo-countdown");
    if (!root || root.dataset.cdInit === "1") return;
    root.dataset.cdInit = "1";

    var elDays = root.querySelector('[data-unit="days"]');
    var elHours = root.querySelector('[data-unit="hours"]');
    var elMins = root.querySelector('[data-unit="minutes"]');
    var elSecs = root.querySelector('[data-unit="seconds"]');
    var elGrid = root.querySelector(".yo-countdown__grid");
    var elSub  = root.querySelector(".yo-countdown__sub");

    if (!elDays || !elHours || !elMins || !elSecs) return;

    function tick() {
      var now = new Date();
      var target = getNearestYoDate(now);
      if (!target) {
        if (elGrid) elGrid.setAttribute("hidden", "");
        if (elSub)  elSub.textContent = "YO-koe on käynnissä — tsemppiä!";
        return false;
      }
      var diff = target.ms - now.getTime();
      if (diff <= 0) {
        elDays.textContent = "0";
        elHours.textContent = "00";
        elMins.textContent = "00";
        elSecs.textContent = "00";
        if (elSub) elSub.textContent = "YO-koe on käynnissä — tsemppiä!";
        return false;
      }
      var totalSec = Math.floor(diff / 1000);
      var days  = Math.floor(totalSec / 86400);
      var hours = Math.floor((totalSec % 86400) / 3600);
      var mins  = Math.floor((totalSec % 3600) / 60);
      var secs  = totalSec % 60;

      elDays.textContent  = String(days);
      elHours.textContent = pad2(hours);
      elMins.textContent  = pad2(mins);
      elSecs.textContent  = pad2(secs);
      return true;
    }

    if (!tick()) return;
    setInterval(tick, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
