import { $, show } from "../ui/nav.js";
import { API, isLoggedIn } from "../api.js";
import { state } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";

let _deps = {};
export function initExam({ loadDashboard, saveProgress, shareResult }) {
  _deps = { loadDashboard, saveProgress, shareResult };
}

const EXAM_DURATION_S = 45 * 60; // 45 minutes

let examState = {
  timerInterval: null,
  secondsLeft: EXAM_DURATION_S,
  readingData: null,
  writingTask: null,
  readingAnswers: {},
  phase: "reading", // "reading" | "writing"
};

function examTick() {
  examState.secondsLeft--;
  const m = Math.floor(examState.secondsLeft / 60).toString().padStart(2, "0");
  const s = (examState.secondsLeft % 60).toString().padStart(2, "0");
  $("exam-timer").textContent = `${m}:${s}`;
  if (examState.secondsLeft <= 300) $("exam-timer").classList.add("exam-timer-warn");
  if (examState.secondsLeft <= 0) submitExam();
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
      timerInterval: null,
      secondsLeft: EXAM_DURATION_S,
      readingData: readData.reading,
      writingTask: writeData.task,
      readingAnswers: {},
      phase: "reading",
    };

    renderExamReading();
    $("exam-timer").classList.remove("exam-timer-warn");
    $("exam-progress-fill").style.width = "50%";
    $("exam-phase-label").textContent = "Osa 1: Luetun ymmärtäminen";
    $("exam-reading-phase").classList.remove("hidden");
    $("exam-writing-phase").classList.add("hidden");
    show("screen-exam");

    examState.timerInterval = setInterval(examTick, 1000);
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
  clearInterval(examState.timerInterval);
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
