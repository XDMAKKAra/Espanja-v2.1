// ─── Entry point ────────────────────────────────────────────────────────────
// Imports all modules and wires them together

import { API, isLoggedIn, getAuthEmail, authHeader, clearAuth, apiFetch, setShowFn, setLangFn } from "./api.js";
import { state, setLanguage } from "./state.js";
import { $, show } from "./ui/nav.js";
import { applyFeatureFlags } from "./features/flags.js";

// Never let a feature-flag wiring error block the rest of the app from loading.
try { applyFeatureFlags(); } catch (err) { console.error("applyFeatureFlags failed:", err); }

import { initAuth } from "./screens/auth.js";
import { initDashboard, loadDashboard, navigateToMode, saveLastSettings, saveProgress, shareResult } from "./screens/dashboard.js";
import { initVocab, loadNextBatch, startReviewSession } from "./screens/vocab.js";
import { initGrammar, loadGrammarDrill } from "./screens/grammar.js";
import { initReading, loadReadingTask } from "./screens/reading.js";
import { initWriting, showProUpsell, startCheckout, openBillingPortal, loadWritingTask, wireAppWaitlist, hydrateConfig } from "./screens/writing.js";
import { initExam, startMockExam } from "./screens/exam.js";
// F-ARCH-1 §A — fullExam, settings, profile, verbSprint, verbReference moved
// behind makeLazyScreen() so they don't ship with the initial bundle. See
// `js/lib/lazyScreen.js` for the cache + once-init contract.
import { makeLazyScreen } from "./lib/lazyScreen.js";
import { initOnboarding, checkOnboarding } from "./screens/onboarding.js";
import { initOnboardingV4, showOnboardingV4 } from "./screens/onboardingV4.js";
import { initPlacement, checkPlacementNeeded, showPlacementIntro, startPlacementFromRetake } from "./screens/placement.js";
import { initQuickReview } from "./screens/quickReview.js";
// F-ARCH-1 §A — these screens are lazy. Their static imports moved out.
// See makeLazyScreen wrappers below (lazyFullExam, lazySettings, …).
import { wireTopicPicker, topicLabel, loadBriefing } from "./screens/mode-page.js";
import { initErrorMonitoring } from "./analytics.js";
import { initConsentGate } from "./features/consent.js";
// L-PLAN-4 UPDATE 4 — floating profile button (replaces the right rail).
import { initProfileMenu, syncProfileMenu } from "./features/profileMenu.js";
// L-PLAN-5 UPDATE 4 — re-readable teaching page (side-panel desktop / modal mobile).
import { initTeachingPanel } from "./features/teachingPanel.js";
// Paywall modal — wired early so the 403 intercept in api.js can open it.
import { initPaywallModal } from "./features/paywallModal.js";
// v277 SidebarShell controller — owns [data-mode] on .app-sidebar.
import { setSidebarMode } from "./components/sidebarShell.js";

// ─── Inject show into api.js (avoids circular dep) ─────────────────────────
setShowFn(show);

// L-LANG-INFRA-1: inject language getter so apiFetch can append ?lang= to
// AI routes without importing state.js (avoids circular deps at parse time).
setLangFn(() => state.language);

// ─── Loading-shimmer auto-clear ────────────────────────────────────────────
// Strip `.loading-shimmer` from placeholder elements as soon as JS replaces
// their text, so real exercise content doesn't keep pulsing.
(function watchShimmerPlaceholders() {
  if (typeof MutationObserver === "undefined") return;
  const ids = ["question-text", "writing-prompt-text", "gram-sentence", "reading-question-text", "placement-question"];
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      const el = m.target;
      if (!(el instanceof Element)) continue;
      if (el.classList.contains("loading-shimmer")) el.classList.remove("loading-shimmer");
    }
  });
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) obs.observe(el, { childList: true, characterData: true, subtree: true });
  }
})();

// ─── Sidebar + mobile nav ──────────────────────────────────────────────────

function updateSidebarState() {
  const sidebar = $("app-sidebar");
  const mobileNav = $("mobile-nav");
  if (!isLoggedIn()) {
    if (sidebar) sidebar.style.display = "none";
    if (mobileNav) mobileNav.style.display = "none";
    document.querySelector(".app-main").style.marginLeft = "0";
    return;
  }
  if (sidebar) sidebar.style.display = "";
  if (mobileNav) mobileNav.style.display = "";
  document.querySelector(".app-main").style.marginLeft = "";

  const sidebarUser = $("sidebar-user");
  if (sidebarUser) {
    // v248 — Server profile is the source of truth (persists across
    // origins). localStorage is a first-paint cache for cold loads
    // before /api/profile resolves. Order: server profile → cache → email.
    let nick = "";
    const serverNick = (window._userProfile?.nickname || "").trim();
    if (serverNick) {
      nick = serverNick;
      try { localStorage.setItem("puheo:nickname", serverNick); }
      catch { /* private mode */ }
    } else {
      try { nick = (localStorage.getItem("puheo:nickname") || "").trim(); }
      catch { /* private mode */ }
      // If the server explicitly says no nickname, clear the stale cache
      // so the next cold load on a different origin doesn't resurrect it.
      if (window._userProfile && !window._userProfile.nickname) {
        try { localStorage.removeItem("puheo:nickname"); }
        catch { /* private mode */ }
        nick = "";
      }
    }
    sidebarUser.textContent = nick || getAuthEmail() || "";
  }
}

// ─── Mode pages ────────────────────────────────────────────────────────────

function showModePage(mode) {
  const screenId = `screen-mode-${mode}`;
  const screenEl = document.getElementById(screenId);
  if (!screenEl) { navigateToMode(mode); return; }

  // Spec 2 §3.3 — populate the briefing card for this mode.
  loadBriefing(mode);

  if ((mode === "reading" || mode === "writing") && isLoggedIn() && !window._isPro) {
    const note = document.getElementById(`${mode}-pro-note`);
    if (note) note.classList.remove("hidden");
  } else {
    const note = document.getElementById(`${mode}-pro-note`);
    if (note) note.classList.add("hidden");
  }

  show(screenId);
}

// ─── Wire up module dependencies ───────────────────────────────────────────

initAuth({ updateSidebarState, loadDashboard });
initDashboard({ loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, loadNextBatch, showProUpsell });
initVocab({ loadDashboard, shareResult, saveProgress });
initGrammar({ loadDashboard, saveProgress });
initReading({ loadDashboard, saveProgress, showProUpsell });
initWriting({ loadDashboard, saveProgress });
wireAppWaitlist();
if (isLoggedIn()) hydrateConfig();
initExam({ loadDashboard, saveProgress, shareResult });

// v279 — Sentence build (Käännä lauseet). Lazy-loaded on first open from
// the writing mode-page CTA or the #/lauseet hash.
const lazySentenceBuild = makeLazyScreen({
  key: "sentenceBuild",
  factory: () => import("./screens/sentenceBuild.js"),
  init: (m) => m.initSentenceBuild(),
});
document.addEventListener("click", (e) => {
  const cta = e.target.closest('#btn-start-sentence-build, [data-target="sentence-build"]');
  if (!cta) return;
  e.preventDefault();
  lazySentenceBuild().then((m) => m.openSentenceBuild({}));
});

// ── F-ARCH-1 §A — lazy screens (loaded on first navigation) ────────────────
const lazyFullExam = makeLazyScreen({
  key: "fullExam",
  factory: () => import("./screens/fullExam.js"),
  init: (m) => m.initFullExam({ loadDashboard, saveProgress, shareResult }),
});
const lazySettings = makeLazyScreen({
  key: "settings",
  factory: () => import("./screens/settings.js"),
  init: (m) => m.initSettings({ loadDashboard }),
});
const lazyProfile = makeLazyScreen({
  key: "profile",
  factory: () => import("./screens/profile.js"),
  init: (m) => m.initProfile(),
});
// Task 4 (2026-05-19): lazyVerbSprint removed — screen-verbsprint UI and
// verbSprint.js have been deleted. lazyVerbReference remains as a lazy
// loader in case future curriculum lessons link verb-reference cards.
const lazyVerbReference = makeLazyScreen({
  key: "verbReference",
  factory: () => import("./screens/verbReference.js"),
  init: (m) => m.initVerbReference(),
});
initOnboarding({ loadDashboard, loadNextBatch });
initOnboardingV4({ loadDashboard });
window._onboardingV4 = { show: showOnboardingV4 };
// Hash entry: /app.html#/aloitus → V4 (L-V359 diagnostic-first + product choice).
// L-V402 removed the legacy V2/V3 fallback hashes (#/aloitus-v2 / -v3).
// BUGFIX: only trigger onboarding from hash if the user is NOT logged in. For
// logged-in users, the startup `checkOnboarding()` path below is authoritative
// — re-running the onboarding here would leave its screen with the `.active`
// class and bleed through behind the dashboard/path screen.
if (!isLoggedIn()) {
  if (location.hash === "#/aloitus" || location.hash === "#/aloitus-v4") {
    setTimeout(() => showOnboardingV4(), 0);
  }
}
initPlacement({ loadDashboard });
window._onboardingRef = { checkOnboarding };
window._placementRef = { checkPlacementNeeded, showPlacementIntro, startPlacementFromRetake };

// ─── Sidebar navigation clicks + hash routing ──────────────────────────────

const NAV_HASH = {
  // PR auto/home-screen (2026-05-19) — "home" is the new top-level entry
  // above the path. Existing #/koti + #/oppimispolku still route to the
  // path screen for backwards compatibility while PRs 3-4 land the rest
  // of the home → course-overview → path → lesson hierarchy.
  home: "#/aloitus",
  dashboard: "#/koti",
  reading: "#/luetun",
  writing: "#/kirjoitus",
  path: "#/oppimispolku",
  exam: "#/koeharjoitus",
  settings: "#/asetukset",
  profile: "#/oma-sivu",
};
const HASH_NAV = Object.fromEntries(Object.entries(NAV_HASH).map(([k, v]) => [v, k]));

// L-V366 BUG-2 — sanasto/puheoppi mode pages were deleted (Task 4 2026-05-19),
// but curriculum.js + lessonResults.js still stamp #/sanasto / #/puheoppi via
// replaceState at lesson end. On reload those hashes had no router entry and
// fell through (landing on Asetukset). Redirect them to Tehtävät. Returns true
// when it handled (and replaced) the hash so callers can stop.
function redirectLegacyModeHash() {
  if (/^#\/?(sanasto|puheoppi)$/i.test(location.hash)) {
    location.replace("#/oppimispolku");
    return true;
  }
  return false;
}

// L-V366 BUG-3 — the active sidebar/mobile pill must follow the current route,
// not the last click. "Tehtävät" is a plain <a href="#/oppimispolku"> (no
// data-nav, marked data-nav-active="path"), and several routes return early
// before navigateTo() runs, so the pill used to stay stuck on "Koti". Derive
// the active item from the hash on every route change.
function navKeyForHash(hashRaw) {
  const h = (hashRaw || "").split("?")[0].replace(/^#\/?/, "");
  if (h === "asetukset") return "settings";
  if (h === "oma-sivu") return "profile";
  if (h === "" || h === "koti" || /^aloitus(-v[234])?$/.test(h)) return "home";
  if (h === "oppimispolku" || h.startsWith("oppimispolku/") ||
      h.startsWith("kurssi/") || h.startsWith("oppitunti/") || h === "lauseet") return "path";
  // Reading/writing mode pages switch the sidebar to mode-state; no top pill.
  return null;
}

function syncActiveNav(hashRaw = location.hash) {
  const key = navKeyForHash(hashRaw);
  if (key == null) return; // mode pages own their own sidebar state — leave it.
  document.querySelectorAll(".sidebar-item, .mobile-nav-item").forEach((el) => {
    const elKey = el.dataset.nav || el.dataset.navActive || null;
    el.classList.toggle("active", elKey === key);
  });
}

function navigateTo(nav, { updateHash = true } = {}) {
  if (!nav) return;
  // L-MERGE-DASH-PATH — "dashboard" nav redirects to merged home (path).
  // Done first so active-class + hash assignment land on the right target.
  if (nav === "dashboard") nav = "path";

  if (updateHash && NAV_HASH[nav] && location.hash !== NAV_HASH[nav]) {
    history.replaceState(null, "", NAV_HASH[nav]);
  }

  // L-V378 (3rd strike, BUG-2) — the active pill is derived from ONE source of
  // truth, the current route, via syncActiveNav(). The old code toggled the
  // active class straight from the clicked nav and only touched [data-nav]
  // items, so the "Tehtävät" link (data-nav-active="path", no data-nav) was
  // never cleared; replaceState above also doesn't fire `hashchange`, so the
  // listener's syncActiveNav() never ran. Result: Koti + Tehtävät both stuck
  // yellow. Now every navigation — clicks and programmatic replaceState —
  // funnels through syncActiveNav(), which resets ALL pills and sets exactly
  // the one matching the route (handles both data-nav and data-nav-active).
  syncActiveNav();

  // v277: drive .app-sidebar [data-mode]. "home"/"path"/"profile"/"settings"
  // are all HOME-state from the sidebar's POV (no mode shell). vocab/grammar/
  // reading/writing/exam flip to MODE-state with the section title.
  const MODE_LABELS = { vocab: "Sanasto", grammar: "Kielioppi", reading: "Luetun ymmärtäminen", writing: "Kirjoittaminen", exam: "Koeharjoitus" };
  if (MODE_LABELS[nav]) {
    // v278 — paint the sidebar shell synchronously with empty list, then
    // hydrate items[] async so the mode-state header doesn't flicker.
    setSidebarMode("mode", { modeKey: nav, modeLabel: MODE_LABELS[nav], items: [] });
    import("./lib/sidebarItems.js").then(({ buildSidebarItemsForMode }) => {
      return buildSidebarItemsForMode(nav).then((items) => {
        setSidebarMode("mode", { modeKey: nav, modeLabel: MODE_LABELS[nav], items });
      });
    }).catch(() => { /* keep empty state on failure — non-blocking */ });
  } else if (nav === "home" || nav === "path" || nav === "dashboard") {
    setSidebarMode("home");
  }

  if (nav === "exam")          lazyFullExam().then((m) => m.startFullExam("demo"));
  else if (nav === "settings") lazySettings().then((m) => m.showSettings());
  else if (nav === "profile")  lazyProfile().then((m) => m.loadProfile());
  else if (nav === "home")     import("./screens/home.js").then((m) => m.loadHome());
  // PR auto/cleanup-old-screens (2026-05-19): nav=path is legacy.
  // Routing to home keeps users from landing on the deprecated
  // dashboard surface (#screen-path) which mixes greeting + day-CTA +
  // course list — all of that now lives across HOME + oppimispolku +
  // course detail. Path screen HTML stays for compat with any code
  // path that hardcodes loadDashboard, but nav clicks no longer reach
  // it.
  else if (nav === "path")     import("./screens/home.js").then((m) => m.loadHome());
  else if (nav === "verbreference") lazyVerbReference().then(() => showModePage("verbreference"));
  else showModePage(nav);
}

// Map exercise screens → mode page ids, for both the nav-confirm prompt
// and for the x-button exit flow (L-LIVE-AUDIT-P0 UPDATE 4).
const EXERCISE_SCREENS = new Set([
  "screen-exercise",      // vocab
  "screen-grammar",
  "screen-reading",
  "screen-writing",
  "screen-lesson",
]);
// Task 4 (2026-05-19): screen-mode-vocab and screen-mode-grammar entries
// removed — those mode pages were deleted. exitToSource() falls back to
// screen-dashboard when the target mode page is absent, so the X-button on
// screen-exercise / screen-grammar still works during curriculum lessons.
const EXERCISE_TO_MODE_PAGE = {
  "screen-reading": "screen-mode-reading",
  "screen-writing": "screen-mode-writing",
};

// L-PLAN-5 UPDATE 3 + L-LIVE-AUDIT-P0 UPDATE 4 — prompt before dropping an
// active exercise/lesson when the student clicks main-nav. Originally only
// fired when a curriculum lesson context was present; the live audit found
// that a standalone vocab/grammar/reading session would silently swap the
// hash without changing the screen, leaving the student confused. Now the
// prompt fires for *any* exercise screen regardless of lesson context, and
// path → still skips the prompt (natural exit route for lessons).
async function maybeConfirmNavAway(_targetNav) {
  // PR auto/quickfixes (2026-05-19): "Lopetetaanko oppitunti?" confirm
  // dialog removed per user request — lessonProgress already saves in
  // realtime on every advanceItem + phase transition + before nav
  // (see js/screens/lessonRunner.js saveLessonProgress + the resume
  // snapshot logic), so the modal added friction without protecting
  // anything. Clear lesson-context bookkeeping inline and let the
  // nav proceed.
  try {
    const activeScreen = document.querySelector(".screen.active");
    const screenId = activeScreen?.id || "";
    if (!EXERCISE_SCREENS.has(screenId)) return true;
    const { getLessonContext, clearLessonContext } = await import("./lib/lessonContext.js");
    if (getLessonContext()) {
      clearLessonContext();
      try { sessionStorage.removeItem("currentLessonTeachingMd"); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return true;
}

// v278 — sidebar mode-list dispatches puheo:open-lesson; route it to the
// canonical lesson hash so existing hashchange logic handles the rest.
document.addEventListener("puheo:open-lesson", (e) => {
  const { kurssiKey, lessonIndex } = e.detail || {};
  if (!kurssiKey || !Number.isFinite(lessonIndex)) return;
  const lang = (state.language === "de" || state.language === "fr") ? state.language : "es";
  const target = `#/oppitunti/${lang}/${encodeURIComponent(kurssiKey)}/${lessonIndex}/teoria`;
  if (location.hash !== target) location.hash = target;
});

document.querySelectorAll(".sidebar-item[data-nav], .mobile-nav-item[data-nav], .sidebar-user[data-nav]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const ok = await maybeConfirmNavAway(btn.dataset.nav);
    if (ok) navigateTo(btn.dataset.nav);
  });
});

window.addEventListener("hashchange", () => {
  if (!isLoggedIn()) return;
  // L-V366 BUG-2 — fold dead mode hashes onto Tehtävät before anything else.
  if (redirectLegacyModeHash()) return;
  // L-V366 BUG-3 — keep the active pill in sync with the route on every change,
  // including the early-return branches (oppimispolku, course, lesson, lauseet).
  syncActiveNav();
  if (location.hash === "#/lauseet") {
    lazySentenceBuild().then((m) => m.openSentenceBuild({})).catch(() => { /* fall through */ });
    return;
  }
  // PR auto/cleanup-old-screens (2026-05-19): redirect legacy
  // #/kurssi/{lang}/{key} → #/oppimispolku/{lang}/{key}. The
  // courseOverview screen is gone — its 4 mode tiles moved up to
  // HOME, course detail handles the single-course lesson list.
  const legacyCourse = /^#\/kurssi\/([a-z]{2})\/([^/?#]+)/i.exec(location.hash);
  if (legacyCourse) {
    location.replace(`#/oppimispolku/${legacyCourse[1]}/${legacyCourse[2]}`);
    return;
  }
  // PR auto/digikirja-pohjarakenne (2026-05-19): five-segment
  // #/oppitunti/{lang}/{kurssi}/{lesson}/{sivu} drives the new
  // Otava Fokus 7 three-panel screen. Checked BEFORE the four-segment
  // legacy lesson route so the more specific pattern wins.
  const digikirjaMatch = /^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(location.hash);
  if (digikirjaMatch) {
    import("./screens/digikirja.js")
      .then((m) => m.tryRouteDigikirja?.(location.hash))
      .catch(() => { /* fall through */ });
    return;
  }
  // PR auto/digikirja-pr8 (2026-05-19): the legacy four-segment route
  // #/oppitunti/{lang}/{kurssi}/{n} now redirects to the new five-segment
  // digikirja with /teoria appended. Replace the URL in place so the
  // hashchange listener picks the more specific matcher above.
  const legacyLesson = /^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\s*$/i.exec(location.hash);
  if (legacyLesson) {
    location.replace(`#/oppitunti/${legacyLesson[1]}/${legacyLesson[2]}/${legacyLesson[3]}/teoria`);
    return;
  }
  // PR auto/course-detail-shelf: per-course detail route BEFORE the
  // bare index check so the more-specific pattern wins.
  if (/^#\/oppimispolku\/[a-z]{2}\//i.test(location.hash)) {
    import("./screens/courseDetail.js")
      .then((m) => m.tryRouteCourseDetail?.(location.hash))
      .catch(() => { /* fall through */ });
    return;
  }
  // Index — bare #/oppimispolku or #/oppimispolku?lang=X
  if (/^#\/oppimispolku(\?|$)/.test(location.hash)) {
    import("./screens/oppimispolkuIndex.js")
      .then((m) => m.tryRouteOppimispolkuIndex?.(location.hash))
      .catch(() => { /* fall through to legacy nav */ });
    return;
  }
  const hashRaw = location.hash || "";
  const hashBase = hashRaw.split("?")[0];
  const nav = HASH_NAV[hashBase];
  if (nav) navigateTo(nav, { updateHash: false });
});

// On boot, restore screen from hash (only if logged in — auth flow handles otherwise).
window._restoreFromHash = function restoreFromHash() {
  if (!isLoggedIn()) return false;
  // L-V366 BUG-2 — redirect dead mode hashes on cold load too (handled async
  // via the hashchange the replace fires; treat as handled so boot doesn't
  // also paint HOME on top).
  if (redirectLegacyModeHash()) return true;
  // L-V366 BUG-3 — set the active pill from the boot hash (direct deep links).
  syncActiveNav();
  if (location.hash === "#/lauseet") {
    lazySentenceBuild().then((m) => m.openSentenceBuild({})).catch(() => { /* ignore */ });
    return true;
  }
  const legacyCourse = /^#\/kurssi\/([a-z]{2})\/([^/?#]+)/i.exec(location.hash);
  if (legacyCourse) {
    location.replace(`#/oppimispolku/${legacyCourse[1]}/${legacyCourse[2]}`);
    return true;
  }
  const digikirjaBoot = /^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(location.hash);
  if (digikirjaBoot) {
    import("./screens/digikirja.js")
      .then((m) => m.tryRouteDigikirja?.(location.hash))
      .catch(() => { /* fall through */ });
    return true;
  }
  const legacyLessonBoot = /^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\s*$/i.exec(location.hash);
  if (legacyLessonBoot) {
    location.replace(`#/oppitunti/${legacyLessonBoot[1]}/${legacyLessonBoot[2]}/${legacyLessonBoot[3]}/teoria`);
    return true;
  }
  if (/^#\/oppimispolku\/[a-z]{2}\//i.test(location.hash)) {
    import("./screens/courseDetail.js")
      .then((m) => m.tryRouteCourseDetail?.(location.hash))
      .catch(() => { /* fall through */ });
    return true;
  }
  if (/^#\/oppimispolku(\?|$)/.test(location.hash)) {
    import("./screens/oppimispolkuIndex.js")
      .then((m) => m.tryRouteOppimispolkuIndex?.(location.hash))
      .catch(() => { /* fall through to legacy nav */ });
    return true;
  }
  const hashRaw = location.hash || "";
  const hashBase = hashRaw.split("?")[0];
  const nav = HASH_NAV[hashBase];
  if (!nav) return false;
  navigateTo(nav, { updateHash: false });
  return true;
};

// ─── Topic card clicks (all mode pages) ────────────────────────────────────

// Spec 2 §3.4 — wire the new .mode-topics radio-group rows.
document.querySelectorAll(".mode-topics").forEach((container) => {
  const modePage = container.closest(".mode-page");
  const ctaEl = modePage?.querySelector(".btn--cta");
  wireTopicPicker(container, {
    ctaEl,
    ctaMetaTemplate: (id) => {
      const label = topicLabel(id).toUpperCase();
      const tmpl = ctaEl?.dataset.ctaMeta || "{TOPIC}";
      return tmpl.replace("{TOPIC}", label);
    },
  });
});

// Pass 0.6: manual taso-picker listeners removed. Level now comes from
// GET /api/user-level — the adaptive engine owns it, not a DOM click.

// Task 4 (2026-05-19): MODE_LEVEL_DEFAULTS, fetchUserLevel, and
// showLevelForMode removed — they only fed the btn-start-vocab handler
// which is gone. The user-level endpoint is still called by
// dashboard.js for the home greeting; this dedup is local.

// ─── Start buttons on mode pages ───────────────────────────────────────────

// Task 4 (2026-05-19): btn-start-vocab + btn-start-grammar handlers removed
// — their host mode pages were deleted. startGrammarDrill is retained as a
// function because initQuickReview still receives it as a dep (the kertaus
// drill in #screen-quickreview launches a grammar batch). loadNextBatch
// and loadGrammarDrill stay exported from their modules and are called
// from curriculum.js / dashboard.js / onboarding for lesson exercises.
async function startGrammarDrill() {
  state.mode = "grammar";
  state.grammarTopic = "mixed";
  state.grammarLevel = "C";
  state.sessionStartTime = Date.now();
  loadGrammarDrill();
}

initQuickReview({ startGrammarDrill });
// F-ARCH-1 §A — initVerbSprint / initVerbReference / initSettings / initProfile
// moved into makeLazyScreen wrappers; they self-init on first navigation.
// Profile menu wires globally — its DOM is mounted once in app.html and
// survives screen changes. Pass the deps it needs to drive checkout + sidebar.
initProfileMenu({ startCheckout, updateSidebarState });
window._profileMenuRef = { syncProfileMenu };
// Teaching panel — mounted once at boot, syncs visibility with screen + lesson.
initTeachingPanel();
// Paywall modal — wired once at boot so the backdrop/close buttons work.
initPaywallModal();

if ($("btn-start-reading")) $("btn-start-reading").addEventListener("click", async () => {
  state.mode = "reading";
  state.readingTopic = document.querySelector('#screen-mode-reading .mode-topic[aria-checked="true"]')?.dataset.topic || "animals and nature";
  state.readingLevel = "C";
  state.sessionStartTime = Date.now();
  loadReadingTask();
});

if ($("btn-start-writing")) $("btn-start-writing").addEventListener("click", () => {
  state.mode = "writing";
  state.writingTaskType = document.querySelector('#writing-type-cards .mode-topic[aria-checked="true"]')?.dataset.type || "short";
  state.writingTopic = document.querySelector('#writing-topic-cards .mode-topic[aria-checked="true"]')?.dataset.topic || "general";
  state.sessionStartTime = Date.now();
  loadWritingTask();
});

// Spec 2 §4.1 + L-LIVE-AUDIT-P0 UPDATE 4 — drill exit returns to the mode
// page the student came from (Sanasto / Puheoppi / Luetun / Kirjoittaminen),
// not silently to the dashboard. If the session is a curriculum lesson
// (lessonContext active), the natural exit is the dashboard so the lesson
// state isn't dangling on a mode page that doesn't know about it.
async function exitToSource(fallbackMode) {
  // L-V400 — lesson/fallback exit returns to the home screen (#screen-home,
  // owned by home.js). Was show("screen-dashboard"); that ghost screen was
  // removed, and home is the real "return home" surface.
  try {
    const { getLessonContext } = await import("./lib/lessonContext.js");
    if (getLessonContext()) { show("screen-home"); return; }
  } catch { /* fall through to mode page */ }
  const target = `screen-mode-${state.mode || fallbackMode}`;
  if (document.getElementById(target)) {
    navigateTo(state.mode || fallbackMode);
  } else {
    show("screen-home");
  }
}

const btnExitExercise = $("btn-exit-exercise");
if (btnExitExercise) btnExitExercise.addEventListener("click", () => exitToSource("vocab"));
const btnExitGram = $("btn-exit-gram");
if (btnExitGram) btnExitGram.addEventListener("click", () => exitToSource("grammar"));
const btnExitReading = $("btn-exit-reading");
if (btnExitReading) btnExitReading.addEventListener("click", () => exitToSource("reading"));
const btnExitReadingText = $("btn-exit-reading-text");
if (btnExitReadingText) btnExitReadingText.addEventListener("click", () => exitToSource("reading"));

// Pro upgrade buttons on mode pages
if ($("reading-upgrade-btn")) $("reading-upgrade-btn").addEventListener("click", () => startCheckout());
if ($("writing-upgrade-btn")) $("writing-upgrade-btn").addEventListener("click", () => startCheckout());

// Full exam start button
const fullExamBtn = $("btn-start-full-exam");
if (fullExamBtn) {
  fullExamBtn.addEventListener("click", () => lazyFullExam().then((m) => m.startFullExam("demo")));
}

// SR review buttons (legacy + new top bar)
const reviewBtn = $("btn-start-review");
if (reviewBtn) reviewBtn.addEventListener("click", () => startReviewSession());
const topBarBtn = $("sr-top-btn");
if (topBarBtn) topBarBtn.addEventListener("click", () => startReviewSession());

// Sidebar logout
const sidebarLogout = $("sidebar-logout");
if (sidebarLogout) {
  sidebarLogout.addEventListener("click", () => {
    clearAuth();
    updateSidebarState();
    show("screen-auth");
  });
}

// ─── Password reset flow ───────────────────────────────────────────────────

const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get("reset_token");
const checkoutStatus = urlParams.get("checkout");
const verifyToken = urlParams.get("verify_token");

if (resetToken) {
  window.history.replaceState({}, "", window.location.pathname);
  show("screen-reset-password");
} else if (verifyToken) {
  window.history.replaceState({}, "", window.location.pathname);
  fetch(`${API}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: verifyToken }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.ok) {
        localStorage.setItem("puheo_email_verified", "true");
        alert("Sähköpostisi on vahvistettu!");
      } else {
        alert(d.error || "Vahvistus epäonnistui");
      }
    })
    .catch(() => alert("Yhteysvirhe"));
} else if (checkoutStatus === "success") {
  window.history.replaceState({}, "", window.location.pathname);
}

$("btn-reset-submit").addEventListener("click", async () => {
  const pw = $("reset-new-password").value;
  const pw2 = $("reset-confirm-password").value;
  const errEl = $("reset-error");
  const okEl = $("reset-success");
  errEl.classList.add("hidden");
  okEl.classList.add("hidden");

  if (!pw || pw.length < 8) {
    errEl.textContent = "Salasanan tulee olla vähintään 8 merkkiä (iso + pieni kirjain + numero)";
    errEl.classList.remove("hidden");
    return;
  }
  if (pw !== pw2) {
    errEl.textContent = "Salasanat eivät täsmää";
    errEl.classList.remove("hidden");
    return;
  }

  $("btn-reset-submit").disabled = true;
  $("btn-reset-submit").textContent = "Vaihdetaan...";

  try {
    const res = await fetch(`${API}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword: pw }),
    });
    const data = await res.json();
    if (res.ok) {
      okEl.textContent = "Salasana vaihdettu! Voit nyt kirjautua sisään.";
      okEl.classList.remove("hidden");
      setTimeout(() => show("screen-auth"), 2000);
    } else {
      errEl.textContent = data.error || "Jokin meni pieleen";
      errEl.classList.remove("hidden");
    }
  } catch {
    errEl.textContent = "Ei yhteyttä palvelimeen";
    errEl.classList.remove("hidden");
  } finally {
    $("btn-reset-submit").disabled = false;
    $("btn-reset-submit").textContent = "Vaihda salasana →";
  }
});

// ─── Pro upsell buttons ────────────────────────────────────────────────────

$("btn-upgrade-pro").addEventListener("click", () => startCheckout());
$("btn-upsell-back").addEventListener("click", () => show("screen-start"));

// ─── Mode picker (old start screen) ───────────────────────────────────────

// 3D tilt + cursor-tracked glare (sourced: Aceternity 3d-card-effect +
// Magic UI magic-card). Only attaches on fine-pointer devices that don't
// have prefers-reduced-motion set; the helper is a no-op otherwise.
import("./features/cardTilt.js").then((m) => {
  m.enableCardTilt(".mode-picker .mode-btn:not(.mode-locked)");
}).catch(() => { /* tilt is non-critical decoration */ });

// Global shadcn-style tooltip (sourced: shadcn/ui Tooltip — Radix primitive).
// Targets any element with `data-tooltip="..."` and replaces native title=
// for the duration of the hover. Idempotent.
import("./features/tooltip.js").then((m) => m.installTooltip()).catch(() => {});

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.mode = btn.dataset.mode;
    ["vocab-config", "grammar-config", "reading-config", "writing-config"].forEach((id) =>
      $(id).classList.add("hidden")
    );
    if (state.mode === "vocab")    $("vocab-config").classList.remove("hidden");
    if (state.mode === "grammar")  $("grammar-config").classList.remove("hidden");
    if (state.mode === "reading")  $("reading-config").classList.remove("hidden");
    if (state.mode === "writing")  $("writing-config").classList.remove("hidden");
  });
});

// L-LANG-INFRA-1: language is now set from profile.target_language after login.
// Default remains "es" (set in state.js). The old hardcoded assignment is removed.

// Pass 0.6: legacy #level-picker / #grammar-level-picker / #reading-level-picker
// listeners removed. The pickers no longer exist; state.level et al. are now
// set from /api/user-level in the start-button handlers above.

// Task type picker (writing mode)
document.querySelectorAll(".task-type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".task-type-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.writingTaskType = btn.dataset.type;
  });
});

// ─── Keyboard shortcuts ────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (typeof e.key !== "string") return;    // synthetic events (IME, autofill) have no .key

  const key = e.key.toUpperCase();
  const numToLetter = { "1": "A", "2": "B", "3": "C", "4": "D" };
  const resolvedKey = numToLetter[e.key] || key;

  // Vocab exercise screen
  if ($("screen-exercise").classList.contains("active")) {
    if (["A", "B", "C", "D"].includes(resolvedKey)) {
      const btn = [...document.querySelectorAll("#options-grid .ex-option:not(:disabled)")]
        .find((b) => b.querySelector(".ex-option__l")?.textContent.toUpperCase() === resolvedKey);
      if (btn) btn.click();
    } else if ((e.key === "Enter" || e.key === " ") &&
               !$("explanation-block").classList.contains("hidden")) {
      e.preventDefault();
      $("btn-next").click();
    }
    return;
  }

  // Grammar screen
  if ($("screen-grammar").classList.contains("active")) {
    if (["A", "B", "C", "D"].includes(resolvedKey)) {
      const btn = [...document.querySelectorAll("#gram-options-grid .ex-option:not(:disabled)")]
        .find((b) => b.querySelector(".ex-option__l")?.textContent.toUpperCase() === resolvedKey);
      if (btn) btn.click();
    } else if ((e.key === "Enter" || e.key === " ") &&
               !$("gram-explanation-block").classList.contains("hidden")) {
      e.preventDefault();
      $("gram-btn-next").click();
    }
    return;
  }

  // Reading screen
  if ($("screen-reading").classList.contains("active")) {
    if (!$("reading-tf-container").classList.contains("hidden")) {
      if (key === "T" || key === "Y") { const b = $("tf-true"); if (!b.disabled) b.click(); }
      if (key === "F" || key === "N") { const b = $("tf-false"); if (!b.disabled) b.click(); }
    } else if ((e.key === "Enter" || e.key === " ") &&
               !$("reading-explanation-block").classList.contains("hidden")) {
      const nextBtn = $("reading-btn-next");
      if (nextBtn.style.display !== "none") { e.preventDefault(); nextBtn.click(); }
    }
    return;
  }


  // Level transition screen
  if ($("screen-level").classList.contains("active") &&
      (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    $("btn-continue").click();
  }
});

// ─── Start button (old start screen) ───────────────────────────────────────

$("btn-start").addEventListener("click", async () => {
  saveLastSettings();
  state.sessionStartTime = Date.now();

  if (state.mode === "vocab") {
    state.topic = $("topic-select").value;
    state.startLevel = state.level;
    state.peakLevel = state.level;
    state.batchNumber = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
    state.sessionItems = [];
    await loadNextBatch();
  } else if (state.mode === "grammar") {
    state.grammarTopic = $("grammar-topic-select").value;
    await loadGrammarDrill();
  } else if (state.mode === "reading") {
    state.readingTopic = $("reading-topic-select").value;
    await loadReadingTask();
  } else if (state.mode === "exam") {
    await startMockExam();
  } else {
    state.writingTopic = $("writing-topic-select").value;
    await loadWritingTask();
  }
});

// L-V401 — removed dead #screen-dashboard nav wiring (btn-dash-start /
// btn-retake-placement). Those ids no longer exist in the DOM (legacy
// dashboard ghost deleted in L-V400), so the handlers were no-ops.
// loadLastSettings stays alive via dashboard.js; startPlacementFromRetake via
// window._placementRef (settings.js).
// btn-back-to-dash IS live: navigateToMode() shows it for vocab/grammar/exam
// (no #screen-mode-* page → screen-start fallback), so keep this handler.
const btnBackToDash = $("btn-back-to-dash");
if (btnBackToDash) btnBackToDash.addEventListener("click", () => loadDashboard());

// ─── Report exercise ───────────────────────────────────────────────────────

async function reportExercise(bankId, btn) {
  if (!bankId) return;
  btn.disabled = true;
  btn.textContent = "Lähetetään...";
  try {
    const res = await fetch(`${API}/api/report-exercise`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ bankId }),
    });
    if (res.ok) {
      btn.textContent = "✓ Raportoitu";
    } else {
      btn.textContent = "Virhe";
    }
  } catch {
    btn.textContent = "Virhe";
  }
}

$("btn-report-vocab").addEventListener("click", (e) => reportExercise(state.bankId, e.target));
$("btn-report-gram").addEventListener("click", (e) => reportExercise(state.grammarBankId, e.target));
$("btn-report-reading").addEventListener("click", (e) => reportExercise(state.readingBankId, e.target));

// ─── Push notifications (Pro users, Chrome/Firefox) ────────────────────────

async function initPushNotifications() {
  if (!isLoggedIn() || !("PushManager" in window) || !("serviceWorker" in navigator)) return;

  try {
    // Fetch VAPID key
    const res = await fetch(`${API}/api/push/vapid-key`);
    const { key } = await res.json();
    if (!key) return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return; // Already subscribed

    // Only ask Pro users (check window._isPro set by dashboard)
    // Delay asking until dashboard has loaded
    setTimeout(async () => {
      if (!window._isPro) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const subscription = await reg.pushManager.subscribe({
        userVisuallyOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      await apiFetch(`${API}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ subscription }),
      });
    }, 5000);
  } catch { /* silent */ }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// ─── L-LANG-INFRA-1: language routing helpers ──────────────────────────────

// Hydrate state.language from a profile object. Called after login/profile-load.
function hydrateLanguage(profile) {
  if (!profile) return;
  const lang = profile.target_language;
  if (lang) setLanguage(lang);
}

// Returns true if the user should be routed to the coming-soon screen.
function needsComingSoon() {
  return isLoggedIn() && state.language !== "es";
}

// Route to coming-soon or let normal flow proceed. Returns true if rerouted.
function maybeRouteComingSoon() {
  if (needsComingSoon()) {
    import("./screens/comingSoon.js")
      .then((m) => m.showComingSoon())
      .catch(() => show("screen-coming-soon"));
    return true;
  }
  return false;
}

// ─── Startup ───────────────────────────────────────────────────────────────

updateSidebarState();
if (!resetToken && isLoggedIn()) {
  // Check onboarding first, then placement, then dashboard
  checkOnboarding().then(async (needsOnboarding) => {
    if (needsOnboarding) return; // onboarding screen shown
    // v248 — profile is now loaded into window._userProfile; refresh
    // sidebar so the server-side nickname overrides any stale cache
    // (or absence of cache on a fresh origin like prod after localhost).
    updateSidebarState();
    // Check if placement test is needed.
    // L-V398 P0 — the V4 diagnostic-first onboarding replaced the legacy
    // placement test. A user who finished onboarding (onboarding_completed=true)
    // already did the V4 kartoitus, which persists user_onboarding_diagnostic —
    // NOT the diagnostic_results row /api/placement/status checks. Without this
    // guard the placement test would re-trigger on every load for V4 users (a
    // second re-trigger vector, unmasked now that the onboarding gate no longer
    // always fires). Legacy users with onboarding_completed=true already have a
    // diagnostic_results row, so checkPlacementNeeded returns false for them
    // anyway — this guard is a no-op there and never hides a needed placement.
    const alreadyOnboarded = window._userProfile?.onboarding_completed === true;
    const needsPlacement = alreadyOnboarded ? false : await checkPlacementNeeded();
    if (needsPlacement) {
      showPlacementIntro();
      return;
    }
    // PR auto/silence-ci-and-strip-sidebar (2026-05-19): default boot
    // lands on HOME instead of the path (dashboard). Hash-restore wins
    // when present, so deep links to #/oppimispolku / #/oppitunti etc.
    // still work as expected.
    if (!window._restoreFromHash || !window._restoreFromHash()) {
      import("./screens/home.js").then((m) => m.loadHome?.()).catch(() => loadDashboard());
    }
  });
  initPushNotifications();
  // Error monitoring (legitimate interest) runs immediately; analytics waits
  // for consent via the banner / stored choice.
  initErrorMonitoring();
  initConsentGate();
}

// Expose for use by screens that load the profile (auth.js, settings.js, etc.)
window._langRef = { hydrateLanguage, maybeRouteComingSoon };

// Handle manifest shortcut hashes (legacy bare names — translate to new hash form)
const legacyHash = window.location.hash.slice(1);
const LEGACY_MAP = { vocab: "#/sanasto", grammar: "#/puheoppi", reading: "#/luetun", writing: "#/kirjoitus" };
if (LEGACY_MAP[legacyHash]) {
  history.replaceState(null, "", LEGACY_MAP[legacyHash]);
}
