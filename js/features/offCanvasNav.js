/* Off-canvas nav controller — L-HERO-COUNTDOWN-AND-OFFCANVAS-1
   Wires #menu-toggle + #app-sidebar-backdrop to body.sidebar-open.
   Adds focus-trap, ESC-to-close, and click-outside-to-close.
   Idempotent: re-running init() is a no-op.

   Active breakpoint: <1024px (matches CSS). On desktop the panel
   stays in-flow and the hamburger/backdrop are display:none, so
   handlers run but do nothing visible.
*/
(function () {
  if (typeof document === "undefined") return;
  if (window.__puheoOffCanvasInit) return;
  window.__puheoOffCanvasInit = true;

  var MOBILE = "(max-width: 1023px)";

  function isMobile() {
    return window.matchMedia && window.matchMedia(MOBILE).matches;
  }

  function setStaggerIndices() {
    var sidebar = document.getElementById("app-sidebar");
    if (!sidebar) return;
    var items = sidebar.querySelectorAll(
      ".sidebar-item, .sidebar-user, .sidebar-pro-slot"
    );
    items.forEach(function (el, i) {
      el.style.setProperty("--i", String(i));
    });
  }

  function getFocusable(root) {
    return Array.prototype.slice.call(
      root.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) {
      return !el.hasAttribute("hidden") && el.offsetParent !== null;
    });
  }

  function trapFocus(e, panel) {
    if (e.key !== "Tab") return;
    var focusable = getFocusable(panel);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function open(toggleBtn, sidebar) {
    if (!isMobile()) return;
    document.body.classList.add("sidebar-open");
    toggleBtn.setAttribute("aria-expanded", "true");
    sidebar.setAttribute("role", "dialog");
    sidebar.setAttribute("aria-modal", "true");
    // Focus first focusable in panel
    var f = getFocusable(sidebar);
    if (f.length) f[0].focus();
  }

  function close(toggleBtn, sidebar, restoreFocus) {
    if (!document.body.classList.contains("sidebar-open")) return;
    document.body.classList.remove("sidebar-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    sidebar.removeAttribute("role");
    sidebar.removeAttribute("aria-modal");
    if (restoreFocus && toggleBtn && toggleBtn.offsetParent !== null) {
      toggleBtn.focus();
    }
  }

  function init() {
    var sidebar = document.getElementById("app-sidebar");
    var toggleBtn = document.getElementById("menu-toggle");
    var backdrop = document.getElementById("app-sidebar-backdrop");
    if (!sidebar || !toggleBtn || !backdrop) return;

    setStaggerIndices();

    toggleBtn.addEventListener("click", function () {
      if (document.body.classList.contains("sidebar-open")) {
        close(toggleBtn, sidebar, true);
      } else {
        open(toggleBtn, sidebar);
      }
    });

    backdrop.addEventListener("click", function () {
      close(toggleBtn, sidebar, true);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("sidebar-open")) {
        close(toggleBtn, sidebar, true);
      } else if (
        e.key === "Tab" &&
        document.body.classList.contains("sidebar-open") &&
        isMobile()
      ) {
        trapFocus(e, sidebar);
      }
    });

    // Closing on nav-item click handled by capturing clicks anywhere
    // inside the sidebar that target a [data-nav] or #sidebar-logout.
    sidebar.addEventListener("click", function (e) {
      var t = e.target;
      while (t && t !== sidebar) {
        if (
          t.hasAttribute &&
          (t.hasAttribute("data-nav") || t.id === "sidebar-logout")
        ) {
          // Defer close so the existing nav handler runs first
          setTimeout(function () {
            close(toggleBtn, sidebar, false);
          }, 0);
          break;
        }
        t = t.parentNode;
      }
    });

    // Resize: if we cross into desktop, force-close to clean up state
    var mq = window.matchMedia(MOBILE);
    var onMQ = function (e) {
      if (!e.matches && document.body.classList.contains("sidebar-open")) {
        close(toggleBtn, sidebar, false);
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", onMQ);
    else if (mq.addListener) mq.addListener(onMQ);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
