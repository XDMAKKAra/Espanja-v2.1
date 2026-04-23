// E2E — accessibility audit per SPA screen.
//
// Drives every SPA screen by mutating its data-screen attribute via the
// renderer dispatcher, then runs axe-core against the live DOM and fails
// on any violation tagged serious or critical. wcag2a + wcag2aa are the
// enabled rule sets — in line with pa11y baseline in exercises/baselines/.
//
// Marketing pages (landing, pricing, privacy, terms, refund) are tested
// as standalone URLs since they're server-rendered HTML, not SPA screens.

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SPA_SCREENS = [
  // Each entry: { name, activate(page) }. The activate step wires the screen
  // into visible state. Most screens are gated behind auth in production;
  // for a11y we reveal them synchronously via DOM manipulation so we can
  // audit rendered structure without spinning up a full logged-in session.
  { name: "auth",         id: "screen-auth" },
  { name: "dashboard",    id: "screen-dashboard" },
  { name: "vocab",        id: "screen-vocab" },
  { name: "grammar",      id: "screen-grammar" },
  { name: "reading",      id: "screen-reading" },
  { name: "writing",      id: "screen-writing" },
  { name: "exam",         id: "screen-exam" },
  { name: "fullExam",     id: "screen-full-exam" },
  { name: "placement",    id: "screen-placement" },
  { name: "onboarding",   id: "screen-onboarding" },
  { name: "settings",     id: "screen-settings" },
  { name: "learningPath", id: "screen-path" },
  { name: "quickReview",  id: "screen-quick-review" },
  { name: "verbReference", id: "screen-verb-reference" },
  { name: "verbSprint",   id: "screen-verb-sprint" },
  { name: "adaptive",     id: "screen-adaptive" },
];

const MARKETING_PATHS = [
  "/",
  "/pricing.html",
  "/privacy.html",
  "/terms.html",
  "/refund.html",
];

async function runAxe(page) {
  return await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
}

function severeViolations(results) {
  return results.violations.filter(v => ["serious", "critical"].includes(v.impact));
}

test.describe("a11y — SPA screens", () => {
  for (const { name, id } of SPA_SCREENS) {
    test(`screen "${name}" has no serious/critical axe violations`, async ({ page }) => {
      await page.goto("/app.html");
      await page.waitForLoadState("networkidle");

      // Reveal the target screen if it exists
      const exists = await page.evaluate(selector => {
        const el = document.getElementById(selector);
        if (!el) return false;
        document.querySelectorAll(".screen.active").forEach(s => s.classList.remove("active"));
        el.classList.add("active");
        return true;
      }, id);

      if (!exists) {
        test.skip(true, `screen id=${id} not present in DOM`);
        return;
      }

      const results = await runAxe(page);
      const severe = severeViolations(results);
      if (severe.length) {
        console.log(`[a11y] ${name} violations:`,
          JSON.stringify(severe.map(v => ({ id: v.id, nodes: v.nodes.length, help: v.helpUrl })), null, 2));
      }
      expect(severe, `${name}: ${severe.map(v => v.id).join(", ")}`).toEqual([]);
    });
  }
});

test.describe("a11y — marketing pages", () => {
  for (const path of MARKETING_PATHS) {
    test(`${path} has no serious/critical axe violations`, async ({ page }) => {
      await page.goto(path);
      const results = await runAxe(page);
      const severe = severeViolations(results);
      if (severe.length) {
        console.log(`[a11y] ${path} violations:`,
          JSON.stringify(severe.map(v => ({ id: v.id, nodes: v.nodes.length })), null, 2));
      }
      expect(severe, `${path}: ${severe.map(v => v.id).join(", ")}`).toEqual([]);
    });
  }
});
