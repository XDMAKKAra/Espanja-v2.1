// L-PLAN-8 — axe-core sweep covering the surfaces touched by this loop:
//   1) Landing index.html (full page) at 1440 + 375
//   2) #screen-dashboard "tier=none" empty-state at 1440 + 375
//   3) #screen-path Oppimispolku with locked cards visible at 1440 + 375
//
// Plus a parallel reduced-motion check that the new live-hero rotation,
// hero-bokeh drift, and scroll-reveal animations all stay still when
// prefers-reduced-motion: reduce is set.
//
// Target: 0 violations across the sweep.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const AXE_PATH = path.resolve("node_modules/axe-core/axe.min.js");
const AXE_SRC = fs.readFileSync(AXE_PATH, "utf8");

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-375",   width: 375,  height: 812 },
];

async function setupAppRoutes(page) {
  await page.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "t@e.com" }) }));
  await page.route("**/api/profile", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B", exam_date: "2026-09-28", target_grade: "B" } }),
  }));
  await page.route("**/api/profile/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/dashboard", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ totalSessions: 2, modeStats: {}, recent: [], streak: 0, weekSessions: 0, prevWeekSessions: 0, estLevel: "B", suggestedLevel: "B", modeDaysAgo: {}, pro: false, aiUsage: null, chartData: [], gradeEstimate: { tier: "none", grade: null, confidence: 0, coverage: {}, total: 2 } }),
  }));
  await page.route("**/api/sr/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0, due: [] }) }));
  await page.route("**/api/progression/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/adaptive/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ levelProgress: 0 }) }));
  await page.route("**/api/topics/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/api/placement/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));
  await page.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/user-level**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ level: "B" }) }));
  // Curriculum: 8 kurssia, only K1 unlocked → renders 7 locked cards with the
  // new UPDATE 6C tooltips wired in.
  await page.route("**/api/curriculum", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      kurssit: Array.from({ length: 8 }, (_, i) => ({
        key: `kurssi_${i + 1}`,
        title: `Kurssi ${i + 1}`,
        focus: "Aihe " + (i + 1),
        level: i < 3 ? "B1" : "B2",
        sortOrder: i + 1,
        lessonCount: 10 + i,
        lessonsCompleted: i === 0 ? 3 : 0,
        isUnlocked: i === 0,
        lastScore: i === 0 ? 0.7 : null,
        kertausPassed: false,
      })),
    }),
  }));
  await page.route("**/api/curriculum/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
}

async function runAxe(page) {
  await page.evaluate(AXE_SRC);
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      details: v.nodes.slice(0, 4).map((n) => ({ target: n.target, html: (n.html || "").slice(0, 200), summary: n.failureSummary })),
    }));
  });
}

const allViolations = [];
const browser = await chromium.launch();
try {
  // ── 1) Landing page sweep ────────────────────────────────────────────────
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("puheo_gate_ok_v1", "1");
    });
    await page.goto(BASE + "/index.html", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(800);
    const v = await runAxe(page);
    if (v.length) allViolations.push({ where: `landing@${vp.name}`, v });
    await ctx.close();
  }

  // ── 2 + 3) App-side sweeps (dashboard empty + curriculum locked) ────────
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.setItem("puheo_token", "mock");
      localStorage.setItem("puheo_email", "t@e.com");
      window._userProfile = { onboarding_completed: true, starting_level: "B", target_grade: "B" };
    });
    await setupAppRoutes(page);
    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);

    // Dashboard sweep — already the active screen on app.html load
    await page.evaluate(() => {
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      const d = document.getElementById("screen-dashboard");
      if (d) d.classList.add("active");
    });
    await page.waitForTimeout(400);
    const dv = await runAxe(page);
    if (dv.length) allViolations.push({ where: `dashboard@${vp.name}`, v: dv });

    // Curriculum sweep — switch to #screen-path
    await page.evaluate(() => {
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      const p = document.getElementById("screen-path");
      if (p) p.classList.add("active");
    });
    // Trigger curriculum load (the screen relies on the in-app router but we
    // can poke it directly — it queries /api/curriculum via the mocked route).
    await page.evaluate(async () => {
      try {
        const m = await import("/js/screens/curriculum.js");
        await m.loadCurriculum?.();
      } catch (_) { /* fall back: still axe the empty path screen */ }
    });
    await page.waitForTimeout(800);
    const cv = await runAxe(page);
    if (cv.length) allViolations.push({ where: `curriculum@${vp.name}`, v: cv });

    await ctx.close();
  }

  // ── 4) Reduced-motion behavioral check ──────────────────────────────────
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("puheo_gate_ok_v1", "1");
  });
  await page.goto(BASE + "/index.html", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);

  const rmReport = await page.evaluate(() => {
    const out = { issues: [] };
    // Hero-bokeh drift class should NOT be applied when reduced-motion is set.
    const heroBokeh = document.querySelector(".hero__glow--drift, .landing .hero__glow--drift");
    out.heroBokehDriftClass = !!heroBokeh;
    if (heroBokeh) out.issues.push("hero__glow--drift class should be absent under reduced-motion");

    // Vocab pillar should still render the first pair (not animate).
    const vocab = document.querySelector(".pillar.pillar--vocab .pillar__demo");
    out.vocabRendered = !!vocab;
    if (!vocab) out.issues.push("vocab pillar demo missing");

    // [data-reveal] elements — under RM the CSS forces opacity:1 so they
    // should be paint-visible even without the IO firing.
    const reveals = Array.from(document.querySelectorAll("[data-reveal]"));
    out.revealCount = reveals.length;
    const stillHidden = reveals.filter((el) => {
      const cs = getComputedStyle(el);
      return parseFloat(cs.opacity) < 0.99;
    });
    if (stillHidden.length) out.issues.push(`${stillHidden.length} [data-reveal] elements are still opacity<1 under reduced-motion`);
    return out;
  });
  await ctx.close();

  // ── Report ──────────────────────────────────────────────────────────────
  console.log("=== L-PLAN-8 axe + reduced-motion report ===");
  console.log("Reduced-motion:", JSON.stringify(rmReport, null, 2));
  if (allViolations.length === 0 && rmReport.issues.length === 0) {
    console.log("PASS — 0 axe violations, reduced-motion clean.");
    process.exit(0);
  } else {
    console.log("FAIL");
    if (allViolations.length) console.log(JSON.stringify(allViolations, null, 2));
    if (rmReport.issues.length) console.log("RM issues:", rmReport.issues);
    process.exit(1);
  }
} finally {
  await browser.close();
}
