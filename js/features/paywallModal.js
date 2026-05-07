// ─── Paywall modal ────────────────────────────────────────────────────────────
// Three variants:
//   quota   — free user hit AI quota  → Avaa Treeni
//   feature — feature locked to mestari → Avaa Mestari
//   upgrade — treeni user, mestari feature → Päivitä Mestariin
//
// Usage:
//   import { openPaywall } from "./paywallModal.js";
//   openPaywall({ variant: "quota", reason: "writing" });

let _openerEl = null;

const VARIANT_COPY = {
  quota: {
    badge: "Ilmainen",
    title: "Olet käyttänyt ilmaisen kvoottisi",
    body: "Jatka harjoittelua rajattomasti — Treeni avaa kaiken tämän viikon harjoitteet uudelleen.",
    cta: "Avaa Treeni",
    href: (r) => `/pricing.html?from=quota&tier=treeni${r ? `&reason=${encodeURIComponent(r)}` : ""}`,
  },
  feature: {
    badge: "Mestari",
    title: "Tämä on Mestari-tason ominaisuus",
    body: "Avaa koko 8-kurssin polku, adaptiivinen vaikeus ja yo-valmius-mittari Mestarilla.",
    cta: "Avaa Mestari",
    href: (r) => `/pricing.html?from=feature&tier=mestari${r ? `&reason=${encodeURIComponent(r)}` : ""}`,
  },
  upgrade: {
    badge: "Mestari",
    title: "Avaa kurssit ja yo-valmius-mittari",
    body: "Päivitä Mestariin ja saat käyttöön koko 8-kurssin polun sekä yo-valmius-mittarin.",
    cta: "Päivitä Mestariin",
    href: (r) => `/pricing.html?from=upgrade&tier=mestari${r ? `&reason=${encodeURIComponent(r)}` : ""}`,
  },
};

// Derive variant from a 403 payload if needed.
// current_tier + tier_required (or "treeni" fallback) → variant string.
export function deriveVariant(currentTier, tierRequired) {
  const req = tierRequired || "treeni";
  if (req === "mestari" && (currentTier === "treeni" || currentTier === "pro")) return "upgrade";
  if (req === "mestari") return "feature";
  return "quota"; // free → treeni
}

export function openPaywall({ variant, reason } = {}) {
  const v = VARIANT_COPY[variant] || VARIANT_COPY.quota;
  _openerEl = document.activeElement || null;

  const modal = document.getElementById("paywall-modal");
  if (!modal) {
    // Fallback: navigate directly if markup isn't loaded yet.
    window.location.href = v.href(reason);
    return;
  }

  // Populate
  const badgeEl   = modal.querySelector("[data-paywall-badge]");
  const titleEl   = modal.querySelector("[data-paywall-title]");
  const bodyEl    = modal.querySelector("[data-paywall-body]");
  const ctaEl     = modal.querySelector("[data-paywall-cta]");
  if (badgeEl) badgeEl.textContent  = v.badge;
  if (titleEl) titleEl.textContent  = v.title;
  if (bodyEl)  bodyEl.textContent   = v.body;
  if (ctaEl) {
    ctaEl.textContent = v.cta;
    ctaEl.href = v.href(reason);
  }

  // Badge color variant
  modal.dataset.variant = variant || "quota";

  // Show
  modal.removeAttribute("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Focus trap — move focus to the close button
  const closeBtn = modal.querySelector("[data-paywall-close]");
  if (closeBtn) closeBtn.focus();

  // Keyboard trap
  modal.addEventListener("keydown", _trapFocus);
}

export function closePaywall() {
  const modal = document.getElementById("paywall-modal");
  if (!modal) return;
  modal.setAttribute("hidden", "");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  modal.removeEventListener("keydown", _trapFocus);

  // Return focus to opener
  if (_openerEl && typeof _openerEl.focus === "function") {
    try { _openerEl.focus(); } catch { /* ignore */ }
  }
  _openerEl = null;
}

function _trapFocus(e) {
  const modal = document.getElementById("paywall-modal");
  if (!modal) return;
  const focusables = Array.from(
    modal.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hidden && el.offsetParent !== null);
  if (!focusables.length) return;

  if (e.key === "Escape") {
    closePaywall();
    return;
  }
  if (e.key !== "Tab") return;

  const first = focusables[0];
  const last  = focusables[focusables.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

// ─── Wire on DOMContentLoaded (idempotent) ────────────────────────────────────
export function initPaywallModal() {
  const modal = document.getElementById("paywall-modal");
  if (!modal || modal.dataset.paywallWired) return;
  modal.dataset.paywallWired = "1";

  const closeBtn = modal.querySelector("[data-paywall-close]");
  if (closeBtn) closeBtn.addEventListener("click", closePaywall);

  const backdrop = modal.querySelector("[data-paywall-backdrop]");
  if (backdrop) backdrop.addEventListener("click", closePaywall);
}
