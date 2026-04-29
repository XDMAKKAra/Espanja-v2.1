// L-PLAN-5 — axe-core sweep across the new screens introduced this loop:
//   #screen-lesson (rebuilt layout)
//   #screen-exercise with lesson-mode badge + teaching-panel trigger
//   teaching panel open (side-panel desktop + modal mobile)
//   confirm-dialog open (lesson exit prompt)
//
// Target: 0 violations at 1440 + 375. Reuses the same mock harness as
// lplan5-lesson6-e2e.mjs (auth + curriculum routes stubbed).

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const AXE_PATH = path.resolve("node_modules/axe-core/axe.min.js");
const AXE_SRC = fs.readFileSync(AXE_PATH, "utf8");

const TEACHING_MD = `# Numerot ja ikä

Numerot 1–100 ovat YO-kokeen perusta.

## Tärkeimmät sanat

| Suomeksi | Espanjaksi | Esimerkki |
|----------|-----------|-----------|
| yksi | uno | Tengo uno. |

## YO-vinkki 💡

YO-koe testaa numeroita aukko-tehtävissä.`;

const KURSSI_1 = {
  kurssi: { key: "kurssi_1", title: "Kurssi 1 — Kuka olen", description: "...", level: "A", vocabTheme: "general vocabulary", grammarFocus: ["present_regular"], lessonCount: 10, sortOrder: 1 },
  lessons: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, sortOrder: i + 1, type: i === 5 ? "vocab" : "grammar", focus: i === 5 ? "Numerot ja ikä" : `L${i + 1}`, exerciseCount: 10, teachingSnippet: "s", completed: false, score: null })),
};
const LESSON_6 = { lesson: { id: 6, kurssiKey: "kurssi_1", sortOrder: 6, type: "vocab", focus: "Numerot ja ikä", exerciseCount: 10, teachingSnippet: "" }, teachingPage: { contentMd: TEACHING_MD } };

async function setupRoutes(page) {
  await page.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "t@e.com" }) }));
  await page.route("**/api/profile", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B", exam_date: "2026-09-28" } }) }));
  await page.route("**/api/profile/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/dashboard", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ totalSessions: 0, modeStats: {}, recent: [], streak: 0, weekSessions: 0, prevWeekSessions: 0, estLevel: "B", suggestedLevel: "B", modeDaysAgo: {}, pro: false, aiUsage: null, chartData: [] }) }));
  await page.route("**/api/sr/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0, due: [] }) }));
  await page.route("**/api/progression/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/adaptive/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ levelProgress: 0 }) }));
  await page.route("**/api/topics/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/api/placement/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));
  await page.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/user-level**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ level: "B" }) }));
  await page.route("**/api/curriculum/tutor-message", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: null }) }));
  // Specific curriculum routes registered LAST so they shadow the catchall.
  await page.route("**/api/curriculum/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/curriculum/kurssi_1/lesson/6", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LESSON_6) }));
  await page.route("**/api/curriculum/kurssi_1", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(KURSSI_1) }));
  await page.route("**/api/curriculum", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ kurssit: [{ ...KURSSI_1.kurssi, lessonsCompleted: 0, isUnlocked: true, lastScore: null, kertausPassed: false }] }) }));
  await page.route("**/api/generate", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ exercises: [{ type: "context", question: "Mitä?", options: ["A) yksi", "B) kaksi", "C) kolme", "D) neljä"], correct: "A", explanation: "" }], bankId: null }) }));
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

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-375", width: 375, height: 812 },
];

const allViolations = [];
const browser = await chromium.launch();
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("puheo_token", "mock");
      localStorage.setItem("puheo_email", "t@e.com");
      window._userProfile = { onboarding_completed: true, starting_level: "B" };
    });
    await setupRoutes(page);
    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);

    // 1) #screen-lesson
    await page.evaluate(async () => {
      const m = await import("/js/screens/curriculum.js");
      await m.openLesson("kurssi_1", 6);
    });
    await page.waitForTimeout(700);
    const v1 = await runAxe(page);
    if (v1.length) allViolations.push(...v1.map((x) => ({ ...x, screen: `${vp.name} #screen-lesson` })));

    // 2) Exercise screen with badge + trigger
    await page.click("#curr-start");
    await page.waitForTimeout(1500);
    const v2 = await runAxe(page);
    if (v2.length) allViolations.push(...v2.map((x) => ({ ...x, screen: `${vp.name} #screen-exercise (lesson-mode)` })));

    // 3) Teaching panel open
    await page.click("#teaching-panel-trigger");
    await page.waitForTimeout(400);
    const v3 = await runAxe(page);
    if (v3.length) allViolations.push(...v3.map((x) => ({ ...x, screen: `${vp.name} teaching-panel open` })));
    await page.click("#teaching-panel-close");
    await page.waitForTimeout(400);

    // 4) Confirm dialog open (lesson exit prompt)
    await page.evaluate(async () => {
      const { confirmDialog } = await import("/js/features/confirmDialog.js");
      // Fire-and-forget — dialog stays open while axe runs.
      confirmDialog({ title: "Lopetetaanko oppitunti?", body: "Sinulla on käynnissä oppitunti.", confirmLabel: "Lopeta", cancelLabel: "Jatka oppituntia" });
    });
    await page.waitForTimeout(400);
    const v4 = await runAxe(page);
    if (v4.length) allViolations.push(...v4.map((x) => ({ ...x, screen: `${vp.name} confirm-dialog open` })));

    await ctx.close();
  }
} finally {
  await browser.close();
}

if (allViolations.length) {
  console.error("AXE VIOLATIONS:");
  for (const v of allViolations) {
    console.error(`  [${v.screen}] ${v.id} (${v.impact}) — ${v.help} (${v.nodes} node${v.nodes === 1 ? "" : "s"})`);
    for (const d of v.details || []) {
      console.error(`     target=${JSON.stringify(d.target)}`);
      console.error(`     html=${d.html}`);
    }
  }
  process.exit(1);
} else {
  console.log("OK — axe sweep across 4 states × 2 viewports: 0 violations");
}
