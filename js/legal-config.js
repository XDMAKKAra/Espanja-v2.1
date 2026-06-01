// Single source of truth for the legal/data-controller contact details.
//
// Why this file exists: the data-controller name + contact email appear in
// privacy.html, terms.html and refund.html. Before launch Marcel swaps the
// temporary Gmail for the puheo.fi domain mailbox and fills in the y-tunnus
// (business ID). This keeps that a one-line change here instead of a
// find-and-replace across three legal pages.
//
// How it works: each legal page tags its contact spots with data attributes
// (data-legal-controller, data-legal-email, data-legal-businessid). This
// classic (non-module) script runs on load and fills them from the values
// below. The HTML keeps the current value inline as a no-JS fallback; the
// canonical value is always the one here.

window.PUHEO_LEGAL = {
  // Rekisterinpitäjä. Vaihdetaan toiminimeksi + y-tunnukseksi ennen launchia.
  controller: "Puheo, yksityishenkilön ylläpitämä palvelu",
  // Yhteysosoite. Väliaikainen Gmail; vaihdetaan domain-postilaatikkoon
  // (esim. tuki@puheo.fi) kun domain on rekisteröity.
  email: "marcel.catchot@gmail.com",
  // Y-tunnus lisätään kun toiminimi on rekisteröity. null = ei näytetä.
  businessId: null,
};

(function () {
  function fill() {
    var c = window.PUHEO_LEGAL || {};
    document.querySelectorAll("[data-legal-email]").forEach(function (el) {
      if (c.email) {
        el.textContent = c.email;
        if (el.tagName === "A") el.setAttribute("href", "mailto:" + c.email);
      }
    });
    document.querySelectorAll("[data-legal-controller]").forEach(function (el) {
      if (c.controller) el.textContent = c.controller;
    });
    document.querySelectorAll("[data-legal-businessid]").forEach(function (el) {
      if (c.businessId) {
        el.textContent = "Y-tunnus: " + c.businessId;
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fill);
  } else {
    fill();
  }
})();
