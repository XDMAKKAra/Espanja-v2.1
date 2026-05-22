// v279 — happy-path Playwright spec for the sentence-build screen.
// Mocks /api/exercises/reorder so the test doesn't hit OpenAI. Drives
// the screen directly via the module import to bypass the writing
// mode-page → CTA chain (covered separately by e2e-bug-scan).

import { test, expect } from "@playwright/test";

const MOCK_REORDER = {
  exercises: [
    {
      id: 1,
      type: "reorder",
      finnishHint: "En pidä kylmästä vedestä.",
      scrambled: ["gusta", "fría", "el", "no", "me", "agua"],
      correct: ["No", "me", "gusta", "el", "agua", "fría"],
      explanation: "No me gusta + artikkeli + substantiivi + adjektiivi.",
    },
    {
      id: 2,
      type: "reorder",
      finnishHint: "Asun pienessä kaupungissa.",
      scrambled: ["pequeña", "vivo", "ciudad", "en", "una"],
      correct: ["Vivo", "en", "una", "ciudad", "pequeña"],
      explanation: "Vivo en + epämääräinen artikkeli + substantiivi + adjektiivi.",
    },
  ],
};

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ context, page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.setItem("puheo_token", "test-token-v279");
      localStorage.setItem("puheo_email", "v279@test.dev");
    } catch {}
  });

  await context.route("**/api/exercises/reorder", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_REORDER) }),
  );
  // Silence mistake logging so a 401 doesn't pollute the trace.
  await context.route("**/api/mistake", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
});

async function openSentenceBuild(page) {
  await page.goto("/app.html");
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(async () => {
    const m = await import("/js/screens/sentenceBuild.js");
    m.initSentenceBuild();
    await m.openSentenceBuild({ level: "B", count: 2 });
  });
  await page.waitForSelector("#sb-token-pool .sb-token", { timeout: 5000 });
}

test("renders 6 tokens for the first exercise + disabled submit", async ({ page }) => {
  await openSentenceBuild(page);
  await expect(page.locator("#sb-token-pool .sb-token")).toHaveCount(6);
  await expect(page.locator("#sb-submit")).toBeDisabled();
  await expect(page.locator("#sb-hint")).toContainText("En pidä kylmästä vedestä");
});

test("wrong order → 'Ei aivan.' + reveals correct sentence", async ({ page }) => {
  await openSentenceBuild(page);
  // Click in scrambled order to guarantee a wrong submission.
  const tokens = page.locator("#sb-token-pool .sb-token");
  const n = await tokens.count();
  for (let i = 0; i < n; i += 1) {
    await tokens.nth(i).click();
  }
  await expect(page.locator("#sb-submit")).toBeEnabled();
  await page.locator("#sb-submit").click();

  await expect(page.locator("#sb-verdict")).toHaveText("Ei aivan.");
  await expect(page.locator("#sb-verdict")).toHaveAttribute("data-correct", "false");
  await expect(page.locator("#sb-correct-text")).toHaveText("No me gusta el agua fría");
  await expect(page.locator("#sb-explain")).toContainText("No me gusta");
});

test("Seuraava advances to the second exercise", async ({ page }) => {
  await openSentenceBuild(page);
  const tokens = page.locator("#sb-token-pool .sb-token");
  const n = await tokens.count();
  for (let i = 0; i < n; i += 1) await tokens.nth(i).click();
  await page.locator("#sb-submit").click();
  await page.locator("#sb-next").click();

  await expect(page.locator("#sb-current")).toHaveText("2");
  await expect(page.locator("#sb-hint")).toContainText("Asun pienessä kaupungissa");
  await expect(page.locator("#sb-token-pool .sb-token")).toHaveCount(5);
});

test("correct order → 'Oikein.' + summary after last exercise", async ({ page }) => {
  await openSentenceBuild(page);

  for (const ex of MOCK_REORDER.exercises) {
    // Click tokens in the order they should land — the click-to-add
    // controller appends them to the answer array.
    for (const word of ex.correct) {
      // The pool shows scrambled order; match by visible text (lower-cased to
      // mirror the CI grading).
      const target = page
        .locator("#sb-token-pool .sb-token", { hasText: new RegExp(`^${word}$`, "i") })
        .filter({ hasNot: page.locator(".is-used") })
        .first();
      await target.click();
    }
    await page.locator("#sb-submit").click();
    await expect(page.locator("#sb-verdict")).toHaveText("Oikein.");
    const nextBtn = page.locator("#sb-next");
    if (await nextBtn.isVisible()) await nextBtn.click();
  }

  await expect(page.locator("#sb-summary")).toBeVisible();
  await expect(page.locator("#sb-summary-correct")).toHaveText("2");
  await expect(page.locator("#sb-summary-total")).toHaveText("2");
});

test("Tyhjennä clears the answer area + re-enables pool tokens", async ({ page }) => {
  await openSentenceBuild(page);
  await page.locator("#sb-token-pool .sb-token").first().click();
  await page.locator("#sb-token-pool .sb-token").nth(1).click();
  await expect(page.locator("#sb-answer-area .sb-token")).toHaveCount(2);

  await page.locator("#sb-reset").click();
  await expect(page.locator("#sb-answer-area .sb-token")).toHaveCount(0);
  await expect(page.locator("#sb-token-pool .sb-token.is-used")).toHaveCount(0);
});
