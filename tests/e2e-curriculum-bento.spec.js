// F-CURRICULUM-BENTO-1 — bento grid rendering + a11y sweep.
//
// Mocks /api/curriculum* via page.route. The pre-launch gate is bypassed
// via localStorage (per memory). Service workers are unregistered so the
// mocks aren't intercepted before reaching our route handlers.

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MOCK_KURSSI_KEY = "kurssi_3";

const MOCK_CURRICULUM = {
  kurssit: [{
    key: MOCK_KURSSI_KEY,
    title: "Mitä ostit tänään?",
    level: "B",
    isUnlocked: true,
    kertausPassed: false,
    lessonCount: 12,
    lessonsCompleted: 4,
    sortOrder: 3,
  }],
};

const MOCK_LESSONS_RESPONSE = {
  kurssi: { key: MOCK_KURSSI_KEY, title: "Mitä ostit tänään?", level: "B", sortOrder: 3 },
  lessons: Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    sortOrder: i + 1,
    type: ["vocab", "grammar", "reading", "writing", "mixed"][i % 5],
    focus: `Aihe ${i + 1}: tienda y dinero`,
    exerciseCount: 8,
    teachingSnippet: "Avainsanasto: comprar · descuento · caro · barato",
    completed: i < 4,
    score: i < 4 ? { correct: 7, total: 8 } : null,
  })),
};

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ context, page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });

  await context.route("**/api/curriculum**", (route) => {
    const url = route.request().url();
    if (url.includes(`/api/curriculum/${MOCK_KURSSI_KEY}`)) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_LESSONS_RESPONSE) });
    }
    if (/\/api\/curriculum(\?|$)/.test(url.split("#")[0])) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_CURRICULUM) });
    }
    return route.continue();
  });
});

async function loadCurriculumScreen(page) {
  await page.goto("/app.html");
  await page.waitForLoadState("domcontentloaded");

  await page.evaluate(async () => {
    document.getElementById("screen-path")?.classList.add("active");
    const m = await import("/js/screens/curriculum.js");
    await m.loadCurriculum();
    // fetchAndRenderLessons is fire-and-forget inside loadCurriculum.
    await new Promise((r) => setTimeout(r, 400));
  });

  await page.waitForSelector(".curr-bento-grid .curr-bento-card", { timeout: 5000 });
}

test("bento grid renders 12 cards with feature + done states", async ({ page }) => {
  await loadCurriculumScreen(page);

  const cards = page.locator(".curr-bento-grid .curr-bento-card");
  expect(await cards.count()).toBe(12);

  expect(await page.locator(".curr-bento-card.curr-bento-card--feature").count()).toBe(1);
  expect(await page.locator(".curr-bento-card.curr-bento-card--done").count()).toBe(4);

  const featureLesson = await page.locator(".curr-bento-card--feature").first().getAttribute("data-lesson");
  expect(featureLesson).toBe("5");

  expect(await page.locator(".curr-bento-strip__dot").count()).toBe(12);
});

test("bento grid is axe-clean (serious/critical)", async ({ page }) => {
  await loadCurriculumScreen(page);

  const results = await new AxeBuilder({ page })
    .include("#screen-path")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  const severe = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  if (severe.length) {
    console.log("axe severe violations:", JSON.stringify(severe.map((v) => ({ id: v.id, target: v.nodes?.[0]?.target })), null, 2));
  }
  expect(severe).toEqual([]);
});
