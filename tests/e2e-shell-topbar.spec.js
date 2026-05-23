// L-V287-SHELL-TOP-1 — sidebar must reach viewport top in every state.
//
// Regression: a `body:has(.app-countdown:not(.hidden)) .app-sidebar { top: 34px }`
// rule in style.css left a white band above the Puheo logo for any user
// who hadn't dismissed the persistent YO countdown. The fix pins the
// sidebar at top: 0 always and offsets the countdown's left edge by the
// sidebar width on desktop instead.

import { test, expect } from "@playwright/test";

const SCREENS = ["/aloitus", "/asetukset", "/oppimispolku", "/profiili"];

for (const path of SCREENS) {
  test(`sidebar reaches viewport top on ${path} — countdown hidden`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
    await page.goto(`http://localhost:3000/app.html#${path}`, { waitUntil: "networkidle" });

    const sidebar = page.locator(".app-sidebar").first();
    const box = await sidebar.boundingBox();
    expect(box, `sidebar must render on ${path}`).not.toBeNull();
    expect(box.y, `sidebar.y on ${path} (countdown hidden)`).toBeLessThanOrEqual(1);
  });

  test(`sidebar reaches viewport top on ${path} — countdown visible`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
    await page.goto(`http://localhost:3000/app.html#${path}`, { waitUntil: "networkidle" });

    // Force the countdown into the visible state: this is the historic trigger
    // of the white-band regression.
    await page.evaluate(() => {
      const cd = document.getElementById("app-countdown");
      if (cd) cd.classList.remove("hidden");
      const days = document.getElementById("app-countdown-days");
      if (days) days.textContent = "186";
    });
    // Allow :has() recalc to settle.
    await page.waitForTimeout(120);

    const sidebar = page.locator(".app-sidebar").first();
    const box = await sidebar.boundingBox();
    expect(box, `sidebar must render on ${path}`).not.toBeNull();
    expect(box.y, `sidebar.y on ${path} (countdown visible)`).toBeLessThanOrEqual(1);

    // Bonus: when the countdown actually ends up visible on this route at this
    // viewport, it must not overlap the sidebar's brand surface on desktop.
    // Some screens hide the countdown via JS shortly after route enter — we
    // skip the check rather than fail in that case.
    const viewport = page.viewportSize();
    const cd = await page.locator("#app-countdown").boundingBox();
    if (cd && viewport && viewport.width >= 1024) {
      expect(
        cd.x,
        "countdown left edge sits past sidebar width on desktop",
      ).toBeGreaterThanOrEqual(box.width - 1);
    }
  });
}

test("tablet (900px) sidebar top: 0 with countdown visible", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
  await page.goto("http://localhost:3000/app.html#/aloitus", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const cd = document.getElementById("app-countdown");
    if (cd) cd.classList.remove("hidden");
  });
  await page.waitForTimeout(120);

  const sidebar = page.locator(".app-sidebar").first();
  const box = await sidebar.boundingBox();
  expect(box, "sidebar must render on tablet (off-canvas, position: fixed)").not.toBeNull();
  expect(box.y, "tablet sidebar.y").toBeLessThanOrEqual(1);
});
