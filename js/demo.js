import { DEMO_EXERCISES } from "./demo-exercises.js";

// ─── State ─────────────────────────────────────────────────────────────────

let currentIdx = 0;
let score = 0;
let answered = false;
const results = []; // { correct: boolean, exercise }

// ─── DOM refs ──────────────────────────────────────────────────────────────

const container = document.getElementById("demo-container");
const exerciseView = document.getElementById("demo-exercise");
const resultsView = document.getElementById("demo-results");

const badgeMode = document.getElementById("demo-badge-mode");
const badgeLevel = document.getElementById("demo-badge-level");
const progressFill = document.getElementById("demo-progress-fill");
const counter = document.getElementById("demo-counter");
const contextEl = document.getElementById("demo-context");
const questionEl = document.getElementById("demo-question");
const optionsEl = document.getElementById("demo-options");
const explanationEl = document.getElementById("demo-explanation");
const explanationIcon = document.getElementById("demo-explanation-icon");
const explanationText = document.getElementById("demo-explanation-text");
const btnNext = document.getElementById("demo-btn-next");

// Results
const resultsIcon = document.getElementById("demo-results-icon");
const resultsTitle = document.getElementById("demo-results-title");
const resultsSub = document.getElementById("demo-results-sub");
const resultsBreakdown = document.getElementById("demo-results-breakdown");
const btnRetry = document.getElementById("demo-btn-retry");
const ctaRegister = document.getElementById("demo-cta-register");

// ─── Analytics helper ──────────────────────────────────────────────────────

function trackDemo(event, props = {}) {
  try {
    if (window.posthog) window.posthog.capture(event, props);
  } catch { /* silent */ }
}

// ─── Render exercise ───────────────────────────────────────────────────────

function renderExercise() {
  const ex = DEMO_EXERCISES[currentIdx];
  answered = false;

  // Header
  badgeMode.textContent = `${ex.modeIcon} ${ex.modeLabel}`;
  badgeLevel.textContent = `Taso ${ex.level}`;
  counter.textContent = `${currentIdx + 1} / ${DEMO_EXERCISES.length}`;
  progressFill.style.width = `${((currentIdx) / DEMO_EXERCISES.length) * 100}%`;

  // Context
  if (ex.type === "correction" && ex.context) {
    contextEl.textContent = ex.context;
    contextEl.classList.remove("hidden");
  } else if (ex.type === "context" && ex.context) {
    contextEl.textContent = ex.context;
    contextEl.classList.remove("hidden");
  } else {
    contextEl.classList.add("hidden");
  }

  // Question
  questionEl.textContent = ex.question;

  // Options
  optionsEl.innerHTML = "";
  ex.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "demo-option";
    btn.dataset.letter = opt[0]; // "A", "B", etc.
    btn.innerHTML = `<span class="demo-option-letter">${opt[0]}</span><span class="demo-option-text">${opt.substring(3)}</span>`;
    btn.addEventListener("click", () => handleAnswer(btn, opt[0], ex));
    optionsEl.appendChild(btn);
  });

  // Hide explanation
  explanationEl.classList.add("hidden");

  // Show exercise
  exerciseView.classList.remove("hidden");
  resultsView.classList.add("hidden");
}

// ─── Handle answer ─────────────────────────────────────────────────────────

function handleAnswer(btn, letter, ex) {
  if (answered) return;
  answered = true;

  const isCorrect = letter === ex.correct;
  if (isCorrect) score++;
  results.push({ correct: isCorrect, exercise: ex });

  trackDemo("demo_question_answered", {
    question: currentIdx + 1,
    correct: isCorrect,
    mode: ex.mode,
    level: ex.level,
  });

  // Disable all options
  optionsEl.querySelectorAll(".demo-option").forEach((opt) => {
    opt.classList.add("disabled");
    if (opt.dataset.letter === ex.correct) {
      opt.classList.add("correct");
    } else if (opt === btn && !isCorrect) {
      opt.classList.add("wrong");
    }
  });

  // Show explanation
  explanationIcon.textContent = isCorrect ? "✓" : "✗";
  explanationIcon.className = `demo-explanation-icon ${isCorrect ? "correct" : "wrong"}`;
  explanationText.textContent = ex.explanation;

  if (currentIdx === DEMO_EXERCISES.length - 1) {
    btnNext.textContent = "Näytä tulokset →";
  } else {
    btnNext.textContent = "Seuraava →";
  }

  explanationEl.classList.remove("hidden");

  // Scroll explanation into view on mobile
  setTimeout(() => {
    explanationEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
}

// ─── Next / Results ────────────────────────────────────────────────────────

btnNext.addEventListener("click", () => {
  if (currentIdx < DEMO_EXERCISES.length - 1) {
    currentIdx++;
    renderExercise();
  } else {
    showResults();
  }
});

function showResults() {
  trackDemo("demo_completed", {
    score,
    total: DEMO_EXERCISES.length,
  });

  exerciseView.classList.add("hidden");
  resultsView.classList.remove("hidden");

  // Icon & title
  if (score === DEMO_EXERCISES.length) {
    resultsIcon.textContent = "🎉";
    resultsTitle.textContent = "Täydellinen tulos!";
    resultsSub.textContent = `${score}/${DEMO_EXERCISES.length} oikein — olet jo hyvällä tasolla!`;
  } else if (score >= 2) {
    resultsIcon.textContent = "💪";
    resultsTitle.textContent = "Hyvin menee!";
    resultsSub.textContent = `${score}/${DEMO_EXERCISES.length} oikein — hyvä pohja yo-kokeeseen!`;
  } else if (score === 1) {
    resultsIcon.textContent = "📚";
    resultsTitle.textContent = "Hyvä alku!";
    resultsSub.textContent = `${score}/${DEMO_EXERCISES.length} oikein — Puheo auttaa sinua kehittymään.`;
  } else {
    resultsIcon.textContent = "🚀";
    resultsTitle.textContent = "Puheo auttaa!";
    resultsSub.textContent = `${score}/${DEMO_EXERCISES.length} oikein — harjoittelulla parannat nopeasti.`;
  }

  // Breakdown
  resultsBreakdown.innerHTML = results.map((r, i) => {
    const icon = r.correct ? "✓" : "✗";
    const cls = r.correct ? "correct" : "wrong";
    return `<div class="demo-breakdown-row">
      <span class="demo-breakdown-icon ${cls}">${icon}</span>
      <span class="demo-breakdown-label">${r.exercise.modeIcon} ${r.exercise.modeLabel}</span>
      <span class="demo-breakdown-level">Taso ${r.exercise.level}</span>
    </div>`;
  }).join("");

  progressFill.style.width = "100%";
}

// ─── Retry ─────────────────────────────────────────────────────────────────

btnRetry.addEventListener("click", () => {
  currentIdx = 0;
  score = 0;
  results.length = 0;
  renderExercise();
  trackDemo("demo_started", { retry: true });
});

// ─── CTA register click ───────────────────────────────────────────────────

ctaRegister.addEventListener("click", () => {
  trackDemo("demo_cta_clicked", { score, total: DEMO_EXERCISES.length });
});

// ─── Auto-start when scrolled into view ────────────────────────────────────

let demoStarted = false;
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !demoStarted) {
    demoStarted = true;
    renderExercise();
    trackDemo("demo_started", { retry: false });
    observer.disconnect();
  }
}, { threshold: 0.3 });

observer.observe(container);
