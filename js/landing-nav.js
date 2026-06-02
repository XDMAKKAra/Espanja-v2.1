// Landing nav scroll-state + logged-in chip swap + mobile menu — extracted
// from inline <script> in index.html so a strict CSP (script-src without
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

  // Logged-in state — token presence only, no API call. Same key the app
  // reads in js/api.js (localStorage.puheo_token). Swaps both the desktop
  // nav CTAs and the mobile menu CTAs to the "continue" chip.
  let loggedIn = false;
  try {
    loggedIn = !!localStorage.getItem("puheo_token");
  } catch (_) { /* localStorage blocked — fall back to logged-out CTAs */ }

  if (loggedIn) {
    const show = (id, on) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !on;
    };
    show("nav-login", false);
    show("nav-signup", false);
    show("nav-chip", true);
    show("nav-menu-login", false);
    show("nav-menu-signup", false);
    show("nav-menu-chip", true);
  }

  // ─── Mobile menu (L-V355) ───────────────────────────────────
  const hamburger = document.getElementById("nav-hamburger");
  const menu = document.getElementById("nav-menu");
  const menuClose = document.getElementById("nav-menu-close");

  if (hamburger && menu) {
    let closeTimer = null;

    const visibleFocusable = () =>
      Array.from(menu.querySelectorAll('a[href], button:not([disabled])'))
        .filter((el) => el.offsetParent !== null);

    const onKeydown = (e) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key === "Tab") {
        const items = visibleFocusable();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const openMenu = () => {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      menu.hidden = false;
      // Force a reflow then flip data-open so the transition runs.
      void menu.offsetWidth;
      menu.setAttribute("data-open", "true");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      (menuClose || visibleFocusable()[0] || menu).focus();
      document.addEventListener("keydown", onKeydown);
    };

    const closeMenu = () => {
      if (menu.hidden) return;
      menu.setAttribute("data-open", "false");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeydown);
      const finish = () => {
        menu.hidden = true;
        menu.removeEventListener("transitionend", finish);
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      };
      menu.addEventListener("transitionend", finish);
      // Fallback if transitionend never fires (reduced-motion / no transition).
      closeTimer = setTimeout(finish, 320);
      // Return focus to the trigger (the menu's only opener).
      hamburger.focus();
    };

    hamburger.addEventListener("click", openMenu);
    if (menuClose) menuClose.addEventListener("click", closeMenu);

    // Backdrop: a tap on the container itself (not the panel/links) closes.
    menu.addEventListener("click", (e) => {
      if (e.target === menu) closeMenu();
    });

    // Section links close the menu after navigating to the anchor.
    menu.querySelectorAll(".nav-menu__link").forEach((a) =>
      a.addEventListener("click", closeMenu)
    );

    // Closing on hashchange covers links + browser back/forward to anchors.
    window.addEventListener("hashchange", () => {
      if (menu.getAttribute("data-open") === "true") closeMenu();
    });
  }
})();
