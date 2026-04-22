import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch } from "../api.js";
import { track } from "../analytics.js";
import { showPlacementIntro } from "./placement.js";
import { deriveWeakness, gapSentence } from "../../lib/weakness.js";

// YO-koe 28.9.2026 klo 9:00 Helsinki (EEST = UTC+3)
const EXAM_MS = Date.parse("2026-09-28T09:00:00+03:00");
const DAY_MS = 24 * 60 * 60 * 1000;

let _deps = {};
export function initOnboarding({ loadDashboard }) {
  _deps = { loadDashboard };
  wireWelcome();
  wirePath();
  wireAppCountdown();
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
    renderAppCountdown(); // returning user — countdown visible
    return false;
  } catch {
    return false;
  }
}

function showOnboarding() {
  showWelcome();
}

// ─── Days-to-exam helper ───────────────────────────────────────────────────

function daysToExam() {
  return Math.max(0, Math.ceil((EXAM_MS - Date.now()) / DAY_MS));
}

// ─── S1 Welcome ────────────────────────────────────────────────────────────

function showWelcome() {
  const daysEl = $("ob-welcome-days");
  if (daysEl) daysEl.textContent = daysToExam();
  hideAppCountdown(); // S1–S2 hide the persistent countdown
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
      await postProfile({ onboarding_completed: true });
      renderAppCountdown();
      if (_deps.loadDashboard) _deps.loadDashboard();
    });
  }
}

// ─── S3 Path ───────────────────────────────────────────────────────────────

export function showPathFromPlacement(placementResult) {
  const { sentence, category } = deriveWeakness(placementResult);
  const level = placementResult?.placementLevel || "B";
  const weeksLeft = Math.max(1, Math.ceil(daysToExam() / 7));

  // Default plan: 15 min/day (user picks in S5). ~90s per exercise → rough
  // weekly exercise count.
  const minPerDay = 15;
  const perWeek = Math.round((minPerDay * 7 * 60) / 90);

  $("ob-path-level").textContent = level;
  $("ob-path-gap").textContent = gapSentence(level, "M"); // target grade defaults to M until user picks
  $("ob-path-weakness").textContent = sentence;
  $("ob-path-plan-min").textContent = minPerDay;
  $("ob-path-plan-weeks").textContent = weeksLeft;
  $("ob-path-plan-per-week").textContent = perWeek;

  renderAppCountdown(); // S3 turns on the persistent countdown
  show("screen-ob-path");
  track("onboarding_path_viewed", { level, weakness_category: category });

  // Remember result so S4 (next commit) can pick the right first exercise.
  window._obPath = { level, weaknessCategory: category };
}

function wirePath() {
  const cta = $("ob-path-cta");
  const skip = $("ob-path-skip");
  if (cta && !cta.dataset.wired) {
    cta.dataset.wired = "1";
    cta.addEventListener("click", async () => {
      track("onboarding_path_cta", {});
      // TODO(commit-5): route into S4 first-exercise adaptive session.
      // Temporary: mark onboarding complete + dashboard.
      await postProfile({ onboarding_completed: true });
      if (_deps.loadDashboard) _deps.loadDashboard();
    });
  }
  if (skip && !skip.dataset.wired) {
    skip.dataset.wired = "1";
    skip.addEventListener("click", async () => {
      skip.disabled = true;
      track("onboarding_skipped", { step: 3 });
      await postProfile({ onboarding_completed: true });
      if (_deps.loadDashboard) _deps.loadDashboard();
    });
  }
}

// ─── Persistent top-bar countdown ──────────────────────────────────────────

function isCountdownDismissed() {
  try { return localStorage.getItem("puheo_countdown_dismissed") === "1"; }
  catch { return false; }
}

export function renderAppCountdown() {
  const el = $("app-countdown");
  if (!el) return;
  if (isCountdownDismissed()) {
    el.classList.add("hidden");
    return;
  }
  const days = daysToExam();
  if (days <= 0) {
    el.classList.add("hidden");
    return;
  }
  $("app-countdown-days").textContent = days;
  el.classList.remove("hidden");
}

export function hideAppCountdown() {
  const el = $("app-countdown");
  if (el) el.classList.add("hidden");
}

function wireAppCountdown() {
  const close = $("app-countdown-close");
  if (!close || close.dataset.wired) return;
  close.dataset.wired = "1";
  close.addEventListener("click", (e) => {
    e.stopPropagation();
    try { localStorage.setItem("puheo_countdown_dismissed", "1"); } catch { /* silent */ }
    hideAppCountdown();
    track("app_countdown_dismissed", { days_to_exam: daysToExam() });
  });
  // Hourly refresh while mounted.
  setInterval(renderAppCountdown, 60 * 60 * 1000);
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function postProfile(body) {
  try {
    await apiFetch(`${API}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
  } catch { /* non-blocking */ }
}
