/**
 * L-PLAN-2: Oppimispolku (8-kurssi curriculum) screen + #screen-lesson.
 *
 * - loadCurriculum(): renders #screen-path with the kurssi list.
 * - openLesson(kurssiKey, sortOrder): renders #screen-lesson with teaching
 *   page + start-exercises CTA. Stores currentLesson in sessionStorage so
 *   L-PLAN-3 can wire the existing exercise screens to it.
 */
import { show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { state } from "../state.js";
import { loadNextBatch } from "./vocab.js";
import { loadGrammarDrill } from "./grammar.js";
import { loadReadingTask } from "./reading.js";
import { loadWritingTask } from "./writing.js";

const PATH_INNER_ID = "curr-root";
const LESSON_INNER_ID = "curr-lesson-root";

let _state = { kurssit: null, expanded: null };

const TYPE_ICONS = {
  // Lucide-style 24x24 path d's, single-stroke, currentColor
  vocab:   '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',          // BookOpen
  grammar: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', // Wrench
  reading: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', // BookText
  writing: '<path d="M21 14H3"/><path d="M12 17v4"/><path d="M7 17v4"/><path d="M17 17v4"/><path d="M2 7l10-5 10 5"/>', // PenLine simplified — fall through to a pencil
  mixed:   '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', // BookText
  test:    '<path d="m9 12 2 2 4-4"/><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/>', // CheckSquare-ish
};

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Minimal Markdown renderer — h1, h2, blockquote, paragraphs, bold, code,
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

// ── Skeleton / states ──────────────────────────────────────────────────────

function renderSkeleton(root) {
  root.innerHTML = `
    <div class="curr">
      <div class="curr-head">
        <h2>Oppimispolku</h2>
        <p class="curr-sub">8 kurssia · YO-koevalmiiksi</p>
      </div>
      <div class="curr-skeleton" aria-busy="true" aria-label="Ladataan oppimispolkua">
        ${Array.from({ length: 8 }, () => '<div class="curr-skeleton-card" aria-hidden="true"></div>').join("")}
      </div>
    </div>`;
}

function renderError(root, msg, retry) {
  root.innerHTML = `
    <div class="curr">
      <div class="curr-head">
        <h2>Oppimispolku</h2>
      </div>
      <div class="curr-error" role="alert">
        <p>${escapeHtml(msg || "Ei yhteyttä — yritä uudelleen.")}</p>
        <button type="button" class="btn-primary" id="curr-retry">Yritä uudelleen</button>
      </div>
    </div>`;
  const btn = root.querySelector("#curr-retry");
  if (btn) btn.addEventListener("click", () => retry && retry());
}

// ── Card rendering ─────────────────────────────────────────────────────────

function statusFor(k) {
  if (!k.isUnlocked) return { label: "Lukittu", icon: "🔒" };
  if (k.kertausPassed) return { label: "Suoritettu ✓", icon: null };
  if (k.lessonsCompleted > 0) return { label: "Jatka →", icon: null };
  return { label: "Aloita →", icon: null };
}

function classifyCard(k) {
  const cls = ["curr-card"];
  if (!k.isUnlocked) cls.push("is-locked");
  else if (k.kertausPassed) cls.push("is-done");
  else if (k.lessonsCompleted > 0) cls.push("is-current");
  if (k.isUnlocked) cls.push("is-clickable");
  return cls.join(" ");
}

function lessonIcon(type) {
  const d = TYPE_ICONS[type] || TYPE_ICONS.mixed;
  return `<svg class="curr-lesson-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

function renderKurssitList(root) {
  const kurssit = _state.kurssit;
  if (!kurssit || kurssit.length === 0) {
    renderError(root, "Kursseja ei löytynyt.", () => loadCurriculum());
    return;
  }

  const anonymous = !isLoggedIn();
  const html = `
    <div class="curr">
      <div class="curr-head">
        <h2>Oppimispolku</h2>
        <p class="curr-sub">8 kurssia · YO-koevalmiiksi · ${escapeHtml(`${kurssit.filter((k) => k.kertausPassed).length} / ${kurssit.length} suoritettu`)}</p>
      </div>
      ${anonymous ? `
        <div class="curr-empty">
          <p>Rekisteröidy nähdäksesi oma polkusi ja suorituksesi.</p>
          <a class="btn-primary" href="/app.html#rekisteroidy">Rekisteröidy →</a>
        </div>` : ""}
      <ol class="curr-list" aria-label="Kurssit">
        ${kurssit.map((k, i) => renderCard(k, i + 1)).join("")}
      </ol>
    </div>
  `;
  root.innerHTML = html;
  wireCardEvents(root);
}

function renderCard(k, stepNumber) {
  const status = statusFor(k);
  const completed = k.lessonsCompleted || 0;
  const total = k.lessonCount || 1;
  const pct = Math.min(100, Math.round((completed / total) * 100));
  const isExpanded = _state.expanded === k.key;

  const stepInner = k.kertausPassed
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>'
    : !k.isUnlocked
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
      : String(stepNumber);

  // L-PLAN-8 UPDATE 6C — locked-card hover tooltip explaining the prereq.
  // Stays visually subdued, but on hover/focus a tooltip names the course
  // the student has to clear first (kertaustesti ≥ 80 %). Tooltip is owned
  // by the global js/features/tooltip.js primitive (already installed in
  // app.js boot path); we only need data-tooltip + a focusable target.
  const lockedTooltip = !k.isUnlocked && stepNumber > 1
    ? `Suorita ensin Kurssi ${stepNumber - 1} (kertaustestissä ≥ 80 %).`
    : "";
  const tooltipAttr = lockedTooltip ? ` data-tooltip="${escapeHtml(lockedTooltip)}"` : "";
  // Locked cards still receive tabindex="0" so keyboard users can land on
  // them and read the tooltip. role="button" stays off (the click is a
  // no-op) but aria-disabled communicates the inactive state to AT.
  const lockedFocusAttr = !k.isUnlocked ? ' tabindex="0"' : "";

  // L-PLAN-8 UPDATE 8 — accessibility fixes:
  //  * Drop `role="button"` from the <li>. axe flags <ol> children whose
  //    role is not `listitem` (the role override breaks list semantics).
  //    `tabindex="0"` + the existing keydown(Enter/Space) handler keep the
  //    card keyboard-operable; aria-expanded still announces the toggle.
  //  * Add aria-label to the inner [role="progressbar"] so it has its own
  //    accessible name (the wrapping div's aria-label doesn't propagate).
  const progressLabel = `${completed} / ${total} oppituntia`;

  return `
    <li class="${classifyCard(k)}${isExpanded ? " is-expanded" : ""}"
        data-kurssi="${escapeHtml(k.key)}"${tooltipAttr}
        ${k.isUnlocked ? 'tabindex="0" aria-expanded="' + (isExpanded ? "true" : "false") + '"' : 'aria-disabled="true"' + lockedFocusAttr}>
      <div class="curr-step" aria-hidden="true">${stepInner}</div>
      <div class="curr-body">
        <div class="curr-title-row">
          <h3 class="curr-title">${escapeHtml(k.title)}</h3>
          <span class="curr-chip" aria-label="${escapeHtml("Taso " + k.level)}">${escapeHtml(k.level)}</span>
        </div>
        <div class="curr-progress">
          <div class="curr-progress-bar" role="progressbar" aria-label="${escapeHtml(progressLabel)}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="curr-progress-fill" style="width:${pct}%"></div>
          </div>
          <span>${escapeHtml(progressLabel)}</span>
        </div>
      </div>
      <div class="curr-status">${escapeHtml(status.label)}</div>
      ${isExpanded ? `<ul class="curr-lessons" data-kurssi="${escapeHtml(k.key)}" aria-label="Oppitunnit"><li class="curr-lesson" aria-busy="true"><span class="curr-lesson-focus">Ladataan oppitunteja…</span></li></ul>` : ""}
    </li>`;
}

function wireCardEvents(root) {
  root.querySelectorAll(".curr-card.is-clickable").forEach((card) => {
    const handler = (e) => {
      // Ignore when click started inside the lesson list
      if (e.target.closest(".curr-lessons")) return;
      const key = card.dataset.kurssi;
      toggleKurssi(key);
    };
    card.addEventListener("click", handler);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const key = card.dataset.kurssi;
        toggleKurssi(key);
      }
    });
  });
}

async function toggleKurssi(kurssiKey) {
  const wasOpen = _state.expanded === kurssiKey;
  _state.expanded = wasOpen ? null : kurssiKey;
  const root = document.getElementById(PATH_INNER_ID);
  if (!root) return;
  renderKurssitList(root);
  if (!wasOpen) {
    await fetchAndRenderLessons(kurssiKey);
  }
}

async function fetchAndRenderLessons(kurssiKey) {
  const ul = document.querySelector(`.curr-lessons[data-kurssi="${cssEscape(kurssiKey)}"]`);
  if (!ul) return;
  try {
    const res = await apiFetch(`${API}/api/curriculum/${encodeURIComponent(kurssiKey)}`, {
      headers: { ...authHeader() },
    });
    if (!res.ok) throw new Error("Oppituntien lataus epäonnistui");
    const data = await res.json();
    ul.innerHTML = (data.lessons || []).map((l) => renderLessonRow(kurssiKey, l)).join("");
    ul.querySelectorAll(".curr-lesson").forEach((btn) => {
      const idx = Number(btn.dataset.lesson);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openLesson(kurssiKey, idx);
      });
    });
  } catch (err) {
    ul.innerHTML = `<li class="curr-lesson"><span class="curr-lesson-focus">${escapeHtml(err.message || "Ei yhteyttä")}</span></li>`;
  }
}

function cssEscape(s) {
  return String(s).replace(/"/g, '\\"');
}

function renderLessonRow(kurssiKey, l) {
  const done = !!l.completed;
  const num = String(l.sortOrder).padStart(2, "0");
  const cta = done ? "Suoritettu ✓" : "Aloita →";
  return `
    <li>
      <button type="button" class="curr-lesson${done ? " is-done" : ""}" data-lesson="${l.sortOrder}" aria-label="${escapeHtml(`Oppitunti ${l.sortOrder}: ${l.focus}`)}">
        ${lessonIcon(l.type)}
        <span class="curr-lesson-focus"><span class="curr-lesson-num">${num}</span>${escapeHtml(l.focus)}</span>
        <span class="curr-lesson-cta">${escapeHtml(cta)}</span>
      </button>
    </li>`;
}

// ── Public: load main curriculum screen ────────────────────────────────────

export async function loadCurriculum() {
  ensurePathRoot();
  const root = document.getElementById(PATH_INNER_ID);
  if (!root) return;
  show("screen-path");
  // hotfix bug 2 — clear any stale expanded state so we don't render a card
  // with the "Ladataan oppitunteja…" placeholder that nobody refreshes.
  // Tab will re-expand on demand via toggleKurssi.
  _state.expanded = null;
  // L-PLAN-8 UPDATE 6A — make sure the floating Opetussivu trigger from a
  // prior lesson session is hidden the moment we land back on the path
  // overview. The MutationObserver in teachingPanel.js handles this on its
  // own, but a direct refresh removes the (possibly visible) flicker.
  import("../features/teachingPanel.js")
    .then((m) => m.refreshTeachingPanel?.())
    .catch(() => { /* feature optional; ignore if not loaded */ });
  renderSkeleton(root);

  try {
    const res = await apiFetch(`${API}/api/curriculum`, {
      headers: { ...(isLoggedIn() ? authHeader() : {}) },
    });
    if (!res.ok) throw new Error("Polun lataus epäonnistui");
    const data = await res.json();
    _state.kurssit = data.kurssit || [];
    renderKurssitList(root);
  } catch (err) {
    renderError(root, err.message || "Jokin meni pieleen", () => loadCurriculum());
  }
}

function ensurePathRoot() {
  // L-MERGE-DASH-PATH — screen-path now hosts the merged home (greeting, day-CTA,
  // YO-readiness, recent + chart) around the course list. We render the cards
  // into #path-courses-root inside that wrapper, NOT into the whole screen,
  // so the surrounding sections survive each render pass.
  const host = document.getElementById("path-courses-root");
  if (!host) return;
  if (!document.getElementById(PATH_INNER_ID)) {
    host.innerHTML = `<div id="${PATH_INNER_ID}"></div>`;
  }
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
  } catch { /* private mode — ignore */ }

  show("screen-lesson");
  root.innerHTML = `<div class="curr-lesson-page">
    <button type="button" class="curr-back" id="curr-lesson-back">← Oppimispolku</button>
    <div class="curr-skeleton-card" style="height:60px" aria-busy="true"></div>
    <div class="curr-skeleton-card" style="height:240px"></div>
    <div class="curr-skeleton-card" style="height:48px"></div>
  </div>`;
  document.getElementById("curr-lesson-back")?.addEventListener("click", goBack);

  try {
    const res = await apiFetch(`${API}/api/curriculum/${encodeURIComponent(kurssiKey)}/lesson/${lessonIndex}`, {
      headers: { ...(isLoggedIn() ? authHeader() : {}) },
    });
    if (!res.ok) throw new Error("Oppitunnin lataus epäonnistui");
    const data = await res.json();
    // L-COURSE-1 UPDATE 3 — pre-generated lesson short-circuit. The new
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
    // L-PLAN-5 UPDATE 5 — lessonExerciseCount drives single-batch sizing
    // in vocab.js loadNextBatch.
    // L-PLAN-6 — prefer the target-grade-adjusted count from lessonContext
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
      // L-PLAN-5 UPDATE 4 — cache the teaching Markdown for the re-read
      // side-panel so the student can review it mid-exercise without an
      // extra network round-trip.
      const md = data?.teachingPage?.contentMd || "";
      if (md) sessionStorage.setItem("currentLessonTeachingMd", md);
      else sessionStorage.removeItem("currentLessonTeachingMd");
    } catch { /* private mode — ignore */ }
    renderLessonPage(root, kurssiKey, data);
  } catch (err) {
    root.innerHTML = `<div class="curr-lesson-page">
      <button type="button" class="curr-back" id="curr-lesson-back">← Oppimispolku</button>
      <div class="curr-error" role="alert">
        <p>${escapeHtml(err.message || "Ei yhteyttä — yritä uudelleen.")}</p>
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

// L-PLAN-5 UPDATE 2 — rebuilt lesson screen layout. Eyebrow shows kurssi
// number + lesson number, H1 is the lesson focus (display 40px), Markdown
// teaching card is the body, CTA shows exercise count + estimated duration.
function formatDurationMin(exerciseCount) {
  // 90s per exercise (recognition + production mix); rounded to nearest min.
  const seconds = (exerciseCount || 1) * 90;
  return Math.max(1, Math.round(seconds / 60));
}

function ctaLabel(lesson, lessonContext) {
  // L-PLAN-6 — prefer the target-grade-adjusted count from lessonContext,
  // fall back to baseline. Anonymous users (no profile) still see the
  // baseline B count so the public preview is honest.
  const n = Number(lessonContext?.exerciseCount) || lesson.exerciseCount || 8;
  const min = formatDurationMin(n);
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
  // L-PLAN-5 UPDATE 2 — when the student taps "Aloita harjoittelu →" we
  // bypass the topic-picker mode page (lesson context already pins the
  // topic + level + count via routes/exercises.js applyLessonContext) and
  // go straight to the exercise loader. The hash is updated so the browser
  // back-button works and the sidebar nav highlights correctly.
  const { type } = lesson;
  state.sessionStartTime = Date.now();
  state.language = "spanish";

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
  // Unknown type — fallback to vocab.
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
  loadCurriculum();
}
