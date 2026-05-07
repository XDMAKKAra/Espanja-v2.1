import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, clearAuth, authHeader, apiFetch, getAuthEmail, setDashboardV2, getDashboardV2Section } from "../api.js";
import { state, setLanguage } from "../state.js";
import { showLoading } from "../ui/loading.js";
import { srDueCount } from "../features/spacedRepetition.js";
import { renderAdaptiveCard } from "./adaptive.js";
import { getBlogForTopic, trackBlogClick } from "../features/topicBlogMap.js";
import { icon, MODE_ICONS } from "../ui/icons.js";
import { getRecentWritingDimensions } from "../features/writingProgression.js";
import { hideAppCountdown } from "./onboarding.js";
import { renderDashboardCta } from "./dash-cta.js";
import { renderWordOfDayInto } from "../features/wordOfDay.js";
import { renderDailyChallengeInto, markModeCompletedToday } from "../features/dailyChallenge.js";
import { celebrateStreakMilestone } from "../features/celebrate.js";
import { countUp } from "./mode-page.js";
import { timeAgo } from "../ui/timeAgo.js";
import { mountMeteors, unmountMeteors } from "../features/meteors.js";

let _deps = {};
export function initDashboard({ loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, loadNextBatch, showProUpsell }) {
  _deps = { loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, loadNextBatch, showProUpsell };
}

// ── Motivation copy ─────────────────────────────────────────────────────────
// Variable, context-aware Finnish motivation. Rotates daily so the dashboard
// doesn't repeat the same line for a week of practice.
const MOTIVATION = {
  zero: [
    "Aloita ensimmäinen harjoitus — pieni alku riittää.",
    "Yksi harjoitus tänään, ja olet käynnissä.",
    "Pieni alku tänään → suurempi ote ensi viikolla.",
  ],
  zeroStreak: [
    "Jatka harjoittelua tänään — pieni rutiini riittää.",
    "Tänään paras päivä aloittaa uusi putki.",
    "10 minuuttia espanjaa — ja tilanne paranee.",
  ],
  ones: [
    "Hyvä alku — tee yksi harjoitus jatkaaksesi.",
    "Putki kasvaa askel kerrallaan.",
    "Yksi harjoitus pitää sinut mukana.",
  ],
  threes: [
    "Vauhti päällä — harjoittele tänään ja pidä putki.",
    "Tämä alkaa kuulostamaan rutiinilta. Hyvä!",
    "Kolme päivää — aivot oppivat parhaiten kertauksesta.",
    "Jatka niin — pieni päivittäinen toisto kantaa pitkälle.",
  ],
  weeks: [
    "🔥 Viikon putki — espanjasi kiittää sinua.",
    "🔥 Seitsemän päivää! YO-rutiini alkaa rakentua.",
    "🔥 Viikko espanjaa peräkkäin — ei pieni juttu.",
  ],
  months: [
    "🔥 Yli viikko mennyt — tämä on jo tapa.",
    "🔥 Putki kasvaa — pidä kiinni.",
    "🔥 Sinnikkyys palkitaan YTL-rubriikissa.",
  ],
  marathon: [
    "🔥 Kuukauden putki — tämä on todellista omistautumista.",
    "🔥 Kuukausi! Espanja on osa arkeasi.",
    "🔥 Yli 30 päivää — vauhti vie kokeeseen asti.",
  ],
};

function pickMotivation(streak = 0, totalSessions = 0) {
  let bucket;
  if (totalSessions === 0) bucket = MOTIVATION.zero;
  else if (streak === 0) bucket = MOTIVATION.zeroStreak;
  else if (streak >= 30) bucket = MOTIVATION.marathon;
  else if (streak >= 7) bucket = streak >= 14 ? MOTIVATION.months : MOTIVATION.weeks;
  else if (streak >= 3) bucket = MOTIVATION.threes;
  else bucket = MOTIVATION.ones;
  // Rotate by UTC day so the same line doesn't repeat day-after-day.
  const day = Math.floor(Date.now() / 86400000);
  return bucket[((day % bucket.length) + bucket.length) % bucket.length];
}

export const MODE_META = {
  vocab:   { icon: MODE_ICONS.vocab,   name: "Sanasto" },
  grammar: { icon: MODE_ICONS.grammar, name: "Kielioppi" },
  reading: { icon: MODE_ICONS.reading, name: "Luetun ymmärtäminen" },
  writing: { icon: MODE_ICONS.writing, name: "Kirjoittaminen" },
};

export async function loadDashboard() {
  showLoading("Ladataan…");
  try {
    // L-LIVE-AUDIT-P2 UPDATE 3 — single batched request replaces 9 sequential
    // dashboard fetches. Each section may be `null` if its server query failed;
    // helper functions (loadAdaptiveState, loadWeakTopics, ...) check the
    // cached payload first via getDashboardV2Section() and only fall back to
    // their legacy single-endpoint fetch on cache miss.
    const res = await apiFetch(`${API}/api/dashboard/v2`, { headers: authHeader() });
    if (res.status === 401) {
      clearAuth();
      show("screen-auth");
      return;
    }
    let dashboardCore;
    if (res.ok) {
      const v2 = await res.json();
      setDashboardV2(v2);
      dashboardCore = v2.dashboard;
      // L-LIVE-AUDIT-P2 UPDATE 4 — seed the global profile so the CTA renderer
      // and other readers don't need to re-fetch /api/profile separately.
      if (v2.profile?.profile && !window._userProfile) {
        window._userProfile = v2.profile.profile;
      }
      // L-LANG-INFRA-1: hydrate language from profile so routing + ?lang= work
      // immediately after the first dashboard load (no extra /api/profile fetch).
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
    renderDashboard(dashboardCore);
    hideAppCountdown();
    show("screen-path"); // L-MERGE-DASH-PATH — dashboard merged into path screen
    // L-MERGE-DASH-PATH — also render the course list (the merged-home "main"
    // section). Dynamic import avoids a circular dep with curriculum.js.
    import("./curriculum.js")
      .then((m) => m.loadCurriculum?.())
      .catch(() => { /* curriculum optional; ignore */ });
  } catch {
    show("screen-start");
  }
}

// L-PLAN-3 — daily AI tutor greeting card. Fetched once per session; the
// server caches the AI generation per user for 24h.
async function loadTutorMessage() {
  const card = document.getElementById("dash-tutor");
  const msgEl = document.getElementById("dash-tutor-msg");
  const skeleton = document.getElementById("dash-tutor-skeleton");
  if (!card || !msgEl) return;
  if (!isLoggedIn()) {
    card.hidden = true;
    if (skeleton) skeleton.hidden = true;
    return;
  }

  // Session cache — avoid re-fetching on every dashboard render in the same tab.
  const cached = (() => {
    try { return sessionStorage.getItem("dashTutorMsg") || null; } catch { return null; }
  })();
  if (cached) {
    msgEl.textContent = cached;
    card.hidden = false;
    if (skeleton) skeleton.hidden = true;
    return;
  }

  if (skeleton) skeleton.hidden = false;
  card.hidden = true;
  try {
    const res = await apiFetch(`${API}/api/curriculum/tutor-message`, { headers: authHeader() });
    if (!res.ok) throw new Error("tutor-message failed");
    const data = await res.json();
    if (skeleton) skeleton.hidden = true;
    if (data?.message) {
      msgEl.textContent = data.message;
      card.hidden = false;
      try { sessionStorage.setItem("dashTutorMsg", data.message); } catch { /* private mode */ }
    } else {
      card.hidden = true;
    }
  } catch {
    if (skeleton) skeleton.hidden = true;
    card.hidden = true;
  }
}

// ─── Free-tier quota chip ────────────────────────────────────────────────────
function renderFreeChip() {
  const root = document.getElementById("dash-free-chip-root");
  if (!root) return;

  // Read tier from cached profile. Fall back gracefully — don't crash.
  const tier = window._userProfile?.subscription_tier || "free";
  if (tier !== "free") {
    root.hidden = true;
    return;
  }

  // /api/free-usage does not exist yet — show static quota chip with progress bar.
  // aiUsage is not in scope here; read from cached profile or use placeholder counts.
  const used = window._userProfile?.ai_calls_this_month ?? null;
  const limit = 20; // static free-tier limit placeholder
  const usedSafe = (used != null && Number.isFinite(Number(used))) ? Number(used) : null;
  const fillPct = usedSafe != null ? Math.min(100, Math.round((usedSafe / limit) * 100)) : 0;
  const isHigh = fillPct >= 75;
  const fillClass = isHigh ? "dash-free-meter__fill--warn" : "dash-free-meter__fill--ok";

  root.hidden = false;
  root.innerHTML = `
    <div class="dash-free-chip">
      <div class="dash-free-chip__left">
        <span class="dash-free-chip__badge">Free</span>
        ${usedSafe != null
          ? `<span class="dash-free-chip__quota">${usedSafe}/${limit} AI-harjoitusta</span>`
          : `<span class="dash-free-chip__quota">Rajoitettu sisältö</span>`}
      </div>
      ${usedSafe != null ? `
        <div class="dash-free-meter" title="${usedSafe} / ${limit} käytetty">
          <div class="dash-free-meter__fill ${fillClass}" style="width:${fillPct}%"></div>
        </div>` : ""}
      <a class="dash-free-chip__cta" href="/pricing.html?from=meter">Avaa Treeni &rarr;</a>
    </div>`;
}

function renderDashboard({
  totalSessions, modeStats, recent, chartData = [], estLevel = null,
  gradeEstimate = null,
  streak = 0, weekSessions = 0, prevWeekSessions = 0,
  suggestedLevel = "B", modeDaysAgo = {}, pro = false,
  aiUsage = null,
}) {
  // Kick off the tutor-message fetch in parallel — the rest of the dashboard
  // doesn't block on it. The card stays hidden until a message arrives.
  loadTutorMessage().catch(() => {});
  // Free-tier chip — shown before greeting so it's the first thing free users see.
  renderFreeChip();
  // Pro badge — moved from dashboard header to sidebar footer (T11)
  const proSlot = document.getElementById("sidebar-pro-slot");
  if (proSlot) {
    if (pro) {
      proSlot.innerHTML = `<span class="sidebar-pro-badge">PRO</span> <button class="btn-manage-sub" id="btn-manage-sub">Hallinnoi tilausta</button>`;
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
  const rawEmail = getAuthEmail();
  const name = (rawEmail && rawEmail.includes("@")) ? rawEmail.split("@")[0] : "";
  $("dash-username").textContent = name;
  // P0-3: hide comma + change punctuation when no name → "Hei!" not "Hei, ."
  const comma = document.getElementById("dash-greeting-comma");
  if (comma) comma.hidden = !name;
  const punct = document.getElementById("dash-greeting-punct");
  if (punct) punct.textContent = name ? "." : "!";

  // Time-aware Finnish greeting — defaults to "Hei" outside the four named windows.
  const greetEl = document.getElementById("dash-greeting-prefix");
  if (greetEl) {
    const h = new Date().getHours();
    let g = "Hei";
    if (h >= 5 && h < 11) g = "Huomenta";
    else if (h >= 11 && h < 17) g = "Päivää";
    else if (h >= 17 && h < 23) g = "Iltaa";
    greetEl.textContent = g;
  }

  const dateEl = document.getElementById("dash-date");
  if (dateEl) {
    const now = new Date();
    const weekday = now.toLocaleDateString("fi-FI", { weekday: "long" });
    const dm = now.toLocaleDateString("fi-FI", { day: "numeric", month: "numeric" });
    dateEl.textContent = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${dm}`;
    dateEl.setAttribute("datetime", now.toISOString().slice(0, 10));
  }

  // Day's drill CTA — unified button (onboarding / SR / drill)
  // SR count is fetched async in updateSrBadge; initial render uses profile + topics available at mount time.
  // updateSrBadge (called below) will call updateDashCta once the async count resolves.
  const ctaEl = document.getElementById("dash-day-cta");
  if (ctaEl) {
    renderDashboardCta(ctaEl, {
      profileComplete: window._userProfile?.onboarding_completed === true,
      srDueCount: 0, // updated async by updateSrBadge below
      weakestTopic: null, // updated async by loadWeakTopics below
    });
    ctaEl.onclick = () => {
      const target = ctaEl.dataset.target;
      if (target === "onboarding") {
        const { checkOnboarding: startOb } = window._onboardingRef || {};
        if (startOb) startOb();
        else show("screen-onboarding");
      } else if (target === "sr-review") {
        document.getElementById("btn-start-review")?.click();
      } else {
        document.getElementById("nav-vocab")?.click();
      }
    };
  }

  const motivationEl = $("dash-motivation");
  if (motivationEl) {
    motivationEl.textContent = pickMotivation(streak, totalSessions);
  }

  // L-PLAN-4 UPDATE 4 — streak surfaces in the hero greeting now that the
  // right rail is gone. Reveal the chip only once we know there's a streak
  // worth celebrating; zero-day users keep the cleaner hero.
  const streakRow = document.getElementById("dash-greeting-streak");
  const streakNumHero = document.getElementById("dash-greeting-streak-num");
  if (streakRow && streakNumHero) {
    streakNumHero.textContent = String(streak ?? 0);
    streakRow.hidden = !((streak ?? 0) >= 1);
  }

  // Blur-fade arrival on the hero header (sourced: Magic UI blur-fade).
  // Defer one frame so the initial-state styles commit, then add the
  // `--in` modifier to drive the staggered transition. Idempotent — the
  // class is harmless to re-add.
  const heroHeader = document.querySelector("#screen-dashboard .dash-greeting");
  if (heroHeader) {
    heroHeader.classList.remove("dash-greeting--in");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      heroHeader.classList.add("dash-greeting--in");
    }));
  }

  renderGradeWidget(gradeEstimate || { tier: "none", grade: null, confidence: 0, coverage: {}, total: totalSessions || 0 });

  // ── Adaptive level progress bar ──
  loadAdaptiveState().catch(() => {});

  // ── Weak topics ──
  loadWeakTopics().catch(() => {});

  const streakEl = $("dash-streak");
  if (streakEl) {
    streakEl.className = streak >= 3 ? "mono-num dash-stat-streak-active" : "mono-num";
    const safeStreak = (streak != null && Number.isFinite(streak)) ? streak : 0;
    countUp(streakEl, safeStreak, safeStreak >= 30 ? 1600 : 1100);
  }

  // KPI tile — streak flame icon tint
  const kpiTile1 = document.querySelector(".dash-kpi-tile--1");
  if (kpiTile1) {
    kpiTile1.classList.toggle("dash-kpi-tile--hot", (streak ?? 0) >= 7);
  }
  // Once-per-crossing milestone confetti (3 / 7 / 30 days). Cheap call: gated
  // by localStorage and prefers-reduced-motion in the helper itself.
  celebrateStreakMilestone(streak).catch(() => {});

  // Premium decoration: meteors fall behind the dashboard hero once the
  // user is on a "hot" streak (≥ 7 days). Mount idempotently — re-renders of
  // the dashboard won't re-stack meteors. Unmount when the streak breaks.
  const meteorsEl = document.getElementById("dash-meteors");
  if (meteorsEl) {
    if (streak >= 7) mountMeteors(meteorsEl, { count: streak >= 30 ? 24 : 16 });
    else unmountMeteors(meteorsEl);
  }
  renderWordOfDayInto(document.getElementById("word-of-day"));
  renderDailyChallengeInto(document.getElementById("daily-challenge"), {
    onAccept: (c) => { try { navigateToMode(c.mode); } catch { /* fallback: stay on dashboard */ } },
  });

  const flameEl = document.getElementById("dash-streak-flame");
  if (flameEl) {
    flameEl.classList.toggle("is-dim", streak < 1);
    flameEl.classList.toggle("streak-flame--warm", streak >= 1 && streak < 7);
    flameEl.classList.toggle("streak-flame--hot", streak >= 7);
    flameEl.classList.toggle("streak-flame--inferno", streak >= 30);
  }

  const totalEl = $("dash-total-sessions");
  if (totalEl) {
    const safeTotal = (totalSessions != null && Number.isFinite(Number(totalSessions))) ? Number(totalSessions) : 0;
    if (safeTotal === 0 && totalSessions == null) {
      totalEl.textContent = "—";
    } else {
      countUp(totalEl, safeTotal, 1300);
    }
  }

  // YO-readiness rail stat — filled async by loadAndRenderReadinessMap below.
  // dash-yo-delta stays blank until the API exposes a delta source.
  const deltaEl = document.getElementById("dash-yo-delta");
  if (deltaEl) deltaEl.textContent = "";

  // Sync footer — cosmetic timestamp showing when dashboard data was loaded.
  const syncEl = document.getElementById("dash-rail-sync");
  if (syncEl) {
    const t = new Date();
    syncEl.textContent = t.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
  }

  const weekValEl = $("dash-week-val");
  const weekTrendEl = $("dash-week-trend");
  if (weekValEl && weekTrendEl) {
    const safeWeek = (weekSessions != null && Number.isFinite(Number(weekSessions))) ? Number(weekSessions) : null;
    const safeNumEl = weekValEl.querySelector(".mono-num") || weekValEl.childNodes[0];
    if (safeNumEl) safeNumEl.textContent = safeWeek != null ? safeWeek : "—";
    if (safeWeek != null && weekSessions > prevWeekSessions) {
      weekTrendEl.textContent = "↑"; weekTrendEl.className = "week-trend-arrow up";
    } else if (safeWeek != null && weekSessions < prevWeekSessions && prevWeekSessions > 0) {
      weekTrendEl.textContent = "↓"; weekTrendEl.className = "week-trend-arrow down";
    } else {
      weekTrendEl.textContent = ""; weekTrendEl.className = "week-trend-arrow same";
    }
  }

  renderGoalRow(chartData);
  renderHeatmap(chartData);
  renderProgressChart(chartData);

  window._dashSuggestedLevel = suggestedLevel;
  window._dashModeDaysAgo = modeDaysAgo;
  window._dashStreak = streak;
  window._isPro = pro ?? false;
  window._dashModeStats = modeStats;

  renderRail({ pro: window._isPro, streak });

  document.querySelectorAll(".mode-btn[data-mode='reading'], .mode-btn[data-mode='writing']").forEach((btn) => {
    const locked = isLoggedIn() && !pro;
    btn.classList.toggle("mode-locked", locked);
    const desc = btn.querySelector(".mode-desc");
    if (desc && locked && !desc.dataset.origDesc) {
      desc.dataset.origDesc = desc.textContent;
      desc.textContent = "🔒 Pro-ominaisuus";
    } else if (desc && !locked && desc.dataset.origDesc) {
      desc.textContent = desc.dataset.origDesc;
      delete desc.dataset.origDesc;
    }
  });

  const streakBadge = $("start-streak-badge");
  if (streakBadge) {
    if (streak >= 1) {
      streakBadge.innerHTML = `<span class="streak-badge-icon">${icon("flame", 14)}</span><span>${streak} pv putki</span>`;
      streakBadge.classList.toggle("streak-badge-hot", streak >= 7);
      streakBadge.classList.toggle("streak-badge-warm", streak >= 3 && streak < 7);
      streakBadge.classList.remove("hidden");
    } else {
      streakBadge.classList.add("hidden");
    }
  }

  const modesEl = $("dash-modes");
  if (modesEl) {
    modesEl.innerHTML = "";
    for (const [mode, meta] of Object.entries(MODE_META)) {
      const s = modeStats?.[mode];
      const daysAgo = modeDaysAgo?.[mode];
      const isDue = daysAgo === null || daysAgo === undefined || daysAgo >= 2;
      const card = document.createElement("div");
      card.className = "dash-mode-card" + (s ? " has-data" : "");
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${meta.name} — ${s ? `${s.sessions ?? 0} harjoituskertaa` : "aloita"}`);
      // Due dot — pulsing accent dot when practice is overdue
      const dueDot = isDue && totalSessions > 0
        ? `<span class="dash-mode-due dash-mode-due--pulse" title="Harjoittele tänään"></span>`
        : "";
      // Right side: grade / pct or CTA button
      let right;
      if (s) {
        if (s.bestGrade) {
          right = `<div class="dash-mode-stat-label">Paras</div><div class="dash-mode-grade">${s.bestGrade}</div>`;
        } else if (s.avgPct != null && Number.isFinite(Number(s.avgPct))) {
          right = `<div class="dash-mode-stat-label">Keskim.</div><div class="dash-mode-pct">${s.avgPct}%</div>`;
        } else {
          right = `<button class="dash-mode-cta-btn" tabindex="-1" aria-hidden="true">Aloita</button>`;
        }
      } else {
        right = `<button class="dash-mode-cta-btn" tabindex="-1" aria-hidden="true">Aloita</button>`;
      }
      card.innerHTML = `
        <div class="dash-mode-left">
          <span class="dash-mode-icon" aria-hidden="true">${meta.icon}</span>
          <div>
            <div class="dash-mode-name">${meta.name}${dueDot}</div>
            <div class="dash-mode-sessions">${s ? `${s.sessions ?? 0} krt` : "0 krt"}</div>
          </div>
        </div>
        <div class="dash-mode-right">${right}</div>`;

      card.addEventListener("click", () => navigateToMode(mode));
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigateToMode(mode); } });
      modesEl.appendChild(card);
    }
  }

  renderRecommendations(modeDaysAgo, modeStats, totalSessions);
  loadExamHistory();
  updateSrBadge();
  renderAdaptiveCard("vocab");
  renderAiUsage(aiUsage, pro);
  renderWritingProgression();
  loadAndRenderReadinessMap().catch(() => {});

  // Show retake placement button if user has completed onboarding
  const retakeEl = $("dash-placement-retake");
  if (retakeEl) {
    if (window._userProfile?.onboarding_completed) {
      retakeEl.classList.remove("hidden");
    } else {
      retakeEl.classList.add("hidden");
    }
  }

  if (recent.length > 0) {
    $("dash-recent-wrap").classList.remove("hidden");
    $("dash-empty")?.classList.add("hidden");
    const emptyRailEl = document.getElementById("dash-empty-rail");
    if (emptyRailEl) emptyRailEl.classList.add("hidden");
    const listEl = $("dash-recent-list");
    listEl.innerHTML = "";
    for (const log of recent) {
      const meta = MODE_META[log.mode] || { icon: icon("document"), name: log.mode };
      const scoreStr =
        log.scoreTotal > 0 ? `${log.scoreCorrect ?? "—"}/${log.scoreTotal}` : "";
      const gradeStr = log.ytlGrade || "";
      const item = document.createElement("div");
      item.className = "dash-recent-item";
      item.setAttribute("role", "listitem");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", `${meta.name}, ${timeAgo(log.createdAt)}`);
      // Level chip — styled pill
      const levelChip = log.level
        ? `<span class="dash-recent-level-chip">${log.level}</span>`
        : "";
      item.innerHTML = `
        <div class="dash-recent-left">
          <span class="dash-recent-icon" aria-hidden="true">${meta.icon}</span>
          <div>
            <div class="dash-recent-mode">${meta.name}${levelChip}</div>
            <div class="dash-recent-time">${timeAgo(log.createdAt)}</div>
          </div>
        </div>
        <div class="dash-recent-right">
          ${scoreStr ? `<div class="dash-recent-score">${scoreStr}</div>` : ""}
          ${gradeStr ? `<div class="dash-recent-grade">${gradeStr}</div>` : ""}
        </div>`;
      // Full-row click — navigate to that mode
      const clickMode = log.mode;
      item.addEventListener("click", () => { try { navigateToMode(clickMode); } catch { /* noop */ } });
      item.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); try { navigateToMode(clickMode); } catch { /* noop */ } } });
      listEl.appendChild(item);
    }
  } else {
    $("dash-recent-wrap")?.classList.add("hidden");
    $("dash-empty")?.classList.remove("hidden");
    // Show the rail empty state (new element in screen-path)
    const emptyRailEl = document.getElementById("dash-empty-rail");
    if (emptyRailEl) {
      emptyRailEl.classList.remove("hidden");
      const emptyBtn = document.getElementById("btn-empty-start");
      if (emptyBtn && !emptyBtn._wired) {
        emptyBtn._wired = true;
        emptyBtn.addEventListener("click", () => {
          const navBtn = document.getElementById("nav-vocab");
          if (navBtn) navBtn.click(); else navigateToMode("vocab");
        });
      }
    }
  }
}

function renderGoalRow(chartData) {
  const profile = window._userProfile;
  if (!profile || !profile.onboarding_completed) return;

  // Exam countdown
  const countdownEl = $("dash-countdown-value");
  if (profile.exam_date && countdownEl) {
    const examDate = new Date(profile.exam_date);
    const daysLeft = Math.max(0, Math.ceil((examDate - new Date()) / (24 * 60 * 60 * 1000)));
    countdownEl.textContent = daysLeft;
    if (daysLeft <= 30) countdownEl.style.color = "var(--error)";
    else if (daysLeft <= 90) countdownEl.style.color = "var(--accent)";
    else countdownEl.style.color = "";
    const cd = $("dash-exam-countdown");
    if (cd) cd.classList.toggle("is-urgent", daysLeft <= 30);
  } else {
    const card = $("dash-exam-countdown");
    if (card) card.classList.add("hidden");
  }

  // Daily goal
  const goalMinutes = profile.preferred_session_length || 20;
  const goalEl = $("dash-goal-minutes");
  if (goalEl) goalEl.textContent = goalMinutes;

  // Count today's practice minutes from chartData
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = chartData.filter(l => l.createdAt && l.createdAt.slice(0, 10) === today);
  // Estimate ~3 min per session
  const todayMinutes = Math.round(todaySessions.length * 3);
  const todayEl = $("dash-today-minutes");
  if (todayEl) todayEl.textContent = todayMinutes;

  const barFill = $("dash-goal-bar-fill");
  if (barFill) {
    const pct = Math.min(100, (todayMinutes / goalMinutes) * 100);
    barFill.style.width = `${pct}%`;
    if (pct >= 100) barFill.style.background = "var(--success)";
  }
}

function pctToGradeIdx(pct) {
  if (pct >= 80) return 5;
  if (pct >= 67) return 4;
  if (pct >= 53) return 3;
  if (pct >= 38) return 2;
  if (pct >= 22) return 1;
  return 0;
}

function logToGradeIdx(log) {
  const GRADE_IDX = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };
  if (log.ytlGrade && GRADE_IDX[log.ytlGrade] !== undefined) return GRADE_IDX[log.ytlGrade];
  if (log.pct !== null) return pctToGradeIdx(log.pct);
  return null;
}

function computeTrend(chartData) {
  const pts = chartData.map(logToGradeIdx).filter((g) => g !== null);
  if (pts.length < 4) return { arrow: "—", cls: "trend-same" };
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const recent3 = pts.slice(-3);
  const older3 = pts.slice(-6, -3);
  if (older3.length === 0) return { arrow: "—", cls: "trend-same" };
  const diff = avg(recent3) - avg(older3);
  if (diff > 0.4) return { arrow: "↑", cls: "trend-up" };
  if (diff < -0.4) return { arrow: "↓", cls: "trend-down" };
  return { arrow: "→", cls: "trend-same" };
}

function renderProgressChart(chartData) {
  const el = $("dash-chart");
  if (!el) return;

  const GRADES = ["I", "A", "B", "C", "M", "E", "L"];
  const pts = chartData.map(logToGradeIdx).filter((g) => g !== null);

  if (pts.length === 0) {
    el.innerHTML = `
      <div class="dash-chart-empty">
        <svg class="dash-chart-empty__art" viewBox="0 0 120 60" aria-hidden="true">
          <defs><linearGradient id="emptySpark" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0"/>
            <stop offset="50%" stop-color="currentColor" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
          </linearGradient></defs>
          <path d="M2 50 Q 30 50 36 36 T 60 30 T 90 18 T 118 12" fill="none" stroke="url(#emptySpark)" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 3"/>
        </svg>
        <p class="dash-chart-empty__title">Käyrä alkaa täältä.</p>
        <p class="dash-chart-empty__sub">Tee yksi harjoitus, niin näet ensimmäisen pisteen.</p>
      </div>`;
    return;
  }

  const VW = 440, VH = 130;
  const PL = 26, PR = 12, PT = 10, PB = 20;
  const CW = VW - PL - PR;
  const CH = VH - PT - PB;
  const n = pts.length;

  const cx = (i) => PL + (n === 1 ? CW / 2 : (i / (n - 1)) * CW);
  const cy = (g) => PT + CH - (g / 6) * CH;

  let s = [];

  // Horizontal-only grid + axis labels (sourced: shadcn line chart aesthetic
  // — CartesianGrid vertical={false}, no axis lines, only labels). Tokens
  // pulled via currentColor so we can drive both via the SVG's parent
  // `style="color: var(--ink-faint)"`.
  GRADES.forEach((g, i) => {
    const yy = cy(i).toFixed(1);
    s.push(`<line x1="${PL}" y1="${yy}" x2="${VW - PR}" y2="${yy}" stroke="currentColor" stroke-opacity="0.10" stroke-width="0.6"/>`);
    s.push(`<text x="${PL - 4}" y="${(cy(i) + 3.5).toFixed(1)}" text-anchor="end" font-size="7.5" fill="currentColor" fill-opacity="0.55" font-family="DM Mono,monospace">${g}</text>`);
  });

  if (n > 1) {
    // Catmull-Rom → cubic-Bezier (sourced: shadcn `<Line type="natural">`
    // produces a natural cubic spline — Recharts uses Catmull-Rom under the
    // hood; ported by hand here so we stay vanilla SVG).
    const xs = pts.map((_, i) => cx(i));
    const ys = pts.map((g) => cy(g));
    let pathD = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0x = xs[Math.max(0, i - 1)],     p0y = ys[Math.max(0, i - 1)];
      const p1x = xs[i],                       p1y = ys[i];
      const p2x = xs[i + 1],                   p2y = ys[i + 1];
      const p3x = xs[Math.min(n - 1, i + 2)], p3y = ys[Math.min(n - 1, i + 2)];
      const c1x = p1x + (p2x - p0x) / 6;
      const c1y = p1y + (p2y - p0y) / 6;
      const c2x = p2x - (p3x - p1x) / 6;
      const c2y = p2y - (p3y - p1y) / 6;
      pathD += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2x.toFixed(1)} ${p2y.toFixed(1)}`;
    }

    const firstX = xs[0].toFixed(1);
    const lastX  = xs[n - 1].toFixed(1);
    const bottom = (VH - PB).toFixed(1);
    // Area under the curve uses the same Catmull-Rom path, then closes
    // along the bottom — gradient pulls from --accent so dark mode flips.
    s.push(`<defs><linearGradient id="dashChartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`);
    s.push(`<path d="${pathD} L ${lastX} ${bottom} L ${firstX} ${bottom} Z" fill="url(#dashChartGrad)"/>`);
    s.push(`<path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  // Endpoint dot only (shadcn style: `dot={false}` on the line itself; we
  // keep just the most recent point so the user sees where they are now).
  if (n >= 1) {
    const px = cx(n - 1).toFixed(1);
    const py = cy(pts[n - 1]).toFixed(1);
    s.push(`<circle cx="${px}" cy="${py}" r="6" fill="var(--accent)" opacity="0.18"/>`);
    s.push(`<circle cx="${px}" cy="${py}" r="3.5" fill="var(--accent)"/>`);
    s.push(`<circle cx="${px}" cy="${py}" r="1.4" fill="var(--surface)"/>`);
  }

  el.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" style="width:100%;height:130px;display:block;color:var(--ink-faint)">${s.join("")}</svg>`;
}

function renderHeatmap(chartData) {
  const el = $("dash-heatmap");
  if (!el) return;

  // Aggregate per-day stats
  const dayStats = {};
  for (const log of chartData) {
    if (!log.createdAt) continue;
    const day = log.createdAt.slice(0, 10);
    if (!dayStats[day]) dayStats[day] = { count: 0, correct: 0, total: 0 };
    dayStats[day].count++;
    dayStats[day].correct += log.scoreCorrect || 0;
    dayStats[day].total += log.scoreTotal || 0;
  }

  const today = new Date();
  const dayLabels = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];

  // Find the Monday that starts our 5-week window
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);
  // Align to Monday (JS: 0=Sun, 1=Mon)
  while (startDate.getDay() !== 1) startDate.setDate(startDate.getDate() - 1);

  // Calculate number of weeks to cover up to today
  const msPerDay = 86400000;
  const totalDays = Math.ceil((today - startDate) / msPerDay) + 1;
  const numWeeks = Math.ceil(totalDays / 7);

  // Build grid: 7 rows × numWeeks columns (grid-auto-flow: column)
  let html = "";

  // Day labels column
  for (let row = 0; row < 7; row++) {
    const show = row === 0 || row === 2 || row === 4 || row === 6;
    html += `<div class="heatmap-label">${show ? dayLabels[row] : ""}</div>`;
  }

  // Cell columns (one column per week)
  for (let w = 0; w < numWeeks; w++) {
    for (let row = 0; row < 7; row++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + w * 7 + row);
      const key = d.toISOString().slice(0, 10);
      const isFuture = d > today;
      const stats = dayStats[key];
      const count = stats ? stats.count : 0;

      let lvl = "";
      if (isFuture) lvl = "future";
      else if (count >= 8) lvl = "lvl-4";
      else if (count >= 4) lvl = "lvl-3";
      else if (count >= 1) lvl = "lvl-2";

      // Tooltip
      const dd = d.getDate();
      const mm = d.getMonth() + 1;
      const yyyy = d.getFullYear();
      const dateStr = `${dd}.${mm}.${yyyy}`;
      let tip = dateStr;
      if (isFuture) {
        tip = dateStr;
      } else if (count === 0) {
        tip = `${dateStr} — ei harjoituksia`;
      } else {
        const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        tip = `${dateStr} — ${count} harjoitus${count > 1 ? "ta" : ""}`
            + (stats.total > 0 ? `, ${pct}% oikein` : "");
      }

      html += `<div class="heatmap-cell ${lvl}" data-tip="${tip}"></div>`;
    }
  }

  el.style.setProperty("--heatmap-cols", numWeeks + 1); // +1 for label col
  el.innerHTML = html;

  // Empty-state caption — render a friendly Finnish nudge when no day in
  // the 30-day window has activity yet. Lives in the section, not over the grid.
  const section = el.closest(".dash-heatmap-section");
  if (section) {
    let cap = section.querySelector(".dash-heatmap-empty");
    const totalDaysWithActivity = Object.values(dayStats).filter((s) => s.count > 0).length;
    if (totalDaysWithActivity === 0) {
      if (!cap) {
        cap = document.createElement("p");
        cap.className = "dash-heatmap-empty";
        section.appendChild(cap);
      }
      cap.textContent = "Tee ensimmäinen harjoitus, niin sytytät tästä päivän.";
    } else if (cap) {
      cap.remove();
    }
  }

  // Tooltip on hover
  el.addEventListener("pointerenter", (e) => {
    const cell = e.target.closest(".heatmap-cell[data-tip]");
    if (!cell) return;
    let tooltip = el.querySelector(".heatmap-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "heatmap-tooltip";
      el.appendChild(tooltip);
    }
    tooltip.textContent = cell.dataset.tip;
    tooltip.classList.add("visible");
    const r = cell.getBoundingClientRect();
    const pr = el.getBoundingClientRect();
    tooltip.style.left = (r.left - pr.left + r.width / 2) + "px";
    tooltip.style.top = (r.top - pr.top - 30) + "px";
  }, true);
  el.addEventListener("pointerleave", (e) => {
    if (e.target.classList.contains("heatmap-cell")) {
      const t = el.querySelector(".heatmap-tooltip");
      if (t) t.classList.remove("visible");
    }
  }, true);
}

function renderRecommendations(modeDaysAgo, modeStats, totalSessions) {
  const recWrap = $("dash-recommendations");
  const recList = $("dash-rec-list");
  if (!recWrap || !recList) return;

  const recs = [];

  const modeNames = { vocab: "Sanasto", grammar: "Kielioppi", reading: "Luetun ymmärtäminen", writing: "Kirjoittaminen" };

  for (const [mode, name] of Object.entries(modeNames)) {
    const daysAgo = modeDaysAgo[mode];
    if (daysAgo === null && totalSessions > 0) {
      recs.push({ icon: MODE_ICONS[mode], text: `Kokeile: ${name}`, sub: "Et ole vielä kokeillut tätä osa-aluetta", mode });
    } else if (daysAgo >= 5) {
      recs.push({ icon: MODE_ICONS[mode], text: `Palaa harjoittelemaan: ${name}`, sub: `${daysAgo} päivää sitten viimeksi`, mode });
    }
  }

  const gramStats = modeStats.grammar;
  if (gramStats && gramStats.avgPct != null && gramStats.avgPct < 60) {
    recs.push({ icon: icon("warn"), text: "Kielioppi kaipaa harjoittelua", sub: `Keskiarvo ${gramStats.avgPct}% — tavoite 70%+`, mode: "grammar" });
  }

  if (totalSessions >= 5 && totalSessions % 10 === 0) {
    recs.push({ icon: icon("graduate"), text: "Kokeile koeharjoitusta", sub: "Testaa taitosi simuloidussa kokeessa", mode: "exam" });
  }

  if (recs.length === 0) {
    recWrap.classList.add("hidden");
    return;
  }

  recWrap.classList.remove("hidden");
  recList.innerHTML = "";
  for (const rec of recs.slice(0, 3)) {
    const card = document.createElement("div");
    card.className = "dash-rec-card";
    card.innerHTML = `<span class="dash-rec-icon">${rec.icon}</span><div><div class="dash-rec-text">${rec.text}</div><div class="dash-rec-sub">${rec.sub}</div></div>`;
    card.addEventListener("click", () => navigateToMode(rec.mode));
    recList.appendChild(card);
  }
}

async function loadExamHistory() {
  const el = $("dash-exam-history");
  if (!el) return;
  try {
    // L-LIVE-AUDIT-P2 UPDATE 3 — read from batched v2 payload first.
    let exams;
    const cached = getDashboardV2Section("examHistory");
    if (cached?.exams) {
      exams = cached.exams;
    } else {
      const res = await apiFetch(`${API}/api/exam/history`, { headers: authHeader() });
      if (!res.ok) { el.innerHTML = ""; return; }
      ({ exams } = await res.json());
    }
    if (!exams || exams.length === 0) { el.innerHTML = ""; return; }

    let html = '<div class="dash-section-label" style="margin-top:8px">Aiemmat kokeet</div>';
    for (const ex of exams.slice(0, 5)) {
      const date = ex.ended_at ? new Date(ex.ended_at).toLocaleDateString("fi-FI") : "—";
      html += `<div class="dash-exam-history-item">
        <div>
          <span>${date}</span>
          <span style="color:var(--ink-soft);margin-left:8px">${ex.total_points}/${ex.max_points}p</span>
        </div>
        <div class="dash-exam-history-grade">${ex.final_grade || "—"}</div>
      </div>`;
    }
    el.innerHTML = html;
  } catch {
    el.innerHTML = "";
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
  // logged in — the user did the work, the dashboard should show the
  // celebratory state.
  markModeCompletedToday(mode);
  if (!isLoggedIn()) return;
  try {
    await apiFetch(`${API}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ mode, level, scoreCorrect, scoreTotal, ytlGrade }),
    });
  } catch { /* silently skip — never disrupt UX */ }
}

const GRADE_NAMES = { I: "Improbatur", A: "Approbatur", B: "Lubenter", C: "Cum laude", M: "Magna", E: "Eximia", L: "Laudatur" };
const SECTION_LABELS = { vocab: "Sanasto", grammar: "Kielioppi", reading: "Luetun ymmärtäminen", writing: "Kirjoittaminen" };
const GRADE_ORDER_LOCAL = ["I","A","B","C","M","E","L"];

function renderGradeWidget(estimate) {
  const { tier, grade, confidence = 0, coverage = {}, total = 0 } = estimate;

  const card = $("dash-hero-grade");
  const circle = $("dash-grade-circle");
  const label = $("dash-hero-label");
  const scale = $("dash-hero-scale");
  const conf = $("dash-hero-confidence");
  const sub = $("dash-hero-sub");
  const caption = $("dash-hero-caption");
  if (!card) return;

  card.className = `dash-hero-grade dash-hero-grade--tier-${tier}`;
  card.onclick = () => openGradeExplainer(estimate);

  // Reset
  circle.textContent = "—";
  scale.classList.add("hidden");
  conf.classList.add("hidden");
  caption.classList.add("hidden");

  if (tier === "none") {
    label.textContent = "Arvioitu yo-taso";
    sub.textContent = "Tee 10 harjoitusta 3 osa-alueesta — sitten arvio.";
    return;
  }

  // Common: show grade letter (sized via CSS per tier) + name
  circle.textContent = grade || "—";
  sub.textContent = grade ? (GRADE_NAMES[grade] || "") : "";

  if (tier === "preliminary") {
    label.textContent = "Alustava taso";
    return;
  }

  // estimated / full — show scale + confidence
  label.textContent = tier === "full" ? "Arvioitu yo-arvosana" : "Arvioitu yo-taso";
  scale.classList.remove("hidden");
  const gIdx = GRADE_ORDER_LOCAL.indexOf(grade);
  scale.querySelectorAll("span").forEach((s) => {
    const idx = GRADE_ORDER_LOCAL.indexOf(s.dataset.g);
    s.classList.remove("is-current", "scale-passed");
    if (idx === gIdx) s.classList.add("is-current");
    else if (gIdx >= 0 && idx < gIdx) s.classList.add("scale-passed");
  });

  const filled = Math.max(0, Math.min(5, confidence));
  conf.textContent = `${"■".repeat(filled)}${"□".repeat(5 - filled)} ${filled}/5`;
  conf.classList.remove("hidden");

  if (tier === "full") {
    const today = new Date().toLocaleDateString("fi-FI");
    caption.textContent = `päivitetty ${today}`;
    caption.classList.remove("hidden");
  }
}

function openGradeExplainer(estimate) {
  const { tier, coverage = {}, total = 0, confidence = 0, grade } = estimate;
  const body = $("grade-explainer-body");
  const backdrop = $("grade-explainer-backdrop");
  if (!body || !backdrop) return;

  const rows = ["vocab", "grammar", "reading", "writing"].map((s) => {
    const n = coverage[s] ?? 0;
    const enough = n >= 10 ? "✓" : "○";
    return `<li><span class="grade-explainer-section">${enough} ${SECTION_LABELS[s]}</span><span class="grade-explainer-count">${n} harjoitusta</span></li>`;
  }).join("");

  const filled = Math.max(0, Math.min(5, confidence));
  const confBar = `${"■".repeat(filled)}${"□".repeat(5 - filled)}`;

  const tierCopy = {
    none: `Tarvitset vähintään 10 harjoitusta ennen alustavaa arviota. Tehty tähän mennessä: <strong>${total}</strong>.`,
    preliminary: `Alustava arvio <strong>${grade || "—"}</strong> perustuu pieneen määrään harjoituksia (<strong>${total}</strong>). Arvio tarkentuu kun teet lisää.`,
    estimated: `Arvio <strong>${grade || "—"}</strong> perustuu <strong>${total}</strong> harjoitukseen. Varmuustaso ${confBar} ${filled}/5.`,
    full: `Arvio <strong>${grade || "—"}</strong> perustuu <strong>${total}</strong> harjoitukseen kattavasti kaikilta neljältä osa-alueelta. Varmuustaso ${confBar} ${filled}/5.`,
  };

  body.innerHTML = `
    <p class="grade-explainer-summary">${tierCopy[tier]}</p>
    <p class="grade-explainer-subhead">Kattavuus osa-alueittain</p>
    <ul class="grade-explainer-sections">${rows}</ul>
  `;
  backdrop.classList.remove("hidden");
}

function closeGradeExplainer() {
  const backdrop = $("grade-explainer-backdrop");
  if (backdrop) backdrop.classList.add("hidden");
}

(function wireGradeExplainer() {
  const closeBtn = typeof document !== "undefined" ? document.getElementById("grade-explainer-close") : null;
  const backdrop = typeof document !== "undefined" ? document.getElementById("grade-explainer-backdrop") : null;
  if (closeBtn) closeBtn.addEventListener("click", closeGradeExplainer);
  if (backdrop) backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeGradeExplainer(); });
  if (typeof document !== "undefined") {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeGradeExplainer();
    });
  }
})();

async function updateSrBadge() {
  const count = await srDueCount("spanish");

  // Update the unified CTA now that we have the async SR count
  const ctaEl = document.getElementById("dash-day-cta");
  if (ctaEl) {
    renderDashboardCta(ctaEl, {
      profileComplete: window._userProfile?.onboarding_completed === true,
      srDueCount: count,
      weakestTopic: ctaEl.dataset.weakestTopic || null,
    });
  }

  // Forecast chart
  renderSrForecast().catch(() => {});
}

async function renderSrForecast() {
  if (!isLoggedIn()) return;
  const section = $("dash-forecast-section");
  const chart = $("dash-forecast-chart");
  if (!section || !chart) return;

  try {
    // L-LIVE-AUDIT-P2 UPDATE 3 — read from batched v2 payload first.
    let data = getDashboardV2Section("srForecast");
    if (!data) {
      const res = await apiFetch(`${API}/api/sr/forecast?days=30`, { headers: authHeader() });
      if (!res.ok) return;
      data = await res.json();
    }

    if (!data.totalCards) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    $("dash-forecast-total").textContent = data.totalCards;
    $("dash-forecast-max").textContent = data.maxDaily;

    const maxCount = Math.max(data.maxDaily, 1);
    const bars = data.forecast.map((day, i) => {
      const heightPct = day.count > 0 ? Math.max((day.count / maxCount) * 100, 8) : 2;
      const klass = i === 0 ? "today" : (day.count > 0 ? "has-cards" : "");
      const showLabel = i === 0 || i % 7 === 0 || i === data.forecast.length - 1;
      const dateLabel = i === 0 ? "tänään" : showLabel ? `+${i}pv` : "";
      return `<div class="forecast-bar ${klass}" style="height: ${heightPct}%" title="${day.date}: ${day.count} korttia"${dateLabel ? ` data-label="${dateLabel}"` : ""}>
        ${dateLabel ? `<span class="forecast-bar-label">${dateLabel}</span>` : ""}
      </div>`;
    });

    chart.innerHTML = bars.join("");
  } catch { /* silent */ }
}

function renderAiUsage(aiUsage, isPro) {
  const el = $("dash-ai-usage");
  if (!el || !aiUsage) { if (el) el.classList.add("hidden"); return; }

  if (aiUsage.callCount > 0) {
    el.textContent = `🤖 AI-kutsuja tässä kuussa: ${aiUsage.callCount}`;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
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

// ─── Adaptive level progress (removed — bar deleted from UI) ──────────────
// loadAdaptiveState() no-op kept so any lingering call sites don't throw
async function loadAdaptiveState() {}

async function startCheckpoint() {
  showLoading("Luodaan checkpoint-testiä...");
  try {
    const res = await apiFetch(`${API}/api/checkpoint/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ language: state.language || "spanish" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkpoint-virhe");

    // Use the existing exercise flow for checkpoint
    state.mode = "checkpoint";
    state.exercises = data.exercises;
    state.current = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
    state.batchCorrect = 0;
    state.batchNumber = 1;
    state._checkpointTarget = data.targetLevel;

    // Import and call renderExercise from vocab
    const { default: vocabModule } = await import("./vocab.js");
    show("screen-exercise");
  } catch (err) {
    const { showLoadingError } = await import("../ui/loading.js");
    showLoadingError(err.message, () => show("screen-dashboard"));
  }
}

// ─── Weak topics (mistake taxonomy) ───────────────────────────────────────

async function loadWeakTopics() {
  if (!isLoggedIn()) return;
  const wrap = $("dash-weak-topics");
  const list = $("dash-weak-list");
  if (!wrap || !list) return;

  try {
    // L-LIVE-AUDIT-P2 UPDATE 3 — read from batched v2 payload first.
    let data = getDashboardV2Section("weakTopics");
    if (!data) {
      const res = await apiFetch(`${API}/api/weak-topics?days=7`, { headers: authHeader() });
      if (!res.ok) return;
      data = await res.json();
    }
    const topics = data.topics || [];

    if (topics.length === 0) {
      wrap.classList.add("hidden");
      return;
    }

    // Propagate weakest topic into the CTA dataset so updateSrBadge can use it on re-render
    const weakestTopic = topics[0]?.topic || null;
    const ctaEl = document.getElementById("dash-day-cta");
    if (ctaEl) {
      ctaEl.dataset.weakestTopic = weakestTopic || "";
      // Re-render CTA only if it is currently showing the drill state (not overridden by SR/onboarding)
      if (ctaEl.dataset.kind === "drill") {
        renderDashboardCta(ctaEl, {
          profileComplete: window._userProfile?.onboarding_completed === true,
          srDueCount: 0,
          weakestTopic,
        });
      }
    }

    wrap.classList.remove("hidden");
    const maxCount = topics[0]?.count || 1;

    const blogs = await Promise.all(topics.map(t => getBlogForTopic(t.topic)));

    list.innerHTML = "";
    topics.forEach((t, i) => {
      const blog = blogs[i];
      const row = document.createElement("div");
      row.className = "dash-weak__row";
      row.dataset.topic = t.topic;
      row.innerHTML = `
        <span class="dash-weak__n mono-num mono-num--md">${String(i + 1).padStart(2, "0")}</span>
        <span class="dash-weak__name">${escapeHtml(t.label || t.topic || "")}</span>
        ${blog ? `<a class="dash-weak__blog" href="${blog.url}" target="_blank" rel="noopener" data-topic-key="${blog.key}" data-topic-url="${blog.url}">Lue aiheesta →</a>` : ""}
        <span class="dash-weak__err mono-num mono-num--sm">${t.count} virhettä</span>
        <span class="dash-weak__pct mono-num mono-num--sm">${Math.round((t.count / maxCount) * 100)}%</span>
      `;
      if (blog) {
        row.querySelector(".dash-weak__blog").addEventListener("click", (e) => {
          e.stopPropagation();
          trackBlogClick("dashboard_weak_topic", blog.key, blog.url);
        });
      }
      row.addEventListener("click", (e) => {
        if (e.target.closest(".dash-weak__blog")) return;
        openMistakeModal(t.topic);
      });
      list.appendChild(row);
    });
  } catch { /* silent */ }
}

async function openMistakeModal(topic) {
  const overlay = $("mistake-modal-overlay");
  const topicEl = $("mistake-modal-topic");
  const subEl = $("mistake-modal-sub");
  const listEl = $("mistake-modal-list");
  const ctaBtn = $("mistake-modal-practice");
  if (!overlay) return;

  try {
    const res = await apiFetch(`${API}/api/mistakes-by-topic/${topic}?days=7`, {
      headers: authHeader(),
    });
    if (!res.ok) return;
    const data = await res.json();
    const mistakes = data.mistakes || [];

    topicEl.textContent = data.label || topic;
    subEl.textContent = `${mistakes.length} virhe${mistakes.length !== 1 ? "ttä" : ""} viimeisen 7 päivän aikana`;

    listEl.innerHTML = mistakes.length ? mistakes.map(m => `
      <div class="mistake-modal-item">
        <div class="mistake-modal-q">${escapeHtml(m.question || "")}</div>
        <div class="mistake-modal-answers">
          <span class="mistake-modal-wrong">✗ ${escapeHtml(m.wrong_answer || "")}</span><br>
          <span class="mistake-modal-correct">✓ ${escapeHtml(m.correct_answer || "")}</span>
        </div>
        ${m.explanation ? `<div class="mistake-modal-expl">${escapeHtml(m.explanation)}</div>` : ""}
      </div>
    `).join("") : '<p style="color:var(--ink-soft);font-family:var(--font-mono);font-size:13px">Ei virheitä tällä aikavälillä.</p>';

    ctaBtn.onclick = () => startFocusSession(topic);

    overlay.classList.remove("hidden");
  } catch { /* silent */ }
}

function closeMistakeModal() {
  const overlay = $("mistake-modal-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

async function startFocusSession(topic) {
  closeMistakeModal();
  showLoading("Luodaan teemaharjoitusta...");
  try {
    const res = await apiFetch(`${API}/api/focus-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ topic, count: 10, language: state.language || "spanish" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Harjoituksen luonti epäonnistui");

    state.mode = "vocab";
    state.topic = topic;
    state.exercises = data.exercises;
    state.current = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
    state.batchCorrect = 0;
    state.batchNumber = 1;
    state.level = data.level || "B";
    state.peakLevel = state.level;
    state._focusMode = true;

    show("screen-exercise");
    // Trigger render via vocab module
    const vocabMod = await import("./vocab.js");
    if (vocabMod.renderExercise) vocabMod.renderExercise();
    else window.dispatchEvent(new CustomEvent("puheo:render-exercise"));
  } catch (err) {
    const { showLoadingError } = await import("../ui/loading.js");
    showLoadingError(err.message, () => show("screen-dashboard"));
  }
}

// Wire up modal close
(function() {
  const overlay = document.getElementById("mistake-modal-overlay");
  const closeBtn = document.getElementById("mistake-modal-close");
  if (closeBtn) closeBtn.addEventListener("click", closeMistakeModal);
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeMistakeModal();
    });
  }
})();

// ─── Writing per-dimension progression bars ────────────────────────────────

function renderWritingProgression() {
  const wrap = $("dash-writing-progression");
  if (!wrap) return;

  const dims = getRecentWritingDimensions(5);
  if (!dims) {
    wrap.classList.add("hidden");
    return;
  }

  wrap.classList.remove("hidden");

  const order = ["viestinnallisyys", "kielen_rakenteet", "sanasto", "kokonaisuus"];
  let html = '<div class="dash-writing-progression-title">Kirjoittamisen osa-alueet · viimeiset 5 kertaa</div>';
  for (const k of order) {
    const d = dims[k];
    if (!d || typeof d.avg !== "number" || !Number.isFinite(d.avg)) continue;
    const pct = Math.round((d.avg / 5) * 100);
    const cls = d.avg >= 3.5 ? "" : d.avg >= 2.5 ? "is-mid" : "is-weak";
    // Suomalainen desimaalipilkku — "3,5/5" eikä "3.5 / 5".
    const score = `${d.avg.toFixed(1).replace(".", ",")}/5`;
    // Vain merkityksellinen suunta näkyy — flat-merkki näyttää keskeneräiseltä
    // markdownilta vieressä olevan etiketin kanssa.
    const trendMarkup = (d.trend === "up" || d.trend === "down")
      ? ` <span class="dash-wp-trend ${d.trend}" aria-label="${d.trend === "up" ? "noussut" : "laskenut"}">${d.trend === "up" ? "↑" : "↓"}</span>`
      : "";
    html += `
      <div class="dash-wp-row">
        <span class="dash-wp-label">${d.label}${trendMarkup}</span>
        <span class="dash-wp-score">${score}</span>
        <div class="dash-wp-bar"><div class="dash-wp-bar-fill ${cls}" style="width:${pct}%"></div></div>
      </div>
    `;
  }
  wrap.innerHTML = html;
}

// ─── Right rail (top user card + Pro upsell or daily peek) ───────────────

function railInitials(email) {
  if (!email) return "—";
  const handle = email.split("@")[0] || "";
  const parts = handle.split(/[._\-+]+/).filter(Boolean);
  if (parts.length === 0) return handle.slice(0, 2).toUpperCase() || "—";
  if (parts.length === 1) {
    const p = parts[0];
    return (p.length >= 2 ? p.slice(0, 2) : p[0]).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function renderRail({ pro, streak }) {
  // L-PLAN-4 UPDATE 4 — the right rail is gone. The avatar / Pro badge that
  // used to live here now belongs to the floating profile button (top-right).
  // We forward the Pro flag to it so the upgrade item shows / hides correctly.
  if (window._profileMenuRef?.syncProfileMenu) {
    try { window._profileMenuRef.syncProfileMenu({ pro: !!pro }); } catch { /* noop */ }
  }

  // Pro upsell popup — bottom-right, free users only, 5s delay, 7-day suppress.
  if (!pro) wireProPopup();
}

let _proPopupWired = false;
function wireProPopup() {
  if (_proPopupWired) return;
  _proPopupWired = true;

  const popup = document.getElementById("pro-popup");
  const closeBtn = document.getElementById("pro-popup-close");
  const ctaBtn = document.getElementById("pro-popup-cta");
  if (!popup || !closeBtn || !ctaBtn) return;

  const KEY = "puheo_pro_popup_dismissed";
  const SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  let dismissedAt = 0;
  try { dismissedAt = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (_) { /* ignore */ }
  if (Date.now() - dismissedAt < SUPPRESS_MS) return;

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  setTimeout(() => {
    if (window._isPro) return;
    popup.hidden = false;
    if (!reduceMotion) requestAnimationFrame(() => popup.classList.add("is-visible"));
    else popup.classList.add("is-visible");
  }, 5000);

  const dismiss = () => {
    popup.classList.remove("is-visible");
    try { localStorage.setItem(KEY, String(Date.now())); } catch (_) { /* ignore */ }
    setTimeout(() => { popup.hidden = true; }, reduceMotion ? 0 : 320);
  };

  closeBtn.addEventListener("click", dismiss);
  ctaBtn.addEventListener("click", () => {
    if (typeof _deps?.startCheckout === "function") _deps.startCheckout();
  });
}

// ─── YO-koe readiness map ──────────────────────────────────────────────────

async function loadAndRenderReadinessMap() {
  const wrap = $("dash-readiness");
  if (!wrap) return;
  if (!isLoggedIn()) {
    wrap.classList.add("hidden");
    return;
  }

  // L-HOME-HOTFIX-2 — readiness now mirrors curriculum progress (lessons
  // completed across the 8 courses). The old SR-mastery map showed 20 % when
  // the student had completed 1 / 86 lessons (data was inherited from the
  // pre-curriculum vocab/grammar drills) which contradicted the course cards.
  let kurssit = [];
  try {
    const res = await apiFetch(`${API}/api/curriculum`, { headers: authHeader() });
    if (res.ok) {
      const data = await res.json();
      kurssit = Array.isArray(data?.kurssit) ? data.kurssit : [];
    }
  } catch { /* network — show empty */ }

  const totalCells = kurssit.length;
  if (totalCells === 0) {
    wrap.classList.add("hidden");
    return;
  }

  let totalLessons = 0;
  let completedLessons = 0;
  let masteredCells = 0;
  const cells = kurssit.map((k) => {
    const total = Number(k.lessonCount) || 0;
    const done = Math.min(Number(k.lessonsCompleted) || 0, total);
    totalLessons += total;
    completedLessons += done;
    const isMastered = !!k.kertausPassed;
    if (isMastered) masteredCells += 1;
    let level = 0;
    if (isMastered) level = 4;
    else if (total > 0 && done / total >= 0.5) level = 3;
    else if (done > 0) level = 2;
    else if (k.isUnlocked) level = 1;
    const tip = `${k.title}: ${done} / ${total} oppituntia${isMastered ? " · suoritettu" : ""}`;
    return { level, tooltip: tip };
  });
  const readinessPct = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  wrap.classList.remove("hidden");

  const railReadinessEl = document.getElementById("dash-yo-readiness");
  if (railReadinessEl) {
    const safePct = Number.isFinite(readinessPct) ? readinessPct : 0;
    countUp(railReadinessEl, safePct, 1300);
  }

  const ringEl = document.getElementById("dash-yo-readiness-ring");
  if (ringEl) {
    const C = 213.628;
    const pct = Math.max(0, Math.min(100, readinessPct));
    requestAnimationFrame(() => {
      ringEl.style.strokeDashoffset = String(C - (pct / 100) * C);
    });
  }

  const cellsHtml = cells.map(c =>
    `<div class="dash-readiness-cell lvl-${c.level}" data-tip="${escapeHtmlAttr(c.tooltip)}" data-tooltip="${escapeHtmlAttr(c.tooltip)}"></div>`
  ).join("");

  const qual = readinessQualitative(readinessPct, totalCells);

  wrap.innerHTML = `
    <div class="dash-readiness-title">YO-valmius</div>
    <div class="dash-readiness-headline">
      <span class="dash-readiness-pct">${readinessPct}%</span>
      <span class="dash-readiness-pct-label">valmius</span>
    </div>
    <div class="dash-readiness-track" role="progressbar"
         aria-valuenow="${readinessPct}" aria-valuemin="0" aria-valuemax="100"
         aria-label="YO-valmius">
      <div class="dash-readiness-track__fill" style="width:${Math.max(0, Math.min(100, readinessPct))}%"></div>
    </div>
    <div class="dash-readiness-summary">
      <strong>${masteredCells}</strong> / ${totalCells} kurssia hallinnassa · <strong>${completedLessons}</strong> / ${totalLessons} oppituntia${qual ? ` · <span class="dash-readiness-qual">${qual}</span>` : ""}
    </div>
    <div class="dash-readiness-grid">${cellsHtml}</div>
  `;
}

// L48-hotfix Update 3 — qualitative readiness label.
// Thresholds: <25 alkuvaiheessa, 25–49 hyvässä vauhdissa,
// 50–74 hyvin hallussa, ≥75 erinomaisesti. Empty cells → no label.
function readinessQualitative(pct, total) {
  if (!total) return "";
  if (pct >= 75) return "erinomaisesti";
  if (pct >= 50) return "hyvin hallussa";
  if (pct >= 25) return "hyvässä vauhdissa";
  return "alkuvaiheessa";
}

function escapeHtmlAttr(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
