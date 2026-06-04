/**
 * COURSE DETAIL — pixel-copy of docs/design-ref/app-export/Kurssi.jsx (L-V391).
 * Per-course list of 10 lessons. Routed from the oppimispolku index at
 * #/oppimispolku/{lang}/{kurssiKey}.
 *
 * DOM + classes mirror the export (.cd-head / .cd-progress / .lesson-list /
 * .lesson-row). Real per-language completion (L-V390) drives the row states:
 *   completed            → done    (green "Suoritettu")
 *   first not-completed  → active  (brick "Aloita →", highlighted row)
 *   rest                 → upcoming (ghost "Aloita →", dimmed row)
 */

import { show } from "../ui/nav.js";
import { getCourseDetail } from "../lib/curriculumCache.js";

const LUCIDE = {
  "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};
function icon(name, attrs = "") {
  return `<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${attrs}>${LUCIDE[name] || ""}</svg>`;
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function typeLabelFi(t) {
  const map = {
    vocab: "Sanasto",
    grammar: "Kielioppi",
    mixed: "Yhdistelmä",
    reading: "Luetun ymmärtäminen",
    writing: "Kirjoittaminen",
    exam: "Kertaustesti",
    test: "Kertaustesti",
  };
  return map[t] || "Oppitunti";
}

function langLabelFor(lang) {
  return lang === "es" ? "Espanja" : lang === "fr" ? "Ranska" : lang === "de" ? "Saksa" : lang;
}

function renderLessonRow(l, lang, kurssiKey, courseStep, isFirstUnfinished) {
  const num = l.sortOrder || 0;
  const done = !!l.completed;
  const active = !done && isFirstUnfinished;
  const upcoming = !done && !active;
  const type = typeLabelFi(l.type);
  const title = escapeHtml(l.focus || l.title || `Oppitunti ${num}`);
  const minutes = Number(l.estimated_minutes) || 14;
  const href = `#/oppitunti/${lang}/${encodeURIComponent(kurssiKey)}/${num}`;

  const cls = "lesson-row" + (active ? " lesson-row--active" : "") + (upcoming ? " lesson-row--upcoming" : "");

  const right = done
    ? `<span class="lesson-done">${icon("circle-check")} Suoritettu</span>`
    : `<a class="btn ${active ? "btn--primary" : "btn--ghost"} btn--sm" href="${href}">Aloita ${icon("arrow-right", 'style="width:15px;height:15px"')}</a>`;

  return `
    <div class="${cls}">
      <span class="lesson-row__num">${courseStep}.${num}</span>
      <div>
        <span class="eyebrow" style="font-size:11px">${escapeHtml(type)}</span>
        <div class="lesson-row__title">${title}</div>
      </div>
      <div class="lesson-row__right">
        <span class="lesson-row__time">~${minutes} min</span>
        ${right}
      </div>
    </div>`;
}

function renderShell(lang, kurssi, lessons) {
  const stepNumber = kurssi?._stepNumber || 1;
  const total = lessons.length;
  const doneCount = lessons.filter((l) => l.completed).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const firstUnfinished = lessons.find((l) => !l.completed);
  const firstNum = firstUnfinished ? firstUnfinished.sortOrder : null;
  const langLabel = langLabelFor(lang);

  return `
    <nav class="crumbs" aria-label="Sijainti">
      <a href="#/aloitus">Aloitus</a>
      <span class="sep" aria-hidden="true">/</span>
      <a href="#/oppimispolku?lang=${encodeURIComponent(lang)}">Oppimispolku</a>
      <span class="sep" aria-hidden="true">/</span>
      <span class="here" aria-current="page">${escapeHtml(`Kurssi ${stepNumber}`)}</span>
    </nav>
    <div class="cd-head">
      <span class="eyebrow">${escapeHtml(langLabel)} · Kurssi ${stepNumber} · Taso ${escapeHtml(kurssi?.level || "—")}</span>
      <h1>${escapeHtml(kurssi?.title || "Kurssi")}</h1>
      ${kurssi?.description ? `<p class="desc">${escapeHtml(kurssi.description)}</p>` : ""}
      <div class="cd-progress">
        <span class="label num">${doneCount} / ${total} oppituntia · ${pct} %</span>
        <span class="bar"><span style="width:${pct}%"></span></span>
      </div>
    </div>
    <div class="lesson-list">
      ${lessons.map((l) => renderLessonRow(l, lang, kurssi?.key || "", stepNumber, l.sortOrder === firstNum)).join("")}
    </div>`;
}

function renderError(root, msg, lang) {
  root.innerHTML = `
    <nav class="crumbs" aria-label="Sijainti">
      <a href="#/aloitus">Aloitus</a>
      <span class="sep" aria-hidden="true">/</span>
      <a href="#/oppimispolku?lang=${encodeURIComponent(lang || "es")}">Oppimispolku</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${escapeHtml(msg || "Kurssia ei löytynyt.")}</p>
      <a class="btn btn--primary btn--sm" href="#/oppimispolku?lang=${encodeURIComponent(lang || "es")}">Palaa kurssilistaan</a>
    </div>`;
}

export async function loadCourseDetail(lang, kurssiKey) {
  show("screen-course-detail");
  const root = document.getElementById("cd-root");
  if (!root) return;
  root.innerHTML = `<div class="op-loading" role="status" aria-label="Ladataan kurssia"><span class="sr-only">Ladataan kurssia…</span></div>`;
  if (!lang || !kurssiKey) {
    renderError(root, "Kurssin tunnistetta ei annettu.", lang);
    return;
  }
  const { kurssi, lessons } = await getCourseDetail(lang, kurssiKey);
  if (!kurssi) {
    renderError(root, "Kurssia ei löytynyt.", lang);
    return;
  }
  if (lessons.length === 0) {
    renderError(root, "Oppitunteja ei vielä julkaistu tälle kurssille.", lang);
    return;
  }
  root.innerHTML = renderShell(lang, kurssi, lessons);
}

/**
 * Parse #/oppimispolku/{lang}/{kurssiKey} and route. Returns true on match.
 */
export function tryRouteCourseDetail(hash) {
  const m = /^#\/oppimispolku\/([a-z]{2})\/([^/?#]+)/i.exec(hash || "");
  if (!m) return false;
  const lang = m[1].toLowerCase();
  const kurssiKey = decodeURIComponent(m[2]);
  loadCourseDetail(lang, kurssiKey);
  return true;
}
