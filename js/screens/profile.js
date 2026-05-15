// Profile screen — single-viewport "Oma sivu" with hero strip, 4 stats,
// 4-up mode breakdown, recent activity (3 rows), and inline editable
// settings chips. Reuses /api/dashboard for stats + /api/learning-path
// for readiness%. Chips drive the existing settings modal via the
// `openSettingsEditor` helper exported from settings.js.

import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, clearAuth, authHeader, apiFetch, getAuthEmail } from "../api.js";
import { showLoading } from "../ui/loading.js";
import { MODE_ICONS } from "../ui/icons.js";
import { timeAgo } from "../ui/timeAgo.js";
import { computeReadinessMap, getRecentWritingDimensions } from "../features/writingProgression.js";
import { openSettingsEditor } from "./settings.js";

let _deps = {};
export function initProfile(deps = {}) {
  _deps = deps;

  const settingsLink = document.getElementById("profile-link-settings");
  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      const settingsBtn = document.getElementById("nav-settings");
      if (settingsBtn) settingsBtn.click();
    });
  }

  const emptyCta = document.getElementById("profile-empty-cta");
  if (emptyCta) {
    emptyCta.addEventListener("click", () => {
      const dashBtn = document.getElementById("nav-dashboard");
      if (dashBtn) dashBtn.click();
    });
  }

  // Re-render chips whenever the settings modal saves a field.
  document.addEventListener("puheo:profile-updated", (e) => {
    const profile = e.detail?.profile || window._userProfile;
    renderChips(profile || {});
  });
}

const MODE_NAMES = {
  vocab:   "Sanasto",
  grammar: "Kielioppi",
  reading: "Lukeminen",
  writing: "Kirjoittaminen",
};

const TARGET_GRADE_LABELS = {
  B: "B · Hyväksytty",
  C: "C · Tyydyttävä",
  M: "M · Hyvä",
  E: "E · Erinomainen",
  L: "L · Huippu",
};

const STUDY_BG_LABELS = {
  lukio: "Lukio",
  ylakoulu_lukio: "Yläkoulu+lukio",
  alakoulu: "Alakoulusta",
  asunut: "Asunut Esp.-maassa",
  kotikieli: "Kotikieli",
};

const MONTH_LABELS = {
  "2026-03": "Kevät 2026",
  "2026-09": "Syksy 2026",
  "2027-03": "Kevät 2027",
  "2027-09": "Syksy 2027",
  "2028-03": "Kevät 2028",
};

function initials(email) {
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

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function daysUntilExam(examDate) {
  if (!examDate) return null;
  const t = Date.parse(examDate);
  if (!Number.isFinite(t)) return null;
  const days = Math.ceil((t - Date.now()) / 86400000);
  return days < 0 ? null : days;
}

function formatExamDate(val) {
  if (!val) return null;
  const ym = String(val).slice(0, 7);
  return MONTH_LABELS[ym] || ym;
}

export async function loadProfile() {
  showLoading("Ladataan profiilia…");
  let dashboardData = {};
  let learningPath = [];
  try {
    const profilePromise = window._userProfile
      ? Promise.resolve(null)
      : apiFetch(`${API}/api/profile`, { headers: authHeader() }).catch(() => null);
    const [dashRes, pathRes, profRes, currRes] = await Promise.all([
      apiFetch(`${API}/api/dashboard`, { headers: authHeader() }),
      apiFetch(`${API}/api/learning-path`, { headers: authHeader() }).catch(() => null),
      profilePromise,
      apiFetch(`${API}/api/curriculum`, { headers: authHeader() }).catch(() => null),
    ]);
    if (dashRes.status === 401) {
      clearAuth();
      show("screen-auth");
      return;
    }
    dashboardData = await dashRes.json().catch(() => ({}));
    if (pathRes && pathRes.ok) {
      const pathJson = await pathRes.json().catch(() => ({}));
      learningPath = pathJson.path || [];
    }
    if (profRes && profRes.ok) {
      const profJson = await profRes.json().catch(() => ({}));
      if (profJson.profile) window._userProfile = profJson.profile;
    }
    if (currRes && currRes.ok) {
      const currJson = await currRes.json().catch(() => ({}));
      dashboardData._kurssit = currJson.kurssit || [];
    }
  } catch {
    /* fall through to render empty state */
  }
  renderProfile(dashboardData, learningPath);
  show("screen-profile");
}

function renderProfile(data = {}, learningPath = []) {
  const {
    totalSessions = 0,
    modeStats = {},
    recent = [],
    streak = 0,
    weekSessions = 0,
    estLevel = null,
    pro = false,
  } = data;

  const profile = window._userProfile || {};
  const email = getAuthEmail() || "";
  const handle = email ? email.split("@")[0] : "Käyttäjä";

  // Hero — avatar / name / handle
  const avatarEl = document.getElementById("profile-avatar");
  if (avatarEl) avatarEl.textContent = initials(email);
  const nameEl = document.getElementById("profile-name");
  if (nameEl) nameEl.textContent = handle || "Käyttäjä";
  const handleEl = document.getElementById("profile-handle");
  if (handleEl) handleEl.textContent = email || "—";

  // Hero countdown
  const cdWrap = document.getElementById("profile-hero-countdown");
  const cdNum = document.getElementById("profile-hero-countdown-num");
  if (cdWrap && cdNum) {
    const days = daysUntilExam(profile.exam_date);
    if (days != null) {
      cdNum.textContent = String(days);
      cdWrap.hidden = false;
    } else {
      cdWrap.hidden = true;
    }
  }

  // Blur-fade on hero (sourced L36 — Magic UI blur-fade pattern).
  const heroEl = document.querySelector("#screen-profile .profile-hero");
  if (heroEl) {
    heroEl.classList.remove("profile-hero--in");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      heroEl.classList.add("profile-hero--in");
    }));
  }

  // Badges
  const badgesEl = document.getElementById("profile-badges");
  if (badgesEl) {
    const chips = [];
    if (pro) chips.push(`<span class="profile-badge profile-badge--pro">Pro</span>`);
    if (streak >= 1) chips.push(`<span class="profile-badge profile-badge--streak">🔥 ${streak} pv</span>`);
    const levelChip = estLevel || profile.starting_level || profile.current_grade;
    if (levelChip) chips.push(`<span class="profile-badge">Taso ${escapeHtml(levelChip)}</span>`);
    badgesEl.innerHTML = chips.join("");
  }

  // Readiness % — match the dashboard YO-valmius tile exactly so the same
  // user never sees two different numbers across screens. Dashboard derives
  // this from completed-lesson share across the 8 kurssit; mirror that.
  let readinessPct = 0;
  const kurssit = Array.isArray(data._kurssit) ? data._kurssit : [];
  if (kurssit.length) {
    let done = 0, total = 0;
    for (const k of kurssit) {
      const t = (k.lessons || []).length || k.totalLessons || 0;
      const d = (k.lessons || []).filter(l => l && l.completed).length
              || k.completedLessons || 0;
      done += d; total += t;
    }
    readinessPct = total > 0 ? Math.round((done / total) * 100) : 0;
  } else {
    try {
      const writingDims = getRecentWritingDimensions(5);
      const map = computeReadinessMap({ learningPath, writingDims });
      readinessPct = map.readinessPct || 0;
    } catch { /* keep 0 */ }
  }

  // Stats row
  setStat("profile-stat-streak", streak, "pv");
  setStat("profile-stat-total", totalSessions, "");
  setStat("profile-stat-week", weekSessions, "");
  setStat("profile-stat-readiness", readinessPct, "%");

  // Mode breakdown — 4 cells
  const modesEl = document.getElementById("profile-modes");
  if (modesEl) {
    const modes = ["vocab", "grammar", "reading", "writing"];
    modesEl.innerHTML = modes.map((m) => {
      const count = (modeStats && modeStats[m]?.sessions) || 0;
      const zero = count === 0 ? " profile-mode-count--zero" : "";
      return `
        <div class="profile-mode-row">
          <span class="profile-mode-icon" aria-hidden="true">${MODE_ICONS[m] || ""}</span>
          <span class="profile-mode-name">${MODE_NAMES[m]}</span>
          <span class="profile-mode-count${zero}">${count}</span>
        </div>`;
    }).join("");
  }

  // Recent activity — capped at 3 rows for the single-viewport budget.
  const activityEl = document.getElementById("profile-activity");
  const emptyEl = document.getElementById("profile-empty");
  if (activityEl && emptyEl) {
    if (recent.length > 0) {
      activityEl.classList.remove("hidden");
      emptyEl.classList.add("hidden");
      const visible = recent.slice(0, 3);
      activityEl.innerHTML = visible.map((log, i) => {
        const name = MODE_NAMES[log.mode] || log.mode;
        const lvl = log.level ? ` · ${escapeHtml(log.level)}` : "";
        const ic  = MODE_ICONS[log.mode] || "";
        const score = (log.scoreTotal > 0)
          ? `<span class="profile-activity-score">${log.scoreCorrect}/${log.scoreTotal}</span>`
          : "";
        const grade = log.ytlGrade
          ? `<span class="profile-activity-grade">${escapeHtml(log.ytlGrade)}</span>`
          : "";
        return `
          <div class="profile-activity-row" style="--enter-delay:${i * 55}ms">
            <span class="profile-activity-icon" aria-hidden="true">${ic}</span>
            <div class="profile-activity-main">
              <div class="profile-activity-mode">${escapeHtml(name)}${lvl}</div>
              <div class="profile-activity-time">${escapeHtml(timeAgo(log.createdAt))}</div>
            </div>
            <div class="profile-activity-right">${score}${grade}</div>
          </div>`;
      }).join("");
      requestAnimationFrame(() => {
        activityEl.querySelectorAll(".profile-activity-row").forEach((r) => {
          r.classList.add("profile-activity-row--enter");
        });
      });
    } else {
      activityEl.classList.add("hidden");
      emptyEl.classList.remove("hidden");
    }
  }

  // Settings chips — 5 most-used fields with current value + Edit button.
  renderChips(profile);
}

const CHIP_FIELDS = [
  { key: "exam_date",                 label: "Kokeen päivä",
    render: (p) => formatExamDate(p.exam_date) || "—" },
  { key: "preferred_session_length",  label: "Päivätavoite",
    render: (p) => p.preferred_session_length ? `${p.preferred_session_length} min` : "—" },
  { key: "target_grade",              label: "Tavoite",
    render: (p) => TARGET_GRADE_LABELS[p.target_grade] || "—" },
  { key: "spanish_grade_average",     label: "Keskiarvo",
    render: (p) => p.spanish_grade_average == null ? "—" : String(p.spanish_grade_average) },
  { key: "study_background",          label: "Tausta",
    render: (p) => STUDY_BG_LABELS[p.study_background] || "—" },
];

function renderChips(profile) {
  const wrap = document.getElementById("profile-chips");
  if (!wrap) return;
  wrap.innerHTML = CHIP_FIELDS.map((f) => {
    const val = f.render(profile || {});
    const empty = !val || val === "—";
    return `
      <div class="profile-chip" data-field="${f.key}">
        <div class="profile-chip-main">
          <span class="profile-chip-label">${escapeHtml(f.label)}</span>
          <span class="profile-chip-value${empty ? " is-empty" : ""}">${escapeHtml(empty ? "ei asetettu" : val)}</span>
        </div>
        <button type="button" class="profile-chip-edit" data-field="${f.key}" aria-label="Muokkaa ${escapeHtml(f.label)}">Muokkaa</button>
      </div>`;
  }).join("");
  wrap.querySelectorAll(".profile-chip-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.field;
      openSettingsEditor(field).catch(() => {});
    });
  });
}

function setStat(id, value, unit) {
  const valEl = document.getElementById(id);
  if (!valEl) return;
  valEl.innerHTML = `${escapeHtml(String(value))}<span class="profile-stat-unit">${escapeHtml(unit || "")}</span>`;
}
