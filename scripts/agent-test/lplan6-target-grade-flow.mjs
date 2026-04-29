// L-PLAN-6 — End-to-end test for target_grade-driven exercise count + Syvennä callout.
//
// Flow:
//   1. Mock-login user with target_grade = "B"
//   2. Open Oppimispolku → Kurssi 1 → Lesson 1 (vocab "Perhe", baseline 8)
//      Verify CTA reads "Aloita harjoittelu (8 tehtävää, ~12 min) →"
//   3. Switch the mocked /api/profile to target_grade = "L" + the lesson
//      endpoint to return adjusted exerciseCount = 12 (8 × 1.5 = 12).
//   4. Re-open Lesson 1 → Verify CTA reads "(12 tehtävää, ~18 min)".
//   5. Run 12 mocked exercises, all correct → results screen.
//   6. Verify Syvennä callout visible (target_grade L + score = 100% > 85%).
//   7. Click "Tee 4 lisätehtävää" → exercise screen with 4-item batch.
//   8. After deepen completes → results show "Syvennys suoritettu" mini-card.
//
// Mocks every API so the test does not hit OpenAI or Supabase.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const TEACHING_MD = `# Perheen sanasto

Perheenjäsenten nimet ovat YO-kokeen perusta. Tämä oppitunti opettaa yleisimmät 8 sanaa.

## Tärkeimmät sanat

| Suomeksi | Espanjaksi | Esimerkki |
|----------|-----------|-----------|
| isä | el padre | Mi padre trabaja. |
| äiti | la madre | Mi madre cocina. |

## YO-vinkki 💡

Sanasto-osio testaa sekä tunnistus että tuotanto.`;

const KURSSI_1 = {
  key: "kurssi_1", title: "Kurssi 1 — Kuka olen", description: "Perusteet",
  level: "A", vocabTheme: "general vocabulary",
  grammarFocus: ["present_regular"], lessonCount: 10, sortOrder: 1,
};

const LESSON_1_BASE = {
  id: 1, kurssiKey: "kurssi_1", sortOrder: 1, type: "vocab",
  focus: "Perheen sanasto", exerciseCount: 8,
  teachingSnippet: "Perheenjäsenet espanjaksi.",
};

function lessonPayload(targetGrade) {
  // L-PLAN-6 — backend now applies the multiplier and returns lessonContext
  // alongside the lesson row. exerciseCount stays baseline; lessonContext
  // exposes the adjusted count.
  const multipliers = { I: 0.7, A: 0.85, B: 1.0, C: 1.0, M: 1.15, E: 1.3, L: 1.5 };
  const m = multipliers[targetGrade] ?? 1.0;
  const adjusted = Math.max(1, Math.round(8 * m));
  return {
    lesson: LESSON_1_BASE,
    teachingPage: { contentMd: TEACHING_MD, cached: true },
    lessonContext: { targetGrade, exerciseCount: adjusted, baselineExerciseCount: 8 },
  };
}

function mockExercises(count) {
  return Array.from({ length: count }, (_, i) => ({
    type: "context",
    id: i + 1,
    question: `Mitä tarkoittaa "${i + 1}"?`,
    context: "Mi padre trabaja en Madrid.",
    options: ["A) isä", "B) äiti", "C) sisko", "D) veli"],
    correct: "A",
    explanation: "el padre = isä.",
    headword: `pad-${i}`,
  }));
}

const errors = [];
let currentTarget = "B";
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    serviceWorkers: "block",
  });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.addInitScript(() => {
    localStorage.setItem("puheo_token", "mock");
    localStorage.setItem("puheo_email", "test.user@example.com");
    window._userProfile = { onboarding_completed: true, starting_level: "B", target_grade: "B" };
  });

  // Auth + boot stubs
  await page.route("**/api/auth/me", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ ok: true, email: "test.user@example.com" }),
  }));
  await page.route("**/api/profile", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      profile: {
        onboarding_completed: true, starting_level: "B", exam_date: "2026-09-28",
        target_grade: currentTarget,
      },
    }),
  }));
  await page.route("**/api/profile/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/dashboard", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ totalSessions: 0, modeStats: {}, recent: [], streak: 0, weekSessions: 0, prevWeekSessions: 0, estLevel: "B", suggestedLevel: "B", modeDaysAgo: {}, pro: false, aiUsage: null, chartData: [] }),
  }));
  await page.route("**/api/sr/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0, due: [] }) }));
  await page.route("**/api/progression/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/adaptive/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ levelProgress: 0 }) }));
  await page.route("**/api/topics/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/api/placement/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));
  await page.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/user-level**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ level: "B" }) }));
  await page.route("**/api/curriculum/tutor-message", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: null }) }));

  // Curriculum stubs — register catchall first, specific routes last.
  await page.route("**/api/curriculum/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/curriculum/kurssi_1/lesson/1/complete", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      kurssiComplete: false,
      nextKurssiUnlocked: false,
      nextKurssiKey: null,
      nextKurssiTitle: null,
      tutorMessage: "Erinomainen suoritus — perheen sanasto on hallussa.",
      metacognitivePrompt: "Huomaa miten perheen sanat toistuvat YO-kokeessa.",
      fastTrack: false,
      isKertaustesti: false,
      passed: true,
    }),
  }));
  await page.route("**/api/curriculum/kurssi_1/lesson/1", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify(lessonPayload(currentTarget)),
  }));
  await page.route("**/api/curriculum/kurssi_1", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      kurssi: KURSSI_1,
      lessons: [{ ...LESSON_1_BASE, completed: false, score: null }],
    }),
  }));
  await page.route("**/api/curriculum", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ kurssit: [{ ...KURSSI_1, lessonsCompleted: 0, isUnlocked: true, lastScore: null, kertausPassed: false }] }),
  }));

  // Track generate calls so we can assert mode: "deepen" lands.
  const generateCalls = [];
  await page.route("**/api/generate", async (r) => {
    let body = {};
    try { body = JSON.parse(r.request().postData() || "{}"); } catch { /* noop */ }
    const requestedCount = Number(body.count) || 8;
    generateCalls.push({ count: requestedCount, mode: body.mode || null, lesson: body.lesson || null });
    r.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ exercises: mockExercises(requestedCount), bankId: null }),
    });
  });

  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1200);

  // ── Step 1: target_grade = B → CTA shows 8 tehtävää, ~12 min ──────────
  await page.evaluate(async () => {
    const mod = await import("/js/screens/curriculum.js");
    await mod.openLesson("kurssi_1", 1);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, "loop-lplan6-cta-B.png"), fullPage: false });

  const ctaB = await page.evaluate(() => document.getElementById("curr-start")?.textContent || "");
  if (!/8 tehtävää/.test(ctaB) || !/~12 min/.test(ctaB)) {
    errors.push(`B-target CTA wrong: "${ctaB}"`);
  }

  // ── Step 2: switch to L, re-open lesson, expect 12 tehtävää, ~18 min ──
  currentTarget = "L";
  await page.evaluate(async () => {
    const mod = await import("/js/screens/curriculum.js");
    await mod.openLesson("kurssi_1", 1);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, "loop-lplan6-cta-L.png"), fullPage: false });

  const ctaL = await page.evaluate(() => document.getElementById("curr-start")?.textContent || "");
  if (!/12 tehtävää/.test(ctaL) || !/~18 min/.test(ctaL)) {
    errors.push(`L-target CTA wrong: "${ctaL}"`);
  }

  // ── Step 3: render the lessonResults card directly with a perfect score
  //   so the Syvennä callout is exercised without manually clicking through
  //   12 questions (covered separately in lesson6 e2e).
  await page.evaluate(async () => {
    const mod = await import("/js/screens/lessonResults.js");
    await mod.showLessonResults({
      kurssiKey: "kurssi_1",
      lessonIndex: 1,
      lessonFocus: "Perheen sanasto",
      lessonType: "vocab",
      scoreCorrect: 12,
      scoreTotal: 12,
      wrongAnswers: [],
    });
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "loop-lplan6-deepen-callout.png"), fullPage: false });

  const calloutChecks = await page.evaluate(() => {
    const callout = document.querySelector(".lr-deepen");
    const yes = document.getElementById("btn-deepen-yes");
    const skip = document.getElementById("btn-deepen-skip");
    return {
      visible: !!callout,
      title: callout?.querySelector(".lr-deepen__title")?.textContent || "",
      hasYes: !!yes,
      hasSkip: !!skip,
    };
  });
  if (!calloutChecks.visible) errors.push("Syvennä callout missing for L + 100%");
  if (!/Syvennä/.test(calloutChecks.title)) errors.push(`Syvennä title wrong: "${calloutChecks.title}"`);
  if (!calloutChecks.hasYes || !calloutChecks.hasSkip) errors.push("Syvennä buttons missing");

  // ── Step 4: click Syvennä → exercise screen with mode:"deepen" body ────
  await page.click("#btn-deepen-yes");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "loop-lplan6-deepen-exercise.png"), fullPage: false });

  const lastGenerate = generateCalls[generateCalls.length - 1];
  if (!lastGenerate || lastGenerate.mode !== "deepen") {
    errors.push(`deepen run did not POST mode:"deepen" (last=${JSON.stringify(lastGenerate)})`);
  }
  if (lastGenerate && lastGenerate.count !== 4) {
    errors.push(`deepen count should be 4, got ${lastGenerate.count}`);
  }

  // ── Step 5: simulate the deepen run finishing by directly replaying the
  //    showLessonResults entry (the deepen flag is still set, so it should
  //    render the deepen mini-summary instead of POSTing /complete).
  await page.evaluate(async () => {
    // Trick: set the flag explicitly and call showLessonResults.
    // (The real flow has loadNextBatch → endBatch → showVocabResults → here.)
    sessionStorage.setItem("currentLessonDeepen", "1");
    const mod = await import("/js/screens/lessonResults.js");
    await mod.showLessonResults({
      kurssiKey: "kurssi_1",
      lessonIndex: 1,
      lessonFocus: "Perheen sanasto",
      lessonType: "vocab",
      scoreCorrect: 4,
      scoreTotal: 4,
      wrongAnswers: [],
    });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "loop-lplan6-deepen-summary.png"), fullPage: false });

  const deepenSummaryCheck = await page.evaluate(() => {
    const card = document.querySelector(".lr-card--deepen");
    const eyebrow = card?.querySelector(".lr-eyebrow")?.textContent || "";
    const score = card?.querySelector(".lr-score-correct")?.textContent || "";
    return { hasCard: !!card, eyebrow, score };
  });
  if (!deepenSummaryCheck.hasCard) errors.push("Deepen summary card missing");
  if (!/Syvennys/.test(deepenSummaryCheck.eyebrow)) errors.push(`Deepen eyebrow wrong: "${deepenSummaryCheck.eyebrow}"`);
  if (deepenSummaryCheck.score !== "4") errors.push(`Deepen score wrong: "${deepenSummaryCheck.score}"`);

  await ctx.close();
} finally {
  await browser.close();
}

const real = errors.filter((e) => !/401|404|net::ERR/.test(e));
if (real.length) {
  console.error("ERRORS:\n" + real.join("\n"));
  process.exit(1);
}
console.log("L-PLAN-6 target-grade-flow E2E: PASS");
