import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, clearAuth, authHeader, apiFetch, getAuthEmail } from "../api.js";
import { state } from "../state.js";
import { showLoading } from "../ui/loading.js";

let _deps = {};
export function initDashboard({ loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, renderModePageStats, loadNextBatch, showProUpsell }) {
  _deps = { loadGrammarDrill, loadReadingTask, loadWritingTask, startCheckout, openBillingPortal, startMockExam, showModePage, renderModePageStats, loadNextBatch, showProUpsell };
}

export const MODE_META = {
  vocab:   { icon: "📚", name: "Sanasto" },
  grammar: { icon: "🔧", name: "Kielioppi" },
  reading: { icon: "📖", name: "Luetun ymmärtäminen" },
  writing: { icon: "✍️", name: "Kirjoittaminen" },
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
    show("screen-dashboard");
  } catch {
    show("screen-start");
  }
}

function renderDashboard({
  totalSessions, modeStats, recent, chartData = [], estLevel = null,
  streak = 0, weekSessions = 0, prevWeekSessions = 0,
  suggestedLevel = "B", modeDaysAgo = {}, pro = false,
}) {
  const proBadgeEl = $("dash-pro-badge");
  if (proBadgeEl) {
    if (pro) {
      proBadgeEl.innerHTML = `<span class="pro-badge-active">PRO</span> <button class="btn-link btn-manage-sub" id="btn-manage-sub">Hallinnoi tilausta</button>`;
      setTimeout(() => {
        const manageBtn = $("btn-manage-sub");
        if (manageBtn) manageBtn.addEventListener("click", () => _deps.openBillingPortal());
      }, 0);
    } else {
      proBadgeEl.innerHTML = `<button class="btn-upgrade-small" id="btn-dash-upgrade">Päivitä Pro</button>`;
      setTimeout(() => {
        const upgradeBtn = $("btn-dash-upgrade");
        if (upgradeBtn) upgradeBtn.addEventListener("click", () => _deps.startCheckout());
      }, 0);
    }
  }
  const name = getAuthEmail() ? getAuthEmail().split("@")[0] : "sinä";
  $("dash-username").textContent = name;

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

  const gradeCircle = $("dash-grade-circle");
  if (gradeCircle) {
    gradeCircle.textContent = estLevel || "—";
  }
  const heroScale = $("dash-hero-scale");
  if (heroScale) {
    const GRADE_ORDER = ["I","A","B","C","M","E","L"];
    const estIdx = GRADE_ORDER.indexOf(estLevel);
    heroScale.querySelectorAll("span").forEach((s) => {
      const gIdx = GRADE_ORDER.indexOf(s.dataset.g);
      s.classList.remove("scale-active", "scale-passed");
      if (gIdx === estIdx) s.classList.add("scale-active");
      else if (estIdx >= 0 && gIdx < estIdx) s.classList.add("scale-passed");
    });
  }
  const heroSub = $("dash-hero-sub");
  if (heroSub) {
    if (!estLevel) {
      heroSub.textContent = "Tee harjoituksia saadaksesi arvion";
    } else {
      const GRADE_NAMES = { I: "Improbatur", A: "Approbatur", B: "Lubenter", C: "Cum laude", M: "Magna", E: "Eximia", L: "Laudatur" };
      heroSub.textContent = GRADE_NAMES[estLevel] || "";
    }
  }

  const streakEl = $("dash-streak");
  if (streakEl) {
    streakEl.textContent = streak;
    streakEl.className = streak >= 3 ? "dash-stat-value dash-stat-streak-active" : "dash-stat-value";
  }

  const totalEl = $("dash-total-sessions");
  if (totalEl) totalEl.textContent = totalSessions;

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
      const icon = streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "📅";
      streakBadge.textContent = `${icon} ${streak} pv putki`;
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

  if (recent.length > 0) {
    $("dash-recent-wrap").classList.remove("hidden");
    $("dash-empty").classList.add("hidden");
    const listEl = $("dash-recent-list");
    listEl.innerHTML = "";
    for (const log of recent) {
      const meta = MODE_META[log.mode] || { icon: "📝", name: log.mode };
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

  const dayCounts = {};
  for (const log of chartData) {
    if (!log.createdAt) continue;
    const day = log.createdAt.slice(0, 10);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  const today = new Date();
  const cells = [];
  const dayNames = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];

  let html = '<div class="heatmap-day-labels">';
  for (const d of dayNames) html += `<span class="heatmap-day-label">${d}</span>`;
  html += "</div>";

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 27);
  while (startDate.getDay() !== 1) startDate.setDate(startDate.getDate() - 1);

  for (let i = 0; i < 35; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const count = dayCounts[key] || 0;
    const isFuture = d > today;

    let lvl = "";
    if (isFuture) lvl = "future";
    else if (count >= 4) lvl = "lvl-4";
    else if (count >= 3) lvl = "lvl-3";
    else if (count >= 2) lvl = "lvl-2";
    else if (count >= 1) lvl = "lvl-1";

    cells.push(`<div class="heatmap-cell ${lvl}" title="${key}: ${count} harjoitusta"></div>`);
  }

  el.innerHTML = html + cells.join("");
}

function renderRecommendations(modeDaysAgo, modeStats, totalSessions) {
  const recWrap = $("dash-recommendations");
  const recList = $("dash-rec-list");
  if (!recWrap || !recList) return;

  const recs = [];

  const modeNames = { vocab: "Sanasto", grammar: "Kielioppi", reading: "Luetun ymmärtäminen", writing: "Kirjoittaminen" };
  const modeIcons = { vocab: "📚", grammar: "🔧", reading: "📖", writing: "✍️" };

  for (const [mode, name] of Object.entries(modeNames)) {
    const daysAgo = modeDaysAgo[mode];
    if (daysAgo === null && totalSessions > 0) {
      recs.push({ icon: modeIcons[mode], text: `Kokeile: ${name}`, sub: "Et ole vielä kokeillut tätä osa-aluetta", mode });
    } else if (daysAgo >= 5) {
      recs.push({ icon: modeIcons[mode], text: `Palaa harjoittelemaan: ${name}`, sub: `${daysAgo} päivää sitten viimeksi`, mode });
    }
  }

  const gramStats = modeStats.grammar;
  if (gramStats && gramStats.avgPct != null && gramStats.avgPct < 60) {
    recs.push({ icon: "⚠️", text: "Kielioppi kaipaa harjoittelua", sub: `Keskiarvo ${gramStats.avgPct}% — tavoite 70%+`, mode: "grammar" });
  }

  if (totalSessions >= 5 && totalSessions % 10 === 0) {
    recs.push({ icon: "🎓", text: "Kokeile koeharjoitusta", sub: "Testaa taitosi simuloidussa kokeessa", mode: "exam" });
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
    localStorage.setItem("kielio_settings", JSON.stringify({
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

    const p = JSON.parse(localStorage.getItem("kielio_settings") || "null");

    const sugLevel = window._dashSuggestedLevel;
    const savedLevel = p?.level;
    const levelToUse = savedLevel || sugLevel || "B";

    state.level = levelToUse;
    document.querySelectorAll("#level-picker .lvl-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.level === levelToUse)
    );

    if (sugLevel) {
      document.querySelectorAll("#level-picker .lvl-btn").forEach((b) =>
        b.classList.toggle("suggested", b.dataset.level === sugLevel)
      );
    }

    if (!p) return;

    if (p.topic) $("topic-select").value = p.topic;
    if (p.grammarTopic) $("grammar-topic-select").value = p.grammarTopic;
    if (p.readingTopic) $("reading-topic-select").value = p.readingTopic;
    if (p.writingTopic) $("writing-topic-select").value = p.writingTopic;

    if (p.grammarLevel) {
      state.grammarLevel = p.grammarLevel;
      document.querySelectorAll("#grammar-level-picker .lvl-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.level === p.grammarLevel)
      );
    }
    if (p.readingLevel) {
      state.readingLevel = p.readingLevel;
      document.querySelectorAll("#reading-level-picker .lvl-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.level === p.readingLevel)
      );
    }
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
