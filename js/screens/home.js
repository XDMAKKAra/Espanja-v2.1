/**
 * HOME — v289 anti-slop redesign (2026-05-23, L-V289-ALOITUS-REDESIGN-1).
 *
 * The v271 dashboard ("Hei!" + date pill + Jatka-card + goal-bar + 4 track
 * tiles) read as AI slop to the user, reported 5 times. This rebuild
 * collapses everything to three honest surfaces and bans:
 *
 *   - Date pill chip
 *   - Orphan greeting
 *   - "Jatka tästä" container card (replaced with inline call-to-action)
 *   - Identical 4-card grid for tracks (replaced with hairline list)
 *   - Empty "0 / 30 min" placeholder bar (hidden when streak + minutes are 0)
 *   - Orphan Koeharjoitus footer link (integrated into paths list)
 *
 * Composition is now:
 *   1. home-tabs   — language switcher, only when 2+ langs enabled
 *   2. home-next   — inline greeting + next-action + one brick CTA
 *   3. home-pulse  — streak + today's minutes, only when there is real data
 *   4. home-paths  — secondary actions as hairline-separated rows
 *
 * One CTA on the screen carries data-cta-primary. The anti-slop spec
 * (tests/e2e-aloitus-anti-slop.spec.js) enforces this contract.
 */

import { API, apiFetch, isLoggedIn, authHeader, fetchDashboardV2, clearDashboardV2 } from "../api.js";
import { setLanguage } from "../state.js";
import { show } from "../ui/nav.js";
import { isProTier } from "../lib/tier.js";
import { prefetchChunk, onHoverIntent } from "../lib/prefetch.js";
import { prefetchCurriculumList } from "../lib/curriculumCache.js";

// L-V316a: when the user clicks "Jatka opintoja" / "Avaa oppimispolku",
// ask the reasoner for a weighted next topic so future generation calls
// can lean on the user's diagnostic gaps. Result is stashed in
// sessionStorage; downstream lesson/exercise flows can read it without
// requiring a synchronous round-trip on every click.
const NEXT_TOPIC_SESSION_KEY = "puheo:next_topic_v1";
const NEXT_TOPIC_LOG_KEY = "puheo:next_topic_log_v1";
const NEXT_TOPIC_POOL = {
  es: [
    "general vocabulary", "society and politics", "environment and nature",
    "health and body", "travel and transport", "culture and arts", "work and economy",
    "ser_estar", "hay_estar", "subjunctive", "conditional",
    "preterite_imperfect", "pronouns",
  ],
  fr: [
    "general vocabulary", "society and politics", "environment and nature",
    "health and body", "travel and transport", "culture and arts", "work and economy",
    "subjunctive", "conditional", "imparfait_passe_compose", "pronouns",
  ],
  de: [
    "general vocabulary", "society and politics", "environment and nature",
    "health and body", "travel and transport", "culture and arts", "work and economy",
    "perfekt_praeteritum", "konjunktiv", "modalverben", "praepositionen",
  ],
};

async function fetchWeightedNextTopic(lang) {
  if (!isLoggedIn()) return null;
  const pool = NEXT_TOPIC_POOL[lang] || NEXT_TOPIC_POOL.es;
  try {
    const res = await apiFetch(`${API}/api/personalization/next-topic`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ language: lang, availableTopics: pool }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.topic) return null;
    return {
      topic: data.topic,
      source: data.source || "uniform",
      gapsCount: data.gapsCount || 0,
      at: Date.now(),
      lang,
    };
  } catch {
    return null;
  }
}

function recordNextTopic(entry) {
  if (!entry) return;
  try {
    sessionStorage.setItem(NEXT_TOPIC_SESSION_KEY, JSON.stringify(entry));
    let log = [];
    try {
      const raw = sessionStorage.getItem(NEXT_TOPIC_LOG_KEY);
      if (raw) log = JSON.parse(raw);
    } catch { /* ignore */ }
    if (!Array.isArray(log)) log = [];
    log.push(entry);
    // Keep last 50 so the manual 10-click verification stays inspectable
    // without unbounded growth.
    if (log.length > 50) log = log.slice(-50);
    sessionStorage.setItem(NEXT_TOPIC_LOG_KEY, JSON.stringify(log));
  } catch { /* private mode */ }
}

const LANGS = [
  { code: "es", label: "Espanja", flag: "🇪🇸" },
  { code: "fr", label: "Ranska", flag: "🇫🇷" },
  { code: "de", label: "Saksa", flag: "🇩🇪" },
];

const ENABLED_LANGS_KEY = "puheo:enabled-langs";
const LANG_KEY = "puheo:lang";
const DEFAULT_GOAL_MIN = 15;
let _ohjaamoData = null;

// L-V347 — stale-while-revalidate cache for the dashboard payload.
// Before: loadHome blocked on a fresh /dashboard/v2 roundtrip whenever the
// 60s in-memory TTL had lapsed (a lesson easily outlasts it), so returning
// to home on a cold serverless instance meant a ~3-5s skeleton stall. Now we
// mirror the payload into localStorage keyed by language, paint it instantly,
// and revalidate in the background. Lang-keyed so a tab switch never paints
// the previous language's numbers.
const OHJAAMO_LS_KEY = "puheo:ohjaamo_cache_v1";

function persistOhjaamo(payload, lang) {
  if (!payload) return;
  const entry = { ts: Date.now(), payload, lang };
  _ohjaamoData = entry;
  try { localStorage.setItem(OHJAAMO_LS_KEY, JSON.stringify(entry)); } catch { /* private mode */ }
}

function readOhjaamoCache(lang) {
  if (_ohjaamoData && _ohjaamoData.lang === lang) return _ohjaamoData;
  try {
    const raw = localStorage.getItem(OHJAAMO_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.payload && parsed.lang === lang) {
        _ohjaamoData = parsed;
        return parsed;
      }
    }
  } catch { /* private mode */ }
  return null;
}

function clearOhjaamoCache() {
  _ohjaamoData = null;
  try { localStorage.removeItem(OHJAAMO_LS_KEY); } catch { /* private mode */ }
}

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

async function fetchOhjaamo(lang) {
  const data = await fetchDashboardV2();
  if (data) persistOhjaamo(data, lang);
  return data;
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

// L-V344 dashboard = WordDive data surface. Three honest blocks built from
// the real /dashboard/v2 payload:
//   1. Koepäivä-countdown (yellow)   — fixed YTL date, big Fredoka number
//   2. Kurssiedistyminen (green)      — learningPath mastered / total + bar
//   3. Seuraava oppitunti (paper)     — greeting + next action + brick CTA
//                                       + heikkous-chipit + putki
// Blocks degrade gracefully: progress hides until the learning path exists.

// YTL syksyn koe — sama päivä kuin landingin --exam-date-iso (28.9.2026).
const EXAM_DATE_ISO = "2026-09-28";

function daysUntilExam() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(`${EXAM_DATE_ISO}T00:00:00`);
  return Math.max(0, Math.round((exam - today) / 86_400_000));
}

function formatExamDate() {
  const [y, m, d] = EXAM_DATE_ISO.split("-").map(Number);
  return `${d}.${m}.${y}`;
}

// Countdown — always shown; the exam date is universal, not per-user.
function renderCountdown() {
  const days = daysUntilExam();
  return `
    <section class="dash-block dash-block--countdown" aria-label="Aikaa ylioppilaskokeeseen">
      <p class="dash-block__label">Ylioppilaskokeeseen</p>
      <p class="dash-block__big"><span class="dash-block__num">${days}</span> päivää</p>
      <p class="dash-block__sub">Syksyn koe ${formatExamDate()}</p>
    </section>`;
}

// Course progress — mastered topics on the learning path. Hidden until the
// path has been generated (fresh accounts see countdown + next-card only).
function renderProgress(data) {
  const lp = data?.learningPath;
  const total = Number(lp?.totalTopics ?? 0);
  if (!lp || total < 1) return "";
  const done = Math.min(total, Number(lp.masteredCount ?? 0));
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return `
    <section class="dash-block dash-block--progress" aria-label="Kurssiedistyminen">
      <p class="dash-block__label">Oppimispolku</p>
      <p class="dash-block__big"><span class="dash-block__num">${done}</span> / ${total} aihetta</p>
      <div class="dash-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <span class="dash-bar__fill" style="width:${pct}%"></span>
      </div>
      <p class="dash-block__sub">${pct}&nbsp;% hallussa</p>
    </section>`;
}

// Weakness chips — the user's top recent mistake topics, as practice targets.
function renderWeakChips(data) {
  const topics = data?.weakTopics?.topics;
  if (!Array.isArray(topics) || topics.length === 0) return "";
  const chips = topics.slice(0, 3).map((t) =>
    `<span class="dash-chip">${escapeHtml(t.label || t.topic || "")}</span>`).join("");
  return `
    <div class="dash-card__weak">
      <span class="dash-card__weak-label">Harjoittele:</span>
      <span class="dash-chips">${chips}</span>
    </div>`;
}

// Streak line, inline in the next-lesson card. Hidden when there is no streak.
function renderStreakLine(data) {
  const streak = Number(data?.dashboard?.streak ?? 0);
  if (streak < 1) return "";
  return `<p class="dash-card__streak"><strong>${streak}</strong> päivän putki</p>`;
}

// Next-lesson paper card — carries the greeting, the next action, the single
// brick CTA (data-cta-primary, wired to the next-topic reasoner), plus the
// weakness chips and streak so the card reads as a real "what now" surface.
function renderNextCard(data, lang) {
  const dashboard = data?.dashboard || {};
  const profile = data?.profile?.profile || window._userProfile || null;
  const sessions = Number(dashboard?.totalSessions ?? 0);
  let lastLesson = null;
  try {
    const raw = sessionStorage.getItem("currentLesson");
    if (raw) lastLesson = JSON.parse(raw);
  } catch { /* private mode */ }

  const firstName = profile?.preferred_name
    || (profile?.full_name ? profile.full_name.split(" ")[0] : "")
    || "";
  const namePart = firstName ? `Hei, ${escapeHtml(firstName)}. ` : "Hei. ";

  const isFresh = sessions === 0 && !lastLesson;
  let title, meta, ctaLabel, ctaHref;
  if (isFresh) {
    title = `${namePart}Aloita ensimmäinen oppitunti.`;
    meta = "Yksi oppitunti päivässä riittää alkuun.";
    ctaLabel = "Aloita";
    ctaHref = `#/oppimispolku?lang=${escapeHtml(lang)}`;
  } else if (lastLesson?.title) {
    const lessonTitle = String(lastLesson.title).slice(0, 80);
    title = `${namePart}Jatka oppituntiin: ${escapeHtml(lessonTitle)}.`;
    meta = "Avaa viimeisin tehtäväsi siitä mihin jäit.";
    ctaLabel = "Jatka oppituntiin";
    ctaHref = lastLesson.href || `#/oppimispolku?lang=${escapeHtml(lang)}`;
  } else {
    title = `${namePart}Jatka oppimispolulla.`;
    meta = "Avaa viimeisin kurssisi ja valitse seuraava oppitunti.";
    ctaLabel = "Avaa oppimispolku";
    ctaHref = `#/oppimispolku?lang=${escapeHtml(lang)}`;
  }

  return `
    <section class="dash-card" aria-label="Seuraava askel">
      <div class="dash-card__head">
        <h1 class="home-next__title dash-card__title">${title}</h1>
        ${renderStreakLine(data)}
      </div>
      <p class="dash-card__meta">${escapeHtml(meta)}</p>
      <a class="home-next__cta dash-card__cta"
         data-cta-primary="true"
         href="${ctaHref}"
         data-action="continue">
        ${escapeHtml(ctaLabel)}
        <span class="home-next__cta-arrow" aria-hidden="true">→</span>
      </a>
      ${renderWeakChips(data)}
    </section>`;
}

// Activity tiles — the three things you actually do inside a course. The
// L-V344 dashboard only linked to the learning path, so writing + mock exam
// were unreachable once logged in (L-V345 fix). Course is the product; the
// AI writing grade is one tile of three, not the whole surface.
function renderActivities(lang) {
  const lp = `#/oppimispolku?lang=${escapeHtml(lang)}`;
  const tiles = [
    {
      kind: "path", href: lp,
      title: "Jatka oppimispolkua",
      sub: "Kahdeksan kurssin polku, kielioppi ja sanasto mukana",
      icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    },
    {
      kind: "exam", href: "#/koeharjoitus",
      title: "Harjoittele YO-koetta",
      sub: "Mallikoe aikarajalla, kuten oikeassa kokeessa",
      icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5a6 3 0 0 0 12 0v-5"/>',
    },
    {
      kind: "write", href: "#/kirjoitus",
      title: "Kirjoita ja saa arvio",
      sub: "Tekoäly pisteyttää kirjoituksesi YTL:n rubriikilla",
      icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    },
  ];
  const items = tiles.map((t) => `
    <a class="dash-action dash-action--${t.kind}" href="${t.href}">
      <span class="dash-action__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
      </span>
      <span class="dash-action__text">
        <span class="dash-action__title">${escapeHtml(t.title)}</span>
        <span class="dash-action__sub">${escapeHtml(t.sub)}</span>
      </span>
      <span class="dash-action__arrow" aria-hidden="true">→</span>
    </a>`).join("");
  return `
    <nav class="dash-actions" aria-label="Mitä haluat tehdä">
      ${items}
    </nav>`;
}

// Dashboard composition: language tabs, a two-up block row (countdown +
// progress), the next-lesson card, then the three activity tiles that open
// the learning path, the mock exam, and the writing grader.
// Desktop composition: a main column (next-lesson card + the three activity
// rows) and a narrower right rail (countdown + course progress). On <900px the
// rail drops above the main column so the countdown/progress lead, then the
// next-action card, then the activities. The two-column canvas is what stops
// the dashboard from sitting as one short top-left pillar over empty cream.
function renderShell(activeLang, data, isPro) {
  const tabsHtml = renderTabs(activeLang);
  const progressHtml = renderProgress(data);
  return `
    ${tabsHtml ? `<div class="home-tabs" role="tablist" aria-label="Kielet">${tabsHtml}</div>` : ""}
    <div class="home-canvas${progressHtml ? "" : " home-canvas--solo"}">
      <div class="home-canvas__main">
        ${renderNextCard(data, activeLang)}
        ${renderActivities(activeLang)}
      </div>
      <aside class="home-canvas__rail" aria-label="Tilanne">
        ${renderCountdown()}
        ${progressHtml}
      </aside>
    </div>
  `;
}

function wireTabs(root) {
  root.querySelectorAll(".home-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const lang = tab.dataset.lang;
      if (!lang) return;
      writeActiveLang(lang);
      // Sync the API-facing language too (state.language drives injectLangParam),
      // so the dashboard + progress writes follow the selected tab. (L-V339)
      setLanguage(lang);
      // Bust the per-language caches so the switch shows this language's data,
      // not the previous language's. clearOhjaamoCache() also drops the
      // localStorage mirror so the SWR path can't repaint stale numbers.
      clearDashboardV2();
      clearOhjaamoCache();
      loadHome();
    });
  });
}

function renderShellSkeleton(activeLang) {
  const tabs = renderTabs(activeLang);
  return `
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotinäyttöä.</span>
      ${tabs ? `<div class="home-tabs" aria-hidden="true">${tabs}</div>` : ""}
      <div class="home-canvas" aria-hidden="true">
        <div class="home-canvas__main">
          <section class="dash-card dash-card--skel">
            <span class="home-skel home-skel--next-title"></span>
            <span class="home-skel home-skel--next-meta"></span>
            <span class="home-skel home-skel--next-cta"></span>
          </section>
          <span class="home-skel home-skel--action"></span>
          <span class="home-skel home-skel--action"></span>
          <span class="home-skel home-skel--action"></span>
        </div>
        <aside class="home-canvas__rail">
          <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
          <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
        </aside>
      </div>
    </div>`;
}

function wireNextTopicHandler(root, lang) {
  const cta = root.querySelector(".home-next__cta");
  if (!cta) return;
  cta.addEventListener("click", (e) => {
    // L-V347 — navigate THIS frame. The weighted-topic call is pure
    // weighting telemetry stashed for later generation; nothing reads it
    // synchronously on the next screen, so it must not gate the click.
    // (The old code awaited it behind a 1.2s race timeout, costing up to
    // 1.2s of dead time on every "Jatka".) Fire it in the background and
    // persist whenever it lands; the hash navigation keeps this document
    // alive so the fetch survives.
    const href = cta.getAttribute("href") || `#/oppimispolku?lang=${lang}`;
    fetchWeightedNextTopic(lang)
      .then((entry) => { if (entry) recordNextTopic(entry); })
      .catch(() => { /* fail-open: downstream falls back to uniform topics */ });
    e.preventDefault();
    location.hash = href.startsWith("#") ? href : `#${href}`;
  });
}

function wireHoverPrefetch(root, lang) {
  const cta = root.querySelector(".home-next__cta");
  if (cta) {
    onHoverIntent(cta, () => {
      prefetchChunk("oppimispolkuIndex", () => import("./oppimispolkuIndex.js"));
      prefetchCurriculumList(lang);
    });
  }
}

export async function loadHome() {
  show("screen-home");
  const root = document.getElementById("home-root");
  if (!root) return;
  const activeLang = readActiveLang();

  const paint = (data) => {
    const isPro = isProTier(data?.profile?.profile);
    window._isPro = isPro;
    root.innerHTML = renderShell(activeLang, data, isPro);
    wireTabs(root);
    wireHoverPrefetch(root, activeLang);
    wireNextTopicHandler(root, activeLang);
  };

  const cached = readOhjaamoCache(activeLang);
  if (cached) {
    // Stale-while-revalidate: paint real data this frame (never block on the
    // network). If the copy is stale, refresh quietly in the background and
    // only repaint when the user is still on home and on the same language.
    paint(cached.payload);
    if (Date.now() - cached.ts >= 60_000) {
      fetchOhjaamo(activeLang)
        .then((data) => {
          if (!data) return;
          const screen = document.getElementById("screen-home");
          if (screen && !screen.hidden && readActiveLang() === activeLang) paint(data);
        })
        .catch(() => { /* keep the stale paint */ });
    }
    return;
  }

  // First-ever load (cold cache everywhere): show the skeleton, await once.
  root.innerHTML = renderShellSkeleton(activeLang);
  const data = await fetchOhjaamo(activeLang);
  paint(data);
}
