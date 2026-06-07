import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, clearAuth, authHeader, apiFetch, setDashboardV2, fetchDashboardV2 } from "../api.js";
import { state, setLanguage } from "../state.js";
import { showLoading } from "../ui/loading.js";
import { icon, MODE_ICONS } from "../ui/icons.js";
import { hideAppCountdown } from "./onboarding.js";
import { markModeCompletedToday } from "../features/dailyChallenge.js";

let _deps = {};
export function initDashboard({ loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, loadNextBatch, showProUpsell }) {
  _deps = { loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, loadNextBatch, showProUpsell };
}

// Free-mode cards on the dashboard. Sanasto, kielioppi and verbisprintti
// were removed (PR moving Puheo to writing-first positioning): those
// renderers stay in the codebase because the kurssipolku lessonRunner
// still uses them inline, but they're no longer surfaced as standalone
// dashboard cards. Reading and writing remain because both map directly
// to YO-koe sections.
export const MODE_META = {
  writing: { icon: MODE_ICONS.writing, name: "Kirjoittaminen" },
  reading: { icon: MODE_ICONS.reading, name: "Luetun ymmärtäminen" },
};

// Memory cache for the dashboard/v2 payload. Returning to the path
// screen during a session re-renders from cache while a fresh fetch
// runs in the background — eliminates the click-to-content delay that
// made the sidebar feel sluggish. TTL keeps stats reasonably current.
let _dashboardCache = null;        // { payload, ts }
const DASHBOARD_CACHE_TTL_MS = 60_000;
let _curriculumKickedAt = 0;
const CURRICULUM_DEDUPE_MS = 1500;
// Render dedupe — when the cache-hit render and the post-fetch render fire
// within DASHBOARD_DEDUPE_MS and produce the same payload, skip the second
// renderDashboard call. The earlier curriculum-only dedupe (PR #92) didn't
// cover this, leaving a visible flash where the post-fetch render removes
// the `.dash-greeting--in` class and the hero blanks for one frame before
// the RAF-RAF restore fires.
let _lastRenderAt = 0;
let _lastRenderHash = "";
const DASHBOARD_DEDUPE_MS = 1500;
function payloadHash(payload) {
  if (!payload) return "";
  try {
    const s = JSON.stringify(payload);
    return `${s.length}:${s.slice(0, 64)}`;
  } catch {
    return "";
  }
}

export async function loadDashboard() {
  // PR auto/kill-screen-path (2026-05-19): loadDashboard previously
  // showed the legacy #screen-path which still ships its own
  // hard-coded "Aloita päivän treeni" placeholder day-CTA and the
  // path-toc stuck on "Ladataan…". Every call from auth/settings/
  // exam/vocab/grammar/writing/adaptive that uses loadDashboard as
  // a generic "return home" callback was landing users on that
  // broken surface. Redirect to the new HOME screen instead. The
  // rest of this function still runs (background data refresh +
  // profile hydration); only the visible host is now #screen-home.
  try {
    const m = await import("./home.js");
    await m.loadHome?.();
  } catch {
    show("screen-home");
  }
  hideAppCountdown();
  const cacheValid = _dashboardCache && (Date.now() - _dashboardCache.ts) < DASHBOARD_CACHE_TTL_MS;
  if (cacheValid) {
    try {
      renderSidebarProBadge(_dashboardCache.payload.pro, _dashboardCache.payload.tier);
      _lastRenderAt = Date.now();
      _lastRenderHash = payloadHash(_dashboardCache.payload);
    } catch { /* fall through to fresh fetch */ }
    // PR auto/asetukset-profile-race-fix (2026-05-19): the legacy curriculum
    // kick rendered into #screen-path (now display:none) and its internal
    // show("screen-path") yanked focus away from any screen the user opened
    // while the deferred fetch was still in flight — clicking Asetukset or
    // sidebar-user during the first few seconds after login dropped them on
    // a blank page. HOME owns its own course list now, so the kick is dead
    // work; remove it.
    _curriculumKickedAt = Date.now();
  }
  // PR auto/asetukset-profile-race-fix (2026-05-19): the cache-miss branch
  // used to fire showLoading("Ladataan…") which yanked focus from the
  // freshly painted #screen-home (loadHome already shows its own inline
  // "Ladataan…" skeleton). The user landed on the full-screen loading
  // surface and never came back unless a later render switched screens.
  // Drop it; home.js owns the in-place loading state now.

  try {
    // L-RENDER-PERF-1 (2026-05-22): use shared fetchDashboardV2 from api.js.
    // loadHome already kicked off the same fetch upstream; this resolves to
    // the cached payload or awaits the in-flight promise — no second network
    // roundtrip. Without the coalesce, login fired /api/dashboard/v2 twice
    // sequentially and added ~5-7s to first paint on cold instances.
    let v2;
    try {
      v2 = await fetchDashboardV2();
    } catch {
      v2 = null;
    }
    let dashboardCore;
    if (v2) {
      setDashboardV2(v2);
      dashboardCore = v2.dashboard;
      if (v2.profile?.profile && !window._userProfile) {
        window._userProfile = v2.profile.profile;
      }
      if (v2.profile?.profile?.target_language) {
        setLanguage(v2.profile.profile.target_language);
      }
    }
    // Fallback to legacy single endpoint if v2 unavailable / not yet deployed.
    if (!dashboardCore) {
      setDashboardV2(null);
      const legacy = await apiFetch(`${API}/api/dashboard`, { headers: authHeader() });
      if (legacy.status === 401) { clearAuth(); show("screen-auth"); return; }
      dashboardCore = await legacy.json();
    }
    // L-LANG-INFRA-1: if user has a non-ES language, show coming-soon instead.
    if (state.language !== "es") {
      import("./comingSoon.js")
        .then((m) => m.showComingSoon())
        .catch(() => show("screen-coming-soon"));
      return;
    }
    _dashboardCache = { payload: dashboardCore, ts: Date.now() };
    // Render dedupe — if the cache-hit render fired within
    // DASHBOARD_DEDUPE_MS AND the payload is unchanged, skip the second
    // renderDashboard. Otherwise we'd remove `.dash-greeting--in`,
    // blank the hero for one frame, then re-add it (the visible flicker
    // the user flagged).
    const freshHash = payloadHash(dashboardCore);
    const sameAsRecent = freshHash && freshHash === _lastRenderHash &&
      (Date.now() - _lastRenderAt) < DASHBOARD_DEDUPE_MS;
    if (!sameAsRecent) {
      renderSidebarProBadge(dashboardCore.pro, dashboardCore.tier);
      _lastRenderAt = Date.now();
      _lastRenderHash = freshHash;
    }
    // PR auto/asetukset-profile-race-fix (2026-05-19): see note above —
    // the background curriculum kick yanked focus from any screen the user
    // opened during the first few seconds after login. Removed.
    _curriculumKickedAt = Date.now();
  } catch {
    if (!cacheValid) show("screen-start");
  }
}

// L-PLAN-3, daily AI tutor greeting card. Fetched once per session; the
// server caches the AI generation per user for 24h.

// ─── Free-tier quota chip ────────────────────────────────────────────────────

// L-V400 — extracted from renderDashboard. The sidebar Pro/KURSSI/TREENI badge
// is the ONLY live render that function produced; everything else wrote into the
// removed #screen-path / #screen-dashboard ghost screens. loadDashboard calls
// this directly now, so renderDashboard + its dead helper cluster can be removed.
function renderSidebarProBadge(pro, tier) {
  const proSlot = document.getElementById("sidebar-pro-slot");
  if (!proSlot) return;
  if (pro) {
    const badgeText = tier === "mestari" ? "KURSSI"
                    : tier === "treeni"  ? "TREENI"
                    : "PRO";
    proSlot.innerHTML = `<span class="sidebar-pro-badge sidebar-pro-badge--${tier || 'pro'}">${badgeText}</span> <button class="btn-manage-sub" id="btn-manage-sub">Hallinnoi tilausta</button>`;
    setTimeout(() => {
      const manageBtn = document.getElementById("btn-manage-sub");
      if (manageBtn) manageBtn.addEventListener("click", () => _deps.openBillingPortal());
    }, 0);
  } else {
    proSlot.innerHTML = `<button class="btn-upgrade-small" id="btn-dash-upgrade">Päivitä Pro</button>`;
    setTimeout(() => {
      const upgradeBtn = document.getElementById("btn-dash-upgrade");
      if (upgradeBtn) upgradeBtn.addEventListener("click", () => _deps.startCheckout());
    }, 0);
  }
}









export function navigateToMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === mode)
  );
  ["vocab-config", "grammar-config", "reading-config", "writing-config"].forEach((id) =>
    $(id).classList.add("hidden")
  );
  if (mode === "vocab") $("vocab-config").classList.remove("hidden");
  else if (mode === "grammar") $("grammar-config").classList.remove("hidden");
  else if (mode === "reading") $("reading-config").classList.remove("hidden");
  else if (mode === "writing") $("writing-config").classList.remove("hidden");
  $("btn-back-to-dash").classList.remove("hidden");

  loadLastSettings(mode);
  show("screen-start");
}

export function saveLastSettings() {
  try {
    localStorage.setItem("puheo_settings", JSON.stringify({
      mode: state.mode,
      level: state.level,
      topic: $("topic-select").value,
      grammarLevel: state.grammarLevel,
      grammarTopic: $("grammar-topic-select").value,
      readingLevel: state.readingLevel,
      readingTopic: $("reading-topic-select").value,
      writingType: state.writingTaskType,
      writingTopic: $("writing-topic-select").value,
    }));
  } catch {}
}

export function loadLastSettings(forcedMode) {
  try {
    if (forcedMode) {
      state.mode = forcedMode;
      document.querySelectorAll(".mode-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.mode === forcedMode)
      );
    }

    const p = JSON.parse(localStorage.getItem("puheo_settings") || "null");

    // Pass 0.6: level is no longer driven by saved picker state. state.level
    // et al. get set from /api/user-level in the start-button handlers in
    // js/main.js. Keep the rest of the saved-settings restore (topic
    // selects, writing type) since those are real user choices.
    const sugLevel = window._dashSuggestedLevel;
    const savedLevel = p?.level;
    state.level = savedLevel || sugLevel || "B";

    if (!p) return;

    if (p.topic) $("topic-select").value = p.topic;
    if (p.grammarTopic) $("grammar-topic-select").value = p.grammarTopic;
    if (p.readingTopic) $("reading-topic-select").value = p.readingTopic;
    if (p.writingTopic) $("writing-topic-select").value = p.writingTopic;

    if (p.grammarLevel) state.grammarLevel = p.grammarLevel;
    if (p.readingLevel) state.readingLevel = p.readingLevel;
    if (p.writingType) {
      state.writingTaskType = p.writingType;
      document.querySelectorAll(".task-type-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.type === p.writingType)
      );
    }
  } catch {}
}

export async function saveProgress({ mode, level, scoreCorrect, scoreTotal, ytlGrade }) {
  // Mark the daily-challenge done flag locally even when offline / not
  // logged in, the user did the work, the dashboard should show the
  // celebratory state.
  markModeCompletedToday(mode);
  if (!isLoggedIn()) return;
  try {
    await apiFetch(`${API}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ mode, level, scoreCorrect, scoreTotal, ytlGrade }),
    });
  } catch { /* silently skip, never disrupt UX */ }
}









export function shareResult(text) {
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.activeElement;
      const orig = btn.textContent;
      btn.textContent = "✓ Kopioitu!";
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }).catch(() => alert(text));
  }
}

// ─── Adaptive level progress (removed, bar deleted from UI) ──────────────
// loadAdaptiveState() no-op kept so any lingering call sites don't throw
async function loadAdaptiveState() {}


// ─── Weak topics (mistake taxonomy) ───────────────────────────────────────







// ─── Writing per-dimension progression bars ────────────────────────────────


// ─── Right rail (top user card + Pro upsell or daily peek) ───────────────




// ─── YO-koe readiness map ──────────────────────────────────────────────────


// L48-hotfix Update 3, qualitative readiness label.
// Thresholds: <25 alkuvaiheessa, 25–49 hyvässä vauhdissa,
// 50–74 hyvin hallussa, ≥75 erinomaisesti. Empty cells → no label.

