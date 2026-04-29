// L-PLAN-6 — axe-core sweep across the new screens / states introduced by
// the target_grade loop:
//   #screen-ob1-profile with the target-grade detail card visible
//   #screen-lesson with the target-aware CTA (12 tehtävää for L)
//   #screen-lesson-results with the Syvennä callout (target_grade=L + 100%)
//   #screen-lesson-results deepen-summary card (post-deepen run)
//   #screen-settings target_grade modal open (pill picker)
//
// Target: 0 violations at 1440 + 375.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const AXE_PATH = path.resolve("node_modules/axe-core/axe.min.js");
const AXE_SRC = fs.readFileSync(AXE_PATH, "utf8");

const TEACHING_MD = `# Perheen sanasto

Perheenjäsenten nimet ovat YO-kokeen perusta.

## Tärkeimmät sanat

| Suomeksi | Espanjaksi |
|----------|-----------|
| isä | el padre |

## YO-vinkki 💡

Sanasto-osio testaa sekä tunnistus että tuotanto.`;

const LESSON_1_BASE = {
  id: 1, kurssiKey: "kurssi_1", sortOrder: 1, type: "vocab",
  focus: "Perheen sanasto", exerciseCount: 8, teachingSnippet: "",
};

function lessonPayload(targetGrade) {
  const m = ({ I: 0.7, A: 0.85, B: 1.0, C: 1.0, M: 1.15, E: 1.3, L: 1.5 })[targetGrade] ?? 1.0;
  const adjusted = Math.max(1, Math.round(8 * m));
  return {
    lesson: LESSON_1_BASE,
    teachingPage: { contentMd: TEACHING_MD, cached: true },
    lessonContext: { targetGrade, exerciseCount: adjusted, baselineExerciseCount: 8 },
  };
}

async function setupRoutes(page, targetGrade) {
  await page.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "t@e.com" }) }));
  await page.route("**/api/profile", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B", exam_date: "2026-09-28", target_grade: targetGrade } }),
  }));
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
  await page.route("**/api/curriculum/kurssi_1/lesson/1/complete", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ kurssiComplete: false, nextKurssiUnlocked: false, tutorMessage: "Hyvä työ.", metacognitivePrompt: "Reflektio.", fastTrack: false, isKertaustesti: false, passed: true }),
  }));
  await page.route("**/api/curriculum/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/curriculum/kurssi_1/lesson/1", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(lessonPayload(targetGrade)) }));
  await page.route("**/api/curriculum/kurssi_1", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ kurssi: { key: "kurssi_1", title: "Kurssi 1", description: "x", level: "A", vocabTheme: "general vocabulary", grammarFocus: ["present_regular"], lessonCount: 1, sortOrder: 1 }, lessons: [{ ...LESSON_1_BASE, completed: false, score: null }] }),
  }));
  await page.route("**/api/curriculum", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ kurssit: [{ key: "kurssi_1", title: "Kurssi 1", description: "x", level: "A", vocabTheme: "general vocabulary", grammarFocus: ["present_regular"], lessonCount: 1, sortOrder: 1, lessonsCompleted: 0, isUnlocked: true, lastScore: null, kertausPassed: false }] }) }));
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
      window._userProfile = { onboarding_completed: true, starting_level: "B", target_grade: "L" };
    });
    await setupRoutes(page, "L");
    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);

    // 1) OB-1 profile screen with target detail card visible
    await page.evaluate(() => {
      // Open OB-1 directly. Pre-select an L pill to force the detail card.
      const screen = document.getElementById("screen-ob1-profile");
      if (!screen) return;
      // Use show() via the ui/nav module so the screen is actually visible.
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      screen.classList.add("active");
      const pill = screen.querySelector(".ob2-pillrow[data-field='targetGrade'] .ob2-pill[data-value='L']");
      if (pill) pill.click();
    });
    await page.waitForTimeout(300);
    const v1 = await runAxe(page);
    if (v1.length) allViolations.push(...v1.map((x) => ({ ...x, screen: `${vp.name} OB-1 target detail` })));

    // 2) Lesson screen with L-target CTA
    await page.evaluate(async () => {
      const m = await import("/js/screens/curriculum.js");
      await m.openLesson("kurssi_1", 1);
    });
    await page.waitForTimeout(700);
    const v2 = await runAxe(page);
    if (v2.length) allViolations.push(...v2.map((x) => ({ ...x, screen: `${vp.name} #screen-lesson L` })));

    // 3) Results with Syvennä callout (L + 100%)
    await page.evaluate(async () => {
      const m = await import("/js/screens/lessonResults.js");
      await m.showLessonResults({
        kurssiKey: "kurssi_1", lessonIndex: 1, lessonFocus: "Perheen sanasto",
        lessonType: "vocab", scoreCorrect: 12, scoreTotal: 12, wrongAnswers: [],
      });
    });
    await page.waitForTimeout(700);
    const v3 = await runAxe(page);
    if (v3.length) allViolations.push(...v3.map((x) => ({ ...x, screen: `${vp.name} results + Syvennä` })));

    // 4) Deepen-summary card
    await page.evaluate(async () => {
      sessionStorage.setItem("currentLessonDeepen", "1");
      const m = await import("/js/screens/lessonResults.js");
      await m.showLessonResults({
        kurssiKey: "kurssi_1", lessonIndex: 1, lessonFocus: "Perheen sanasto",
        lessonType: "vocab", scoreCorrect: 4, scoreTotal: 4, wrongAnswers: [],
      });
    });
    await page.waitForTimeout(400);
    const v4 = await runAxe(page);
    if (v4.length) allViolations.push(...v4.map((x) => ({ ...x, screen: `${vp.name} deepen summary` })));

    // 5) Settings target_grade modal open
    await page.evaluate(async () => {
      const m = await import("/js/screens/settings.js");
      await m.showSettings();
    });
    await page.waitForTimeout(400);
    await page.evaluate(async () => {
      const m = await import("/js/screens/settings.js");
      await m.openSettingsEditor("target_grade");
    });
    await page.waitForTimeout(300);
    const v5 = await runAxe(page);
    if (v5.length) allViolations.push(...v5.map((x) => ({ ...x, screen: `${vp.name} settings target_grade modal` })));

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
  console.log("OK — L-PLAN-6 axe sweep across 5 states × 2 viewports: 0 violations");
}
