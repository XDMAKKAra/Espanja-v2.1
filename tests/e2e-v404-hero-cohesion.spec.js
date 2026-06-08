// L-V404 — landing hero integrates the trust signals (rating + teacher quote +
// YTL pill) into one cohesive hero instead of a dangling testimonial box.
// Locks: all three trust elements stay present, the pricing-card tabs still
// work, no horizontal scroll at 375px, and the hero loads with no JS errors.

import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || process.env.PUHEO_E2E_BASE || "http://localhost:3000";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });
});

test("hero keeps rating + teacher quote + YTL pill, all inside one hero section", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  const hero = page.locator("#hero");
  // The trust signals live inside the hero, not a separate section.
  await expect(hero.locator(".hero__rating-score")).toContainText("8,9");
  await expect(hero.locator(".hero__quote-text")).toContainText(/Annoin saman abikirjoitelman/);
  await expect(hero.locator(".hero__quote-author")).toContainText(/Hanna Lehto/);
  await expect(hero.locator(".hero__badge")).toContainText(/YTL/);
  // L-V406 balance fix: rating line lives in the copy column; the teacher quote
  // and YTL badge sit under the offer card so both columns fill evenly. Only the
  // pricing card is a boxed element in the hero.
  await expect(page.locator(".hero__copy .hero__proofline")).toHaveCount(1);
  await expect(page.locator(".hero__offer .hero__quote")).toHaveCount(1);
  await expect(page.locator(".hero__offer .hero__badge")).toHaveCount(1);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("pricing-card language tabs still switch the card context", async ({ page }) => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator('#hero-lang-switch button[data-lang="fr"]').click();
  await expect(page.locator("#hero-offer")).toHaveAttribute("data-lang", "fr");
  await expect(page.locator("[data-offer-context]")).toContainText(/Ranskan koko oppimispolku/);
});

test("no horizontal scroll at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const m = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(m.scroll).toBeLessThanOrEqual(m.client);
});
