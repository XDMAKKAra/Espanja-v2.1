// L-ONBOARDING-REDESIGN-1 — onboarding V3 (9 stages).
// Persuasion-first onboarding ennen Pro-ostoa.
// Flow:
//   welcome → language → level → current → target → exam-date → time → focus → reveal → signup
//
// Reveal builds the personalized study plan via lib/studyPlan.js. Free signup
// drops user into the app; "open all with Mestari" links to /pricing.

import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { setLanguage } from "../state.js";
import { track } from "../analytics.js";
import { computeStudyPlan, gradeLabel } from "../lib/studyPlan.js";

const COURSES_DONE_TO_LEVEL = { "1": "I", "2": "A", "4": "B", "6": "C" };

const FOCUS_LABELS = {
  vocab: "Sanasto",
  grammar: "Kielioppi",
  writing: "Kirjoittaminen",
  reading: "Luetun ymmärtäminen",
  exam: "Koe-simulaatiot",
};

const STAGE_ORDER = [
  "welcome", "language", "level", "current", "target", "exam-date", "time", "focus", "reveal",
];

const SCREEN_ID = {
  welcome: "screen-ob-v3-welcome",
  language: "screen-ob-v3-language",
  level: "screen-ob-v3-level",
  current: "screen-ob-v3-current",
  target: "screen-ob-v3-target",
  "exam-date": "screen-ob-v3-exam-date",
  time: "screen-ob-v3-time",
  focus: "screen-ob-v3-focus",
  reveal: "screen-ob-v3-reveal",
};

const flow = {
  target_language: null,    // "es" | "de" | "fr"
  target_level: "lyhyt",    // "lyhyt" | "pitka"
  current_level: null,      // I/A/B/C
  target_grade: null,       // A..L
  exam_date: null,          // YYYY-MM-DD
  weekly_minutes: 120,
  focus_areas: ["vocab", "grammar", "writing", "reading", "exam"],
};

let _deps = {};

export function initOnboardingV3(deps = {}) {
  _deps = deps;
  wireWelcome();
  wireLanguage();
  wireLevel();
  wireCurrent();
  wireTarget();
  wireExamDate();
  wireTime();
  wireFocus();
  wireReveal();
  wireWaitlist();
  wireBack();
  wireNext();
}

export function showOnboardingV3() {
  show(SCREEN_ID.welcome);
  track("ob_v3_started", {});
}

// ── Stage navigation ────────────────────────────────────────────────────────
function gotoStage(stage) {
  const id = SCREEN_ID[stage];
  if (!id) return;
  show(id);
  track("ob_v3_stage", { stage });
  if (stage === "reveal") renderReveal();
  if (stage === "time") updateTimePreview();
}

function nextOf(current) {
  const idx = STAGE_ORDER.indexOf(current);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}
function prevOf(current) {
  const idx = STAGE_ORDER.indexOf(current);
  return idx > 0 ? STAGE_ORDER[idx - 1] : null;
}

function wireBack() {
  document.querySelectorAll('[data-ob3="back"]').forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", () => {
      const screen = btn.closest(".ob3");
      const stage = stageOfScreen(screen);
      const prev = prevOf(stage);
      if (prev) gotoStage(prev);
    });
  });
}

function stageOfScreen(screen) {
  if (!screen) return null;
  const id = screen.id;
  for (const [stage, sid] of Object.entries(SCREEN_ID)) {
    if (sid === id) return stage;
  }
  return null;
}

function wireNext() {
  document.querySelectorAll('[data-ob3="next"]').forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", async () => {
      const stage = btn.dataset.from;
      if (stage === "reveal") {
        await completeAndRedirect();
        return;
      }
      const next = nextOf(stage);
      if (next) gotoStage(next);
    });
  });
}

// ── Stage 0: welcome ───────────────────────────────────────────────────────
function wireWelcome() { /* CTA wired by [data-ob3="next"] */ }

// ── Stage 1: language ──────────────────────────────────────────────────────
function wireLanguage() {
  const root = document.querySelector('[data-ob3-field="target_language"]');
  if (!root || root.dataset.wired) return;
  root.dataset.wired = "1";
  root.addEventListener("click", (e) => {
    const card = e.target.closest(".ob3-card");
    if (!card) return;
    if (card.dataset.soon === "1") {
      openWaitlist(card.dataset.value);
      return;
    }
    setRadio(root, ".ob3-card", card);
    flow.target_language = card.dataset.value;
    enableNextOf("language");
  });
}

// ── Stage 2: level ─────────────────────────────────────────────────────────
function wireLevel() {
  const root = document.querySelector('[data-ob3-field="target_level"]');
  if (!root || root.dataset.wired) return;
  root.dataset.wired = "1";
  // Pre-select lyhyt
  const lyhyt = root.querySelector('.ob3-pill[data-value="lyhyt"]');
  if (lyhyt) lyhyt.setAttribute("aria-checked", "true");
  flow.target_level = "lyhyt";
  root.addEventListener("click", (e) => {
    const pill = e.target.closest(".ob3-pill");
    if (!pill) return;
    if (pill.dataset.soon === "1") {
      openWaitlist(flow.target_language || "es", "pitka");
      return;
    }
    setRadio(root, ".ob3-pill", pill);
    flow.target_level = pill.dataset.value;
  });
}

// ── Stage 3: current level ─────────────────────────────────────────────────
function wireCurrent() {
  const root = document.querySelector('[data-ob3-field="courses_done"]');
  if (!root || root.dataset.wired) return;
  root.dataset.wired = "1";
  root.addEventListener("click", (e) => {
    const chip = e.target.closest(".ob3-chip");
    if (!chip) return;
    setRadio(root, ".ob3-chip", chip);
    flow.current_level = COURSES_DONE_TO_LEVEL[chip.dataset.value] || "B";
    // Default target = current + 2 if not set yet
    const targetRow = document.querySelector('[data-ob3-field="target_grade"]');
    if (targetRow && !flow.target_grade) {
      const ladder = ["I", "A", "B", "C", "M", "E", "L"];
      const idx = ladder.indexOf(flow.current_level);
      const presumed = idx >= 0 && idx + 2 < ladder.length ? ladder[idx + 2] : "M";
      const match = targetRow.querySelector(`.ob3-grade[data-value="${presumed}"]`);
      if (match) {
        setRadio(targetRow, ".ob3-grade", match);
        flow.target_grade = presumed;
        renderGradeHint();
      }
    }
    enableNextOf("current");
  });
}

// ── Stage 4: target grade ──────────────────────────────────────────────────
const GRADE_HINTS = {
  A: "approbatur · arvosanan alaraja, ~25–34 % pisteistä",
  B: "lubenter approbatur · ~35–44 % pisteistä",
  C: "cum laude approbatur · ~45–58 % pisteistä",
  M: "magna cum laude approbatur · ~59–74 % pisteistä",
  E: "eximia cum laude approbatur · ~75–87 % pisteistä",
  L: "laudatur · ~88 % tai yli, harva yltää",
};

function wireTarget() {
  const root = document.querySelector('[data-ob3-field="target_grade"]');
  if (!root || root.dataset.wired) return;
  root.dataset.wired = "1";
  root.addEventListener("click", (e) => {
    const grade = e.target.closest(".ob3-grade");
    if (!grade) return;
    setRadio(root, ".ob3-grade", grade);
    flow.target_grade = grade.dataset.value;
    renderGradeHint();
    enableNextOf("target");
  });
}

function renderGradeHint() {
  const el = document.getElementById("ob3-grade-hint");
  if (!el) return;
  el.textContent = flow.target_grade ? GRADE_HINTS[flow.target_grade] || "" : "";
}

// ── Stage 5: exam date ─────────────────────────────────────────────────────
function wireExamDate() {
  const root = document.querySelector('[data-ob3-field="exam_session"]');
  if (!root || root.dataset.wired) return;
  root.dataset.wired = "1";
  root.addEventListener("click", (e) => {
    const pill = e.target.closest(".ob3-pill");
    if (!pill) return;
    setRadio(root, ".ob3-pill", pill);
    flow.exam_date = pill.dataset.value;
    const precise = document.getElementById("ob3-exam-precise");
    if (precise) precise.value = "";
    enableNextOf("exam-date");
  });
  const precise = document.getElementById("ob3-exam-precise");
  if (precise && !precise.dataset.wired) {
    precise.dataset.wired = "1";
    precise.addEventListener("change", () => {
      if (!precise.value) return;
      flow.exam_date = precise.value;
      // Clear pill selection
      root.querySelectorAll(".ob3-pill").forEach((b) => b.setAttribute("aria-checked", "false"));
      enableNextOf("exam-date");
    });
  }
}

// ── Stage 6: time slider ───────────────────────────────────────────────────
function wireTime() {
  const slider = document.getElementById("ob3-weekly");
  const val = document.getElementById("ob3-weekly-val");
  if (!slider || slider.dataset.wired) return;
  slider.dataset.wired = "1";
  slider.addEventListener("input", () => {
    flow.weekly_minutes = Number(slider.value);
    if (val) val.textContent = String(flow.weekly_minutes);
    updateTimePreview();
  });
}

function updateTimePreview() {
  const out = document.getElementById("ob3-time-preview");
  if (!out) return;
  if (!flow.current_level || !flow.target_grade) {
    out.textContent = "Lukusuunnitelma näkyy seuraavalla sivulla.";
    return;
  }
  const plan = computeStudyPlan({
    current_level: flow.current_level,
    target_grade: flow.target_grade,
    exam_date: flow.exam_date,
  });
  const weeklyLessons = Math.max(1, Math.round(flow.weekly_minutes / 8));
  const projectedWeeks = Math.ceil(plan.totalLessons / weeklyLessons);
  out.textContent = `Tällä tahdilla saavutat ${flow.target_grade}-tason noin ${projectedWeeks} viikossa.`;
}

// ── Stage 7: focus ─────────────────────────────────────────────────────────
function wireFocus() {
  const root = document.querySelector('[data-ob3-field="focus_areas"]');
  if (!root || root.dataset.wired) return;
  root.dataset.wired = "1";
  root.addEventListener("click", (e) => {
    const chip = e.target.closest(".ob3-focus__chip");
    if (!chip) return;
    const pressed = chip.getAttribute("aria-pressed") === "true";
    chip.setAttribute("aria-pressed", String(!pressed));
    const v = chip.dataset.value;
    if (pressed) {
      flow.focus_areas = flow.focus_areas.filter((x) => x !== v);
    } else if (!flow.focus_areas.includes(v)) {
      flow.focus_areas = [...flow.focus_areas, v];
    }
  });
}

// ── Animated number counter (requestAnimationFrame, ~600 ms, ease-out) ────
/**
 * Counts from 0 → target over ~600 ms using ease-out easing.
 * Writes the formatted value to `el` on each tick. Respects
 * prefers-reduced-motion — skips animation and sets final value immediately.
 * @param {HTMLElement} el
 * @param {number} target   integer end value
 * @param {string} [suffix] optional suffix (e.g. " viikkoa")
 */
function animateCounter(el, target, suffix = "") {
  if (!el || target == null || !Number.isFinite(target)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = target + suffix;
    return;
  }
  const duration = 600;
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(tick);
}

// ── Stage 8: reveal ────────────────────────────────────────────────────────
function wireReveal() {
  const pricing = document.querySelector('[data-ob3="pricing"]');
  if (pricing && !pricing.dataset.wired) {
    pricing.dataset.wired = "1";
    pricing.addEventListener("click", (e) => {
      e.preventDefault();
      track("ob_v3_pricing_click", {});
      // Land on landing pricing section
      location.href = "/index.html#hinnoittelu";
    });
  }
}

function renderReveal() {
  const plan = computeStudyPlan({
    current_level: flow.current_level,
    target_grade: flow.target_grade,
    exam_date: flow.exam_date,
  });

  const nameEl = document.getElementById("ob3-reveal-name");
  if (nameEl) {
    const email = (typeof localStorage !== "undefined" && localStorage.getItem("puheo_email")) || "";
    const name = email ? email.split("@")[0] : "";
    nameEl.textContent = name ? `Hei, ${name}!` : "Tässä sinun polkusi.";
  }

  const jumpEl = document.getElementById("ob3-reveal-jump");
  if (jumpEl) jumpEl.textContent = `${flow.current_level || "?"} → ${flow.target_grade || "?"}`;

  // Animated counters for weeks / lessonsPerWeek / minutesPerWeek.
  const weeksEl = document.getElementById("ob3-reveal-weeks");
  if (weeksEl) {
    const examLabel = flow.exam_date
      ? new Date(flow.exam_date).toLocaleDateString("fi-FI", { day: "numeric", month: "numeric", year: "numeric" })
      : null;
    if (examLabel) {
      // counter on weeks number only, suffix appended statically
      weeksEl.innerHTML = `<span id="ob3-counter-weeks"></span> viikkoa · ${examLabel}`;
      animateCounter(document.getElementById("ob3-counter-weeks"), plan.weeksUntilExam);
    } else {
      weeksEl.innerHTML = `<span id="ob3-counter-weeks"></span> viikkoa`;
      animateCounter(document.getElementById("ob3-counter-weeks"), plan.weeksUntilExam);
    }
  }

  const paceEl = document.getElementById("ob3-reveal-pace");
  if (paceEl) {
    paceEl.innerHTML = `<span id="ob3-counter-lessons"></span> oppituntia/vk · ~<span id="ob3-counter-mins"></span> min`;
    // stagger the counters slightly so they feel sequential
    animateCounter(document.getElementById("ob3-counter-lessons"), plan.lessonsPerWeek);
    setTimeout(() => animateCounter(document.getElementById("ob3-counter-mins"), plan.minutesPerWeek), 120);
  }

  const focusEl = document.getElementById("ob3-reveal-focus");
  if (focusEl) {
    const labels = flow.focus_areas.map((k) => FOCUS_LABELS[k] || k);
    focusEl.textContent = labels.length ? labels.join(" · ") : "Yleinen valmistautuminen";
  }

  // Course strip — 8 cards, first N highlighted up to coursesNeeded.
  const courses = document.getElementById("ob3-reveal-courses");
  if (courses) {
    courses.innerHTML = "";
    for (let i = 1; i <= 8; i++) {
      const li = document.createElement("div");
      const active = i <= Math.min(8, plan.coursesNeeded);
      li.className = "ob3-course-tile" + (active ? " is-active" : "");
      li.innerHTML = `
        <span class="ob3-course-tile__num mono-num">${i}</span>
        <span class="ob3-course-tile__lock" aria-hidden="true">${active ? "" : "🔒"}</span>
      `;
      courses.appendChild(li);
    }
  }
}

async function completeAndRedirect() {
  if (isLoggedIn()) {
    try {
      await apiFetch(`${API}/api/onboarding/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          target_language: flow.target_language,
          target_level: flow.target_level,
          current_level: flow.current_level,
          target_grade: flow.target_grade,
          exam_date: flow.exam_date,
          weekly_minutes: flow.weekly_minutes,
          focus_areas: flow.focus_areas,
        }),
      });
    } catch { /* non-blocking */ }
    // L-LANG-INFRA-1: hydrate state.language from the just-saved flow so the
    // routing below sees the correct value without an extra /api/profile round-trip.
    if (flow.target_language) setLanguage(flow.target_language);
    track("ob_v3_completed", { logged_in: true });
    // Non-ES users → coming-soon, ES users → normal dashboard.
    // BUGFIX: clear `#/aloitus` from the URL so a subsequent reload doesn't
    // re-trigger showOnboardingV3() and leave screen-ob-v3-reveal as `.active`
    // behind the dashboard.
    try { history.replaceState({}, "", location.pathname); } catch { /* noop */ }
    if (flow.target_language && flow.target_language !== "es") {
      import("./comingSoon.js")
        .then((m) => m.showComingSoon())
        .catch(() => show("screen-coming-soon"));
      return;
    }
    if (_deps.loadDashboard) _deps.loadDashboard();
    return;
  }

  // Not logged in: stash the flow, route to register screen.
  try {
    sessionStorage.setItem("puheo_ob_v3_flow", JSON.stringify(flow));
  } catch { /* private mode — silent */ }
  track("ob_v3_completed", { logged_in: false });
  location.hash = "#rekisteroidy";
  show("screen-auth");
}

// ── Waitlist (de/fr) ───────────────────────────────────────────────────────
let waitlistContext = { language: null, level: null };

function openWaitlist(language, level) {
  waitlistContext = { language, level: level || null };
  const modal = document.getElementById("ob3-waitlist-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  const body = document.getElementById("ob3-waitlist-body");
  if (body) {
    const langLabel = { de: "Saksan", fr: "Ranskan", es: "Espanjan" }[language] || "Tämän kielen";
    const levelLabel = level === "pitka" ? "pitkä oppimäärä" : "kurssi";
    body.textContent = `${langLabel} ${levelLabel} on tulossa. Jätä sähköpostisi, niin kerromme heti kun se avautuu.`;
  }
  const success = document.getElementById("ob3-waitlist-success");
  if (success) success.classList.add("hidden");
  track("ob_v3_waitlist_open", { language, level: level || null });
  // Move focus into modal so keyboard users land inside (focus trap handles the rest)
  const closeBtn = document.getElementById("ob3-waitlist-close");
  if (closeBtn) requestAnimationFrame(() => closeBtn.focus());
}

function _closeWaitlist(modal) {
  modal.classList.add("hidden");
  // Return focus to the card that opened the modal (language stage)
  const trigger = document.querySelector('[data-ob3-field="target_language"] .ob3-card[data-soon="1"]');
  trigger?.focus();
}

function wireWaitlist() {
  const modal = document.getElementById("ob3-waitlist-modal");
  if (!modal || modal.dataset.wired) return;
  modal.dataset.wired = "1";
  const close = document.getElementById("ob3-waitlist-close");
  if (close) close.addEventListener("click", () => _closeWaitlist(modal));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) _closeWaitlist(modal);
  });
  // Escape key closes modal (a11y requirement for dialog role)
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); _closeWaitlist(modal); }
    // Simple focus trap: Tab / Shift+Tab stays inside the panel
    if (e.key === "Tab") {
      const panel = modal.querySelector(".ob3-modal__panel");
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll('button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });
  const form = document.getElementById("ob3-waitlist-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailEl = document.getElementById("ob3-waitlist-email");
      const email = (emailEl?.value || "").trim();
      if (!email) return;
      try {
        await apiFetch(`${API}/api/onboarding/waitlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            language: waitlistContext.language,
            level: waitlistContext.level,
          }),
        });
      } catch { /* silent — show success regardless */ }
      const success = document.getElementById("ob3-waitlist-success");
      if (success) success.classList.remove("hidden");
      form.querySelector(".ob3-cta")?.setAttribute("disabled", "true");
      track("ob_v3_waitlist_submit", waitlistContext);
    });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function setRadio(root, sel, target) {
  root.querySelectorAll(sel).forEach((b) => b.setAttribute("aria-checked", String(b === target)));
}

function enableNextOf(stage) {
  const screen = document.getElementById(SCREEN_ID[stage]);
  if (!screen) return;
  const cta = screen.querySelector('[data-ob3="next"]');
  if (cta) cta.disabled = false;
}
