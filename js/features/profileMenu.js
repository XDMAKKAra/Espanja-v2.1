// L-PLAN-4 UPDATE 4 — profile menu (replaces the old right rail).
//
// A 40-px gradient avatar floats top-right of the viewport. Click toggles a
// 260-px dropdown anchored under it. Items: Oma sivu / Asetukset / (Päivitä
// Pro for free users) / Kirjaudu ulos. Identity (name + email + avatar) lives
// in the dropdown header.
//
// A11y per LPLAN-4 spec UPDATE 4: aria-expanded on the trigger, role="menu" +
// role="menuitem" on the items, ArrowUp/ArrowDown navigation, Enter/Space
// activate, Escape closes, click-outside closes. Tab leaves the menu and
// continues the natural document order (no focus trap — closing on Tab-out
// is preferred to a trap on a small menu like this).

import { getAuthEmail, clearAuth } from "../api.js";

let _wired = false;
let _deps = {};

export function initProfileMenu(deps = {}) {
  if (_wired) {
    // Re-render header on subsequent calls (e.g. when login state changes).
    renderIdentity();
    return;
  }
  _wired = true;
  _deps = deps;

  const btn = document.getElementById("profile-menu-btn");
  const menu = document.getElementById("profile-menu");
  if (!btn || !menu) return; // Markup not on this page

  renderIdentity();

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen() ? close() : open();
  });

  btn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
      focusFirstItem();
    }
  });

  menu.addEventListener("keydown", onMenuKeydown);

  // Close on outside click. Capture phase so menu items can still handle the
  // click before the menu disappears.
  document.addEventListener("mousedown", (e) => {
    if (!isOpen()) return;
    const wrap = document.getElementById("profile-menu-wrap");
    if (wrap && !wrap.contains(e.target)) close();
  });

  // Close on Escape from anywhere.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      close();
      btn.focus();
    }
  });

  // Wire menu items. Each handler closes the menu before navigating so the
  // dropdown isn't left open over the next screen.
  document.getElementById("profile-menu-profile")?.addEventListener("click", () => {
    close();
    document.querySelector('.sidebar-item[data-nav="profile"], .sidebar-user[data-nav="profile"]')?.click();
  });
  document.getElementById("profile-menu-settings")?.addEventListener("click", () => {
    close();
    document.querySelector('.sidebar-item[data-nav="settings"]')?.click();
  });
  document.getElementById("profile-menu-upgrade")?.addEventListener("click", () => {
    close();
    if (typeof _deps.startCheckout === "function") _deps.startCheckout();
  });
  document.getElementById("profile-menu-logout")?.addEventListener("click", () => {
    close();
    clearAuth();
    if (typeof _deps.updateSidebarState === "function") _deps.updateSidebarState();
    document.getElementById("screen-auth")?.classList.add("active");
    document.querySelectorAll(".screen").forEach((s) => {
      if (s.id !== "screen-auth") s.classList.remove("active");
    });
  });
}

// Refresh identity / Pro flag visibility — call after login + dashboard load.
export function syncProfileMenu({ pro = false } = {}) {
  renderIdentity();
  const upgradeBtn = document.getElementById("profile-menu-upgrade");
  if (upgradeBtn) upgradeBtn.hidden = !!pro;
}

function renderIdentity() {
  const email = getAuthEmail() || "";
  const handle = email ? email.split("@")[0] : "Käyttäjä";
  const initials = computeInitials(handle, email);

  const av = document.getElementById("profile-menu-avatar");
  if (av) av.textContent = initials;
  const avLg = document.getElementById("profile-menu-avatar-lg");
  if (avLg) avLg.textContent = initials;
  const nm = document.getElementById("profile-menu-name");
  if (nm) nm.textContent = handle;
  const em = document.getElementById("profile-menu-email");
  if (em) em.textContent = email;
}

function computeInitials(name, email) {
  const seed = (name || email || "").trim();
  if (!seed) return "—";
  const parts = seed.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length === 1) {
    const p = parts[0];
    return (p.length >= 2 ? p.slice(0, 2) : p[0]).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function isOpen() {
  const menu = document.getElementById("profile-menu");
  return menu && !menu.hidden;
}

function open() {
  const btn = document.getElementById("profile-menu-btn");
  const menu = document.getElementById("profile-menu");
  if (!btn || !menu) return;
  menu.hidden = false;
  // Force a frame so the transition runs from the hidden state.
  requestAnimationFrame(() => menu.classList.add("is-open"));
  btn.setAttribute("aria-expanded", "true");
}

function close() {
  const btn = document.getElementById("profile-menu-btn");
  const menu = document.getElementById("profile-menu");
  if (!btn || !menu) return;
  menu.classList.remove("is-open");
  // Match the 120ms CSS transition before removing from layout so the fade-out
  // is visible. prefers-reduced-motion users still see an instant close because
  // the transition is `none` for them.
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce) menu.hidden = true;
  else setTimeout(() => { menu.hidden = true; }, 120);
  btn.setAttribute("aria-expanded", "false");
}

function getMenuItems() {
  const menu = document.getElementById("profile-menu");
  if (!menu) return [];
  return [...menu.querySelectorAll('.profile-menu__item:not([hidden])')];
}

function focusFirstItem() {
  const items = getMenuItems();
  if (items[0]) items[0].focus();
}

function onMenuKeydown(e) {
  const items = getMenuItems();
  if (items.length === 0) return;
  const i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    items[(i + 1) % items.length]?.focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    items[(i - 1 + items.length) % items.length]?.focus();
  } else if (e.key === "Home") {
    e.preventDefault();
    items[0]?.focus();
  } else if (e.key === "End") {
    e.preventDefault();
    items[items.length - 1]?.focus();
  }
  // Tab is intentionally NOT trapped — letting it leave naturally is more
  // accessible for a small menu. The menu auto-closes on outside click.
}
