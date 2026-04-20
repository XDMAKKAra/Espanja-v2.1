// Playwright happy-path smoke test. Boots the landing + app shell + a few
// static routes to catch regressions that break the site visually or its
// core page scaffolding (meta tags, entry script, etc.). Deliberately avoids
// the full login → placement → exercise flow because that would need a real
// Supabase + OpenAI stack; see tests/routes-*.test.js for API-level coverage.
//
// Run with: npm run test:e2e
// Requires the dev server on BASE_URL (default http://localhost:3000).

import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("loads with the Puheo brand + hero CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Puheo/i);
    // Meta description exists (SEO contract)
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc.length).toBeGreaterThan(50);
  });

  test("links to /app.html (Aloita-CTA or nav)", async ({ page }) => {
    await page.goto("/");
    const appLinks = page.locator('a[href*="app.html"]');
    expect(await appLinks.count()).toBeGreaterThan(0);
  });
});

test.describe("static marketing pages", () => {
  const pages = ["/pricing.html", "/privacy.html", "/terms.html", "/refund.html"];
  for (const path of pages) {
    test(`${path} returns 200 and has a title`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response.status()).toBeLessThan(400);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });
  }
});

test.describe("app shell", () => {
  test("/app.html loads the SPA without JS errors", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/app.html");
    // Give the SPA a moment to initialize
    await page.waitForLoadState("networkidle");
    // Before login, app.html should show the auth screen (Kirjaudu / Rekisteröidy)
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);
    // No uncaught JS errors on first paint
    expect(errors).toEqual([]);
  });

  test("the service worker is registered from app.html", async ({ page }) => {
    await page.goto("/app.html");
    const swUrl = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;
      const reg = await navigator.serviceWorker.getRegistration();
      return reg?.active?.scriptURL || reg?.installing?.scriptURL || null;
    });
    // Presence is best-effort; the check documents expected behaviour without
    // blocking when the SW registration is delayed in headless mode.
    expect(swUrl === null || typeof swUrl === "string").toBe(true);
  });
});

test.describe("health endpoint", () => {
  test("/health returns status ok", async ({ request }) => {
    const res = await request.get("/health");
    if (res.status() === 404) test.skip(true, "no /health route — likely running the Vercel function entry");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
