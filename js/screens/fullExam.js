import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { state } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";

let _deps = {};
export function initFullExam({ loadDashboard, saveProgress, shareResult }) {
  _deps = { loadDashboard, saveProgress, shareResult };
}

let examState = {
  sessionId: null,
  partsData: null,
  answers: {},
  secondsRemaining: 0,
  currentPart: 1,
  timerInterval: null,
  autoSaveInterval: null,
  durationMode: "demo",
};

const PART_COUNT = 4;
const PART_LABELS = [
  "Osa 1: Luetun ymmärtäminen",
  "Osa 2: Rakenteet ja sanasto",
  "Osa 3: Lyhyt kirjoitustehtävä",
  "Osa 4: Pitkä kirjoitustehtävä",
];

// ─── Timer ──────────────────────────────────────────────────────────────────

function startTimer() {
  stopTimer();
  examState.timerInterval = setInterval(() => {
    examState.secondsRemaining--;
    updateTimerDisplay();
    if (examState.secondsRemaining <= 0) submitFullExam();
  }, 1000);
}

function stopTimer() {
  if (examState.timerInterval) { clearInterval(examState.timerInterval); examState.timerInterval = null; }
}

function updateTimerDisplay() {
  const s = Math.max(0, examState.secondsRemaining);
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  const el = $("full-exam-timer");
  if (el) el.textContent = `${h}:${m}:${sec}`;
  if (s <= 600 && el) el.classList.add("exam-timer-warn");
  else if (el) el.classList.remove("exam-timer-warn");
}

// ─── Auto-save ──────────────────────────────────────────────────────────────

function startAutoSave() {
  stopAutoSave();
  examState.autoSaveInterval = setInterval(() => saveExamProgress(), 10000);
}

function stopAutoSave() {
  if (examState.autoSaveInterval) { clearInterval(examState.autoSaveInterval); examState.autoSaveInterval = null; }
}

async function saveExamProgress() {
  if (!examState.sessionId) return;
  try {
    await apiFetch(`${API}/api/exam/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        sessionId: examState.sessionId,
        answers: examState.answers,
        secondsRemaining: examState.secondsRemaining,
        currentPart: examState.currentPart,
      }),
    });
  } catch { /* silent */ }
}

// ─── Start / Resume ─────────────────────────────────────────────────────────

export async function startFullExam(durationMode = "demo") {
  showLoading("Tarkistetaan aktiivista koetta...");

  try {
    const resumeRes = await apiFetch(`${API}/api/exam/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    const resumeData = await resumeRes.json();

    if (resumeData.active) {
      const resume = confirm("Sinulla on keskeneräinen koe. Haluatko jatkaa sitä?");
      if (resume) {
        examState.sessionId = resumeData.sessionId;
        examState.partsData = resumeData.partsData;
        examState.answers = resumeData.answers || {};
        examState.secondsRemaining = resumeData.secondsRemaining;
        examState.currentPart = resumeData.currentPart || 1;
        examState.durationMode = resumeData.durationMode || "demo";
        enterExam();
        return;
      }
    }

    showLoading("Luodaan koetta...", { subtext: "Generoidaan 4 osaa tekoälyllä (luettu, rakenteet, kirjoitus)" });

    const startRes = await apiFetch(`${API}/api/exam/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ durationMode }),
    });

    if (!startRes.ok) {
      const err = await startRes.json();
      throw new Error(err.message || err.error || "Kokeen luonti epäonnistui");
    }

    const startData = await startRes.json();
    examState.sessionId = startData.sessionId;
    examState.partsData = startData.partsData;
    examState.answers = {};
    examState.secondsRemaining = startData.secondsRemaining;
    examState.currentPart = 1;
    examState.durationMode = durationMode;

    enterExam();
  } catch (err) {
    showLoadingError("Kokeen luonti epäonnistui: " + err.message, () => startFullExam(durationMode));
  }
}

function enterExam() {
  renderCurrentPart();
  updateTimerDisplay();
  updateTabs();
  updateProgressBar();
  show("screen-full-exam");
  startTimer();
  startAutoSave();
}

// ─── Tab navigation ─────────────────────────────────────────────────────────

function updateTabs() {
  const tabs = document.querySelectorAll("#full-exam-tabs .exam-tab");
  tabs.forEach((tab) => {
    const part = parseInt(tab.dataset.part);
    tab.classList.toggle("active", part === examState.currentPart);
    if (part !== examState.currentPart && hasAnswersForPart(part)) {
      tab.classList.add("completed");
    }
  });

  const labelEl = $("full-exam-part-label");
  if (labelEl) labelEl.textContent = PART_LABELS[examState.currentPart - 1] || "";
}

function hasAnswersForPart(part) {
  const prefix = `${part}_`;
  return Object.keys(examState.answers).some((k) => k.startsWith(prefix) && examState.answers[k]);
}

function updateProgressBar() {
  const answered = [1, 2, 3, 4].filter((p) => hasAnswersForPart(p)).length;
  const fill = $("full-exam-progress-fill");
  if (fill) fill.style.width = Math.round((answered / PART_COUNT) * 100) + "%";
}

function switchToPart(part) {
  examState.currentPart = part;
  renderCurrentPart();
  updateTabs();
  updateProgressBar();
}

// ─── Render parts ───────────────────────────────────────────────────────────

function renderCurrentPart() {
  const content = $("full-exam-content");
  if (!content) return;

  const part = examState.currentPart;
  if (part === 1) renderReading(content);
  else if (part === 2) renderStructure(content);
  else if (part === 3) renderWriting(content, 2, true);
  else if (part === 4) renderWriting(content, 3, false);
}

// Part 1: Reading comprehension
function renderReading(container) {
  const data = examState.partsData[0];
  if (!data || !data.texts) {
    container.innerHTML = '<p style="color:var(--text-muted)">Osa 1 ei latautunut.</p>';
    return;
  }

  let html = "";
  data.texts.forEach((text, ti) => {
    html += `<div class="exam-reading-block" style="margin-bottom:32px">
      <div class="exam-text-header">
        <span class="exam-text-level">${text.level || ""}</span>
        <span class="exam-text-source">${text.source || ""}</span>
      </div>
      <h3 style="margin:8px 0;font-size:15px;font-weight:700">${text.title || ""}</h3>
      <div class="exam-text" style="margin-bottom:16px">${(text.text || "").replace(/\n/g, "<br/>")}</div>`;

    (text.questions || []).forEach((q, qi) => {
      const key = `1_${ti}_${qi}`;
      html += `<div class="reading-q-block" style="margin-bottom:16px">`;

      if (q.type === "multiple_choice") {
        html += `<div class="reading-q-text">${ti * 5 + qi + 1}. ${q.question}</div>`;
        (q.options || []).forEach((opt) => {
          const letter = opt.trim()[0];
          const selected = examState.answers[key] === letter;
          html += `<button class="option-btn exam-option ${selected ? "selected-answer" : ""}" data-key="${key}" data-val="${letter}">${opt}</button>`;
        });
      } else if (q.type === "true_false") {
        html += `<div class="reading-q-text">${ti * 5 + qi + 1}. Oikein vai väärin: ${q.statement}</div>`;
        const selT = examState.answers[key] === "TRUE";
        const selF = examState.answers[key] === "FALSE";
        html += `<button class="option-btn exam-option ${selT ? "selected-answer" : ""}" data-key="${key}" data-val="TRUE">Oikein</button>`;
        html += `<button class="option-btn exam-option ${selF ? "selected-answer" : ""}" data-key="${key}" data-val="FALSE">Väärin</button>`;
      } else if (q.type === "short_answer") {
        html += `<div class="reading-q-text">${ti * 5 + qi + 1}. ${q.question}</div>`;
        html += `<input type="text" class="auth-input exam-input" data-key="${key}" placeholder="Vastauksesi..." value="${examState.answers[key] || ""}" style="margin-top:6px"/>`;
      }

      html += `</div>`;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
  bindPartEvents(container);
}

// Part 2: Structure & Vocabulary
function renderStructure(container) {
  const data = examState.partsData[1];
  if (!data || !data.exercises) {
    container.innerHTML = '<p style="color:var(--text-muted)">Osa 2 ei latautunut.</p>';
    return;
  }

  let html = "";
  data.exercises.forEach((q, i) => {
    const key = `2_${i}`;
    html += `<div class="reading-q-block" style="margin-bottom:16px">`;
    html += `<div class="reading-q-text">${i + 1}. ${q.instruction || "Valitse oikea vaihtoehto."}</div>`;
    html += `<div class="gram-sentence" style="margin:6px 0;font-style:italic;color:var(--text-muted)">${q.sentence || ""}</div>`;

    (q.options || []).forEach((opt) => {
      const letter = opt.trim()[0];
      const selected = examState.answers[key] === letter;
      html += `<button class="option-btn exam-option ${selected ? "selected-answer" : ""}" data-key="${key}" data-val="${letter}">${opt}</button>`;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
  bindPartEvents(container);
}

// Parts 3 & 4: Writing
function renderWriting(container, partDataIdx, isShort) {
  const data = examState.partsData[partDataIdx];
  if (!data || !data.task) {
    container.innerHTML = `<p style="color:var(--text-muted)">Osa ${examState.currentPart} ei latautunut.</p>`;
    return;
  }

  const t = data.task;
  const key = `${examState.currentPart}_writing`;
  const val = examState.answers[key] || "";
  const charCount = val.replace(/\s/g, "").length;
  const countId = `exam-char-count-${examState.currentPart}`;

  container.innerHTML = `
    <div class="writing-task-box" style="margin-bottom:16px">
      <div class="writing-situation">${t.situation || ""}</div>
      <div class="writing-prompt" style="margin:8px 0;font-weight:600">${t.prompt || ""}</div>
      <ul class="writing-requirements">${(t.requirements || []).map((r) => `<li>${r}</li>`).join("")}</ul>
      <div class="writing-meta" style="color:var(--text-muted);font-size:12px">${t.textType || ""} · ${t.charMin}–${t.charMax} merkkiä · ${t.points}p</div>
    </div>
    <textarea class="exam-textarea" data-key="${key}" placeholder="Kirjoita vastauksesi tähän..." rows="${isShort ? 8 : 12}">${val}</textarea>
    <div class="exam-char-count" id="${countId}">${charCount} merkkiä</div>`;

  bindPartEvents(container);
  bindCharCount(container, t, countId);
}

// ─── Event binding ──────────────────────────────────────────────────────────

function bindPartEvents(container) {
  container.querySelectorAll(".exam-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      examState.answers[key] = btn.dataset.val;
      container.querySelectorAll(`.exam-option[data-key="${key}"]`).forEach((s) => s.classList.remove("selected-answer"));
      btn.classList.add("selected-answer");
      updateProgressBar();
    });
  });

  container.querySelectorAll(".exam-input").forEach((inp) => {
    inp.addEventListener("input", () => { examState.answers[inp.dataset.key] = inp.value; updateProgressBar(); });
  });

  container.querySelectorAll(".exam-textarea").forEach((ta) => {
    ta.addEventListener("input", () => { examState.answers[ta.dataset.key] = ta.value; updateProgressBar(); });
  });
}

function bindCharCount(container, task, countElId) {
  const ta = container.querySelector(".exam-textarea");
  if (!ta) return;

  const update = () => {
    const count = ta.value.replace(/\s/g, "").length;
    const el = $(countElId);
    if (!el) return;
    el.textContent = `${count} merkkiä`;
    if (count < task.charMin) el.style.color = "var(--text-muted)";
    else if (count > task.charMax) el.style.color = "var(--wrong)";
    else el.style.color = "var(--correct)";
  };

  ta.addEventListener("input", update);
  update();
}

// ─── Submit ─────────────────────────────────────────────────────────────────

async function submitFullExam() {
  stopTimer();
  stopAutoSave();
  await saveExamProgress();

  showLoading("Arvioidaan koetta...", { subtext: "Kirjoitustehtävät arvioidaan tekoälyllä" });

  try {
    const res = await apiFetch(`${API}/api/exam/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ sessionId: examState.sessionId, answers: examState.answers }),
    });

    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Arviointi epäonnistui"); }

    const result = await res.json();
    renderResults(result);

    _deps.saveProgress({ mode: "exam", level: result.finalGrade, scoreCorrect: result.totalPoints, scoreTotal: result.maxPoints, ytlGrade: result.finalGrade });
    show("screen-full-exam-results");
  } catch (err) {
    showLoadingError("Arviointi epäonnistui: " + err.message, () => submitFullExam());
  }
}

// ─── Results ────────────────────────────────────────────────────────────────

function renderResults(result) {
  const { totalPoints, maxPoints, finalGrade, partScores } = result;

  $("full-exam-grade-display").textContent = finalGrade;
  $("full-exam-points").textContent = `${totalPoints} / ${maxPoints} pistettä`;

  const GRADE_NAMES = {
    I: "Improbatur", A: "Approbatur", B: "Lubenter approbatur",
    C: "Cum laude approbatur", M: "Magna cum laude approbatur",
    E: "Eximia cum laude approbatur", L: "Laudatur",
  };

  const ps = partScores;
  $("full-exam-breakdown").innerHTML = `
    <div class="exam-result-row"><span>1. Luetun ymmärtäminen</span><span>${ps.reading.score} / ${ps.reading.maxPoints}p (${ps.reading.correct}/${ps.reading.total})</span></div>
    <div class="exam-result-row"><span>2. Rakenteet ja sanasto</span><span>${ps.structure.score} / ${ps.structure.maxPoints}p (${ps.structure.correct}/${ps.structure.total})</span></div>
    <div class="exam-result-row"><span>3. Lyhyt kirjoitustehtävä</span><span>${ps.shortWriting.score} / ${ps.shortWriting.maxPoints}p</span></div>
    <div class="exam-result-row"><span>4. Pitkä kirjoitustehtävä</span><span>${ps.longWriting.score} / ${ps.longWriting.maxPoints}p</span></div>
    <div class="exam-result-row" style="font-weight:700;border-top:2px solid var(--border)"><span>Yhteensä</span><span>${totalPoints} / ${maxPoints}p — ${GRADE_NAMES[finalGrade] || finalGrade}</span></div>`;

  let feedback = "";
  if (ps.shortWriting.feedback) feedback += `<p><strong>Lyhyt kirjoitustehtävä:</strong> ${ps.shortWriting.feedback}</p>`;
  if (ps.longWriting.feedback) feedback += `<p><strong>Pitkä kirjoitustehtävä:</strong> ${ps.longWriting.feedback}</p>`;
  $("full-exam-feedback").innerHTML = feedback;
}

// ─── Pause ──────────────────────────────────────────────────────────────────

function pauseExam() {
  stopTimer(); stopAutoSave(); saveExamProgress();
  if (isLoggedIn()) _deps.loadDashboard(); else show("screen-start");
}

// ─── Init & event binding ───────────────────────────────────────────────────

const tabContainer = $("full-exam-tabs");
if (tabContainer) {
  tabContainer.addEventListener("click", (e) => {
    const tab = e.target.closest(".exam-tab");
    if (!tab) return;
    const part = parseInt(tab.dataset.part);
    if (part >= 1 && part <= PART_COUNT) switchToPart(part);
  });
}

const pauseBtn = $("full-exam-btn-pause");
if (pauseBtn) pauseBtn.addEventListener("click", () => {
  if (confirm("Haluatko keskeyttää kokeen? Voit jatkaa sitä myöhemmin.")) pauseExam();
});

const submitBtn = $("full-exam-btn-submit");
if (submitBtn) submitBtn.addEventListener("click", () => {
  if (confirm("Haluatko palauttaa kokeen? Koetta ei voi enää muokata palautuksen jälkeen.")) submitFullExam();
});

const retryBtn = $("full-exam-btn-retry");
if (retryBtn) retryBtn.addEventListener("click", () => startFullExam());

const homeBtn = $("full-exam-btn-home");
if (homeBtn) homeBtn.addEventListener("click", () => { isLoggedIn() ? _deps.loadDashboard() : show("screen-start"); });

const shareBtn = $("btn-share-full-exam");
if (shareBtn) shareBtn.addEventListener("click", () => {
  const grade = $("full-exam-grade-display").textContent;
  const points = $("full-exam-points").textContent;
  _deps.shareResult(`Tein yo-koesimulaation Kieliossa!\nArvosana: ${grade} (${points})\nhttps://kielio.fi`);
});
