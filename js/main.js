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
import { initWriting, showProUpsell, startCheckout, openBillingPortal, loadWritingTask } from "./screens/writing.js";
import { initExam, startMockExam } from "./screens/exam.js";
import { initFullExam, startFullExam } from "./screens/fullExam.js";
import { initAdaptive, masteryNext, masteryDone } from "./screens/adaptive.js";
import { initOnboarding, checkOnboarding } from "./screens/onboarding.js";
import { initPlacement, checkPlacementNeeded, showPlacementIntro, startPlacementFromRetake } from "./screens/placement.js";
import { initLearningPath, loadPath, submitMasteryResult } from "./screens/learningPath.js";
import { initQuickReview } from "./screens/quickReview.js";
import { initVerbSprint } from "./screens/verbSprint.js";
import { initVerbReference } from "./screens/verbReference.js";
import { initSettings, showSettings } from "./screens/settings.js";
import { initAnalytics, trackError } from "./analytics.js";

// ─── Inject show into api.js (avoids circular dep) ─────────────────────────
setShowFn(show);

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

  renderModePageStats(mode);

  if ((mode === "reading" || mode === "writing") && isLoggedIn() && !window._isPro) {
    const note = document.getElementById(`${mode}-pro-note`);
    if (note) note.classList.remove("hidden");
  } else {
    const note = document.getElementById(`${mode}-pro-note`);
    if (note) note.classList.add("hidden");
  }

  show(screenId);
}

function renderModePageStats(mode) {
  const statsEl = document.getElementById(`${mode}-page-stats`);
  if (!statsEl || !window._dashModeStats) { if (statsEl) statsEl.innerHTML = ""; return; }
  const s = window._dashModeStats[mode];
  if (!s) { statsEl.innerHTML = ""; return; }

  let html = "";
  if (s.sessions > 0) html += `<div class="mode-page-stat"><span class="mode-page-stat-value">${s.sessions}</span><span class="mode-page-stat-label">kertaa</span></div>`;
  if (s.bestGrade) html += `<div class="mode-page-stat"><span class="mode-page-stat-value">${s.bestGrade}</span><span class="mode-page-stat-label">paras</span></div>`;
  if (s.avgPct != null) html += `<div class="mode-page-stat"><span class="mode-page-stat-value">${s.avgPct}%</span><span class="mode-page-stat-label">keskim.</span></div>`;
  statsEl.innerHTML = html;
}

// ─── Wire up module dependencies ───────────────────────────────────────────

initAuth({ updateSidebarState, loadDashboard });
initDashboard({ loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, renderModePageStats, loadNextBatch, showProUpsell });
initVocab({ loadDashboard, shareResult, saveProgress });
initGrammar({ loadDashboard, saveProgress });
initReading({ loadDashboard, saveProgress, showProUpsell });
initWriting({ loadDashboard, saveProgress });
initExam({ loadDashboard, saveProgress, shareResult });
initFullExam({ loadDashboard, saveProgress, shareResult });
initAdaptive({ loadDashboard });
initOnboarding({ loadDashboard });
initPlacement({ loadDashboard });
initLearningPath({ loadDashboard });
window._learningPathRef = { submitMasteryResult };
window._onboardingRef = { checkOnboarding };
window._placementRef = { checkPlacementNeeded, showPlacementIntro, startPlacementFromRetake };

// ─── Sidebar navigation clicks ─────────────────────────────────────────────

document.querySelectorAll(".sidebar-item[data-nav], .mobile-nav-item[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nav = btn.dataset.nav;
    document.querySelectorAll(".sidebar-item[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === nav));
    document.querySelectorAll(".mobile-nav-item[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === nav));

    if (nav === "dashboard") {
      loadDashboard();
    } else if (nav === "exam") {
      startFullExam("demo");
    } else if (nav === "settings") {
      showSettings();
    } else {
      showModePage(nav);
    }
  });
});

// ─── Topic card clicks (all mode pages) ────────────────────────────────────

document.querySelectorAll(".topic-cards").forEach((grid) => {
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".topic-card");
    if (!card) return;
    grid.querySelectorAll(".topic-card").forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
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
  state.topic = document.querySelector("#vocab-topic-cards .topic-card.active")?.dataset.topic || "general vocabulary";
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
  state.grammarTopic = document.querySelector("#grammar-topic-cards .topic-card.active")?.dataset.topic || "mixed";
  state.grammarLevel = await fetchUserLevel("grammar", state.grammarTopic);
  state.sessionStartTime = Date.now();
  loadGrammarDrill();
}

if ($("btn-start-grammar")) $("btn-start-grammar").addEventListener("click", startGrammarDrill);

initQuickReview({ startGrammarDrill });
initVerbSprint({ saveProgress });
initVerbReference();
initSettings({ loadDashboard });

if ($("btn-start-reading")) $("btn-start-reading").addEventListener("click", async () => {
  state.mode = "reading";
  state.readingTopic = document.querySelector("#reading-topic-cards .topic-card.active")?.dataset.topic || "animals and nature";
  state.readingLevel = await fetchUserLevel("reading", state.readingTopic);
  state.sessionStartTime = Date.now();
  loadReadingTask();
});

if ($("btn-start-writing")) $("btn-start-writing").addEventListener("click", () => {
  state.mode = "writing";
  state.writingTaskType = document.querySelector("#writing-type-cards .topic-card.active")?.dataset.type || "short";
  state.writingTopic = document.querySelector("#writing-topic-cards .topic-card.active")?.dataset.topic || "general";
  state.sessionStartTime = Date.now();
  loadWritingTask();
});

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
      const btn = [...document.querySelectorAll("#options-grid .option-btn:not(:disabled)")]
        .find((b) => b.textContent.trim()[0].toUpperCase() === resolvedKey);
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
      const btn = [...document.querySelectorAll("#gram-options-grid .option-btn:not(:disabled)")]
        .find((b) => b.textContent.trim()[0].toUpperCase() === resolvedKey);
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

$("btn-logout").addEventListener("click", () => {
  clearAuth();
  updateSidebarState();
  show("screen-auth");
});

$("btn-dash-start").addEventListener("click", () => {
  $("btn-back-to-dash").classList.remove("hidden");
  loadLastSettings();
  show("screen-start");
});

$("btn-back-to-dash").addEventListener("click", () => loadDashboard());

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
    loadDashboard();
  });
  initPushNotifications();
  initAnalytics(null, getAuthEmail());
}

// Handle manifest shortcuts (hash-based routing)
const hash = window.location.hash.slice(1);
if (hash && ["vocab", "grammar", "reading", "writing"].includes(hash)) {
  window.location.hash = "";
  setTimeout(() => showModePage(hash), 500);
}
