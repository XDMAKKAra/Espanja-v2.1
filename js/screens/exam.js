// TODO(loading): adopt showSkeleton / showFetchError from js/ui/loading.js (Commit 9 follow-up)
import { $, show } from "../ui/nav.js";
import { API, isLoggedIn } from "../api.js";
import { state } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";
import { createExamTimer, clearPersisted as clearTimerPersisted } from "../features/examTimer.js";

let _deps = {};
export function initExam({ loadDashboard, saveProgress, shareResult }) {
  _deps = { loadDashboard, saveProgress, shareResult };
}

const EXAM_DURATION_S = 45 * 60; // 45 minutes

let examState = {
  timer: null,
  secondsLeft: EXAM_DURATION_S,
  readingData: null,
  writingTask: null,
  readingAnswers: {},
  phase: "reading", // "reading" | "writing"
};

function renderExamTimer(remaining) {
  examState.secondsLeft = remaining;
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  const el = $("exam-timer");
  if (!el) return;
  el.textContent = `${m}:${s}`;
  if (remaining <= 300) el.classList.add("exam-timer-warn");
  else el.classList.remove("exam-timer-warn");
}

function setMockExamPausedOverlay(on) {
  let overlay = document.getElementById("mock-exam-paused-overlay");
  if (on) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mock-exam-paused-overlay";
      overlay.className = "exam-paused-overlay";
      overlay.innerHTML = '<div class="exam-paused-inner">⏸ Tauko</div>';
      document.body.appendChild(overlay);
    }
    overlay.classList.add("is-visible");
  } else if (overlay) {
    overlay.classList.remove("is-visible");
  }
}

let _mockExamWarningShown = false;
function showMockExamWarning() {
  if (_mockExamWarningShown) return;
  _mockExamWarningShown = true;
  const overlay = document.createElement("div");
  overlay.className = "exam-warning-overlay";
  overlay.innerHTML = `
    <div class="exam-warning-modal" role="alertdialog" aria-labelledby="mock-exam-warning-title">
      <h3 id="mock-exam-warning-title">15 minuuttia jäljellä</h3>
      <p>Tarkista vastaukset ja täydennä kirjoitustehtävä.</p>
      <button type="button" class="btn-primary" id="mock-exam-warning-dismiss">Jatka</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#mock-exam-warning-dismiss").addEventListener("click", () => overlay.remove());
}

export async function startMockExam() {
  showLoading("Luodaan koe...");

  try {
    const [readRes, writeRes] = await Promise.all([
      fetch(`${API}/api/reading-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "general", level: "C" }),
      }),
      fetch(`${API}/api/writing-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType: "long", topic: "general" }),
      }),
    ]);
    const readData = await readRes.json();
    const writeData = await writeRes.json();
    if (!readData.reading || !writeData.task) throw new Error("Lataus epäonnistui");

    examState = {
      timer: null,
      secondsLeft: EXAM_DURATION_S,
      readingData: readData.reading,
      writingTask: writeData.task,
      readingAnswers: {},
      phase: "reading",
    };
    _mockExamWarningShown = false;

    renderExamReading();
    $("exam-timer").classList.remove("exam-timer-warn");
    $("exam-progress-fill").style.width = "50%";
    $("exam-phase-label").textContent = "Osa 1: Luetun ymmärtäminen";
    $("exam-reading-phase").classList.remove("hidden");
    $("exam-writing-phase").classList.add("hidden");
    show("screen-exam");

    examState.timer = createExamTimer({
      durationSec: EXAM_DURATION_S,
      examId: "mock-exam",
      onTick: renderExamTimer,
      onExpire: () => submitExam(),
      onWarning: () => showMockExamWarning(),
      onPause: () => setMockExamPausedOverlay(true),
      onResume: () => setMockExamPausedOverlay(false),
    });
    examState.timer.start();
  } catch (err) {
    showLoadingError("Kokeen lataus epäonnistui: " + err.message, () => startMockExam());
  }
}

function renderExamReading() {
  const r = examState.readingData;
  $("exam-reading-text").innerHTML = `<h3 style="margin-bottom:12px;font-size:15px">${r.title || ""}</h3>${r.text.replace(/\n/g, "<br/>")}`;

  const qWrap = $("exam-reading-questions");
  qWrap.innerHTML = "";
  r.questions.forEach((q, i) => {
    const block = document.createElement("div");
    block.className = "reading-q-block";
    block.innerHTML = `<div class="reading-q-text">${i + 1}. ${q.question}</div>`;

    if (q.type === "multiple_choice" && q.options) {
      q.options.forEach((opt) => {
        const letter = opt.trim()[0];
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          block.querySelectorAll(".option-btn").forEach((b) => b.classList.remove("selected-answer"));
          btn.classList.add("selected-answer");
          examState.readingAnswers[i] = letter;
        });
        block.appendChild(btn);
      });
    } else {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "auth-input";
      inp.placeholder = "Vastauksesi...";
      inp.style.marginTop = "8px";
      inp.addEventListener("input", () => { examState.readingAnswers[i] = inp.value; });
      block.appendChild(inp);
    }
    qWrap.appendChild(block);
  });
}

$("exam-btn-to-writing").addEventListener("click", () => {
  examState.phase = "writing";
  $("exam-phase-label").textContent = "Osa 2: Kirjoittaminen";
  $("exam-progress-fill").style.width = "100%";
  $("exam-reading-phase").classList.add("hidden");
  $("exam-writing-phase").classList.remove("hidden");

  const t = examState.writingTask;
  $("exam-task-box").innerHTML = `
    <div class="writing-situation">${t.situation}</div>
    <div class="writing-prompt">${t.prompt}</div>
    <ul class="writing-requirements">${(t.requirements || []).map((r) => `<li>${r}</li>`).join("")}</ul>
    <div class="writing-meta">${t.textType} · ${t.charMin}–${t.charMax} merkkiä</div>
  `;

  const inp = $("exam-writing-input");
  inp.value = "";
  $("exam-char-count").textContent = "0 merkkiä";
  inp.addEventListener("input", () => {
    const count = inp.value.replace(/\s/g, "").length;
    const color = count < t.charMin ? "var(--wrong)" : count > t.charMax ? "var(--wrong)" : "var(--correct)";
    $("exam-char-count").textContent = `${count} merkkiä`;
    $("exam-char-count").style.color = color;
  });
});

$("exam-btn-submit").addEventListener("click", () => submitExam());

async function submitExam() {
  if (examState.timer) { examState.timer.stop(); examState.timer = null; }
  clearTimerPersisted("mock-exam");
  const timeUsed = EXAM_DURATION_S - examState.secondsLeft;
  const mins = Math.floor(timeUsed / 60);

  showLoading("Arvioidaan koetta...");

  try {
    const r = examState.readingData;
    let readingCorrect = 0;
    r.questions.forEach((q, i) => {
      const ans = (examState.readingAnswers[i] || "").trim().toUpperCase();
      if (q.correct_answer && ans === q.correct_answer.trim().toUpperCase()) readingCorrect++;
    });
    const readingPct = Math.round((readingCorrect / r.questions.length) * 100);

    const essay = $("exam-writing-input").value.trim();
    const t = examState.writingTask;
    const gradeRes = await fetch(`${API}/api/grade-writing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essay, task: t, taskType: t.taskType }),
    });
    const gradeData = await gradeRes.json();

    const GRADE_ORDER = ["I","A","B","C","M","E","L"];
    const writingIdx = GRADE_ORDER.indexOf(gradeData.grade ?? "C");
    const readingIdx = Math.min(6, Math.round((readingPct / 100) * 6));
    const combinedIdx = Math.round(writingIdx * 0.6 + readingIdx * 0.4);
    const combinedGrade = GRADE_ORDER[Math.max(0, Math.min(6, combinedIdx))];

    $("exam-grade-display").textContent = combinedGrade;
    $("exam-results-breakdown").innerHTML = `
      <div class="exam-result-row"><span>Luetun ymmärtäminen</span><span>${readingCorrect}/${r.questions.length} (${readingPct}%)</span></div>
      <div class="exam-result-row"><span>Kirjoittaminen</span><span>${gradeData.grade ?? "—"}</span></div>
      <div class="exam-result-row"><span>Käytetty aika</span><span>${mins} min</span></div>
    `;
    $("exam-overall-feedback").textContent = gradeData.overallFeedback || gradeData.feedback || "";

    _deps.saveProgress({ mode: "exam", level: combinedGrade, scoreCorrect: readingCorrect, scoreTotal: r.questions.length, ytlGrade: combinedGrade });
    show("screen-exam-results");
  } catch (err) {
    showLoadingError("Arviointi epäonnistui: " + err.message, () => {
      show("screen-start");
    });
  }
}

$("exam-btn-retry").addEventListener("click", () => startMockExam());
$("exam-btn-home").addEventListener("click", () =>
  isLoggedIn() ? _deps.loadDashboard() : show("screen-start")
);
$("btn-share-exam").addEventListener("click", () => {
  const grade = $("exam-grade-display").textContent;
  _deps.shareResult(`Tein koeharjoituksen Puheossa 🎓\nYo-koearvosana: ${grade}\nhttps://puheo.fi`);
});
