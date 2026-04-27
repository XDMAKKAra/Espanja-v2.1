import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, retryable } from "../api.js";
import { state } from "../state.js";
import { showLoading, showLoadingError, showSkeleton, showFetchError } from "../ui/loading.js";
import { GRAMMAR_TYPE_LABELS } from "./vocab.js";
import { resetAutoTriggerTracking, recordAnswerForAutoTrigger } from "./quickReview.js";
import { getBlogForTopic, trackBlogClick } from "../features/topicBlogMap.js";
import { renderExercise } from "./exerciseRenderer.js";
import { shouldShowCapBanner, CAP_BANNER_COPY } from "../../lib/dailyCap.js";
import { toUnified } from "../../lib/exerciseTypes.js";
import { reportMcAdvisory } from "../features/mcAdvisory.js";
import { generateCoachLine, topicLabel } from "./mode-page.js";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function escapeHtmlGr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let _deps = {};
export function initGrammar({ loadDashboard, saveProgress }) {
  _deps = { loadDashboard, saveProgress };
}

function showGramSkeleton() {
  const qb = $("gram-question-block");
  const opts = $("gram-options-grid");
  const slot = $("gram-skeleton-slot");
  if (qb) qb.classList.add("hidden");
  if (opts) opts.classList.add("hidden");
  if (slot) {
    slot.classList.remove("hidden");
    showSkeleton(slot, "exercise");
  }
}
function hideGramSkeleton() {
  const qb = $("gram-question-block");
  const opts = $("gram-options-grid");
  const slot = $("gram-skeleton-slot");
  if (slot) { slot.innerHTML = ""; slot.classList.add("hidden"); }
  if (qb) qb.classList.remove("hidden");
  if (opts) opts.classList.remove("hidden");
}

export async function loadGrammarDrill() {
  // Commit 9: inline skeleton inside #screen-grammar instead of full-screen swap.
  showGramSkeleton();
  show("screen-grammar");

  try {
    const res = await retryable(() => fetch(`${API}/api/grammar-drill`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        topic: state.grammarTopic,
        level: state.grammarLevel,
        count: 6,
        language: state.language,
      }),
    }), { attempts: 3, baseDelayMs: 500 });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Harjoitusten luonti epäonnistui");
    if (!data.exercises?.length) throw new Error("No exercises");

    state.grammarExercises = data.exercises;
    state.grammarBankId = data.bankId || null;
    state.grammarCurrent = 0;
    state.grammarCorrect = 0;
    state.grammarErrors = [];
    resetAutoTriggerTracking();

    hideGramSkeleton();
    renderGrammarExercise();
    show("screen-grammar");
  } catch (err) {
    showFetchError($("gram-skeleton-slot"), {
      title: "Kielioppiharjoitusten lataus epäonnistui",
      subtext: err.message,
      retryFn: () => loadGrammarDrill(),
    });
    $("gram-skeleton-slot").classList.remove("hidden");
    $("gram-question-block").classList.add("hidden");
    $("gram-options-grid").classList.add("hidden");
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
    sentenceEl.innerHTML = `<span style="text-decoration: underline wavy var(--error); text-underline-offset: 4px">${ex.sentence}</span>`;
  } else if (exType === "transform") {
    sentenceEl.innerHTML = `<span style="color: var(--accent)">${ex.sentence}</span>`;
  } else {
    sentenceEl.textContent = ex.sentence;
  }

  $("gram-rule-tag").textContent = "";
  $("gram-explanation-block").classList.add("hidden");

  const grid = $("gram-options-grid");

  renderExercise(
    toUnified(ex, { topic: state.grammarTopic || "grammar", skill_bucket: "grammar" }),
    grid,
    {
      onAnswer: ({ chosenIndex, correctIndex, isCorrect, button }) => {
        handleGrammarAnswer(OPTION_LETTERS[chosenIndex], button, ex);
        reportMcAdvisory({ exerciseId: ex.id, chosenIndex, correctIndex, clientIsCorrect: isCorrect });
      },
    }
  );
}

function handleGrammarAnswer(chosen, clickedBtn, ex) {
  const isCorrect = chosen === ex.correct;

  if (isCorrect) {
    clickedBtn.classList.add("is-correct");
    state.grammarCorrect++;
  } else {
    clickedBtn.classList.add("is-wrong");
    document.querySelectorAll("#gram-options-grid .ex-option").forEach((b) => {
      const letter = b.querySelector(".ex-option__l")?.textContent;
      if (letter === ex.correct) b.classList.add("is-correct");
    });
    state.grammarErrors.push(ex.rule || "kielioppi");
  }

  if (state.grammarCurrent < 3) {
    recordAnswerForAutoTrigger(isCorrect, state.grammarTopic);
  }

  document.querySelectorAll("#gram-options-grid .ex-option").forEach((b) => {
    b.disabled = true;
    b.classList.add("is-disabled");
  });
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
      "font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;";
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

  // Spec 2 §5 — populate new editorial result IDs.
  const grPct = total > 0 ? Math.round((state.grammarCorrect / total) * 100) : 0;
  $("gram-res-num").textContent = String(state.grammarCorrect);
  $("gram-res-tot").textContent = String(total);
  $("gram-res-pct").textContent = String(grPct);
  $("gram-res-time").textContent = new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
  $("gram-res-topic").textContent = topicLabel(state.grammarTopic || "mixed").toUpperCase();
  // Session-weakest = topic with most errors in this session (state.grammarErrors).
  let sessionWeakest = null;
  const errorCounts = {};
  for (const e of state.grammarErrors || []) errorCounts[e] = (errorCounts[e] || 0) + 1;
  const sortedErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);
  if (sortedErrors.length > 0) sessionWeakest = sortedErrors[0][0];
  $("gram-res-coach").textContent = generateCoachLine({ scorePct: grPct, sessionWeakestLabel: sessionWeakest });
  const grList = $("gram-res-list");
  if (grList) {
    grList.innerHTML = "";
    const exercises = state.grammarExercises || [];
    const userAnswers = state.grammarUserAnswers || [];
    exercises.forEach((ex, idx) => {
      const ua = userAnswers[idx];
      const isCorrect = ua?.isCorrect === true;
      const row = document.createElement("div");
      row.className = `results__row results__row--${isCorrect ? "correct" : "wrong"}`;
      const n = String(idx + 1).padStart(2, "0");
      const sentence = (ex.sentence || ex.prompt || "").replace(/_+/g, "___");
      const correctAnswer = ex.correct ? `${ex.correct}) ${(ex.options || []).find((o) => o.startsWith?.(ex.correct + ")")) || ex.correct}` : "";
      row.innerHTML = `
        <span class="mono-num mono-num--md results__row-n">${n}</span>
        <span class="results__row-q">
          <span>${escapeHtmlGr(sentence)}</span>
          ${isCorrect || !correctAnswer ? "" : `<span class="results__row-correct">${escapeHtmlGr(correctAnswer)}</span>`}
        </span>
        <span class="results__row-mark" aria-label="${isCorrect ? "Oikein" : "Väärin"}">${isCorrect ? "✓" : "✗"}</span>
      `;
      grList.appendChild(row);
    });
  }

  renderBlogCta(state.grammarTopic);
  show("screen-grammar-results");
  renderGramCapBanner();
}

function renderGramCapBanner() {
  const host = document.querySelector("#screen-grammar-results .results");
  if (!host) return;
  host.querySelector(".results-cap-banner")?.remove();
  if (!shouldShowCapBanner()) return;
  const el = document.createElement("div");
  el.className = "results-cap-banner";
  el.textContent = CAP_BANNER_COPY;
  host.insertBefore(el, host.firstChild);
}

async function renderBlogCta(topicKey) {
  const cta = $("gram-blog-cta");
  if (!cta) return;
  const blog = await getBlogForTopic(topicKey);
  if (!blog) {
    cta.classList.add("hidden");
    return;
  }
  cta.href = blog.url;
  $("gram-blog-cta-kicker").textContent = "Haluatko syventyä?";
  $("gram-blog-cta-title").textContent = `Lue ${blog.read_minutes} min artikkeli →`;
  cta.classList.remove("hidden");

  cta.onclick = () => trackBlogClick("grammar_results", blog.key, blog.url);
}

$("gram-btn-restart").addEventListener("click", () =>
  isLoggedIn() ? _deps.loadDashboard() : show("screen-start")
);
