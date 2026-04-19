/**
 * Toast notifications — design-system/DESIGN.md §8.7
 *
 * Usage:
 *   import { toast } from "./ui/toast.js";
 *   toast.success("Tallennettu!");
 *   toast.error("Verkkovirhe — yritä uudelleen.");
 *   toast.warn("Melkein oikein.");
 *   toast.info("Uusi harjoitus saatavilla.");
 *
 * Defaults:
 *   success + info auto-dismiss after 4s.
 *   error + warn are sticky — user must click close.
 *   Both are overridable via `toast.show({ message, variant, duration })`.
 */

const REGION_ID = "puheo-toast-region";
let region = null;

function ensureRegion() {
  if (region && document.body.contains(region)) return region;
  region = document.getElementById(REGION_ID);
  if (region) return region;
  region = document.createElement("div");
  region.id = REGION_ID;
  region.className = "toast-region";
  // aria-live announces new toasts to assistive tech without stealing focus.
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "false");
  document.body.appendChild(region);
  return region;
}

const ICONS = {
  success: "✓",
  error:   "!",
  warn:    "▲",
  info:    "i",
};

function show({ message, variant = "info", duration = null, actionLabel = null, onAction = null } = {}) {
  if (typeof document === "undefined") return () => {};
  const parent = ensureRegion();

  const el = document.createElement("div");
  el.className = `toast toast--${variant}`;
  el.setAttribute("role", variant === "error" ? "alert" : "status");

  const icon = document.createElement("span");
  icon.className = "toast__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = ICONS[variant] || "";
  el.appendChild(icon);

  const body = document.createElement("div");
  body.className = "toast__body";
  body.textContent = message;
  el.appendChild(body);

  if (actionLabel && typeof onAction === "function") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--ghost btn--sm";
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => { onAction(); close(); });
    el.appendChild(btn);
  }

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "toast__close";
  closeBtn.setAttribute("aria-label", "Sulje ilmoitus");
  closeBtn.textContent = "×";
  el.appendChild(closeBtn);

  parent.appendChild(el);

  let timer = null;
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    if (timer) { clearTimeout(timer); timer = null; }
    el.setAttribute("data-state", "closing");
    const done = () => el.parentNode && el.parentNode.removeChild(el);
    if (matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done();
    } else {
      el.addEventListener("animationend", done, { once: true });
      // Safety net in case animationend never fires (e.g. display:none).
      setTimeout(done, 400);
    }
  }

  closeBtn.addEventListener("click", close);

  // Auto-dismiss for non-sticky variants unless caller overrides duration.
  const effective = duration ?? (variant === "error" || variant === "warn" ? null : 4000);
  if (effective != null) {
    timer = setTimeout(close, effective);
  }

  return close;
}

export const toast = {
  show,
  success: (message, opts = {}) => show({ message, variant: "success", ...opts }),
  error:   (message, opts = {}) => show({ message, variant: "error",   ...opts }),
  warn:    (message, opts = {}) => show({ message, variant: "warn",    ...opts }),
  info:    (message, opts = {}) => show({ message, variant: "info",    ...opts }),
};

export default toast;
