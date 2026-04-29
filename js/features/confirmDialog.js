/**
 * L-PLAN-5 UPDATE 3 — Puheo-styled confirm dialog.
 *
 * Replaces native window.confirm() with an accessible role="dialog" modal
 * that matches the app's dark Linear-tier register. Used for the
 * "lopeta oppitunti" prompt when the student tries to navigate away from
 * an active curriculum lesson.
 *
 * confirmDialog({ title, body, confirmLabel, cancelLabel })
 *   → Promise<boolean> — resolves true if confirmed, false if cancelled.
 *
 * A11y:
 *   - role="dialog" + aria-modal="true"
 *   - focus moves to the cancel button on open (safer default)
 *   - Escape resolves false, click on backdrop resolves false
 *   - focus returns to last-focused element on close
 */

let _root = null;
let _resolver = null;
let _lastFocus = null;

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function ensureRoot() {
  if (_root) return _root;
  _root = document.createElement("div");
  _root.id = "confirm-dialog-root";
  _root.className = "confirm-dialog-root";
  _root.hidden = true;
  document.body.appendChild(_root);
  return _root;
}

function close(result) {
  if (!_root) return;
  _root.classList.remove("is-open");
  document.removeEventListener("keydown", onKeydown);
  setTimeout(() => {
    if (_root && !_root.classList.contains("is-open")) {
      _root.hidden = true;
      _root.innerHTML = "";
    }
  }, 200);
  if (_lastFocus && typeof _lastFocus.focus === "function") {
    _lastFocus.focus();
  }
  _lastFocus = null;
  const r = _resolver;
  _resolver = null;
  if (r) r(result);
}

function onKeydown(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    close(false);
    return;
  }
  if (e.key === "Tab" && _root) {
    const focusables = _root.querySelectorAll("button");
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

export function confirmDialog({ title, body, confirmLabel = "Vahvista", cancelLabel = "Peruuta" } = {}) {
  return new Promise((resolve) => {
    ensureRoot();
    _resolver = resolve;
    _lastFocus = document.activeElement;
    _root.innerHTML = `
      <div class="confirm-dialog__backdrop" data-close="1" aria-hidden="true"></div>
      <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h2 class="confirm-dialog__title" id="confirm-dialog-title">${escapeHtml(title || "Vahvista")}</h2>
        ${body ? `<p class="confirm-dialog__body">${escapeHtml(body)}</p>` : ""}
        <div class="confirm-dialog__actions">
          <button type="button" class="confirm-dialog__btn confirm-dialog__btn--secondary" id="confirm-dialog-cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="confirm-dialog__btn confirm-dialog__btn--primary" id="confirm-dialog-confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    _root.hidden = false;
    // Force reflow so the transition plays.
    // eslint-disable-next-line no-unused-expressions
    _root.offsetHeight;
    _root.classList.add("is-open");

    _root.querySelector(".confirm-dialog__backdrop").addEventListener("click", () => close(false));
    _root.querySelector("#confirm-dialog-cancel").addEventListener("click", () => close(false));
    _root.querySelector("#confirm-dialog-confirm").addEventListener("click", () => close(true));

    document.addEventListener("keydown", onKeydown);
    // Focus on cancel by default — safer default action.
    _root.querySelector("#confirm-dialog-cancel").focus();
  });
}
