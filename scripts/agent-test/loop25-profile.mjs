// Loop 25 — visually verify the new #screen-profile destination at desktop + mobile.
// Skips the API auth path: instead injects mock data into the rendered DOM so the
// layout, type, and palette can be reviewed independent of a real session.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { slug: "profile-desktop", viewport: { width: 1440, height: 900 } },
  { slug: "profile-mobile",  viewport: { width: 375,  height: 812 } },
  { slug: "profile-empty",   viewport: { width: 1440, height: 900 }, empty: true },
];

const MOCK_RECENT = [
  { mode: "writing", level: "C", scoreCorrect: 27, scoreTotal: 33, ytlGrade: "M", createdAt: new Date(Date.now() - 6 * 60_000).toISOString().slice(0, 19) },
  { mode: "vocab",   level: "B", scoreCorrect: 9,  scoreTotal: 12, ytlGrade: null, createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString().slice(0, 19) },
  { mode: "grammar", level: "C", scoreCorrect: 5,  scoreTotal: 6,  ytlGrade: null, createdAt: new Date(Date.now() - 8 * 3_600_000).toISOString().slice(0, 19) },
  { mode: "reading", level: "C", scoreCorrect: 4,  scoreTotal: 5,  ytlGrade: null, createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString().slice(0, 19) },
  { mode: "vocab",   level: "B", scoreCorrect: 11, scoreTotal: 12, ytlGrade: null, createdAt: new Date(Date.now() - 50 * 3_600_000).toISOString().slice(0, 19) },
  { mode: "writing", level: "C", scoreCorrect: 30, scoreTotal: 33, ytlGrade: "E", createdAt: new Date(Date.now() - 4 * 86_400_000).toISOString().slice(0, 19) },
];

const errors = [];
const browser = await chromium.launch();
try {
  for (const p of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: p.viewport });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`[${p.slug}] console.error: ${m.text()}`);
    });
    page.on("pageerror", (e) => errors.push(`[${p.slug}] pageerror: ${e.message}`));

    // Pre-populate localStorage so getAuthEmail() returns something realistic.
    await page.addInitScript(() => {
      localStorage.setItem("puheo_token", "mock");
      localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
    });

    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(900);

    // Bypass the API: show the profile screen directly, then run the renderer
    // through a tiny inlined copy of the rendering shape (data is mocked).
    await page.evaluate(({ recent, empty }) => {
      // Hide every screen, show profile.
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      const prof = document.getElementById("screen-profile");
      if (prof) prof.classList.add("active");

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

      const data = empty
        ? { totalSessions: 0, modeStats: {}, recent: [], streak: 0, weekSessions: 0, estLevel: null, pro: false }
        : { totalSessions: 47, modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 }, recent, streak: 11, weekSessions: 6, estLevel: "C", pro: true };

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

      const hint = document.getElementById("profile-stat-streak-hint");
      if (hint) {
        if (data.streak === 0) hint.textContent = "Aloita uusi putki tänään.";
        else if (data.streak < 7) hint.textContent = "Putki rakentuu hyvin.";
        else if (data.streak < 30) hint.textContent = "Tämä on jo tapa.";
        else hint.textContent = "Vakuuttava sinnikkyys.";
      }

      const MODE_NAMES = { vocab: "Sanasto", grammar: "Kielioppi", reading: "Luetun ymmärtäminen", writing: "Kirjoittaminen" };
      const modesEl = document.getElementById("profile-modes");
      modesEl.innerHTML = ["vocab", "grammar", "reading", "writing"].map((m) => {
        const c = data.modeStats[m] || 0;
        const z = c === 0 ? " profile-mode-count--zero" : "";
        return `<div class="profile-mode-row"><span class="profile-mode-icon" aria-hidden="true">●</span><span class="profile-mode-name">${MODE_NAMES[m]}</span><span class="profile-mode-count${z}">${c}</span></div>`;
      }).join("");

      const activityEl = document.getElementById("profile-activity");
      const emptyEl = document.getElementById("profile-empty");
      if (data.recent.length > 0) {
        activityEl.classList.remove("hidden");
        emptyEl.classList.add("hidden");
        activityEl.innerHTML = data.recent.slice(0, 8).map((log) => {
          const name = MODE_NAMES[log.mode] || log.mode;
          const lvl = log.level ? ` · taso ${log.level}` : "";
          const score = (log.scoreTotal > 0) ? `<span class="profile-activity-score">${log.scoreCorrect}/${log.scoreTotal}</span>` : "";
          const grade = log.ytlGrade ? `<span class="profile-activity-grade">${log.ytlGrade}</span>` : "";
          const diff = Date.now() - new Date(log.createdAt + "Z").getTime();
          const mins = Math.floor(diff / 60000);
          let when = "juuri äsken";
          if (mins >= 2 && mins < 60) when = `${mins} min sitten`;
          else if (mins < 1440) when = `${Math.floor(mins / 60)} t sitten`;
          else when = `${Math.floor(mins / 1440)} pv sitten`;
          return `<div class="profile-activity-row"><span class="profile-activity-icon" aria-hidden="true">●</span><div class="profile-activity-main"><div class="profile-activity-mode">${name}${lvl}</div><div class="profile-activity-time">${when}</div></div><div class="profile-activity-right">${score}${grade}</div></div>`;
        }).join("");
      } else {
        activityEl.classList.add("hidden");
        emptyEl.classList.remove("hidden");
      }
    }, { recent: MOCK_RECENT, empty: !!p.empty });

    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `loop-25-${p.slug}.png`), fullPage: true });
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (errors.length) {
  console.error("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
} else {
  console.log("OK — profile screenshots saved");
}
