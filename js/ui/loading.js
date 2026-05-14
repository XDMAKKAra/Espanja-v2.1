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

// Skeleton variants mirror the shape of the real component so the
// student's eye is already parked where the answer will appear.
// New variants (vocab/grammar/reading) preserve the same .skeleton-*
// classnames the legacy "exercise" variant uses — the shimmer CSS is
// already gated on prefers-reduced-motion in skeleton.css.
const SKELETON_MARKUP = {
  "exercise": `
    <div class="skeleton-exercise" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-options">
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
      </div>
      <div class="skeleton-hint">Etsitään sopivaa tehtävää sinulle…</div>
    </div>`,
  // Sanasto: lyhyt prompt + 4 isoa monivalintapainiketta.
  "vocab": `
    <div class="skeleton-exercise skeleton-exercise--vocab" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-eyebrow"></div>
      <div class="skeleton-bar skeleton-bar-prompt"></div>
      <div class="skeleton-options">
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
      </div>
      <div class="skeleton-hint">Etsitään sopivia sanoja sinulle…</div>
    </div>`,
  // Puheoppi: sääntölappu + lause + 4 vaihtoehtoa.
  "grammar": `
    <div class="skeleton-exercise skeleton-exercise--grammar" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-rulechip"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-options">
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
      </div>
      <div class="skeleton-hint">Mietitään seuraavaa rakennetta…</div>
    </div>`,
  // Luetun ymmärtäminen: otsikko + ~6 tekstiriviä + 3 kysymyslohkoa.
  "reading": `
    <div class="skeleton-exercise skeleton-exercise--reading" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-title"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-reading-q"></div>
      <div class="skeleton-reading-q"></div>
      <div class="skeleton-reading-q"></div>
      <div class="skeleton-hint">Luetaan teksti valmiiksi sinulle…</div>
    </div>`,
  "writing-task": `
    <div class="skeleton-exercise" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-hint">Generoidaan kirjoitustehtävää…</div>
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
