// L-V367 — per-language abikurssi pages.
//   1. The pages render full content on desktop (1440px) AND mobile (390px)
//      with no console errors (the reported "ei aukea desktopilla" did not
//      reproduce as a render bug; this locks that in as a regression guard).
//   2. The desktop top-nav now exposes the abikurssi pages via a "Kurssit"
//      dropdown — previously those links lived only in the ≤720px hamburger
//      menu, so desktop had no nav path to them.

import { test, expect } from "@playwright/test";

// Block the service worker so each run loads fresh assets — otherwise a cached
// pre-V367 landing-langpage.css / index.html bleeds in and masks the change.
test.use({ serviceWorkers: "block" });

// Bypass the pre-launch gate, otherwise pre-launch-gate.js blanks the page
// before the CSS applies (the page then "renders" unstyled — false failure).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
});

const PAGES = [
  { url: "/public/landing/espanja.html", h1: /Espanjan abikurssi/i },
  { url: "/public/landing/saksa.html", h1: /Saksan abikurssi/i },
  { url: "/public/landing/ranska.html", h1: /Ranskan abikurssi/i },
];
const WIDTHS = [1440, 390];

for (const p of PAGES) {
  for (const w of WIDTHS) {
    test(`renders ${p.url} @ ${w}px with full content, no console errors`, async ({ page }) => {
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(p.url, { waitUntil: "networkidle" });

      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("h1")).toHaveText(p.h1);
      // All five info sections must have real height (not collapsed/hidden).
      const visibleSections = await page.locator("section").evaluateAll(
        (els) => els.filter((s) => s.offsetHeight > 0).length,
      );
      expect(visibleSections).toBe(5);
      // No horizontal scroll at either width.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
}

test("desktop nav Kurssit dropdown exposes the three abikurssi pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/index.html", { waitUntil: "networkidle" });

  const trigger = page.locator("#nav-kurssit-dd .nav__dropdown-trigger");
  await expect(trigger).toBeVisible();

  const menu = page.locator("#nav-kurssit-menu");
  // Closed at rest (pointer-events none / opacity 0 → not actionable-visible).
  await expect(menu.locator('a[href="/espanjan-abikurssi"]')).toHaveCount(1);

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  for (const href of ["/espanjan-abikurssi", "/saksan-abikurssi", "/ranskan-abikurssi"]) {
    await expect(menu.locator(`a[href="${href}"]`)).toBeVisible();
  }
});

test("at 390px the desktop dropdown is hidden and the hamburger drives nav", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html", { waitUntil: "networkidle" });

  await expect(page.locator("#nav-kurssit-dd .nav__dropdown-trigger")).toBeHidden();
  await expect(page.locator("#nav-hamburger")).toBeVisible();
  // The abikurssi links still live in the hamburger menu markup.
  await expect(page.locator('.nav-menu a[href="/espanjan-abikurssi"]')).toHaveCount(1);
});
