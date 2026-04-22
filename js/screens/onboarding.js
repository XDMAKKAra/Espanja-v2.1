import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch } from "../api.js";
import { track } from "../analytics.js";
import { state } from "../state.js";
import { showPlacementIntro } from "./placement.js";
import { deriveWeakness, gapSentence } from "../../lib/weakness.js";

// YO-koe 28.9.2026 klo 9:00 Helsinki (EEST = UTC+3)
const EXAM_MS = Date.parse("2026-09-28T09:00:00+03:00");
const DAY_MS = 24 * 60 * 60 * 1000;

let _deps = {};
export function initOnboarding({ loadDashboard, loadNextBatch }) {
  _deps = { loadDashboard, loadNextBatch };
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
      await startFirstExercise();
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

// ─── S4 First Exercise ─────────────────────────────────────────────────────

async function startFirstExercise() {
  const path = window._obPath || { level: "B", weaknessCategory: null };
  state.mode = "vocab";
  state.level = path.level || "B";
  state.startLevel = state.level;
  state.peakLevel = state.level;
  state.batchNumber = 0;
  state.firstSession = true;
  state.sessionStartTime = Date.now();

  track("first_exercise_started", {
    mode: state.mode,
    level: state.level,
    category: path.weaknessCategory || null,
  });

  // Mark onboarding complete up-front so a network hiccup during loadNextBatch
  // doesn't kick them back through onboarding on refresh.
  await postProfile({ onboarding_completed: true });

  if (_deps.loadNextBatch) {
    await _deps.loadNextBatch();
  } else if (_deps.loadDashboard) {
    _deps.loadDashboard();
  }
}

// ─── First-session celebration overlay ─────────────────────────────────────

// Vocab/grammar result screens call this once on the first-ever completion.
// Returns a promise that resolves after the 3 s dwell so the caller can
// continue rendering the result screen underneath.
export function maybeShowFirstCelebration() {
  if (!state.firstSession) return Promise.resolve();
  state.firstSession = false;
  const signupMs = Number(localStorage.getItem("puheo_signup_at") || 0);
  track("first_exercise_completed", {
    mode: state.mode,
    level: state.level,
    time_since_signup_ms: signupMs ? Date.now() - signupMs : null,
  });

  const el = $("first-celebration");
  if (!el) return Promise.resolve();
  el.classList.remove("hidden");

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.classList.add("hidden");
      el.removeEventListener("click", finish);
      resolve();
    };
    el.addEventListener("click", finish, { once: true });
    setTimeout(finish, 3000);
  });
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
