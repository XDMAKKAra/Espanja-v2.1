// Client-side achievements — derived from the existing /api/dashboard payload.
// No backend changes; no new endpoint; no localStorage. The badges re-evaluate
// every render against fresh server data, which means they're always honest.

// Each badge: a stable id, Finnish label + body, an icon glyph (SVG path d), and
// an `unlocked(data) -> boolean` predicate. Order is render order.

const I = {
  spark:  "M5 12h14M12 5l7 7-7 7",
  flame:  "M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-5 0-2-1-2 3-4Z",
  trophy: "M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4ZM5 4h2v3a3 3 0 0 1-3-3ZM17 4h2a3 3 0 0 1-3 3V4Z",
  star:   "m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z",
  pen:    "M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
  crown:  "M3 7l4 6 5-8 5 8 4-6v12H3Z",
  ring:   "M12 3a9 9 0 1 0 9 9",
  bolt:   "M13 2 3 14h7v8l10-12h-7l3-8Z",
};

export const BADGES = [
  {
    id: "first-step",
    title: "Ensimmäinen askel",
    desc: "Tee ensimmäinen harjoitus.",
    icon: I.spark,
    unlocked: (d) => (d.totalSessions || 0) >= 1,
  },
  {
    id: "streak-3",
    title: "Kolmen päivän putki",
    desc: "Harjoittele kolme päivää peräkkäin.",
    icon: I.flame,
    unlocked: (d) => (d.streak || 0) >= 3,
  },
  {
    id: "streak-7",
    title: "Viikon vauhti",
    desc: "Pidä putki yllä seitsemän päivää.",
    icon: I.flame,
    unlocked: (d) => (d.streak || 0) >= 7,
  },
  {
    id: "streak-30",
    title: "Kuukauden mestari",
    desc: "Pidä putki yllä kuukauden.",
    icon: I.crown,
    unlocked: (d) => (d.streak || 0) >= 30,
  },
  {
    id: "sessions-25",
    title: "25 harjoitusta",
    desc: "Tee yhteensä 25 harjoitusta.",
    icon: I.star,
    unlocked: (d) => (d.totalSessions || 0) >= 25,
  },
  {
    id: "sessions-100",
    title: "Sata harjoitusta",
    desc: "Tee yhteensä sata harjoitusta.",
    icon: I.trophy,
    unlocked: (d) => (d.totalSessions || 0) >= 100,
  },
  {
    id: "writing-magna",
    title: "M tai parempi",
    desc: "Saavuta kirjoitustehtävässä YTL-arvosana M, E tai L.",
    icon: I.pen,
    unlocked: (d) => Array.isArray(d.recent) && d.recent.some((r) => ["M", "E", "L"].includes(r.ytlGrade)),
  },
  {
    id: "mode-master",
    title: "Aiheen mestari",
    desc: "Tee yhdellä osa-alueella vähintään 20 harjoitusta.",
    icon: I.bolt,
    unlocked: (d) => {
      const stats = d.modeStats || {};
      return Object.values(stats).some((n) => (n || 0) >= 20);
    },
  },
  {
    id: "weekly-six",
    title: "Viikon kuusi",
    desc: "Tee kuusi harjoitusta yhden viikon aikana.",
    icon: I.ring,
    unlocked: (d) => (d.weekSessions || 0) >= 6,
  },
  {
    id: "pro",
    title: "Pro-jäsen",
    desc: "Tilaaja — kiitos tuestasi.",
    icon: I.crown,
    unlocked: (d) => d.pro === true,
  },
];

export function evaluateAchievements(data = {}) {
  const result = BADGES.map((b) => ({ ...b, isUnlocked: b.unlocked(data) }));
  return {
    unlocked: result.filter((b) => b.isUnlocked),
    locked:   result.filter((b) => !b.isUnlocked),
    all:      result,
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

const SEEN_KEY = "puheo_seen_badges";

function readSeenBadges() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeSeenBadges(set) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
  } catch { /* private mode / quota — silently degrade */ }
}

// Renders the achievements section. Unlocked badges get the foil-shine
// border (CSS — sourced from Magic UI shine-border). Newly-unlocked
// badges (first time the client has seen the id unlocked) get a
// `--new` modifier with a "Uusi" pill + pulse animation, then are
// added to localStorage so the pulse only fires once.
export function renderAchievementsInto(root, data) {
  if (!root) return;
  const { unlocked, all } = evaluateAchievements(data);
  const total = all.length;
  const headEl = document.getElementById("profile-achievements-count");
  if (headEl) headEl.textContent = `${unlocked.length} / ${total}`;

  const seen = readSeenBadges();
  const newlyUnlocked = unlocked.filter((b) => !seen.has(b.id)).map((b) => b.id);

  root.innerHTML = all.map((b) => {
    const isNew = b.isUnlocked && newlyUnlocked.includes(b.id);
    const classes = ["profile-badge-card"];
    classes.push(b.isUnlocked ? "profile-badge-card--unlocked" : "profile-badge-card--locked");
    if (isNew) classes.push("profile-badge-card--new");
    const aria = b.isUnlocked
      ? (isNew ? "Juuri avattu" : "Avattu")
      : "Lukittu";
    return `
      <div class="${classes.join(" ")}" role="group" aria-label="${aria}: ${escapeHtml(b.title)}">
        <span class="profile-badge-card-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${b.icon}"/></svg>
        </span>
        <div class="profile-badge-card-body">
          <div class="profile-badge-card-title">${escapeHtml(b.title)}</div>
          <div class="profile-badge-card-desc">${escapeHtml(b.desc)}</div>
        </div>
      </div>`;
  }).join("");

  if (newlyUnlocked.length > 0) {
    const merged = new Set([...seen, ...newlyUnlocked]);
    writeSeenBadges(merged);
  }
}
