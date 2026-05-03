// TODO(loading): adopt showSkeleton / showFetchError from js/ui/loading.js (Commit 9 follow-up)
// ─── Adaptive level system — frontend ────────────────────────────────────────
import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch, retryable } from "../api.js";
import { state } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";
import { renderExercise } from "./exerciseRenderer.js";
import { toUnified } from "../../lib/exerciseTypes.js";
import { reportMcAdvisory } from "../features/mcAdvisory.js";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

let _deps = {};
export function initAdaptive({ loadDashboard }) {
  _deps = { loadDashboard };
}

// Current mastery test state
let _masteryState = {
  exercises: [],
  current: 0,
  answers: [],
  attemptId: null,
  fromLevel: null,
  toLevel: null,
};

const LEVEL_NAMES = {
  I: "Improbatur", A: "Approbatur", B: "Lubenter approbatur",
  C: "Cum laude", M: "Magna cum laude", E: "Eximia", L: "Laudatur",
};

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard card: fetch & render adaptive status
// ═══════════════════════════════════════════════════════════════════════════

export async function renderAdaptiveCard(mode = "vocab") {
  const card = $("dash-adaptive-card");
  if (!card) return;

  try {
    const res = await apiFetch(`${API}/api/adaptive/status?mode=${mode}`, {
      headers: authHeader(),
    });
    if (!res.ok) { card.classList.add("hidden"); return; }

    const data = await res.json();
    card.classList.remove("hidden");
    card.className = "dash-adaptive-card";

    if (data.status === "ready_for_mastery_test") {
      card.classList.add("ready");
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:20px">🎯</span>
          <div>
            <div style="font-weight:600;font-size:14px">Valmis ${data.nextLevel}-tasolle?</div>
            <div style="font-size:12px;color:var(--ink-soft)">${data.reason}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-primary btn-sm" id="btn-mastery-start">Tasokoe ▸</button>
          <button class="btn-secondary btn-sm" id="btn-mastery-dismiss">Ei vielä</button>
        </div>`;
      $("btn-mastery-start").addEventListener("click", () => startMasteryTest(mode));
      $("btn-mastery-dismiss").addEventListener("click", () => dismissMasteryTest(mode));

    } else if (data.status === "on_cooldown") {
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:18px">⏳</span>
          <div>
            <div style="font-weight:600;font-size:13px">Tasokoe</div>
            <div style="font-size:12px;color:var(--ink-soft)">${data.reason}</div>
          </div>
        </div>`;

    } else if (data.status === "pending" && data.progress) {
      const p = data.progress;
      card.classList.add("level-progress-card");
      card.innerHTML = `
        <p class="lpc-eyebrow">Tasosi edistyminen</p>
        <h3 class="lpc-title">Matka tasolle ${data.nextLevel}</h3>
        <p class="lpc-hint">Kun täytät kaikki neljä tavoitetta, sinut päivitetään ${data.nextLevel}-tasolle.</p>
        <div class="lpc-grid">
          ${progressRow("Kysymyksiä", p.questionsDone, p.questionsNeeded)}
          ${progressRow("Sessioita", p.sessionsDone, p.sessionsNeeded)}
          ${progressRow("Päiviä tasolla", p.daysAtLevel, p.daysNeeded)}
          ${progressRow("Keskiarvo", p.avgPct, p.avgPctNeeded, "%")}
        </div>
        <span class="lpc-badge" aria-hidden="true">${data.currentLevel} → ${data.nextLevel}</span>`;

    } else if (data.status === "stable" && data.currentLevel === "L") {
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:18px">🏆</span>
          <div style="font-size:13px;font-weight:600">${data.reason}</div>
        </div>`;

    } else {
      card.classList.add("hidden");
    }
  } catch {
    card.classList.add("hidden");
  }
}

function progressRow(label, current, target, suffix = "") {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done = current >= target;
  return `
    <div class="lpc-metric${done ? " is-done" : ""}">
      <div class="lpc-metric__row">
        <span class="lpc-metric__label">${label}</span>
        <span class="lpc-metric__num">${current}${suffix}/${target}${suffix}</span>
      </div>
      <div class="lpc-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}">
        <div class="lpc-bar__fill" style="width:${pct}%"></div>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Dismiss mastery test prompt
// ═══════════════════════════════════════════════════════════════════════════

async function dismissMasteryTest(mode) {
  const btn = $("btn-mastery-dismiss");
  if (btn) { btn.disabled = true; btn.textContent = "..."; }

  try {
    await apiFetch(`${API}/api/adaptive/dismiss`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ mode }),
    });
  } catch { /* ignore */ }

  // Re-render card
  renderAdaptiveCard(mode);
}

// ═══════════════════════════════════════════════════════════════════════════
// Mastery test flow
// ═══════════════════════════════════════════════════════════════════════════

async function startMasteryTest(mode) {
  showLoading("Luodaan tasokoe...");

  try {
    const res = await apiFetch(`${API}/api/adaptive/mastery-test/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tasokokeen luonti epäonnistui");

    _masteryState = {
      exercises: data.exercises,
      current: 0,
      answers: [],
      attemptId: data.attemptId,
      fromLevel: data.fromLevel,
      toLevel: data.toLevel,
    };

    renderMasteryQuestion();
    show("screen-mastery-test");
  } catch (err) {
    showLoadingError(err.message, () => startMasteryTest(mode));
  }
}

function renderMasteryQuestion() {
  const { exercises, current } = _masteryState;
  const ex = exercises[current];
  if (!ex) return;

  const total = exercises.length;
  $("mastery-counter").textContent = `${current + 1} / ${total}`;
  $("mastery-progress-fill").style.width = `${((current) / total) * 100}%`;
  $("mastery-round-badge").textContent = `Tasokoe: ${_masteryState.fromLevel} → ${_masteryState.toLevel}`;

  const typeLabels = {
    context: "Konteksti", translate: "Käännös", gap: "Täydennä", meaning: "Sanasto",
  };
  $("mastery-label").textContent = typeLabels[ex.type] || "Kysymys";
  $("mastery-question").textContent = ex.question || "";

  const grid = $("mastery-options-grid");
  renderExercise(
    toUnified(ex, { topic: "mastery", skill_bucket: "vocab" }),
    grid,
    {
      onAnswer: ({ chosenIndex, correctIndex, isCorrect, button }) => {
        const optText = button.textContent;
        handleMasteryAnswer(button, optText, ex);
        reportMcAdvisory({ exerciseId: ex.id, chosenIndex, correctIndex, clientIsCorrect: isCorrect });
      },
    }
  );

  $("mastery-explanation-block").classList.add("hidden");
}

function handleMasteryAnswer(btn, selected, ex) {
  const grid = $("mastery-options-grid");
  const buttons = grid.querySelectorAll(".option-btn");
  buttons.forEach((b) => { b.disabled = true; });

  const selectedLetter = selected.trim()[0].toUpperCase();
  const correctLetter = (ex.correct || "").trim()[0].toUpperCase();
  const isCorrect = selectedLetter === correctLetter;

  _masteryState.answers.push({
    correct: isCorrect,
    isHigherLevel: !!ex.isHigherLevel,
  });

  // Highlight correct/wrong
  buttons.forEach((b) => {
    const letter = b.textContent.trim()[0].toUpperCase();
    if (letter === correctLetter) b.classList.add("correct");
    if (letter === selectedLetter && !isCorrect) btn.classList.add("wrong");
  });

  // Show explanation
  const expBlock = $("mastery-explanation-block");
  const expText = $("mastery-explanation-text");
  expText.textContent = ex.explanation || "";
  expBlock.classList.remove("hidden");
}

export function masteryNext() {
  _masteryState.current++;
  if (_masteryState.current >= _masteryState.exercises.length) {
    submitMasteryTest();
  } else {
    renderMasteryQuestion();
  }
}

async function submitMasteryTest() {
  showLoading("Arvioidaan tuloksia...");

  // Persist mastery answers — a blip at the submit boundary shouldn't wipe
  // the student's test attempt (Pass 6 C16).
  try { localStorage.setItem("puheo_mastery_pending", JSON.stringify({ ..._masteryState, at: Date.now() })); } catch {}

  try {
    const res = await retryable(() => apiFetch(`${API}/api/adaptive/mastery-test/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        attemptId: _masteryState.attemptId,
        answers: _masteryState.answers,
      }),
    }), { attempts: 3, baseDelayMs: 500 });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Virhe");
    try { localStorage.removeItem("puheo_mastery_pending"); } catch {}

    renderMasteryResults(data);
    show("screen-mastery-results");
  } catch (err) {
    showLoadingError(err.message, () => {
      if (_deps.loadDashboard) _deps.loadDashboard();
    });
  }
}

function renderMasteryResults({ passed, scorePct, higherLevelPct, newLevel }) {
  const content = $("mastery-result-content");

  if (passed) {
    content.innerHTML = `
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:48px;margin-bottom:12px">🎉</div>
        <h2 style="color:var(--success);margin-bottom:8px">Onneksi olkoon!</h2>
        <p style="font-size:15px;color:var(--ink-soft)">Olet nyt tasolla <strong>${newLevel}</strong> (${LEVEL_NAMES[newLevel] || newLevel})</p>
      </div>
      <div style="background:var(--surface);border-radius:var(--r-md);padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span>Kokonaistulos</span>
          <strong style="color:var(--success)">${scorePct}%</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span>${newLevel}-tason kysymykset</span>
          <strong style="color:var(--success)">${higherLevelPct}%</strong>
        </div>
      </div>
      <p style="font-size:13px;color:var(--ink-soft);text-align:center">Harjoitukset mukautuvat nyt uudelle tasolle.</p>`;
  } else {
    content.innerHTML = `
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:48px;margin-bottom:12px">💪</div>
        <h2 style="margin-bottom:8px">Ei mennyt läpi — vielä!</h2>
        <p style="font-size:15px;color:var(--ink-soft)">Jatka harjoittelua, pääset kyllä seuraavalle tasolle.</p>
      </div>
      <div style="background:var(--surface);border-radius:var(--r-md);padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span>Kokonaistulos</span>
          <strong>${scorePct}%</strong>
          <span style="font-size:11px;color:var(--ink-soft)">(vaaditaan 70%)</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span>Ylemmän tason kysymykset</span>
          <strong>${higherLevelPct}%</strong>
          <span style="font-size:11px;color:var(--ink-soft)">(vaaditaan 60%)</span>
        </div>
      </div>
      <p style="font-size:13px;color:var(--ink-soft);text-align:center">Voit yrittää uudelleen 3 päivän päästä.</p>`;
  }
}

export function masteryDone() {
  if (_deps.loadDashboard) _deps.loadDashboard();
}
