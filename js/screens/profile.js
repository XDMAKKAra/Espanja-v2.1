// Profile screen — destination "Oma sivu" with avatar, stats grid, and recent activity.
// Reuses the /api/dashboard payload (no new endpoint).

import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, clearAuth, authHeader, apiFetch, getAuthEmail } from "../api.js";
import { showLoading } from "../ui/loading.js";
import { MODE_ICONS } from "../ui/icons.js";
import { renderAchievementsInto } from "../features/achievements.js";

let _deps = {};
export function initProfile(deps = {}) {
  _deps = deps;

  // The "Asetukset →" link inside the profile screen footer.
  const settingsLink = document.getElementById("profile-link-settings");
  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      const settingsBtn = document.getElementById("nav-settings");
      if (settingsBtn) settingsBtn.click();
    });
  }

  // CTA inside the empty-state when there's no recent activity yet.
  const emptyCta = document.getElementById("profile-empty-cta");
  if (emptyCta) {
    emptyCta.addEventListener("click", () => {
      const dashBtn = document.getElementById("nav-dashboard");
      if (dashBtn) dashBtn.click();
    });
  }
}

const MODE_NAMES = {
  vocab:   "Sanasto",
  grammar: "Kielioppi",
  reading: "Luetun ymmärtäminen",
  writing: "Kirjoittaminen",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return "juuri äsken";
  if (mins < 60) return `${mins} min sitten`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} t sitten`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} pv sitten`;
  const months = Math.floor(days / 30);
  return `${months} kk sitten`;
}

function initials(email) {
  if (!email) return "—";
  const handle = email.split("@")[0] || "";
  // Split on common separators (._-+) and take first letter of each segment.
  const parts = handle.split(/[._\-+]+/).filter(Boolean);
  if (parts.length === 0) return handle.slice(0, 2).toUpperCase() || "—";
  if (parts.length === 1) {
    const p = parts[0];
    return (p.length >= 2 ? p.slice(0, 2) : p[0]).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export async function loadProfile() {
  showLoading("Ladataan profiilia…");
  try {
    const res = await apiFetch(`${API}/api/dashboard`, { headers: authHeader() });
    if (res.status === 401) {
      clearAuth();
      show("screen-auth");
      return;
    }
    const data = await res.json();
    renderProfile(data);
    show("screen-profile");
  } catch {
    // Render an empty-state version so the user lands on something sensible.
    renderProfile({});
    show("screen-profile");
  }
}

function renderProfile(data = {}) {
  const {
    totalSessions = 0,
    modeStats = {},
    recent = [],
    streak = 0,
    weekSessions = 0,
    estLevel = null,
    pro = false,
  } = data;

  const email = getAuthEmail() || "";
  const handle = email ? email.split("@")[0] : "Käyttäjä";

  // Hero
  const avatarEl = document.getElementById("profile-avatar");
  if (avatarEl) avatarEl.textContent = initials(email);

  const nameEl = document.getElementById("profile-name");
  if (nameEl) nameEl.textContent = handle || "Käyttäjä";

  const handleEl = document.getElementById("profile-handle");
  if (handleEl) handleEl.textContent = email || "—";

  // Blur-fade arrival on the profile hero (sourced: Magic UI blur-fade —
  // same technique used on the dashboard greeting in L35). Idempotent:
  // remove + double-rAF re-add so a fresh transition fires per profile load.
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
    if (pro) {
      chips.push(`<span class="profile-badge profile-badge--pro">Pro</span>`);
    }
    if (streak >= 1) {
      chips.push(`<span class="profile-badge profile-badge--streak">🔥 ${streak} pv putki</span>`);
    }
    const levelChip = estLevel || (window._userProfile?.starting_level) || null;
    if (levelChip) {
      chips.push(`<span class="profile-badge">Taso ${escapeHtml(levelChip)}</span>`);
    }
    badgesEl.innerHTML = chips.join("");
  }

  // Stats
  setStat("profile-stat-streak", streak, streak === 1 ? "päivä" : "päivää");
  setStat("profile-stat-total", totalSessions, totalSessions === 1 ? "harjoitus" : "harjoitusta");
  setStat("profile-stat-week", weekSessions, weekSessions === 1 ? "harjoitus" : "harjoitusta");
  const levelText = estLevel || (window._userProfile?.starting_level) || "—";
  setStat("profile-stat-level", levelText, "");

  // Streak hint
  const streakHint = document.getElementById("profile-stat-streak-hint");
  if (streakHint) {
    if (streak === 0) streakHint.textContent = "Aloita uusi putki tänään.";
    else if (streak < 3) streakHint.textContent = "Pidä pieni rutiini.";
    else if (streak < 7) streakHint.textContent = "Putki rakentuu hyvin.";
    else if (streak < 30) streakHint.textContent = "Tämä on jo tapa.";
    else streakHint.textContent = "Vakuuttava sinnikkyys.";
  }

  // Mode breakdown
  const modesEl = document.getElementById("profile-modes");
  if (modesEl) {
    const modes = ["vocab", "grammar", "reading", "writing"];
    modesEl.innerHTML = modes.map((m) => {
      const count = (modeStats && modeStats[m]) || 0;
      const zero = count === 0 ? " profile-mode-count--zero" : "";
      return `
        <div class="profile-mode-row">
          <span class="profile-mode-icon" aria-hidden="true">${MODE_ICONS[m] || ""}</span>
          <span class="profile-mode-name">${MODE_NAMES[m]}</span>
          <span class="profile-mode-count${zero}">${count}</span>
        </div>`;
    }).join("");
  }

  // Achievements (client-side, derived from this same payload)
  renderAchievementsInto(document.getElementById("profile-achievements"), data);

  // Recent activity
  const activityEl = document.getElementById("profile-activity");
  const emptyEl = document.getElementById("profile-empty");
  if (activityEl && emptyEl) {
    if (recent.length > 0) {
      activityEl.classList.remove("hidden");
      emptyEl.classList.add("hidden");
      const visible = recent.slice(0, 8);
      activityEl.innerHTML = visible.map((log, i) => {
        const name = MODE_NAMES[log.mode] || log.mode;
        const lvl = log.level ? ` · taso ${escapeHtml(log.level)}` : "";
        const ic  = MODE_ICONS[log.mode] || "";
        const score = (log.scoreTotal > 0)
          ? `<span class="profile-activity-score">${log.scoreCorrect}/${log.scoreTotal}</span>`
          : "";
        const grade = log.ytlGrade
          ? `<span class="profile-activity-grade">${escapeHtml(log.ytlGrade)}</span>`
          : "";
        // Per-row stagger (sourced: Magic UI animated-list reveal). 55ms per
        // row caps the cascade at ~440ms total for the full 8-item slice —
        // long enough to read as intentional, short enough to never block.
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
      // Trigger the reveal on the next frame so the initial-state styles
      // commit before the transition starts.
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
}

function setStat(id, value, unit) {
  const valEl = document.getElementById(id);
  if (!valEl) return;
  valEl.innerHTML = `${escapeHtml(String(value))}<span class="profile-stat-unit">${escapeHtml(unit || "")}</span>`;
}
