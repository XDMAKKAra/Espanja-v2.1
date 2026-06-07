// L-V378 — app-bug regressions.
//
// BUG-1 (P0): the login (auth) view must NOT render the logged-in app-shell
//   (sidebar + "Kirjaudu ulos"). Root cause was a v277 band-aid in
//   sidebar-shell.css that forced `display: grid !important` on any
//   `.app-sidebar[style*=display:none]`, defeating both the logged-out inline
//   hide and `body.auth-mode .app-sidebar { display:none }`.
//
// BUG-2 (3rd strike): the active sidebar pill must follow the current route
//   from ONE source of truth (syncActiveNav), not the last click. The old
//   navigateTo() toggled the class straight from the clicked nav, only touched
//   [data-nav] items (missing the "Tehtävät" data-nav-active link), and used
//   replaceState (no hashchange) so the route-derived sync never ran — leaving
//   Koti + Tehtävät both lit.

import { test, expect } from "@playwright/test";

const URL = "http://localhost:3000/app.html";

// Distinct active route-keys in the sidebar. Several DOM nodes can share a key
// (top "Koti" + hidden mode-state "Aloitus" back-button are both `home`); the
// bug was two DIFFERENT keys lit at once, so we dedupe to keys.
async function activeNavKeys(page) {
  return page.evaluate(() => {
    const keys = [...document.querySelectorAll("#app-sidebar .sidebar-item.active")]
      .map((e) => e.dataset.nav || e.dataset.navActive)
      .filter(Boolean);
    return [...new Set(keys)];
  });
}

test.describe("BUG-1 — login view is shell-free", () => {
  test.beforeEach(async ({ page }) => {
    // Logged OUT: only bypass the pre-launch gate, no token.
    await page.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test("logged-out auth screen hides the sidebar and logout link", async ({ page }) => {
    await page.goto(URL, { waitUntil: "networkidle" });
    await expect(page.locator("#screen-auth")).toHaveClass(/active/);
    // Sidebar collapsed (display:none) and not laid out.
    const sidebar = page.locator("#app-sidebar");
    await expect(sidebar).toHaveCSS("display", "none");
    await expect(sidebar).toBeHidden();
    // No "Kirjaudu ulos" surfaced on the login surface.
    await expect(page.locator("#sidebar-logout")).toBeHidden();
    await expect(page.locator("#mobile-nav")).toBeHidden();
  });

  test("login surface stays shell-free on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(URL, { waitUntil: "networkidle" });
    await expect(page.locator("#app-sidebar")).toHaveCSS("display", "none");
    await expect(page.locator("#sidebar-logout")).toBeHidden();
  });
});

test.describe("BUG-2 — active pill follows the route (single source of truth)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.setItem("puheo_token", "test-token-v378");
      localStorage.setItem("puheo_email", "test@example.com");
    });
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test("Koti -> Tehtävät -> Koti -> Profiili lights exactly one pill each", async ({ page }) => {
    await page.goto(URL, { waitUntil: "networkidle" });

    await page.click("#nav-home");
    await expect.poll(() => activeNavKeys(page)).toEqual(["home"]);

    await page.click("#nav-oppimispolku");
    await expect.poll(() => activeNavKeys(page)).toEqual(["path"]);

    // The regression: returning to Koti must clear Tehtävät.
    await page.click("#nav-home");
    await expect.poll(() => activeNavKeys(page)).toEqual(["home"]);

    await page.click("#nav-profile");
    await expect.poll(() => activeNavKeys(page)).toEqual(["profile"]);
  });
});
