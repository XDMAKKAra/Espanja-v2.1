/**
 * COURSE DETAIL — PR auto/course-detail-shelf (2026-05-19).
 *
 * Per-course library-shelf of 10 lessons. Routed from oppimispolku-index
 * at #/oppimispolku/{lang}/{kurssiKey}. Same .op-row primitive as the
 * 8-course list — number gutter + title + status, hairline rules. No
 * gradients, no cover blocks. Click lesson → existing lesson runner.
 */

import { show } from "../ui/nav.js";
import { getCourseDetail } from "../lib/curriculumCache.js";

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
  };
  return map[t] || "Oppitunti";
}

function renderLessonRow(l, lang, kurssiKey, courseStep) {
  const num = l.sortOrder || 0;
  const done = !!l.completed;
  const type = typeLabelFi(l.type);
  const title = l.focus || l.title || `Oppitunti ${num}`;
  const cls = [
    "op-row",
    "is-clickable",
    done ? "is-done" : (num === firstUnfinishedNum ? "is-progress" : ""),
  ].filter(Boolean).join(" ");
  const status = done ? "Suoritettu" : "Aloita →";
  const minutes = Number(l.estimated_minutes) || 14;
  const href = `#/oppitunti/${lang}/${encodeURIComponent(kurssiKey)}/${num}`;

  return `
    <a class="${cls}" href="${href}" data-lesson="${num}">
      <span class="op-row__num">${courseStep}.${num}</span>
      <div class="op-row__body">
        <p class="op-row__type">${escapeHtml(type)}</p>
        <h2 class="op-row__title">${escapeHtml(title)}</h2>
      </div>
      <div class="op-row__meta">
        <span class="op-row__minutes">~${minutes} min</span>
        <span class="op-row__status">${escapeHtml(status)}</span>
      </div>
    </a>`;
}

// scoped so renderLessonRow can see it inside the same closure
let firstUnfinishedNum = null;

function renderShell(lang, kurssi, lessons) {
  const stepNumber = kurssi?._stepNumber || 1;
  const totalLessons = lessons.length;
  const doneCount = lessons.filter((l) => l.completed).length;
  const pct = totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0;

  // Track first incomplete for the brick bookmark stripe
  const firstUnfinished = lessons.find((l) => !l.completed);
  firstUnfinishedNum = firstUnfinished ? firstUnfinished.sortOrder : null;

  const langLabel = lang === "es" ? "Espanja" : lang === "fr" ? "Ranska" : lang === "de" ? "Saksa" : lang;

  return `
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(lang)}">Oppimispolku</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">${escapeHtml(`Kurssi ${stepNumber}`)}</span>
    </nav>
    <header class="op-head">
      <p class="op-eyebrow">${escapeHtml(langLabel)} · Kurssi ${stepNumber} · Taso ${escapeHtml(kurssi?.level || "—")}</p>
      <h1 class="op-title display display--serif">${escapeHtml(kurssi?.title || "Kurssi")}</h1>
      ${kurssi?.description ? `<p class="op-sub">${escapeHtml(kurssi.description)}</p>` : ""}
      <div class="op-progress">
        <div class="op-progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct} % suoritettu">
          <div class="op-progress-fill" style="width:${pct}%"></div>
        </div>
        <span class="op-progress-text mono-num">${doneCount} / ${totalLessons} oppituntia · ${pct} %</span>
      </div>
    </header>
    <ol class="op-list" role="list">
      ${lessons.map((l) => renderLessonRow(l, lang, kurssi?.key || "", stepNumber)).join("")}
    </ol>`;
}

function renderError(root, msg, lang) {
  root.innerHTML = `
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(lang || "es")}">Oppimispolku</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${escapeHtml(msg || "Kurssia ei löytynyt.")}</p>
      <a class="btn-primary" href="#/oppimispolku?lang=${encodeURIComponent(lang || "es")}">Palaa kurssilistaan</a>
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
 * Parse #/oppimispolku/{lang}/{kurssiKey} and route. Returns true on
 * match.
 */
export function tryRouteCourseDetail(hash) {
  const m = /^#\/oppimispolku\/([a-z]{2})\/([^/?#]+)/i.exec(hash || "");
  if (!m) return false;
  const lang = m[1].toLowerCase();
  const kurssiKey = decodeURIComponent(m[2]);
  loadCourseDetail(lang, kurssiKey);
  return true;
}
