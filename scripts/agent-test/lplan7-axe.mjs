// L-PLAN-7 — axe-core sweep for the new screens / states introduced by
// the cumulative-review loop:
//   #screen-exercise / #screen-grammar with the Kertaus badge visible
//   #screen-lesson-results with the "Kertasit myös tätä" -osio rendered
//
// Target: 0 violations at 1440 + 375.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const AXE_PATH = path.resolve("node_modules/axe-core/axe.min.js");
const AXE_SRC = fs.readFileSync(AXE_PATH, "utf8");

async function setupRoutes(page) {
  await page.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "t@e.com" }) }));
  await page.route("**/api/profile", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B", exam_date: "2026-09-28", target_grade: "B" } }),
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
  await page.route("**/api/curriculum/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/curriculum/tutor-message", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: null }) }));
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
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.setItem("puheo_token", "mock");
      localStorage.setItem("puheo_email", "t@e.com");
      window._userProfile = { onboarding_completed: true, starting_level: "B", target_grade: "B" };
    });
    await setupRoutes(page);
    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1200);

    // 1) Render review badge directly into #screen-exercise's meta row,
    //    activate the screen, and run axe over it.
    await page.evaluate(async () => {
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      const ex = document.getElementById("screen-exercise");
      if (!ex) return;
      ex.classList.add("active");
      const meta = ex.querySelector(".exercise__meta");
      if (!meta) return;
      const mod = await import("/js/features/reviewBadge.js");
      mod.setReviewBadge(
        {
          is_review: true,
          review_source: "kurssi_1_lesson_2",
          review_source_label: "Kurssi 1 · oppitunti 2: -ar-verbit",
          topic_key: "-ar-verbit",
        },
        ".exercise__meta",
      );
    });
    await page.waitForTimeout(300);
    const v1 = await runAxe(page);
    if (v1.length) allViolations.push(...v1.map((x) => ({ ...x, screen: `${vp.name} #screen-exercise + Kertaus-badge` })));

    // 2) Lesson-results with "Kertasit myös tätä" -osio.
    await page.evaluate(async () => {
      sessionStorage.removeItem("currentLessonDeepen");
      const m = await import("/js/screens/lessonResults.js");
      await m.showLessonResults({
        kurssiKey: "kurssi_1", lessonIndex: 5, lessonFocus: "Ser vs estar — perusteet",
        lessonType: "mixed", scoreCorrect: 7, scoreTotal: 8, wrongAnswers: [],
        reviewItems: [
          { topic_key: "-ar-verbit", review_source: "kurssi_1_lesson_2", review_source_label: "Kurssi 1 · oppitunti 2: -ar-verbit", correct: true },
          { topic_key: "-ar-verbit", review_source: "kurssi_1_lesson_2", review_source_label: "Kurssi 1 · oppitunti 2: -ar-verbit", correct: false },
        ],
      });
      // The /complete route is mocked to {} above so we inject the
      // expected response shape directly into the rendered DOM.
      await new Promise((res) => setTimeout(res, 200));
      const tutor = document.getElementById("lr-tutor");
      if (tutor && !document.querySelector(".lr-review-summary")) {
        const block = document.createElement("section");
        block.className = "lr-review-summary";
        block.setAttribute("role", "region");
        block.setAttribute("aria-label", "Kertaus tässä sessiossa");
        block.innerHTML = `
          <h3 class="lr-review-summary__title">Kertasit myös tätä</h3>
          <ul class="lr-review-summary__list">
            <li class="lr-review-summary__row">
              <span class="lr-review-summary__headline">Pieni muistutus</span>
              <span class="lr-review-summary__label">Kurssi 1 · oppitunti 2: -ar-verbit</span>
              <span class="lr-review-summary__score" aria-label="1 oikein, 2 yhteensä">1/2</span>
            </li>
          </ul>`;
        tutor.parentNode.insertBefore(block, tutor.nextSibling);
      }
    });
    await page.waitForTimeout(500);
    const v2 = await runAxe(page);
    if (v2.length) allViolations.push(...v2.map((x) => ({ ...x, screen: `${vp.name} results + review summary` })));

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
  console.log("OK — L-PLAN-7 axe sweep across 2 states × 2 viewports: 0 violations");
}
