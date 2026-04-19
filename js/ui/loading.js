import { $, show } from "./nav.js";

export function showLoading(text, opts = {}) {
  show("screen-loading");
  $("loading-text").textContent = text;
  $("loading-spinner").style.display = "";
  const subEl = $("loading-subtext");
  const retryEl = $("loading-retry");
  subEl.classList.add("hidden");
  retryEl.classList.add("hidden");
  if (opts.subtext) {
    subEl.textContent = opts.subtext;
    subEl.classList.remove("hidden");
  }
}

export function showLoadingError(errorMsg, retryFn) {
  $("loading-spinner").style.display = "none";
  $("loading-text").textContent = "Jokin meni pieleen";
  const subEl = $("loading-subtext");
  subEl.textContent = errorMsg;
  subEl.classList.remove("hidden");
  const retryEl = $("loading-retry");
  if (retryFn) {
    retryEl.classList.remove("hidden");
    retryEl.onclick = retryFn;
  }
}

// ─── In-place skeleton + error retry (Commit 9) ───────────────────────────
// Unlike showLoading which swaps the whole screen, these helpers render into
// an existing container element so the surrounding chrome (progress bar,
// mode-page icon, back button) stays visible. The student keeps their
// orientation while the next exercise is fetched or while they retry.

const SKELETON_MARKUP = {
  "exercise": `
    <div class="skeleton-exercise" data-testid="skeleton-exercise">
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-options">
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
      </div>
      <div class="skeleton-hint">Ladataan tehtävää…</div>
    </div>`,
  "writing-task": `
    <div class="skeleton-exercise" data-testid="skeleton-exercise">
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-hint">Ladataan tehtävää…</div>
    </div>`,
};

/**
 * Paint a skeleton placeholder into `container` while a fetch is in-flight.
 * @param {HTMLElement|string} container - element or element id
 * @param {"exercise"|"writing-task"} kind
 */
export function showSkeleton(container, kind = "exercise") {
  const el = typeof container === "string" ? document.getElementById(container) : container;
  if (!el) return;
  el.innerHTML = SKELETON_MARKUP[kind] || SKELETON_MARKUP.exercise;
}

/**
 * Replace skeleton / previous content with an error block carrying a
 * "Yritä uudelleen" button that triggers `retryFn`.
 * @param {HTMLElement|string} container
 * @param {{title?: string, subtext?: string, retryFn: Function}} opts
 */
export function showFetchError(container, { title, subtext, retryFn } = {}) {
  const el = typeof container === "string" ? document.getElementById(container) : container;
  if (!el) return;
  el.innerHTML = `
    <div class="fetch-error" role="alert" data-testid="fetch-error">
      <div class="fetch-error-title">${title || "Jokin meni pieleen"}</div>
      ${subtext ? `<div class="fetch-error-sub">${subtext}</div>` : ""}
      <button type="button" class="btn-primary fetch-error-retry" data-testid="fetch-retry">Yritä uudelleen</button>
    </div>`;
  const btn = el.querySelector(".fetch-error-retry");
  if (btn && typeof retryFn === "function") btn.addEventListener("click", retryFn);
}
