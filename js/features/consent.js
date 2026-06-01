// Analytics consent gate (GDPR / ePrivacy).
//
// PostHog stores a non-essential identifier in the browser, so it may only run
// after the user opts in. This module owns that choice: it persists the
// decision, shows a one-time banner when no choice has been made yet, and lets
// the settings screen flip it later. Essential cookies and error monitoring
// are not covered here, they run under necessity / legitimate interest.

import { initAnalytics, disableAnalytics } from "../analytics.js";
import { getAuthEmail } from "../api.js";

const KEY = "puheo_analytics_consent_v1";

export function getConsent() {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try { localStorage.setItem(KEY, value); } catch { /* private mode */ }
}

// Turn analytics on for this session and remember the choice.
function grant() {
  setConsent("granted");
  initAnalytics(null, getAuthEmail());
}

// Turn analytics off, remember the choice, stop any running capture.
function deny() {
  setConsent("denied");
  disableAnalytics();
}

// Public API for the settings toggle. Returns the resulting state.
export function setAnalyticsEnabled(enabled) {
  if (enabled) grant();
  else deny();
  return getConsent();
}

// Called once on app start. If the user already chose, honour it. If not,
// show the banner; analytics stays off until they accept.
export function initConsentGate() {
  const choice = getConsent();
  if (choice === "granted") {
    initAnalytics(null, getAuthEmail());
    return;
  }
  if (choice === "denied") return;
  showBanner();
}

let _styleInjected = false;
function injectStyles() {
  if (_styleInjected) return;
  _styleInjected = true;
  const style = document.createElement("style");
  style.id = "consent-banner-styles";
  style.textContent = `
.consent-banner {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 60;
  max-width: 440px;
  margin-left: auto;
  display: grid;
  gap: 12px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid var(--border, rgba(60,46,33,0.14));
  background: var(--surface, #fbf6ec);
  color: var(--text, #2c2417);
  box-shadow: 0 18px 40px -18px rgba(40,28,16,0.45);
  transform: translateY(8px);
  opacity: 0;
  transition: transform 240ms cubic-bezier(0.23,1,0.32,1), opacity 240ms cubic-bezier(0.23,1,0.32,1);
}
.consent-banner[data-shown="true"] { transform: translateY(0); opacity: 1; }
.consent-banner__title { font-weight: 650; font-size: 15px; margin: 0; }
.consent-banner__body { font-size: 13.5px; line-height: 1.55; margin: 0; color: var(--text-muted, #6b5d49); }
.consent-banner__body a { color: var(--accent, #b3502e); text-decoration: underline; }
.consent-banner__actions { display: flex; gap: 10px; flex-wrap: wrap; }
.consent-banner__btn {
  flex: 1 1 auto;
  min-height: 42px;
  padding: 10px 16px;
  border-radius: 12px;
  font: inherit;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 140ms ease-out, background-color 140ms ease;
}
.consent-banner__btn:active { transform: scale(0.98); }
.consent-banner__btn--primary { background: var(--accent, #b3502e); color: #fff; }
.consent-banner__btn--quiet {
  background: transparent;
  color: var(--text, #2c2417);
  border-color: var(--border, rgba(60,46,33,0.2));
}
@media (prefers-reduced-motion: reduce) {
  .consent-banner { transition: opacity 160ms ease; transform: none; }
  .consent-banner[data-shown="true"] { transform: none; }
  .consent-banner__btn:active { transform: none; }
}
`;
  document.head.appendChild(style);
}

function showBanner() {
  if (document.getElementById("consent-banner")) return;
  injectStyles();

  const el = document.createElement("section");
  el.id = "consent-banner";
  el.className = "consent-banner";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-label", "Evästesuostumus");
  el.innerHTML = `
    <p class="consent-banner__title">Evästeet ja analytiikka</p>
    <p class="consent-banner__body">
      Välttämättömät evästeet pitävät kirjautumisen ja asetukset toiminnassa. Haluaisimme
      käyttää myös PostHog-analytiikkaa nähdäksemme, mikä sovelluksessa toimii ja mikä ei.
      Se on vapaaehtoista. <a href="/privacy.html" target="_blank" rel="noopener">Lue tietosuojaselosteesta</a>.
    </p>
    <div class="consent-banner__actions">
      <button type="button" class="consent-banner__btn consent-banner__btn--quiet" id="consent-decline">Vain välttämättömät</button>
      <button type="button" class="consent-banner__btn consent-banner__btn--primary" id="consent-accept">Hyväksy analytiikka</button>
    </div>
  `;
  document.body.appendChild(el);
  // Next frame so the enter transition runs.
  requestAnimationFrame(() => el.setAttribute("data-shown", "true"));

  const close = () => {
    el.setAttribute("data-shown", "false");
    setTimeout(() => el.remove(), 260);
  };
  el.querySelector("#consent-accept").addEventListener("click", () => { grant(); close(); });
  el.querySelector("#consent-decline").addEventListener("click", () => { deny(); close(); });
}
