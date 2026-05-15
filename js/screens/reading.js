import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, retryable } from "../api.js";
import { state, apiLang } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";
import { generateCoachLine, countUp } from "./mode-page.js";
import { celebrateScore } from "../features/celebrate.js";
import { generateExerciseShareCard } from "../features/shareCard.js";
import { getLessonContext } from "../lib/lessonContext.js";

function fmtElapsedRd(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}:${String(r).padStart(2, "0")}` : `${m} min`;
}

function escapeHtmlRd(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let _deps = {};
export function initReading({ loadDashboard, saveProgress, showProUpsell }) {
  _deps = { loadDashboard, saveProgress, showProUpsell };
}

export async function loadReadingTask() {
  showLoading("Luodaan luetun ymmärtämistehtävää...");

  try {
    const lessonCtx = getLessonContext();
    const res = await retryable(() => fetch(`${API}/api/reading-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        level: state.readingLevel,
        topic: state.readingTopic,
        language: apiLang(),
        recentlyShown: state.recentReadingTitles || [],
        ...(lessonCtx ? { lesson: lessonCtx } : {}),
      }),
    }), { attempts: 3, baseDelayMs: 500 });
    if (res.status === 403) { _deps.showProUpsell(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tehtävän luonti epäonnistui");
    if (!data.reading) throw new Error("No reading");

    state.currentReading = data.reading;
    state.readingBankId = data.bankId || null;
    state.readingQIndex = 0;
    state.readingScore = 0;

    // Track titles so the next generate call can ask the model for a
    // genuinely different text. Cap at 10 most-recent — a smaller universe
    // than vocab lemmas, and prompt budget is tight on the reading route.
    if (data.reading.title) {
      state.recentReadingTitles = [
        ...(state.recentReadingTitles || []),
        String(data.reading.title).toLowerCase().trim(),
      ].slice(-10);
    }

    renderReadingText();
    show("screen-reading");
  } catch (err) {
    showLoadingError(err.message, () => loadReadingTask());
  }
}

function renderReadingText() {
  const r = state.currentReading;
  $("reading-title").textContent = r.title;
  $("reading-source-tag").textContent = r.source || "Texto";
  $("reading-level-badge").textContent = state.readingLevel;
  $("reading-text-body").textContent = r.text;
  $("reading-text-ref-content").textContent = r.text;

  $("reading-sub-text").classList.remove("hidden");
  $("reading-sub-questions").classList.add("hidden");
}

$("btn-start-questions").addEventListener("click", () => {
  $("reading-sub-text").classList.add("hidden");
  $("reading-sub-questions").classList.remove("hidden");
  renderReadingQuestion();
});

function renderReadingQuestion() {
  const q = state.currentReading.questions[state.readingQIndex];
  const total = state.currentReading.questions.length;

  $("reading-q-counter").textContent = `${state.readingQIndex + 1} / ${total}`;
  $("reading-progress-fill").style.width = `${(state.readingQIndex / total) * 100}%`;
  $("reading-explanation-block").classList.add("hidden");
  $("reading-btn-next").style.display = "";
  const readReportBtn = $("btn-report-reading");
  if (state.readingBankId) {
    readReportBtn.classList.remove("hidden");
    readReportBtn.disabled = false;
    readReportBtn.textContent = "⚠ Virhe tehtävässä";
  } else {
    readReportBtn.classList.add("hidden");
  }

  $("reading-options-container").classList.add("hidden");
  $("reading-tf-container").classList.add("hidden");
  $("reading-short-container").classList.add("hidden");

  document.querySelectorAll(".reading-self-grade").forEach((el) => el.remove());

  if (q.type === "multiple_choice") {
    $("reading-q-type").textContent = "Monivalinta";
    $("reading-question-text").textContent = q.question;
    $("reading-options-container").classList.remove("hidden");
    renderReadingOptions(q);
  } else if (q.type === "true_false") {
    $("reading-q-type").textContent = "Oikein / Väärin";
    $("reading-question-text").textContent = q.statement;
    $("reading-tf-container").classList.remove("hidden");
    setupTrueFalse(q);
  } else if (q.type === "short_answer") {
    $("reading-q-type").textContent = "Lyhyt vastaus";
    $("reading-question-text").textContent = q.question;
    $("reading-short-container").classList.remove("hidden");
    setupShortAnswer(q);
  }
}

function renderReadingOptions(q) {
  const grid = $("reading-options-grid");
  grid.innerHTML = "";
  q.options.forEach((opt) => {
    const letter = opt.trim()[0];
    const text = opt.replace(/^[A-D]\)\s*/, "").trim();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ex-option";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");

    const lSpan = document.createElement("span");
    lSpan.className = "ex-option__l";
    lSpan.textContent = letter;
    const tSpan = document.createElement("span");
    tSpan.className = "ex-option__t";
    tSpan.textContent = text;
    btn.append(lSpan, tSpan);

    btn.addEventListener("click", () => {
      const isCorrect = letter === q.correct;
      if (isCorrect) {
        btn.classList.add("is-correct");
        state.readingScore++;
      } else {
        btn.classList.add("is-wrong");
        grid.querySelectorAll(".ex-option").forEach((b) => {
          const bLetter = b.querySelector(".ex-option__l")?.textContent;
          if (bLetter === q.correct) b.classList.add("is-correct");
        });
      }
      grid.querySelectorAll(".ex-option").forEach((b) => {
        b.disabled = true;
        b.classList.add("is-disabled");
      });
      $("reading-explanation-text").textContent = q.explanation;
      $("reading-explanation-block").classList.remove("hidden");
    });
    grid.appendChild(btn);
  });
}

function setupTrueFalse(q) {
  const trueBtn = $("tf-true");
  const falseBtn = $("tf-false");
  trueBtn.className = "tf-btn";
  falseBtn.className = "tf-btn";
  trueBtn.disabled = false;
  falseBtn.disabled = false;

  const handleTF = (chosen) => {
    const isCorrect = chosen === q.correct;
    if (isCorrect) {
      (chosen ? trueBtn : falseBtn).classList.add("correct");
      state.readingScore++;
    } else {
      (chosen ? trueBtn : falseBtn).classList.add("wrong");
      (chosen ? falseBtn : trueBtn).classList.add("correct");
    }
    trueBtn.disabled = true;
    falseBtn.disabled = true;
    $("reading-explanation-text").textContent =
      `${q.explanation}\n\nTekstistä: "${q.justification}"`;
    $("reading-explanation-block").classList.remove("hidden");
  };

  trueBtn.onclick = () => handleTF(true);
  falseBtn.onclick = () => handleTF(false);
}

function setupShortAnswer(q) {
  const input = $("reading-short-input");
  input.value = "";
  const submitBtn = $("reading-short-submit");

  submitBtn.onclick = () => {
    const answer = input.value.trim();
    if (!answer) return;

    $("reading-short-container").classList.add("hidden");
    $("reading-btn-next").style.display = "none";

    $("reading-explanation-text").innerHTML =
      `<strong>Mallivastaus:</strong> ${q.acceptedAnswers[0]}<br><br>` +
      `<span style="color:var(--ink-soft);font-size:12px">${q.explanation}</span>`;
    $("reading-explanation-block").classList.remove("hidden");

    const row = document.createElement("div");
    row.className = "reading-self-grade";
    row.innerHTML = `<button class="reading-self-correct">✓ Vastasin oikein</button><button class="reading-self-wrong">✗ En saanut oikein</button>`;
    $("reading-explanation-block").appendChild(row);

    row.querySelector(".reading-self-correct").onclick = () => {
      state.readingScore++;
      row.remove();
      $("reading-btn-next").style.display = "";
    };
    row.querySelector(".reading-self-wrong").onclick = () => {
      row.remove();
      $("reading-btn-next").style.display = "";
    };
  };
}

$("reading-btn-next").addEventListener("click", () => {
  state.readingQIndex++;
  if (state.readingQIndex >= state.currentReading.questions.length) {
    showReadingResults();
  } else {
    renderReadingQuestion();
  }
});

function showReadingResults() {
  const total = state.currentReading.questions.length;

  // L-PLAN-3 — curriculum lesson active → hand off to lessonResults.
  const lessonCtx = getLessonContext();
  if (lessonCtx) {
    // Reading mode tracks a single aggregate score (state.readingScore) — we
    // don't have per-question student/correct strings, so we send an empty
    // wrongAnswers list and let the AI work from score alone.
    try {
      _deps.saveProgress({
        mode: "reading",
        level: state.readingLevel,
        scoreCorrect: state.readingScore,
        scoreTotal: total,
        ytlGrade: null,
      });
    } catch { /* tracked downstream */ }
    import("./lessonResults.js").then((m) => m.showLessonResults({
      kurssiKey: lessonCtx.kurssiKey,
      lessonIndex: lessonCtx.lessonIndex,
      lessonFocus: lessonCtx.lessonFocus,
      lessonType: lessonCtx.lessonType,
      scoreCorrect: state.readingScore,
      scoreTotal: total,
      wrongAnswers: [],
    })).catch(() => { /* fall through */ });
    return;
  }

  $("reading-score-display").textContent = `${state.readingScore}/${total}`;
  $("reading-score-text").textContent = `${state.readingScore} / ${total} oikein`;

  const pct = state.readingScore / total;
  let fb;
  if (pct === 1)      fb = "Erinomainen! Kaikki oikein.";
  else if (pct >= 0.75) fb = "Hyvä suoritus! Pieni hiominen riittää.";
  else if (pct >= 0.5)  fb = "Kohtalainen. Lue teksti uudelleen tarkemmin.";
  else                  fb = "Harjoittele lisää. Kiinnitä huomiota tekstin yksityiskohtiin.";
  $("reading-overall-feedback").textContent = fb;

  _deps.saveProgress({
    mode: "reading",
    level: state.readingLevel,
    scoreCorrect: state.readingScore,
    scoreTotal: state.currentReading.questions.length,
    ytlGrade: null,
  });

  // Spec 2 §5 — populate new editorial result IDs.
  const rdPct = total > 0 ? Math.round((state.readingScore / total) * 100) : 0;
  $("reading-res-tot").textContent = String(total);
  countUp($("reading-res-num"), state.readingScore);
  countUp($("reading-res-pct"), rdPct);
  $("reading-res-time").textContent = new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
  $("reading-res-coach").textContent = generateCoachLine({ scorePct: rdPct, sessionWeakestLabel: null });

  // Stats strip
  const rdWrong = Math.max(0, total - state.readingScore);
  const rdElapsed = state.sessionStartTime ? Date.now() - state.sessionStartTime : 0;
  const rdStatsEl = $("reading-res-stats");
  if (rdStatsEl) {
    countUp($("reading-res-stat-correct"), state.readingScore);
    countUp($("reading-res-stat-wrong"), rdWrong);
    $("reading-res-stat-time").textContent = fmtElapsedRd(rdElapsed);
    rdStatsEl.hidden = total === 0;
  }

  const rdList = $("reading-res-list");
  if (rdList) {
    rdList.innerHTML = "";
    const questions = state.currentReading?.questions || [];
    questions.forEach((q, idx) => {
      // Reading questions don't track per-question correct/wrong in state today;
      // ship the breakdown empty rather than guessing. Spec 2 §7 acknowledges this.
      const row = document.createElement("div");
      row.className = "results__row";
      const n = String(idx + 1).padStart(2, "0");
      row.innerHTML = `
        <span class="mono-num mono-num--md results__row-n">${n}</span>
        <span class="results__row-q"><span>${escapeHtmlRd(q.question || "")}</span></span>
        <span class="results__row-mark"></span>
      `;
      rdList.appendChild(row);
    });
  }

  show("screen-reading-results");
  if (total > 0) celebrateScore(rdPct);
}

$("reading-btn-new").addEventListener("click", () => loadReadingTask());
$("reading-btn-home").addEventListener("click", () =>
  isLoggedIn() ? _deps.loadDashboard() : show("screen-start")
);

const shareReadingBtn = $("btn-share-reading");
if (shareReadingBtn) {
  shareReadingBtn.addEventListener("click", async () => {
    shareReadingBtn.disabled = true;
    const original = shareReadingBtn.textContent;
    shareReadingBtn.textContent = "Luodaan kuvaa…";
    try {
      const total = (state.currentReading?.questions || []).length;
      const elapsed = state.sessionStartTime ? Date.now() - state.sessionStartTime : 0;
      await generateExerciseShareCard({
        kind: "reading",
        correct: state.readingScore || 0,
        total,
        topicLabel: state.currentReading?.title || state.readingTopic || "",
        level: state.readingLevel || "",
        elapsedMs: elapsed,
      });
      shareReadingBtn.textContent = "Tallennettu ✓";
      setTimeout(() => { shareReadingBtn.textContent = original; shareReadingBtn.disabled = false; }, 1800);
    } catch (err) {
      console.error("Share card generation failed:", err);
      shareReadingBtn.textContent = "Yritä uudelleen";
      setTimeout(() => { shareReadingBtn.textContent = original; shareReadingBtn.disabled = false; }, 1800);
    }
  });
}
