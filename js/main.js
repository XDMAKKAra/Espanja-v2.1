// ─── Entry point ────────────────────────────────────────────────────────────
// Imports all modules and wires them together

import { API, isLoggedIn, getAuthEmail, authHeader, setAuth, clearAuth, apiFetch, setShowFn } from "./api.js";
import { state, LEVELS } from "./state.js";
import { $, show } from "./ui/nav.js";
import { showLoading, showLoadingError } from "./ui/loading.js";
import { applyFeatureFlags } from "./features/flags.js";

// Never let a feature-flag wiring error block the rest of the app from loading.
try { applyFeatureFlags(); } catch (err) { console.error("applyFeatureFlags failed:", err); }

import { initAuth } from "./screens/auth.js";
import { initDashboard, loadDashboard, navigateToMode, saveLastSettings, loadLastSettings, saveProgress, shareResult } from "./screens/dashboard.js";
import { initVocab, loadNextBatch, startReviewSession } from "./screens/vocab.js";
import { initGrammar, loadGrammarDrill } from "./screens/grammar.js";
import { initReading, loadReadingTask } from "./screens/reading.js";
import { initWriting, showProUpsell, startCheckout, openBillingPortal, loadWritingTask, wireAppWaitlist, hydrateConfig } from "./screens/writing.js";
import { initExam, startMockExam } from "./screens/exam.js";
import { initFullExam, startFullExam } from "./screens/fullExam.js";
import { initAdaptive, masteryNext, masteryDone } from "./screens/adaptive.js";
import { initOnboarding, checkOnboarding } from "./screens/onboarding.js";
import { initOnboardingV2, showOnboardingV2 } from "./screens/onboardingV2.js";
import { initPlacement, checkPlacementNeeded, showPlacementIntro, startPlacementFromRetake } from "./screens/placement.js";
import { initLearningPath, loadPath, submitMasteryResult } from "./screens/learningPath.js";
import { loadCurriculum } from "./screens/curriculum.js";
import { initQuickReview } from "./screens/quickReview.js";
import { initVerbSprint } from "./screens/verbSprint.js";
import { initVerbReference } from "./screens/verbReference.js";
import { initSettings, showSettings } from "./screens/settings.js";
import { initProfile, loadProfile } from "./screens/profile.js";
import { wireTopicPicker, topicLabel, loadBriefing } from "./screens/mode-page.js";
import { initAnalytics, trackError } from "./analytics.js";

// ─── Inject show into api.js (avoids circular dep) ─────────────────────────
setShowFn(show);

// ─── Loading-shimmer auto-clear ────────────────────────────────────────────
// Strip `.loading-shimmer` from placeholder elements as soon as JS replaces
// their text, so real exercise content doesn't keep pulsing.
(function watchShimmerPlaceholders() {
  if (typeof MutationObserver === "undefined") return;
  const ids = ["question-text", "writing-prompt-text", "gram-sentence", "reading-question-text", "mastery-question", "placement-question"];
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
  if (sidebarUser) sidebarUser.textContent = getAuthEmail() || "";
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
initFullExam({ loadDashboard, saveProgress, shareResult });
initAdaptive({ loadDashboard });
initOnboarding({ loadDashboard, loadNextBatch });
initOnboardingV2({ loadDashboard });
window._onboardingV2 = { show: showOnboardingV2 };
// Hash entry: visiting /app.html#/aloitus enters the L-PLAN-1 V2 onboarding.
if (location.hash === "#/aloitus") {
  // Defer to next tick so the rest of init runs (auth checks etc.) first.
  setTimeout(() => showOnboardingV2(), 0);
}
initPlacement({ loadDashboard });
initLearningPath({ loadDashboard });
window._learningPathRef = { submitMasteryResult };
window._onboardingRef = { checkOnboarding };
window._placementRef = { checkPlacementNeeded, showPlacementIntro, startPlacementFromRetake };

// ─── Sidebar navigation clicks + hash routing ──────────────────────────────

const NAV_HASH = {
  dashboard: "#/koti",
  vocab: "#/sanasto",
  grammar: "#/puheoppi",
  reading: "#/luetun",
  writing: "#/kirjoitus",
  verbsprint: "#/verbisprintti",
  path: "#/oppimispolku",
  exam: "#/koeharjoitus",
  settings: "#/asetukset",
  profile: "#/oma-sivu",
};
const HASH_NAV = Object.fromEntries(Object.entries(NAV_HASH).map(([k, v]) => [v, k]));

function navigateTo(nav, { updateHash = true } = {}) {
  if (!nav) return;
  document.querySelectorAll(".sidebar-item[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === nav));
  document.querySelectorAll(".mobile-nav-item[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === nav));

  if (updateHash && NAV_HASH[nav] && location.hash !== NAV_HASH[nav]) {
    history.replaceState(null, "", NAV_HASH[nav]);
  }

  if (nav === "dashboard") loadDashboard();
  else if (nav === "exam") startFullExam("demo");
  else if (nav === "settings") showSettings();
  else if (nav === "profile") loadProfile();
  else if (nav === "path") loadCurriculum();
  else showModePage(nav);
}

document.querySelectorAll(".sidebar-item[data-nav], .mobile-nav-item[data-nav], .sidebar-user[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => navigateTo(btn.dataset.nav));
});

window.addEventListener("hashchange", () => {
  if (!isLoggedIn()) return;
  const nav = HASH_NAV[location.hash];
  if (nav) navigateTo(nav, { updateHash: false });
});

// On boot, restore screen from hash (only if logged in — auth flow handles otherwise).
window._restoreFromHash = function restoreFromHash() {
  if (!isLoggedIn()) return false;
  const nav = HASH_NAV[location.hash];
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

// Mode defaults when the API call fails or the user has no placement yet.
const MODE_LEVEL_DEFAULTS = { vocab: "B", grammar: "C", reading: "C" };

async function fetchUserLevel(mode, topic) {
  const fallback = MODE_LEVEL_DEFAULTS[mode] || "B";
  try {
    const qs = new URLSearchParams({ mode });
    if (topic) qs.set("topic", topic);
    const res = await apiFetch(`${API}/api/user-level?${qs}`, { headers: authHeader() });
    if (!res.ok) return fallback;
    const data = await res.json();
    return data.level || fallback;
  } catch {
    return fallback;
  }
}

// Optional: populate the "Tasosi: X" status line on mode pages when they open.
async function showLevelForMode(displayId, mode, topic) {
  const el = document.getElementById(displayId);
  if (!el) return;
  const level = await fetchUserLevel(mode, topic);
  const strong = el.querySelector("[data-level]");
  if (strong) strong.textContent = level;
  el.hidden = false;
  return level;
}

// ─── Start buttons on mode pages ───────────────────────────────────────────

if ($("btn-start-vocab")) $("btn-start-vocab").addEventListener("click", async () => {
  state.mode = "vocab";
  state.topic = document.querySelector('#screen-mode-vocab .mode-topic[aria-checked="true"]')?.dataset.topic || "general vocabulary";
  state.level = await fetchUserLevel("vocab", state.topic);
  state.startLevel = state.level;
  state.peakLevel = state.level;
  state.batchNumber = 0;
  state.totalCorrect = 0;
  state.totalAnswered = 0;
  state.sessionItems = [];
  state.sessionStartTime = Date.now();
  loadNextBatch();
});

async function startGrammarDrill() {
  state.mode = "grammar";
  state.grammarTopic = document.querySelector('#screen-mode-grammar .mode-topic[aria-checked="true"]')?.dataset.topic || "mixed";
  state.grammarLevel = "C";  // server-driven default; matches old fallback
  state.sessionStartTime = Date.now();
  loadGrammarDrill();
}

if ($("btn-start-grammar")) $("btn-start-grammar").addEventListener("click", startGrammarDrill);

initQuickReview({ startGrammarDrill });
initVerbSprint({ saveProgress });
initVerbReference();
initSettings({ loadDashboard });
initProfile();

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

// Spec 2 §4.1 — drill exit returns to dashboard.
const btnExitExercise = $("btn-exit-exercise");
if (btnExitExercise) btnExitExercise.addEventListener("click", () => show("screen-dashboard"));
const btnExitGram = $("btn-exit-gram");
if (btnExitGram) btnExitGram.addEventListener("click", () => show("screen-dashboard"));
const btnExitReading = $("btn-exit-reading");
if (btnExitReading) btnExitReading.addEventListener("click", () => show("screen-dashboard"));
const btnExitReadingText = $("btn-exit-reading-text");
if (btnExitReadingText) btnExitReadingText.addEventListener("click", () => show("screen-dashboard"));

// Pro upgrade buttons on mode pages
if ($("reading-upgrade-btn")) $("reading-upgrade-btn").addEventListener("click", () => startCheckout());
if ($("writing-upgrade-btn")) $("writing-upgrade-btn").addEventListener("click", () => startCheckout());

// Full exam start button
const fullExamBtn = $("btn-start-full-exam");
if (fullExamBtn) {
  fullExamBtn.addEventListener("click", () => startFullExam("demo"));
}

// SR review buttons (legacy + new top bar)
const reviewBtn = $("btn-start-review");
if (reviewBtn) reviewBtn.addEventListener("click", () => startReviewSession());
const topBarBtn = $("sr-top-btn");
if (topBarBtn) topBarBtn.addEventListener("click", () => startReviewSession());

// Mastery test navigation
const masteryNextBtn = $("mastery-btn-next");
if (masteryNextBtn) masteryNextBtn.addEventListener("click", () => masteryNext());

const masteryDoneBtn = $("mastery-btn-done");
if (masteryDoneBtn) masteryDoneBtn.addEventListener("click", () => masteryDone());

// Retake placement test
const retakeBtn = $("btn-retake-placement");
if (retakeBtn) {
  retakeBtn.addEventListener("click", () => startPlacementFromRetake());
}

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

// Language is fixed to Spanish
state.language = "spanish";

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

  // Mastery test screen
  if ($("screen-mastery-test") && $("screen-mastery-test").classList.contains("active")) {
    if (["A", "B", "C", "D"].includes(resolvedKey)) {
      const btn = [...document.querySelectorAll("#mastery-options-grid .option-btn:not(:disabled)")]
        .find((b) => b.textContent.trim()[0].toUpperCase() === resolvedKey);
      if (btn) btn.click();
    } else if ((e.key === "Enter" || e.key === " ") &&
               !$("mastery-explanation-block").classList.contains("hidden")) {
      e.preventDefault();
      $("mastery-btn-next").click();
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

// ─── Dashboard nav buttons ─────────────────────────────────────────────────

const btnLogout = $("btn-logout");
if (btnLogout) btnLogout.addEventListener("click", () => {
  clearAuth();
  updateSidebarState();
  show("screen-auth");
});

const btnDashStart = $("btn-dash-start");
if (btnDashStart) btnDashStart.addEventListener("click", () => {
  const back = $("btn-back-to-dash");
  if (back) back.classList.remove("hidden");
  loadLastSettings();
  show("screen-start");
});

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

// ─── Startup ───────────────────────────────────────────────────────────────

updateSidebarState();
if (!resetToken && isLoggedIn()) {
  // Check onboarding first, then placement, then dashboard
  checkOnboarding().then(async (needsOnboarding) => {
    if (needsOnboarding) return; // onboarding screen shown
    // Check if placement test is needed
    const needsPlacement = await checkPlacementNeeded();
    if (needsPlacement) {
      showPlacementIntro();
      return;
    }
    // Restore screen from URL hash if present, else load dashboard.
    if (!window._restoreFromHash || !window._restoreFromHash()) {
      loadDashboard();
    }
  });
  initPushNotifications();
  initAnalytics(null, getAuthEmail());
}

// Handle manifest shortcut hashes (legacy bare names — translate to new hash form)
const legacyHash = window.location.hash.slice(1);
const LEGACY_MAP = { vocab: "#/sanasto", grammar: "#/puheoppi", reading: "#/luetun", writing: "#/kirjoitus" };
if (LEGACY_MAP[legacyHash]) {
  history.replaceState(null, "", LEGACY_MAP[legacyHash]);
}
