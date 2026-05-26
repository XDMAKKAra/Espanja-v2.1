/**
 * OPPIMISPOLKU INDEX — PR auto/oppimispolku-shelf (2026-05-19).
 *
 * The 8-course library page. Routed from HOME's "Oppimispolku" mode card
 * at #/oppimispolku?lang=X. Replaces the old #screen-path which mixed
 * dashboard widgets with course list — that screen is dying.
 *
 * Visual: library-shelf rows. No cover images, no gradient blocks. Just
 * a number gutter + course title/desc + progress bar. Reads as the
 * index page of a textbook.
 */

import { show } from "../ui/nav.js";
import { getCurriculumList, prefetchCourseDetail } from "../lib/curriculumCache.js";
import { prefetchChunk, onHoverIntent } from "../lib/prefetch.js";

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function readLangFromHash() {
  const m = /lang=([a-z]{2})/i.exec(location.hash || "");
  if (m) return m[1].toLowerCase();
  try { return localStorage.getItem("puheo:lang") || "es"; }
  catch { return "es"; }
}

function renderRow(k, stepNumber, lang) {
  const done = !!k.kertausPassed;
  const locked = !k.isUnlocked;
  const completed = k.lessonsCompleted || 0;
  const total = k.lessonCount || 10;
  const pct = Math.min(100, Math.round((completed / total) * 100));

  // L-PRO-LUKITTU-1: the gate is sequential progression, not Pro. The
  // old "Lukittu" + dim styling read as a paywall and made Pro users
  // think they'd been short-changed. Switch to progression language so
  // the chip explains *why* the course isn't reachable yet.
  const status = done
    ? "Suoritettu"
    : locked
      ? "Avautuu vuorollaan"
      : completed > 0
        ? `${completed} / ${total} oppituntia`
        : "Aloita →";

  const cls = [
    "op-row",
    done ? "is-done" : "",
    locked ? "is-locked" : "is-clickable",
    completed > 0 && !done ? "is-progress" : "",
  ].filter(Boolean).join(" ");

  const href = locked
    ? "#"
    : `#/oppimispolku/${lang}/${encodeURIComponent(k.key)}`;

  // L-OPPIMISPOLKU-ROLES-1: wrap each row anchor in <li>. The outer <ol>
  // previously held bare <a> children, which is invalid HTML and made
  // screen readers announce the rows as a loose chain of links instead
  // of "list, 8 items, item 1 of 8". <li> is implicit listitem; the
  // anchor keeps its link role and aria-disabled state for locked rows.
  return `
    <li class="op-row-li">
      <a class="${cls}" href="${href}" data-kurssi="${escapeHtml(k.key)}" ${locked ? 'aria-disabled="true"' : ""} aria-label="Kurssi ${stepNumber}: ${escapeHtml(k.title)}, ${escapeHtml(status)}">
        <span class="op-row__num" aria-hidden="true">${stepNumber}</span>
        <div class="op-row__body">
          <h2 class="op-row__title">${escapeHtml(k.title)}</h2>
          ${k.description ? `<p class="op-row__desc">${escapeHtml(k.description)}</p>` : ""}
        </div>
        <div class="op-row__meta">
          <div class="op-row__progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct} % suoritettu">
            <div class="op-row__progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="op-row__status">${escapeHtml(status)}</span>
        </div>
      </a>
    </li>`;
}

function renderShell(lang, kurssit) {
  const done = kurssit.filter((k) => k.kertausPassed).length;
  const totalCourses = kurssit.length;
  const langLabel = lang === "es" ? "Espanja" : lang === "fr" ? "Ranska" : lang === "de" ? "Saksa" : lang;

  return `
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">Oppimispolku</span>
    </nav>
    <header class="op-head">
      <p class="op-eyebrow">${escapeHtml(langLabel)} · YO-koevalmennus</p>
      <h1 class="op-title display display--serif">Oppimispolku</h1>
      <p class="op-sub">${totalCourses} kurssia · ${done} suoritettu · Etene järjestyksessä.</p>
    </header>
    <ol class="op-list" role="list">
      ${kurssit.map((k, i) => renderRow(k, i + 1, lang)).join("")}
    </ol>`;
}

function renderError(root, msg) {
  root.innerHTML = `
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${escapeHtml(msg || "Kursseja ei löytynyt.")}</p>
      <a class="btn-primary" href="#/aloitus">Palaa aloitukseen</a>
    </div>`;
}

export async function loadOppimispolkuIndex(lang) {
  show("screen-oppimispolku-index");
  const root = document.getElementById("op-root");
  if (!root) return;
  const activeLang = lang || readLangFromHash();
  root.innerHTML = `<div class="op-loading" role="status" aria-label="Ladataan kursseja"><span class="sr-only">Ladataan kursseja…</span></div>`;
  const kurssit = await getCurriculumList(activeLang);
  if (kurssit.length === 0) {
    renderError(root, "Kursseja ei vielä julkaistu tälle kielelle.");
    return;
  }
  root.innerHTML = renderShell(activeLang, kurssit);
  // Locked rows: prevent click + paywall hint optional.
  root.querySelectorAll(".op-row.is-locked").forEach((a) => {
    a.addEventListener("click", (e) => e.preventDefault());
  });
  // v282 perf — hover-prefetch the courseDetail chunk + per-course payload
  // so the next click resolves against a warm cache instead of two round-
  // trips. Only clickable rows; locked rows wouldn't navigate anyway.
  root.querySelectorAll(".op-row.is-clickable").forEach((a) => {
    const key = a.dataset.kurssi;
    if (!key) return;
    onHoverIntent(a, () => {
      prefetchChunk("courseDetail", () => import("./courseDetail.js"));
      prefetchCourseDetail(activeLang, key);
    });
  });
}

/**
 * Returns true if hash matches #/oppimispolku (optionally with ?lang=X)
 * and routes the screen. Returning false lets main.js fall through.
 */
export function tryRouteOppimispolkuIndex(hash) {
  if (!/^#\/oppimispolku(\?|$)/.test(hash || "")) return false;
  loadOppimispolkuIndex();
  return true;
}
