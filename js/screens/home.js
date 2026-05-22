/**
 * HOME — v271 dashboard-redesign (2026-05-22).
 *
 * Implements docs/briefs/2026-05-22-dashboard-redesign.md.
 *
 * Old shell (Ohjaamo 5-cell + 4 identical mode cards + italic "Päivää.")
 * was portfolio-page slop — it answered "what does Puheo *contain*"
 * instead of "what do I do next." The new shell collapses to four
 * answerable surfaces:
 *
 *   1. Greeting + date  — personal anchor, no italic Fraunces
 *   2. "Jatka tästä?"   — single primary card with one brick CTA
 *   3. Päivän tavoite   — streak + minute-goal bar
 *   4. Kurssipolku      — 4 micro-tiles for sanasto/kielioppi/luetun/kirjoitus
 *
 * Language tabs stay (multi-lang feature exists), Koeharjoitus survives
 * as a small secondary link in the footer until the sidebar rebuild
 * picks it up (SidebarShell-brief).
 */

import { API, apiFetch, isLoggedIn, authHeader, fetchDashboardV2 } from "../api.js";
import { show } from "../ui/nav.js";
import { isProTier } from "../lib/tier.js";
import { prefetchChunk, onHoverIntent } from "../lib/prefetch.js";
import { prefetchCurriculumList } from "../lib/curriculumCache.js";

const LANGS = [
  { code: "es", label: "Espanja", flag: "🇪🇸" },
  { code: "fr", label: "Ranska", flag: "🇫🇷" },
  { code: "de", label: "Saksa", flag: "🇩🇪" },
];

const ENABLED_LANGS_KEY = "puheo:enabled-langs";
const LANG_KEY = "puheo:lang";
const DEFAULT_GOAL_MIN = 15;
// L-RENDER-PERF-1: shared cache via fetchDashboardV2 in api.js. The local
// _ohjaamoData wrapper stays for the warm-cache fast-path check (timestamp
// gate) but the actual fetch is deduped at the api.js layer so dashboard.js
// + home.js share one network roundtrip.
let _ohjaamoData = null;

function readEnabledLangs() {
  try {
    const raw = localStorage.getItem(ENABLED_LANGS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch { /* private mode */ }
  return ["es"];
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function readActiveLang() {
  const enabled = readEnabledLangs();
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v && enabled.includes(v)) return v;
  } catch { /* private mode */ }
  return enabled[0] || "es";
}

function writeActiveLang(code) {
  try { localStorage.setItem(LANG_KEY, code); } catch { /* ignore */ }
}

async function fetchOhjaamo() {
  // L-RENDER-PERF-1: delegate to shared coalesced fetcher. If dashboard.js
  // already kicked off a /api/dashboard/v2 request, we await the same
  // in-flight promise instead of firing a second one.
  const data = await fetchDashboardV2();
  if (data) _ohjaamoData = { ts: Date.now(), payload: data };
  return data;
}

// Finnish localised "Perjantai 22. toukokuuta" — Intl gives us the parts
// but capitalises the weekday lowercase. Manual title-case keeps it tidy.
function finnishDateLabel(now = new Date()) {
  const weekday = now.toLocaleDateString("fi-FI", { weekday: "long" });
  const day = now.getDate();
  const month = now.toLocaleDateString("fi-FI", { month: "long" });
  const w = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${w} ${day}. ${month}`;
}

function renderTabs(activeLang) {
  const enabled = readEnabledLangs();
  const visible = LANGS.filter((l) => enabled.includes(l.code));
  if (visible.length < 2) return "";
  return visible.map((l) => `
    <button type="button"
            class="home-tab ${l.code === activeLang ? "is-active" : ""}"
            data-lang="${l.code}"
            role="tab"
            aria-selected="${l.code === activeLang ? "true" : "false"}">
      <span class="home-tab__flag" aria-hidden="true">${l.flag}</span>
      <span class="home-tab__label">${escapeHtml(l.label)}</span>
    </button>
  `).join("");
}

function renderGreeting(profile) {
  const name = profile?.preferred_name
    || profile?.full_name
    || window._userProfile?.preferred_name
    || "";
  const greeting = name ? `Hei, ${escapeHtml(name)}!` : "Hei!";
  const dateLabel = escapeHtml(finnishDateLabel());
  return `
    <header class="home-head">
      <h1 class="home-greeting">${greeting}</h1>
      <p class="home-date-pill" aria-label="Päivämäärä">${dateLabel}</p>
    </header>`;
}

// "Jatka tästä?" — the only primary surface on the screen. Brief mandates
// EI tyhjää placeholderia: empty-state shows "Aloita ensimmäinen kurssi".
//
// We don't yet ship a /api/curriculum/continue endpoint that knows the
// last lesson — sessionStorage["currentLesson"] is session-scoped (clears
// on tab close), so a fresh tab still empty-states. Truthful for now;
// a future iteration writes localStorage["puheo:last-lesson"] from
// curriculum.js openLesson() and we read it here.
function renderContinueCard(dashboard, lang) {
  const sessions = Number(dashboard?.totalSessions ?? 0);
  let lastLesson = null;
  try {
    const raw = sessionStorage.getItem("currentLesson");
    if (raw) lastLesson = JSON.parse(raw);
  } catch { /* private mode */ }

  const isFresh = sessions === 0 && !lastLesson;
  const title = isFresh ? "Aloita ensimmäinen kurssi" : "Jatka oppimispolulla";
  const sub = isFresh
    ? "Yksi oppitunti per päivä riittää alkuun."
    : "Avaa viimeisin kurssisi ja jatka siitä mihin jäit.";
  const eyebrow = isFresh ? "Tervetuloa" : "Jatka tästä";
  const cta = isFresh ? "Aloita →" : "Jatka →";

  return `
    <a class="home-continue ${isFresh ? "is-fresh" : ""}"
       href="#/oppimispolku?lang=${escapeHtml(lang)}"
       data-action="continue">
      <div class="home-continue__body">
        <p class="home-continue__eyebrow">${escapeHtml(eyebrow)}</p>
        <h2 class="home-continue__title">${escapeHtml(title)}</h2>
        <p class="home-continue__sub">${escapeHtml(sub)}</p>
      </div>
      <span class="home-continue__cta">${escapeHtml(cta)}</span>
    </a>`;
}

// Päivän tavoite — streak chip on the left, minute-goal bar on the right.
// Both surfaces are real data, not placeholders. When streak is 0 the
// chip swaps to a softer "Aloita putki tänään" instead of "0 pv".
function renderGoalRow(data) {
  const dashboard = data?.dashboard || {};
  const profile = data?.profile?.profile || window._userProfile || {};
  const streak = Number(dashboard.streak ?? 0);
  const goalMin = Number(profile.preferred_session_length || DEFAULT_GOAL_MIN);

  // Today's minutes — estimate from chartData (3 min/session, same heuristic
  // dashboard.js used). chartData lives on the v2 payload's dashboard core.
  const today = new Date().toISOString().slice(0, 10);
  const chartData = Array.isArray(dashboard.chartData) ? dashboard.chartData : [];
  const todaySessions = chartData.filter((l) => l?.createdAt?.slice(0, 10) === today).length;
  const todayMin = Math.min(goalMin, todaySessions * 3);
  const pct = Math.max(0, Math.min(100, Math.round((todayMin / goalMin) * 100)));
  const goalMet = todayMin >= goalMin;

  const streakLabel = streak >= 1
    ? `<span class="home-goal__streak-num">${streak}</span><span class="home-goal__streak-unit">pv putki</span>`
    : `<span class="home-goal__streak-empty">Aloita putki tänään</span>`;
  const streakHot = streak >= 7;

  return `
    <section class="home-goal" aria-label="Päivän tavoite">
      <div class="home-goal__streak ${streakHot ? "is-hot" : ""} ${streak === 0 ? "is-empty" : ""}">
        ${streakLabel}
      </div>
      <div class="home-goal__progress">
        <div class="home-goal__progress-head">
          <span class="home-goal__progress-label">Päivän tavoite</span>
          <span class="home-goal__progress-val">${todayMin} / ${goalMin} min</span>
        </div>
        <div class="home-goal__bar" role="progressbar"
             aria-valuemin="0" aria-valuemax="${goalMin}" aria-valuenow="${todayMin}">
          <div class="home-goal__fill ${goalMet ? "is-met" : ""}" style="width:${pct}%"></div>
        </div>
      </div>
    </section>`;
}

// Kurssipolku snapshot — four micro-tiles, NOT the four big mode cards.
// Sanasto + Kielioppi live inside the oppimispolku flow; luetun + kirjoitus
// each have a dedicated mode page. Linking accordingly.
const TRACKS = [
  { id: "sanasto",   name: "Sanasto",             modeKey: "vocab",   href: (l) => `#/oppimispolku?lang=${l}` },
  { id: "kielioppi", name: "Kielioppi",           modeKey: "grammar", href: (l) => `#/oppimispolku?lang=${l}` },
  { id: "luetun",    name: "Luetun ymmärtäminen", modeKey: "reading", href: (l) => `#/luetun?lang=${l}` },
  { id: "kirjoitus", name: "Kirjoitus",           modeKey: "writing", href: (l) => `#/kirjoitus?lang=${l}` },
];

function renderTracks(dashboard, lang) {
  const modeStats = dashboard?.modeStats || {};
  const tiles = TRACKS.map((t) => {
    const s = modeStats[t.modeKey] || {};
    const sessions = Number(s.sessions ?? 0);
    // Track-progress is session-count scaled against 30 (~one month of
    // daily practice). Honest signal of effort, not a fake course-counter.
    const fillPct = Math.max(0, Math.min(100, Math.round((sessions / 30) * 100)));
    const countLabel = sessions === 0
      ? "Ei vielä aloitettu"
      : `${sessions} ${sessions === 1 ? "harjoitus" : "harjoitusta"}`;
    return `
      <a class="home-track" href="${t.href(lang)}" data-track="${t.id}">
        <h3 class="home-track__name">${escapeHtml(t.name)}</h3>
        <div class="home-track__bar" aria-hidden="true">
          <div class="home-track__bar-fill" style="width:${fillPct}%"></div>
        </div>
        <p class="home-track__meta">${escapeHtml(countLabel)}</p>
      </a>`;
  }).join("");
  return `
    <section class="home-tracks" aria-label="Kurssipolku">
      <p class="home-tracks__eyebrow">Kurssipolku</p>
      <div class="home-tracks__grid">${tiles}</div>
    </section>`;
}

// Small footer with secondary actions — until the sidebar rebuild lands
// (SidebarShell-brief), Koeharjoitus needs a discoverable entry point.
function renderFooter(lang, isPro) {
  const lockHint = isPro ? "" : `<span class="home-footer__lock" aria-hidden="true">🔒</span>`;
  return `
    <footer class="home-footer">
      <a class="home-footer__link" href="#/koeharjoitus?lang=${escapeHtml(lang)}" data-action="exam">
        ${lockHint}<span>Koeharjoitus</span>
        <span class="home-footer__arrow" aria-hidden="true">→</span>
      </a>
    </footer>`;
}

function renderShell(activeLang, data, isPro) {
  const dashboard = data?.dashboard || {};
  const profile = data?.profile?.profile || window._userProfile || null;
  return `
    ${renderGreeting(profile)}
    ${renderTabs(activeLang) ? `<div class="home-tabs" role="tablist" aria-label="Kielet">${renderTabs(activeLang)}</div>` : ""}
    ${renderContinueCard(dashboard, activeLang)}
    ${renderGoalRow(data)}
    ${renderTracks(dashboard, activeLang)}
    ${renderFooter(activeLang, isPro)}
  `;
}

function wireTabs(root) {
  root.querySelectorAll(".home-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const lang = tab.dataset.lang;
      if (!lang) return;
      writeActiveLang(lang);
      // Full re-render is cheaper than rewriting every href in place
      // (continue card, tracks, footer, lang-aware data all need it).
      loadHome();
    });
  });
}

// Layout-matching skeleton — renders BEFORE /api/dashboard/v2 resolves
// so the white content area never sits empty. Same shapes the live
// shell uses (greeting, primary card, goal bar, four micro-tracks) so
// the swap is reflow-free. No italic "Ladataan…" — the brief explicitly
// bans that AI-slop pattern.
function renderShellSkeleton(activeLang) {
  const tabs = renderTabs(activeLang);
  const trackTiles = Array.from({ length: 4 }).map(() => `
    <div class="home-track home-track--skel" aria-hidden="true">
      <span class="home-skel home-skel--track-name"></span>
      <span class="home-skel home-skel--track-bar"></span>
      <span class="home-skel home-skel--track-meta"></span>
    </div>`).join("");
  return `
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotinäyttöä…</span>
      <header class="home-head" aria-hidden="true">
        <span class="home-skel home-skel--greeting"></span>
        <span class="home-skel home-skel--date"></span>
      </header>
      ${tabs ? `<div class="home-tabs" aria-hidden="true">${tabs}</div>` : ""}
      <div class="home-continue home-continue--skel" aria-hidden="true">
        <div class="home-continue__body">
          <span class="home-skel home-skel--eyebrow"></span>
          <span class="home-skel home-skel--title"></span>
          <span class="home-skel home-skel--sub"></span>
        </div>
        <span class="home-skel home-skel--cta"></span>
      </div>
      <section class="home-goal home-goal--skel" aria-hidden="true">
        <span class="home-skel home-skel--streak"></span>
        <span class="home-skel home-skel--goal-bar"></span>
      </section>
      <section class="home-tracks" aria-hidden="true">
        <span class="home-skel home-skel--eyebrow"></span>
        <div class="home-tracks__grid">${trackTiles}</div>
      </section>
    </div>`;
}

// v282 perf — warm the next-screen chunk + its API payload on hover so
// the Aloitus → Oppimispolku / Luetun / Kirjoitus jump runs against an
// already-resolved cache instead of cold imports + cold fetches.
function wireHoverPrefetch(root, lang) {
  const continueCard = root.querySelector(".home-continue");
  if (continueCard) {
    onHoverIntent(continueCard, () => {
      prefetchChunk("oppimispolkuIndex", () => import("./oppimispolkuIndex.js"));
      prefetchCurriculumList(lang);
    });
  }
  root.querySelectorAll(".home-track").forEach((a) => {
    const track = a.dataset.track;
    onHoverIntent(a, () => {
      if (track === "sanasto" || track === "kielioppi") {
        prefetchChunk("oppimispolkuIndex", () => import("./oppimispolkuIndex.js"));
        prefetchCurriculumList(lang);
      } else if (track === "luetun") {
        prefetchChunk("reading", () => import("./reading.js"));
      } else if (track === "kirjoitus") {
        prefetchChunk("writing", () => import("./writing.js"));
      }
    });
  });
}

function wirePaywallTriggers(root) {
  root.querySelectorAll("[data-action='exam']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const isPro = a.dataset.unlocked === "1";
      if (!isPro && !window._isPro) {
        e.preventDefault();
        import("../features/paywallModal.js")
          .then((m) => m.openPaywallModal?.())
          .catch(() => {});
      }
    });
  });
}

export async function loadHome() {
  show("screen-home");
  const root = document.getElementById("home-root");
  if (!root) return;
  const activeLang = readActiveLang();

  // Warm-cache fast path: paint the live shell synchronously if we already
  // have ohjaamo data <60s old. Eliminates the skeleton flash on tab return.
  if (_ohjaamoData && (Date.now() - _ohjaamoData.ts) < 60_000) {
    const cached = _ohjaamoData.payload;
    const isPro = isProTier(cached?.profile?.profile);
    window._isPro = isPro;
    root.innerHTML = renderShell(activeLang, cached, isPro);
    wireTabs(root);
    wirePaywallTriggers(root);
    wireHoverPrefetch(root, activeLang);
    return;
  }
  root.innerHTML = renderShellSkeleton(activeLang);
  const data = await fetchOhjaamo();
  const isPro = isProTier(data?.profile?.profile);
  window._isPro = isPro;
  root.innerHTML = renderShell(activeLang, data, isPro);
  wireTabs(root);
  wirePaywallTriggers(root);
  wireHoverPrefetch(root, activeLang);
}
