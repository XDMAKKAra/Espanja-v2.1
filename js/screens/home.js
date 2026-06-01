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

// Single inline next-action. Greeting is integrated into the headline so
// "Hei!" never floats alone, and the call sits in flowing text instead of
// in a container card. One brick CTA, marked data-cta-primary so the
// anti-slop spec can lock the count to exactly one.
function renderNext(dashboard, profile, lang) {
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
    <section class="home-next" aria-label="Seuraava askel">
      <h1 class="home-next__title">${title}</h1>
      <p class="home-next__meta">${escapeHtml(meta)}</p>
      <a class="home-next__cta"
         data-cta-primary="true"
         href="${ctaHref}"
         data-action="continue">
        ${escapeHtml(ctaLabel)}
        <span class="home-next__cta-arrow" aria-hidden="true">→</span>
      </a>
    </section>`;
}

// Pulse = streak chip + today's minutes, in one sentence. Hidden entirely
// when both signals are zero, so a fresh tab never sees the placeholder
// "0 / 30 min" empty bar that the v271 dashboard shipped.
function renderPulse(data) {
  const dashboard = data?.dashboard || {};
  const profile = data?.profile?.profile || window._userProfile || {};
  const streak = Number(dashboard.streak ?? 0);
  const goalMin = Number(profile.preferred_session_length || DEFAULT_GOAL_MIN);

  const today = new Date().toISOString().slice(0, 10);
  const chartData = Array.isArray(dashboard.chartData) ? dashboard.chartData : [];
  const todaySessions = chartData.filter((l) => l?.createdAt?.slice(0, 10) === today).length;
  const todayMin = Math.min(goalMin, todaySessions * 3);

  if (streak < 1 && todayMin <= 0) return "";

  const parts = [];
  if (streak >= 1) {
    parts.push(`<strong class="home-pulse__num">${streak}</strong> päivän putki`);
  }
  if (todayMin > 0) {
    parts.push(`tänään <strong class="home-pulse__num">${todayMin}</strong> / ${goalMin} min`);
  }

  const goalMet = todayMin >= goalMin;
  return `
    <section class="home-pulse ${goalMet ? "is-met" : ""}" aria-label="Päivän eteneminen">
      <p class="home-pulse__line">${parts.join(", ")}.</p>
    </section>`;
}

// L-V335: koti = tervehdys + Avaa oppimispolku -CTA + viimeisin kurssi
// (renderNext) + päivän putki kun dataa on (renderPulse). Vanha
// kategoriarivi-lohko (Sanasto / Kielioppi / Luetun / Kirjoitus /
// Koeharjoitus) poistettu: rivit lupasivat "N harjoitusta" mutta
// jokainen klikkaus vei samaan oppimispolkuun. Mode-first-hierarkiassa
// koti ei ole kategoriaselain, oppimispolku on.
function renderShell(activeLang, data, isPro) {
  const dashboard = data?.dashboard || {};
  const profile = data?.profile?.profile || window._userProfile || null;
  const tabsHtml = renderTabs(activeLang);
  return `
    ${tabsHtml ? `<div class="home-tabs" role="tablist" aria-label="Kielet">${tabsHtml}</div>` : ""}
    ${renderNext(dashboard, profile, activeLang)}
    ${renderPulse(data)}
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
      <section class="home-next home-next--skel" aria-hidden="true">
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
