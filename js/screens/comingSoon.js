// L-LANG-INFRA-1 — Coming-soon screen for DE/FR users.
// Shown when state.language !== "es". Explains that content is being written
// and lets the user join a waitlist or switch back to Spanish.

import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch, getAuthEmail } from "../api.js";
import { state } from "../state.js";
import { track } from "../analytics.js";

const LANG_NAMES = { de: "Saksa", fr: "Ranska", es: "Espanja" };
const LANG_NAMES_GEN = { de: "Saksan", fr: "Ranskan" }; // genetive for "Saksan kurssi"

let _wired = false;

export function showComingSoon() {
  const screen = document.getElementById("screen-coming-soon");
  if (!screen) return;

  // Update dynamic copy based on current language.
  const lang = state.language || "de";
  const langName = LANG_NAMES[lang] || "Tämä kieli";
  const langNameGen = LANG_NAMES_GEN[lang] || langName;

  const titleEl = document.getElementById("cs-title");
  if (titleEl) titleEl.textContent = `${langName} on tulossa pian`;

  const bodyEl = document.getElementById("cs-body");
  if (bodyEl) {
    bodyEl.textContent =
      `Rakennamme parhaillaan ${langNameGen} kurssimateriaaleja. ` +
      `Jätä sähköpostisi niin ilmoitamme heti kun pääset harjoittelemaan.`;
  }

  // Pre-fill email if known.
  const emailInput = document.getElementById("cs-email");
  if (emailInput && !emailInput.value) {
    emailInput.value = getAuthEmail() || "";
  }

  // Reset form state.
  const formEl = document.getElementById("cs-form");
  const successEl = document.getElementById("cs-success");
  const errEl = document.getElementById("cs-error");
  if (formEl) formEl.classList.remove("hidden");
  if (successEl) successEl.classList.add("hidden");
  if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); }

  show("screen-coming-soon");
  track("coming_soon_shown", { lang });
  wireOnce();
}

function wireOnce() {
  if (_wired) return;
  _wired = true;

  // Waitlist form submit.
  const form = document.getElementById("cs-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("cs-email");
      const email = (emailInput?.value || "").trim();
      const errEl = document.getElementById("cs-error");
      const submitBtn = document.getElementById("cs-submit");

      if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (errEl) {
          errEl.textContent = "Tarkista sähköpostiosoite.";
          errEl.classList.remove("hidden");
        }
        emailInput?.focus();
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Lähetetään…"; }

      try {
        await apiFetch(`${API}/api/onboarding/waitlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, language: state.language || "de" }),
        });
      } catch { /* show success regardless — fire-and-forget */ }

      form.classList.add("hidden");
      const successEl = document.getElementById("cs-success");
      if (successEl) successEl.classList.remove("hidden");
      track("coming_soon_waitlist", { lang: state.language });
    });
  }

  // "Vaihda takaisin espanjaksi" link.
  const switchBtn = document.getElementById("cs-switch-es");
  if (switchBtn) {
    switchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Navigate to settings screen so user can change the language themselves.
      import("./settings.js")
        .then((m) => m.showSettings())
        .catch(() => show("screen-settings"));
    });
  }
}
