import { $, show } from "../ui/nav.js";
import { state } from "../state.js";
import { showLoadingError } from "../ui/loading.js";
import { track } from "../analytics.js";
import {
  loadVerbs,
  PERSON_LABELS,
  TENSE_LABELS,
  IMPERATIVE_PERSONS,
  IMPERATIVE_PERSON_LABELS,
  normalize,
} from "../features/verbsData.js";

const MAX_PARADIGMS_PER_SPRINT = 3;

let _deps = {};
let session = null;

export function initVerbSprint(deps) {
  _deps = deps || {};
  wireEvents();
}

function wireEvents() {
  const startBtn = $("btn-start-verbsprint");
  if (startBtn) startBtn.addEventListener("click", startSprint);

  const tenseCards = $("verbsprint-tense-cards");
  if (tenseCards) {
    tenseCards.addEventListener("click", (e) => {
      const card = e.target.closest(".topic-card");
      if (!card) return;
      tenseCards.querySelectorAll(".topic-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
    });
  }

  const durationPicker = $("verbsprint-duration-picker");
  if (durationPicker) {
    durationPicker.addEventListener("click", (e) => {
      const btn = e.target.closest(".lvl-btn");
      if (!btn) return;
      durationPicker.querySelectorAll(".lvl-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  }

  const form = $("vs-answer-form");
  if (form) form.addEventListener("submit", onSubmitAnswer);

  const nextBtn = $("vs-btn-next");
  if (nextBtn) nextBtn.addEventListener("click", nextPrompt);

  const paradigmBtn = $("vs-paradigm-btn");
  if (paradigmBtn) paradigmBtn.addEventListener("click", showParadigm);

  const paradigmContinue = $("paradigm-continue");
  if (paradigmContinue) paradigmContinue.addEventListener("click", onParadigmContinue);

  const paradigmClose = $("paradigm-close");
  if (paradigmClose) paradigmClose.addEventListener("click", closeParadigm);

  const paradigmOverlay = $("paradigm-overlay");
  if (paradigmOverlay) {
    paradigmOverlay.addEventListener("click", (e) => {
      if (e.target === paradigmOverlay) closeParadigm();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("paradigm-overlay").classList.contains("hidden")) {
      closeParadigm();
    }
  });

  const againBtn = $("vs-btn-again");
  if (againBtn) againBtn.addEventListener("click", () => startSprintWith(session?.tense, session?.total));

  const restartBtn = $("vs-btn-restart");
  if (restartBtn) restartBtn.addEventListener("click", () => show("screen-mode-verbsprint"));
}

function pickPrompts(verbs, tense, count) {
  const persons = tense === "imperative" ? IMPERATIVE_PERSONS : ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];
  const pool = [];
  verbs.forEach((v) => {
    persons.forEach((p) => {
      const form = getForm(v, tense, p);
      if (form) pool.push({ verb: v, person: p, correct: form });
    });
  });

  // Shuffle + take count, but ensure no immediate repeats of the same verb.
  const shuffled = shuffle(pool);
  const picked = [];
  const recentVerbs = [];
  for (const p of shuffled) {
    if (picked.length >= count) break;
    if (recentVerbs.slice(-1)[0] === p.verb.inf) continue;
    picked.push(p);
    recentVerbs.push(p.verb.inf);
  }
  // Fill remaining if we skipped too many.
  while (picked.length < count && picked.length < pool.length) {
    for (const p of shuffled) {
      if (picked.length >= count) break;
      if (!picked.includes(p)) picked.push(p);
    }
  }
  return picked.slice(0, count);
}

function getForm(verb, tense, person) {
  if (tense === "imperative") return verb.imperative?.[person] || null;
  const persons = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];
  const idx = persons.indexOf(person);
  if (idx === -1) return null;
  return verb.conj?.[tense]?.[idx] || null;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function startSprint() {
  const tense = document.querySelector("#verbsprint-tense-cards .topic-card.active")?.dataset.tense || "preterite";
  const duration = parseInt(
    document.querySelector("#verbsprint-duration-picker .lvl-btn.active")?.dataset.duration || "10",
    10,
  );
  await startSprintWith(tense, duration);
}

async function startSprintWith(tense, duration) {
  try {
    const data = await loadVerbs();
    if (!data?.verbs?.length) throw new Error("no verbs");
    const prompts = pickPrompts(data.verbs, tense, duration);
    if (!prompts.length) throw new Error("no prompts");

    session = {
      tense,
      total: duration,
      prompts,
      index: 0,
      correct: 0,
      paradigmsShown: 0,
      results: [],
      promptShownAt: 0,
      startedAt: Date.now(),
    };

    state.mode = "verbsprint";
    state.sessionStartTime = Date.now();
    track("verbsprint_started", { tense, duration });

    show("screen-verbsprint");
    renderPrompt();
  } catch (err) {
    showLoadingError("Verbien lataus epäonnistui", () => startSprintWith(tense, duration));
  }
}

function renderPrompt() {
  const p = session.prompts[session.index];
  const tenseLabel = TENSE_LABELS[session.tense] || session.tense;
  $("vs-counter").textContent = `${session.index + 1} / ${session.total}`;
  $("vs-tense-badge").textContent = tenseLabel;
  $("vs-paradigms-badge").textContent = `📖 ${MAX_PARADIGMS_PER_SPRINT - session.paradigmsShown}`;
  $("vs-progress-fill").style.width = `${(session.index / session.total) * 100}%`;

  $("vs-infinitive").textContent = p.verb.inf;
  $("vs-translation").textContent = p.verb.tr || "";

  const personLabel =
    session.tense === "imperative"
      ? IMPERATIVE_PERSON_LABELS[p.person]
      : PERSON_LABELS[p.person];
  $("vs-person").textContent = personLabel;

  const input = $("vs-input");
  input.value = "";
  input.disabled = false;
  input.classList.remove("is-correct", "is-wrong");

  $("vs-feedback").classList.add("hidden");
  $("vs-answer-form").classList.remove("hidden");

  const paradigmBtn = $("vs-paradigm-btn");
  if (session.paradigmsShown >= MAX_PARADIGMS_PER_SPRINT) {
    paradigmBtn.disabled = true;
    paradigmBtn.textContent = "📖 Paradigmakatsaukset käytetty";
  } else {
    paradigmBtn.disabled = false;
    paradigmBtn.textContent = `📖 Näytä paradigma (${MAX_PARADIGMS_PER_SPRINT - session.paradigmsShown} jäljellä)`;
  }

  session.promptShownAt = performance.now();
  setTimeout(() => input.focus(), 30);
}

function onSubmitAnswer(e) {
  e.preventDefault();
  if ($("vs-input").disabled) return;

  const p = session.prompts[session.index];
  const answer = $("vs-input").value;
  const normalizedAnswer = normalize(answer);
  const normalizedCorrect = normalize(p.correct);
  const isCorrect = normalizedAnswer !== "" && normalizedAnswer === normalizedCorrect;
  const reactionMs = Math.round(performance.now() - session.promptShownAt);

  if (isCorrect) session.correct++;

  session.results.push({
    verb: p.verb.inf,
    tense: session.tense,
    person: p.person,
    correct: isCorrect,
    reaction_ms: reactionMs,
    answer: answer.trim(),
    expected: p.correct,
  });

  track("verbsprint_answer", {
    verb: p.verb.inf,
    tense: session.tense,
    person: p.person,
    correct: isCorrect,
    reaction_ms: reactionMs,
  });

  showFeedback(isCorrect, p);
}

function showFeedback(isCorrect, prompt) {
  $("vs-input").disabled = true;
  $("vs-input").classList.add(isCorrect ? "is-correct" : "is-wrong");
  $("vs-answer-form").classList.add("hidden");

  const fb = $("vs-feedback");
  fb.classList.remove("hidden");
  fb.classList.toggle("is-correct", isCorrect);
  fb.classList.toggle("is-wrong", !isCorrect);
  $("vs-feedback-status").textContent = isCorrect ? "✓ Oikein" : "✗ Väärin";
  $("vs-feedback-correct").innerHTML = isCorrect
    ? `<span class="vs-fb-form">${escapeHtml(prompt.correct)}</span>`
    : `Oikea vastaus: <span class="vs-fb-form">${escapeHtml(prompt.correct)}</span>`;

  setTimeout(() => $("vs-btn-next").focus(), 30);
}

function nextPrompt() {
  session.index++;
  if (session.index >= session.prompts.length) {
    showResults();
  } else {
    renderPrompt();
  }
}

function showParadigm() {
  if (session.paradigmsShown >= MAX_PARADIGMS_PER_SPRINT) return;
  const p = session.prompts[session.index];
  const tenseLabel = TENSE_LABELS[session.tense] || session.tense;

  $("paradigm-title").textContent = `${p.verb.inf} — ${tenseLabel.toLowerCase()}`;
  $("paradigm-kicker").textContent = `Paradigma ${session.paradigmsShown + 1} / ${MAX_PARADIGMS_PER_SPRINT}`;

  const body = $("paradigm-body");
  body.innerHTML = "";
  const table = document.createElement("table");
  table.className = "paradigm-table";

  if (session.tense === "imperative") {
    IMPERATIVE_PERSONS.forEach((pk) => {
      const row = document.createElement("tr");
      row.innerHTML = `<th>${IMPERATIVE_PERSON_LABELS[pk]}</th><td>${escapeHtml(p.verb.imperative?.[pk] || "—")}</td>`;
      table.appendChild(row);
    });
  } else {
    const persons = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];
    persons.forEach((pk, i) => {
      const form = p.verb.conj?.[session.tense]?.[i] || "—";
      const row = document.createElement("tr");
      row.innerHTML = `<th>${PERSON_LABELS[pk]}</th><td>${escapeHtml(form)}</td>`;
      table.appendChild(row);
    });
  }
  body.appendChild(table);

  session.paradigmsShown++;
  track("verbsprint_paradigm_shown", {
    verb: p.verb.inf,
    tense: session.tense,
    remaining: MAX_PARADIGMS_PER_SPRINT - session.paradigmsShown,
  });

  $("paradigm-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeParadigm() {
  $("paradigm-overlay").classList.add("hidden");
  document.body.style.overflow = "";
}

function onParadigmContinue() {
  closeParadigm();
  // Per spec: after paradigm view, skip to next verb.
  session.results.push({
    verb: session.prompts[session.index].verb.inf,
    tense: session.tense,
    person: session.prompts[session.index].person,
    correct: false,
    reaction_ms: null,
    skipped: "paradigm",
  });
  nextPrompt();
}

function showResults() {
  const total = session.prompts.length;
  const correct = session.correct;
  const answered = session.results.filter((r) => r.reaction_ms != null);
  const avgMs = answered.length
    ? Math.round(answered.reduce((s, r) => s + r.reaction_ms, 0) / answered.length)
    : 0;

  $("vs-score-display").textContent = `${correct}/${total}`;
  $("vs-score-text").textContent = `${correct} / ${total} oikein`;
  $("vs-timing").textContent = avgMs ? `Keskim. reaktioaika: ${(avgMs / 1000).toFixed(1)} s` : "";

  const wrongByVerb = {};
  session.results.forEach((r) => {
    if (!r.correct) wrongByVerb[r.verb] = (wrongByVerb[r.verb] || 0) + 1;
  });
  const weakest = Object.entries(wrongByVerb)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);

  const weakEl = $("vs-weakest");
  weakEl.innerHTML = "";
  if (weakest.length) {
    const label = document.createElement("p");
    label.className = "vs-weakest-label";
    label.textContent = "Harjoittele lisää:";
    weakEl.appendChild(label);
    weakest.forEach((v) => {
      const tag = document.createElement("span");
      tag.className = "gram-error-tag";
      tag.textContent = v;
      weakEl.appendChild(tag);
    });
  }

  track("verbsprint_completed", {
    tense: session.tense,
    total,
    correct,
    avg_reaction_ms: avgMs,
    paradigms_shown: session.paradigmsShown,
    duration_ms: Date.now() - session.startedAt,
  });

  if (_deps.saveProgress) {
    _deps.saveProgress({
      mode: "verbsprint",
      level: session.tense,
      scoreCorrect: correct,
      scoreTotal: total,
      ytlGrade: null,
    });
  }

  show("screen-verbsprint-results");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
