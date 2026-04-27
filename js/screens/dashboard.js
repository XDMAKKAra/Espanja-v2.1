import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, clearAuth, authHeader, apiFetch, getAuthEmail } from "../api.js";
import { state } from "../state.js";
import { showLoading } from "../ui/loading.js";
import { srDueCount } from "../features/spacedRepetition.js";
import { renderAdaptiveCard } from "./adaptive.js";
import { getBlogForTopic, trackBlogClick } from "../features/topicBlogMap.js";
import { icon, MODE_ICONS } from "../ui/icons.js";
import { getRecentWritingDimensions, computeReadinessMap } from "../features/writingProgression.js";
import { hideAppCountdown } from "./onboarding.js";
import { renderDashboardCta } from "./dash-cta.js";

let _deps = {};
export function initDashboard({ loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, loadNextBatch, showProUpsell }) {
  _deps = { loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, loadNextBatch, showProUpsell };
}

export const MODE_META = {
  vocab:   { icon: MODE_ICONS.vocab,   name: "Sanasto" },
  grammar: { icon: MODE_ICONS.grammar, name: "Kielioppi" },
  reading: { icon: MODE_ICONS.reading, name: "Luetun ymmärtäminen" },
  writing: { icon: MODE_ICONS.writing, name: "Kirjoittaminen" },
};

export async function loadDashboard() {
  showLoading("Ladataan...");
  try {
    const res = await apiFetch(`${API}/api/dashboard`, { headers: authHeader() });
    if (res.status === 401) {
      clearAuth();
      show("screen-auth");
      return;
    }
    const data = await res.json();
    renderDashboard(data);
    // Hide the top-bar countdown on the dashboard — it overlaps the greeting
    // and will be replaced by an in-rail countdown in Task 11.
    hideAppCountdown();
    show("screen-dashboard");
  } catch {
    show("screen-start");
  }
}

function renderDashboard({
  totalSessions, modeStats, recent, chartData = [], estLevel = null,
  gradeEstimate = null,
  streak = 0, weekSessions = 0, prevWeekSessions = 0,
  suggestedLevel = "B", modeDaysAgo = {}, pro = false,
  aiUsage = null,
}) {
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
  const name = getAuthEmail() ? getAuthEmail().split("@")[0] : "sinä";
  $("dash-username").textContent = name;

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
    if (totalSessions === 0) {
      motivationEl.textContent = "Aloita ensimmäinen harjoitus!";
    } else if (streak >= 7) {
      motivationEl.textContent = `🔥 Viikon putki — fantastista!`;
    } else if (streak >= 3) {
      motivationEl.textContent = `⚡ ${streak} päivän putki — jatka niin!`;
    } else if (streak === 0) {
      motivationEl.textContent = "Jatka harjoittelua tänään!";
    } else {
      motivationEl.textContent = `${totalSessions} harjoitusta tehty — hienoa työtä!`;
    }
  }

  // TODO: removed in T8 (unified into dash-day-cta) — .dash-onboarding-banner deleted from app.html

  renderGradeWidget(gradeEstimate || { tier: "none", grade: null, confidence: 0, coverage: {}, total: totalSessions || 0 });

  // ── Adaptive level progress bar ──
  loadAdaptiveState().catch(() => {});

  // ── Weak topics ──
  loadWeakTopics().catch(() => {});

  const streakEl = $("dash-streak");
  if (streakEl) {
    streakEl.textContent = streak;
    streakEl.className = streak >= 3 ? "dash-stat-value dash-stat-streak-active" : "dash-stat-value";
  }

  const totalEl = $("dash-total-sessions");
  if (totalEl) totalEl.textContent = totalSessions;

  // YO-readiness rail stat — filled async by loadAndRenderReadinessMap below;
  // dash-yo-delta has no delta source yet (TODO: wire when API exposes it).
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
    weekValEl.childNodes[0].textContent = weekSessions;
    if (weekSessions > prevWeekSessions) {
      weekTrendEl.textContent = "↑"; weekTrendEl.className = "week-trend-arrow up";
    } else if (weekSessions < prevWeekSessions && prevWeekSessions > 0) {
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
  modesEl.innerHTML = "";
  for (const [mode, meta] of Object.entries(MODE_META)) {
    const s = modeStats[mode];
    const daysAgo = modeDaysAgo[mode];
    const isDue = daysAgo === null || daysAgo >= 2;
    const card = document.createElement("div");
    card.className = "dash-mode-card" + (s ? " has-data" : "");
    const dueDot = isDue && totalSessions > 0 ? `<span class="dash-mode-due" title="Ei harjoiteltu vähään aikaan"></span>` : "";
    const right = s
      ? (s.bestGrade
          ? `<div class="dash-mode-stat-label">Paras</div><div class="dash-mode-grade">${s.bestGrade}</div>`
          : s.avgPct != null
          ? `<div class="dash-mode-stat-label">Keskim.</div><div class="dash-mode-pct">${s.avgPct}%</div>`
          : "")
      : `<div class="dash-mode-empty">—</div>`;
    card.innerHTML = `
      <div class="dash-mode-left">
        <span class="dash-mode-icon">${meta.icon}</span>
        <div>
          <div class="dash-mode-name">${meta.name}${dueDot}</div>
          <div class="dash-mode-sessions">${s ? `${s.sessions} krt` : "0 krt"}</div>
        </div>
      </div>
      <div class="dash-mode-right">${right}</div>`;

    card.addEventListener("click", () => {
      navigateToMode(mode);
    });
    modesEl.appendChild(card);
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
    $("dash-empty").classList.add("hidden");
    const listEl = $("dash-recent-list");
    listEl.innerHTML = "";
    for (const log of recent) {
      const meta = MODE_META[log.mode] || { icon: icon("document"), name: log.mode };
      const scoreStr =
        log.scoreTotal > 0 ? `${log.scoreCorrect}/${log.scoreTotal}` : "";
      const gradeStr = log.ytlGrade || "";
      const item = document.createElement("div");
      item.className = "dash-recent-item";
      item.innerHTML = `
        <div class="dash-recent-left">
          <span class="dash-recent-icon">${meta.icon}</span>
          <div>
            <div class="dash-recent-mode">${meta.name}${log.level ? ` · taso ${log.level}` : ""}</div>
            <div class="dash-recent-time">${timeAgo(log.createdAt)}</div>
          </div>
        </div>
        <div class="dash-recent-right">
          ${scoreStr ? `<div class="dash-recent-score">${scoreStr}</div>` : ""}
          ${gradeStr ? `<div class="dash-recent-grade">${gradeStr}</div>` : ""}
        </div>`;
      listEl.appendChild(item);
    }
  } else {
    $("dash-recent-wrap").classList.add("hidden");
    $("dash-empty").classList.remove("hidden");
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return "juuri äsken";
  if (mins < 60) return `${mins} min sitten`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} t sitten`;
  const days = Math.floor(hrs / 24);
  return `${days} pv sitten`;
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
    el.innerHTML = `<div class="dash-chart-empty">Tee ensimmäinen harjoitus nähdäksesi kehityksesi!</div>`;
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

  GRADES.forEach((g, i) => {
    const yy = cy(i).toFixed(1);
    s.push(`<line x1="${PL}" y1="${yy}" x2="${VW - PR}" y2="${yy}" stroke="rgba(245,232,224,0.05)" stroke-width="0.6"/>`);
    s.push(`<text x="${PL - 4}" y="${(cy(i) + 3.5).toFixed(1)}" text-anchor="end" font-size="7.5" fill="rgba(245,232,224,0.28)" font-family="DM Mono,monospace">${g}</text>`);
  });

  if (n > 1) {
    const firstX = cx(0).toFixed(1);
    const lastX = cx(n - 1).toFixed(1);
    const bottom = (VH - PB).toFixed(1);
    const lineStr = pts.map((g, i) => `${cx(i).toFixed(1)} ${cy(g).toFixed(1)}`).join(" L ");
    s.push(`<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e63946" stop-opacity="0.22"/><stop offset="100%" stop-color="#e63946" stop-opacity="0"/></linearGradient></defs>`);
    s.push(`<path d="M ${firstX} ${bottom} L ${lineStr} L ${lastX} ${bottom} Z" fill="url(#areaGrad)"/>`);

    const polyPts = pts.map((g, i) => `${cx(i).toFixed(1)},${cy(g).toFixed(1)}`).join(" ");
    s.push(`<polyline points="${polyPts}" fill="none" stroke="#e63946" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  const todayX = cx(n - 1).toFixed(1);
  s.push(`<line x1="${todayX}" y1="${PT}" x2="${todayX}" y2="${VH - PB}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,2" opacity="0.55"/>`);
  s.push(`<text x="${todayX}" y="${VH - 4}" text-anchor="middle" font-size="7" fill="rgba(245,158,11,0.6)" font-family="DM Mono,monospace">tänään</text>`);

  pts.forEach((g, i) => {
    const px = cx(i).toFixed(1);
    const py = cy(g).toFixed(1);
    const isLast = i === n - 1;
    if (isLast) {
      s.push(`<circle cx="${px}" cy="${py}" r="6" fill="#f59e0b" opacity="0.18"/>`);
      s.push(`<circle cx="${px}" cy="${py}" r="3.5" fill="#f59e0b"/>`);
    } else if (n <= 25) {
      s.push(`<circle cx="${px}" cy="${py}" r="2" fill="#e63946" opacity="0.7"/>`);
    }
  });

  el.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" style="width:100%;height:130px;display:block">${s.join("")}</svg>`;
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
    const res = await apiFetch(`${API}/api/exam/history`, { headers: authHeader() });
    if (!res.ok) { el.innerHTML = ""; return; }
    const { exams } = await res.json();
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
    sub.textContent = "Tee vähintään 10 harjoitusta 3 eri osa-alueesta, jotta voimme arvioida YO-tasoasi.";
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
  // TODO: removed in T8 (unified into dash-day-cta) — .sr-top-bar and .dash-sr-review deleted from app.html
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
    const res = await apiFetch(`${API}/api/sr/forecast?days=30`, {
      headers: authHeader(),
    });
    if (!res.ok) return;
    const data = await res.json();

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

// ─── Adaptive level progress ──────────────────────────────────────────────

async function loadAdaptiveState() {
  if (!isLoggedIn()) return;
  const progressEl = $("dash-level-progress");
  if (!progressEl) return;

  try {
    const res = await apiFetch(`${API}/api/adaptive-state`, {
      headers: authHeader(),
    });
    if (!res.ok) return;
    const data = await res.json();

    progressEl.classList.remove("hidden");

    const currentEl = $("dash-level-current");
    const nextEl = $("dash-level-next");
    const fillEl = $("dash-level-fill");
    const detailEl = $("dash-level-detail");
    const checkBtn = $("btn-checkpoint");

    if (currentEl) currentEl.textContent = data.level;
    if (nextEl) nextEl.textContent = data.nextLevel || "MAX";

    // Animate progress bar
    if (fillEl) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fillEl.style.width = data.progressToNext + "%";
        });
      });
    }

    if (detailEl) {
      detailEl.textContent = `30 päivän tarkkuus: ${data.rollingAccuracy}% · ${data.rollingSessions} harjoitusta`;
    }

    // Checkpoint button
    if (checkBtn) {
      if (data.canCheckpoint) {
        checkBtn.classList.remove("hidden");
        checkBtn.textContent = `Tee ${data.nextLevel}-tason checkpoint →`;
        checkBtn.onclick = () => {
          if (confirm(`Haluatko yrittää ${data.nextLevel}-tason checkpointia?\n\n20 kysymystä ilman vihjeitä.\n80% oikein nostaa tasosi.`)) {
            startCheckpoint();
          }
        };
      } else {
        checkBtn.classList.add("hidden");
      }
    }

    // Update grade circle to use persistent level
    const gradeCircle = $("dash-grade-circle");
    if (gradeCircle && data.level) {
      gradeCircle.textContent = data.level;
    }

  } catch { /* silent */ }
}

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
    const res = await apiFetch(`${API}/api/weak-topics?days=7`, {
      headers: authHeader(),
    });
    if (!res.ok) return;
    const data = await res.json();
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
  let html = '<div class="dash-writing-progression-title">Kirjoittamisen osa-alueet — viim. 5 kertaa</div>';
  for (const k of order) {
    const d = dims[k];
    if (!d) continue;
    const pct = Math.round((d.avg / 5) * 100);
    const cls = d.avg >= 3.5 ? "" : d.avg >= 2.5 ? "is-mid" : "is-weak";
    const trendArrow = d.trend === "up" ? "↑" : d.trend === "down" ? "↓" : "→";
    html += `
      <div class="dash-wp-row">
        <span class="dash-wp-label">${d.label}<span class="dash-wp-trend ${d.trend}">${trendArrow}</span></span>
        <span class="dash-wp-score">${d.avg.toFixed(1)} / 5</span>
        <div class="dash-wp-bar"><div class="dash-wp-bar-fill ${cls}" style="width:${pct}%"></div></div>
      </div>
    `;
  }
  wrap.innerHTML = html;
}

// ─── YO-koe readiness map ──────────────────────────────────────────────────

async function loadAndRenderReadinessMap() {
  const wrap = $("dash-readiness");
  if (!wrap) return;
  if (!isLoggedIn()) {
    wrap.classList.add("hidden");
    return;
  }

  let learningPath = [];
  try {
    const res = await apiFetch(`${API}/api/learning-path`, { headers: authHeader() });
    if (res.ok) {
      const data = await res.json();
      learningPath = data.path || [];
    }
  } catch { /* network — show empty */ }

  const writingDims = getRecentWritingDimensions(5);
  const map = computeReadinessMap({ learningPath, writingDims });
  if (map.totalCells === 0) {
    wrap.classList.add("hidden");
    return;
  }

  wrap.classList.remove("hidden");

  // Update rail YO-readiness stat with the computed value.
  const railReadinessEl = document.getElementById("dash-yo-readiness");
  if (railReadinessEl && map.totalCells > 0) {
    railReadinessEl.textContent = map.readinessPct;
  }

  const cellsHtml = map.cells.map(c =>
    `<div class="dash-readiness-cell lvl-${c.level}" data-tip="${escapeHtmlAttr(c.tooltip)}" title="${escapeHtmlAttr(c.tooltip)}"></div>`
  ).join("");

  wrap.innerHTML = `
    <div class="dash-readiness-title">YO-valmiuskartta</div>
    <div class="dash-readiness-summary">
      <strong>${map.masteredCells}</strong> / ${map.totalCells} osa-aluetta hallinnassa
      &middot; <strong>${map.readinessPct}%</strong> valmius
    </div>
    <div class="dash-readiness-grid">${cellsHtml}</div>
    <div class="dash-readiness-legend">
      <span>vähän</span>
      <span class="dash-readiness-legend-dots">
        <span class="lvl-1"></span><span class="lvl-2"></span><span class="lvl-3"></span><span class="lvl-4"></span>
      </span>
      <span>hyvin</span>
    </div>
  `;
}

function escapeHtmlAttr(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
