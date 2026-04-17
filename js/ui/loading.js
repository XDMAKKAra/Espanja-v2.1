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
