// TODO(loading): adopt showSkeleton / showFetchError from js/ui/loading.js (Commit 9 follow-up)
import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, retryable } from "../api.js";
import { state } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";
import { generateCoachLine, countUp } from "./mode-page.js";

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
    const res = await retryable(() => fetch(`${API}/api/reading-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        level: state.readingLevel,
        topic: state.readingTopic,
        language: state.language,
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
}

$("reading-btn-new").addEventListener("click", () => loadReadingTask());
$("reading-btn-home").addEventListener("click", () =>
  isLoggedIn() ? _deps.loadDashboard() : show("screen-start")
);
