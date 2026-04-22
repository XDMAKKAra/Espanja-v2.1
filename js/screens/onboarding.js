import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch } from "../api.js";
import { track } from "../analytics.js";
import { showPlacementIntro } from "./placement.js";

// YO-koe 28.9.2026 klo 9:00 Helsinki (EEST = UTC+3)
const EXAM_MS = Date.parse("2026-09-28T09:00:00+03:00");
const DAY_MS = 24 * 60 * 60 * 1000;

let _deps = {};
export function initOnboarding({ loadDashboard }) {
  _deps = { loadDashboard };
  wireWelcome();
}

// ─── Entry point ───────────────────────────────────────────────────────────

export async function checkOnboarding() {
  try {
    const res = await apiFetch(`${API}/api/profile`, { headers: authHeader() });
    if (!res.ok) return false;
    const { profile } = await res.json();
    if (!profile || !profile.onboarding_completed) {
      showOnboarding();
      return true;
    }
    window._userProfile = profile;
    return false;
  } catch {
    return false;
  }
}

function showOnboarding() {
  showWelcome();
}

// ─── S1 Welcome ────────────────────────────────────────────────────────────

function daysToExam() {
  return Math.max(0, Math.ceil((EXAM_MS - Date.now()) / DAY_MS));
}

function showWelcome() {
  const daysEl = $("ob-welcome-days");
  if (daysEl) daysEl.textContent = daysToExam();
  show("screen-ob-welcome");
  track("onboarding_welcome_viewed", { days_to_exam: daysToExam() });
}

function wireWelcome() {
  const cta = $("ob-welcome-cta");
  const skip = $("ob-welcome-skip");
  if (cta && !cta.dataset.wired) {
    cta.dataset.wired = "1";
    cta.addEventListener("click", () => {
      track("onboarding_welcome_cta", {});
      showPlacementIntro();
    });
  }
  if (skip && !skip.dataset.wired) {
    skip.dataset.wired = "1";
    skip.addEventListener("click", async () => {
      skip.disabled = true;
      track("onboarding_skipped", { step: 1 });
      try {
        await apiFetch(`${API}/api/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ onboarding_completed: true }),
        });
      } catch { /* non-blocking */ }
      if (_deps.loadDashboard) _deps.loadDashboard();
    });
  }
}
