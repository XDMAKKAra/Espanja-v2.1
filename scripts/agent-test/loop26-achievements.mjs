// Loop 26 — visually verify the new achievements section on the profile screen.
// Imports the real achievements module via a dynamic browser-side import so the
// rendered grid uses the production code path, not a re-implementation.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

// Two scenarios: a "mid-progress" user (some unlocked, some not) and a "veteran"
// user (almost everything unlocked) — confirms that locked vs unlocked render
// distinctly and side-by-side.
const SCENARIOS = [
  {
    slug: "achievements-mid",
    viewport: { width: 1440, height: 900 },
    data: {
      totalSessions: 28,
      modeStats: { vocab: 12, grammar: 8, reading: 5, writing: 3 },
      recent: [{ mode: "writing", level: "C", scoreCorrect: 27, scoreTotal: 33, ytlGrade: "M", createdAt: new Date(Date.now() - 6 * 60_000).toISOString().slice(0, 19) }],
      streak: 5,
      weekSessions: 4,
      estLevel: "C",
      pro: false,
    },
  },
  {
    slug: "achievements-veteran",
    viewport: { width: 1440, height: 900 },
    data: {
      totalSessions: 142,
      modeStats: { vocab: 58, grammar: 31, reading: 27, writing: 26 },
      recent: [{ mode: "writing", level: "C", scoreCorrect: 30, scoreTotal: 33, ytlGrade: "E", createdAt: new Date(Date.now() - 60_000).toISOString().slice(0, 19) }],
      streak: 34,
      weekSessions: 7,
      estLevel: "M",
      pro: true,
    },
  },
  {
    slug: "achievements-mobile",
    viewport: { width: 375, height: 812 },
    data: {
      totalSessions: 28,
      modeStats: { vocab: 12, grammar: 8, reading: 5, writing: 3 },
      recent: [{ mode: "writing", level: "C", scoreCorrect: 27, scoreTotal: 33, ytlGrade: "M", createdAt: new Date(Date.now() - 6 * 60_000).toISOString().slice(0, 19) }],
      streak: 5,
      weekSessions: 4,
      estLevel: "C",
      pro: false,
    },
  },
];

const errors = [];
const browser = await chromium.launch();
try {
  for (const s of SCENARIOS) {
    const ctx = await browser.newContext({ viewport: s.viewport });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`[${s.slug}] console.error: ${m.text()}`);
    });
    page.on("pageerror", (e) => errors.push(`[${s.slug}] pageerror: ${e.message}`));

    await page.addInitScript(() => {
      localStorage.setItem("puheo_token", "mock");
      localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
    });

    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(900);

    await page.evaluate(async (data) => {
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      const prof = document.getElementById("screen-profile");
      if (prof) prof.classList.add("active");

      // Hero
      const email = "ronja.virtanen@gmail.com";
      const handle = email.split("@")[0];
      const initials = (() => {
        const parts = handle.split(/[._\-+]+/).filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return handle.slice(0, 2).toUpperCase();
      })();
      document.getElementById("profile-avatar").textContent = initials;
      document.getElementById("profile-name").textContent = handle;
      document.getElementById("profile-handle").textContent = email;

      const badges = [];
      if (data.pro) badges.push(`<span class="profile-badge profile-badge--pro">Pro</span>`);
      if (data.streak >= 1) badges.push(`<span class="profile-badge profile-badge--streak">🔥 ${data.streak} pv putki</span>`);
      if (data.estLevel) badges.push(`<span class="profile-badge">Taso ${data.estLevel}</span>`);
      document.getElementById("profile-badges").innerHTML = badges.join("");

      const setStat = (id, value, unit) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `${value}<span class="profile-stat-unit">${unit}</span>`;
      };
      setStat("profile-stat-streak", data.streak, data.streak === 1 ? "päivä" : "päivää");
      setStat("profile-stat-total",  data.totalSessions, data.totalSessions === 1 ? "harjoitus" : "harjoitusta");
      setStat("profile-stat-week",   data.weekSessions, data.weekSessions === 1 ? "harjoitus" : "harjoitusta");
      setStat("profile-stat-level",  data.estLevel || "—", "");

      const MODE_NAMES = { vocab: "Sanasto", grammar: "Kielioppi", reading: "Luetun ymmärtäminen", writing: "Kirjoittaminen" };
      const modesEl = document.getElementById("profile-modes");
      modesEl.innerHTML = ["vocab", "grammar", "reading", "writing"].map((m) => {
        const c = data.modeStats[m] || 0;
        const z = c === 0 ? " profile-mode-count--zero" : "";
        return `<div class="profile-mode-row"><span class="profile-mode-icon" aria-hidden="true">●</span><span class="profile-mode-name">${MODE_NAMES[m]}</span><span class="profile-mode-count${z}">${c}</span></div>`;
      }).join("");

      // Use the real achievements module
      const mod = await import("/js/features/achievements.js");
      mod.renderAchievementsInto(document.getElementById("profile-achievements"), data);

      // Hide activity for clean shot of the new section
      document.getElementById("profile-activity").classList.add("hidden");
      document.getElementById("profile-empty").classList.add("hidden");
    }, s.data);

    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `loop-26-${s.slug}.png`), fullPage: true });
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (errors.filter((e) => !/401|404/.test(e)).length) {
  console.error("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
} else {
  console.log("OK — achievements screenshots saved");
}
