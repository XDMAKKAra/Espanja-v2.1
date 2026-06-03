// v279 — Sentence build (Käännä lauseet) screen controller.
//
// Wires #screen-sentence-build to /api/reorder. Click-to-add +
// click-to-remove. Local exact-match grading (the backend already returns
// the `correct` array, no second round-trip needed). Mistakes logged via
// /api/mistake fire-and-forget so the SR engine sees them.

import { API, apiFetch, isLoggedIn, authHeader, humanizeApiError } from "../api.js";
import { show } from "../ui/nav.js";
import { state, apiLang } from "../state.js";

const SCREEN_ID = "screen-sentence-build";

const ui = {};
const session = {
  exercises: [],
  index: 0,
  // pool entries: { id, text, used }
  pool: [],
  // answer entries: indices into pool[], ordered
  answer: [],
  submitted: false,
  correctCount: 0,
  loading: false,
};

function $id(id) { return document.getElementById(id); }

function cacheRefs() {
  if (ui._cached) return;
  ui.hint    = $id("sb-hint");
  ui.current = $id("sb-current");
  ui.total   = $id("sb-total");
  ui.pool    = $id("sb-token-pool");
  ui.answer  = $id("sb-answer-area");
  ui.reset   = $id("sb-reset");
  ui.submit  = $id("sb-submit");
  ui.feedback= $id("sb-feedback");
  ui.verdict = $id("sb-verdict");
  ui.correct = $id("sb-correct");
  ui.correctText = $id("sb-correct-text");
  ui.explain = $id("sb-explain");
  ui.next    = $id("sb-next");
  ui.error   = $id("sb-error");
  ui.body    = $id("sb-body");
  ui.summary = $id("sb-summary");
  ui.summaryCorrect = $id("sb-summary-correct");
  ui.summaryTotal   = $id("sb-summary-total");
  ui.restart = $id("sb-restart");
  ui.done    = $id("sb-done");
  ui._cached = true;
}

function setError(msg) {
  if (!ui.error) return;
  if (!msg) { ui.error.hidden = true; ui.error.textContent = ""; return; }
  ui.error.hidden = false;
  ui.error.textContent = msg;
}

async function fetchExercises({ level, count, language }) {
  // Mounted at app.use("/api", exerciseRoutes) → the route is /api/reorder,
  // NOT /api/exercises/reorder (every other exercise call is bare too).
  const res = await apiFetch(`${API}/api/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ level, count, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // humanizeApiError returns { title, subtext } — never pass the object
    // straight to new Error() or the box renders the literal "[object Object]".
    const human = humanizeApiError(err?.error);
    throw new Error(human.subtext || human.title || "Lauseiden lataus epäonnistui.");
  }
  const data = await res.json();
  if (!Array.isArray(data?.exercises) || data.exercises.length === 0) {
    throw new Error("Lauseita ei saatu, yritä uudelleen.");
  }
  return data.exercises;
}

export async function openSentenceBuild(opts = {}) {
  cacheRefs();
  const lang = opts.language || apiLang() || "spanish";
  const level = opts.level || state.level || "B";
  const count = Math.max(4, Math.min(8, Number(opts.count) || 6));

  show(SCREEN_ID);
  if (location.hash !== "#/lauseet") {
    try { history.replaceState(null, "", "#/lauseet"); } catch { /* private mode */ }
  }

  setError(null);
  if (ui.summary) ui.summary.hidden = true;
  if (ui.body) ui.body.hidden = false;
  if (ui.feedback) ui.feedback.hidden = true;
  if (ui.hint) ui.hint.textContent = "Ladataan lauseita…";
  if (ui.pool) ui.pool.innerHTML = "";
  if (ui.answer) ui.answer.innerHTML = "";
  if (ui.submit) ui.submit.disabled = true;

  if (session.loading) return;
  session.loading = true;

  try {
    if (!isLoggedIn()) throw new Error("Kirjaudu sisään aloittaaksesi.");
    const exercises = await fetchExercises({ level, count, language: lang });
    session.exercises = exercises;
    session.index = 0;
    session.correctCount = 0;
    renderCurrent();
  } catch (err) {
    if (ui.hint) ui.hint.textContent = "";
    setError(err?.message || "Lauseiden lataus epäonnistui.");
  } finally {
    session.loading = false;
  }
}

function renderCurrent() {
  const ex = session.exercises[session.index];
  if (!ex) return showSummary();

  session.pool = (ex.scrambled || []).map((text, i) => ({ id: i, text: String(text), used: false }));
  session.answer = [];
  session.submitted = false;

  ui.current.textContent = String(session.index + 1);
  ui.total.textContent   = String(session.exercises.length);
  ui.hint.textContent    = ex.finnishHint || "";
  ui.feedback.hidden     = true;
  ui.answer.classList.remove("is-correct", "is-wrong");
  ui.submit.disabled = true;
  ui.reset.disabled = false;

  renderPool();
  renderAnswer();
}

function renderPool() {
  ui.pool.innerHTML = "";
  for (const tok of session.pool) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sb-token";
    if (tok.used) btn.classList.add("is-used");
    if (session.submitted) btn.dataset.locked = "true";
    btn.textContent = tok.text;
    btn.setAttribute("aria-pressed", tok.used ? "true" : "false");
    btn.setAttribute("aria-label", `Lisää sana ${tok.text}`);
    btn.addEventListener("click", () => addToAnswer(tok.id));
    ui.pool.appendChild(btn);
  }
}

function renderAnswer() {
  ui.answer.innerHTML = "";
  for (const id of session.answer) {
    const tok = session.pool[id];
    if (!tok) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sb-token";
    if (session.submitted) btn.dataset.locked = "true";
    btn.textContent = tok.text;
    btn.setAttribute("aria-label", `Poista sana ${tok.text}`);
    btn.addEventListener("click", () => removeFromAnswer(id));
    ui.answer.appendChild(btn);
  }
  ui.submit.disabled = session.submitted || session.answer.length !== session.pool.length;
}

function addToAnswer(tokenId) {
  if (session.submitted) return;
  const tok = session.pool[tokenId];
  if (!tok || tok.used) return;
  tok.used = true;
  session.answer.push(tokenId);
  renderPool();
  renderAnswer();
}

function removeFromAnswer(tokenId) {
  if (session.submitted) return;
  session.answer = session.answer.filter((id) => id !== tokenId);
  if (session.pool[tokenId]) session.pool[tokenId].used = false;
  renderPool();
  renderAnswer();
}

function reset() {
  if (session.submitted) return;
  session.answer = [];
  for (const t of session.pool) t.used = false;
  renderPool();
  renderAnswer();
}

function arraysEqualCI(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (String(a[i]).toLowerCase() !== String(b[i]).toLowerCase()) return false;
  }
  return true;
}

function submit() {
  if (session.submitted) return;
  if (session.answer.length !== session.pool.length) return;
  const ex = session.exercises[session.index];
  if (!ex) return;
  session.submitted = true;

  const userOrder = session.answer.map((id) => session.pool[id].text);
  const correctOrder = ex.correct || [];
  const isCorrect = arraysEqualCI(userOrder, correctOrder);

  if (isCorrect) session.correctCount += 1;

  ui.feedback.hidden = false;
  ui.verdict.textContent = isCorrect ? "Oikein." : "Ei aivan.";
  ui.verdict.dataset.correct = String(isCorrect);
  ui.answer.classList.toggle("is-correct", isCorrect);
  ui.answer.classList.toggle("is-wrong", !isCorrect);

  if (isCorrect) {
    ui.correct.hidden = true;
  } else {
    ui.correct.hidden = false;
    ui.correctText.textContent = correctOrder.join(" ");
  }
  ui.explain.textContent = ex.explanation || "";
  ui.submit.disabled = true;
  ui.reset.disabled = true;

  // Re-render to apply data-locked on both panels.
  renderPool();
  renderAnswer();

  if (!isCorrect && isLoggedIn()) {
    apiFetch(`${API}/api/mistake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        type: "reorder",
        userAnswer: userOrder.join(" "),
        correctAnswer: correctOrder.join(" "),
        question: ex.finnishHint || "",
      }),
    }).catch(() => { /* fire-and-forget */ });
  }

  // Focus the next button so keyboard users can proceed without hunting.
  setTimeout(() => ui.next?.focus(), 0);
}

function nextExercise() {
  session.index += 1;
  if (session.index >= session.exercises.length) return showSummary();
  renderCurrent();
}

function showSummary() {
  if (!ui.summary) return;
  ui.body.hidden = true;
  ui.summary.hidden = false;
  ui.summaryCorrect.textContent = String(session.correctCount);
  ui.summaryTotal.textContent   = String(session.exercises.length);
}

function goBackToWriting() {
  show("screen-mode-writing");
  try { history.replaceState(null, "", "#/kirjoitus"); } catch { /* private mode */ }
}

function restart() {
  openSentenceBuild({});
}

let _wired = false;
export function initSentenceBuild() {
  if (_wired) return;
  cacheRefs();
  ui.reset?.addEventListener("click", reset);
  ui.submit?.addEventListener("click", submit);
  ui.next?.addEventListener("click", nextExercise);
  ui.restart?.addEventListener("click", restart);
  ui.done?.addEventListener("click", goBackToWriting);

  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="back-to-writing"]')) {
      e.preventDefault();
      goBackToWriting();
    }
  });
  _wired = true;
}

// Expose pure helpers for unit testing.
export const _internal = { arraysEqualCI };
