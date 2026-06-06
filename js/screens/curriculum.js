/**
 * Lesson screen (#screen-lesson) + shared Markdown renderer.
 *
 * - openLesson(kurssiKey, sortOrder): renders #screen-lesson with teaching
 *   page + start-exercises CTA. Stores currentLesson in sessionStorage so
 *   the exercise screens can read the lesson context.
 * - renderMarkdown(md): shared minimal Markdown renderer (also used by the
 *   teaching-panel side panel).
 *
 * L-V394: the dead #screen-path renderer (loadCurriculum + card/bento chain)
 * was removed — the live learning path lives in oppimispolkuIndex.js +
 * courseDetail.js. Only the lesson screen + renderMarkdown remain here.
 */
import { show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { state } from "../state.js";
import { loadNextBatch } from "./vocab.js";
import { loadGrammarDrill } from "./grammar.js";
import { loadReadingTask } from "./reading.js";
import { loadWritingTask } from "./writing.js";

const LESSON_INNER_ID = "curr-lesson-root";

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Minimal Markdown renderer, h1, h2, blockquote, paragraphs, bold, code,
// 4-col tables (pipe-delimited). Sanitised by escaping all input first.
// Exported so the teaching-panel side panel can reuse the same renderer.
export function renderMarkdown(md) {
  if (!md) return "";
  const lines = md.split(/\r?\n/);
  const out = [];
  let para = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listItems = [];

  const flushPara = () => {
    if (para.length === 0) return;
    const html = inlineFmt(para.join(" "));
    out.push(`<p>${html}</p>`);
    para = [];
  };
  const flushList = () => {
    if (!inList) return;
    if (listItems.length === 0) { inList = false; return; }
    out.push("<ul>" + listItems.map((it) => `<li>${inlineFmt(it)}</li>`).join("") + "</ul>");
    inList = false;
    listItems = [];
  };
  const flushTable = () => {
    if (!inTable) return;
    if (tableRows.length === 0) { inTable = false; return; }
    const rows = tableRows
      .map((r) => r.split("|").map((c) => c.trim()).filter((c, i, a) => !(i === 0 && c === "") && !(i === a.length - 1 && c === "")))
      .filter((r) => r.length > 0 && !r.every((c) => /^-+$/.test(c)));
    if (rows.length === 0) { inTable = false; tableRows = []; return; }
    const head = rows[0];
    const body = rows.slice(1);
    out.push("<table>");
    out.push("<thead><tr>" + head.map((c) => `<th>${inlineFmt(c)}</th>`).join("") + "</tr></thead>");
    if (body.length) {
      out.push("<tbody>" + body.map((r) => "<tr>" + r.map((c) => `<td>${inlineFmt(c)}</td>`).join("") + "</tr>").join("") + "</tbody>");
    }
    out.push("</table>");
    inTable = false;
    tableRows = [];
  };
  const flushAll = () => { flushPara(); flushTable(); flushList(); };

  function inlineFmt(s) {
    let t = escapeHtml(s);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    return t;
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (/^#{1,3}\s/.test(line)) {
      flushAll();
      const level = line.startsWith("### ") ? 3 : (line.startsWith("## ") ? 2 : 1);
      const text = line.replace(/^#{1,3}\s+/, "");
      out.push(`<h${level}>${inlineFmt(text)}</h${level}>`);
    } else if (/^>\s/.test(line)) {
      flushAll();
      out.push(`<blockquote>${inlineFmt(line.replace(/^>\s+/, ""))}</blockquote>`);
    } else if (/^\|/.test(line)) {
      flushPara(); flushList();
      inTable = true;
      tableRows.push(line);
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara(); flushTable();
      inList = true;
      listItems.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (/^\s*$/.test(line)) {
      flushAll();
    } else {
      flushTable(); flushList();
      para.push(line);
    }
  }
  flushAll();
  return out.join("\n");
}

// ── Lesson screen ──────────────────────────────────────────────────────────

export async function openLesson(kurssiKey, lessonIndex) {
  ensureLessonRoot();
  const root = document.getElementById(LESSON_INNER_ID);
  if (!root) return;

  // Stash minimal context up-front so the exercise screens can already read
  // it on session start. Focus + type are added below once we've fetched the
  // lesson definition (so the results card can render them without a 2nd
  // network round-trip).
  try {
    sessionStorage.setItem("currentLesson", JSON.stringify({ kurssiKey, lessonIndex }));
  } catch { /* private mode, ignore */ }

  show("screen-lesson");
  // Quiet placeholder. The earlier 60/240/48 skeleton stack rendered as a
  // jarring vertical strip on the left while the lesson definition fetched
  // (sub-second on warm cache). One centered "Avataan oppituntia…" line
  // reads as intentional rather than half-loaded.
  root.innerHTML = `<div class="curr-lesson-page curr-lesson-page--loading" aria-busy="true">
    <button type="button" class="curr-back" id="curr-lesson-back">← Oppimispolku</button>
    <div class="curr-lesson-loading">
      <span class="curr-lesson-loading__dot"></span>
      <p class="curr-lesson-loading__label">Avataan oppituntia…</p>
    </div>
  </div>`;
  document.getElementById("curr-lesson-back")?.addEventListener("click", goBack);

  try {
    const res = await apiFetch(`${API}/api/curriculum/${encodeURIComponent(kurssiKey)}/lesson/${lessonIndex}`, {
      headers: { ...(isLoggedIn() ? authHeader() : {}) },
    });
    if (!res.ok) throw new Error("Oppitunnin lataus epäonnistui");
    const data = await res.json();
    // L-COURSE-1 UPDATE 3, pre-generated lesson short-circuit. The new
    // backend returns `{ pregenerated: <full schemas/lesson.json> }` for
    // any data/courses/*.json that exists + isn't a placeholder.
    if (data && data.pregenerated && Array.isArray(data.pregenerated.phases)) {
      const tg = String(data.lessonContext?.targetGrade || "B");
      const m = await import("./lessonRunner.js");
      m.runPregeneratedLesson(data, kurssiKey, lessonIndex, tg);
      return;
    }
    // Enrich currentLesson with focus + type so the post-session lesson
    // results card can render them without a second fetch.
    // L-PLAN-5 UPDATE 5, lessonExerciseCount drives single-batch sizing
    // in vocab.js loadNextBatch.
    // L-PLAN-6, prefer the target-grade-adjusted count from lessonContext
    // when present; fall back to baseline lesson.exerciseCount otherwise.
    const adjustedCount = Number(data?.lessonContext?.exerciseCount)
      || Number(data?.lesson?.exerciseCount) || null;
    const targetGrade = String(data?.lessonContext?.targetGrade || "B");
    try {
      sessionStorage.setItem("currentLesson", JSON.stringify({
        kurssiKey,
        lessonIndex,
        lessonFocus: data?.lesson?.focus || "",
        lessonType: data?.lesson?.type || "",
        lessonExerciseCount: adjustedCount,
        targetGrade,
      }));
      // L-PLAN-5 UPDATE 4, cache the teaching Markdown for the re-read
      // side-panel so the student can review it mid-exercise without an
      // extra network round-trip.
      const md = data?.teachingPage?.contentMd || "";
      if (md) sessionStorage.setItem("currentLessonTeachingMd", md);
      else sessionStorage.removeItem("currentLessonTeachingMd");
    } catch { /* private mode, ignore */ }
    renderLessonPage(root, kurssiKey, data);
  } catch (err) {
    root.innerHTML = `<div class="curr-lesson-page">
      <button type="button" class="curr-back" id="curr-lesson-back">← Oppimispolku</button>
      <div class="curr-error" role="alert">
        <p>${escapeHtml(err.message || "Ei yhteyttä, yritä uudelleen.")}</p>
        <button type="button" class="btn-primary" id="curr-lesson-retry">Yritä uudelleen</button>
      </div>
    </div>`;
    document.getElementById("curr-lesson-back")?.addEventListener("click", goBack);
    document.getElementById("curr-lesson-retry")?.addEventListener("click", () => openLesson(kurssiKey, lessonIndex));
  }
}

function ensureLessonRoot() {
  let screen = document.getElementById("screen-lesson");
  if (!screen) {
    screen = document.createElement("div");
    screen.id = "screen-lesson";
    screen.className = "screen";
    document.querySelector(".app-main")?.appendChild(screen)
      || document.body.appendChild(screen);
  }
  if (!document.getElementById(LESSON_INNER_ID)) {
    screen.innerHTML = `<div id="${LESSON_INNER_ID}"></div>`;
  }
}

// L-PLAN-5 UPDATE 2, rebuilt lesson screen layout. Eyebrow shows kurssi
// number + lesson number, H1 is the lesson focus (display 40px), Markdown
// teaching card is the body, CTA shows exercise count + estimated duration.
function formatDurationMin(exerciseCount, type) {
  // Mirrors lessonDurationMin (see top of file), type-aware estimate
  // calibrated against data/courses/.../lesson_*.json `estimated_minutes_median`.
  const ex = Number(exerciseCount) || 1;
  const t = type || "vocab";
  if (t === "writing") return Math.max(20, 18 + Math.round(ex * 2));
  if (t === "reading") return Math.max(15, 12 + Math.round(ex * 1.5));
  if (t === "test")    return 35;
  if (t === "grammar") return Math.max(12, 10 + Math.round(ex * 0.8));
  return Math.max(10, 8 + Math.round(ex * 0.6));
}

function ctaLabel(lesson, lessonContext) {
  // L-PLAN-6, prefer the target-grade-adjusted count from lessonContext,
  // fall back to baseline. Anonymous users (no profile) still see the
  // baseline B count so the public preview is honest.
  const n = Number(lessonContext?.exerciseCount) || lesson.exerciseCount || 8;
  const min = formatDurationMin(n, lesson.type);
  if (lesson.type === "test") {
    return `Aloita kertaustesti (${n} kysymystä, ~${min} min) →`;
  }
  if (lesson.type === "reading") {
    return `Aloita luetun ymmärtäminen (~${min} min) →`;
  }
  if (lesson.type === "writing") {
    return `Aloita kirjoittaminen (~${min} min) →`;
  }
  return `Aloita harjoittelu (${n} tehtävää, ~${min} min) →`;
}

function kurssiNumberFromKey(kurssiKey) {
  const m = /^kurssi_(\d+)$/.exec(String(kurssiKey || ""));
  return m ? Number(m[1]) : null;
}

function renderLessonPage(root, kurssiKey, data) {
  const { lesson, teachingPage, lessonContext } = data;
  const teaching = teachingPage?.contentMd ? renderMarkdown(teachingPage.contentMd) : null;
  const kurssiNum = kurssiNumberFromKey(kurssiKey);
  const eyebrow = kurssiNum != null
    ? `Kurssi ${kurssiNum} · Oppitunti ${lesson.sortOrder}`
    : `Oppitunti ${lesson.sortOrder}`;

  const teachingHtml = teaching
    ? `<article class="curr-teaching" id="curr-teaching" aria-label="Opetussivu">${teaching}</article>`
    : (lesson.teachingSnippet
        ? `<p class="curr-snippet">${escapeHtml(lesson.teachingSnippet)}</p>`
        : "");

  root.innerHTML = `
    <div class="curr-lesson-page">
      <button type="button" class="curr-back" id="curr-lesson-back">← Oppimispolku</button>
      <header class="curr-lesson-hero">
        <p class="curr-eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(lesson.focus)}</h1>
      </header>
      ${teachingHtml}
      <div class="curr-actions">
        <button type="button" class="btn btn-primary" id="curr-start">${escapeHtml(ctaLabel(lesson, lessonContext))}</button>
        <p class="curr-actions-hint">Voit aina palata tähän opetussivuun harjoituksen aikana.</p>
      </div>
    </div>`;
  document.getElementById("curr-lesson-back")?.addEventListener("click", goBack);
  document.getElementById("curr-start")?.addEventListener("click", () => startExercises(kurssiKey, lesson));
}

function startExercises(kurssiKey, lesson) {
  // L-PLAN-5 UPDATE 2, when the student taps "Aloita harjoittelu →" we
  // bypass the topic-picker mode page (lesson context already pins the
  // topic + level + count via routes/exercises.js applyLessonContext) and
  // go straight to the exercise loader. The hash is updated so the browser
  // back-button works and the sidebar nav highlights correctly.
  const { type } = lesson;
  state.sessionStartTime = Date.now();
  // L-LANDING-REBUILD-AND-BUGFIX-1, do NOT overwrite state.language here.
  // It's hydrated from user_profile.target_language as the 2-letter code
  // ("es"/"de"/"fr"); overwriting to legacy "spanish" caused dashboard.js
  // line 124 to redirect every post-lesson home visit to the coming-soon
  // screen (state.language !== "es"). Backend reading/exercises routes
  // accept the 2-letter code via apiFetch's lang injection, and default to
  // Spanish content when the body field is empty.

  if (type === "vocab") {
    state.mode = "vocab";
    state.topic = "general vocabulary"; // server overrides via lessonContext
    state.level = "B";
    state.startLevel = "B";
    state.peakLevel = "B";
    state.batchNumber = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
    state.recentVocabHeadwords = [];
    history.replaceState(null, "", "#/sanasto");
    loadNextBatch();
    return;
  }
  if (type === "grammar" || type === "mixed" || type === "test") {
    state.mode = "grammar";
    state.grammarTopic = "mixed";
    state.grammarLevel = "C";
    history.replaceState(null, "", "#/puheoppi");
    loadGrammarDrill();
    return;
  }
  if (type === "reading") {
    state.mode = "reading";
    state.readingTopic = "animals and nature";
    state.readingLevel = "C";
    history.replaceState(null, "", "#/luetun");
    loadReadingTask();
    return;
  }
  if (type === "writing") {
    state.mode = "writing";
    state.writingTaskType = "short";
    state.writingTopic = "general";
    history.replaceState(null, "", "#/kirjoitus");
    loadWritingTask();
    return;
  }
  // Unknown type, fallback to vocab.
  state.mode = "vocab";
  state.topic = "general vocabulary";
  state.level = "B";
  state.batchNumber = 0;
  state.totalCorrect = 0;
  state.totalAnswered = 0;
  history.replaceState(null, "", "#/sanasto");
  loadNextBatch();
}

function goBack() {
  // L-V394 — #screen-path was killed and loadCurriculum() removed; return to
  // the live oppimispolku surface (main.js hashchange router renders it).
  location.hash = "#/oppimispolku";
}
