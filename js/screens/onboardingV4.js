// L-V293-ONBOARDING-DIAGNOSTIC-1a — diagnostic-first onboarding (5 stepit).
//
// Step order: intro → test (a/b/c) → courses → biography → summary.
// Test step renders empty-state in commit 1a (content arrives in 1b-1e).
// Pause-resume: every answered question UPSERTs to backend; on next mount
// we load /diagnostic/state and skip past answered questions.
//
// Entrypoint hash: #/aloitus-v4 (V3 stays default until V4 is content-complete).

import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, apiFetch } from "../api.js";
import { setLanguage } from "../state.js";
import { track } from "../analytics.js";
import {
  loadPart,
  questionsFor,
  isPlaceholder,
  loadServerState,
  saveAnswer,
  completeDiagnostic,
  partProgress,
  renderQuestion,
  renderFeedback,
  gradeQuestion,
} from "../features/miniYO.js";

const STAGE_ORDER = ["intro", "test", "courses", "biography", "summary"];

const SCREEN_ID = {
  intro: "screen-ob-v4-intro",
  test: "screen-ob-v4-test",
  courses: "screen-ob-v4-courses",
  biography: "screen-ob-v4-biography",
  summary: "screen-ob-v4-summary",
};

const TEST_PARTS = ["a_grammar", "b_reading", "c_writing"];

const state = {
  language: null,
  currentPart: "a_grammar",
  partData: null,
  progress: [],
  questionIndex: 0,
  coursesCompleted: [],
  courseGrades: {},
  biography: { home_usage: null, lived_abroad: null, frequency: null },
};

let _deps = {};

export function initOnboardingV4(deps = {}) {
  _deps = deps;
  wireIntro();
  wireTest();
  wireCourses();
  wireBiography();
  wireSummary();
}

export async function showOnboardingV4(opts = {}) {
  state.language = opts.language || resolveLanguage();
  if (state.language) setLanguage(state.language);
  show(SCREEN_ID.intro);
  track("ob_v4_started", { language: state.language });

  // Warm server state in the background so resume works without delay.
  if (isLoggedIn() && state.language) {
    loadServerState(state.language).then((s) => {
      state.progress = Array.isArray(s.progress) ? s.progress : [];
      renderTestProgressHint();
    });
  }
}

function resolveLanguage() {
  try {
    return localStorage.getItem("puheo:lang") || "es";
  } catch {
    return "es";
  }
}

function gotoStage(stage) {
  const id = SCREEN_ID[stage];
  if (id) show(id);
  if (stage === "test") renderTest();
  if (stage === "summary") renderSummary();
}

// ─── Step 1: Intro ──────────────────────────────────────────────────────────
function wireIntro() {
  $("ob-v4-intro-start")?.addEventListener("click", () => {
    state.currentPart = "a_grammar";
    gotoStage("test");
  });
  $("ob-v4-intro-skip")?.addEventListener("click", async () => {
    await completeDiagnostic({ language: state.language, status: "skipped" });
    track("ob_v4_skipped_at_intro", { language: state.language });
    gotoStage("courses");
  });
}

// ─── Step 2: Test runner ────────────────────────────────────────────────────
function wireTest() {
  $("ob-v4-test-skip-part")?.addEventListener("click", () => advanceTestPart("partial"));
  $("ob-v4-test-skip-all")?.addEventListener("click", async () => {
    await completeDiagnostic({ language: state.language, status: "partial" });
    gotoStage("courses");
  });
  $("ob-v4-test-next-part")?.addEventListener("click", () => advanceTestPart("partial"));
}

async function renderTest() {
  const partLabelEl = $("ob-v4-test-part-label");
  const titleEl = $("ob-v4-test-title");
  const bodyEl = $("ob-v4-test-body");
  const progressEl = $("ob-v4-test-progress");
  const nextPartBtn = $("ob-v4-test-next-part");
  if (!bodyEl) return;

  state.partData = await loadPart(state.language, state.currentPart);
  const placeholder = isPlaceholder(state.partData);

  if (partLabelEl) partLabelEl.textContent = partLabel(state.currentPart);
  if (titleEl) titleEl.textContent = partTitle(state.currentPart);

  if (placeholder) {
    bodyEl.innerHTML = `
      <p class="ob-v4-empty__hint">Tämän osion sisältö on vielä työn alla. Voit jatkaa eteenpäin, kurssi- ja biografia-vastauksesi tallennetaan silti.</p>
    `;
    if (progressEl) progressEl.textContent = "Sisältö tulossa";
    if (nextPartBtn) nextPartBtn.hidden = false;
    return;
  }

  // Real content path: resume from server progress (skip past answered questions).
  state.questionIndex = computeResumeIndex(state.progress, state.currentPart, questionsFor(state.partData).length);
  if (nextPartBtn) nextPartBtn.hidden = true;
  showCurrentQuestion();
}

function computeResumeIndex(progressArray, part, total) {
  if (!Array.isArray(progressArray)) return 0;
  const indices = progressArray
    .filter(p => p.part === part)
    .map(p => p.question_index)
    .sort((a, b) => a - b);
  // Resume at the first index that hasn't been answered yet.
  for (let i = 0; i < total; i++) {
    if (!indices.includes(i)) return i;
  }
  return total; // all done
}

function showCurrentQuestion() {
  const bodyEl = $("ob-v4-test-body");
  const progressEl = $("ob-v4-test-progress");
  const nextPartBtn = $("ob-v4-test-next-part");
  if (!bodyEl) return;

  const questions = questionsFor(state.partData);
  const total = questions.length;
  const idx = state.questionIndex;

  if (idx >= total) {
    // Part complete — show summary + reveal "next part" button.
    bodyEl.innerHTML = `<p class="ob-v4-empty__hint">Tämä osa on valmis. Hyvää työtä.</p>`;
    if (progressEl) progressEl.textContent = `${total}/${total} valmis`;
    if (nextPartBtn) nextPartBtn.hidden = false;
    return;
  }

  if (progressEl) progressEl.textContent = `${idx + 1} / ${total}`;
  const question = questions[idx];

  const { submitBtn, getValue } = renderQuestion(bodyEl, question, { index: idx, total });
  if (!submitBtn) return;

  submitBtn.addEventListener("click", async () => {
    const userInput = getValue();
    const { correct, normalizedAnswer } = gradeQuestion(question, userInput);
    renderFeedback(bodyEl, question, normalizedAnswer, correct);

    // UPSERT to backend. Non-fatal if anonymous/offline.
    await saveAnswer({
      language: state.language,
      part: state.currentPart,
      questionIndex: idx,
      questionId: question.id,
      userAnswer: normalizedAnswer,
      isCorrect: correct,
    });

    // Update local progress cache so resume index is correct.
    state.progress = [
      ...state.progress.filter(p => !(p.part === state.currentPart && p.question_index === idx)),
      {
        part: state.currentPart,
        question_index: idx,
        question_id: question.id,
        user_answer: normalizedAnswer,
        is_correct: correct,
      },
    ];

    // Reveal a "Seuraava" button.
    const actionsEl = bodyEl.querySelector(".ob4-q__actions");
    if (actionsEl) {
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "ob4-btn ob4-btn--primary ob4-q__next";
      nextBtn.textContent = idx + 1 >= total ? "Seuraava osa" : "Seuraava kysymys";
      nextBtn.addEventListener("click", () => {
        state.questionIndex = idx + 1;
        showCurrentQuestion();
      });
      actionsEl.appendChild(nextBtn);
    }
  });
}

function renderTestProgressHint() {
  const progressEl = $("ob-v4-test-progress");
  if (!progressEl || !state.partData) return;
  const total = questionsFor(state.partData).length;
  if (!total) return;
  const { answered } = partProgress(state.progress, state.currentPart, total);
  progressEl.textContent = `${answered}/${total} vastattu`;
}

function advanceTestPart(statusIfLast) {
  const idx = TEST_PARTS.indexOf(state.currentPart);
  if (idx < 0 || idx === TEST_PARTS.length - 1) {
    completeDiagnostic({ language: state.language, status: statusIfLast || "partial" });
    gotoStage("courses");
    return;
  }
  state.currentPart = TEST_PARTS[idx + 1];
  renderTest();
}

function partLabel(part) {
  if (part === "a_grammar") return "Osa A — Rakenne";
  if (part === "b_reading") return "Osa B — Luetun ymmärtäminen";
  if (part === "c_writing") return "Osa C — Kirjoitelma";
  return "Osa";
}
function partTitle(part) {
  if (part === "a_grammar") return "Lyhyitä kysymyksiä kieliopista ja sanastosta";
  if (part === "b_reading") return "Yksi pidempi teksti, muutama kysymys";
  if (part === "c_writing") return "Kirjoita lyhyt teksti annetusta aiheesta";
  return "Tehtävä";
}

// ─── Step 3: Multi-select kurssit ───────────────────────────────────────────
function wireCourses() {
  const list = $("ob-v4-courses-list");
  if (list) {
    list.addEventListener("change", (e) => {
      const t = e.target;
      if (!t || !t.dataset) return;
      const k = Number(t.dataset.courseNum);
      if (!Number.isInteger(k)) return;

      if (t instanceof HTMLInputElement && t.type === "checkbox") {
        const row = t.closest(".ob4-course");
        if (t.checked) {
          state.coursesCompleted = [...new Set([...state.coursesCompleted, k])].sort((a, b) => a - b);
          row?.classList.add("is-selected");
        } else {
          state.coursesCompleted = state.coursesCompleted.filter(n => n !== k);
          delete state.courseGrades[k];
          row?.classList.remove("is-selected");
        }
      } else if (t instanceof HTMLSelectElement) {
        const v = t.value;
        if (v === "skipped") state.courseGrades[k] = null;
        else {
          const n = Number(v);
          if (Number.isInteger(n) && n >= 4 && n <= 10) state.courseGrades[k] = n;
        }
      }
    });
  }

  $("ob-v4-courses-continue")?.addEventListener("click", async () => {
    if (!isLoggedIn()) {
      // Defer to client-only state; backend save happens after sign-up.
      gotoStage("biography");
      return;
    }
    try {
      await apiFetch(`${API}/api/onboarding/diagnostic/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: state.language,
          courses_completed: state.coursesCompleted,
          course_grades: state.courseGrades,
        }),
      });
    } catch (err) {
      console.warn("courses save failed (non-fatal):", err.message);
    }
    gotoStage("biography");
  });
}

// ─── Step 4: Biografia ──────────────────────────────────────────────────────
function wireBiography() {
  const form = $("ob-v4-bio-form");
  if (form) {
    form.addEventListener("change", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement) || t.type !== "radio") return;
      const key = t.name;
      const value = t.value;
      if (["home_usage", "lived_abroad", "frequency"].includes(key)) {
        state.biography[key] = value;
      }
    });
  }
  $("ob-v4-bio-continue")?.addEventListener("click", async () => {
    if (isLoggedIn()) {
      try {
        await apiFetch(`${API}/api/onboarding/diagnostic/biography`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: state.language, ...state.biography }),
        });
      } catch (err) {
        console.warn("biography save failed (non-fatal):", err.message);
      }
    }
    gotoStage("summary");
  });
}

// ─── Step 5: Yhteenveto (mockup) ────────────────────────────────────────────
function wireSummary() {
  $("ob-v4-summary-start")?.addEventListener("click", () => {
    track("ob_v4_completed", { language: state.language, courses: state.coursesCompleted.length });
    if (typeof _deps.loadDashboard === "function") {
      _deps.loadDashboard();
    } else {
      window.location.hash = "#/dashboard";
    }
  });
}

function renderSummary() {
  const recapEl = $("ob-v4-summary-recap");
  if (!recapEl) return;

  const courses = state.coursesCompleted.length
    ? state.coursesCompleted.map(n => `K${n}`).join(", ")
    : "et merkinnyt yhtään";
  recapEl.innerHTML = `
    <p>Käydyt lukio-kurssit: <b>${escapeHtml(courses)}</b></p>
    <p>Henkilökohtainen polkusi rakennetaan, kun L-V294 reasoner käynnistyy. Tällä välin näet kaikki kurssit ja voit valita mistä haluat aloittaa.</p>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
