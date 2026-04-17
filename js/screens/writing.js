import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { state } from "../state.js";
import { CRITERIA_LABELS, RATING_COLORS } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";

let _deps = {};
export function initWriting({ loadDashboard, saveProgress }) {
  _deps = { loadDashboard, saveProgress };
}

export function showProUpsell() {
  show("screen-pro-upsell");
}

export async function startCheckout() {
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

export async function loadWritingTask() {
  showLoading("Luodaan kirjoitustehtävää...");

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
    renderWritingTask(data.task);
    show("screen-writing");
  } catch (err) {
    showLoadingError(err.message, () => loadWritingTask());
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
  fill.classList.remove("bar-ok", "bar-over");
  fill.classList.add(count > max ? "bar-over" : "bar-ok");

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
      headers: { "Content-Type": "application/json" },
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

function renderWritingFeedback(result) {
  $("feedback-score-num").textContent = result.finalScore;
  $("feedback-score-denom").textContent = `/ ${result.maxScore}`;

  const gradeBadge = $("feedback-grade-badge");
  gradeBadge.textContent = result.ytlGrade;
  gradeBadge.className = "feedback-grade-badge grade-" + result.ytlGrade;

  const criteriaEl = $("feedback-criteria");
  criteriaEl.innerHTML = "";
  for (const [key, label] of Object.entries(CRITERIA_LABELS)) {
    const c = result.criteria[key];
    if (!c) continue;
    const ratingClass = RATING_COLORS[c.rating] || "";
    const block = document.createElement("div");
    block.className = "criteria-block";
    block.innerHTML = `
      <div class="criteria-header">
        <span class="criteria-label">${label}</span>
        <span class="criteria-rating ${ratingClass}">${c.rating}</span>
      </div>
      <p class="criteria-comment">${c.comment}</p>
    `;
    criteriaEl.appendChild(block);
  }

  if (result.penalty > 0) {
    const notice = document.createElement("div");
    notice.className = "penalty-notice";
    notice.textContent = `⚠ Merkkirajoitus ylitetty: −${result.penalty} pistettä`;
    criteriaEl.insertAdjacentElement("afterend", notice);
  }

  const errorsEl = $("feedback-errors");
  errorsEl.innerHTML = "";
  if (result.errors?.length) {
    $("feedback-errors-section").style.display = "";
    result.errors.forEach((err) => {
      const el = document.createElement("div");
      el.className = "error-item";
      el.innerHTML = `
        <div class="error-comparison">
          <span class="error-wrong">${err.original}</span>
          <span class="error-arrow">→</span>
          <span class="error-correct">${err.correct}</span>
        </div>
        <p class="error-explanation">${err.explanation}</p>
      `;
      errorsEl.appendChild(el);
    });
  } else {
    $("feedback-errors-section").style.display = "none";
  }

  const posEl = $("feedback-positives");
  posEl.innerHTML = "";
  if (result.positives?.length) {
    $("feedback-positives-section").style.display = "";
    result.positives.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      posEl.appendChild(li);
    });
  } else {
    $("feedback-positives-section").style.display = "none";
  }

  $("feedback-overall").textContent = result.overallFeedback || "";
}

$("btn-try-again").addEventListener("click", () => loadWritingTask());
$("btn-back-home").addEventListener("click", () =>
  isLoggedIn() ? _deps.loadDashboard() : show("screen-start")
);
