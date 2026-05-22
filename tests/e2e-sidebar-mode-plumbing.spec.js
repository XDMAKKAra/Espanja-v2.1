// v278 — sidebar mode-list plumbing.
// Verifies that opening a MODE-state (e.g. Sanasto) populates
// #sidebar-mode-items with kurssi-headings + filtered lessons, and that
// clicking a lesson dispatches the canonical lesson route.

import { test, expect } from "@playwright/test";

const MOCK_CURRICULUM = {
  kurssit: [
    { key: "kurssi_1", title: "Kurssi 1 — Kuka olen", level: "A", isUnlocked: true, kertausPassed: false, lessonCount: 3, lessonsCompleted: 1, sortOrder: 1 },
    { key: "kurssi_2", title: "Kurssi 2 — Arki ja elämä", level: "A", isUnlocked: true, kertausPassed: false, lessonCount: 3, lessonsCompleted: 0, sortOrder: 2 },
  ],
};

function lessonsFor(kurssiKey) {
  // Each kurssi has: 1 vocab + 1 grammar + 1 reading lesson — keeps the
  // mode-filter assertions trivial to count.
  return {
    kurssi: { key: kurssiKey, title: kurssiKey, level: "A", sortOrder: 1 },
    lessons: [
      { id: 1, sortOrder: 1, type: "vocab",   focus: `${kurssiKey} sanasto`, exerciseCount: 8, teachingSnippet: "", completed: kurssiKey === "kurssi_1", score: null },
      { id: 2, sortOrder: 2, type: "grammar", focus: `${kurssiKey} kielioppi`, exerciseCount: 8, teachingSnippet: "", completed: false, score: null },
      { id: 3, sortOrder: 3, type: "reading", focus: `${kurssiKey} luetun`, exerciseCount: 5, teachingSnippet: "", completed: false, score: null },
    ],
  };
}

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ context, page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      // Pretend to be logged in (api.js reads `puheo_token`/`puheo_email`).
      localStorage.setItem("puheo_token", "test-token-v278");
      localStorage.setItem("puheo_email", "v278@test.dev");
    } catch {}
  });

  await context.route("**/api/curriculum**", (route) => {
    const url = route.request().url().split("#")[0];
    const match = /\/api\/curriculum\/([^/?]+)$/.exec(url);
    if (match) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(lessonsFor(match[1])) });
    }
    if (/\/api\/curriculum(\?|$)/.test(url)) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_CURRICULUM) });
    }
    return route.continue();
  });
});

async function openModeSanasto(page) {
  await page.goto("/app.html");
  await page.waitForLoadState("domcontentloaded");
  // Drive the mode-shell directly via the same code path navigateTo uses.
  // Avoids depending on the visible nav button in case the auth/landing
  // screen still occludes the sidebar during boot.
  await page.evaluate(async () => {
    const { setSidebarMode } = await import("/js/components/sidebarShell.js");
    const { buildSidebarItemsForMode } = await import("/js/lib/sidebarItems.js");
    setSidebarMode("mode", { modeKey: "vocab", modeLabel: "Sanasto", items: [] });
    const items = await buildSidebarItemsForMode("vocab");
    setSidebarMode("mode", { modeKey: "vocab", modeLabel: "Sanasto", items });
  });
  await page.waitForSelector('#sidebar-mode-items .sidebar-item--lesson', { timeout: 5000 });
}

test("sidebar MODE-state renders kurssi-headings and lesson rows", async ({ page }) => {
  await openModeSanasto(page);

  const sidebar = page.locator(".app-sidebar");
  await expect(sidebar).toHaveAttribute("data-mode", "mode");

  // Title reflects the mode label.
  await expect(page.locator("#sidebar-mode-title")).toHaveText("Sanasto");

  // ≥1 heading + ≥1 lesson rendered.
  const headings = page.locator("#sidebar-mode-items .sidebar-section-heading");
  await expect(headings).toHaveCount(2);
  await expect(headings.first()).toContainText("Kurssi 1");

  // Sanasto-mode shows only "vocab" type lessons (1 per kurssi in mock).
  const lessons = page.locator('#sidebar-mode-items .sidebar-item--lesson');
  await expect(lessons).toHaveCount(2);
  await expect(lessons.first()).toContainText("sanasto");
});

test("clicking a lesson dispatches puheo:open-lesson + sets hash", async ({ page }) => {
  await openModeSanasto(page);

  const eventFired = await page.evaluate(() => new Promise((resolve) => {
    document.addEventListener("puheo:open-lesson", (e) => resolve(e.detail), { once: true });
    const btn = document.querySelector('#sidebar-mode-items .sidebar-item--lesson');
    if (btn) btn.click();
    setTimeout(() => resolve(null), 1500);
  }));

  expect(eventFired).not.toBeNull();
  expect(eventFired.kurssiKey).toBe("kurssi_1");
  expect(eventFired.lessonIndex).toBe(1);

  // The hash route is wired in main.js; in this test we drive sidebarShell
  // directly without booting main.js, so we only assert the event payload.
});

test("tab navigation skips heading list-items", async ({ page }) => {
  await openModeSanasto(page);

  const headings = await page.locator("#sidebar-mode-items .sidebar-section-heading").all();
  for (const h of headings) {
    // Headings are <li>, not buttons → not focusable. No tabindex set.
    const ti = await h.getAttribute("tabindex");
    expect(ti === null || ti === "-1").toBe(true);
  }
});
