// E2E — legal / GDPR surface (L-V343).
// Verifies the three legal pages load, the privacy policy discloses the real
// processors and the consent model, and the shared legal-config single source
// injects the contact email everywhere it's tagged.
//
// Run: npx playwright test tests/e2e-legal-gdpr.spec.js
// Requires the dev server on BASE_URL (default http://localhost:3000).

import { test, expect } from "@playwright/test";

const CONTACT = "marcel.catchot@gmail.com";

test.describe("legal pages load", () => {
  for (const path of ["/privacy.html", "/terms.html", "/refund.html"]) {
    test(`${path} returns 200 and renders a heading`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator("main.legal-shell h1")).toBeVisible();
    });
  }
});

test.describe("privacy policy accuracy", () => {
  test("discloses PostHog, Sentry, OpenAI and the consent model", async ({ page }) => {
    await page.goto("/privacy.html");
    const body = await page.locator("main").innerText();
    expect(body).toContain("PostHog");
    expect(body).toContain("Sentry");
    expect(body).toContain("OpenAI");
    // Consent-gated analytics is described, not the old "no tracking" claim.
    expect(body.toLowerCase()).toContain("suostumus");
    // The old, now-false blanket claim must be gone.
    expect(body).not.toContain("Kolmannen osapuolen markkinointi- tai seurantaevästeitä emme käytä");
    // Age assumption present, no guardian gate.
    expect(body).toContain("13");
  });
});

test.describe("legal-config single source", () => {
  test("injects the contact email into tagged links on every legal page", async ({ page }) => {
    for (const path of ["/privacy.html", "/terms.html", "/refund.html"]) {
      await page.goto(path);
      const link = page.locator("a[data-legal-email]").first();
      await expect(link).toHaveAttribute("href", `mailto:${CONTACT}`);
      await expect(link).toBeVisible();
    }
  });
});

test.describe("terms age line", () => {
  test("states the minimum age", async ({ page }) => {
    await page.goto("/terms.html");
    const body = await page.locator("main").innerText();
    expect(body).toContain("13-vuotiaille");
  });
});
