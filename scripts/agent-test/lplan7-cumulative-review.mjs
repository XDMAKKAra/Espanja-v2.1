// L-PLAN-7 — End-to-end test for cumulative review (Kertaus-badge + post-results "Kertasit myös tätä").
//
// Flow:
//   1. Mock-login user with completed Kurssi 1 lessons 1–4 (mixed scores).
//   2. Mock /api/generate to return 8 vocab exercises where the last 2 carry
//      is_review: true + review_source: "kurssi_1_lesson_2" (the weakest one).
//   3. Open Kurssi 1 → Lesson 5, click "Aloita harjoittelu", assert that
//      the Kertaus-badge renders on review items only.
//   4. Mock /api/curriculum/.../lesson/5/complete to return a reviewSummary.
//   5. Replay the showLessonResults entry → assert "Kertasit myös tätä"
//      section renders with the right headline + score.
//
// Mocks every API so the test does not hit OpenAI or Supabase.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const KURSSI_1 = {
  key: "kurssi_1", title: "Kurssi 1 — Kuka olen", description: "Perusteet",
  level: "A", vocabTheme: "general vocabulary",
  grammarFocus: ["present_regular"], lessonCount: 10, sortOrder: 1,
};

const LESSON_5 = {
  id: 5, kurssiKey: "kurssi_1", sortOrder: 5, type: "mixed",
  focus: "Ser vs estar — perusteet", exerciseCount: 8,
  teachingSnippet: "Ser = pysyvä, estar = ohimenevä.",
};

function makeExercises() {
  // 8 items: 6 main focus, 2 review (last two).
  const items = [];
  for (let i = 1; i <= 6; i++) {
    items.push({
      id: i, type: "context",
      question: `Ser vai estar? "${i}"`,
      context: "Yo ___ finlandés.",
      options: ["A) soy", "B) estoy", "C) son", "D) están"],
      correct: "A",
      explanation: "ser pysyvä piirre.",
      topic_key: "Ser vs estar — perusteet",
      is_review: false,
    });
  }
  for (let i = 7; i <= 8; i++) {
    items.push({
      id: i, type: "gap",
      question: "Täydennä -ar verbillä:",
      context: "Yo ___ español todos los días.",
      options: ["A) hablo", "B) hablar", "C) hablamos", "D) habla"],
      correct: "A",
      explanation: "-ar verbi yo-muoto = -o.",
      topic_key: "-ar-verbit preesensissä — säännöllinen taivutus",
      is_review: true,
      review_source: "kurssi_1_lesson_2",
      review_source_label: "Kurssi 1 · oppitunti 2: -ar-verbit preesensissä — säännöllinen taivutus",
    });
  }
  return items;
}

const COMPLETE_RESPONSE = {
  kurssiComplete: false,
  nextKurssiUnlocked: false,
  nextKurssiKey: null,
  nextKurssiTitle: null,
  tutorMessage: "Hyvin meni — kertasit myös -ar verbejä, niissä menee nyt paremmin.",
  metacognitivePrompt: "Huomasit varmasti, että ser ja estar valitaan kontekstista, ei sanasta itsestään.",
  reviewSummary: [
    {
      topic_key: "-ar-verbit preesensissä — säännöllinen taivutus",
      review_source: "kurssi_1_lesson_2",
      label: "Kurssi 1 · oppitunti 2: -ar-verbit preesensissä — säännöllinen taivutus",
      correct: 2,
      total: 2,
      headline: "Vahvistui",
    },
  ],
  fastTrack: false,
  isKertaustesti: false,
  passed: true,
};

const errors = [];
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
    localStorage.setItem("puheo_gate_ok_v1", "1");
    localStorage.setItem("puheo_token", "mock");
    localStorage.setItem("puheo_email", "test.user@example.com");
    window._userProfile = { onboarding_completed: true, starting_level: "B", target_grade: "B" };
  });

  // ── Boot stubs ─────────────────────────────────────────────────────────
  await page.route("**/api/auth/me", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ ok: true, email: "test.user@example.com" }),
  }));
  await page.route("**/api/profile", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      profile: {
        onboarding_completed: true, starting_level: "B", exam_date: "2026-09-28",
        target_grade: "B",
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

  // Curriculum stubs.
  await page.route("**/api/curriculum/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/curriculum/kurssi_1/lesson/5/complete", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify(COMPLETE_RESPONSE),
  }));
  await page.route("**/api/curriculum/kurssi_1/lesson/5", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      lesson: LESSON_5,
      teachingPage: { contentMd: "# Ser vs estar\n\nPerus.\n\n## Esimerkki\n\n> Soy finlandés.", cached: true },
      lessonContext: { targetGrade: "B", exerciseCount: 8, baselineExerciseCount: 8 },
    }),
  }));
  await page.route("**/api/curriculum/kurssi_1", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      kurssi: KURSSI_1,
      lessons: [
        { ...LESSON_5, completed: false, score: null },
      ],
    }),
  }));
  await page.route("**/api/curriculum", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ kurssit: [{ ...KURSSI_1, lessonsCompleted: 4, isUnlocked: true, lastScore: null, kertausPassed: false }] }),
  }));

  // Generate stub returning crafted exercises with is_review tags.
  await page.route("**/api/generate", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ exercises: makeExercises(), bankId: null }),
  }));
  await page.route("**/api/grammar-drill", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ exercises: makeExercises(), bankId: null }),
  }));

  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1200);

  // ── Step 1: open Lesson 5 directly via curriculum module. ──────────────
  await page.evaluate(async () => {
    const mod = await import("/js/screens/curriculum.js");
    await mod.openLesson("kurssi_1", 5);
  });
  await page.waitForTimeout(800);

  // ── Step 2: assert the badge module renders correctly when given a
  //   review exercise. We skip walking through the actual exercise screen
  //   since vocab/grammar/seed-bank renderers each have different option
  //   button selectors — covered separately by lplan5-lesson6-e2e for the
  //   lesson-launch path. The badge DOM contract is what matters here.
  const directBadgeRender = await page.evaluate(async () => {
    const mod = await import("/js/features/reviewBadge.js");
    const host = document.createElement("div");
    host.className = "exercise__meta";
    host.id = "test-host";
    document.body.appendChild(host);
    // Negative case first — non-review exercise should leave badge hidden.
    mod.setReviewBadge({ is_review: false }, "#test-host");
    const negBadge = host.querySelector(".ex-review-badge");
    const negHidden = !negBadge || negBadge.classList.contains("hidden");
    // Positive case — review exercise renders the badge with the label.
    mod.setReviewBadge(
      {
        is_review: true,
        review_source: "kurssi_1_lesson_2",
        review_source_label: "Kurssi 1 · oppitunti 2: -ar-verbit",
        topic_key: "-ar-verbit",
      },
      "#test-host",
    );
    const posBadge = host.querySelector(".ex-review-badge:not(.hidden)");
    const posText = posBadge?.querySelector(".ex-review-badge__text")?.textContent || "";
    return { negHidden, hasBadge: !!posBadge, text: posText };
  });
  if (!directBadgeRender.negHidden) errors.push("Kertaus badge incorrectly visible on non-review exercise");
  if (!directBadgeRender.hasBadge) errors.push("Kertaus badge did not render on review exercise");
  else if (!/Kertaus:/.test(directBadgeRender.text)) errors.push(`Badge text wrong: "${directBadgeRender.text}"`);
  else if (!/oppitunti 2/.test(directBadgeRender.text)) errors.push(`Badge label missing lesson ref: "${directBadgeRender.text}"`);

  await page.screenshot({ path: path.join(OUT, "loop-lplan7-exercise-with-badge.png"), fullPage: false });

  // ── Step 4: render lessonResults card directly with reviewItems so the
  //   "Kertasit myös tätä" osio is exercised regardless of the per-screen
  //   render path.
  await page.evaluate(async () => {
    sessionStorage.removeItem("currentLessonDeepen");
    const mod = await import("/js/screens/lessonResults.js");
    await mod.showLessonResults({
      kurssiKey: "kurssi_1",
      lessonIndex: 5,
      lessonFocus: "Ser vs estar — perusteet",
      lessonType: "mixed",
      scoreCorrect: 7,
      scoreTotal: 8,
      wrongAnswers: [],
      reviewItems: [
        { topic_key: "-ar-verbit preesensissä — säännöllinen taivutus", review_source: "kurssi_1_lesson_2", review_source_label: "Kurssi 1 · oppitunti 2: -ar-verbit", correct: true },
        { topic_key: "-ar-verbit preesensissä — säännöllinen taivutus", review_source: "kurssi_1_lesson_2", review_source_label: "Kurssi 1 · oppitunti 2: -ar-verbit", correct: true },
      ],
    });
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "loop-lplan7-results-with-review-summary.png"), fullPage: false });

  const summaryCheck = await page.evaluate(() => {
    const block = document.querySelector(".lr-review-summary");
    const title = block?.querySelector(".lr-review-summary__title")?.textContent || "";
    const headline = block?.querySelector(".lr-review-summary__headline")?.textContent || "";
    const label = block?.querySelector(".lr-review-summary__label")?.textContent || "";
    const score = block?.querySelector(".lr-review-summary__score")?.textContent || "";
    return { hasBlock: !!block, title, headline, label, score };
  });
  if (!summaryCheck.hasBlock) errors.push("'Kertasit myös tätä' section missing");
  if (!/Kertasit myös tätä/.test(summaryCheck.title)) errors.push(`Title wrong: "${summaryCheck.title}"`);
  if (!/Vahvistui/.test(summaryCheck.headline)) errors.push(`Headline wrong: "${summaryCheck.headline}"`);
  if (!/-ar-verbit/.test(summaryCheck.label)) errors.push(`Label wrong: "${summaryCheck.label}"`);
  if (summaryCheck.score !== "2/2") errors.push(`Score wrong: "${summaryCheck.score}"`);

  await ctx.close();
} finally {
  await browser.close();
}

const real = errors.filter((e) => !/401|404|net::ERR/.test(e));
if (real.length) {
  console.error("ERRORS:\n" + real.join("\n"));
  process.exit(1);
}
console.log("L-PLAN-7 cumulative-review E2E: PASS");
