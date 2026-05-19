/**
 * HOME screen — PR auto/home-screen (2026-05-19).
 *
 * Top tabs pick a target language (ES / FR / DE), grid below lists 8
 * Otava-style course cards for the active language. Card click navigates
 * to #/kurssi/{lang}/{key} (handled by future PR 3's course-overview
 * screen). Until that lands, clicks fall back to the existing path
 * screen with the chosen course auto-expanded.
 *
 * State: active language persists to localStorage("puheo:lang") so the
 * user lands on their last-pick on return. First-time visitors default
 * to "es" (Spanish — the only language with fully populated content
 * during this rollout).
 */

import { API, apiFetch, isLoggedIn, authHeader } from "../api.js";
import { show } from "../ui/nav.js";

const LANGS = [
  { code: "es", label: "Espanja", flag: "🇪🇸" },
  { code: "fr", label: "Ranska", flag: "🇫🇷" },
  { code: "de", label: "Saksa", flag: "🇩🇪" },
];

const LANG_KEY = "puheo:lang";
const _courseCache = new Map(); // lang → { ts, kurssit }

function readActiveLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v && LANGS.some((l) => l.code === v)) return v;
  } catch { /* private mode */ }
  return "es";
}

function writeActiveLang(code) {
  try { localStorage.setItem(LANG_KEY, code); } catch { /* ignore */ }
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function renderHomeShell(activeLang) {
  const tabs = LANGS.map((l) => `
    <button type="button"
            class="home-tab ${l.code === activeLang ? "is-active" : ""}"
            data-lang="${l.code}"
            role="tab"
            aria-selected="${l.code === activeLang ? "true" : "false"}">
      <span class="home-tab__flag" aria-hidden="true">${l.flag}</span>
      <span class="home-tab__label">${escapeHtml(l.label)}</span>
    </button>
  `).join("");

  return `
    <header class="home-head">
      <p class="home-eyebrow">Aloita harjoittelu</p>
      <h1 class="home-title display display--serif">YO-koevalmennus</h1>
      <p class="home-sub">Valitse kieli ja kurssi. Edistyminen tallentuu jokaiseen erikseen.</p>
    </header>
    <div class="home-tabs" role="tablist" aria-label="Kielet">${tabs}</div>
    <div class="home-grid" id="home-grid" aria-live="polite">
      <div class="home-grid-loading">Ladataan kursseja&hellip;</div>
    </div>`;
}

function renderCourseCard(lang, k, stepNumber) {
  const done = !!k.kertausPassed;
  const locked = !k.isUnlocked;
  const completed = k.lessonsCompleted || 0;
  const total = k.lessonCount || 10;
  const pct = Math.min(100, Math.round((completed / total) * 100));

  const status = done
    ? "Suoritettu"
    : locked
      ? "Lukittu"
      : completed > 0
        ? "Jatka"
        : "Aloita";

  const statusCls = done
    ? "is-done"
    : locked
      ? "is-locked"
      : completed > 0
        ? "is-progress"
        : "is-start";

  // Deterministic cover hue per course index so each card looks distinct
  // without needing 8 separate SVG files. Two-stop gradient on the cover
  // area, brick accent corner glyph stays consistent across cards.
  const hueA = (stepNumber * 47) % 360;
  const hueB = (hueA + 28) % 360;

  return `
    <button type="button"
            class="home-card ${statusCls}"
            data-kurssi="${escapeHtml(k.key)}"
            data-lang="${escapeHtml(lang)}"
            ${locked ? 'aria-disabled="true"' : ""}>
      <div class="home-card__cover"
           style="background: linear-gradient(135deg, oklch(72% 0.08 ${hueA}) 0%, oklch(58% 0.10 ${hueB}) 100%);">
        <span class="home-card__cover-num">${stepNumber}</span>
        <span class="home-card__cover-level">Taso ${escapeHtml(k.level || "—")}</span>
      </div>
      <div class="home-card__body">
        <h3 class="home-card__title">${escapeHtml(`${stepNumber}. ${k.title}`)}</h3>
        <div class="home-card__progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct} % suoritettu">
          <div class="home-card__progress-bar"><div class="home-card__progress-fill" style="width:${pct}%"></div></div>
          <span class="home-card__progress-text">${completed} / ${total} oppituntia</span>
        </div>
        <span class="home-card__status">${escapeHtml(status)}</span>
      </div>
    </button>`;
}

function renderGrid(host, lang, kurssit) {
  if (!kurssit || kurssit.length === 0) {
    host.innerHTML = `<p class="home-grid-empty">Kursseja ei vielä julkaistu tälle kielelle.</p>`;
    return;
  }
  host.innerHTML = kurssit.map((k, i) => renderCourseCard(lang, k, i + 1)).join("");
  host.querySelectorAll(".home-card:not([aria-disabled='true'])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.kurssi;
      const cardLang = btn.dataset.lang;
      writeActiveLang(cardLang);
      // PR auto/course-overview (2026-05-19): route to the new
      // overview screen. hashchange listener in main.js pattern-
      // matches #/kurssi/{lang}/{key} and dispatches to
      // courseOverview.tryRouteCourseOverview.
      location.hash = `#/kurssi/${cardLang}/${encodeURIComponent(key)}`;
    });
  });
}

async function fetchCourses(lang) {
  const cached = _courseCache.get(lang);
  if (cached && (Date.now() - cached.ts) < 60_000) return cached.kurssit;
  try {
    const res = await apiFetch(`${API}/api/curriculum?lang=${encodeURIComponent(lang)}`, {
      headers: { ...(isLoggedIn() ? authHeader() : {}) },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.available === false) return [];
    const kurssit = Array.isArray(data?.kurssit)
      ? data.kurssit.filter((k) => k && typeof k.key === "string")
      : [];
    _courseCache.set(lang, { ts: Date.now(), kurssit });
    return kurssit;
  } catch {
    return [];
  }
}

async function loadGridForLang(lang) {
  const host = document.getElementById("home-grid");
  if (!host) return;
  const kurssit = await fetchCourses(lang);
  renderGrid(host, lang, kurssit);
}

function wireTabs(root) {
  root.querySelectorAll(".home-tab").forEach((tab) => {
    tab.addEventListener("click", async () => {
      const lang = tab.dataset.lang;
      if (!lang) return;
      writeActiveLang(lang);
      root.querySelectorAll(".home-tab").forEach((t) => {
        const isThis = t === tab;
        t.classList.toggle("is-active", isThis);
        t.setAttribute("aria-selected", isThis ? "true" : "false");
      });
      const host = document.getElementById("home-grid");
      if (host) host.innerHTML = `<div class="home-grid-loading">Ladataan kursseja&hellip;</div>`;
      await loadGridForLang(lang);
    });
  });
}

export async function loadHome() {
  show("screen-home");
  const root = document.getElementById("home-root");
  if (!root) return;
  const activeLang = readActiveLang();
  root.innerHTML = renderHomeShell(activeLang);
  wireTabs(root);
  await loadGridForLang(activeLang);
}
