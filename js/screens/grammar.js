import { $, show } from "../ui/nav.js";
import { API, isLoggedIn } from "../api.js";
import { state } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";
import { GRAMMAR_TYPE_LABELS } from "./vocab.js";

let _deps = {};
export function initGrammar({ loadDashboard, saveProgress }) {
  _deps = { loadDashboard, saveProgress };
}

export async function loadGrammarDrill() {
  showLoading("Luodaan kielioppiharjoituksia...");

  try {
    const res = await fetch(`${API}/api/grammar-drill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: state.grammarTopic,
        level: state.grammarLevel,
        count: 6,
        language: state.language,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Harjoitusten luonti epäonnistui");
    if (!data.exercises?.length) throw new Error("No exercises");

    state.grammarExercises = data.exercises;
    state.grammarBankId = data.bankId || null;
    state.grammarCurrent = 0;
    state.grammarCorrect = 0;
    state.grammarErrors = [];

    renderGrammarExercise();
    show("screen-grammar");
  } catch (err) {
    showLoadingError(err.message, () => loadGrammarDrill());
  }
}

function renderGrammarExercise() {
  const ex = state.grammarExercises[state.grammarCurrent];
  const total = state.grammarExercises.length;

  $("gram-counter").textContent = `${state.grammarCurrent + 1} / ${total}`;
  $("gram-level-badge").textContent = state.grammarLevel;

  const exType = ex.type || "gap";
  const typeLabel = GRAMMAR_TYPE_LABELS[exType] || "Kielioppi";
  $("gram-topic-badge").textContent = typeLabel;
  $("gram-topic-badge").className = `ex-round-badge ex-type-badge type-${exType}`;

  $("gram-progress-fill").style.width = `${(state.grammarCurrent / total) * 100}%`;
  $("gram-instruction").textContent = ex.instruction;

  const sentenceEl = $("gram-sentence");
  if (exType === "correction") {
    sentenceEl.innerHTML = `<span style="text-decoration: underline wavy var(--wrong); text-underline-offset: 4px">${ex.sentence}</span>`;
  } else if (exType === "transform") {
    sentenceEl.innerHTML = `<span style="color: var(--gold)">${ex.sentence}</span>`;
  } else {
    sentenceEl.textContent = ex.sentence;
  }

  $("gram-rule-tag").textContent = "";
  $("gram-explanation-block").classList.add("hidden");

  const grid = $("gram-options-grid");
  grid.innerHTML = "";

  if (exType === "transform" || exType === "pick_rule") {
    grid.style.gridTemplateColumns = "1fr";
  } else {
    grid.style.gridTemplateColumns = "1fr 1fr";
  }

  ex.options.forEach((opt) => {
    const letter = opt.trim()[0];
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleGrammarAnswer(letter, btn, ex));
    grid.appendChild(btn);
  });
}

function handleGrammarAnswer(chosen, clickedBtn, ex) {
  const isCorrect = chosen === ex.correct;

  if (isCorrect) {
    clickedBtn.classList.add("correct");
    state.grammarCorrect++;
  } else {
    clickedBtn.classList.add("wrong");
    document.querySelectorAll("#gram-options-grid .option-btn").forEach((b) => {
      if (b.textContent.trim()[0] === ex.correct) b.classList.add("correct");
    });
    state.grammarErrors.push(ex.rule || "kielioppi");
  }

  document.querySelectorAll("#gram-options-grid .option-btn").forEach((b) => (b.disabled = true));
  $("gram-rule-tag").textContent = ex.rule || "";
  $("gram-explanation-text").textContent = ex.explanation;
  $("gram-explanation-block").classList.remove("hidden");

  const reportBtn = $("btn-report-gram");
  if (state.grammarBankId) {
    reportBtn.classList.remove("hidden");
    reportBtn.disabled = false;
    reportBtn.textContent = "⚠ Virhe tehtävässä";
  } else {
    reportBtn.classList.add("hidden");
  }
}

$("gram-btn-next").addEventListener("click", () => {
  state.grammarCurrent++;
  if (state.grammarCurrent >= state.grammarExercises.length) {
    showGrammarResults();
  } else {
    renderGrammarExercise();
  }
});

function showGrammarResults() {
  const total = state.grammarExercises.length;
  $("gram-score-display").textContent = `${state.grammarCorrect}/${total}`;
  $("gram-score-text").textContent = `${state.grammarCorrect} / ${total} oikein`;

  const errSummary = $("gram-error-summary");
  errSummary.innerHTML = "";
  const uniqueErrors = [...new Set(state.grammarErrors)];
  if (uniqueErrors.length > 0) {
    const label = document.createElement("p");
    label.style.cssText =
      "font-family:var(--font-mono);font-size:11px;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;";
    label.textContent = "Harjoittele lisää:";
    errSummary.appendChild(label);
    uniqueErrors.forEach((err) => {
      const tag = document.createElement("span");
      tag.className = "gram-error-tag";
      tag.textContent = err;
      errSummary.appendChild(tag);
    });
  }

  _deps.saveProgress({
    mode: "grammar",
    level: state.grammarLevel,
    scoreCorrect: state.grammarCorrect,
    scoreTotal: state.grammarExercises.length,
    ytlGrade: null,
  });
  show("screen-grammar-results");
}

$("gram-btn-restart").addEventListener("click", () =>
  isLoggedIn() ? _deps.loadDashboard() : show("screen-start")
);
