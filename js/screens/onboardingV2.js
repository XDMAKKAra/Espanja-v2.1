// L-PLAN-1 onboarding V2 — 4 screens (profile → test → assessment → plan).
//
// Flow:
//   showOnboardingV2() → OB-1 (profile fields)
//   → OB-2 (8 questions + adaptive M_hard if perfect on A/B/C)
//   → OB-3 (POST /api/placement/onboarding, render tutor + score bars)
//   → OB-4 (render firstWeekPlan, finish → loadDashboard / register).
//
// Coexists with the legacy onboarding flow (js/screens/onboarding.js).
// Routed by hash `#/aloitus` or by being called directly from auth.

import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { track } from "../analytics.js";

// ── State ────────────────────────────────────────────────────────────────
const v2 = {
  schoolGrade: null,
  targetGrade: null,
  weakAreas: [],
  dailyGoalMinutes: null,
  questions: [],          // [{ id, level, question, options, correct, explanation }]
  mHardCandidates: [],
  index: 0,
  answers: [],            // [{ id, level, correct, time_ms, selected }]
  questionStartedAt: 0,
  result: null,           // populated from /onboarding response
  navigated: false,       // becomes true after exiting OB-4
};

let _deps = {};

export function initOnboardingV2(deps = {}) {
  _deps = deps;
  wireOB1();
  wireOB2();
  wireOB3();
  wireOB4();
}

export function showOnboardingV2() {
  reset();
  show("screen-ob1-profile");
  track("ob_v2_started", {});
}

function reset() {
  v2.schoolGrade = null;
  v2.targetGrade = null;
  v2.weakAreas = [];
  v2.dailyGoalMinutes = null;
  v2.questions = [];
  v2.mHardCandidates = [];
  v2.index = 0;
  v2.answers = [];
  v2.result = null;
  v2.navigated = false;

  // Clear pill / chip selection on re-entry.
  document.querySelectorAll("#screen-ob1-profile .ob2-pill[aria-checked='true']")
    .forEach((b) => b.setAttribute("aria-checked", "false"));
  document.querySelectorAll("#screen-ob1-profile .ob2-chip[aria-pressed='true']")
    .forEach((b) => b.setAttribute("aria-pressed", "false"));
  const cta = $("ob1-next");
  if (cta) cta.disabled = true;
  // L-PLAN-6 — clear the dynamic target-detail card on re-entry.
  const detail = document.getElementById("ob1-target-detail");
  if (detail) detail.hidden = true;
}

// L-PLAN-6 — per-target description shown under the OB-1 picker.
// Frame: "tavoite mahdollistaa, ei vaadi" (self-efficacy-builder-sequence).
const TARGET_DESCRIPTIONS = {
  I: {
    title: "Tavoite I",
    pace: "Hidas tahti · 0,7× tehtäviä per oppitunti · paljon toistoa",
    fit: "Sopii sinulle, jos olet vasta aloittamassa espanjaa ja haluat rauhallisen alun.",
  },
  A: {
    title: "Tavoite A",
    pace: "Hidas-normaali tahti · 0,85× tehtäviä · selkeitä esimerkkejä",
    fit: "Sopii sinulle, jos olet kielen alkutaipaleella ja haluat varmistaa perusteet.",
  },
  B: {
    title: "Tavoite B",
    pace: "Normaali tahti · baseline tehtävämäärä",
    fit: "Sopii useimmille — etenet kurssit järjestyksessä omaan tahtiin.",
  },
  C: {
    title: "Tavoite C",
    pace: "Normaali tahti · baseline tehtävämäärä · hieman haastavammat tehtävät",
    fit: "Sopii sinulle, jos hallitset perusteet ja haluat tasaisesti haastaa itseäsi.",
  },
  M: {
    title: "Tavoite M",
    pace: "Nopea tahti · 1,15× tehtäviä · vaativammat distraktorit",
    fit: "Sopii sinulle, jos olet hyvin osaava ja haluat pitää tahdin tiukkana.",
  },
  E: {
    title: "Tavoite E",
    pace: "Nopea tahti · 1,3× tehtäviä · vivahde-erot tärkeitä",
    fit: "Sopii sinulle, jos tähtäät erinomaiseen ja olet valmis hiomaan yksityiskohtia.",
  },
  L: {
    title: "Tavoite L",
    pace: "Erittäin nopea tahti · 1,5× tehtäviä · syventäviä lisätehtäviä",
    fit: "Sopii sinulle, jos haluat täydellisen hallinnan ja tähtäät korkeimpaan arvosanaan.",
  },
};

function renderTargetDetail(grade) {
  const wrap = document.getElementById("ob1-target-detail");
  const titleEl = document.getElementById("ob1-target-detail-title");
  const paceEl = document.getElementById("ob1-target-detail-pace");
  const fitEl = document.getElementById("ob1-target-detail-fit");
  if (!wrap || !titleEl || !paceEl || !fitEl) return;
  const info = TARGET_DESCRIPTIONS[grade];
  if (!info) { wrap.hidden = true; return; }
  titleEl.textContent = info.title;
  paceEl.textContent = info.pace;
  fitEl.textContent = info.fit;
  wrap.hidden = false;
}

// ── OB-1: profile ────────────────────────────────────────────────────────
function wireOB1() {
  const screen = document.getElementById("screen-ob1-profile");
  if (!screen || screen.dataset.wired) return;
  screen.dataset.wired = "1";

  // Single-select pill rows
  screen.querySelectorAll(".ob2-pillrow").forEach((row) => {
    const field = row.dataset.field;
    row.addEventListener("click", (e) => {
      const btn = e.target.closest(".ob2-pill");
      if (!btn) return;
      row.querySelectorAll(".ob2-pill").forEach((b) =>
        b.setAttribute("aria-checked", String(b === btn)),
      );
      const value = btn.dataset.value;
      if (field === "schoolGrade") v2.schoolGrade = value;
      if (field === "targetGrade") {
        v2.targetGrade = value;
        renderTargetDetail(value);
      }
      if (field === "dailyGoalMinutes") v2.dailyGoalMinutes = Number(value);

      // Pre-select target one notch above school grade on first interaction.
      if (field === "schoolGrade" && !v2.targetGrade) {
        const ladder = ["I", "A", "B", "C", "M", "E", "L"];
        const idx = ladder.indexOf(value);
        if (idx >= 0 && idx < ladder.length - 1) {
          const presumed = ladder[idx + 1];
          const targetRow = screen.querySelector(".ob2-pillrow[data-field='targetGrade']");
          const match = targetRow?.querySelector(`.ob2-pill[data-value='${presumed}']`);
          if (match) {
            targetRow.querySelectorAll(".ob2-pill").forEach((b) =>
              b.setAttribute("aria-checked", String(b === match)),
            );
            v2.targetGrade = presumed;
            renderTargetDetail(presumed);
          }
        }
      }
      refreshOB1Cta();
    });
  });

  // Multi-select chip row
  const chipRow = screen.querySelector(".ob2-chiprow[data-field='weakAreas']");
  if (chipRow) {
    chipRow.addEventListener("click", (e) => {
      const btn = e.target.closest(".ob2-chip");
      if (!btn) return;
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!pressed));
      const val = btn.dataset.value;
      if (!pressed) {
        if (val === "en_tieda") {
          // "En tiedä" is exclusive — clear the others.
          chipRow.querySelectorAll(".ob2-chip").forEach((b) => {
            if (b !== btn) b.setAttribute("aria-pressed", "false");
          });
          v2.weakAreas = ["en_tieda"];
        } else {
          // Clear "en_tieda" if a real area is now selected.
          const eiTieda = chipRow.querySelector(".ob2-chip[data-value='en_tieda']");
          if (eiTieda) eiTieda.setAttribute("aria-pressed", "false");
          v2.weakAreas = [...new Set([...v2.weakAreas.filter((x) => x !== "en_tieda"), val])];
        }
      } else {
        v2.weakAreas = v2.weakAreas.filter((x) => x !== val);
      }
    });
  }

  const cta = $("ob1-next");
  if (cta) {
    cta.addEventListener("click", async () => {
      track("ob_v2_step1_done", {
        school_grade: v2.schoolGrade,
        target_grade: v2.targetGrade,
        daily_minutes: v2.dailyGoalMinutes,
        weak_count: v2.weakAreas.length,
      });
      await loadOB2Questions();
      show("screen-ob2-test");
      renderQuestion();
    });
  }
}

function refreshOB1Cta() {
  const cta = $("ob1-next");
  if (!cta) return;
  // School grade + target grade are required; weak areas + minutes optional.
  cta.disabled = !(v2.schoolGrade && v2.targetGrade);
}

// ── OB-2: placement test ─────────────────────────────────────────────────
async function loadOB2Questions() {
  try {
    const grade = v2.schoolGrade && v2.schoolGrade !== "none" ? v2.schoolGrade : "";
    const url = `${API}/api/placement/onboarding-questions${grade ? `?selfReportedGrade=${encodeURIComponent(grade)}` : ""}`;
    const res = await apiFetch(url, { headers: authHeader() });
    if (!res.ok) throw new Error("fetch_failed");
    const data = await res.json();
    v2.questions = Array.isArray(data.core) ? data.core : [];
    v2.mHardCandidates = Array.isArray(data.mHardCandidates) ? data.mHardCandidates : [];
    v2.index = 0;
    v2.answers = [];
    const total = $("ob2-q-total");
    if (total) total.textContent = String(v2.questions.length);
  } catch {
    // If the server is unreachable, the test cannot start — surface a clear
    // Finnish error and let the user retry.
    alert("Yhteys palvelimeen pätki. Yritä uudelleen hetken päästä.");
  }
}

function wireOB2() {
  const screen = document.getElementById("screen-ob2-test");
  if (!screen || screen.dataset.wired) return;
  screen.dataset.wired = "1";

  const optionsEl = $("ob2-options");
  if (!optionsEl) return;

  optionsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".ob2-option");
    if (!btn || btn.disabled) return;
    handleAnswer(btn);
  });
}

function renderQuestion() {
  const q = v2.questions[v2.index];
  if (!q) return finishOB2();
  v2.questionStartedAt = performance.now();

  const num = $("ob2-q-num");
  const total = $("ob2-q-total");
  const bar = $("ob2-progress-bar");
  if (num) num.textContent = String(v2.index + 1);
  if (total) total.textContent = String(v2.questions.length);
  if (bar) bar.style.width = `${Math.round(((v2.index) / v2.questions.length) * 100)}%`;

  $("ob2-question").textContent = q.question;

  const wrap = $("ob2-options");
  wrap.innerHTML = "";
  for (const opt of q.options || []) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ob2-option";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    // Options ship as e.g. "A) talo" — keep the leading letter as the value.
    const letter = String(opt).slice(0, 1).toUpperCase();
    btn.dataset.letter = letter;
    btn.textContent = String(opt);
    wrap.appendChild(btn);
  }

  $("ob2-feedback").classList.add("hidden");
}

function handleAnswer(btn) {
  const q = v2.questions[v2.index];
  if (!q) return;
  const elapsed = Math.round(performance.now() - v2.questionStartedAt);
  const selected = btn.dataset.letter;
  const correct = selected === q.correct;

  // Mark the chosen + correct options visually.
  const wrap = $("ob2-options");
  wrap.querySelectorAll(".ob2-option").forEach((b) => {
    b.disabled = true;
    if (b.dataset.letter === q.correct) b.classList.add("is-correct");
    if (b === btn && !correct) b.classList.add("is-wrong");
  });
  btn.setAttribute("aria-checked", "true");

  // Inline feedback panel
  const verdict = $("ob2-feedback-verdict");
  const explain = $("ob2-feedback-explain");
  verdict.textContent = correct ? "Oikein." : "Väärin.";
  verdict.classList.toggle("is-correct", correct);
  verdict.classList.toggle("is-wrong", !correct);
  explain.textContent = q.explanation || "";
  $("ob2-feedback").classList.remove("hidden");

  v2.answers.push({
    id: q.id,
    level: q.level,
    correct,
    time_ms: elapsed,
    selected,
  });

  // Auto-advance after 2.0s, or sooner on tap-anywhere.
  let advanced = false;
  const advance = () => {
    if (advanced) return;
    advanced = true;
    document.removeEventListener("pointerdown", maybeAdvance, true);
    next();
  };
  function maybeAdvance(ev) {
    // Allow the very click that triggered the answer to settle without
    // accidentally consuming it as the advance gesture.
    if (ev.target.closest(".ob2-option")) return;
    advance();
  }
  document.addEventListener("pointerdown", maybeAdvance, true);
  setTimeout(advance, 2000);
}

function next() {
  v2.index += 1;
  // Inject M_hard anchors if the student answered every A/B/C item correctly.
  if (v2.index === v2.questions.length && v2.mHardCandidates.length > 0) {
    const lowerWrong = v2.answers.some(
      (a) => ["A", "B", "C"].includes(a.level) && !a.correct,
    );
    if (!lowerWrong) {
      v2.questions.push(...v2.mHardCandidates);
      v2.mHardCandidates = []; // one-shot
      const total = $("ob2-q-total");
      if (total) total.textContent = String(v2.questions.length);
    }
  }
  if (v2.index >= v2.questions.length) {
    finishOB2();
  } else {
    renderQuestion();
  }
}

async function finishOB2() {
  const bar = $("ob2-progress-bar");
  if (bar) bar.style.width = "100%";
  show("screen-ob3-assessment");
  await loadOB3();
}

// ── OB-3: tutor assessment + score bars ─────────────────────────────────
function wireOB3() {
  const cta = $("ob3-next");
  if (cta && !cta.dataset.wired) {
    cta.dataset.wired = "1";
    cta.addEventListener("click", () => {
      renderOB4();
      show("screen-ob4-plan");
    });
  }
}

async function loadOB3() {
  $("ob3-skeleton").classList.remove("hidden");
  $("ob3-result").classList.add("hidden");

  let result = null;
  try {
    const res = await apiFetch(`${API}/api/placement/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        answers: v2.answers,
        selfReportedGrade: v2.schoolGrade && v2.schoolGrade !== "none" ? v2.schoolGrade : null,
        targetGrade: v2.targetGrade,
        weakAreas: v2.weakAreas,
        dailyGoalMinutes: v2.dailyGoalMinutes,
      }),
    });
    if (res.ok) result = await res.json();
  } catch { /* fall through to fallback */ }

  if (!result) {
    // Local fallback so OB-3/OB-4 still render if the network is dead.
    result = {
      placementLevel: "B",
      placementConfidence: "high",
      suggestedKurssi: "kurssi_3",
      suggestedKurssiName: "Kurssi 3 — Mitä tein",
      tutorAssessment:
        "Yhteys palvelimeen pätki, mutta jatketaan. Aloitetaan rauhallisesti perusteista ja päivitetään suunnitelma kun olet kirjautunut sisään.",
      firstWeekPlan: [],
      scoreByLevel: { A: { pct: 0 }, B: { pct: 0 }, C: { pct: 0 }, M: { pct: 0 } },
    };
  }
  v2.result = result;

  // Render
  $("ob3-tutor").textContent = result.tutorAssessment || "";

  const a = result.scoreByLevel?.A?.pct ?? 0;
  const b = result.scoreByLevel?.B?.pct ?? 0;
  const c = result.scoreByLevel?.C?.pct ?? 0;
  const m = result.scoreByLevel?.M?.pct ?? 0;
  // Score-bar mapping (4 dimensions, simple aggregations):
  //   Sanasto = (A + B) / 2  (vocab is heaviest at lower tiers)
  //   Kielioppi = (B + C) / 2
  //   Vaativa taso = M
  //   Kokonaisuus = mean of the four levels
  const fills = {
    "ob3-bar-vocab": Math.round((a + b) / 2),
    "ob3-bar-grammar": Math.round((b + c) / 2),
    "ob3-bar-advanced": Math.round(m),
    "ob3-bar-overall": Math.round((a + b + c + m) / 4),
  };
  for (const [id, pct] of Object.entries(fills)) {
    const fillEl = document.getElementById(id);
    const valEl = document.getElementById(`${id}-val`);
    if (fillEl) {
      // Mount, then animate next frame so the transition runs.
      fillEl.style.width = "0%";
      requestAnimationFrame(() => {
        fillEl.style.width = `${pct}%`;
      });
    }
    if (valEl) valEl.textContent = `${pct}%`;
  }

  $("ob3-kurssi").textContent = result.suggestedKurssiName || result.suggestedKurssi || "";
  const note = $("ob3-confidence-note");
  if (note) note.classList.toggle("hidden", result.placementConfidence !== "low");

  $("ob3-skeleton").classList.add("hidden");
  $("ob3-result").classList.remove("hidden");
  track("ob_v2_assessment_viewed", {
    placement: result.placementLevel,
    kurssi: result.suggestedKurssi,
    confidence: result.placementConfidence,
  });
}

// ── OB-4: first-week plan ───────────────────────────────────────────────
function wireOB4() {
  const cta = $("ob4-finish");
  if (cta && !cta.dataset.wired) {
    cta.dataset.wired = "1";
    cta.addEventListener("click", async () => {
      v2.navigated = true;
      track("ob_v2_completed", {
        placement: v2.result?.placementLevel,
        kurssi: v2.result?.suggestedKurssi,
      });
      // Mark legacy onboarding complete so the boot path doesn't bounce back.
      try {
        await apiFetch(`${API}/api/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ onboarding_completed: true }),
        });
      } catch { /* non-blocking */ }

      if (isLoggedIn()) {
        if (_deps.loadDashboard) _deps.loadDashboard();
      } else {
        // Stash the result so the auth screen can pick it up after register.
        try {
          sessionStorage.setItem("puheo_ob_v2_result", JSON.stringify({
            schoolGrade: v2.schoolGrade,
            targetGrade: v2.targetGrade,
            weakAreas: v2.weakAreas,
            dailyGoalMinutes: v2.dailyGoalMinutes,
            placementLevel: v2.result?.placementLevel,
            suggestedKurssi: v2.result?.suggestedKurssi,
          }));
        } catch { /* private mode — silent */ }
        location.hash = "#rekisteroidy";
        show("screen-auth");
      }
    });
  }
}

const TYPE_ICONS = {
  vocab: '<svg class="ob2-week__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v16H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M4 19.5A1.5 1.5 0 0 1 5.5 21H20"/></svg>',
  grammar: '<svg class="ob2-week__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4L8.5 18.5l-3.5.9.9-3.5z"/><path d="M14 6.5l3 3"/></svg>',
  writing: '<svg class="ob2-week__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19l7-7-3-3-7 7v3z"/><path d="M5 21h14"/></svg>',
  review: '<svg class="ob2-week__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
};

function renderOB4() {
  const list = $("ob4-week");
  if (!list) return;
  const plan = v2.result?.firstWeekPlan || [];
  list.innerHTML = "";
  if (plan.length === 0) {
    const empty = document.createElement("li");
    empty.className = "ob2-week__row";
    empty.innerHTML = '<span class="ob2-week__day">·</span><p class="ob2-week__title">Suunnitelma päivittyy kun olet kirjautunut sisään.</p><span class="ob2-week__meta">~</span>';
    list.appendChild(empty);
    return;
  }
  for (const item of plan) {
    const li = document.createElement("li");
    li.className = "ob2-week__row";
    const iconHtml = TYPE_ICONS[item.type] || TYPE_ICONS.vocab;
    li.innerHTML = `
      <span class="ob2-week__day">${escapeHtml(item.day)}</span>
      <p class="ob2-week__title">${escapeHtml(item.taskTitle)}</p>
      <span class="ob2-week__meta">${iconHtml}<span class="mono-num">~${Number(item.estimatedMinutes) || 10} min</span></span>
    `;
    list.appendChild(li);
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
