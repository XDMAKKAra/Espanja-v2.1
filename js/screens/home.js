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
  const data = await fetchDashboardV2();
  if (data) _ohjaamoData = { ts: Date.now(), payload: data };
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

// Dashboard composition: language tabs, a two-up block row (countdown +
// progress), then the next-lesson card spanning full width.
function renderShell(activeLang, data, isPro) {
  const tabsHtml = renderTabs(activeLang);
  const progressHtml = renderProgress(data);
  return `
    ${tabsHtml ? `<div class="home-tabs" role="tablist" aria-label="Kielet">${tabsHtml}</div>` : ""}
    <div class="dash-grid${progressHtml ? "" : " dash-grid--solo"}">
      ${renderCountdown()}
      ${progressHtml}
    </div>
    ${renderNextCard(data, activeLang)}
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
      // not the previous language's (both caches are language-agnostic).
      clearDashboardV2();
      _ohjaamoData = null;
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
      <div class="dash-grid" aria-hidden="true">
        <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
        <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
      </div>
      <section class="dash-card dash-card--skel" aria-hidden="true">
        <span class="home-skel home-skel--next-title"></span>
        <span class="home-skel home-skel--next-meta"></span>
        <span class="home-skel home-skel--next-cta"></span>
      </section>
    </div>`;
}

function wireNextTopicHandler(root, lang) {
  const cta = root.querySelector(".home-next__cta");
  if (!cta) return;
  cta.addEventListener("click", async (e) => {
    // Hold the navigation a beat so the /next-topic response actually
    // persists to sessionStorage before the page changes. Without this,
    // the fetch is racing the browser's anchor navigation and the
    // downstream lesson runner sees no topic. The 1.2s timeout keeps the
    // CTA responsive when the API is slow / offline (fail-open).
    if (cta.dataset.busy === "1") return;
    e.preventDefault();
    cta.dataset.busy = "1";
    cta.setAttribute("aria-busy", "true");
    const href = cta.getAttribute("href") || `#/oppimispolku?lang=${lang}`;
    let entry = null;
    try {
      entry = await Promise.race([
        fetchWeightedNextTopic(lang),
        new Promise((resolve) => setTimeout(() => resolve(null), 1200)),
      ]);
    } catch { entry = null; }
    if (entry) recordNextTopic(entry);
    cta.dataset.busy = "0";
    cta.removeAttribute("aria-busy");
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

  if (_ohjaamoData && (Date.now() - _ohjaamoData.ts) < 60_000) {
    const cached = _ohjaamoData.payload;
    const isPro = isProTier(cached?.profile?.profile);
    window._isPro = isPro;
    root.innerHTML = renderShell(activeLang, cached, isPro);
    wireTabs(root);
    wireHoverPrefetch(root, activeLang);
    wireNextTopicHandler(root, activeLang);
    return;
  }
  root.innerHTML = renderShellSkeleton(activeLang);
  const data = await fetchOhjaamo();
  const isPro = isProTier(data?.profile?.profile);
  window._isPro = isPro;
  root.innerHTML = renderShell(activeLang, data, isPro);
  wireTabs(root);
  wireHoverPrefetch(root, activeLang);
  wireNextTopicHandler(root, activeLang);
}
