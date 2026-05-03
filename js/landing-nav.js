// Landing nav scroll-state + logged-in chip swap — extracted from
// inline <script> in index.html so a strict CSP (script-src without
// 'unsafe-inline') can ship.

(function () {
  const nav = document.getElementById("nav");
  if (nav) {
    let last = false;
    const update = () => {
      const scrolled = window.scrollY > 8;
      if (scrolled !== last) {
        nav.setAttribute("data-scrolled", scrolled ? "true" : "false");
        last = scrolled;
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // Logged-in nav state — token presence only, no API call.
  // Same key the app reads in js/api.js (localStorage.puheo_token).
  try {
    const token = localStorage.getItem("puheo_token");
    const login = document.getElementById("nav-login");
    const signup = document.getElementById("nav-signup");
    const chip = document.getElementById("nav-chip");
    if (token && login && signup && chip) {
      login.hidden = true;
      signup.hidden = true;
      chip.hidden = false;
    }
  } catch (_) { /* localStorage blocked — fall back to logged-out CTAs */ }
})();
