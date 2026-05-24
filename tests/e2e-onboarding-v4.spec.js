// L-V293-ONBOARDING-DIAGNOSTIC-1a — V4 onboarding e2e spec (skippaus + multi-select).
//
// Scope: Commit 1a infra only. Verifies that the V4 screens render, navigation
// between stepit works, multi-select courses + grade selection update state,
// biography radios persist, and skip-all routes correctly. Content rendering
// (real Part A/B/C questions) is tested in L-V293-1b+.

import { test, expect } from "@playwright/test";

const BASE = process.env.PUHEO_E2E_BASE || "http://localhost:3000";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
    try { localStorage.setItem("puheo:lang", "es"); } catch {}
  });
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("V4 intro renders with title, primary CTA, and skip link", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await expect(page.locator("#screen-ob-v4-intro")).toHaveClass(/active/);
  await expect(page.locator("#screen-ob-v4-intro h1.ob4-title")).toContainText(/Räätälöidään/i);
  await expect(page.locator("#ob-v4-intro-start")).toBeVisible();
  await expect(page.locator("#ob-v4-intro-skip")).toBeVisible();
});

test("V4 intro skip routes to courses step", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  await expect(page.locator("#screen-ob-v4-courses")).toHaveClass(/active/);
  await expect(page.locator("#screen-ob-v4-courses h1.ob4-title")).toContainText(/lukio-kursseja/i);
});

test("V4 intro start routes to test step and renders Part A question 1/15 (ES content live)", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();
  await expect(page.locator("#screen-ob-v4-test")).toHaveClass(/active/);
  await expect(page.locator("#ob-v4-test-part-label")).toContainText(/Osa A/);
  await expect(page.locator("#ob-v4-test-progress")).toContainText(/1 \/ 15/);
  await expect(page.locator(".ob4-q__sentence")).toContainText(/profesora/i);
});

test("V4 Part A: select correct mc option, check, then advance", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();

  // Q1: ser_estar — correct answer is "es" (index 0).
  await page.locator('.ob4-q__option[data-option-index="0"]').click();
  await expect(page.locator(".ob4-q__submit")).toBeEnabled();
  await page.locator(".ob4-q__submit").click();
  await expect(page.locator(".ob4-q__feedback")).toBeVisible();
  await expect(page.locator(".ob4-q__feedback")).toHaveClass(/is-correct/);

  // "Seuraava kysymys" should now exist and advance to Q2.
  await page.locator(".ob4-q__next").click();
  await expect(page.locator("#ob-v4-test-progress")).toContainText(/2 \/ 15/);
});

test("V4 Part B: passage + first reading question renders after Part A skip", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();
  // Click through Part A by skipping the part.
  await page.locator("#ob-v4-test-skip-part").click();
  // Now on Part B.
  await expect(page.locator("#ob-v4-test-part-label")).toContainText(/Osa B/);
  await expect(page.locator(".ob4-passage__title")).toContainText(/Madrid/i);
  await expect(page.locator(".ob4-passage__body p")).toHaveCount(4);
  await expect(page.locator(".ob4-q__prompt")).toContainText(/pääajatus/i);
});

test("V4 Part C: writing prompt + textarea + word count enables submit only at min words", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();
  await page.locator("#ob-v4-test-skip-part").click(); // skip Part A
  await page.locator("#ob-v4-test-skip-part").click(); // skip Part B
  // Now on Part C.
  await expect(page.locator("#ob-v4-test-part-label")).toContainText(/Kirjoitelma/);
  const textarea = page.locator("#ob-v4-w-input");
  await expect(textarea).toBeVisible();
  const submit = page.locator(".ob4-q__submit");
  await expect(submit).toBeDisabled();

  // Type below minimum: submit stays disabled.
  await textarea.fill("Pasé el fin de semana en casa.");
  await expect(submit).toBeDisabled();

  // Type 60+ words: submit enabled.
  const longText = ("Pasé el fin de semana en casa con mi familia y mis amigos. Vimos una película muy divertida el sábado por la noche y luego comimos pizza juntos. El domingo por la mañana fuimos al parque grande con el perro y jugamos al fútbol. El próximo fin de semana voy a visitar a mis abuelos en el campo y vamos a hacer una barbacoa con mis primos en su casa nueva.").trim();
  await textarea.fill(longText);
  await expect(submit).toBeEnabled();
});

test("V4 Part C: skip writing routes to done state", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();
  await page.locator("#ob-v4-test-skip-part").click();
  await page.locator("#ob-v4-test-skip-part").click();
  await page.locator(".ob4-q__skip").click();
  await expect(page.locator("#ob-v4-test-body")).toContainText(/Kirjoitelma ohitettu/i);
});

test("V4 Part A: incorrect mc shows correction + explanation", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();

  // Q1: pick the wrong option (index 1 = "está").
  await page.locator('.ob4-q__option[data-option-index="1"]').click();
  await page.locator(".ob4-q__submit").click();
  await expect(page.locator(".ob4-q__feedback")).toHaveClass(/is-incorrect/);
  await expect(page.locator(".ob4-q__fb-correct")).toContainText(/es/);
});

test("V4 test skip-all routes to courses step", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();
  await page.locator("#ob-v4-test-skip-all").click();
  await expect(page.locator("#screen-ob-v4-courses")).toHaveClass(/active/);
});

test("V4 multi-select courses + non-consecutive grades, then biography", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();

  await page.locator("#ob-v4-c3").check();
  await page.locator("#ob-v4-c6").check();
  await page.locator('select[data-course-num="3"]').selectOption("8");
  await page.locator('select[data-course-num="6"]').selectOption("7");

  await expect(page.locator('.ob4-course[data-course="3"]')).toHaveClass(/is-selected/);
  await expect(page.locator('.ob4-course[data-course="6"]')).toHaveClass(/is-selected/);
  await expect(page.locator('.ob4-course[data-course="1"]')).not.toHaveClass(/is-selected/);

  await page.locator("#ob-v4-courses-continue").click();
  await expect(page.locator("#screen-ob-v4-biography")).toHaveClass(/active/);
});

test("V4 biography → summary → start dashboard link", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  await page.locator("#ob-v4-courses-continue").click();

  await page.locator('input[name="home_usage"][value="some"]').check();
  await page.locator('input[name="lived_abroad"][value="vacations"]').check();
  await page.locator('input[name="frequency"][value="weekly"]').check();
  await page.locator("#ob-v4-bio-continue").click();

  await expect(page.locator("#screen-ob-v4-summary")).toHaveClass(/active/);
  await expect(page.locator("#ob-v4-summary-recap")).toBeVisible();
});

// ─── L-V293-1f: Step 4 textbook disambiguator + Step 5 summary structure ───

test("V4 textbook step appears when at least one course was selected", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();

  await page.locator("#ob-v4-c3").check();
  await page.locator('select[data-course-num="3"]').selectOption("8");
  await page.locator("#ob-v4-courses-continue").click();

  // Biography (leave radios untouched, just continue)
  await page.locator("#ob-v4-bio-continue").click();

  // Textbook step must show
  await expect(page.locator("#screen-ob-v4-textbook")).toHaveClass(/active/);
  await expect(page.locator("#ob-v4-textbook-list .ob4-textbook__card")).toHaveCount(5);
  await expect(page.locator("#ob-v4-textbook-hint")).toContainText(/Ei haittaa/i);
});

test("V4 textbook step is skipped when zero courses were selected", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  // No course selection
  await page.locator("#ob-v4-courses-continue").click();
  // No biography selection
  await page.locator("#ob-v4-bio-continue").click();
  // Should skip textbook entirely and land on summary
  await expect(page.locator("#screen-ob-v4-summary")).toHaveClass(/active/);
  await expect(page.locator("#screen-ob-v4-textbook")).not.toHaveClass(/active/);
});

test("V4 textbook 'Muu' reveals free-text input; selection persists to continue", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  await page.locator("#ob-v4-c4").check();
  await page.locator("#ob-v4-courses-continue").click();
  await page.locator("#ob-v4-bio-continue").click();

  await expect(page.locator("#ob-v4-textbook-other-wrap")).toBeHidden();
  await page.locator('.ob4-textbook__card[data-textbook-key="other"]').click();
  await expect(page.locator("#ob-v4-textbook-other-wrap")).toBeVisible();
  await page.locator("#ob-v4-textbook-other").fill("Buenos días");

  await page.locator("#ob-v4-textbook-continue").click();
  await expect(page.locator("#screen-ob-v4-summary")).toHaveClass(/active/);
});

test("V4 textbook skip routes to summary without textbook selection", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  await page.locator("#ob-v4-c2").check();
  await page.locator("#ob-v4-courses-continue").click();
  await page.locator("#ob-v4-bio-continue").click();
  await page.locator("#ob-v4-textbook-skip").click();
  await expect(page.locator("#screen-ob-v4-summary")).toHaveClass(/active/);
});

test("V4 summary renders strengths, growth and 3-week plan structure", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  // Select a higher course so heuristic strengths kicks in
  await page.locator("#ob-v4-c6").check();
  await page.locator('select[data-course-num="6"]').selectOption("9");
  await page.locator("#ob-v4-courses-continue").click();

  await page.locator('input[name="home_usage"][value="some"]').check();
  await page.locator('input[name="lived_abroad"][value="vacations"]').check();
  await page.locator('input[name="frequency"][value="weekly"]').check();
  await page.locator("#ob-v4-bio-continue").click();

  // Skip textbook for this test
  await page.locator("#ob-v4-textbook-skip").click();

  await expect(page.locator("#screen-ob-v4-summary")).toHaveClass(/active/);
  await expect(page.locator(".ob4-summary__h2").first()).toContainText(/vahvuutesi/i);
  // Three plan steps
  const planItems = page.locator(".ob4-summary__plan-list li");
  await expect(planItems).toHaveCount(3);
  // No em-dash in summary copy
  const summaryText = await page.locator("#screen-ob-v4-summary").innerText();
  expect(summaryText).not.toMatch(/—/);
});

test("V4 summary step counter reflects whether textbook was shown", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  // Path A: no courses → textbook skipped → 5/5
  await page.locator("#ob-v4-courses-continue").click();
  await page.locator("#ob-v4-bio-continue").click();
  await expect(page.locator("#ob-v4-summary-step")).toContainText("5 / 5");
});

test("V4 no italic + no Fraunces in onboarding chrome (anti-slop)", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  const italics = await page.evaluate(() => {
    const ob4 = document.querySelectorAll("#screen-ob-v4-intro h1, #screen-ob-v4-intro p, #screen-ob-v4-intro button");
    return Array.from(ob4).filter(el => window.getComputedStyle(el).fontStyle === "italic").length;
  });
  expect(italics).toBe(0);

  const fraunces = await page.evaluate(() => {
    const ob4 = document.querySelectorAll("#screen-ob-v4-intro *");
    return Array.from(ob4).filter(el => window.getComputedStyle(el).fontFamily.toLowerCase().includes("fraunces")).length;
  });
  expect(fraunces).toBe(0);
});
