import { $, show } from "../ui/nav.js";
import { API, isLoggedIn } from "../api.js";
import { state, LEVELS, BATCH_SIZE, MAX_BATCHES } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";
import { srPop, srAddWrong, srMarkCorrect, srReview, srGetDue } from "../features/spacedRepetition.js";
import { authHeader, apiFetch } from "../api.js";

let _deps = {};
export function initVocab({ loadDashboard, shareResult, saveProgress }) {
  _deps = { loadDashboard, shareResult, saveProgress };
}

export const VOCAB_TYPE_LABELS = {
  context: "Konteksti",
  translate: "Käännös",
  gap: "Täydennä",
  meaning: "Sanasto",
};

export const GRAMMAR_TYPE_LABELS = {
  gap: "Täydennä",
  correction: "Virheen korjaus",
  transform: "Muunna",
  pick_rule: "Tunnista sääntö",
};

/**
 * Start a review-only session with due SR cards.
 */
export async function startReviewSession() {
  showLoading("Haetaan kertauskortteja...");

  try {
    const dueCards = await srGetDue(12, state.language);
    if (!dueCards.length) {
      showLoadingError("Ei kertauskortteja juuri nyt! Harjoittele ensin uusia sanoja.", () => {
        show("screen-start");
      });
      return;
    }

    state.mode = "vocab";
    state.exercises = dueCards;
    state.current = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
    state.batchCorrect = 0;
    state.batchNumber = 1;
    state.bankId = null;
    state._reviewMode = true;
    state.sessionStartTime = Date.now();

    renderExercise();
    show("screen-exercise");
  } catch (err) {
    showLoadingError(err.message, () => startReviewSession());
  }
}

export async function loadNextBatch() {
  state.batchNumber++;
  state.batchCorrect = 0;
  state.current = 0;
  state._reviewMode = false;

  showLoading(`Luodaan kierros ${state.batchNumber}/${MAX_BATCHES}...`);

  try {
    const srItems = state.batchNumber === 1 ? srPop(2) : [];

    const freshCount = BATCH_SIZE - srItems.length;
    const res = await fetch(`${API}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: state.level, topic: state.topic, count: freshCount, language: state.language }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tehtävien luonti epäonnistui");
    if (!data.exercises?.length) throw new Error("No exercises");

    state.exercises = [...srItems, ...data.exercises];
    state.bankId = data.bankId || null;
    renderExercise();
    show("screen-exercise");
  } catch (err) {
    showLoadingError(err.message, () => loadNextBatch());
  }
}

function renderExercise() {
  const ex = state.exercises[state.current];
  const questionNum = (state.batchNumber - 1) * BATCH_SIZE + state.current + 1;
  const totalQuestions = MAX_BATCHES * BATCH_SIZE;

  $("ex-counter").textContent = `Q ${questionNum} / ${totalQuestions}`;
  $("ex-round").textContent = ex._sr ? "🔁 Kertaus" : `Kierros ${state.batchNumber}/${MAX_BATCHES}`;
  $("ex-level-badge").textContent = state.level;
  $("progress-fill").style.width = `${((questionNum - 1) / totalQuestions) * 100}%`;
  $("question-text").textContent = ex.question;

  const typeBadge = $("ex-type-badge");
  const exType = ex.type || "meaning";
  const typeLabel = VOCAB_TYPE_LABELS[exType] || "Sanasto";
  if (typeBadge) {
    typeBadge.textContent = typeLabel;
    typeBadge.className = `ex-type-badge type-${exType}`;
    typeBadge.classList.remove("hidden");
  }

  const contextEl = $("ex-context-sentence");
  if (contextEl) {
    if (ex.type === "context" && ex.context) {
      contextEl.textContent = ex.context;
      contextEl.classList.remove("hidden");
    } else {
      contextEl.classList.add("hidden");
    }
  }

  const labelEl = $("question-label");
  if (labelEl) {
    const labels = {
      context: "Mitä sana tarkoittaa tässä yhteydessä?",
      translate: "Valitse oikea käännös",
      gap: "Täydennä lause",
      meaning: "¿Qué significa?",
    };
    labelEl.textContent = labels[exType] || "¿Qué significa?";
  }

  const grid = $("options-grid");
  grid.innerHTML = "";

  ex.options.forEach((opt) => {
    const letter = opt.trim()[0];
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(letter, btn));
    grid.appendChild(btn);
  });

  $("explanation-block").classList.add("hidden");
  $("explanation-text").textContent = "";
}

function handleAnswer(chosen, clickedBtn) {
  const ex = state.exercises[state.current];
  const isCorrect = chosen === ex.correct;

  if (isCorrect) {
    state.totalCorrect++;
    state.batchCorrect++;
    clickedBtn.classList.add("correct");
  } else {
    clickedBtn.classList.add("wrong");
    document.querySelectorAll(".option-btn").forEach((btn) => {
      if (btn.textContent.trim()[0] === ex.correct) btn.classList.add("correct");
    });
  }

  state.totalAnswered++;
  state._lastCorrect = isCorrect;
  document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));
  $("explanation-text").textContent = ex.explanation;
  $("explanation-block").classList.remove("hidden");

  // Show SM-2 grade buttons
  const gradeRow = $("sr-grade-row");
  if (gradeRow) {
    gradeRow.classList.remove("hidden");
    // Pre-select based on answer
    gradeRow.querySelectorAll(".sr-grade-btn").forEach((btn) => {
      btn.classList.remove("active");
      btn.disabled = false;
    });
    // Auto-select: wrong=Again(0), correct=Good(4)
    const autoGrade = isCorrect ? 4 : 0;
    const autoBtn = gradeRow.querySelector(`.sr-grade-btn[data-grade="${autoGrade}"]`);
    if (autoBtn) autoBtn.classList.add("active");
    state._srGrade = autoGrade;
  }

  const reportBtn = $("btn-report-vocab");
  if (state.bankId) {
    reportBtn.classList.remove("hidden");
    reportBtn.disabled = false;
    reportBtn.textContent = "⚠ Virhe tehtävässä";
  } else {
    reportBtn.classList.add("hidden");
  }
}

$("btn-next").addEventListener("click", () => {
  // Submit SR review with selected grade
  const ex = state.exercises[state.current];
  const grade = state._srGrade ?? (state._lastCorrect ? 4 : 0);
  srReview(ex, grade, state.language);

  // Hide grade row
  const gradeRow = $("sr-grade-row");
  if (gradeRow) gradeRow.classList.add("hidden");

  state.current++;
  if (state.current >= state.exercises.length) {
    endBatch();
  } else {
    renderExercise();
  }
});

// SM-2 grade button clicks
const gradeRow = $("sr-grade-row");
if (gradeRow) {
  gradeRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".sr-grade-btn");
    if (!btn) return;
    gradeRow.querySelectorAll(".sr-grade-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state._srGrade = parseInt(btn.dataset.grade);
  });
}

function endBatch() {
  if (state.batchNumber >= MAX_BATCHES) {
    showVocabResults();
    return;
  }

  const levelIdx = LEVELS.indexOf(state.level);
  const pct = state.batchCorrect / BATCH_SIZE;

  let newLevelIdx = levelIdx;
  let arrowChar = "→";
  let arrowClass = "same";
  let subText = `${state.batchCorrect}/${BATCH_SIZE} oikein`;

  if (pct >= 0.75) {
    if (levelIdx < LEVELS.length - 1) {
      newLevelIdx = levelIdx + 1;
      arrowChar = "↑";
      arrowClass = "up";
      subText += " · taso nousee!";
    } else {
      subText += " · huipputaso saavutettu!";
    }
  } else if (state.batchCorrect === 0) {
    if (levelIdx > 0) {
      newLevelIdx = levelIdx - 1;
      arrowChar = "↓";
      arrowClass = "down";
      subText += " · taso laskee";
    } else {
      subText += " · jatketaan harjoittelua!";
    }
  } else {
    subText += ` · pysytään tasolla ${LEVELS[levelIdx]}`;
  }

  state.level = LEVELS[newLevelIdx];

  if (LEVELS.indexOf(state.level) > LEVELS.indexOf(state.peakLevel)) {
    state.peakLevel = state.level;
  }

  const arrowEl = $("level-arrow");
  arrowEl.textContent = arrowChar;
  arrowEl.className = "level-transition-arrow " + arrowClass;

  const levelDisplay = $("level-new");
  levelDisplay.className = "level-transition-display";
  if (arrowClass === "up") levelDisplay.classList.add("level-up");
  else if (arrowClass === "down") levelDisplay.classList.add("level-down");
  levelDisplay.textContent = state.level;

  $("level-sub").textContent = subText;
  $("level-next-round").textContent = state.batchNumber + 1;

  show("screen-level");
}

$("btn-continue").addEventListener("click", () => loadNextBatch());

async function showVocabResults() {
  showLoading("Lasketaan arvosanaa...");

  try {
    const res = await fetch(`${API}/api/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correct: state.totalCorrect,
        total: state.totalAnswered,
        level: state.peakLevel,
      }),
    });
    const data = await res.json();

    $("grade-display").textContent = data.grade;
    $("score-text").textContent = `${data.correct} / ${data.total} oikein · ${data.pct}%`;

    if (state.sessionStartTime) {
      const elapsed = Math.round((Date.now() - state.sessionStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      const timerEl = $("results-timer");
      if (timerEl) {
        timerEl.textContent = mins > 0 ? `⏱ ${mins} min ${secs} s` : `⏱ ${secs} s`;
        timerEl.classList.remove("hidden");
      }
    }

    const journey =
      state.startLevel === state.peakLevel
        ? `Taso: ${state.startLevel}`
        : `${state.startLevel} → ${state.peakLevel}`;
    $("journey-text").textContent = journey;

    const bannerEl = $("improvement-banner");
    if (bannerEl) {
      try {
        const prevGrade = localStorage.getItem("kielio_last_vocab_grade");
        const GRADE_ORDER_LOCAL = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };
        if (prevGrade && (GRADE_ORDER_LOCAL[data.grade] ?? -1) > (GRADE_ORDER_LOCAL[prevGrade] ?? -1)) {
          bannerEl.textContent = `🎉 Parempi kuin viime kerralla! ${prevGrade} → ${data.grade}`;
          bannerEl.classList.remove("hidden");
        } else {
          bannerEl.classList.add("hidden");
        }
      } catch { bannerEl.classList.add("hidden"); }
      localStorage.setItem("kielio_last_vocab_grade", data.grade);
    }

    document.querySelectorAll(".grade-scale span").forEach((s) => {
      s.classList.remove("highlight-grade");
      if (s.textContent === data.grade) s.classList.add("highlight-grade");
    });

    _deps.saveProgress({
      mode: "vocab",
      level: state.peakLevel,
      scoreCorrect: state.totalCorrect,
      scoreTotal: state.totalAnswered,
      ytlGrade: data.grade,
    });

    show("screen-results");
  } catch (err) {
    showLoadingError("Virhe arvosanan laskemisessa: " + err.message, () => showVocabResults());
  }
}

$("btn-restart").addEventListener("click", () =>
  isLoggedIn() ? _deps.loadDashboard() : show("screen-start")
);

$("btn-share-vocab").addEventListener("click", () => {
  const grade = $("grade-display").textContent;
  const score = $("score-text").textContent;
  _deps.shareResult(`Harjoittelin espanjan yo-koetta Kieliossa 📚\nArvosana: ${grade} · ${score}\nhttps://kielio.fi`);
});
