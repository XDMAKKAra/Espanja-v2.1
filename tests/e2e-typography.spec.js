// L-V291-TYPOGRAPHY-SWAP-1 — Fraunces dropped app-wide.
//
// Display font is now Plus Jakarta Sans (Google Fonts, OFL), body stays
// Manrope. The serif personality slot is retired completely: italic only
// survives in legacy lesson/exercise screens (not covered here) and even
// there it is queued for cleanup. These five screens make up the user's
// first-five-minutes path (landings + home + course list + settings) and
// must read sans-only with weight-based hierarchy.

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
  await page.setViewportSize({ width: 1440, height: 900 });
});

const SCREENS = [
  "/",
  "/espanja-yo-koe",
  "/app.html#/aloitus",
  "/app.html#/oppimispolku",
  "/app.html#/asetukset",
];

for (const path of SCREENS) {
  test(`${path}: no Fraunces font family in use`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    const fraunces = await page.evaluate(() => {
      const all = document.querySelectorAll("*");
      let count = 0;
      all.forEach((el) => {
        const ff = window.getComputedStyle(el).fontFamily.toLowerCase();
        if (ff.includes("fraunces")) count++;
      });
      return count;
    });
    expect(fraunces).toBe(0);
  });

  test(`${path}: no italic font-style in user-facing chrome`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    const italics = await page.evaluate(() => {
      const all = document.querySelectorAll("h1, h2, h3, p, span, a, button, label");
      const offenders = [];
      all.forEach((el) => {
        const style = window.getComputedStyle(el).fontStyle;
        if (style === "italic") {
          offenders.push({
            tag: el.tagName,
            cls: el.className && typeof el.className === "string" ? el.className.slice(0, 60) : "",
            text: (el.textContent || "").trim().slice(0, 40),
          });
        }
      });
      return offenders;
    });
    expect(italics, `italic chrome elements on ${path}: ${JSON.stringify(italics)}`).toEqual([]);
  });

  test(`${path}: h1 uses display sans (Plus Jakarta or Manrope)`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    const h1 = page.locator("h1").first();
    if ((await h1.count()) === 0) return;
    const ff = await h1.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(ff.toLowerCase()).toMatch(/plus jakarta sans|manrope|system-ui|sans-serif/);
    expect(ff.toLowerCase()).not.toContain("fraunces");
  });
}
