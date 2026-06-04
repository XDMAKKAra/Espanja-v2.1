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
import { getTier } from "../lib/tier.js";
import { openPaywall } from "../features/paywallModal.js";
import { prefetchChunk, onHoverIntent } from "../lib/prefetch.js";
import { prefetchCurriculumList, prefetchCourseDetail, getCurriculumList, getCourseDetail } from "../lib/curriculumCache.js";

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

// L-V377 launchpad. The L-V344 dashboard opened with zero-state numerals
// ("0 / 10 aihetta · 0 % hallussa") and duplicated "jatka" across a hero
// card and three identical activity tiles. This rebuild answers one question
// in two seconds — "what is my one thing right now" — with a single dominant
// Jatka button that resolves the next task in one tap, a daily-goal ring that
// completes and resets, a streak for loss-aversion, and a personalised
// countdown. Tiers differ by one element each, not three separate screens.

// YTL syksyn koe — sama päivä kuin landingin --exam-date-iso (28.9.2026).
const EXAM_DATE_ISO = "2026-09-28";
const DAILY_GOAL = 3;        // tasks/day that fill the ring
const GOAL_MINUTES = 8;      // rough minutes for the full daily goal
const GRADES = ["I", "A", "B", "C", "M", "E", "L"];

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

// Tasks completed today, derived from the recent-logs slice in the payload.
// Self-resetting (only today's timestamps count) so the ring empties at
// midnight without any stored counter.
function getTodayCount(data) {
  const recent = data?.dashboard?.recent;
  if (!Array.isArray(recent)) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  let n = 0;
  for (const r of recent) {
    const t = r?.createdAt || r?.created_at;
    if (!t) continue;
    const d = new Date(t);
    if (!Number.isNaN(d.getTime()) && d >= start) n++;
  }
  return n;
}

// Blurred grade band for the free wall: the estimate plus one grade up, e.g.
// "M tai E". No dash (em-dash is banned and reads as a minus on letters).
function gradeBand(grade) {
  const i = GRADES.indexOf(grade);
  if (i < 0) return grade;
  const hi = GRADES[Math.min(GRADES.length - 1, i + 1)];
  return hi === grade ? grade : `${grade} tai ${hi}`;
}

// ── Streak pill — top-right of the hero. Loss-aversion anchor for daily
// returns. A brand-new account shows a forward "Päivä 1" seed instead of a
// zero; a lapsed account shows nothing (the goal ring carries the nudge).
function renderStreakPill(streak, isFresh) {
  if (streak >= 1) {
    return `<p class="dash-hero__streak" aria-label="${streak} päivää putkeen">
      <span class="dash-hero__streak-num">${streak}</span> päivää putkeen</p>`;
  }
  if (isFresh) return `<p class="dash-hero__streak dash-hero__streak--seed">Päivä 1</p>`;
  return "";
}

// ── Hero — greeting + ONE dominant Jatka button + small secondary links.
// The button resolves its destination on click (resolveNextTaskHref), so a
// single tap lands inside a task, never on a course menu.
function renderHero(data, lang) {
  const dashboard = data?.dashboard || {};
  const profile = data?.profile?.profile || window._userProfile || null;
  const sessions = Number(dashboard?.totalSessions ?? 0);
  const streak = Number(dashboard?.streak ?? 0);
  let lastLesson = null;
  try {
    const raw = sessionStorage.getItem("currentLesson");
    if (raw) lastLesson = JSON.parse(raw);
  } catch { /* private mode */ }

  const firstName = profile?.preferred_name
    || (profile?.full_name ? profile.full_name.split(" ")[0] : "")
    || "";
  const hi = firstName ? `Hei, ${escapeHtml(firstName)}.` : "Hei.";
  const isFresh = sessions === 0 && !lastLesson;

  let eyebrow, title, meta, ctaLabel;
  if (isFresh) {
    eyebrow = "Aloitetaan";
    title = `${hi} Ensimmäinen tehtäväsi odottaa.`;
    meta = "Yksi lyhyt tehtävä riittää alkuun. Painetaan käyntiin.";
    ctaLabel = "Aloita";
  } else if (lastLesson?.title) {
    eyebrow = "Jatketaan";
    title = `${hi} Jatka siitä mihin jäit.`;
    meta = `Seuraavana: ${escapeHtml(String(lastLesson.title).slice(0, 70))}.`;
    ctaLabel = "Jatka";
  } else {
    eyebrow = "Jatketaan";
    title = `${hi} Seuraava tehtäväsi on valmiina.`;
    meta = "Yksi napautus vie suoraan tekemiseen.";
    ctaLabel = "Jatka";
  }

  const fallbackHref = `#/oppimispolku?lang=${escapeHtml(lang)}`;
  return `
    <section class="dash-hero" aria-label="Jatka">
      <div class="dash-hero__head">
        <div class="dash-hero__greet">
          <p class="dash-hero__eyebrow">${escapeHtml(eyebrow)}</p>
          <h1 class="dash-hero__title">${title}</h1>
          <p class="dash-hero__meta">${meta}</p>
        </div>
        ${renderStreakPill(streak, isFresh)}
      </div>
      <button type="button" class="dash-hero__cta" data-cta-primary="true"
              data-next-task data-fallback="${fallbackHref}">
        <span class="dash-hero__cta-label">${escapeHtml(ctaLabel)}</span>
        <span class="dash-hero__cta-arrow" aria-hidden="true">→</span>
      </button>
      <nav class="dash-hero__secondary" aria-label="Muut tehtävät">
        <a class="dash-hero__link" href="#/koeharjoitus">Harjoittele YO-koetta</a>
        <a class="dash-hero__link" href="#/kirjoitus">Kirjoita ja saa arvio</a>
      </nav>
    </section>`;
}

// ── Progress ring (SVG). value/max → arc; check glyph when met.
function renderRing(value, max, met) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const off = (c * (1 - pct)).toFixed(1);
  const center = met
    ? `<svg class="dash-ring__check" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`
    : `<span class="dash-ring__num">${value}</span>`;
  return `
    <div class="dash-ring${met ? " is-met" : ""}">
      <svg viewBox="0 0 64 64" width="62" height="62" aria-hidden="true">
        <circle class="dash-ring__track" cx="32" cy="32" r="${r}" fill="none" stroke-width="7"/>
        <circle class="dash-ring__fill" cx="32" cy="32" r="${r}" fill="none" stroke-width="7"
                stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off}"
                transform="rotate(-90 32 32)"/>
      </svg>
      <span class="dash-ring__center">${center}</span>
    </div>`;
}

function goalBlockMarkup({ ring, label, count, sub, met, ariaLabel }) {
  return `
    <section class="dash-block dash-block--goal${met ? " is-met" : ""}" aria-label="${escapeHtml(ariaLabel)}">
      ${ring}
      <div class="dash-goal__text">
        <p class="dash-block__label">${escapeHtml(label)}</p>
        <p class="dash-goal__count">${escapeHtml(count)}</p>
        <p class="dash-block__sub">${escapeHtml(sub)}</p>
      </div>
    </section>`;
}

// ── Daily-goal block. Completable, dopamine-shaped — the opposite of a
// lifetime zero statistic. The course tier swaps this slot for course
// progress once the curriculum loads (updateKurssiProgress); until then a
// kurssi user simply sees the daily goal, which is a sensible default.
function renderGoalBlock(data) {
  const today = getTodayCount(data);
  const met = today >= DAILY_GOAL;
  const remainMin = Math.max(0, Math.round((DAILY_GOAL - today) * (GOAL_MINUTES / DAILY_GOAL)));
  return goalBlockMarkup({
    ring: renderRing(today, DAILY_GOAL, met),
    label: "Tänään",
    count: `${today} / ${DAILY_GOAL} tehtävää`,
    sub: met ? "Päivän tavoite täynnä." : `Noin ${remainMin} min jäljellä.`,
    met,
    ariaLabel: "Päivän tavoite",
  });
}

// ── Countdown — personal. Days to the exam plus a line tied to either the
// projected grade (treeni/kurssi, the YTL engine is the unique edge) or the
// pace needed to finish (free / thin data). No free-floating anxiety number.
function personalCountdownLine(data, tier) {
  const ge = data?.dashboard?.gradeEstimate;
  if ((tier === "treeni" || tier === "kurssi") && ge && ge.tier !== "none" && ge.grade) {
    return `Tällä tahdilla arviomme: ${escapeHtml(ge.grade)}.`;
  }
  const lp = data?.learningPath;
  const total = Number(lp?.totalTopics ?? 0);
  const done = Number(lp?.masteredCount ?? 0);
  const left = total - done;
  const days = daysUntilExam();
  if (total > 0 && left > 0 && days > 7) {
    const weeks = Math.max(1, Math.floor(days / 7));
    const perWeek = Math.ceil(left / weeks);
    return `Noin ${perWeek} aihetta viikossa pitää sinut aikataulussa.`;
  }
  return `Syksyn koe ${formatExamDate()}.`;
}

function renderCountdownBlock(data, tier) {
  const days = daysUntilExam();
  return `
    <section class="dash-block dash-block--countdown" aria-label="Aikaa ylioppilaskokeeseen">
      <p class="dash-block__label">Ylioppilaskokeeseen</p>
      <p class="dash-block__big"><span class="dash-block__num">${days}</span> päivää</p>
      <p class="dash-block__sub">${escapeHtml(personalCountdownLine(data, tier))}</p>
    </section>`;
}

// ── Soft wall (free tier, daily goal met). Converts at the peak of
// satisfaction, not by blocking the work. Teases the blurred grade estimate.
function renderWall(data) {
  const ge = data?.dashboard?.gradeEstimate;
  const hasGrade = ge && ge.tier !== "none" && ge.grade;
  const teaser = hasGrade
    ? `<div class="dash-wall__teaser">
         <span class="dash-wall__teaser-label">Arviomme YO-tasostasi</span>
         <span class="dash-wall__teaser-grade" aria-hidden="true">${escapeHtml(gradeBand(ge.grade))}</span>
         <span class="sr-only">Avaa Treeni nähdäksesi tarkan arvion.</span>
       </div>`
    : `<p class="dash-wall__hint">Tee muutama tehtävä lisää, niin arvioimme YO-tasosi.</p>`;
  return `
    <section class="dash-wall" aria-label="Treeni">
      <p class="dash-wall__label">Päivän tavoite täynnä</p>
      <h2 class="dash-wall__title">Huominen aukeaa Treenissä</h2>
      <p class="dash-wall__meta">Ilmaisversiossa teet kolme tehtävää päivässä. Treenissä jatkat niin pitkälle kuin jaksat.</p>
      ${teaser}
      <button type="button" class="dash-wall__cta" data-open-paywall>Avaa Treeni</button>
    </section>`;
}

// Resolve the next task in one tap. Priority: resume the exact lesson the user
// left, else the first incomplete lesson on the first reachable course, else
// fall back to the course list. Caches are warm from the hover prefetch.
async function resolveNextTaskHref(lang) {
  try {
    const raw = sessionStorage.getItem("currentLesson");
    if (raw) {
      const last = JSON.parse(raw);
      if (last?.href && /#\/oppitunti\//.test(last.href)) return last.href;
    }
  } catch { /* private mode */ }

  try {
    const kurssit = await getCurriculumList(lang);
    if (Array.isArray(kurssit) && kurssit.length) {
      const course = kurssit.find((k) => k.isUnlocked && !k.kertausPassed)
        || kurssit.find((k) => k.isUnlocked)
        || kurssit[0];
      if (course?.key) {
        const { lessons } = await getCourseDetail(lang, course.key);
        if (Array.isArray(lessons) && lessons.length) {
          const next = lessons.find((l) => !l.completed) || lessons[0];
          const num = next?.sortOrder || 1;
          return `#/oppitunti/${lang}/${encodeURIComponent(course.key)}/${num}`;
        }
      }
    }
  } catch { /* fall through to the list */ }

  return `#/oppimispolku?lang=${encodeURIComponent(lang)}`;
}

function renderShell(activeLang, data, tier) {
  const tabsHtml = renderTabs(activeLang);
  const wall = tier === "free" && getTodayCount(data) >= DAILY_GOAL ? renderWall(data) : "";
  return `
    ${tabsHtml ? `<div class="home-tabs" role="tablist" aria-label="Kielet">${tabsHtml}</div>` : ""}
    <div class="home-canvas">
      <div class="home-canvas__main">
        ${renderHero(data, activeLang)}
        ${wall}
      </div>
      <aside class="home-canvas__rail" aria-label="Tilanne">
        ${renderGoalBlock(data)}
        ${renderCountdownBlock(data, tier)}
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
          <section class="dash-hero dash-hero--skel">
            <span class="home-skel home-skel--next-title"></span>
            <span class="home-skel home-skel--next-meta"></span>
            <span class="home-skel home-skel--next-cta"></span>
          </section>
        </div>
        <aside class="home-canvas__rail">
          <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
          <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
        </aside>
      </div>
    </div>`;
}

function wireNextTaskHandler(root, lang) {
  const cta = root.querySelector("[data-next-task]");
  if (!cta) return;
  cta.addEventListener("click", async () => {
    if (cta.dataset.busy) return;
    cta.dataset.busy = "1";
    cta.setAttribute("aria-busy", "true");
    const labelEl = cta.querySelector(".dash-hero__cta-label");
    if (labelEl) labelEl.textContent = "Avataan";
    // Weighted next-topic call is pure telemetry stashed for later generation;
    // it must not gate navigation, so fire-and-forget. (L-V347)
    fetchWeightedNextTopic(lang)
      .then((entry) => { if (entry) recordNextTopic(entry); })
      .catch(() => { /* fail-open: downstream falls back to uniform topics */ });
    let href = cta.dataset.fallback || `#/oppimispolku?lang=${lang}`;
    try { href = await resolveNextTaskHref(lang); } catch { /* keep fallback */ }
    location.hash = href.startsWith("#") ? href : `#${href}`;
  });
}

function wireWallPaywall(root) {
  const btn = root.querySelector("[data-open-paywall]");
  if (btn) btn.addEventListener("click", () => openPaywall({ variant: "quota", reason: "daily-goal" }));
}

function wireHoverPrefetch(root, lang) {
  const cta = root.querySelector("[data-next-task]");
  if (cta) {
    onHoverIntent(cta, async () => {
      prefetchChunk("lessonRunner", () => import("./lessonRunner.js"));
      prefetchCurriculumList(lang);
      // Warm the course detail for the course the click will resolve to, so
      // resolveNextTaskHref returns from cache and the tap feels instant.
      try {
        const kurssit = await getCurriculumList(lang);
        const course = (kurssit || []).find((k) => k.isUnlocked && !k.kertausPassed)
          || (kurssit || []).find((k) => k.isUnlocked);
        if (course?.key) prefetchCourseDetail(lang, course.key);
      } catch { /* prefetch is best-effort */ }
    });
  }
}

// Course tier: swap the daily-goal slot for "X / 8 kurssia". Needs the
// curriculum list (not in the dashboard payload), fetched after first paint
// so the rest of the screen never blocks on it.
async function updateKurssiProgress(root, lang) {
  try {
    const kurssit = await getCurriculumList(lang);
    if (!Array.isArray(kurssit) || !kurssit.length) return;
    const block = root.querySelector(".dash-block--goal");
    if (!block) return;
    const total = kurssit.length;
    const done = kurssit.filter((k) => k.kertausPassed).length;
    const allDone = done >= total;
    const current = Math.min(total, done + 1);
    const nextCourse = kurssit.find((k) => !k.kertausPassed);
    block.outerHTML = goalBlockMarkup({
      ring: renderRing(done, total, allDone),
      label: "Kurssietenemä",
      count: allDone ? `Kaikki ${total} kurssia` : `Kurssi ${current} / ${total}`,
      sub: allDone ? "Koko polku suoritettu." : (nextCourse?.title ? `Menossa: ${nextCourse.title}` : "Jatka polkua."),
      met: allDone,
      ariaLabel: "Kurssietenemä",
    });
  } catch { /* keep the interim block */ }
}

export async function loadHome() {
  show("screen-home");
  const root = document.getElementById("home-root");
  if (!root) return;
  const activeLang = readActiveLang();

  const paint = (data) => {
    const tier = getTier(data?.profile?.profile);
    window._isPro = tier !== "free";
    // L-V390: HOME is the post-login landing screen, but syncProfileMenu only
    // ran from the dashboard render path (renderRail). On HOME the profile-menu
    // "Päivitä Pro" item kept its default state, so Pro users saw the upsell.
    // Sync it here where the tier is already known.
    try { window._profileMenuRef?.syncProfileMenu?.({ pro: window._isPro }); } catch { /* noop */ }
    root.innerHTML = renderShell(activeLang, data, tier);
    wireTabs(root);
    wireHoverPrefetch(root, activeLang);
    wireNextTaskHandler(root, activeLang);
    wireWallPaywall(root);
    if (tier === "kurssi") updateKurssiProgress(root, activeLang);
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
