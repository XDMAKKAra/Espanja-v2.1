import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch } from "../api.js";
import { track } from "../analytics.js";

let _deps = {};
export function initOnboarding({ loadDashboard }) {
  _deps = { loadDashboard };
}

// ─── State ─────────────────────────────────────────────────────────────────

let currentStep = 1;
const TOTAL_STEPS = 7;

const answers = {
  exam_date: null,
  current_grade: null,
  target_grade: null,
  study_years: null,
  weak_areas: [],
  daily_goal: null,
  referral: null,
};

const ENCOURAGEMENTS = [
  "Hyvä alku! 💪",
  "Loistavaa — jatka samaan malliin!",
  "Melkein valmis! 🚀",
  "Täydellistä!",
  "Hienoa — lähes perillä!",
  "Maalissa kohta! 🎯",
  "Viimeinen kysymys! 🏁",
];

// Grade mapping: school grade → YTL grade
const SCHOOL_TO_YTL = {
  "4": "I", "5": "A", "6": "B", "7": "C",
  "8": "M", "9": "E", "10": "L", "unknown": "en tiedä",
};

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
  show("screen-onboarding");
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
  const pct = currentStep === "done" ? 100 : ((currentStep - 1) / TOTAL_STEPS) * 100;
  const fill = $("onboarding-progress-fill");
  if (fill) fill.style.width = `${pct}%`;

  const label = $("onboarding-step-label");
  if (label) label.textContent = currentStep === "done" ? "Valmis!" : `${currentStep} / ${TOTAL_STEPS}`;
}

function nextStep() {
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateProgress();
    showStep(currentStep);
  } else {
    currentStep = "done";
    updateProgress();
    showStep("done");
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

// Wire up all handlers
handleSingleSelect("ob-exam-date", "exam_date");
handleSingleSelect("ob-current-grade", "current_grade", (v) => SCHOOL_TO_YTL[v] || v);
handleSingleSelect("ob-target-grade", "target_grade");
handleSingleSelect("ob-study-years", "study_years");
handleSingleSelect("ob-daily-goal", "daily_goal");
handleSingleSelect("ob-referral", "referral");
handleMultiSelect();

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
  const grade = answers.current_grade;
  const target = answers.target_grade;

  // Starting level insight
  if (grade && grade !== "en tiedä") {
    insights.push({
      icon: "📊",
      text: `Aloitat ${grade}-tasolta harjoituksissa (nykyinen tasosi).`,
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

    const body = {
      current_grade: diagnosticGrade || answers.current_grade || "en tiedä",
      target_grade: answers.target_grade || "M",
      exam_date: examDate,
      study_years: Number(answers.study_years) || 1,
      weak_areas: answers.weak_areas.length > 0 ? answers.weak_areas : [],
      weekly_goal_minutes: daily * 7,
      preferred_session_length: daily,
      referral_source: answers.referral || null,
      onboarding_completed: true,
    };

    await apiFetch(`${API}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });

    track("onboarding_completed", {
      exam_date: examDate,
      target_grade: answers.target_grade,
      daily_goal: daily,
      referral: answers.referral,
    });

    window._userProfile = body;
  } catch {
    // Silent fail — still let them through
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
    await apiFetch(`${API}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ onboarding_completed: false }),
    });
  } catch { /* silent */ }

  await _deps.loadDashboard();
}
