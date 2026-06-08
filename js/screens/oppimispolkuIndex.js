/**
 * OPPIMISPOLKU INDEX — pixel-copy of docs/design-ref/app-export/Oppimispolku.jsx
 * (L-V391). The 8-course library. Routed from HOME's "Oppimispolku" mode card
 * at #/oppimispolku?lang=X and from the sidebar #/oppimispolku.
 *
 * DOM + classes mirror the export (.lp-head / .lp-list / .lp-row / .lp-illu).
 * The winding-route SVG is the export's PathIllu verbatim (NOT the invented
 * yellow box). Real per-language progress (L-V390) drives the row states:
 *   kertausPassed   → done   (clickable, green "Suoritettu")
 *   isUnlocked      → active (brick row, "{done}/{total} oppituntia" + chevron)
 *   otherwise       → locked (dashed, lock icon + "Avautuu vuorollaan")
 *
 * L-V409: purchase-lock. Non-kurssi users (free / treeni) see a buy-lock
 * overlay on every row. This is a SEPARATE state from the progress-lock above.
 *   purchase-locked → lp-row--buy-locked (warm overlay, "Avaa Kurssilla" CTA)
 */

import { show } from "../ui/nav.js";
import { state } from "../state.js";
import { getCurriculumList, prefetchCourseDetail } from "../lib/curriculumCache.js";
import { prefetchChunk, onHoverIntent } from "../lib/prefetch.js";
import { getTier } from "../lib/tier.js";
import { openPaywall } from "../features/paywallModal.js";
import { getProfile } from "../api.js";

// Lucide paths copied verbatim from docs/design-ref/app-export/Icons.jsx.
const LUCIDE = {
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  "lock-buy": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
};
function icon(name, attrs = "") {
  return `<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${attrs}>${LUCIDE[name] || ""}</svg>`;
}

// The export's PathIllu — subtle winding route, done check, brick flag.
const PATH_ILLU = `
  <svg class="lp-illu" width="186" height="92" viewBox="0 0 186 92" fill="none" aria-hidden="true">
    <path d="M8 76 C 44 76, 40 30, 78 30 S 130 64, 158 26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 9"/>
    <circle cx="8" cy="76" r="9" fill="var(--bg-card)" stroke="var(--success)" stroke-width="2.5" class="done"/>
    <path d="M4.5 76 L7 78.5 L11.5 73.5" stroke="var(--success)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="78" cy="30" r="6" fill="var(--bg-card)" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="120" cy="48" r="5" fill="var(--bg-card)" stroke="currentColor" stroke-width="2.5"/>
    <g class="flag">
      <path d="M158 26 V 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M158 9 h 16 l -4 6 l 4 6 h -16 z" fill="currentColor"/>
    </g>
  </svg>`;

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// L-V390 language resolution: explicit ?lang= → canonical state.language → es.
// state.language is the single source of truth every API call already uses
// (hydrated from user_profile.target_language, updated by the home tabs). The
// old code read a stale localStorage["puheo:lang"] which opened the wrong
// language for users with no target_language.
function readLangFromHash() {
  const m = /lang=([a-z]{2})/i.exec(location.hash || "");
  if (m) return m[1].toLowerCase();
  const allowed = ["es", "de", "fr"];
  if (allowed.includes(state.language)) return state.language;
  return "es";
}

function langLabelFor(lang) {
  return lang === "es" ? "Espanja" : lang === "fr" ? "Ranska" : lang === "de" ? "Saksa" : lang;
}

function renderRow(k, stepNumber, lang, buyLocked) {
  const done = !!k.kertausPassed;
  const progressLocked = !k.isUnlocked;
  const completed = k.lessonsCompleted || 0;
  const total = k.lessonCount || 10;
  const title = escapeHtml(k.title);
  const desc = k.description ? `<div class="lp-row__desc">${escapeHtml(k.description)}</div>` : "";
  const body = `<div><div class="lp-row__title">${title}</div>${desc}</div>`;

  // L-V409: purchase-lock takes visual priority for non-kurssi users.
  // The underlying progress state is preserved as a data attribute so that
  // once the user upgrades the correct state renders without re-fetch.
  if (buyLocked) {
    const progressState = done ? "done" : progressLocked ? "locked" : "active";
    return `
      <div class="lp-row lp-row--buy-locked" data-kurssi="${escapeHtml(k.key)}" data-progress="${progressState}"
           role="button" tabindex="0"
           aria-label="Kurssi ${stepNumber}: ${title}, vaatii Kurssin">
        <span class="lp-row__num num">${stepNumber}</span>
        ${body}
        <span class="lp-row__buy-cta">
          ${icon("lock", 'class="lp-buy-lock-icon"')}
          <span class="lp-buy-label">Avaa Kurssilla</span>
        </span>
      </div>`;
  }

  if (progressLocked) {
    return `
      <div class="lp-row lp-row--locked" data-kurssi="${escapeHtml(k.key)}" aria-label="Kurssi ${stepNumber}: ${title}, lukittu">
        <span class="lp-row__num num">${stepNumber}</span>
        ${body}
        <span class="lp-row__lock">${icon("lock")} Avautuu vuorollaan</span>
      </div>`;
  }

  const href = `#/oppimispolku/${lang}/${encodeURIComponent(k.key)}`;

  if (done) {
    return `
      <a class="lp-row lp-row--done" href="${href}" data-kurssi="${escapeHtml(k.key)}" aria-label="Kurssi ${stepNumber}: ${title}, suoritettu">
        <span class="lp-row__num num">${stepNumber}</span>
        ${body}
        <span class="lp-row__status"><span class="lesson-done">${icon("circle-check")} Suoritettu</span></span>
      </a>`;
  }

  return `
    <a class="lp-row lp-row--active" href="${href}" data-kurssi="${escapeHtml(k.key)}" aria-label="Kurssi ${stepNumber}: ${title}, ${completed} / ${total} oppituntia">
      <span class="lp-row__num num">${stepNumber}</span>
      ${body}
      <span class="lp-row__status">
        <span class="pill" style="background:var(--brick);color:var(--brick-ink)"><span class="num">${completed} / ${total}</span> oppituntia</span>
        ${icon("chevron-right", 'style="color:var(--brick)"')}
      </span>
    </a>`;
}

function renderShell(lang, kurssit, buyLocked) {
  const done = kurssit.filter((k) => k.kertausPassed).length;
  const total = kurssit.length;
  const langLabel = langLabelFor(lang);

  const buyBanner = buyLocked ? `
    <div class="lp-buy-banner" role="region" aria-label="Kurssin hankinta">
      <div class="lp-buy-banner__text">
        <strong>Koko polku avautuu Kurssilla.</strong>
        Kaikki 8 kurssia, adaptiivinen harjoittelu ja YO-valmius-mittari.
      </div>
      <button class="lp-buy-banner__btn btn btn--primary btn--sm" type="button" data-lp-buy="banner">
        Avaa Kurssi
      </button>
    </div>` : "";

  return `
    <nav class="crumbs" aria-label="Sijainti">
      <a href="#/aloitus">Aloitus</a>
      <span class="sep" aria-hidden="true">/</span>
      <span class="here" aria-current="page">Oppimispolku</span>
    </nav>
    <div class="lp-head">
      <div>
        <span class="eyebrow">${escapeHtml(langLabel)} · YO-koevalmennus</span>
        <h1>Oppimispolku</h1>
        <p class="sub">${total} kurssia · ${done} suoritettu · Etene järjestyksessä.</p>
      </div>
      ${PATH_ILLU}
    </div>
    ${buyBanner}
    <div class="lp-list">
      ${kurssit.map((k, i) => renderRow(k, i + 1, lang, buyLocked)).join("")}
    </div>`;
}

function renderError(root, msg) {
  root.innerHTML = `
    <nav class="crumbs" aria-label="Sijainti"><a href="#/aloitus">Aloitus</a></nav>
    <div class="op-error" role="alert">
      <p>${escapeHtml(msg || "Kursseja ei löytynyt.")}</p>
      <a class="btn btn--primary btn--sm" href="#/aloitus">Palaa aloitukseen</a>
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

  // L-V409: purchase-lock. Kurssi tier = full access. Free / Treeni = buy-locked.
  // window._userProfile is set by initAuth/checkOnboarding on normal boot.
  // If navigating here before that resolves (edge case), fetch lazily so tier
  // is always accurate — a kurssi user must never see a false buy-lock.
  if (!window._userProfile) {
    try {
      const profData = await getProfile();
      if (profData?.profile && !window._userProfile) {
        window._userProfile = profData.profile;
      }
    } catch { /* non-fatal — getTier falls back to "free" which is safe */ }
  }
  const tier = getTier();
  const buyLocked = tier !== "kurssi";
  const paywallVariant = tier === "treeni" ? "upgrade" : "feature";

  root.innerHTML = renderShell(activeLang, kurssit, buyLocked);

  // L-V409: wire buy-lock click handlers (rows + banner button).
  if (buyLocked) {
    root.querySelectorAll(".lp-row--buy-locked").forEach((row) => {
      const open = (e) => {
        e.preventDefault();
        openPaywall({ variant: paywallVariant, reason: "oppimispolku" });
      };
      row.addEventListener("click", open);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
      });
    });
    const bannerBtn = root.querySelector("[data-lp-buy='banner']");
    if (bannerBtn) {
      bannerBtn.addEventListener("click", () => {
        openPaywall({ variant: paywallVariant, reason: "oppimispolku-banner" });
      });
    }
  }

  // v282 perf — hover-prefetch the courseDetail chunk + per-course payload so
  // the next click resolves against a warm cache. Only the clickable rows
  // (active + done); locked rows are non-links and won't navigate.
  root.querySelectorAll("a.lp-row").forEach((a) => {
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
