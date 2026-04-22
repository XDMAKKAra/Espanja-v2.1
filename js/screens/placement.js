import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch } from "../api.js";
import { track } from "../analytics.js";
import { showPathFromPlacement } from "./onboarding.js";

let _deps = {};
export function initPlacement({ loadDashboard }) {
  _deps = { loadDashboard };
  wireKeyboardShortcuts();
  wireResultButtons();
}

// ─── State ─────────────────────────────────────────────────────────────────

let questions = [];
let currentIdx = 0;
let answers = []; // { id, level, selected }
let result = null;
let startedAt = 0;

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

// ─── Landing diagnostic seed ───────────────────────────────────────────────

function readDiagnosticSeed() {
  try {
    const raw = localStorage.getItem("puheo_diagnostic_v1");
    if (!raw) return null;
    const seed = JSON.parse(raw);
    if (!seed || !Array.isArray(seed.answers)) return null;
    return seed;
  } catch {
    return null;
  }
}

// ─── Public: start placement ───────────────────────────────────────────────

// Called from S1 welcome CTA. Previously showed an intro screen (#screen-
// placement-intro); Pass 4 Commit 3 inlined placement so the first item is
// the first screen the student sees. The name is kept for call-site
// compatibility with screens/auth.js and screens/onboarding.js.
export async function showPlacementIntro() {
  const seed = readDiagnosticSeed();
  startedAt = Date.now();
  track("placement_started", {
    diagnostic_seed: !!seed,
    seed_items: seed ? seed.answers.length : 0,
  });
  await startTest();
}

export async function startPlacementFromRetake() {
  startedAt = Date.now();
  track("placement_started", { diagnostic_seed: false, retake: true });
  await startTest();
}

async function startTest() {
  renderLoadingItem();
  show("screen-placement-test");
  const ok = await fetchQuestions();
  if (!ok) {
    renderApiFailure();
    return;
  }
  renderQuestion();
}

// ─── Fetch questions ───────────────────────────────────────────────────────

async function fetchQuestions() {
  try {
    const res = await apiFetch(`${API}/api/placement/questions`, { headers: authHeader() });
    if (!res.ok) throw new Error("status " + res.status);
    const data = await res.json();
    questions = data.questions || [];
    currentIdx = 0;
    answers = [];
    result = null;
    return questions.length > 0;
  } catch (err) {
    track("placement_api_failed", { phase: "fetch", error: String(err?.message || err).slice(0, 60) });
    return false;
  }
}

// ─── Render loading / error states ─────────────────────────────────────────

function renderLoadingItem() {
  $("placement-level-badge").textContent = "…";
  $("placement-counter").textContent = "";
  $("placement-progress-fill").style.width = "0%";
  $("placement-question").textContent = "Valmistellaan tasotestiä…";
  $("placement-options").innerHTML = "";
  $("placement-explanation")?.classList.add("hidden");
}

function renderApiFailure() {
  $("placement-level-badge").textContent = "Virhe";
  $("placement-counter").textContent = "";
  $("placement-progress-fill").style.width = "0%";
  $("placement-question").textContent = "Yhteys katkesi. Yritä uudelleen.";
  const opts = $("placement-options");
  opts.innerHTML = "";
  const retry = document.createElement("button");
  retry.className = "btn-primary";
  retry.textContent = "Yritä uudelleen →";
  retry.addEventListener("click", async () => {
    retry.disabled = true;
    retry.textContent = "Yhdistetään…";
    const ok = await fetchQuestions();
    if (ok) renderQuestion();
    else renderBFallback();
  });
  opts.appendChild(retry);
}

async function renderBFallback() {
  // Second failure — assume level B and continue to dashboard.
  $("placement-question").textContent = "Emme saaneet yhteyttä. Arvaamme tasoksi B — tarkennamme myöhemmin.";
  const opts = $("placement-options");
  opts.innerHTML = "";
  const go = document.createElement("button");
  go.className = "btn-primary";
  go.textContent = "Jatka →";
  go.addEventListener("click", async () => {
    go.disabled = true;
    try {
      await apiFetch(`${API}/api/placement/choose-level`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ level: "B" }),
      });
    } catch { /* silent */ }
    track("placement_completed", { level: "B", items: 0, duration_ms: Date.now() - startedAt, fallback: true });
    window._placementDone = true;
    await _deps.loadDashboard();
  });
  opts.appendChild(go);
}

// ─── Render question ───────────────────────────────────────────────────────

function renderQuestion() {
  const q = questions[currentIdx];
  let answered = false;

  const LEVEL_LABELS = { A: "Taso A", B: "Taso B", C: "Taso C", M: "Taso M" };
  $("placement-level-badge").textContent = LEVEL_LABELS[q.level] || `Taso ${q.level}`;
  $("placement-counter").textContent = `${currentIdx + 1} / ${questions.length}`;
  $("placement-progress-fill").style.width = `${(currentIdx / questions.length) * 100}%`;

  $("placement-context")?.classList.add("hidden");
  $("placement-question").textContent = q.question;

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

      answers.push({ id: q.id, level: q.level, selected: letter });
      track("placement_answer", {
        level: q.level,
        item_id: q.id,
        index: currentIdx,
        time_ms: Date.now() - startedAt,
      });

      optionsEl.querySelectorAll(".placement-option").forEach(o => o.classList.add("disabled"));
      btn.classList.add("selected");

      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          currentIdx++;
          renderQuestion();
        } else {
          submitAnswers();
        }
      }, 500);
    });
    optionsEl.appendChild(btn);
  });

  $("placement-explanation")?.classList.add("hidden");
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
    track("placement_completed", {
      level: result.placementLevel,
      items: answers.length,
      duration_ms: Date.now() - startedAt,
    });
    showResults();
  } catch (err) {
    track("placement_api_failed", { phase: "submit", error: String(err?.message || err).slice(0, 60) });
    $("placement-question").textContent = "Jokin meni pieleen";
    $("placement-options").innerHTML = '<button class="btn-primary" onclick="location.reload()">Yritä uudelleen</button>';
  }
}

// ─── Results screen ────────────────────────────────────────────────────────

function showResults() {
  const pl = result.placementLevel;

  $("placement-results-grade").textContent = pl;
  $("placement-results-sub").textContent = `Kartoituksen perusteella aloitat ${pl}-tasolta`;

  renderBarChart(result.scoreByLevel, result.answers);

  $("placement-accept-level").textContent = pl;

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

    const levelAnswers = (gradedAnswers || []).filter(a => a.level === level);
    let marks = "";
    if (levelAnswers.length > 0) {
      marks = levelAnswers.map(a =>
        `<span class="placement-chart-mark ${a.correct ? "correct" : "wrong"}">${a.correct ? "✓" : "✗"}</span>`
      ).join("");
    } else {
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

// ─── Accept / alternative / keyboard ───────────────────────────────────────

function wireResultButtons() {
  $("placement-btn-accept")?.addEventListener("click", () => {
    showPathFromPlacement(result);
  });

  $("placement-btn-alt")?.addEventListener("click", async () => {
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

    showPathFromPlacement({ ...result, placementLevel: result.alternativeLevel });
  });
}

function wireKeyboardShortcuts() {
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
}
