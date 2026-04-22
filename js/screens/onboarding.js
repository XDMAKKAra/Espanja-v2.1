import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch } from "../api.js";
import { track } from "../analytics.js";
import { computeStartingLevel } from "../features/startingLevel.js";
import { toast } from "../ui/toast.js";
import { showPlacementIntro } from "./placement.js";

// YO-koe 28.9.2026 klo 9:00 Helsinki (EEST = UTC+3)
const EXAM_MS = Date.parse("2026-09-28T09:00:00+03:00");
const DAY_MS = 24 * 60 * 60 * 1000;

let _deps = {};
export function initOnboarding({ loadDashboard }) {
  _deps = { loadDashboard };
  wireWelcome();
}

// ─── State ─────────────────────────────────────────────────────────────────

let currentStep = 1;
const TOTAL_STEPS = 9;
// Steps deferred post-signup to reduce activation friction.
// 2 = courses completed (redundant w/ placement test)
// 5 = study background  (redundant w/ placement test)
// 9 = referral source   (moved to the done screen — pure analytics)
const SKIPPED_STEPS = new Set([2, 5, 9]);
const VISIBLE_STEPS = [1, 3, 4, 6, 7, 8];

const answers = {
  exam_date: null,
  spanish_courses_completed: null,
  spanish_grade_average: null,
  target_grade: null,
  study_background: null,
  weak_areas: [],
  strong_areas: null, // null = skipped, [] = saved empty, array = chosen
  daily_goal: null,
  referral: null,
};

const ENCOURAGEMENTS = [
  "Hyvä alku! 💪",
  "Kiva, jatketaan!",
  "Loistavaa — jatka samaan malliin!",
  "Melkein valmis! 🚀",
  "Täydellistä!",
  "Hienoa — lähes perillä!",
  "Mitä osaatkin? 💫",
  "Maalissa kohta! 🎯",
  "Viimeinen kysymys! 🏁",
];

function parseNumberOrNull(v) {
  if (v === "unknown" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ─── Initialization ────────────────────────────────────────────────────────

export async function checkOnboarding() {
  try {
    const res = await apiFetch(`${API}/api/profile`, { headers: authHeader() });
    if (!res.ok) return false; // skip if error
    const { profile } = await res.json();
    if (!profile || !profile.onboarding_completed) {
      showOnboarding();
      return true; // needs onboarding
    }
    window._userProfile = profile;
    return false; // onboarding done
  } catch {
    return false;
  }
}

function showOnboarding() {
  currentStep = 1;
  answers.weak_areas = [];
  updateProgress();
  showStep(1);
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

// ─── Step navigation ───────────────────────────────────────────────────────

function showStep(step) {
  document.querySelectorAll(".onboarding-step").forEach(el => {
    el.classList.toggle("hidden", el.dataset.step !== String(step));
  });

  if (step === "done") {
    renderSummary();
    launchConfetti();
    return;
  }

  // Show encouragement from previous step
  const encEl = $("onboarding-encouragement");
  if (step > 1) {
    encEl.textContent = ENCOURAGEMENTS[step - 2] || "";
    encEl.classList.remove("hidden");
    setTimeout(() => encEl.classList.add("hidden"), 2000);
  } else {
    encEl.classList.add("hidden");
  }
}

function updateProgress() {
  const label = $("onboarding-step-label");
  const fill = $("onboarding-progress-fill");
  if (currentStep === "done") {
    if (fill) fill.style.width = "100%";
    if (label) label.textContent = "Valmis!";
    return;
  }
  const idx = VISIBLE_STEPS.indexOf(currentStep);
  const shown = idx === -1 ? 1 : idx + 1;
  const pct = ((shown - 1) / VISIBLE_STEPS.length) * 100;
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = `${shown} / ${VISIBLE_STEPS.length}`;
}

function nextStep() {
  let s = currentStep === "done" ? TOTAL_STEPS : currentStep;
  do { s++; } while (s <= TOTAL_STEPS && SKIPPED_STEPS.has(s));
  if (s > TOTAL_STEPS) {
    currentStep = "done";
    updateProgress();
    showStep("done");
  } else {
    currentStep = s;
    updateProgress();
    showStep(currentStep);
  }
}

// ─── Option click handlers ─────────────────────────────────────────────────

// Steps 1-4, 6-7: single select — click advances automatically
function handleSingleSelect(containerId, answerKey, transform) {
  const container = $(containerId);
  if (!container) return;
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".ob-option");
    if (!btn) return;

    // Visual feedback
    container.querySelectorAll(".ob-option").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    // Store answer
    const val = btn.dataset.value;
    answers[answerKey] = transform ? transform(val) : val;

    // Track to PostHog
    track("onboarding_answer", { step: answerKey, value: val });

    // Auto-advance after short delay
    setTimeout(() => nextStep(), 300);
  });
}

// Step 5: multi-select (checkboxes)
function handleMultiSelect() {
  const container = $("ob-weak-areas");
  const nextBtn = $("ob-weak-next");
  if (!container || !nextBtn) return;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".ob-checkbox");
    if (!btn) return;

    const val = btn.dataset.value;

    // "En tiedä" is exclusive
    if (val === "unknown") {
      container.querySelectorAll(".ob-checkbox").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      answers.weak_areas = ["unknown"];
      nextBtn.classList.remove("hidden");
      return;
    }

    // Deselect "unknown" if selecting something else
    container.querySelector('[data-value="unknown"]')?.classList.remove("selected");
    answers.weak_areas = answers.weak_areas.filter(a => a !== "unknown");

    if (btn.classList.contains("selected")) {
      btn.classList.remove("selected");
      answers.weak_areas = answers.weak_areas.filter(a => a !== val);
    } else {
      if (answers.weak_areas.length >= 3) return; // max 3
      btn.classList.add("selected");
      answers.weak_areas.push(val);
    }

    nextBtn.classList.toggle("hidden", answers.weak_areas.length === 0);
  });

  nextBtn.addEventListener("click", () => {
    track("onboarding_answer", { step: "weak_areas", value: answers.weak_areas });
    nextStep();
  });
}

// Step 7: strengths — checkbox with skip + save buttons, overlap validation
function handleStrongAreas() {
  const container = $("ob-strong-areas");
  const skipBtn = $("ob-strong-skip");
  const saveBtn = $("ob-strong-save");
  const errEl = $("ob-strong-error");
  if (!container || !skipBtn || !saveBtn || !errEl) return;

  let selected = [];
  let errTimeout = null;

  function flashError(msg) {
    clearTimeout(errTimeout);
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
    errTimeout = setTimeout(() => errEl.classList.add("hidden"), 3500);
  }

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".ob-checkbox");
    if (!btn) return;
    const val = btn.dataset.value;

    // Overlap guard — same area can't be both weakness and strength
    if (!btn.classList.contains("selected") && answers.weak_areas.includes(val)) {
      btn.classList.remove("selected");
      selected = selected.filter(a => a !== val);
      saveBtn.classList.toggle("hidden", selected.length === 0);
      flashError("Sama alue voi olla vain heikkous tai vahvuus.");
      return;
    }

    if (btn.classList.contains("selected")) {
      btn.classList.remove("selected");
      selected = selected.filter(a => a !== val);
    } else {
      if (selected.length >= 3) {
        flashError("Valitse enintään 3 vahvuutta.");
        return;
      }
      btn.classList.add("selected");
      selected.push(val);
    }
    saveBtn.classList.toggle("hidden", selected.length === 0);
  });

  skipBtn.addEventListener("click", () => {
    answers.strong_areas = null;
    track("onboarding_answer", { step: "strong_areas", value: "skip" });
    nextStep();
  });

  saveBtn.addEventListener("click", () => {
    answers.strong_areas = selected.slice();
    track("onboarding_answer", { step: "strong_areas", value: answers.strong_areas });
    nextStep();
  });
}

// Wire up all handlers
handleSingleSelect("ob-exam-date", "exam_date");
handleSingleSelect("ob-courses-completed", "spanish_courses_completed", parseNumberOrNull);
handleSingleSelect("ob-grade-average", "spanish_grade_average", parseNumberOrNull);
handleSingleSelect("ob-target-grade", "target_grade");
handleSingleSelect("ob-study-background", "study_background");
handleSingleSelect("ob-daily-goal", "daily_goal");
handleSingleSelect("ob-referral", "referral");
handleMultiSelect();
handleStrongAreas();

// Inline referral picker on the done screen (replaces deleted Step 9)
(function handleInlineReferral() {
  const container = $("ob-referral-inline");
  if (!container) return;
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".ob-referral-chip");
    if (!btn) return;
    container.querySelectorAll(".ob-referral-chip").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    answers.referral = btn.dataset.value;
    track("onboarding_answer", { step: "referral", value: answers.referral });
  });
})();

// ─── Confetti ──────────────────────────────────────────────────────────────

function launchConfetti() {
  const container = document.querySelector(".onboarding-inner");
  if (!container) return;
  const colors = ["#e63946", "#f59e0b", "#22c55e", "#6d5ef4", "#ec4899"];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    container.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

// ─── Summary ───────────────────────────────────────────────────────────────

function renderSummary() {
  const summaryEl = $("onboarding-summary");
  if (!summaryEl) return;

  const insights = buildInsights();
  summaryEl.innerHTML = insights.map(i =>
    `<div class="onboarding-insight">
      <span class="onboarding-insight-icon">${i.icon}</span>
      <span class="onboarding-insight-text">${i.text}</span>
    </div>`
  ).join("");
}

function buildInsights() {
  const insights = [];
  const target = answers.target_grade;
  const startingLevel = computeStartingLevel(
    answers.spanish_courses_completed,
    answers.spanish_grade_average,
    answers.study_background,
  );

  // Starting level insight
  if (startingLevel) {
    insights.push({
      icon: "📊",
      text: `Aloitat ${startingLevel}-tasolta harjoituksissa (kurssit + keskiarvo).`,
    });
  } else {
    insights.push({
      icon: "📊",
      text: "Aloitat B-tasolta — taso mukautuu nopeasti suoritukseesi.",
    });
  }

  // Daily goal + target grade + exam date
  const daily = Number(answers.daily_goal) || 20;
  if (target) {
    const examStr = formatExamDate(answers.exam_date);
    if (examStr) {
      insights.push({
        icon: "🎯",
        text: `Tavoitearvosana ${target} · ${daily} min/pv · koe ${examStr}.`,
      });
    } else {
      insights.push({
        icon: "🎯",
        text: `Tavoitearvosana ${target} · ${daily} min päivässä.`,
      });
    }
  }

  // Weak areas
  if (answers.weak_areas.length > 0 && !answers.weak_areas.includes("unknown")) {
    const AREA_NAMES = {
      vocabulary: "sanasto", grammar: "kielioppi", ser_estar: "ser/estar",
      subjunctive: "subjunktiivi", preterite_imperfect: "pret./imperf.",
      writing: "kirjoittaminen", reading: "lukeminen", verbs: "verbit",
    };
    const areas = answers.weak_areas.map(a => AREA_NAMES[a] || a).join(", ");
    insights.push({
      icon: "💡",
      text: `Painotamme harjoittelua: ${areas}.`,
    });
  } else {
    insights.push({
      icon: "💡",
      text: "Ensimmäinen harjoitus auttaa löytämään kehityskohteesi.",
    });
  }

  // Strengths
  if (Array.isArray(answers.strong_areas) && answers.strong_areas.length > 0) {
    const AREA_NAMES = {
      vocabulary: "sanasto", grammar: "kielioppi", ser_estar: "ser/estar",
      subjunctive: "subjunktiivi", preterite_imperfect: "pret./imperf.",
      writing: "kirjoittaminen", reading: "lukeminen",
    };
    const areas = answers.strong_areas.map(a => AREA_NAMES[a] || a).join(", ");
    insights.push({
      icon: "⭐",
      text: `Vähemmän toistoa: ${areas}.`,
    });
  }

  return insights;
}

function formatExamDate(val) {
  if (!val || val === "unknown") return null;
  const [y, m] = val.split("-");
  const month = m === "03" ? "kevät" : "syksy";
  return `${month} ${y}`;
}

// ─── Save & finish ─────────────────────────────────────────────────────────

$("onboarding-start-btn").addEventListener("click", () => saveAndFinish());
$("onboarding-skip").addEventListener("click", () => skipOnboarding());

async function saveAndFinish() {
  const btn = $("onboarding-start-btn");
  btn.disabled = true;
  btn.textContent = "Tallennetaan...";

  try {
    const daily = Number(answers.daily_goal) || 20;

    // Parse exam_date to actual date
    let examDate = null;
    if (answers.exam_date && answers.exam_date !== "unknown") {
      const [y, m] = answers.exam_date.split("-");
      examDate = `${y}-${m}-15`; // mid-month
    }

    // Check if there's a pre-registration diagnostic result
    let diagnosticGrade = null;
    try {
      const diag = localStorage.getItem("puheo_diagnostic");
      if (diag) {
        const parsed = JSON.parse(diag);
        diagnosticGrade = parsed.placementLevel || null;
      }
    } catch { /* ignore */ }

    const derivedStartingLevel = computeStartingLevel(
      answers.spanish_courses_completed,
      answers.spanish_grade_average,
      answers.study_background,
    );

    const body = {
      current_grade: diagnosticGrade || derivedStartingLevel || "en tiedä",
      spanish_courses_completed: answers.spanish_courses_completed,
      spanish_grade_average: answers.spanish_grade_average,
      study_background: answers.study_background || null,
      target_grade: answers.target_grade || "M",
      exam_date: examDate,
      weak_areas: answers.weak_areas.length > 0 ? answers.weak_areas : [],
      strong_areas: answers.strong_areas,
      weekly_goal_minutes: daily * 7,
      preferred_session_length: daily,
      referral_source: answers.referral || null,
      onboarding_completed: true,
    };

    const res = await apiFetch(`${API}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let body = {};
      try { body = await res.json(); } catch { /* non-json */ }
      // Log the full server debug payload so we can diagnose 500s without
      // Vercel log access. Fields prefixed debug_* come from routes/profile.js.
      console.error("Onboarding POST /api/profile failed:", res.status, body);
      const err = new Error(`profile_save_failed ${res.status} ${body.error || ""} ${body.debug_code || ""} ${body.debug_message || ""}`.trim());
      err.status = res.status;
      err.serverBody = body;
      throw err;
    }

    track("onboarding_completed", {
      exam_date: examDate,
      target_grade: answers.target_grade,
      spanish_courses_completed: answers.spanish_courses_completed,
      spanish_grade_average: answers.spanish_grade_average,
      study_background: answers.study_background,
      starting_level: derivedStartingLevel,
      daily_goal: daily,
      referral: answers.referral,
      strong_areas_count: Array.isArray(answers.strong_areas) ? answers.strong_areas.length : null,
    });

    window._userProfile = body;
  } catch (err) {
    console.error("Onboarding save failed:", err);
    track("onboarding_save_failed", { message: String(err && err.message || err), status: err && err.status || null });
    toast.error("Tallennus epäonnistui, yritä uudelleen.");
    btn.disabled = false;
    btn.textContent = "Aloita harjoittelu →";
    return;
  }

  btn.disabled = false;
  btn.textContent = "Aloita harjoittelu →";

  // After onboarding → show placement test intro
  const { showPlacementIntro } = window._placementRef || {};
  if (showPlacementIntro) {
    showPlacementIntro();
  } else {
    await _deps.loadDashboard();
  }
}

async function skipOnboarding() {
  track("onboarding_skipped", { step: currentStep });
  // Save partial data with onboarding_completed = false
  try {
    const res = await apiFetch(`${API}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ onboarding_completed: false }),
    });
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).error || ""; } catch { /* non-json */ }
      throw new Error(`profile_save_failed ${res.status} ${detail}`);
    }
  } catch (err) {
    console.error("Onboarding skip save failed:", err);
    track("onboarding_skip_save_failed", { message: String(err && err.message || err) });
  }

  await _deps.loadDashboard();
}
