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
  wireGoal();
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
  track("onboarding_started", { days_to_exam: daysToExam() });
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

// ─── First-session celebration overlay → S5 ────────────────────────────────

// Vocab/grammar result screens call this once on the first-ever completion.
// Overlay dismisses after 3 s or tap, then routes into S5 goal screen.
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
  if (!el) { showGoal(); return Promise.resolve(); }
  el.classList.remove("hidden");

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.classList.add("hidden");
      el.removeEventListener("click", finish);
      showGoal();
      resolve();
    };
    el.addEventListener("click", finish, { once: true });
    setTimeout(finish, 3000);
  });
}

// ─── S5 Goal + push opt-in ─────────────────────────────────────────────────

const GOAL_MAP = {
  kevyt:         { session_length: 5,  weekly_minutes: 35 },
  normaali:      { session_length: 15, weekly_minutes: 105 },
  intensiivinen: { session_length: 30, weekly_minutes: 210 },
};
let selectedGoal = "normaali";

function showGoal() {
  renderAppCountdown();
  show("screen-ob-goal");
  track("onboarding_goal_viewed", {});

  // Hide push button if Notification API unavailable (Safari iOS pre-16.4).
  const pushBtn = $("ob-goal-push");
  const fallback = $("ob-goal-push-fallback");
  if (typeof Notification === "undefined") {
    pushBtn?.classList.add("hidden");
    fallback?.classList.remove("hidden");
  }
}

function wireGoal() {
  const cards = document.getElementById("ob-goal-cards");
  const done = $("ob-goal-done");
  const skip = $("ob-goal-skip");
  const pushBtn = $("ob-goal-push");

  if (cards && !cards.dataset.wired) {
    cards.dataset.wired = "1";
    cards.addEventListener("click", (e) => {
      const card = e.target.closest(".ob-goal-card");
      if (!card) return;
      selectedGoal = card.dataset.goal;
      cards.querySelectorAll(".ob-goal-card").forEach((c) => {
        const isSel = c === card;
        c.classList.toggle("selected", isSel);
        c.setAttribute("aria-checked", String(isSel));
        const name = c.querySelector(".ob-goal-name");
        if (name) name.textContent = name.textContent.replace(" ✓", "") + (isSel ? " ✓" : "");
      });
    });
  }

  if (pushBtn && !pushBtn.dataset.wired) {
    pushBtn.dataset.wired = "1";
    pushBtn.addEventListener("click", async () => {
      if (typeof Notification === "undefined") return;
      track("push_permission_requested", {});
      try {
        const perm = await Notification.requestPermission();
        track("push_permission_" + perm, {});
        if (perm === "granted") {
          track("push_opt_in", {});
          await postProfile({ notification_preference: "push" });
          pushBtn.disabled = true;
          pushBtn.textContent = "Muistutukset päällä ✓";
        }
      } catch { /* silent */ }
    });
  }

  if (done && !done.dataset.wired) {
    done.dataset.wired = "1";
    done.addEventListener("click", async () => {
      done.disabled = true;
      const g = GOAL_MAP[selectedGoal] || GOAL_MAP.normaali;
      track("daily_goal_set", { goal: selectedGoal, session_length: g.session_length });
      await postProfile({
        preferred_session_length: g.session_length,
        weekly_goal_minutes: g.weekly_minutes,
        onboarding_completed: true,
      });
      track("onboarding_completed", {
        goal: selectedGoal,
        level: state.level,
        time_total_ms: (() => {
          const s = Number(localStorage.getItem("puheo_signup_at") || 0);
          return s ? Date.now() - s : null;
        })(),
      });
      if (_deps.loadDashboard) _deps.loadDashboard();
    });
  }

  if (skip && !skip.dataset.wired) {
    skip.dataset.wired = "1";
    skip.addEventListener("click", async () => {
      skip.disabled = true;
      track("onboarding_skipped", { step: 5 });
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
