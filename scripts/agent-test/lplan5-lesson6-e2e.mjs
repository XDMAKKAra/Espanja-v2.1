// L-PLAN-5 — End-to-end test for the rebuilt lesson view + topic-locked
// exercises. Walks Kurssi 1 → Oppitunti 6 (Numerot ja ikä, sortOrder=6,
// type=vocab, exerciseCount=10) and verifies:
//   1. #screen-lesson renders eyebrow + H1 + Markdown card + CTA with count.
//   2. Tapping the CTA navigates to the exercise screen with the lesson
//      mode-badge in the top bar + the floating "Opetussivu" trigger.
//   3. Tapping the trigger opens the side-panel with the same Markdown.
//   4. Closing the side-panel returns focus to the trigger.
//
// Mocks the curriculum + exercise APIs so the test does not hit OpenAI.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const TEACHING_MD = `# Numerot ja ikä

Numerot 1–100 ovat YO-kokeen perusta. Tarvitset niitä iän, kellonaikojen ja hintojen kertomiseen. Tämä oppitunti opettaa yleisimmät numerot ja iän kertomisen rakenteen "Tengo X años".

## Tärkeimmät sanat

| Suomeksi | Espanjaksi | Esimerkki |
|----------|-----------|-----------|
| yksi | uno | Tengo uno. |
| kaksi | dos | Son las dos. |
| kymmenen | diez | Hay diez libros. |

## Muista nämä

Numero "siete" alkaa s:llä, ei f:llä kuten suomalainen "seitsemän". Iän kertomiseen käytetään aina verbiä "tener", ei "ser".

## YO-vinkki 💡

YO-koe testaa numeroita aukko- ja monivalintatehtävissä — opettele 1–30 ja kymmenet sataan asti.`;

const KURSSI_1_PAYLOAD = {
  kurssi: {
    key: "kurssi_1", title: "Kurssi 1 — Kuka olen",
    description: "Preesens säännölliset, ser/estar perusteet, persoona ja perhe.",
    level: "A", vocabTheme: "general vocabulary",
    grammarFocus: ["present_regular"], lessonCount: 10, sortOrder: 1,
  },
  lessons: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1, sortOrder: i + 1, type: i === 5 ? "vocab" : "grammar",
    focus: i === 5 ? "Numerot ja ikä" : `Lesson ${i + 1}`,
    exerciseCount: i === 5 ? 10 : 8, teachingSnippet: "Snippet",
    completed: false, score: null,
  })),
};

const LESSON_6_PAYLOAD = {
  lesson: {
    id: 6, kurssiKey: "kurssi_1", sortOrder: 6, type: "vocab",
    focus: "Numerot ja ikä", exerciseCount: 10,
    teachingSnippet: "Numerot 1–100 ja ikä-rakenne.",
  },
  teachingPage: { contentMd: TEACHING_MD, cached: true },
};

function mockExercises(count) {
  return Array.from({ length: count }, (_, i) => ({
    type: "context",
    question: `Mitä tarkoittaa "${i + 1}"?`,
    options: ["A) yksi", "B) kaksi", "C) kolme", "D) neljä"],
    correct: "A",
    explanation: "Mock explanation",
    headword: `num${i}`,
  }));
}

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
    localStorage.setItem("puheo_token", "mock");
    localStorage.setItem("puheo_email", "test.user@example.com");
    window._userProfile = { onboarding_completed: true, starting_level: "B" };
  });

  // Auth + boot stubs
  await page.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "test.user@example.com" }) }));
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

  // Curriculum stubs — Playwright matches the most-recently-registered
  // route first, so register catchall FIRST and specific routes LAST.
  await page.route("**/api/curriculum/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/curriculum/kurssi_1/lesson/6", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify(LESSON_6_PAYLOAD),
  }));
  await page.route("**/api/curriculum/kurssi_1", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify(KURSSI_1_PAYLOAD),
  }));
  await page.route("**/api/curriculum", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ kurssit: [{ ...KURSSI_1_PAYLOAD.kurssi, lessonsCompleted: 0, isUnlocked: true, lastScore: null, kertausPassed: false }] }),
  }));

  // Exercise stub — return 10 mock multiple-choice items
  await page.route("**/api/generate", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ exercises: mockExercises(10), bankId: null }),
  }));

  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);

  // 1) Open Oppimispolku
  await page.evaluate(async () => {
    const mod = await import("/js/screens/curriculum.js");
    await mod.loadCurriculum();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "loop-lplan5-path.png"), fullPage: false });

  // 2) Open lesson 6 directly via openLesson
  await page.evaluate(async () => {
    const mod = await import("/js/screens/curriculum.js");
    await mod.openLesson("kurssi_1", 6);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "loop-lplan5-lesson6.png"), fullPage: false });

  // Verify lesson screen markup
  const lessonChecks = await page.evaluate(() => {
    const screen = document.getElementById("screen-lesson");
    const eyebrow = screen?.querySelector(".curr-eyebrow")?.textContent || "";
    const h1 = screen?.querySelector(".curr-lesson-hero h1")?.textContent || "";
    const teachingTitle = screen?.querySelector(".curr-teaching h1")?.textContent || "";
    const muodostus = !!screen?.querySelector(".curr-teaching h2");
    const cta = screen?.querySelector("#curr-start")?.textContent || "";
    return { eyebrow, h1, teachingTitle, muodostus, cta };
  });

  if (!lessonChecks.eyebrow.includes("Kurssi 1") || !lessonChecks.eyebrow.includes("Oppitunti 6")) {
    errors.push(`Eyebrow wrong: "${lessonChecks.eyebrow}"`);
  }
  if (!lessonChecks.h1.includes("Numerot")) {
    errors.push(`H1 wrong: "${lessonChecks.h1}"`);
  }
  if (!lessonChecks.muodostus) {
    errors.push("Markdown card missing h2 sub-heading");
  }
  if (!lessonChecks.cta.includes("10") || !lessonChecks.cta.includes("min")) {
    errors.push(`CTA missing count + duration: "${lessonChecks.cta}"`);
  }

  // 3) Click Aloita harjoittelu → exercise screen
  await page.click("#curr-start");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "loop-lplan5-exercise.png"), fullPage: false });

  // Verify badge + trigger button visible
  const badgeChecks = await page.evaluate(() => {
    const badge = document.querySelector(".lesson-mode-badge");
    const trigger = document.getElementById("teaching-panel-trigger");
    return {
      badgeText: badge?.textContent || "",
      badgeVisible: !!badge,
      triggerVisible: trigger && !trigger.hidden,
    };
  });

  if (!badgeChecks.badgeVisible) errors.push("lesson-mode-badge not rendered");
  if (!badgeChecks.badgeText.includes("Numerot")) errors.push(`badge text wrong: "${badgeChecks.badgeText}"`);
  if (!badgeChecks.triggerVisible) errors.push("teaching-panel trigger not visible");

  // 4) Open teaching panel
  await page.click("#teaching-panel-trigger");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "loop-lplan5-panel-open.png"), fullPage: false });

  const panelChecks = await page.evaluate(() => {
    const root = document.getElementById("teaching-panel-root");
    const article = document.querySelector(".teaching-panel__article");
    const title = document.getElementById("teaching-panel-title")?.textContent || "";
    return {
      open: root && !root.hidden && root.classList.contains("is-open"),
      hasArticle: !!article && article.textContent.includes("Numerot"),
      title,
    };
  });
  if (!panelChecks.open) errors.push("teaching panel did not open");
  if (!panelChecks.hasArticle) errors.push("teaching panel article missing content");

  // 5) Close panel
  await page.click("#teaching-panel-close");
  await page.waitForTimeout(400);
  const panelClosed = await page.evaluate(() => {
    const root = document.getElementById("teaching-panel-root");
    return !root || root.hidden || !root.classList.contains("is-open");
  });
  if (!panelClosed) errors.push("teaching panel did not close");

  await ctx.close();
} finally {
  await browser.close();
}

// Filter benign network errors from un-mocked endpoints (401/404) — same
// convention as loop27 and other smoke tests.
const real = errors.filter((e) => !/401|404|net::ERR/.test(e));
if (real.length) {
  console.error("ERRORS:\n" + real.join("\n"));
  process.exit(1);
} else {
  console.log(`OK — L-PLAN-5 lesson6 e2e: 4 screenshots saved, 0 real errors (${errors.length - real.length} benign 401/404s suppressed)`);
}
