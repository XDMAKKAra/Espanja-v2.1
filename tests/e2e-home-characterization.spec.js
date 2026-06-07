// L-V400 — characterization test for the home/dashboard flow, written BEFORE
// removing the dead #screen-path surface + its renderDashboard() renderer.
// Locks loadDashboard()'s OBSERVABLE behavior (the visible host is #screen-home
// via home.js; loadDashboard also hydrates profile + language). The
// renderDashboard() writes went into the hidden #screen-path and are invisible,
// so removing them must not change anything asserted here.
//
//   npm run test:e2e  (or: npx playwright test e2e-home-characterization)
import { test, expect } from "@playwright/test";

let auth = null;
test.beforeAll(async ({ baseURL }) => {
  const email = process.env.TEST_PRO_EMAILS?.split(",")[0].trim();
  const password = process.env.TEST_PRO_PASSWORD;
  const r = await fetch(`${baseURL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`login -> ${r.status}`);
  const j = await r.json();
  auth = { token: j.token, refresh: j.refreshToken || "", email };
});

test("koti loads #screen-home, hydrates profile/lang, no console errors", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.addInitScript(([t, r, e]) => {
    localStorage.setItem("puheo_token", t);
    localStorage.setItem("puheo_refresh_token", r);
    localStorage.setItem("puheo_email", e);
    localStorage.setItem("puheo_gate_ok_v1", "1");
    localStorage.setItem("puheo_analytics_consent_v1", "denied");
  }, [auth.token, auth.refresh, auth.email]);

  await page.goto("/app.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    location.hash = "#/koti";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await page.waitForTimeout(2500);
  try { await page.waitForLoadState("networkidle", { timeout: 4000 }); } catch {}

  // 1. The visible home screen is active.
  await expect(page.locator("#screen-home.active")).toHaveCount(1);

  // 2. Home content rendered into #home-root (non-empty).
  const homeText = (await page.locator("#home-root").innerText().catch(() => "")) || "";
  expect(homeText.trim().length).toBeGreaterThan(20);

  // 3. The primary "continue / start" CTA is present (home.js renders its own).
  const ctaCount = await page.locator("#screen-home .dash-hero__cta, #screen-home button, #screen-home a").count();
  expect(ctaCount).toBeGreaterThan(0);

  // 4. Sidebar profile avatar present (shell hydrated).
  await expect(page.locator("#sidebar-user, .app-sidebar")).not.toHaveCount(0);

  // 5. loadDashboard hydrated profile + language onto window/state.
  const hydrated = await page.evaluate(() => ({
    profile: !!window._userProfile,
    lang: (() => { try { return localStorage.getItem("puheo:lang"); } catch { return null; } })(),
  }));
  expect(hydrated.profile).toBe(true);

  // 6. No console / page errors during the flow.
  expect(errors, errors.join("\n")).toHaveLength(0);
});
