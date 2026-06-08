/**
 * L-COURSE-1 UPDATE 4-6, phase-based lesson runner for pre-generated lesson JSON.
 *
 * Activates only when /api/curriculum/:k/lesson/:i returns a `pregenerated`
 * payload (schemas/lesson.json shape). Legacy runtime-OpenAI lessons keep using
 * js/screens/curriculum.js renderLessonPage().
 *
 * Pedagogy (skills referenced):
 *  - education/practice-problem-sequence-designer, phase order is authored, runner executes
 *  - education/formative-assessment-loop-designer, instant feedback per item
 *  - education/self-efficacy-builder-sequence, mastery banner copy never shames
 *  - education/spaced-practice-scheduler, failedItems carry into compatible later phases
 *  - puheo-finnish-voice, all copy is sinä-form, concrete, no superlatives
 */
import { show } from "../ui/nav.js";
import { state as appState } from "../state.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { masteryThresholdFor, isPhaseSkipped } from "../lib/lessonAdapter.js";
import { normalizeAnswer, answerMatches } from "../lib/lessonAnswerMatch.js";
import { attachAccentBarAll } from "../features/accentBar.js";
import { attachCharCounter, wordsToChars } from "../features/charCounter.js";
import { REVIEW_PHASE_ID, buildReviewPhase } from "../lib/reviewPhase.js";

const ROOT_ID = "lesson-runner-root";
const PROGRESS_KEY_PREFIX = "puheo:lessonProgress:";

// PR auto/asetukset-profile-race-fix (2026-05-19): return to the per-course
// detail screen via hash navigation. Previously the "← Oppimispolku" and
// "Takaisin oppimispolulle →" buttons called curriculum.loadCurriculum()
// which forced show("screen-path") — that screen is now display:none, so
// the click left the lesson visible but inert. Route to the new course
// detail page (or its parent oppimispolku index as a fallback).
function backToCourse(state) {
  const lang = (state && typeof state.language === "string" && state.language) || "es";
  const kurssi = state && state.kurssiKey ? encodeURIComponent(state.kurssiKey) : "";
  const target = kurssi
    ? `#/oppimispolku/${lang}/${kurssi}`
    : `#/oppimispolku?lang=${lang}`;
  if (location.hash !== target) location.hash = target;
}

/* Course-lesson list cache for the left TOC on the lesson screen.
   PR auto/lesson-3col-breadcrumb (2026-05-19). One fetch per kurssi per
   page load — the response is the same regardless of which lesson the
   student is on. Keyed by kurssiKey → array of lesson meta objects. */
const _courseLessonsCache = new Map();
async function getCourseLessons(kurssiKey) {
  if (!kurssiKey) return [];
  if (_courseLessonsCache.has(kurssiKey)) return _courseLessonsCache.get(kurssiKey);
  try {
    const { API, isLoggedIn, authHeader, apiFetch } = await import("../api.js");
    const res = await apiFetch(`${API}/api/curriculum/${encodeURIComponent(kurssiKey)}`, {
      headers: { ...(isLoggedIn() ? authHeader() : {}) },
    });
    if (!res.ok) { _courseLessonsCache.set(kurssiKey, []); return []; }
    const data = await res.json();
    const lessons = Array.isArray(data.lessons) ? data.lessons.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [];
    _courseLessonsCache.set(kurssiKey, lessons);
    return lessons;
  } catch {
    return [];
  }
}

function renderLessonTOC(state) {
  // PR auto/lesson-toc-phases (2026-05-19) — TOC switched from sibling
  // lessons to current-lesson PHASES per user request: "vasemmal näkyy
  // kaikki sen oppitunnin tehtävät, niitä tehtäviä voi tehdä edes
  // takaisin". Each phase row carries its title (e.g. "Tehtävä 3.
  // Yhdistä") + done/current/future state. Clicking jumps to that
  // phase's first item.
  const phases = Array.isArray(state.phases) ? state.phases : [];
  if (phases.length === 0) {
    return `<aside class="lr-toc" aria-label="Tehtävät">
      <p class="lr-toc__head">Tehtävät</p>
      <p class="lr-toc__loading">Ei vaiheita.</p>
    </aside>`;
  }
  const currentIdx = state.currentPhaseIdx;
  const doneSet = new Set(
    (state.phaseResults || [])
      .filter((r) => !r.skipped && r.mastered)
      .map((r) => r.phaseId)
  );
  const items = phases.map((p, i) => {
    const isCurrent = i === currentIdx;
    const isDone = doneSet.has(p.phase_id) && !isCurrent;
    const cls = [
      "lr-toc__item",
      isCurrent ? "is-current" : "",
      isDone ? "is-done" : "",
    ].filter(Boolean).join(" ");
    const mark = isCurrent ? "→" : (isDone ? "✓" : "");
    const title = p.title || `Vaihe ${i + 1}`;
    return `<li class="${cls}" data-phase="${i}" ${isCurrent ? '' : 'tabindex="0"'}>
      <span class="lr-toc__num">${i + 1}</span>
      <span class="lr-toc__title">${escapeHtml(title)}</span>
      <span class="lr-toc__mark" aria-hidden="true">${mark}</span>
    </li>`;
  }).join("");
  return `<aside class="lr-toc" aria-label="Tehtävät">
    <p class="lr-toc__head">Tehtävät</p>
    <ol class="lr-toc__list">${items}</ol>
  </aside>`;
}

function wireLessonTOC(root, state) {
  root.querySelectorAll(".lr-toc__item:not(.is-current)").forEach((li) => {
    const click = () => {
      const idx = Number(li.dataset.phase);
      if (!Number.isFinite(idx) || idx === state.currentPhaseIdx) return;
      // Save progress before jumping so the resume snapshot reflects
      // the actual furthest-reached phase, not the one we land on.
      saveLessonProgress(state);
      state.currentPhaseIdx = idx;
      state.currentItemIdx = 0;
      state.correctInPhase = 0;
      state.answeredInPhase = 0;
      saveLessonProgress(state);
      renderPhase(root, state);
    };
    li.addEventListener("click", click);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(); }
    });
  });
}

function renderBreadcrumb(state) {
  const meta = state.lesson.meta || {};
  const kurssiTitle = meta.kurssi_title || meta.course_title || meta.course_key || "Kurssi";
  const lessonNum = meta.lesson_index || state.lessonIndex;
  const lessonTitle = meta.title || "Oppitunti";
  return `<nav class="lr-breadcrumb" aria-label="Sijainti">
    <a class="lr-breadcrumb__link" href="#/oppimispolku" id="lr-breadcrumb-path">Oppimispolku</a>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb">${escapeHtml(kurssiTitle)}</span>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb is-current" aria-current="page">${escapeHtml(`${lessonNum}. ${lessonTitle}`)}</span>
  </nav>`;
}

/**
 * Resume support — save the active state shape to sessionStorage so the
 * student can leave a half-done lesson and pick up exactly where they
 * stopped on re-entry. Stored per (kurssiKey, lessonIndex) key.
 *
 * What we persist: phase index, item index, per-phase correct/answered
 * counters, completed phaseResults, sidePanelOpenMs. We do NOT persist
 * the lesson payload itself — it's re-fetched on entry and matched to
 * the saved snapshot. If the lesson definition has changed (new phases,
 * different item count) we discard the snapshot to avoid index drift.
 */
function progressKey(kurssiKey, lessonIndex) {
  return `${PROGRESS_KEY_PREFIX}${kurssiKey}:${lessonIndex}`;
}

export function saveLessonProgress(state) {
  if (!state || !state.kurssiKey || state.finished) return;
  // Only save once the student is actually IN the practice (past the
  // teaching page) — saving "0/0" before the first item is noise.
  if (state.currentPhaseIdx === 0 && state.currentItemIdx === 0 && state.answeredInPhase === 0) {
    return;
  }
  try {
    sessionStorage.setItem(progressKey(state.kurssiKey, state.lessonIndex), JSON.stringify({
      currentPhaseIdx: state.currentPhaseIdx,
      currentItemIdx: state.currentItemIdx,
      correctInPhase: state.correctInPhase,
      answeredInPhase: state.answeredInPhase,
      phaseResults: state.phaseResults,
      targetGrade: state.targetGrade,
      phaseSignature: state.phases.map((p) => `${p.phase_id}:${p.items.length}`).join("|"),
      savedAt: Date.now(),
    }));
  } catch { /* quota / private mode — silently skip */ }
}

function loadLessonProgress(kurssiKey, lessonIndex, freshState) {
  try {
    const raw = sessionStorage.getItem(progressKey(kurssiKey, lessonIndex));
    if (!raw) return null;
    const snap = JSON.parse(raw);
    if (!snap || typeof snap !== "object") return null;
    // Lesson definition drift guard.
    const currentSig = freshState.phases.map((p) => `${p.phase_id}:${p.items.length}`).join("|");
    if (snap.phaseSignature !== currentSig) return null;
    // Stale snapshot guard (24h).
    if (snap.savedAt && Date.now() - snap.savedAt > 24 * 60 * 60 * 1000) return null;
    return snap;
  } catch {
    return null;
  }
}

export function clearLessonProgress(kurssiKey, lessonIndex) {
  try {
    sessionStorage.removeItem(progressKey(kurssiKey, lessonIndex));
  } catch { /* private mode */ }
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// ── Lesson runner state ────────────────────────────────────────────────────

function makeState(lesson, targetGrade, kurssiKey, lessonIndex) {
  const phases = (lesson.phases || []).filter((p) => !isPhaseSkipped(p, targetGrade));
  return {
    lesson,
    kurssiKey,
    lessonIndex,
    targetGrade,
    // L-LANG-INFRA-1 / L-V410: the active language was never set on the runner
    // state, so finalizeLesson stamped every completion as "es". Pull it from
    // the canonical app state so completions + adaptive capture are scoped to
    // the right language.
    language: (typeof appState.language === "string" && appState.language) || "es",
    phases,
    currentPhaseIdx: 0,
    currentItemIdx: 0,
    correctInPhase: 0,
    answeredInPhase: 0,
    // L-V410 Vaihe 1 (CAPTURE) — every graded answer, flushed to the server at
    // lesson finalize to feed user_mistakes + sr_cards (kurssi tier only).
    gradedItems: [],
    phaseResults: [], // { phaseId, title, correct, total, mastered, skipped }
    sidePanelOpen: false,
    sidePanelOpenMs: 0,
    sidePanelOpenedAt: 0,
    startedAt: Date.now(),
    finished: false,
  };
}

// ── L-V411 Vaihe C — resurface review phase ─────────────────────────────────

// Fetch the calibrated review queue (mastery tier only; the server gates and
// returns { locked:true } for free/treeni). Returns the payload or null.
async function fetchReviewQueue(lang) {
  try {
    const r = await apiFetch(
      `${API}/api/curriculum/review-queue?lang=${encodeURIComponent(lang || "es")}&limit=8`,
      { headers: { ...authHeader() } }
    );
    if (!r || !r.ok) return null;
    const data = await r.json();
    return (data && !data.locked && Array.isArray(data.items) && data.items.length) ? data : null;
  } catch { return null; }
}

// Prepend the review phase before the authored phases when the learner has weak
// concepts to revisit. Bounded by a timeout so a slow/failed fetch never stalls
// the lesson start. Runs before loadLessonProgress so the phase list stays
// consistent across save + resume.
async function maybePrependReviewPhase(state) {
  try {
    if (typeof isLoggedIn === "function" && !isLoggedIn()) return;
    const queue = await Promise.race([
      fetchReviewQueue(state.language),
      new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    if (queue && Array.isArray(queue.items) && queue.items.length) {
      state.phases = [buildReviewPhase(queue), ...state.phases];
    }
  } catch { /* non-fatal: the lesson runs without a review phase */ }
}

// ── Public entry ───────────────────────────────────────────────────────────

export async function runPregeneratedLesson(payload, kurssiKey, lessonIndex, targetGrade) {
  const lesson = payload.pregenerated || payload;
  ensureRoot();
  show("screen-lesson");
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  const state = makeState(lesson, targetGrade || "B", kurssiKey, lessonIndex);
  // Persist context for nav-away guards.
  try {
    sessionStorage.setItem("currentLesson", JSON.stringify({
      kurssiKey, lessonIndex,
      lessonFocus: lesson.meta?.title || "",
      lessonType: lesson.meta?.lesson_type || "",
      targetGrade: state.targetGrade,
      isPregenerated: true,
    }));
    // Hotfix, make the floating "📖 Opetussivu" panel show real content
    // while the student is inside the lesson runner. Compose the panel
    // body from the authored teaching block (intro + key points) so it
    // mirrors what they saw on the teaching step.
    const teaching = lesson.teaching || {};
    const intro = String(teaching.intro_md || "").trim();
    const kp = Array.isArray(teaching.key_points) ? teaching.key_points : [];
    const md = [
      intro,
      kp.length ? "## Avainkohdat\n" + kp.map((k) => `- ${k}`).join("\n") : "",
    ].filter(Boolean).join("\n\n");
    if (md) sessionStorage.setItem("currentLessonTeachingMd", md);
    else sessionStorage.removeItem("currentLessonTeachingMd");
  } catch { /* private mode */ }

  // PR auto/lesson-3col-breadcrumb — fetch the course's lesson list once
  // so the left TOC can show siblings + completed marks. Non-blocking;
  // if the fetch fails the TOC just stays in its "Ladataan…" state, the
  // rest of the runner still works.
  state._courseLessons = [];
  getCourseLessons(kurssiKey).then((lessons) => {
    state._courseLessons = lessons;
    // Re-render the TOC if the lesson is already on screen so the
    // skeleton "Ladataan…" gets replaced with the real list.
    const tocHost = document.querySelector(".lr-shell .lr-toc");
    if (tocHost && tocHost.parentElement) {
      const fresh = document.createElement("div");
      fresh.innerHTML = renderLessonTOC(state);
      tocHost.parentElement.replaceChild(fresh.firstElementChild, tocHost);
      wireLessonTOC(document.getElementById(ROOT_ID), state);
    }
  });

  // L-V411 Vaihe C — prepend a calibrated review phase of previously-weak
  // concepts (mastery tier; server-gated). Awaited (bounded) before
  // loadLessonProgress so the phase list is consistent for save/resume.
  await maybePrependReviewPhase(state);

  // Resume: if the student left this lesson mid-practice (saved snapshot
  // matches the current lesson definition + within 24h), skip the teaching
  // page and drop them back where they were. Render a small toast at the
  // top of the page so they know it resumed, not started over.
  const snap = loadLessonProgress(kurssiKey, lessonIndex, state);
  if (snap) {
    state.currentPhaseIdx = snap.currentPhaseIdx;
    state.currentItemIdx = snap.currentItemIdx;
    state.correctInPhase = snap.correctInPhase || 0;
    state.answeredInPhase = snap.answeredInPhase || 0;
    state.phaseResults = Array.isArray(snap.phaseResults) ? snap.phaseResults : [];
    state.startedAt = Date.now();
    renderPhase(root, state);
    return;
  }

  renderTeaching(root, state);
}

function ensureRoot() {
  let screen = document.getElementById("screen-lesson");
  if (!screen) {
    screen = document.createElement("div");
    screen.id = "screen-lesson";
    screen.className = "screen";
    document.querySelector(".app-main")?.appendChild(screen) || document.body.appendChild(screen);
  }
  if (!document.getElementById(ROOT_ID)) {
    screen.innerHTML = `<div id="${ROOT_ID}"></div>`;
  }
}

// ── Step 1: teaching page ──────────────────────────────────────────────────

function renderTeaching(root, state) {
  const meta = state.lesson.meta || {};
  const teaching = state.lesson.teaching || {};
  const intro = renderSimpleMd(teaching.intro_md || "");
  const keyPoints = Array.isArray(teaching.key_points) ? teaching.key_points : [];
  const keyHtml = keyPoints.length
    ? `<ul class="lr-keypoints">${keyPoints.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul>`
    : "";

  root.innerHTML = `
    <div class="lr-shell lr-shell--teaching lr-shell--three">
      ${renderBreadcrumb(state)}
      <button type="button" class="lr-back" id="lr-back">← Oppimispolku</button>
      ${renderLessonTOC(state)}
      <header class="lr-hero">
        <p class="lr-eyebrow">${escapeHtml(meta.course_key || "")} · Oppitunti ${escapeHtml(String(meta.lesson_index || ""))}</p>
        <h1 class="display display--serif">${escapeHtml(meta.title || "Oppitunti")}</h1>
        ${meta.description ? `<p class="lr-desc">${escapeHtml(meta.description)}</p>` : ""}
      </header>
      <article class="lr-teaching">${intro}${keyHtml}</article>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-start">Aloita harjoittelu →</button>
        <p class="lr-hint">Voit avata Apua-paneelin milloin tahansa harjoituksen aikana.</p>
      </div>
    </div>`;
  wireLessonTOC(root, state);
  document.getElementById("lr-back")?.addEventListener("click", () => {
    backToCourse(state);
  });
  document.getElementById("lr-start")?.addEventListener("click", () => {
    state.startedAt = Date.now();
    renderPhase(root, state);
  });
}

// ── Step 2: phase + item rendering ─────────────────────────────────────────

function renderPhase(root, state) {
  const phase = state.phases[state.currentPhaseIdx];
  if (!phase) return finalizeLesson(root, state);

  const totalPhases = state.phases.length;
  const stepper = phaseStepper(state);
  const item = phase.items[state.currentItemIdx];
  if (!item) {
    // Phase complete, show banner.
    return renderPhaseBanner(root, state, phase, "completed");
  }

  root.innerHTML = `
    <div class="lr-shell lr-shell--exercise lr-shell--three">
      ${renderBreadcrumb(state)}
      <div class="lr-topbar">
        <button type="button" class="lr-exit-btn" id="lr-exit-lesson" aria-label="Takaisin oppimispolulle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          <span>Oppimispolku</span>
        </button>
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${state.currentPhaseIdx + 1} / ${totalPhases}</span>
          ${stepper}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${state.sidePanelOpen ? "true" : "false"}" aria-controls="lr-side-panel">📖 Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis tästä</button>
        </div>
      </div>
      ${renderLessonTOC(state)}
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${escapeHtml(phase.title || "Vaihe")}</h2>
        ${phase.instruction ? `<p class="lr-phase-instr">${escapeHtml(phase.instruction)}</p>` : ""}
        <p class="lr-item-counter">Kysymys ${state.currentItemIdx + 1} / ${phase.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${renderItem(item, state)}</div>
      ${renderSidePanel(state)}
    </div>`;

  wireExerciseHandlers(root, state, item);
  wireLessonTOC(root, state);
}

function phaseStepper(state) {
  const dots = state.phases.map((_, i) => {
    if (i < state.currentPhaseIdx) return '<span class="lr-step lr-step--done" aria-hidden="true">●</span>';
    if (i === state.currentPhaseIdx) return '<span class="lr-step lr-step--current" aria-hidden="true">●</span>';
    return '<span class="lr-step" aria-hidden="true">○</span>';
  }).join("");
  return `<span class="lr-stepper" aria-hidden="true">${dots}</span>`;
}

// ── Item type renderers ────────────────────────────────────────────────────

function renderItem(item, _state) {
  switch (item.item_type) {
    case "mc": return renderMC(item);
    case "typed": return renderTyped(item);
    case "translate": return renderTranslate(item);
    case "match": return renderMatch(item);
    case "gap_fill": return renderGapFill(item);
    case "writing": return renderWritingItem(item);
    case "reading_mc": return renderReadingMC(item);
    default:
      return `<p class="lr-unsupported">Tehtävätyyppiä "${escapeHtml(item.item_type || "?")}" ei tueta, ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`;
  }
}

function renderMC(item) {
  const ctx = item.context ? `<p class="lr-mc-context">${escapeHtml(item.context)}</p>` : "";
  return `
    <div class="lr-mc">
      ${ctx}
      <p class="lr-mc-stem">${escapeHtml(item.stem || "")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(item.choices || []).map((c, i) => `
          <button type="button" class="lr-mc-choice" data-mc-idx="${i}" role="radio" aria-checked="false">${escapeHtml(c)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderTyped(item) {
  const dirLabel = item.direction === "es_to_fi" ? "Käännä suomeksi" : "Käännä espanjaksi";
  return `
    <div class="lr-typed">
      <p class="lr-typed-dir">${dirLabel}</p>
      <p class="lr-typed-prompt">${escapeHtml(item.prompt || "")}</p>
      ${item.hint ? `<p class="lr-typed-hint">Vihje: ${escapeHtml(item.hint)}</p>` : ""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderTranslate(item) {
  return renderTyped({ ...item, prompt: item.source });
}

function renderMatch(item) {
  const lefts = (item.pairs || []).map((p) => p.left);
  const rights = shuffle((item.pairs || []).map((p) => p.right));
  return `
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdistä parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${lefts.map((l, i) => `<button type="button" class="lr-match-cell" data-side="left" data-idx="${i}">${escapeHtml(l)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${rights.map((r) => `<button type="button" class="lr-match-cell" data-side="right" data-val="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderGapFill(item) {
  // PR auto/inline-exercises (2026-05-19) — gap_fill rendering polished
  // to feel like the Eduix textbook inline-blank pattern (reference
  // screenshot 203255). Inputs are visually a thin underline, not a
  // boxed field. Word bank chips are clickable buttons that fill the
  // currently focused input (or the next empty one when no focus).
  const tpl = item.sentence_template || "";
  // Auto-size the inline input to roughly the expected answer length
  // so the prose flows naturally around the blank.
  const expectedLen = (item.answers || item.accepts || [])
    .reduce((max, a) => Math.max(max, String(a || "").length), 8);
  const inputCh = Math.min(Math.max(expectedLen, 6), 18);
  const html = escapeHtml(tpl).replace(/\{(\d+)\}/g, (_m, n) =>
    `<input type="text" class="lr-gap-input" data-gap="${n}" size="${inputCh}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Täytä kohta ${n}" />`
  );
  const bank = Array.isArray(item.word_bank) && item.word_bank.length
    ? `<div class="lr-gap-bank" role="group" aria-label="Sanapankki">
        ${item.word_bank.map((w) => `<button type="button" class="lr-gap-chip" data-word="${escapeHtml(w)}">${escapeHtml(w)}</button>`).join("")}
       </div>`
    : "";
  return `
    <div class="lr-gap">
      <p class="lr-gap-sentence">${html}</p>
      ${bank}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderWritingItem(item) {
  // Convert any legacy word-targets (min_words/max_words) into character
  // targets so the live mittari counts merkkejä, not sanoja. Per user
  // feedback 2026-05-18, kaikki tehtävät joissa lasketaan sanoja → laske
  // merkkejä. Item may also ship min_chars/max_chars directly.
  const minChars = Number(item.min_chars) || wordsToChars(item.min_words);
  const maxChars = Number(item.max_chars) || wordsToChars(item.max_words);
  return `
    <div class="lr-writing">
      <p class="lr-writing-prompt">${escapeHtml(item.prompt || "")}</p>
      <textarea class="lr-writing-input" id="lr-writing-input"
                data-min-chars="${minChars}" data-max-chars="${maxChars}"
                rows="8"></textarea>
      <p class="lr-writing-char-counter" id="lr-writing-char-counter">0 / ${minChars}–${maxChars} merkkiä</p>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">Lähetä</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderReadingMC(item) {
  const passage = escapeHtml(item.passage || "").replace(/\n/g, "<br>");
  const qs = (item.questions || []).map((q, qi) => `
    <fieldset class="lr-reading-q" data-q="${qi}">
      <legend>${escapeHtml(q.question_fi || "")}</legend>
      ${(q.choices || []).map((c, ci) => `
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${qi}" value="${ci}"> ${escapeHtml(c)}</label>
      `).join("")}
    </fieldset>
  `).join("");
  return `
    <div class="lr-reading">
      <article class="lr-reading-passage">${passage}</article>
      <div class="lr-reading-qs">${qs}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

// ── Item handlers ──────────────────────────────────────────────────────────

function wireExerciseHandlers(root, state, item) {
  // Stash state on root so the click-to-advance "Seuraava →" button in
  // showItemFeedback can call advanceItem without prop-drilling state.
  root.__lrState = state;
  // Attach the accent bar to every text input + textarea this item paints.
  // We do this once per item so newly created elements pick it up; the
  // bar itself dedupes via WeakSet so this is safe to call repeatedly.
  attachAccentBarAll(root, state.language);

  document.getElementById("lr-help-toggle")?.addEventListener("click", () => toggleSidePanel(root, state));
  document.getElementById("lr-skip")?.addEventListener("click", () => onSkipPhase(root, state));
  document.getElementById("lr-exit-lesson")?.addEventListener("click", async () => {
    // PR auto/quickfixes (2026-05-19): confirm modal removed per user
    // request. Realtime progress save runs on advanceItem + phase
    // transitions + here on exit, so closing without confirmation is
    // safe — the snapshot is on disk before the navigation lands.
    saveLessonProgress(state);
    location.hash = "#/aloitus";
  });
  root.querySelector("[data-lr-skip-item]")?.addEventListener("click", () => advanceItem(root, state, true));

  // Resolve the active language so accent tolerance can apply the
  // correct critical-pair guard. State.language defaults to es when
  // unset (legacy single-language users).
  const lang = (typeof state.language === "string" && state.language) || "es";

  if (item.item_type === "mc") {
    root.querySelectorAll(".lr-mc-choice").forEach((b) => {
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.mcIdx);
        const correct = idx === Number(item.correct_index);
        showItemFeedback(root, correct, item.explanation || "", { hint: null, waitForClick: !correct });
        markChoices(root, item.correct_index, idx);
        recordAnswer(state, correct);
        captureGraded(state, item, correct, item.choices?.[idx], item.choices?.[Number(item.correct_index)]);
        if (correct) scheduleAdvance(root, state);
      });
    });
  } else if (item.item_type === "typed" || item.item_type === "translate") {
    const input = document.getElementById("lr-typed-input");
    const submit = document.getElementById("lr-typed-submit");
    const tryIt = () => {
      const accepts = item.accept || [];
      const { ok, hint } = answerMatches(input.value, accepts, lang);
      const expected = accepts[0] || "";
      showItemFeedback(root, ok, ok ? "" : `Oikea vastaus: ${expected}`, { hint, waitForClick: !ok });
      recordAnswer(state, ok);
      captureGraded(state, item, ok, input.value, expected);
      if (ok) scheduleAdvance(root, state);
    };
    submit?.addEventListener("click", tryIt);
    input?.addEventListener("keydown", (e) => { if (e.key === "Enter") tryIt(); });
    input?.focus();
  } else if (item.item_type === "match") {
    wireMatch(root, state, item);
  } else if (item.item_type === "gap_fill") {
    // PR auto/inline-exercises — track which input the student last
    // focused so chip clicks fill that one; falls back to the first
    // empty input when nothing is focused yet.
    let lastFocused = null;
    const inputs = root.querySelectorAll(".lr-gap-input");
    inputs.forEach((inp) => {
      inp.addEventListener("focus", () => { lastFocused = inp; });
    });
    inputs[0]?.focus();
    root.querySelectorAll(".lr-gap-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const word = chip.dataset.word || chip.textContent || "";
        const target = (lastFocused && lastFocused.value === "")
          ? lastFocused
          : Array.from(inputs).find((i) => !i.value)
            || lastFocused
            || inputs[0];
        if (target) {
          target.value = word;
          target.classList.add("is-filled");
          chip.classList.add("is-used");
          // Move focus to the next empty input so the student can keep
          // tapping chips without reaching back to the keyboard.
          const next = Array.from(inputs).find((i) => !i.value);
          (next || target).focus();
        }
      });
    });
    // If the student clears an input, free the matching chip again.
    inputs.forEach((inp) => {
      inp.addEventListener("input", () => {
        inp.classList.toggle("is-filled", !!inp.value);
        root.querySelectorAll(".lr-gap-chip.is-used").forEach((chip) => {
          const word = chip.dataset.word || chip.textContent || "";
          const stillUsed = Array.from(inputs).some((i) => i.value === word);
          chip.classList.toggle("is-used", stillUsed);
        });
      });
    });
    document.getElementById("lr-gap-submit")?.addEventListener("click", () => {
      let allOk = true;
      const expected = [];
      let firstHint = null;
      inputs.forEach((inp, i) => {
        const accepts = (item.answers && item.answers[i]) || [];
        const r = answerMatches(inp.value, accepts, lang);
        if (!r.ok) allOk = false;
        if (r.hint && !firstHint) firstHint = r.hint;
        expected.push((accepts[0] || "?"));
        inp.classList.toggle("is-wrong", !r.ok);
        inp.classList.toggle("is-correct", r.ok);
      });
      showItemFeedback(root, allOk, allOk ? "" : `Oikeat vastaukset: ${expected.join(", ")}`, { hint: firstHint, waitForClick: !allOk });
      recordAnswer(state, allOk);
      captureGraded(state, item, allOk, null, expected.join(", "));
      if (allOk) scheduleAdvance(root, state);
    });
  } else if (item.item_type === "writing") {
    const ta = document.getElementById("lr-writing-input");
    const counter = document.getElementById("lr-writing-char-counter");
    const minChars = Number(ta?.dataset.minChars) || 0;
    const maxChars = Number(ta?.dataset.maxChars) || 0;
    if (ta && counter) attachCharCounter(ta, counter, { minChars, maxChars });
    document.getElementById("lr-writing-submit")?.addEventListener("click", () => {
      const text = ta?.value || "";
      const chars = text.length;
      const ok = chars >= minChars;
      const msg = ok
        ? "Kirjoituksesi on tallennettu."
        : `Merkkimäärä on ${chars}, tavoite vähintään ${minChars} merkkiä. Jatka kirjoitusta.`;
      showItemFeedback(root, ok, msg, { hint: null, waitForClick: !ok });
      recordAnswer(state, ok);
      if (ok) scheduleAdvance(root, state);
    });
  } else if (item.item_type === "reading_mc") {
    document.getElementById("lr-reading-submit")?.addEventListener("click", () => {
      let correct = 0;
      const total = (item.questions || []).length;
      (item.questions || []).forEach((q, qi) => {
        const checked = root.querySelector(`input[name="lr-q-${qi}"]:checked`);
        if (checked && Number(checked.value) === Number(q.correct_index)) correct++;
      });
      const ok = correct === total;
      showItemFeedback(root, ok, ok ? "Kaikki oikein." : `${correct}/${total} oikein.`);
      // Reading items count as one item but proportional credit.
      state.correctInPhase += (correct / total);
      state.answeredInPhase += 1;
      scheduleAdvance(root, state, false);
    });
  }
}

function wireMatch(root, state, item) {
  let leftSel = null;
  const matched = new Set();
  const total = (item.pairs || []).length;
  let correct = 0;
  root.querySelectorAll(".lr-match-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      if (matched.has(cell)) return;
      const side = cell.dataset.side;
      if (side === "left") {
        root.querySelectorAll('.lr-match-cell[data-side="left"]').forEach((c) => c.classList.remove("is-active"));
        cell.classList.add("is-active");
        leftSel = cell;
      } else if (leftSel) {
        const li = Number(leftSel.dataset.idx);
        const expected = item.pairs[li]?.right;
        const got = cell.dataset.val;
        if (expected && got && normalizeAnswer(expected) === normalizeAnswer(got)) {
          leftSel.classList.add("is-matched");
          cell.classList.add("is-matched");
          matched.add(leftSel); matched.add(cell);
          leftSel = null;
          correct++;
          if (correct === total) {
            showItemFeedback(root, true, "Kaikki parit oikein.");
            recordAnswer(state, true);
            scheduleAdvance(root, state);
          }
        } else {
          cell.classList.add("is-wrong");
          setTimeout(() => cell.classList.remove("is-wrong"), 600);
        }
      }
    });
  });
}

// Lucide-style SVG icons, keep file-local so we don't pull a runtime dep.
// scale-0.6→1 spring + (wrong-only) shake is handled in lesson-runner.css.
const FB_ICON_CHECK =
  '<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const FB_ICON_CROSS =
  '<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

function showItemFeedback(root, correct, msg, opts = {}) {
  const fb = root.querySelector("#lr-feedback");
  if (!fb) return;
  const { hint = null, waitForClick = false } = opts;
  fb.hidden = false;
  fb.className =
    `lr-feedback ${correct ? "is-correct lr-feedback--correct" : "is-wrong lr-feedback--wrong"}`;
  fb.setAttribute("role", "status");
  fb.setAttribute("aria-live", correct ? "polite" : "assertive");
  const text = correct ? (msg || "Hyvin meni!") : (msg || "Melkein, yritä uudelleen.");
  const hintHtml = hint
    ? `<p class="lr-feedback__accent-hint">${escapeHtml(hint)}</p>`
    : "";
  const nextHtml = waitForClick
    ? `<button type="button" class="lr-feedback__next" id="lr-feedback-next">Seuraava →</button>`
    : "";
  fb.innerHTML =
    `${correct ? FB_ICON_CHECK : FB_ICON_CROSS}` +
    `<div class="lr-feedback__body-wrap">` +
      `<p class="lr-feedback__title ${correct ? "is-correct" : "is-wrong"}">${correct ? "Oikein" : "Väärin"}</p>` +
      `<p class="lr-feedback__body">${escapeHtml(text)}</p>` +
      `${hintHtml}` +
      `${nextHtml}` +
    `</div>`;
  fb.classList.remove("lr-feedback--animate");
  // eslint-disable-next-line no-unused-expressions
  void fb.offsetWidth;
  fb.classList.add("lr-feedback--animate");

  if (waitForClick) {
    // Caller already short-circuited scheduleAdvance for wrong answers;
    // hook the explicit "Seuraava →" so the user advances when ready.
    // root.__lrState is stashed by wireExerciseHandlers below so the
    // click can resolve advanceItem(root, state).
    const btn = fb.querySelector("#lr-feedback-next");
    btn?.addEventListener("click", () => {
      const s = root.__lrState;
      if (s) advanceItem(root, s, false);
    }, { once: true });
  }
}

function markChoices(root, correctIdx, pickedIdx) {
  root.querySelectorAll(".lr-mc-choice").forEach((b) => {
    const i = Number(b.dataset.mcIdx);
    b.disabled = true;
    if (i === correctIdx) b.classList.add("is-correct");
    if (i === pickedIdx && pickedIdx !== correctIdx) b.classList.add("is-wrong");
  });
}

function recordAnswer(state, correct) {
  state.answeredInPhase += 1;
  if (correct) state.correctInPhase += 1;
}

// L-V410 Vaihe 1 (CAPTURE) — record one graded answer for the adaptive layer.
// `question` doubles as the SR card key, so prefer the stable source string
// (the prompt/stem the student saw). Called only for discrete-answer item
// types where right/wrong maps cleanly to a concept (mc / typed / translate /
// gap_fill); writing + reading are length/comprehension graded and would make
// noisy SR keys, so they are intentionally excluded.
function captureGraded(state, item, correct, studentAnswer, correctAnswer) {
  if (!item) return;
  const phase = state.phases[state.currentPhaseIdx] || {};
  const question = String(
    item.prompt || item.source || item.stem || item.sentence_template ||
    item.question || phase.title || ""
  ).trim().slice(0, 300);
  if (!question) return;
  state.gradedItems.push({
    itemType: item.item_type || "unknown",
    correct: !!correct,
    question,
    studentAnswer: studentAnswer != null ? String(studentAnswer).slice(0, 200) : "",
    correctAnswer: correctAnswer != null ? String(correctAnswer).slice(0, 200) : "",
    explanation: String(item.explanation || "").slice(0, 300),
    phaseType: phase.phase_type || "",
    // L-V411 Vaihe C — carry the concept tag (review items set _concept) so the
    // server-side SR capture routes the calibration to the right concept.
    topics: Array.isArray(item.topics) && item.topics.length
      ? item.topics.slice(0, 3)
      : (item._concept ? [item._concept] : []),
  });
}

function scheduleAdvance(root, state, advanceItem_ = true) {
  setTimeout(() => advanceItem_ ? advanceItem(root, state, false) : advanceItem(root, state, false), 1100);
}

function advanceItem(root, state, _skipped) {
  const phase = state.phases[state.currentPhaseIdx];
  state.currentItemIdx += 1;
  saveLessonProgress(state);
  if (state.currentItemIdx >= phase.items.length) {
    return renderPhaseBanner(root, state, phase, "completed");
  }
  renderPhase(root, state);
}

// ── Phase end ─────────────────────────────────────────────────────────────

function renderPhaseBanner(root, state, phase, mode) {
  const total = state.answeredInPhase || phase.items.length;
  const correct = Math.round(state.correctInPhase);
  const pct = total > 0 ? state.correctInPhase / total : 0;
  const threshold = masteryThresholdFor(phase, state.targetGrade);
  const skipped = mode === "skipped";
  const mastered = !skipped && pct >= threshold;
  state.phaseResults.push({
    phaseId: phase.phase_id,
    title: phase.title,
    correct,
    total,
    pct,
    threshold,
    mastered,
    skipped,
  });

  let title, message;
  if (skipped) {
    title = "Vaihe ohitettu";
    message = "Sanat palaavat kertaussessioon myöhemmin, niitä ei jätetä unohduksiin.";
  } else if (mastered) {
    title = "Hallitset tämän";
    message = `Sait ${correct} / ${total} oikein, jatketaan seuraavaan vaiheeseen.`;
  } else if (pct >= 0.5) {
    title = "Lähellä, vielä yksi pyyhkäisy";
    message = `${correct} / ${total} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`;
  } else {
    title = "Tämä kaipaa toistoa";
    message = `${correct} / ${total} oikein. Et ole yksin, tämä rakenne vaatii toistoa, ei eri sääntöä.`;
  }

  const isLast = state.currentPhaseIdx + 1 >= state.phases.length;

  root.innerHTML = `
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${mastered ? "is-mastered" : skipped ? "is-skipped" : "is-almost"}">
        <p class="lr-banner-eyebrow">${escapeHtml(phase.title || "Vaihe")}</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${isLast ? "Näytä yhteenveto" : "Seuraava vaihe →"}</button>
      </div>
    </div>`;
  document.getElementById("lr-next")?.addEventListener("click", () => {
    state.currentPhaseIdx += 1;
    state.currentItemIdx = 0;
    state.correctInPhase = 0;
    state.answeredInPhase = 0;
    if (state.currentPhaseIdx >= state.phases.length) {
      finalizeLesson(root, state);
    } else {
      saveLessonProgress(state);
      renderPhase(root, state);
    }
  });
}

function onSkipPhase(root, state) {
  const ok = window.confirm("Ohita tämä vaihe? Sanat palaavat kertaussessioon myöhemmin.");
  if (!ok) return;
  const phase = state.phases[state.currentPhaseIdx];
  renderPhaseBanner(root, state, phase, "skipped");
}

// ── Step 4: lesson results ─────────────────────────────────────────────────

function finalizeLesson(root, state) {
  if (state.finished) return;
  state.finished = true;
  // Lesson done — discard the resume snapshot so the next entry starts
  // fresh (teaching page → first phase).
  clearLessonProgress(state.kurssiKey, state.lessonIndex);
  // L-V411 Vaihe C — the review phase drills PREVIOUS weak concepts, so it must
  // not distort THIS lesson's mastery score/band. Exclude it from the totals
  // (its graded answers still flow to the server for SR capture below).
  const scoredResults = state.phaseResults.filter((p) => p.phaseId !== REVIEW_PHASE_ID);
  const totalCorrect = scoredResults.reduce((s, p) => s + (p.skipped ? 0 : p.correct), 0);
  const totalAsked = scoredResults.reduce((s, p) => s + (p.skipped ? 0 : p.total), 0);
  const elapsedMin = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
  const tg = state.targetGrade;
  const tutorMsg = buildTutorMessage(tg, state.phaseResults);
  const yo = state.lesson.meta?.yo_relevance || "";

  const phasesHtml = state.phaseResults.map((r) => {
    const cls = r.skipped ? "lr-result-skipped" : r.mastered ? "lr-result-mastered" : "lr-result-almost";
    const status = r.skipped ? "Ohitettu" : r.mastered ? "Hallitset" : "Lähellä";
    return `<li class="lr-result-row ${cls}">
      <span class="lr-result-title">${escapeHtml(r.title || "")}</span>
      <span class="lr-result-status">${status}${r.skipped ? "" : ` · ${r.correct}/${r.total}`}</span>
    </li>`;
  }).join("");

  root.innerHTML = `
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${escapeHtml(state.lesson.meta?.title || "Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${totalCorrect}/${totalAsked || 0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${elapsedMin}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${escapeHtml(tutorMsg)}</div>
      ${yo ? `<aside class="lr-yo">
        <p class="lr-yo-eyebrow">Tämä YO-kokeessa</p>
        <p>${escapeHtml(yo)}</p>
      </aside>` : ""}
      <ol class="lr-results-list">${phasesHtml}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle →</button>
      </div>
    </div>`;
  document.getElementById("lr-done")?.addEventListener("click", () => {
    backToCourse(state);
  });

  // Persist completion to backend (best-effort).
  if (isLoggedIn() && totalAsked > 0) {
    apiFetch(`${API}/api/curriculum/${encodeURIComponent(state.kurssiKey)}/lesson/${state.lessonIndex}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        // L-V390: stamp the completion with the active language so it is
        // scoped per language. Without this the server defaulted to "es" and
        // a German/French completion bled into the Spanish progress.
        lang: (typeof state.language === "string" && state.language) || "es",
        scoreCorrect: totalCorrect,
        scoreTotal: totalAsked,
        wrongAnswers: [],
        reviewItems: [],
        // L-V410 Vaihe 1 (CAPTURE) — graded answers feed the adaptive layer
        // server-side (gated to kurssi tier). Cap to keep the payload bounded.
        gradedItems: state.gradedItems.slice(0, 80),
      }),
    }).catch(() => { /* non-critical */ });
  }
}

function buildTutorMessage(targetGrade, phaseResults) {
  const skipped = phaseResults.filter((r) => r.skipped).length;
  const mastered = phaseResults.filter((r) => !r.skipped && r.mastered).length;
  const almost = phaseResults.filter((r) => !r.skipped && !r.mastered).length;
  if (targetGrade === "L" || targetGrade === "E") {
    if (almost === 0 && skipped === 0) return "L/E-tavoite vaatii ~85–95 % YO-kokeessa, tämän tunnin sanat ovat sinulla automaattisia. Eteenpäin.";
    return `${almost} vaihe${almost === 1 ? "" : "tta"} jäi alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita, palaa näihin huomenna kertauksessa.`;
  }
  if (targetGrade === "I" || targetGrade === "A") {
    if (almost === 0 && skipped === 0) return "Hyvä alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla, olet nyt siellä.";
    return `Et ole yksin. I/A-tavoitteelle riittää tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.`;
  }
  if (mastered === phaseResults.length) return "Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmillä.";
  if (almost > 0) return `${almost} vaihetta jäi alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa, tämä on osa rytmiä, ei takaisku.`;
  return "Tunti suoritettu.";
}

// ── Side panel ─────────────────────────────────────────────────────────────

function renderSidePanel(state) {
  const tabs = state.lesson.side_panel?.tabs || [];
  if (!tabs.length) return "";
  const tabsHtml = tabs.map((t, i) => `
    <button type="button" class="lr-tab ${i === 0 ? "is-active" : ""}" data-tab="${escapeHtml(t.id)}">${escapeHtml(t.title || t.id)}</button>
  `).join("");
  const panesHtml = tabs.map((t, i) => `
    <div class="lr-tab-pane ${i === 0 ? "is-active" : ""}" data-pane="${escapeHtml(t.id)}">
      ${renderSimpleMd(t.content_md || "")}
    </div>
  `).join("");
  return `
    <aside id="lr-side-panel" class="lr-side-panel ${state.sidePanelOpen ? "is-open" : ""}" aria-hidden="${state.sidePanelOpen ? "false" : "true"}">
      <div class="lr-side-tabs" role="tablist">${tabsHtml}</div>
      <div class="lr-side-panes">${panesHtml}</div>
    </aside>`;
}

function toggleSidePanel(root, state) {
  state.sidePanelOpen = !state.sidePanelOpen;
  if (state.sidePanelOpen) state.sidePanelOpenedAt = Date.now();
  else if (state.sidePanelOpenedAt) {
    state.sidePanelOpenMs += Date.now() - state.sidePanelOpenedAt;
    state.sidePanelOpenedAt = 0;
  }
  const panel = root.querySelector("#lr-side-panel");
  const btn = root.querySelector("#lr-help-toggle");
  // hotfix bug 3, toggle has-panel-open on the exercise shell so the desktop
  // grid expands from 1-col task → 2-col task+panel split.
  const shell = root.querySelector(".lr-shell--exercise");
  if (shell) shell.classList.toggle("has-panel-open", state.sidePanelOpen);
  if (panel) {
    panel.classList.toggle("is-open", state.sidePanelOpen);
    panel.setAttribute("aria-hidden", state.sidePanelOpen ? "false" : "true");
  }
  if (btn) {
    btn.setAttribute("aria-expanded", state.sidePanelOpen ? "true" : "false");
    btn.textContent = state.sidePanelOpen ? "✕ Sulje" : "📖 Apua";
  }
  // Wire tabs lazily.
  root.querySelectorAll(".lr-tab").forEach((t) => {
    t.onclick = () => {
      root.querySelectorAll(".lr-tab").forEach((x) => x.classList.toggle("is-active", x === t));
      const id = t.dataset.tab;
      root.querySelectorAll(".lr-tab-pane").forEach((p) => p.classList.toggle("is-active", p.dataset.pane === id));
    };
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tiny markdown subset: headers, paragraphs, lists, bold/italic, code.
function renderSimpleMd(md) {
  if (!md) return "";
  const lines = String(md).split(/\r?\n/);
  const out = [];
  let para = [];
  let inList = false;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  function inline(s) {
    let t = escapeHtml(s);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    return t;
  }
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (/^#{1,3}\s/.test(line)) {
      flushPara(); flushList();
      const lvl = line.startsWith("### ") ? 3 : line.startsWith("## ") ? 2 : 1;
      out.push(`<h${lvl}>${inline(line.replace(/^#{1,3}\s+/, ""))}</h${lvl}>`);
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
    } else if (/^\s*$/.test(line)) {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();
  return out.join("\n");
}
