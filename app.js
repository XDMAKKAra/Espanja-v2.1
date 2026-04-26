const API = window.location.origin;
const LEVELS = ["I", "A", "B", "C", "M", "E", "L"];

// ─── Auth state ───────────────────────────────────────────────────────────────

let authToken        = localStorage.getItem("puheo_token");
let authRefreshToken = localStorage.getItem("puheo_refresh_token");
let authEmail        = localStorage.getItem("puheo_email");

function isLoggedIn() { return !!authToken; }

function authHeader() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function setAuth(token, refreshToken, email) {
  authToken        = token;
  authRefreshToken = refreshToken;
  authEmail        = email;
  localStorage.setItem("puheo_token",         token);
  localStorage.setItem("puheo_refresh_token", refreshToken);
  localStorage.setItem("puheo_email",         email);
}

function clearAuth() {
  authToken = null;
  authRefreshToken = null;
  authEmail = null;
  localStorage.removeItem("puheo_token");
  localStorage.removeItem("puheo_refresh_token");
  localStorage.removeItem("puheo_email");
}

// Auto-refresh: if any authed request gets 401, try refreshing once then retry
let _refreshing = null;
async function apiFetch(url, opts = {}) {
  let res = await fetch(url, opts);
  if (res.status !== 401 || !authRefreshToken) return res;

  // Only one refresh at a time (parallel requests all wait for the same promise)
  if (!_refreshing) {
    _refreshing = fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: authRefreshToken }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("refresh_failed");
        const d = await r.json();
        setAuth(d.token, d.refreshToken, d.email);
      })
      .catch(() => { clearAuth(); show("screen-auth"); })
      .finally(() => { _refreshing = null; });
  }
  await _refreshing;
  if (!authToken) return res; // refresh failed, return original 401

  // Retry original request with new token
  const newOpts = { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${authToken}` } };
  return fetch(url, newOpts);
}
const BATCH_SIZE = 4;
const MAX_BATCHES = 3;

// ─── Loading/error helpers ──────────────────────────────────────────────────

function showLoading(text, opts = {}) {
  show("screen-loading");
  $("loading-text").textContent = text;
  $("loading-spinner").style.display = "";
  const subEl = $("loading-subtext");
  const retryEl = $("loading-retry");
  subEl.classList.add("hidden");
  retryEl.classList.add("hidden");
  if (opts.subtext) {
    subEl.textContent = opts.subtext;
    subEl.classList.remove("hidden");
  }
}

function showLoadingError(errorMsg, retryFn) {
  $("loading-spinner").style.display = "none";
  $("loading-text").textContent = "Jokin meni pieleen";
  const subEl = $("loading-subtext");
  subEl.textContent = errorMsg;
  subEl.classList.remove("hidden");
  const retryEl = $("loading-retry");
  if (retryFn) {
    retryEl.classList.remove("hidden");
    retryEl.onclick = retryFn;
  }
}

// ─── Spaced repetition ────────────────────────────────────────────────────────
// Stores up to 20 wrong vocab questions in localStorage, re-injects them as
// priority items at the start of the next session.

const SR_KEY = "puheo_sr_queue";
const SR_MAX = 20;

function srLoad() {
  try { return JSON.parse(localStorage.getItem(SR_KEY)) || []; }
  catch { return []; }
}

function srSave(queue) {
  localStorage.setItem(SR_KEY, JSON.stringify(queue.slice(0, SR_MAX)));
}

function srAddWrong(ex) {
  const queue = srLoad();
  // Avoid duplicates (same question text)
  if (queue.some((q) => q.question === ex.question)) return;
  queue.unshift({ ...ex, _sr: true }); // prepend so newest wrongs come first
  srSave(queue);
}

function srMarkCorrect(ex) {
  if (!ex._sr) return;
  const queue = srLoad().filter((q) => q.question !== ex.question);
  srSave(queue);
}

// Pull up to `n` SR items and remove them from the queue (they'll be re-added if wrong again)
function srPop(n = 2) {
  const queue = srLoad();
  const items = queue.splice(0, n);
  srSave(queue);
  return items;
}

const CRITERIA_LABELS = {
  viestinnallisyys: "Viestinnällisyys",
  tehtavananto: "Tehtävänanto",
  kielioppi: "Kielelliset resurssit",
};

const RATING_COLORS = {
  heikko: "rating-weak",
  kohtalainen: "rating-ok",
  "hyvä": "rating-good",
  erinomainen: "rating-excellent",
};

// ─── State ───────────────────────────────────────────────────────────────────

let state = {
  // Shared
  mode: "vocab", // "vocab" | "grammar" | "reading" | "writing" | "exam"
  language: "spanish",
  sessionStartTime: null,

  // Vocab mode
  exercises: [],
  current: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  batchCorrect: 0,
  batchNumber: 0,
  level: "B",
  startLevel: "B",
  peakLevel: "B",
  topic: "general vocabulary",

  // Writing mode
  writingTaskType: "short",
  writingTopic: "general",
  currentWritingTask: null,

  // Grammar mode
  grammarTopic: "mixed",
  grammarLevel: "C",
  grammarExercises: [],
  grammarCurrent: 0,
  grammarCorrect: 0,
  grammarErrors: [],

  // Reading mode
  readingTopic: "animals and nature",
  readingLevel: "C",
  currentReading: null,
  readingQIndex: 0,
  readingScore: 0,
};

// ─── DOM helpers ─────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const show = (id) => {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
};

// ─── Progress saving ─────────────────────────────────────────────────────────

async function saveProgress({ mode, level, scoreCorrect, scoreTotal, ytlGrade }) {
  if (!isLoggedIn()) return;
  try {
    await apiFetch(`${API}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ mode, level, scoreCorrect, scoreTotal, ytlGrade }),
    });
  } catch { /* silently skip — never disrupt UX */ }
}

// ─── Auth screen logic ────────────────────────────────────────────────────────

let authMode = "login"; // "login" | "register"

$("tab-login").addEventListener("click", () => {
  authMode = "login";
  $("tab-login").classList.add("active");
  $("tab-register").classList.remove("active");
  $("auth-title").textContent = "Kirjaudu sisään";
  $("btn-auth-submit").textContent = "Kirjaudu sisään →";
  $("auth-error").classList.add("hidden");
});

$("tab-register").addEventListener("click", () => {
  authMode = "register";
  $("tab-register").classList.add("active");
  $("tab-login").classList.remove("active");
  $("auth-title").textContent = "Luo tili";
  $("btn-auth-submit").textContent = "Luo tili →";
  $("auth-error").classList.add("hidden");
});

$("btn-auth-submit").addEventListener("click", async () => {
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  const errEl = $("auth-error");
  errEl.classList.add("hidden");

  if (!email || !password) {
    errEl.textContent = "Täytä kaikki kentät";
    errEl.classList.remove("hidden");
    return;
  }

  $("btn-auth-submit").textContent = "Ladataan...";
  $("btn-auth-submit").disabled = true;

  try {
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error || "Jokin meni pieleen";
      errEl.classList.remove("hidden");
      return;
    }
    setAuth(data.token, data.refreshToken, data.email);
    updateSidebarState();
    await loadDashboard();
  } catch {
    errEl.textContent = "Ei yhteyttä palvelimeen";
    errEl.classList.remove("hidden");
  } finally {
    $("btn-auth-submit").disabled = false;
    $("btn-auth-submit").textContent = authMode === "login" ? "Kirjaudu sisään →" : "Luo tili →";
  }
});

$("btn-guest").addEventListener("click", () => {
  updateSidebarState();
  show("screen-start");
});

$("btn-forgot").addEventListener("click", async () => {
  const email = $("auth-email").value.trim();
  const errEl = $("auth-error");
  const okEl  = $("auth-success");
  errEl.classList.add("hidden");
  okEl.classList.add("hidden");

  if (!email) {
    errEl.textContent = "Kirjoita sähköpostiosoitteesi ensin";
    errEl.classList.remove("hidden");
    return;
  }

  $("btn-forgot").textContent = "Lähetetään...";
  $("btn-forgot").disabled = true;
  try {
    const res = await fetch(`${API}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      okEl.textContent = "Salasanan palautuslinkki lähetetty! Tarkista sähköpostisi.";
      okEl.classList.remove("hidden");
    } else {
      const d = await res.json();
      errEl.textContent = d.error || "Jokin meni pieleen";
      errEl.classList.remove("hidden");
    }
  } catch {
    errEl.textContent = "Ei yhteyttä palvelimeen";
    errEl.classList.remove("hidden");
  } finally {
    $("btn-forgot").disabled = false;
    $("btn-forgot").textContent = "Unohditko salasanan?";
  }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

const MODE_META = {
  vocab:   { icon: "📚", name: "Sanasto" },
  grammar: { icon: "🔧", name: "Kielioppi" },
  reading: { icon: "📖", name: "Luetun ymmärtäminen" },
  writing: { icon: "✍️", name: "Kirjoittaminen" },
};

async function loadDashboard() {
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
    // Server unreachable — just go to start screen
    show("screen-start");
  }
}

function renderDashboard({
  totalSessions, modeStats, recent, chartData = [], estLevel = null,
  streak = 0, weekSessions = 0, prevWeekSessions = 0,
  suggestedLevel = "B", modeDaysAgo = {}, pro = false,
}) {
  // Pro status badge + manage link
  const proBadgeEl = $("dash-pro-badge");
  if (proBadgeEl) {
    if (pro) {
      proBadgeEl.innerHTML = `<span class="pro-badge-active">PRO</span> <button class="btn-link btn-manage-sub" id="btn-manage-sub">Hallinnoi tilausta</button>`;
      setTimeout(() => {
        const manageBtn = $("btn-manage-sub");
        if (manageBtn) manageBtn.addEventListener("click", () => openBillingPortal());
      }, 0);
    } else {
      proBadgeEl.innerHTML = `<button class="btn-upgrade-small" id="btn-dash-upgrade">Päivitä Pro</button>`;
      setTimeout(() => {
        const upgradeBtn = $("btn-dash-upgrade");
        if (upgradeBtn) upgradeBtn.addEventListener("click", () => startCheckout());
      }, 0);
    }
  }
  // Greeting
  const name = authEmail ? authEmail.split("@")[0] : "sinä";
  $("dash-username").textContent = name;

  // Motivational subtitle
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

  // Hero grade card
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

  // Stats row
  const streakEl = $("dash-streak");
  if (streakEl) {
    streakEl.textContent = streak;
    streakEl.className = streak >= 3 ? "dash-stat-value dash-stat-streak-active" : "dash-stat-value";
  }

  const totalEl = $("dash-total-sessions");
  if (totalEl) totalEl.textContent = totalSessions;

  // Week comparison
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

  // Activity heatmap
  renderHeatmap(chartData);

  // Progress chart
  renderProgressChart(chartData);

  // Store for smart start + mode pages
  window._dashSuggestedLevel = suggestedLevel;
  window._dashModeDaysAgo = modeDaysAgo;
  window._dashStreak = streak;
  window._isPro = pro ?? false;
  window._dashModeStats = modeStats;

  // Lock paid modes for free logged-in users
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

  // Populate streak badge on start screen
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

  // Mode cards (clickable — jump straight to that mode)
  const modesEl = $("dash-modes");
  modesEl.innerHTML = "";
  for (const [mode, meta] of Object.entries(MODE_META)) {
    const s = modeStats[mode];
    const daysAgo = modeDaysAgo[mode];
    const isDue = daysAgo === null || daysAgo >= 2; // never practiced or 2+ days
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

    // Click → navigate directly to that mode's start config
    card.addEventListener("click", () => {
      navigateToMode(mode);
    });
    modesEl.appendChild(card);
  }

  // Recommendations
  renderRecommendations(modeDaysAgo, modeStats, totalSessions);

  // Recent list
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

  // Horizontal grade lines + labels
  GRADES.forEach((g, i) => {
    const yy = cy(i).toFixed(1);
    s.push(`<line x1="${PL}" y1="${yy}" x2="${VW - PR}" y2="${yy}" stroke="rgba(245,232,224,0.05)" stroke-width="0.6"/>`);
    s.push(`<text x="${PL - 4}" y="${(cy(i) + 3.5).toFixed(1)}" text-anchor="end" font-size="7.5" fill="rgba(245,232,224,0.28)" font-family="DM Mono,monospace">${g}</text>`);
  });

  if (n > 1) {
    // Area fill
    const firstX = cx(0).toFixed(1);
    const lastX = cx(n - 1).toFixed(1);
    const bottom = (VH - PB).toFixed(1);
    const lineStr = pts.map((g, i) => `${cx(i).toFixed(1)} ${cy(g).toFixed(1)}`).join(" L ");
    s.push(`<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e63946" stop-opacity="0.22"/><stop offset="100%" stop-color="#e63946" stop-opacity="0"/></linearGradient></defs>`);
    s.push(`<path d="M ${firstX} ${bottom} L ${lineStr} L ${lastX} ${bottom} Z" fill="url(#areaGrad)"/>`);

    // Line
    const polyPts = pts.map((g, i) => `${cx(i).toFixed(1)},${cy(g).toFixed(1)}`).join(" ");
    s.push(`<polyline points="${polyPts}" fill="none" stroke="#e63946" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  // Today vertical indicator
  const todayX = cx(n - 1).toFixed(1);
  s.push(`<line x1="${todayX}" y1="${PT}" x2="${todayX}" y2="${VH - PB}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,2" opacity="0.55"/>`);
  s.push(`<text x="${todayX}" y="${VH - 4}" text-anchor="middle" font-size="7" fill="rgba(245,158,11,0.6)" font-family="DM Mono,monospace">tänään</text>`);

  // Dots — show individual dots only if not too many points
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

// ─── Activity heatmap (GitHub-style, vertical days) ─────────────────────────

function renderHeatmap(chartData) {
  const el = $("dash-heatmap");
  if (!el) return;

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

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);
  while (startDate.getDay() !== 1) startDate.setDate(startDate.getDate() - 1);

  const msPerDay = 86400000;
  const totalDays = Math.ceil((today - startDate) / msPerDay) + 1;
  const numWeeks = Math.ceil(totalDays / 7);

  let html = "";

  for (let row = 0; row < 7; row++) {
    const show = row === 0 || row === 2 || row === 4 || row === 6;
    html += `<div class="heatmap-label">${show ? dayLabels[row] : ""}</div>`;
  }

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

      const dd = d.getDate();
      const mm = d.getMonth() + 1;
      const yyyy = d.getFullYear();
      const dateStr = `${dd}.${mm}.${yyyy}`;
      let tip = dateStr;
      if (!isFuture && count === 0) {
        tip = `${dateStr} — ei harjoituksia`;
      } else if (!isFuture && count > 0) {
        const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        tip = `${dateStr} — ${count} harjoitus${count > 1 ? "ta" : ""}`
            + (stats.total > 0 ? `, ${pct}% oikein` : "");
      }

      html += `<div class="heatmap-cell ${lvl}" data-tip="${tip}"></div>`;
    }
  }

  el.style.setProperty("--heatmap-cols", numWeeks + 1);
  el.innerHTML = html;

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

// ─── Recommendations engine ─────────────────────────────────────────────────

function renderRecommendations(modeDaysAgo, modeStats, totalSessions) {
  const recWrap = $("dash-recommendations");
  const recList = $("dash-rec-list");
  if (!recWrap || !recList) return;

  const recs = [];

  // Check which modes haven't been practiced recently
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

  // Check for weak grammar areas
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

// ─── Navigate to mode from dashboard ────────────────────────────────────────

function navigateToMode(mode) {
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

  // Apply suggested vocab level + restore last settings
  loadLastSettings(mode);
  show("screen-start");
}

// ─── Persistent settings (remember last used options) ────────────────────────

function saveLastSettings() {
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

function loadLastSettings(forcedMode) {
  try {
    // If a mode was forced (e.g. clicking a mode card on dashboard), activate it
    if (forcedMode) {
      state.mode = forcedMode;
      document.querySelectorAll(".mode-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.mode === forcedMode)
      );
    }

    const p = JSON.parse(localStorage.getItem("puheo_settings") || "null");

    // Apply suggested vocab level from server if available
    const sugLevel = window._dashSuggestedLevel;
    const savedLevel = p?.level;
    // Prefer saved level; fall back to server suggestion
    const levelToUse = savedLevel || sugLevel || "B";
    state.level = levelToUse;
    document.querySelectorAll("#level-picker .lvl-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.level === levelToUse)
    );

    // Mark suggested level with ★
    if (sugLevel) {
      document.querySelectorAll("#level-picker .lvl-btn").forEach((b) =>
        b.classList.toggle("suggested", b.dataset.level === sugLevel)
      );
    }

    if (!p) return;

    // Topic selects
    if (p.topic) $("topic-select").value = p.topic;
    if (p.grammarTopic) $("grammar-topic-select").value = p.grammarTopic;
    if (p.readingTopic) $("reading-topic-select").value = p.readingTopic;
    if (p.writingTopic) $("writing-topic-select").value = p.writingTopic;

    // Grammar level
    if (p.grammarLevel) {
      state.grammarLevel = p.grammarLevel;
      document.querySelectorAll("#grammar-level-picker .lvl-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.level === p.grammarLevel)
      );
    }
    // Reading level
    if (p.readingLevel) {
      state.readingLevel = p.readingLevel;
      document.querySelectorAll("#reading-level-picker .lvl-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.level === p.readingLevel)
      );
    }
    // Writing type
    if (p.writingType) {
      state.writingTaskType = p.writingType;
      document.querySelectorAll(".task-type-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.type === p.writingType)
      );
    }
  } catch {}
}

// TODO(T11): btn-logout removed from dash-header; sidebar-logout handles logout now (see below).
// const _btnLogout = $("btn-logout");
// if (_btnLogout) _btnLogout.addEventListener("click", () => { clearAuth(); updateSidebarState(); show("screen-auth"); });

$("btn-dash-start").addEventListener("click", () => {
  $("btn-back-to-dash").classList.remove("hidden");
  loadLastSettings();
  show("screen-start");
});

$("btn-back-to-dash").addEventListener("click", () => loadDashboard());

// ─── Password reset flow ─────────────────────────────────────────────────────

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

// ─── Pro upsell ──────────────────────────────────────────────────────────────

$("btn-upgrade-pro").addEventListener("click", () => startCheckout());
$("btn-upsell-back").addEventListener("click", () => show("screen-start"));

// ─── Sidebar + mobile nav ────────────────────────────────────────────────────

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

  // Update user email in sidebar
  const sidebarUser = $("sidebar-user");
  if (sidebarUser) sidebarUser.textContent = authEmail || "";
}

// Sidebar navigation clicks
document.querySelectorAll(".sidebar-item[data-nav], .mobile-nav-item[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nav = btn.dataset.nav;
    // Highlight active
    document.querySelectorAll(".sidebar-item[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === nav));
    document.querySelectorAll(".mobile-nav-item[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === nav));

    if (nav === "dashboard") {
      loadDashboard();
    } else if (nav === "exam") {
      // Exam still uses old start screen flow
      state.mode = "exam";
      show("screen-start");
    } else {
      showModePage(nav);
    }
  });
});

// ─── Mode pages ─────────────────────────────────────────────────────────────

function showModePage(mode) {
  const screenId = `screen-mode-${mode}`;
  const screenEl = document.getElementById(screenId);
  if (!screenEl) { navigateToMode(mode); return; }

  // Populate stats for this mode
  renderModePageStats(mode);

  // Show pro lock if needed
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

// Topic card clicks (all mode pages)
document.querySelectorAll(".topic-cards").forEach((grid) => {
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".topic-card");
    if (!card) return;
    grid.querySelectorAll(".topic-card").forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
  });
});

// Level pickers on mode pages
document.querySelectorAll("[id$='-page-level-picker'] .lvl-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const picker = btn.closest(".level-picker");
    picker.querySelectorAll(".lvl-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Start buttons on mode pages
if ($("btn-start-vocab")) $("btn-start-vocab").addEventListener("click", () => {
  state.mode = "vocab";
  state.level = document.querySelector("#vocab-page-level-picker .lvl-btn.active")?.dataset.level || "B";
  state.topic = document.querySelector("#vocab-topic-cards .topic-card.active")?.dataset.topic || "general vocabulary";
  state.startLevel = state.level;
  state.peakLevel = state.level;
  state.batchNumber = 0;
  state.totalCorrect = 0;
  state.totalAnswered = 0;
  state.sessionStartTime = Date.now();
  loadNextBatch();
});

if ($("btn-start-grammar")) $("btn-start-grammar").addEventListener("click", () => {
  state.mode = "grammar";
  state.grammarLevel = document.querySelector("#grammar-page-level-picker .lvl-btn.active")?.dataset.level || "C";
  state.grammarTopic = document.querySelector("#grammar-topic-cards .topic-card.active")?.dataset.topic || "mixed";
  state.sessionStartTime = Date.now();
  loadGrammarDrill();
});

if ($("btn-start-reading")) $("btn-start-reading").addEventListener("click", () => {
  state.mode = "reading";
  state.readingLevel = document.querySelector("#reading-page-level-picker .lvl-btn.active")?.dataset.level || "C";
  state.readingTopic = document.querySelector("#reading-topic-cards .topic-card.active")?.dataset.topic || "animals and nature";
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

// Sidebar logout
const sidebarLogout = $("sidebar-logout");
if (sidebarLogout) {
  sidebarLogout.addEventListener("click", () => {
    clearAuth();
    updateSidebarState();
    show("screen-auth");
  });
}

// ─── Startup ──────────────────────────────────────────────────────────────────

updateSidebarState();
if (!resetToken && isLoggedIn()) {
  loadDashboard();
} // else: screen-auth is already active (set in HTML)

// ─── Mode picker ─────────────────────────────────────────────────────────────

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

// ─── Level picker (vocab mode) ───────────────────────────────────────────────

document.querySelectorAll("#level-picker .lvl-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#level-picker .lvl-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.level = btn.dataset.level;
  });
});

document.querySelectorAll("#grammar-level-picker .lvl-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#grammar-level-picker .lvl-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.grammarLevel = btn.dataset.level;
  });
});

document.querySelectorAll("#reading-level-picker .lvl-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#reading-level-picker .lvl-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.readingLevel = btn.dataset.level;
  });
});

// ─── Task type picker (writing mode) ─────────────────────────────────────────

document.querySelectorAll(".task-type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".task-type-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.writingTaskType = btn.dataset.type;
  });
});

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  // Don't fire if typing in an input/textarea
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

  const key = e.key.toUpperCase();

  // Map number keys 1-4 to A-D
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

  // Reading screen: T/F shortcuts
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

// ─── Start button ─────────────────────────────────────────────────────────────

$("btn-start").addEventListener("click", async () => {
  saveLastSettings(); // Remember choices for next time
  state.sessionStartTime = Date.now();

  if (state.mode === "vocab") {
    state.topic = $("topic-select").value;
    state.startLevel = state.level;
    state.peakLevel = state.level;
    state.batchNumber = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
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

// ═══════════════════════════════════════════════════════════════════════════════
// VOCAB MODE
// ═══════════════════════════════════════════════════════════════════════════════

async function loadNextBatch() {
  state.batchNumber++;
  state.batchCorrect = 0;
  state.current = 0;

  showLoading(`Luodaan kierros ${state.batchNumber}/${MAX_BATCHES}...`);

  try {
    // Inject up to 2 SR review items per batch (first batch only, to avoid repetition fatigue)
    const srItems = state.batchNumber === 1 ? srPop(2) : [];

    const freshCount = BATCH_SIZE - srItems.length;
    const res = await fetch(`${API}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ level: state.level, topic: state.topic, count: freshCount, language: state.language }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tehtävien luonti epäonnistui");
    if (!data.exercises?.length) throw new Error("No exercises");

    // SR items go first so user sees them immediately
    state.exercises = [...srItems, ...data.exercises];
    state.bankId = data.bankId || null;
    renderExercise();
    show("screen-exercise");
  } catch (err) {
    showLoadingError(err.message, () => loadNextBatch());
  }
}

const VOCAB_TYPE_LABELS = {
  context: "Konteksti",
  translate: "Käännös",
  gap: "Täydennä",
  meaning: "Sanasto",
};

const GRAMMAR_TYPE_LABELS = {
  gap: "Täydennä",
  correction: "Virheen korjaus",
  transform: "Muunna",
  pick_rule: "Tunnista sääntö",
};

function renderExercise() {
  const ex = state.exercises[state.current];
  const questionNum = (state.batchNumber - 1) * BATCH_SIZE + state.current + 1;
  const totalQuestions = MAX_BATCHES * BATCH_SIZE;

  $("ex-counter").textContent = `Q ${questionNum} / ${totalQuestions}`;
  $("ex-round").textContent = ex._sr ? "🔁 Kertaus" : `Kierros ${state.batchNumber}/${MAX_BATCHES}`;
  $("ex-level-badge").textContent = state.level;
  $("progress-fill").style.width = `${((questionNum - 1) / totalQuestions) * 100}%`;
  $("question-text").textContent = ex.question;

  // Show type badge
  const typeBadge = $("ex-type-badge");
  const exType = ex.type || "meaning";
  const typeLabel = VOCAB_TYPE_LABELS[exType] || "Sanasto";
  if (typeBadge) {
    typeBadge.textContent = typeLabel;
    typeBadge.className = `ex-type-badge type-${exType}`;
    typeBadge.classList.remove("hidden");
  }

  // Show context sentence for "context" type
  const contextEl = $("ex-context-sentence");
  if (contextEl) {
    if (ex.type === "context" && ex.context) {
      contextEl.textContent = ex.context;
      contextEl.classList.remove("hidden");
    } else {
      contextEl.classList.add("hidden");
    }
  }

  // Set question label based on type
  const labelEl = $("question-label");
  if (labelEl) {
    const labels = {
      context: "Mitä sana tarkoittaa tässä yhteydessä?",
      translate: "Valitse oikea käännös",
      gap: "Täydennä lause",
      meaning: "¿Qué significa?",
    };
    labelEl.textContent = labels[exType] || "¿Qué significa?";
  }

  const grid = $("options-grid");
  grid.innerHTML = "";

  ex.options.forEach((opt) => {
    const letter = opt.trim()[0];
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(letter, btn));
    grid.appendChild(btn);
  });

  $("explanation-block").classList.add("hidden");
  $("explanation-text").textContent = "";
}

function handleAnswer(chosen, clickedBtn) {
  const ex = state.exercises[state.current];
  const isCorrect = chosen === ex.correct;

  if (isCorrect) {
    state.totalCorrect++;
    state.batchCorrect++;
    clickedBtn.classList.add("correct");
    srMarkCorrect(ex); // remove from SR queue if it was a review item
  } else {
    clickedBtn.classList.add("wrong");
    document.querySelectorAll(".option-btn").forEach((btn) => {
      if (btn.textContent.trim()[0] === ex.correct) btn.classList.add("correct");
    });
    srAddWrong(ex); // queue for re-testing
  }

  state.totalAnswered++;
  document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));
  $("explanation-text").textContent = ex.explanation;
  $("explanation-block").classList.remove("hidden");

  // Show report button if exercise came from bank
  const reportBtn = $("btn-report-vocab");
  if (state.bankId) {
    reportBtn.classList.remove("hidden");
    reportBtn.disabled = false;
    reportBtn.textContent = "⚠ Virhe tehtävässä";
  } else {
    reportBtn.classList.add("hidden");
  }
}

$("btn-next").addEventListener("click", () => {
  state.current++;
  if (state.current >= state.exercises.length) {
    endBatch();
  } else {
    renderExercise();
  }
});

function endBatch() {
  if (state.batchNumber >= MAX_BATCHES) {
    showVocabResults();
    return;
  }

  const levelIdx = LEVELS.indexOf(state.level);
  const pct = state.batchCorrect / BATCH_SIZE;

  let newLevelIdx = levelIdx;
  let arrowChar = "→";
  let arrowClass = "same";
  let subText = `${state.batchCorrect}/${BATCH_SIZE} oikein`;

  if (pct >= 0.75) {
    if (levelIdx < LEVELS.length - 1) {
      newLevelIdx = levelIdx + 1;
      arrowChar = "↑";
      arrowClass = "up";
      subText += " · taso nousee!";
    } else {
      subText += " · huipputaso saavutettu!";
    }
  } else if (state.batchCorrect === 0) {
    // Only drop level if you got absolutely nothing right (0/4)
    if (levelIdx > 0) {
      newLevelIdx = levelIdx - 1;
      arrowChar = "↓";
      arrowClass = "down";
      subText += " · taso laskee";
    } else {
      subText += " · jatketaan harjoittelua!";
    }
  } else {
    subText += ` · pysytään tasolla ${LEVELS[levelIdx]}`;
  }

  state.level = LEVELS[newLevelIdx];

  if (LEVELS.indexOf(state.level) > LEVELS.indexOf(state.peakLevel)) {
    state.peakLevel = state.level;
  }

  const arrowEl = $("level-arrow");
  arrowEl.textContent = arrowChar;
  arrowEl.className = "level-transition-arrow " + arrowClass;

  const levelDisplay = $("level-new");
  levelDisplay.className = "level-transition-display";
  if (arrowClass === "up") levelDisplay.classList.add("level-up");
  else if (arrowClass === "down") levelDisplay.classList.add("level-down");
  levelDisplay.textContent = state.level;

  $("level-sub").textContent = subText;
  $("level-next-round").textContent = state.batchNumber + 1;

  show("screen-level");
}

$("btn-continue").addEventListener("click", () => loadNextBatch());

async function showVocabResults() {
  showLoading("Lasketaan arvosanaa...");

  try {
    const res = await fetch(`${API}/api/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correct: state.totalCorrect,
        total: state.totalAnswered,
        level: state.peakLevel,
      }),
    });
    const data = await res.json();

    $("grade-display").textContent = data.grade;
    $("score-text").textContent = `${data.correct} / ${data.total} oikein · ${data.pct}%`;

    // Session timer
    if (state.sessionStartTime) {
      const elapsed = Math.round((Date.now() - state.sessionStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      const timerEl = $("results-timer");
      if (timerEl) {
        timerEl.textContent = mins > 0 ? `⏱ ${mins} min ${secs} s` : `⏱ ${secs} s`;
        timerEl.classList.remove("hidden");
      }
    }

    const journey =
      state.startLevel === state.peakLevel
        ? `Taso: ${state.startLevel}`
        : `${state.startLevel} → ${state.peakLevel}`;
    $("journey-text").textContent = journey;

    // Improvement detection (compare to last saved grade for vocab)
    const bannerEl = $("improvement-banner");
    if (bannerEl) {
      try {
        const prevGrade = localStorage.getItem("puheo_last_vocab_grade");
        const GRADE_ORDER_LOCAL = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };
        if (prevGrade && (GRADE_ORDER_LOCAL[data.grade] ?? -1) > (GRADE_ORDER_LOCAL[prevGrade] ?? -1)) {
          bannerEl.textContent = `🎉 Parempi kuin viime kerralla! ${prevGrade} → ${data.grade}`;
          bannerEl.classList.remove("hidden");
        } else {
          bannerEl.classList.add("hidden");
        }
      } catch { bannerEl.classList.add("hidden"); }
      localStorage.setItem("puheo_last_vocab_grade", data.grade);
    }

    document.querySelectorAll(".grade-scale span").forEach((s) => {
      s.classList.remove("highlight-grade");
      if (s.textContent === data.grade) s.classList.add("highlight-grade");
    });

    saveProgress({
      mode: "vocab",
      level: state.peakLevel,
      scoreCorrect: state.totalCorrect,
      scoreTotal: state.totalAnswered,
      ytlGrade: data.grade,
    });

    show("screen-results");
  } catch (err) {
    showLoadingError("Virhe arvosanan laskemisessa: " + err.message, () => showVocabResults());
  }
}

$("btn-restart").addEventListener("click", () =>
  isLoggedIn() ? loadDashboard() : show("screen-start")
);

function shareResult(text) {
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

$("btn-share-vocab").addEventListener("click", () => {
  const grade = $("grade-display").textContent;
  const score = $("score-text").textContent;
  shareResult(`Harjoittelin espanjan yo-koetta Puheossa 📚\nArvosana: ${grade} · ${score}\nhttps://puheo.fi`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// WRITING MODE
// ═══════════════════════════════════════════════════════════════════════════════

function showProUpsell() {
  show("screen-pro-upsell");
}

async function startCheckout() {
  $("btn-upgrade-pro").disabled = true;
  $("btn-upgrade-pro").textContent = "Ohjataan maksuun...";
  try {
    const res = await apiFetch(`${API}/api/payments/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Maksun avaaminen epäonnistui");
    }
  } catch {
    alert("Yhteysvirhe");
  } finally {
    $("btn-upgrade-pro").disabled = false;
    $("btn-upgrade-pro").textContent = "Päivitä Pro →";
  }
}

async function openBillingPortal() {
  try {
    const res = await apiFetch(`${API}/api/payments/portal-session`, {
      method: "GET",
      headers: authHeader(),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } catch {
    alert("Yhteysvirhe");
  }
}

async function loadWritingTask() {
  showLoading("Luodaan kirjoitustehtävää...");

  try {
    const res = await fetch(`${API}/api/writing-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        taskType: state.writingTaskType,
        topic: state.writingTopic,
        language: state.language,
      }),
    });
    if (res.status === 403) { showProUpsell(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tehtävän luonti epäonnistui");
    if (!data.task) throw new Error("No task");

    state.currentWritingTask = data.task;
    renderWritingTask(data.task);
    show("screen-writing");
  } catch (err) {
    showLoadingError(err.message, () => loadWritingTask());
  }
}

function renderWritingTask(task) {
  const isShort = task.taskType === "short";

  $("writing-type-badge").textContent = isShort ? "Lyhyt tehtävä" : "Laajempi tehtävä";
  $("writing-pts-badge").textContent = `${task.points} p`;
  $("writing-limit-info").textContent = `${task.charMin}–${task.charMax} merkkiä (välilyönnit ei lasketa)`;
  $("writing-situation").textContent = task.situation;
  $("writing-prompt-text").textContent = task.prompt;

  const reqList = $("writing-requirements");
  reqList.innerHTML = "";
  task.requirements.forEach((req) => {
    const li = document.createElement("div");
    li.className = "writing-req-item";
    li.textContent = "· " + req;
    reqList.appendChild(li);
  });

  // Reset textarea and counter
  const input = $("writing-input");
  input.value = "";
  $("char-max").textContent = task.charMax;
  updateCharCounter();

  // Set char bar min marker position
  const minPct = (task.charMin / task.charMax) * 100;
  $("char-bar-min").style.left = `${minPct}%`;
}

// Character counter (excludes all whitespace)
function countChars(text) {
  return text.replace(/\s/g, "").length;
}

function updateCharCounter() {
  const task = state.currentWritingTask;
  if (!task) return;

  const text = $("writing-input").value;
  const count = countChars(text);
  const max = task.charMax;
  const min = task.charMin;

  $("char-count").textContent = count;

  const counter = $("char-counter");
  counter.classList.remove("counter-ok", "counter-warn", "counter-over");
  if (count > max) {
    counter.classList.add("counter-over");
  } else if (count >= min) {
    counter.classList.add("counter-ok");
  } else {
    counter.classList.add("counter-warn");
  }

  // Fill bar
  const fillPct = Math.min((count / max) * 100, 100);
  const fill = $("char-bar-fill");
  fill.style.width = `${fillPct}%`;
  fill.classList.remove("bar-ok", "bar-over");
  fill.classList.add(count > max ? "bar-over" : "bar-ok");

  // Enable submit only if within range (or slightly over — penalty applies)
  $("btn-submit-writing").disabled = count < min;
}

$("writing-input").addEventListener("input", updateCharCounter);

$("btn-submit-writing").addEventListener("click", async () => {
  const text = $("writing-input").value.trim();
  if (!text) return;

  showLoading("Arvioidaan vastaustasi...");

  try {
    const res = await fetch(`${API}/api/grade-writing`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        task: state.currentWritingTask,
        studentText: text,
      }),
    });
    const data = await res.json();
    if (!data.result) throw new Error("No result");

    renderWritingFeedback(data.result);
    saveProgress({
      mode: "writing",
      level: null,
      scoreCorrect: data.result.finalScore,
      scoreTotal: data.result.maxScore,
      ytlGrade: data.result.ytlGrade,
    });
    show("screen-writing-feedback");
  } catch (err) {
    showLoadingError("Arviointivirhe: " + err.message, () => {
      show("screen-writing");
    });
  }
});

function renderWritingFeedback(result) {
  // Score display
  $("feedback-score-num").textContent = result.finalScore;
  $("feedback-score-denom").textContent = `/ ${result.maxScore}`;

  const gradeBadge = $("feedback-grade-badge");
  gradeBadge.textContent = result.ytlGrade;
  gradeBadge.className = "feedback-grade-badge grade-" + result.ytlGrade;

  // Criteria
  const criteriaEl = $("feedback-criteria");
  criteriaEl.innerHTML = "";
  for (const [key, label] of Object.entries(CRITERIA_LABELS)) {
    const c = result.criteria[key];
    if (!c) continue;
    const ratingClass = RATING_COLORS[c.rating] || "";
    const block = document.createElement("div");
    block.className = "criteria-block";
    block.innerHTML = `
      <div class="criteria-header">
        <span class="criteria-label">${label}</span>
        <span class="criteria-rating ${ratingClass}">${c.rating}</span>
      </div>
      <p class="criteria-comment">${c.comment}</p>
    `;
    criteriaEl.appendChild(block);
  }

  // Penalty notice
  if (result.penalty > 0) {
    const notice = document.createElement("div");
    notice.className = "penalty-notice";
    notice.textContent = `⚠ Merkkirajoitus ylitetty: −${result.penalty} pistettä`;
    criteriaEl.insertAdjacentElement("afterend", notice);
  }

  // Errors
  const errorsEl = $("feedback-errors");
  errorsEl.innerHTML = "";
  if (result.errors?.length) {
    $("feedback-errors-section").style.display = "";
    result.errors.forEach((err) => {
      const el = document.createElement("div");
      el.className = "error-item";
      el.innerHTML = `
        <div class="error-comparison">
          <span class="error-wrong">${err.original}</span>
          <span class="error-arrow">→</span>
          <span class="error-correct">${err.correct}</span>
        </div>
        <p class="error-explanation">${err.explanation}</p>
      `;
      errorsEl.appendChild(el);
    });
  } else {
    $("feedback-errors-section").style.display = "none";
  }

  // Positives
  const posEl = $("feedback-positives");
  posEl.innerHTML = "";
  if (result.positives?.length) {
    $("feedback-positives-section").style.display = "";
    result.positives.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      posEl.appendChild(li);
    });
  } else {
    $("feedback-positives-section").style.display = "none";
  }

  // Overall feedback
  $("feedback-overall").textContent = result.overallFeedback || "";
}

$("btn-try-again").addEventListener("click", () => loadWritingTask());
$("btn-back-home").addEventListener("click", () =>
  isLoggedIn() ? loadDashboard() : show("screen-start")
);

// ═══════════════════════════════════════════════════════════════════════════════
// GRAMMAR DRILL MODE
// ═══════════════════════════════════════════════════════════════════════════════

async function loadGrammarDrill() {
  showLoading("Luodaan kielioppiharjoituksia...");

  try {
    const res = await fetch(`${API}/api/grammar-drill`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        topic: state.grammarTopic,
        level: state.grammarLevel,
        count: 6,
        language: state.language,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Harjoitusten luonti epäonnistui");
    if (!data.exercises?.length) throw new Error("No exercises");

    state.grammarExercises = data.exercises;
    state.grammarBankId = data.bankId || null;
    state.grammarCurrent = 0;
    state.grammarCorrect = 0;
    state.grammarErrors = [];

    renderGrammarExercise();
    show("screen-grammar");
  } catch (err) {
    showLoadingError(err.message, () => loadGrammarDrill());
  }
}

function renderGrammarExercise() {
  const ex = state.grammarExercises[state.grammarCurrent];
  const total = state.grammarExercises.length;

  $("gram-counter").textContent = `${state.grammarCurrent + 1} / ${total}`;
  $("gram-level-badge").textContent = state.grammarLevel;

  // Show exercise type instead of just topic
  const exType = ex.type || "gap";
  const typeLabel = GRAMMAR_TYPE_LABELS[exType] || "Kielioppi";
  $("gram-topic-badge").textContent = typeLabel;
  $("gram-topic-badge").className = `ex-round-badge ex-type-badge type-${exType}`;

  $("gram-progress-fill").style.width = `${(state.grammarCurrent / total) * 100}%`;
  $("gram-instruction").textContent = ex.instruction;

  // For correction type, style the sentence differently (it has an error)
  const sentenceEl = $("gram-sentence");
  if (exType === "correction") {
    sentenceEl.innerHTML = `<span style="text-decoration: underline wavy var(--error); text-underline-offset: 4px">${ex.sentence}</span>`;
  } else if (exType === "transform") {
    sentenceEl.innerHTML = `<span style="color: var(--accent)">${ex.sentence}</span>`;
  } else {
    sentenceEl.textContent = ex.sentence;
  }

  $("gram-rule-tag").textContent = "";
  $("gram-explanation-block").classList.add("hidden");

  const grid = $("gram-options-grid");
  grid.innerHTML = "";

  // For "transform" type, options are full sentences — use single column
  if (exType === "transform" || exType === "pick_rule") {
    grid.style.gridTemplateColumns = "1fr";
  } else {
    grid.style.gridTemplateColumns = "1fr 1fr";
  }

  ex.options.forEach((opt) => {
    const letter = opt.trim()[0];
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleGrammarAnswer(letter, btn, ex));
    grid.appendChild(btn);
  });
}

function handleGrammarAnswer(chosen, clickedBtn, ex) {
  const isCorrect = chosen === ex.correct;

  if (isCorrect) {
    clickedBtn.classList.add("correct");
    state.grammarCorrect++;
  } else {
    clickedBtn.classList.add("wrong");
    document.querySelectorAll("#gram-options-grid .option-btn").forEach((b) => {
      if (b.textContent.trim()[0] === ex.correct) b.classList.add("correct");
    });
    state.grammarErrors.push(ex.rule || "kielioppi");
  }

  document.querySelectorAll("#gram-options-grid .option-btn").forEach((b) => (b.disabled = true));
  $("gram-rule-tag").textContent = ex.rule || "";
  $("gram-explanation-text").textContent = ex.explanation;
  $("gram-explanation-block").classList.remove("hidden");

  const reportBtn = $("btn-report-gram");
  if (state.grammarBankId) {
    reportBtn.classList.remove("hidden");
    reportBtn.disabled = false;
    reportBtn.textContent = "⚠ Virhe tehtävässä";
  } else {
    reportBtn.classList.add("hidden");
  }
}

$("gram-btn-next").addEventListener("click", () => {
  state.grammarCurrent++;
  if (state.grammarCurrent >= state.grammarExercises.length) {
    showGrammarResults();
  } else {
    renderGrammarExercise();
  }
});

function showGrammarResults() {
  const total = state.grammarExercises.length;
  $("gram-score-display").textContent = `${state.grammarCorrect}/${total}`;
  $("gram-score-text").textContent = `${state.grammarCorrect} / ${total} oikein`;

  const errSummary = $("gram-error-summary");
  errSummary.innerHTML = "";
  const uniqueErrors = [...new Set(state.grammarErrors)];
  if (uniqueErrors.length > 0) {
    const label = document.createElement("p");
    label.style.cssText =
      "font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;";
    label.textContent = "Harjoittele lisää:";
    errSummary.appendChild(label);
    uniqueErrors.forEach((err) => {
      const tag = document.createElement("span");
      tag.className = "gram-error-tag";
      tag.textContent = err;
      errSummary.appendChild(tag);
    });
  }

  saveProgress({
    mode: "grammar",
    level: state.grammarLevel,
    scoreCorrect: state.grammarCorrect,
    scoreTotal: state.grammarExercises.length,
    ytlGrade: null,
  });
  show("screen-grammar-results");
}

$("gram-btn-restart").addEventListener("click", () =>
  isLoggedIn() ? loadDashboard() : show("screen-start")
);

// ═══════════════════════════════════════════════════════════════════════════════
// READING COMPREHENSION MODE
// ═══════════════════════════════════════════════════════════════════════════════

async function loadReadingTask() {
  showLoading("Luodaan luetun ymmärtämistehtävää...");

  try {
    const res = await fetch(`${API}/api/reading-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        level: state.readingLevel,
        topic: state.readingTopic,
        language: state.language,
      }),
    });
    if (res.status === 403) { showProUpsell(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tehtävän luonti epäonnistui");
    if (!data.reading) throw new Error("No reading");

    state.currentReading = data.reading;
    state.readingBankId = data.bankId || null;
    state.readingQIndex = 0;
    state.readingScore = 0;

    renderReadingText();
    show("screen-reading");
  } catch (err) {
    showLoadingError(err.message, () => loadReadingTask());
  }
}

function renderReadingText() {
  const r = state.currentReading;
  $("reading-title").textContent = r.title;
  $("reading-source-tag").textContent = r.source || "Texto";
  $("reading-level-badge").textContent = state.readingLevel;
  $("reading-text-body").textContent = r.text;
  $("reading-text-ref-content").textContent = r.text;

  $("reading-sub-text").classList.remove("hidden");
  $("reading-sub-questions").classList.add("hidden");
}

$("btn-start-questions").addEventListener("click", () => {
  $("reading-sub-text").classList.add("hidden");
  $("reading-sub-questions").classList.remove("hidden");
  renderReadingQuestion();
});

function renderReadingQuestion() {
  const q = state.currentReading.questions[state.readingQIndex];
  const total = state.currentReading.questions.length;

  $("reading-q-counter").textContent = `K ${state.readingQIndex + 1} / ${total}`;
  $("reading-progress-fill").style.width = `${(state.readingQIndex / total) * 100}%`;
  $("reading-explanation-block").classList.add("hidden");
  $("reading-btn-next").style.display = "";
  const readReportBtn = $("btn-report-reading");
  if (state.readingBankId) {
    readReportBtn.classList.remove("hidden");
    readReportBtn.disabled = false;
    readReportBtn.textContent = "⚠ Virhe tehtävässä";
  } else {
    readReportBtn.classList.add("hidden");
  }

  // Hide all answer containers
  $("reading-options-container").classList.add("hidden");
  $("reading-tf-container").classList.add("hidden");
  $("reading-short-container").classList.add("hidden");

  // Remove any leftover self-grade rows
  document.querySelectorAll(".reading-self-grade").forEach((el) => el.remove());

  if (q.type === "multiple_choice") {
    $("reading-q-type").textContent = "Monivalinta";
    $("reading-question-text").textContent = q.question;
    $("reading-options-container").classList.remove("hidden");
    renderReadingOptions(q);
  } else if (q.type === "true_false") {
    $("reading-q-type").textContent = "Oikein / Väärin";
    $("reading-question-text").textContent = q.statement;
    $("reading-tf-container").classList.remove("hidden");
    setupTrueFalse(q);
  } else if (q.type === "short_answer") {
    $("reading-q-type").textContent = "Lyhyt vastaus";
    $("reading-question-text").textContent = q.question;
    $("reading-short-container").classList.remove("hidden");
    setupShortAnswer(q);
  }
}

function renderReadingOptions(q) {
  const grid = $("reading-options-grid");
  grid.innerHTML = "";
  q.options.forEach((opt) => {
    const letter = opt.trim()[0];
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      const isCorrect = letter === q.correct;
      if (isCorrect) {
        btn.classList.add("correct");
        state.readingScore++;
      } else {
        btn.classList.add("wrong");
        grid.querySelectorAll(".option-btn").forEach((b) => {
          if (b.textContent.trim()[0] === q.correct) b.classList.add("correct");
        });
      }
      grid.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));
      $("reading-explanation-text").textContent = q.explanation;
      $("reading-explanation-block").classList.remove("hidden");
    });
    grid.appendChild(btn);
  });
}

function setupTrueFalse(q) {
  const trueBtn = $("tf-true");
  const falseBtn = $("tf-false");
  trueBtn.className = "tf-btn";
  falseBtn.className = "tf-btn";
  trueBtn.disabled = false;
  falseBtn.disabled = false;

  const handleTF = (chosen) => {
    const isCorrect = chosen === q.correct;
    if (isCorrect) {
      (chosen ? trueBtn : falseBtn).classList.add("correct");
      state.readingScore++;
    } else {
      (chosen ? trueBtn : falseBtn).classList.add("wrong");
      (chosen ? falseBtn : trueBtn).classList.add("correct");
    }
    trueBtn.disabled = true;
    falseBtn.disabled = true;
    $("reading-explanation-text").textContent =
      `${q.explanation}\n\nTekstistä: "${q.justification}"`;
    $("reading-explanation-block").classList.remove("hidden");
  };

  trueBtn.onclick = () => handleTF(true);
  falseBtn.onclick = () => handleTF(false);
}

function setupShortAnswer(q) {
  const input = $("reading-short-input");
  input.value = "";
  const submitBtn = $("reading-short-submit");

  submitBtn.onclick = () => {
    const answer = input.value.trim();
    if (!answer) return;

    $("reading-short-container").classList.add("hidden");
    $("reading-btn-next").style.display = "none";

    $("reading-explanation-text").innerHTML =
      `<strong>Mallivastaus:</strong> ${q.acceptedAnswers[0]}<br><br>` +
      `<span style="color:var(--ink-soft);font-size:12px">${q.explanation}</span>`;
    $("reading-explanation-block").classList.remove("hidden");

    const row = document.createElement("div");
    row.className = "reading-self-grade";
    row.innerHTML = `<button class="reading-self-correct">✓ Vastasin oikein</button><button class="reading-self-wrong">✗ En saanut oikein</button>`;
    $("reading-explanation-block").appendChild(row);

    row.querySelector(".reading-self-correct").onclick = () => {
      state.readingScore++;
      row.remove();
      $("reading-btn-next").style.display = "";
    };
    row.querySelector(".reading-self-wrong").onclick = () => {
      row.remove();
      $("reading-btn-next").style.display = "";
    };
  };
}

$("reading-btn-next").addEventListener("click", () => {
  state.readingQIndex++;
  if (state.readingQIndex >= state.currentReading.questions.length) {
    showReadingResults();
  } else {
    renderReadingQuestion();
  }
});

function showReadingResults() {
  const total = state.currentReading.questions.length;
  $("reading-score-display").textContent = `${state.readingScore}/${total}`;
  $("reading-score-text").textContent = `${state.readingScore} / ${total} oikein`;

  const pct = state.readingScore / total;
  let fb;
  if (pct === 1)      fb = "Erinomainen! Kaikki oikein.";
  else if (pct >= 0.75) fb = "Hyvä suoritus! Pieni hiominen riittää.";
  else if (pct >= 0.5)  fb = "Kohtalainen. Lue teksti uudelleen tarkemmin.";
  else                  fb = "Harjoittele lisää. Kiinnitä huomiota tekstin yksityiskohtiin.";
  $("reading-overall-feedback").textContent = fb;

  saveProgress({
    mode: "reading",
    level: state.readingLevel,
    scoreCorrect: state.readingScore,
    scoreTotal: state.currentReading.questions.length,
    ytlGrade: null,
  });
  show("screen-reading-results");
}

$("reading-btn-new").addEventListener("click", () => loadReadingTask());
$("reading-btn-home").addEventListener("click", () =>
  isLoggedIn() ? loadDashboard() : show("screen-start")
);

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK EXAM MODE
// ═══════════════════════════════════════════════════════════════════════════════

const EXAM_DURATION_S = 45 * 60; // 45 minutes

let examState = {
  timerInterval: null,
  secondsLeft: EXAM_DURATION_S,
  readingData: null,
  writingTask: null,
  readingAnswers: {},
  phase: "reading", // "reading" | "writing"
};

function examTick() {
  examState.secondsLeft--;
  const m = Math.floor(examState.secondsLeft / 60).toString().padStart(2, "0");
  const s = (examState.secondsLeft % 60).toString().padStart(2, "0");
  $("exam-timer").textContent = `${m}:${s}`;
  if (examState.secondsLeft <= 300) $("exam-timer").classList.add("exam-timer-warn");
  if (examState.secondsLeft <= 0) submitExam();
}

async function startMockExam() {
  showLoading("Luodaan koe...");

  try {
    // Fetch reading task and writing task in parallel
    const [readRes, writeRes] = await Promise.all([
      fetch(`${API}/api/reading-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ topic: "general", level: "C" }),
      }),
      fetch(`${API}/api/writing-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ taskType: "long", topic: "general" }),
      }),
    ]);
    const readData = await readRes.json();
    const writeData = await writeRes.json();
    if (!readData.reading || !writeData.task) throw new Error("Lataus epäonnistui");

    examState = {
      timerInterval: null,
      secondsLeft: EXAM_DURATION_S,
      readingData: readData.reading,
      writingTask: writeData.task,
      readingAnswers: {},
      phase: "reading",
    };

    renderExamReading();
    $("exam-timer").classList.remove("exam-timer-warn");
    $("exam-progress-fill").style.width = "50%";
    $("exam-phase-label").textContent = "Osa 1: Luetun ymmärtäminen";
    $("exam-reading-phase").classList.remove("hidden");
    $("exam-writing-phase").classList.add("hidden");
    show("screen-exam");

    examState.timerInterval = setInterval(examTick, 1000);
  } catch (err) {
    showLoadingError("Kokeen lataus epäonnistui: " + err.message, () => startMockExam());
  }
}

function renderExamReading() {
  const r = examState.readingData;
  $("exam-reading-text").innerHTML = `<h3 style="margin-bottom:12px;font-size:15px">${r.title || ""}</h3>${r.text.replace(/\n/g, "<br/>")}`;

  const qWrap = $("exam-reading-questions");
  qWrap.innerHTML = "";
  r.questions.forEach((q, i) => {
    const block = document.createElement("div");
    block.className = "reading-q-block";
    block.innerHTML = `<div class="reading-q-text">${i + 1}. ${q.question}</div>`;

    if (q.type === "multiple_choice" && q.options) {
      q.options.forEach((opt) => {
        const letter = opt.trim()[0];
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          block.querySelectorAll(".option-btn").forEach((b) => b.classList.remove("selected-answer"));
          btn.classList.add("selected-answer");
          examState.readingAnswers[i] = letter;
        });
        block.appendChild(btn);
      });
    } else {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "auth-input";
      inp.placeholder = "Vastauksesi...";
      inp.style.marginTop = "8px";
      inp.addEventListener("input", () => { examState.readingAnswers[i] = inp.value; });
      block.appendChild(inp);
    }
    qWrap.appendChild(block);
  });
}

$("exam-btn-to-writing").addEventListener("click", () => {
  examState.phase = "writing";
  $("exam-phase-label").textContent = "Osa 2: Kirjoittaminen";
  $("exam-progress-fill").style.width = "100%";
  $("exam-reading-phase").classList.add("hidden");
  $("exam-writing-phase").classList.remove("hidden");

  const t = examState.writingTask;
  $("exam-task-box").innerHTML = `
    <div class="writing-situation">${t.situation}</div>
    <div class="writing-prompt">${t.prompt}</div>
    <ul class="writing-requirements">${(t.requirements || []).map((r) => `<li>${r}</li>`).join("")}</ul>
    <div class="writing-meta">${t.textType} · ${t.charMin}–${t.charMax} merkkiä</div>
  `;

  const inp = $("exam-writing-input");
  inp.value = "";
  $("exam-char-count").textContent = "0 merkkiä";
  inp.addEventListener("input", () => {
    const count = inp.value.replace(/\s/g, "").length;
    const color = count < t.charMin ? "var(--error)" : count > t.charMax ? "var(--error)" : "var(--success)";
    $("exam-char-count").textContent = `${count} merkkiä`;
    $("exam-char-count").style.color = color;
  });
});

$("exam-btn-submit").addEventListener("click", () => submitExam());

async function submitExam() {
  clearInterval(examState.timerInterval);
  const timeUsed = EXAM_DURATION_S - examState.secondsLeft;
  const mins = Math.floor(timeUsed / 60);

  showLoading("Arvioidaan koetta...");

  try {
    // Grade reading
    const r = examState.readingData;
    let readingCorrect = 0;
    r.questions.forEach((q, i) => {
      const ans = (examState.readingAnswers[i] || "").trim().toUpperCase();
      if (q.correct_answer && ans === q.correct_answer.trim().toUpperCase()) readingCorrect++;
    });
    const readingPct = Math.round((readingCorrect / r.questions.length) * 100);

    // Grade writing with AI
    const essay = $("exam-writing-input").value.trim();
    const t = examState.writingTask;
    const gradeRes = await fetch(`${API}/api/grade-writing`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ essay, task: t, taskType: t.taskType }),
    });
    const gradeData = await gradeRes.json();

    // Combined grade: reading 40% + writing 60%
    const GRADE_ORDER = ["I","A","B","C","M","E","L"];
    const writingIdx = GRADE_ORDER.indexOf(gradeData.grade ?? "C");
    const readingIdx = Math.min(6, Math.round((readingPct / 100) * 6));
    const combinedIdx = Math.round(writingIdx * 0.6 + readingIdx * 0.4);
    const combinedGrade = GRADE_ORDER[Math.max(0, Math.min(6, combinedIdx))];

    // Render results
    $("exam-grade-display").textContent = combinedGrade;
    $("exam-results-breakdown").innerHTML = `
      <div class="exam-result-row"><span>Luetun ymmärtäminen</span><span>${readingCorrect}/${r.questions.length} (${readingPct}%)</span></div>
      <div class="exam-result-row"><span>Kirjoittaminen</span><span>${gradeData.grade ?? "—"}</span></div>
      <div class="exam-result-row"><span>Käytetty aika</span><span>${mins} min</span></div>
    `;
    $("exam-overall-feedback").textContent = gradeData.overallFeedback || gradeData.feedback || "";

    saveProgress({ mode: "exam", level: combinedGrade, scoreCorrect: readingCorrect, scoreTotal: r.questions.length, ytlGrade: combinedGrade });
    show("screen-exam-results");
  } catch (err) {
    showLoadingError("Arviointi epäonnistui: " + err.message, () => {
      show("screen-start");
    });
  }
}

$("exam-btn-retry").addEventListener("click", () => startMockExam());
$("exam-btn-home").addEventListener("click", () =>
  isLoggedIn() ? loadDashboard() : show("screen-start")
);
$("btn-share-exam").addEventListener("click", () => {
  const grade = $("exam-grade-display").textContent;
  shareResult(`Tein koeharjoituksen Puheossa 🎓\nYo-koearvosana: ${grade}\nhttps://puheo.fi`);
});

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
