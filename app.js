const API = "http://localhost:3000";
const LEVELS = ["I", "A", "B", "C", "M", "E", "L"];

// ─── Auth state ───────────────────────────────────────────────────────────────

let authToken = localStorage.getItem("kielio_token");
let authEmail = localStorage.getItem("kielio_email");

function isLoggedIn() { return !!authToken; }

function authHeader() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function setAuth(token, email) {
  authToken = token;
  authEmail = email;
  localStorage.setItem("kielio_token", token);
  localStorage.setItem("kielio_email", email);
}

function clearAuth() {
  authToken = null;
  authEmail = null;
  localStorage.removeItem("kielio_token");
  localStorage.removeItem("kielio_email");
}
const BATCH_SIZE = 4;
const MAX_BATCHES = 3;

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
  mode: "vocab", // "vocab" | "grammar" | "reading" | "writing"
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
    await fetch(`${API}/api/progress`, {
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
    setAuth(data.token, data.email);
    await loadDashboard();
  } catch {
    errEl.textContent = "Ei yhteyttä palvelimeen";
    errEl.classList.remove("hidden");
  } finally {
    $("btn-auth-submit").disabled = false;
    $("btn-auth-submit").textContent = authMode === "login" ? "Kirjaudu sisään →" : "Luo tili →";
  }
});

$("btn-guest").addEventListener("click", () => show("screen-start"));

// ─── Dashboard ────────────────────────────────────────────────────────────────

const MODE_META = {
  vocab:   { icon: "📚", name: "Sanasto" },
  grammar: { icon: "🔧", name: "Kielioppi" },
  reading: { icon: "📖", name: "Luetun ymmärtäminen" },
  writing: { icon: "✍️", name: "Kirjoittaminen" },
};

async function loadDashboard() {
  show("screen-loading");
  $("loading-text").textContent = "Ladataan...";
  try {
    const res = await fetch(`${API}/api/dashboard`, { headers: authHeader() });
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
  suggestedLevel = "B", modeDaysAgo = {},
}) {
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

  // Stats row: estimated level
  $("dash-est-level").textContent = estLevel || "—";

  // Streak
  const streakEl = $("dash-streak");
  if (streakEl) {
    if (streak >= 7) {
      streakEl.textContent = `🔥${streak}`;
      streakEl.className = "dash-stat-value dash-stat-streak-active";
    } else if (streak >= 3) {
      streakEl.textContent = `⚡${streak}`;
      streakEl.className = "dash-stat-value dash-stat-streak-active";
    } else {
      streakEl.textContent = streak;
      streakEl.className = "dash-stat-value";
    }
  }

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

  // Progress chart
  renderProgressChart(chartData);

  // Store for smart start
  window._dashSuggestedLevel = suggestedLevel;
  window._dashModeDaysAgo = modeDaysAgo;

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

function loadLastSettings(forcedMode) {
  try {
    const p = JSON.parse(localStorage.getItem("kielio_settings") || "null");

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

$("btn-logout").addEventListener("click", () => {
  clearAuth();
  show("screen-auth");
});

$("btn-dash-start").addEventListener("click", () => {
  $("btn-back-to-dash").classList.remove("hidden");
  loadLastSettings();
  show("screen-start");
});

$("btn-back-to-dash").addEventListener("click", () => loadDashboard());

// ─── Startup ──────────────────────────────────────────────────────────────────

if (isLoggedIn()) {
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

  // Vocab exercise screen
  if ($("screen-exercise").classList.contains("active")) {
    if (["A", "B", "C", "D"].includes(key)) {
      const btn = [...document.querySelectorAll("#options-grid .option-btn:not(:disabled)")]
        .find((b) => b.textContent.trim()[0].toUpperCase() === key);
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
    if (["A", "B", "C", "D"].includes(key)) {
      const btn = [...document.querySelectorAll("#gram-options-grid .option-btn:not(:disabled)")]
        .find((b) => b.textContent.trim()[0].toUpperCase() === key);
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

  show("screen-loading");
  $("loading-text").textContent = `Luodaan kierros ${state.batchNumber}/${MAX_BATCHES}...`;

  try {
    const res = await fetch(`${API}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: state.level, topic: state.topic, count: BATCH_SIZE }),
    });
    const data = await res.json();
    if (!data.exercises?.length) throw new Error("No exercises");

    state.exercises = data.exercises;
    renderExercise();
    show("screen-exercise");
  } catch (err) {
    alert("Yhteysongelma palvelimeen. Onko server käynnissä?\n\n" + err.message);
    show("screen-start");
  }
}

function renderExercise() {
  const ex = state.exercises[state.current];
  const questionNum = (state.batchNumber - 1) * BATCH_SIZE + state.current + 1;
  const totalQuestions = MAX_BATCHES * BATCH_SIZE;

  $("ex-counter").textContent = `Q ${questionNum} / ${totalQuestions}`;
  $("ex-round").textContent = `Kierros ${state.batchNumber}/${MAX_BATCHES}`;
  $("ex-level-badge").textContent = state.level;
  $("progress-fill").style.width = `${((questionNum - 1) / totalQuestions) * 100}%`;
  $("question-text").textContent = ex.question;

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
  } else {
    clickedBtn.classList.add("wrong");
    document.querySelectorAll(".option-btn").forEach((btn) => {
      if (btn.textContent.trim()[0] === ex.correct) btn.classList.add("correct");
    });
  }

  state.totalAnswered++;
  document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));
  $("explanation-text").textContent = ex.explanation;
  $("explanation-block").classList.remove("hidden");
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
  show("screen-loading");
  $("loading-text").textContent = "Lasketaan arvosanaa...";

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
        const prevGrade = localStorage.getItem("kielio_last_vocab_grade");
        const GRADE_ORDER_LOCAL = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };
        if (prevGrade && (GRADE_ORDER_LOCAL[data.grade] ?? -1) > (GRADE_ORDER_LOCAL[prevGrade] ?? -1)) {
          bannerEl.textContent = `🎉 Parempi kuin viime kerralla! ${prevGrade} → ${data.grade}`;
          bannerEl.classList.remove("hidden");
        } else {
          bannerEl.classList.add("hidden");
        }
      } catch { bannerEl.classList.add("hidden"); }
      localStorage.setItem("kielio_last_vocab_grade", data.grade);
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
    alert("Virhe arvosanan laskemisessa: " + err.message);
    show("screen-start");
  }
}

$("btn-restart").addEventListener("click", () =>
  isLoggedIn() ? loadDashboard() : show("screen-start")
);

// ═══════════════════════════════════════════════════════════════════════════════
// WRITING MODE
// ═══════════════════════════════════════════════════════════════════════════════

async function loadWritingTask() {
  show("screen-loading");
  $("loading-text").textContent = "Luodaan kirjoitustehtävää...";

  try {
    const res = await fetch(`${API}/api/writing-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskType: state.writingTaskType,
        topic: state.writingTopic,
      }),
    });
    const data = await res.json();
    if (!data.task) throw new Error("No task");

    state.currentWritingTask = data.task;
    renderWritingTask(data.task);
    show("screen-writing");
  } catch (err) {
    alert("Yhteysongelma palvelimeen.\n\n" + err.message);
    show("screen-start");
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

  show("screen-loading");
  $("loading-text").textContent = "Arvioidaan vastaustasi...";

  try {
    const res = await fetch(`${API}/api/grade-writing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    alert("Arviointivirhe: " + err.message);
    show("screen-writing");
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
  show("screen-loading");
  $("loading-text").textContent = "Luodaan kielioppiharjoituksia...";

  try {
    const res = await fetch(`${API}/api/grammar-drill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: state.grammarTopic,
        level: state.grammarLevel,
        count: 6,
      }),
    });
    const data = await res.json();
    if (!data.exercises?.length) throw new Error("No exercises");

    state.grammarExercises = data.exercises;
    state.grammarCurrent = 0;
    state.grammarCorrect = 0;
    state.grammarErrors = [];

    renderGrammarExercise();
    show("screen-grammar");
  } catch (err) {
    alert("Yhteysongelma: " + err.message);
    show("screen-start");
  }
}

function renderGrammarExercise() {
  const ex = state.grammarExercises[state.grammarCurrent];
  const total = state.grammarExercises.length;

  $("gram-counter").textContent = `${state.grammarCurrent + 1} / ${total}`;
  $("gram-level-badge").textContent = state.grammarLevel;
  $("gram-topic-badge").textContent = state.grammarTopic === "mixed" ? "kielioppi" : state.grammarTopic.replace("_", "/");
  $("gram-progress-fill").style.width = `${(state.grammarCurrent / total) * 100}%`;
  $("gram-instruction").textContent = ex.instruction;
  $("gram-sentence").textContent = ex.sentence;
  $("gram-rule-tag").textContent = "";
  $("gram-explanation-block").classList.add("hidden");

  const grid = $("gram-options-grid");
  grid.innerHTML = "";
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
      "font-family:var(--font-mono);font-size:11px;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;";
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
  show("screen-loading");
  $("loading-text").textContent = "Luodaan luetun ymmärtämistehtävää...";

  try {
    const res = await fetch(`${API}/api/reading-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: state.readingLevel,
        topic: state.readingTopic,
      }),
    });
    const data = await res.json();
    if (!data.reading) throw new Error("No reading");

    state.currentReading = data.reading;
    state.readingQIndex = 0;
    state.readingScore = 0;

    renderReadingText();
    show("screen-reading");
  } catch (err) {
    alert("Yhteysongelma: " + err.message);
    show("screen-start");
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
      `<span style="color:var(--text-muted);font-size:12px">${q.explanation}</span>`;
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
