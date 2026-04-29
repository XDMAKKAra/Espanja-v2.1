/**
 * L-PLAN-2: Oppimispolku (8-kurssi curriculum) screen + #screen-lesson.
 *
 * - loadCurriculum(): renders #screen-path with the kurssi list.
 * - openLesson(kurssiKey, sortOrder): renders #screen-lesson with teaching
 *   page + start-exercises CTA. Stores currentLesson in sessionStorage so
 *   L-PLAN-3 can wire the existing exercise screens to it.
 */
import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";

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

const TYPE_LABEL = {
  vocab: "Sanasto",
  grammar: "Kielioppi",
  reading: "Luetun ymmärtäminen",
  writing: "Kirjoittaminen",
  mixed: "Sekamuoto",
  test: "Kertaustesti",
};

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Minimal Markdown renderer — h1, h2, blockquote, paragraphs, bold, code,
// 4-col tables (pipe-delimited). Sanitised by escaping all input first.
function renderMarkdown(md) {
  if (!md) return "";
  const lines = md.split(/\r?\n/);
  const out = [];
  let para = [];
  let inTable = false;
  let tableRows = [];

  const flushPara = () => {
    if (para.length === 0) return;
    const html = inlineFmt(para.join(" "));
    out.push(`<p>${html}</p>`);
    para = [];
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

  function inlineFmt(s) {
    let t = escapeHtml(s);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    return t;
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (/^#{1,2}\s/.test(line)) {
      flushPara(); flushTable();
      const level = line.startsWith("## ") ? 2 : 1;
      const text = line.replace(/^#{1,2}\s+/, "");
      out.push(`<h${level}>${inlineFmt(text)}</h${level}>`);
    } else if (/^>\s/.test(line)) {
      flushPara(); flushTable();
      out.push(`<blockquote>${inlineFmt(line.replace(/^>\s+/, ""))}</blockquote>`);
    } else if (/^\|/.test(line)) {
      flushPara();
      inTable = true;
      tableRows.push(line);
    } else if (/^\s*$/.test(line)) {
      flushPara(); flushTable();
    } else {
      flushTable();
      para.push(line);
    }
  }
  flushPara();
  flushTable();
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

  return `
    <li class="${classifyCard(k)}${isExpanded ? " is-expanded" : ""}"
        data-kurssi="${escapeHtml(k.key)}"
        ${k.isUnlocked ? 'tabindex="0" role="button" aria-expanded="' + (isExpanded ? "true" : "false") + '"' : 'aria-disabled="true"'}>
      <div class="curr-step" aria-hidden="true">${stepInner}</div>
      <div class="curr-body">
        <div class="curr-title-row">
          <h3 class="curr-title">${escapeHtml(k.title)}</h3>
          <span class="curr-chip" aria-label="${escapeHtml("Taso " + k.level)}">${escapeHtml(k.level)}</span>
        </div>
        <div class="curr-progress" aria-label="${escapeHtml(`${completed} / ${total} oppituntia`)}">
          <div class="curr-progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="curr-progress-fill" style="width:${pct}%"></div>
          </div>
          <span>${completed} / ${total} oppituntia</span>
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
  const screen = document.getElementById("screen-path");
  if (!screen) return;
  if (!document.getElementById(PATH_INNER_ID)) {
    // Replace legacy path-inner contents on first entry so old learningPath.js
    // markup doesn't mix with the new view.
    screen.innerHTML = `<div id="${PATH_INNER_ID}"></div>`;
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
    // Enrich currentLesson with focus + type so the post-session lesson
    // results card can render them without a second fetch.
    try {
      sessionStorage.setItem("currentLesson", JSON.stringify({
        kurssiKey,
        lessonIndex,
        lessonFocus: data?.lesson?.focus || "",
        lessonType: data?.lesson?.type || "",
      }));
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

function renderLessonPage(root, kurssiKey, data) {
  const { lesson, teachingPage } = data;
  const teaching = teachingPage?.contentMd ? renderMarkdown(teachingPage.contentMd) : null;
  const typeLabel = TYPE_LABEL[lesson.type] || "Oppitunti";

  const teachingHtml = teaching
    ? `<article class="curr-teaching" id="curr-teaching">${teaching}</article>`
    : (lesson.teachingSnippet
        ? `<p class="curr-snippet">${escapeHtml(lesson.teachingSnippet)}</p>`
        : "");

  root.innerHTML = `
    <div class="curr-lesson-page">
      <button type="button" class="curr-back" id="curr-lesson-back">← Oppimispolku</button>
      <header class="curr-lesson-hero">
        <p class="curr-eyebrow">${escapeHtml(typeLabel)} · oppitunti ${lesson.sortOrder}</p>
        <h1>${escapeHtml(lesson.focus)}</h1>
      </header>
      ${teachingHtml}
      <div class="curr-actions">
        <button type="button" class="btn btn-primary" id="curr-start">Aloita harjoittelu →</button>
      </div>
    </div>`;
  document.getElementById("curr-lesson-back")?.addEventListener("click", goBack);
  document.getElementById("curr-start")?.addEventListener("click", () => startExercises(kurssiKey, lesson));
}

function startExercises(kurssiKey, lesson) {
  // L-PLAN-3 will read sessionStorage.currentLesson and pass scores back.
  // For this loop we only navigate to the appropriate existing screen.
  const { type } = lesson;
  if (type === "vocab" || type === "mixed") {
    location.hash = "#/sanasto";
  } else if (type === "grammar") {
    location.hash = "#/puheoppi";
  } else if (type === "reading") {
    location.hash = "#/luetun";
  } else if (type === "writing") {
    location.hash = "#/kirjoitus";
  } else if (type === "test") {
    location.hash = "#/sanasto"; // kertaustesti — sanasto for now until L-PLAN-3
  }
}

function goBack() {
  loadCurriculum();
}
