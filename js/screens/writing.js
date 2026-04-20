import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { state } from "../state.js";
import { CRITERIA_LABELS } from "../state.js";
import { showLoading, showLoadingError, showSkeleton, showFetchError } from "../ui/loading.js";
import { trackCheckoutStarted, trackProUpsellShown, trackExerciseCompleted } from "../analytics.js";

let _deps = {};
export function initWriting({ loadDashboard, saveProgress }) {
  _deps = { loadDashboard, saveProgress };
}

export function showProUpsell() {
  trackProUpsellShown();
  show("screen-pro-upsell");
}

export async function startCheckout() {
  trackCheckoutStarted();
  $("btn-upgrade-pro").disabled = true;
  $("btn-upgrade-pro").textContent = "Ohjataan maksuun...";
  try {
    const res = await apiFetch(`${API}/api/payments/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Maksun avaaminen epäonnistui");
    }
  } catch {
    alert("Yhteysvirhe");
  } finally {
    $("btn-upgrade-pro").disabled = false;
    $("btn-upgrade-pro").textContent = "Päivitä Pro →";
  }
}

export async function openBillingPortal() {
  try {
    const res = await apiFetch(`${API}/api/payments/portal-session`, {
      method: "GET",
      headers: authHeader(),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } catch {
    alert("Yhteysvirhe");
  }
}

function showWritingSkeleton() {
  const slot = $("writing-skeleton-slot");
  const hide = ["writing-situation", "writing-requirements"];
  hide.forEach((id) => { const el = $(id); if (el) el.classList.add("hidden"); });
  const promptBlock = document.querySelector("#screen-writing .writing-prompt-block");
  if (promptBlock) promptBlock.classList.add("hidden");
  const textareaWrap = document.querySelector("#screen-writing .textarea-wrapper");
  if (textareaWrap) textareaWrap.classList.add("hidden");
  const submitBtn = $("btn-submit-writing");
  if (submitBtn) submitBtn.classList.add("hidden");
  if (slot) {
    slot.classList.remove("hidden");
    showSkeleton(slot, "writing-task");
  }
}
function hideWritingSkeleton() {
  const slot = $("writing-skeleton-slot");
  if (slot) { slot.innerHTML = ""; slot.classList.add("hidden"); }
  const show = ["writing-situation", "writing-requirements"];
  show.forEach((id) => { const el = $(id); if (el) el.classList.remove("hidden"); });
  const promptBlock = document.querySelector("#screen-writing .writing-prompt-block");
  if (promptBlock) promptBlock.classList.remove("hidden");
  const textareaWrap = document.querySelector("#screen-writing .textarea-wrapper");
  if (textareaWrap) textareaWrap.classList.remove("hidden");
  const submitBtn = $("btn-submit-writing");
  if (submitBtn) submitBtn.classList.remove("hidden");
}

export async function loadWritingTask() {
  // Commit 9: inline skeleton on #screen-writing instead of the full-screen swap.
  showWritingSkeleton();
  show("screen-writing");

  try {
    const res = await fetch(`${API}/api/writing-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        taskType: state.writingTaskType,
        topic: state.writingTopic,
        language: state.language,
      }),
    });
    if (res.status === 403) { showProUpsell(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tehtävän luonti epäonnistui");
    if (!data.task) throw new Error("No task");

    state.currentWritingTask = data.task;
    hideWritingSkeleton();
    renderWritingTask(data.task);
    show("screen-writing");
  } catch (err) {
    showFetchError($("writing-skeleton-slot"), {
      title: "Kirjoitustehtävän lataus epäonnistui",
      subtext: err.message,
      retryFn: () => loadWritingTask(),
    });
  }
}

function renderWritingTask(task) {
  const isShort = task.taskType === "short";

  $("writing-type-badge").textContent = isShort ? "Lyhyt tehtävä" : "Laajempi tehtävä";
  $("writing-pts-badge").textContent = `${task.points} p`;
  $("writing-limit-info").textContent = `${task.charMin}–${task.charMax} merkkiä (välilyönnit ei lasketa)`;
  $("writing-situation").textContent = task.situation;
  $("writing-prompt-text").textContent = task.prompt;

  const reqList = $("writing-requirements");
  reqList.innerHTML = "";
  task.requirements.forEach((req) => {
    const li = document.createElement("div");
    li.className = "writing-req-item";
    li.textContent = "· " + req;
    reqList.appendChild(li);
  });

  const input = $("writing-input");
  input.value = "";
  // Commit 13: maxlength prevents paste-over-limit. We use charMax * 1.5 as a
  // hard cap (the grader no longer penalises over-length after Commit 3's
  // policy change, but a hard cap still protects us from 10× wallpaper paste).
  input.maxLength = Math.round(task.charMax * 1.5);
  $("char-max").textContent = task.charMax;
  updateCharCounter();

  const minPct = (task.charMin / task.charMax) * 100;
  $("char-bar-min").style.left = `${minPct}%`;
}

function countChars(text) {
  return text.replace(/\s/g, "").length;
}

function updateCharCounter() {
  const task = state.currentWritingTask;
  if (!task) return;

  const text = $("writing-input").value;
  const count = countChars(text);
  const max = task.charMax;
  const min = task.charMin;

  $("char-count").textContent = count;

  const counter = $("char-counter");
  counter.classList.remove("counter-ok", "counter-warn", "counter-over");
  if (count > max) {
    counter.classList.add("counter-over");
  } else if (count >= min) {
    counter.classList.add("counter-ok");
  } else {
    counter.classList.add("counter-warn");
  }

  const fillPct = Math.min((count / max) * 100, 100);
  const fill = $("char-bar-fill");
  fill.style.width = `${fillPct}%`;
  fill.classList.remove("bar-ok", "bar-warn", "bar-over");
  // Commit 13: orange at 80 % of max, red at 100 %+.
  if (count > max) fill.classList.add("bar-over");
  else if (count >= max * 0.8) fill.classList.add("bar-warn");
  else fill.classList.add("bar-ok");

  $("btn-submit-writing").disabled = count < min;
}

$("writing-input").addEventListener("input", updateCharCounter);

$("btn-submit-writing").addEventListener("click", async () => {
  const text = $("writing-input").value.trim();
  if (!text) return;

  showLoading("Arvioidaan vastaustasi...");

  try {
    const res = await fetch(`${API}/api/grade-writing`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        task: state.currentWritingTask,
        studentText: text,
      }),
    });
    const data = await res.json();
    if (!data.result) throw new Error("No result");

    renderWritingFeedback(data.result);
    _deps.saveProgress({
      mode: "writing",
      level: null,
      scoreCorrect: data.result.finalScore,
      scoreTotal: data.result.maxScore,
      ytlGrade: data.result.ytlGrade,
    });
    show("screen-writing-feedback");
  } catch (err) {
    showLoadingError("Arviointivirhe: " + err.message, () => {
      show("screen-writing");
    });
  }
});

const CATEGORY_LABELS = {
  grammar: "Kielioppi",
  vocabulary: "Sanasto",
  spelling: "Oikeinkirjoitus",
  register: "Rekisteri",
};

// Store last feedback for retry-with-corrections
let _lastFeedback = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/**
 * Render the student's text with inline annotations.
 * Matches errors (red) and annotations (green) against the text.
 */
function renderAnnotatedText(originalText, errors, annotations) {
  const container = $("feedback-annotated-text");
  if (!container || !originalText) return;

  // Build a list of all spans to highlight: {start, end, kind, data}
  const spans = [];

  for (const err of errors || []) {
    const excerpt = err.excerpt || err.original || "";
    if (!excerpt) continue;
    const idx = originalText.indexOf(excerpt);
    if (idx >= 0) {
      spans.push({
        start: idx,
        end: idx + excerpt.length,
        kind: "error",
        data: err,
      });
    }
  }

  for (const ann of annotations || []) {
    const excerpt = ann.excerpt || ann.text || "";
    if (!excerpt) continue;
    const idx = originalText.indexOf(excerpt);
    if (idx >= 0) {
      // Check for overlap with errors (errors take priority)
      const overlap = spans.some(s => s.kind === "error" && !(s.end <= idx || s.start >= idx + excerpt.length));
      if (!overlap) {
        spans.push({
          start: idx,
          end: idx + excerpt.length,
          kind: "positive",
          data: ann,
        });
      }
    }
  }

  // Sort by start, remove overlapping spans
  spans.sort((a, b) => a.start - b.start);
  const nonOverlapping = [];
  let lastEnd = -1;
  for (const s of spans) {
    if (s.start >= lastEnd) {
      nonOverlapping.push(s);
      lastEnd = s.end;
    }
  }

  // Build HTML with inline markers
  let html = "";
  let cursor = 0;
  for (const s of nonOverlapping) {
    if (s.start > cursor) {
      html += escapeHtml(originalText.slice(cursor, s.start));
    }
    const text = escapeHtml(originalText.slice(s.start, s.end));
    const dataAttr = encodeURIComponent(JSON.stringify(s.data));
    const klass = s.kind === "error" ? "annotation-error" : "annotation-positive";
    html += `<span class="annotation-span ${klass}" data-kind="${s.kind}" data-annotation="${dataAttr}">${text}</span>`;
    cursor = s.end;
  }
  if (cursor < originalText.length) {
    html += escapeHtml(originalText.slice(cursor));
  }

  container.innerHTML = html;

  // Wire up hover tooltips
  const tooltip = $("feedback-tooltip");
  if (!tooltip) return;

  container.querySelectorAll(".annotation-span").forEach(span => {
    span.addEventListener("mouseenter", (e) => {
      const kind = span.dataset.kind;
      let data;
      try { data = JSON.parse(decodeURIComponent(span.dataset.annotation)); } catch { return; }

      tooltip.className = "feedback-tooltip " + kind;
      if (kind === "error") {
        const catLabel = CATEGORY_LABELS[data.category] || data.category || "Virhe";
        tooltip.innerHTML = `
          <div class="feedback-tooltip-header">${escapeHtml(catLabel)}</div>
          <div class="feedback-tooltip-diff">
            <span class="feedback-tooltip-wrong">${escapeHtml(data.excerpt || "")}</span>
            &rarr;
            <span class="feedback-tooltip-correct">${escapeHtml(data.corrected || "")}</span>
          </div>
          <div class="feedback-tooltip-expl">${escapeHtml(data.explanation_fi || "")}</div>
        `;
      } else {
        tooltip.innerHTML = `
          <div class="feedback-tooltip-header">✓ Hyvin tehty</div>
          <div class="feedback-tooltip-expl">${escapeHtml(data.comment_fi || "")}</div>
        `;
      }

      tooltip.classList.add("visible");

      const rect = span.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2) + "px";
      tooltip.style.top = (rect.top - 10) + "px";
      tooltip.style.transform = "translate(-50%, -100%)";
    });

    span.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
    });
  });
}

function renderWritingFeedback(result) {
  _lastFeedback = result;

  $("feedback-score-num").textContent = result.finalScore;
  $("feedback-score-denom").textContent = `/ ${result.maxScore}`;

  const gradeBadge = $("feedback-grade-badge");
  gradeBadge.textContent = result.ytlGrade;
  gradeBadge.className = "feedback-grade-badge grade-" + result.ytlGrade;

  // Inline annotated text (the centerpiece)
  renderAnnotatedText(result.originalText || "", result.errors || [], result.annotations || []);

  // "Korjattu versio" — full corrected essay. Only shown when it differs from
  // the student's text (guardrail: capped at 1.5× input length server-side).
  const correctedEl = document.getElementById("feedback-corrected-text");
  const correctedSec = document.getElementById("feedback-corrected-section");
  if (correctedEl && correctedSec) {
    const orig = (result.originalText || "").trim();
    const corrected = (result.corrected_text || "").trim();
    if (corrected && corrected !== orig) {
      correctedSec.classList.remove("hidden");
      correctedEl.textContent = corrected;
    } else {
      correctedSec.classList.add("hidden");
      correctedEl.textContent = "";
    }
  }

  // Criteria with score bars
  const criteriaEl = $("feedback-criteria");
  criteriaEl.innerHTML = "";
  for (const [key, label] of Object.entries(CRITERIA_LABELS)) {
    const c = result[key];
    if (!c) continue;
    const pct = Math.round((c.score / 5) * 100);
    const barColor = pct >= 75 ? "var(--correct)" : pct >= 50 ? "var(--gold)" : "var(--wrong)";
    const block = document.createElement("div");
    block.className = "criteria-block";
    block.innerHTML = `
      <div class="criteria-header">
        <span class="criteria-label">${label}</span>
        <span class="criteria-score">${c.score} / 5</span>
      </div>
      <div class="criteria-bar"><div class="criteria-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
      <p class="criteria-comment">${c.feedback_fi || ""}</p>
    `;
    criteriaEl.appendChild(block);
  }

  // Penalty notice
  if (result.penalty > 0) {
    const notice = document.createElement("div");
    notice.className = "penalty-notice";
    notice.textContent = `⚠ Liian lyhyt teksti: −${result.penalty} pistettä`;
    criteriaEl.insertAdjacentElement("afterend", notice);
  }

  // Errors summary (below the annotated text)
  const errorsEl = $("feedback-errors");
  const errorsSection = $("feedback-errors-section");
  errorsEl.innerHTML = "";
  if (result.errors?.length) {
    errorsSection.classList.remove("hidden");
    result.errors.forEach((err) => {
      const catLabel = CATEGORY_LABELS[err.category] || err.category || "";
      const el = document.createElement("div");
      el.className = "error-item";
      el.innerHTML = `
        <div class="error-diff">
          <span class="error-cat-tag">${escapeHtml(catLabel)}</span>
          <div class="error-comparison">
            <span class="error-wrong"><del>${escapeHtml(err.excerpt || err.original || "")}</del></span>
            <span class="error-arrow">→</span>
            <span class="error-correct"><ins>${escapeHtml(err.corrected || err.correct || "")}</ins></span>
          </div>
        </div>
        <p class="error-explanation">${escapeHtml(err.explanation_fi || "")}</p>
      `;
      errorsEl.appendChild(el);
    });
  } else {
    errorsSection.classList.add("hidden");
  }

  // Positives (sidebar) — drawn from annotations
  const posEl = $("feedback-positives");
  const posSection = $("feedback-positives-section");
  posEl.innerHTML = "";
  const positives = (result.annotations || []).filter(a => a.type === "positive");
  if (positives.length) {
    posSection.classList.remove("hidden");
    positives.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = a.comment_fi || "";
      posEl.appendChild(li);
    });
  } else {
    posSection.classList.add("hidden");
  }

  $("feedback-overall").textContent = result.overall_feedback_fi || "";
}

$("btn-try-again").addEventListener("click", () => loadWritingTask());
$("btn-back-home").addEventListener("click", () =>
  isLoggedIn() ? _deps.loadDashboard() : show("screen-start")
);

// Retry with corrections: prefill textarea with original text, stay on same task
const retryBtn = $("btn-try-again-with-corrections");
if (retryBtn) {
  retryBtn.addEventListener("click", () => {
    if (!_lastFeedback || !_lastFeedback.originalText) {
      loadWritingTask();
      return;
    }
    // Go back to writing screen with original text prefilled
    const input = $("writing-input");
    if (input) {
      input.value = _lastFeedback.originalText;
      updateCharCounter();
    }
    show("screen-writing");
  });
}
