import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch } from "../api.js";

let _deps = {};
export function initPlacement({ loadDashboard }) {
  _deps = { loadDashboard };
}

// ─── State ─────────────────────────────────────────────────────────────────

let questions = [];
let currentIdx = 0;
let answers = []; // { id, level, selected }
let result = null;

// ─── Public: check if placement needed ─────────────────────────────────────

export async function checkPlacementNeeded() {
  try {
    const res = await apiFetch(`${API}/api/placement/status`, { headers: authHeader() });
    if (!res.ok) return false;
    const { completed } = await res.json();
    return !completed;
  } catch {
    return false;
  }
}

export function showPlacementIntro() {
  show("screen-placement-intro");
}

export async function startPlacementFromRetake() {
  // Direct start without intro screen for retakes
  await fetchQuestions();
  if (questions.length > 0) {
    renderQuestion();
    show("screen-placement-test");
  }
}

// ─── Fetch questions ───────────────────────────────────────────────────────

async function fetchQuestions() {
  try {
    const res = await apiFetch(`${API}/api/placement/questions`, { headers: authHeader() });
    if (!res.ok) return;
    const data = await res.json();
    questions = data.questions;
    currentIdx = 0;
    answers = [];
    result = null;
  } catch { /* silent */ }
}

// ─── Intro screen ──────────────────────────────────────────────────────────

$("placement-btn-start").addEventListener("click", async () => {
  $("placement-btn-start").disabled = true;
  $("placement-btn-start").textContent = "Ladataan...";
  await fetchQuestions();
  $("placement-btn-start").disabled = false;
  $("placement-btn-start").textContent = "Aloita kartoitus →";

  if (questions.length > 0) {
    renderQuestion();
    show("screen-placement-test");
  }
});

$("placement-btn-skip").addEventListener("click", async () => {
  // Choose B as default and skip
  try {
    await apiFetch(`${API}/api/placement/choose-level`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ level: "B" }),
    });
  } catch { /* silent */ }
  window._placementDone = true;
  await _deps.loadDashboard();
});

// ─── Render question ───────────────────────────────────────────────────────

function renderQuestion() {
  const q = questions[currentIdx];
  let answered = false;

  // Header
  const LEVEL_LABELS = { A: "Taso A", B: "Taso B", C: "Taso C", M: "Taso M" };
  $("placement-level-badge").textContent = LEVEL_LABELS[q.level] || `Taso ${q.level}`;
  $("placement-counter").textContent = `${currentIdx + 1} / ${questions.length}`;
  $("placement-progress-fill").style.width = `${(currentIdx / questions.length) * 100}%`;

  // Context
  const contextEl = $("placement-context");
  // Show context for context/correction types
  if (q.type === "context" || q.type === "correction") {
    // Extract context from question if embedded
    contextEl.classList.add("hidden");
  } else {
    contextEl.classList.add("hidden");
  }

  // Question
  $("placement-question").textContent = q.question;

  // Options
  const optionsEl = $("placement-options");
  optionsEl.innerHTML = "";
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "placement-option";
    const letter = opt[0];
    btn.dataset.letter = letter;
    btn.innerHTML = `<span class="placement-option-letter">${letter}</span><span class="placement-option-text">${opt.substring(3)}</span>`;
    btn.addEventListener("click", () => {
      if (answered) return;
      answered = true;

      // Record answer
      answers.push({ id: q.id, level: q.level, selected: letter });

      // Disable all and submit to see correct answer
      optionsEl.querySelectorAll(".placement-option").forEach(o => o.classList.add("disabled"));
      btn.classList.add("selected");

      // We don't know the correct answer client-side, so just advance
      // The explanation will come from server after all answers
      // But for UX, show immediate visual + advance after delay
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          currentIdx++;
          renderQuestion();
        } else {
          submitAnswers();
        }
      }, 400);
    });
    optionsEl.appendChild(btn);
  });

  // Hide explanation (we don't show per-question explanations during test)
  $("placement-explanation").classList.add("hidden");
}

// ─── Submit all answers ────────────────────────────────────────────────────

async function submitAnswers() {
  $("placement-progress-fill").style.width = "100%";
  $("placement-question").textContent = "Lasketaan tuloksia...";
  $("placement-options").innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Analysoidaan vastauksia...</div>';

  try {
    const res = await apiFetch(`${API}/api/placement/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ answers }),
    });

    if (!res.ok) throw new Error("Submit failed");
    result = await res.json();
    showResults();
  } catch {
    $("placement-question").textContent = "Jokin meni pieleen";
    $("placement-options").innerHTML = '<button class="btn-primary" onclick="location.reload()">Yritä uudelleen</button>';
  }
}

// ─── Results screen ────────────────────────────────────────────────────────

function showResults() {
  const pl = result.placementLevel;

  $("placement-results-grade").textContent = pl;
  $("placement-results-sub").textContent = `Kartoituksen perusteella aloitat ${pl}-tasolta`;

  // Bar chart
  renderBarChart(result.scoreByLevel, result.answers);

  // Accept button
  $("placement-accept-level").textContent = pl;

  // Alternative button
  const altBtn = $("placement-btn-alt");
  if (result.alternativeLevel) {
    $("placement-alt-level").textContent = result.alternativeLevel;
    altBtn.classList.remove("hidden");
  } else {
    altBtn.classList.add("hidden");
  }

  show("screen-placement-results");
  window._placementDone = true;
}

function renderBarChart(scoreByLevel, gradedAnswers) {
  const chartEl = $("placement-chart");
  const LEVELS = ["A", "B", "C", "M"];

  let html = "";
  for (const level of LEVELS) {
    const s = scoreByLevel[level];
    if (!s || s.total === 0) continue;

    // Build individual check/cross marks
    const levelAnswers = (gradedAnswers || []).filter(a => a.level === level);
    let marks = "";
    if (levelAnswers.length > 0) {
      marks = levelAnswers.map(a =>
        `<span class="placement-chart-mark ${a.correct ? "correct" : "wrong"}">${a.correct ? "✓" : "✗"}</span>`
      ).join("");
    } else {
      // Fallback: generate from score
      for (let i = 0; i < s.total; i++) {
        const isCorrect = i < s.correct;
        marks += `<span class="placement-chart-mark ${isCorrect ? "correct" : "wrong"}">${isCorrect ? "✓" : "✗"}</span>`;
      }
    }

    const barPct = s.pct;
    const passed = s.pct >= 75;

    html += `
      <div class="placement-chart-row">
        <div class="placement-chart-label">${level}</div>
        <div class="placement-chart-bar-wrap">
          <div class="placement-chart-bar ${passed ? "passed" : "failed"}" style="width:${Math.max(barPct, 8)}%"></div>
        </div>
        <div class="placement-chart-marks">${marks}</div>
        <div class="placement-chart-pct ${passed ? "passed" : ""}">${s.correct}/${s.total}</div>
      </div>`;
  }

  chartEl.innerHTML = html;
}

// ─── Accept / alternative ──────────────────────────────────────────────────

$("placement-btn-accept").addEventListener("click", async () => {
  await _deps.loadDashboard();
});

$("placement-btn-alt").addEventListener("click", async () => {
  if (!result?.alternativeLevel) return;

  $("placement-btn-alt").disabled = true;
  $("placement-btn-alt").textContent = "Tallennetaan...";

  try {
    await apiFetch(`${API}/api/placement/choose-level`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ level: result.alternativeLevel }),
    });
  } catch { /* silent */ }

  await _deps.loadDashboard();
});

// ─── Keyboard shortcuts ────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  if (!$("screen-placement-test")?.classList.contains("active")) return;
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

  const numToLetter = { "1": "A", "2": "B", "3": "C", "4": "D" };
  const key = numToLetter[e.key] || e.key.toUpperCase();

  if (["A", "B", "C", "D"].includes(key)) {
    const btn = $("placement-options")?.querySelector(`.placement-option[data-letter="${key}"]:not(.disabled)`);
    if (btn) btn.click();
  }
});
