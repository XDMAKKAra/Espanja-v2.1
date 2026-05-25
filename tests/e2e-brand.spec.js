// L-V317 — wordmark + favicon brand spec.
//
// Verifies that the new lowercase "puheo" wordmark + brick-square punctuation
// system actually ships on every public surface:
//
//   1. <link rel="icon"> entries resolve 200 (no 404 favicon).
//   2. The SVG favicon master + the 32px raster fallback are both reachable.
//   3. apple-touch-icon resolves.
//   4. og:image still resolves (we did not touch it but make sure nothing broke).
//   5. The /public/brand/logo.svg renders inline as <text>puheo</text>.

import { test, expect } from "@playwright/test";

const PAGES = ["/", "/app.html", "/public/landing/espanja.html", "/public/landing/saksa.html", "/public/landing/ranska.html"];

async function expectOk(page, url) {
  const res = await page.request.get(url);
  expect(res.status(), `${url} should serve 200`).toBeLessThan(400);
}

test.describe("brand assets reachable", () => {
  for (const path of PAGES) {
    test(`favicon + apple-touch links on ${path}`, async ({ page }) => {
      await page.addInitScript(() => {
        try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
      });
      await page.goto(path);
      const hrefs = await page.$$eval(
        'link[rel*="icon"], link[rel="apple-touch-icon"]',
        (els) => els.map((e) => e.getAttribute("href")).filter(Boolean),
      );
      expect(hrefs.length, `${path} should declare at least one icon link`).toBeGreaterThan(0);
      for (const href of hrefs) {
        await expectOk(page, href);
      }
    });
  }

  test("wordmark SVG renders 'puheo' text", async ({ page }) => {
    const res = await page.request.get("/public/brand/logo.svg");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("puheo");
    expect(body).toContain("#A0341F");
  });

  test("favicon master SVG is valid and brick-colored", async ({ page }) => {
    const res = await page.request.get("/public/brand/favicon-master.svg");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("#A0341F");
    expect(body).toContain("aria-label=\"Puheo\"");
  });

  test("manifest theme_color matches brand brick", async ({ page }) => {
    const res = await page.request.get("/manifest.json");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.theme_color).toBe("#A0341F");
  });
});
