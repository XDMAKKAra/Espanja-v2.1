// L-V332 — anonymous landing writing demo (#kokeile).
// The API (/api/writing/demo-grade) is mocked with page.route so the flow is
// deterministic and costs no OpenAI tokens; the real endpoint + per-IP limiter
// are covered by tests/demo-grade.test.js. Here we verify the FRONTEND
// contract: input gate → grade renders inline → CTA resolves, and the 429
// rate-limit message renders.

import { test, expect } from "@playwright/test";

const VALID_TEXT =
  "Ayer fui a la playa con mi familia y comimos mucho. Hizo mucho calor y nadamos en el mar toda la tarde.";

const FAKE_GRADE = {
  score: 12,
  scoreMax: 18,
  errors: [
    { excerpt: "comimos mucho", corrected: "comimos mucha comida", explanation_fi: "'mucho' taipuu kohteen mukaan: 'mucha comida'." },
  ],
};

async function openLanding(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.removeItem("puheo_demo_tried_v1");
    } catch {}
  });
  await page.goto("/", { waitUntil: "networkidle", timeout: 30_000 });
}

test.describe("landing writing demo (#kokeile)", () => {
  test("happy path: write → grade renders inline → CTA resolves", async ({ page }) => {
    await page.route("**/api/writing/demo-grade", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FAKE_GRADE) })
    );
    await openLanding(page);

    const card = page.locator("[data-demo]");
    await expect(card).toBeVisible();

    const input = card.locator("[data-demo-input]");
    const submit = card.locator("[data-demo-submit]");

    // Disabled until the 80-char minimum is met.
    await expect(submit).toBeDisabled();
    await input.fill(VALID_TEXT);
    await expect(submit).toBeEnabled();

    await submit.click();

    // Score + at least one error render inline.
    await expect(card.locator(".kokeile__score")).toContainText("12 / 18");
    await expect(card.locator(".kokeile__error").first()).toBeVisible();

    // Footer line + CTA.
    await expect(card.locator(".kokeile__result-foot")).toContainText("yksi näyte");
    const cta = card.locator(".kokeile__cta");
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute("href")).toBe("/app.html#rekisteroidy");
  });

  test("rate-limit: 429 renders the 'already tried' message + CTA", async ({ page }) => {
    await page.route("**/api/writing/demo-grade", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: "Olet jo kokeillut tänään. Tee oma tili niin saat arvioinnit rajattomasti." }),
      })
    );
    await openLanding(page);

    const card = page.locator("[data-demo]");
    await card.locator("[data-demo-input]").fill(VALID_TEXT);
    await card.locator("[data-demo-submit]").click();

    await expect(card.locator(".kokeile__result-error")).toContainText("jo kokeillut");
    await expect(card.locator(".kokeile__cta")).toBeVisible();
  });

  test("no horizontal overflow at the section", async ({ page }) => {
    await openLanding(page);
    const overflow = await page.evaluate(() => {
      const el = document.querySelector("#kokeile");
      if (!el) return null;
      return { scrollW: el.scrollWidth, clientW: document.documentElement.clientWidth };
    });
    expect(overflow).not.toBeNull();
    // Allow 1px rounding slack.
    expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);
  });
});
