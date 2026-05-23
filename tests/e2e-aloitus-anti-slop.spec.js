// L-V289-ALOITUS-REDESIGN-1 — anti-slop contract for /aloitus.
//
// Locks the four signatures the previous v271 layout broke on:
//   1. exactly one primary CTA
//   2. no identical card grid (>=3 same-class cards)
//   3. no mono-uppercase chips outside a small acronym allowlist
//   4. no em-dash in user-facing copy

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // bypass pre-launch gate + pretend to be logged in. Without a token the
    // /aloitus hash hands control to onboarding-v3 (see js/main.js:195),
    // so the home screen never renders and the spec sees zero of everything.
    localStorage.setItem("puheo_gate_ok_v1", "1");
    localStorage.setItem("puheo_token", "test-token-v289");
    localStorage.setItem("puheo_email", "test@example.com");
  });
  await page.setViewportSize({ width: 1440, height: 900 });
});

const URL = "http://localhost:3000/app.html#/aloitus";

test("aloitus has exactly one primary CTA", async ({ page }) => {
  await page.goto(URL, { waitUntil: "networkidle" });
  // Scope to the home screen so other screens' DOM (hidden in the SPA shell)
  // does not contribute. The redesign marks the brick action with
  // data-cta-primary; the legacy .cta-primary / .btn-primary selectors are
  // kept in the check so a future regression that brings them back also fails.
  const primaryCtas = page.locator("#screen-home [data-cta-primary], #screen-home .cta-primary, #screen-home .btn-primary");
  await expect(primaryCtas).toHaveCount(1);
});

test("aloitus has no identical card grid (>=3 same-class card-like siblings)", async ({ page }) => {
  await page.goto(URL, { waitUntil: "networkidle" });
  // The slop pattern the brief bans is the "4 identical mode tiles in a row"
  // shape, not a list with hairline separators. Match the brief's spec
  // literally: only flag containers explicitly classed as a card grid
  // OR auto-detect a horizontal CSS-grid of same-class card-like children.
  const offenders = await page.evaluate(() => {
    const home = document.querySelector("#home-root");
    if (!home) return [];
    const out = [];
    home.querySelectorAll(".card-grid, [data-card-grid]").forEach((grid) => {
      if (grid.children.length >= 3) out.push({ via: "class", count: grid.children.length });
    });
    // Auto-detect: any element whose computed display is grid with >=3 cols
    // and whose direct children all share a class that contains "card" or
    // "tile" with identical class signatures.
    home.querySelectorAll("*").forEach((node) => {
      const cs = window.getComputedStyle(node);
      if (cs.display !== "grid") return;
      const cols = (cs.gridTemplateColumns || "").split(" ").filter(Boolean).length;
      if (cols < 3) return;
      const kids = Array.from(node.children);
      if (kids.length < 3) return;
      const sig = kids[0].className || "";
      const looksLikeCard = /card|tile|track/i.test(sig);
      const allSame = kids.every((k) => k.className === sig);
      if (looksLikeCard && allSame) {
        out.push({ via: "computed-grid", sig, count: kids.length });
      }
    });
    return out;
  });
  expect(offenders, `card-grid offenders: ${JSON.stringify(offenders)}`).toEqual([]);
});

test("aloitus has no mono-uppercase eyebrows outside acronym allowlist", async ({ page }) => {
  await page.goto(URL, { waitUntil: "networkidle" });
  const home = page.locator("#screen-home");
  const allText = (await home.allTextContents()).join(" ");
  const suspect = allText.match(/\b[A-ZÄÖÅ]{6,}\b/g) || [];
  const allowed = new Set(["EDELLINEN", "SEURAAVA", "CEFR", "ESPANJA", "RANSKA", "SAKSA"]);
  const violations = suspect.filter((s) => !allowed.has(s));
  expect(violations, `uppercase violations: ${JSON.stringify(violations)}`).toEqual([]);
});

test("aloitus has no em-dash in user-facing copy", async ({ page }) => {
  await page.goto(URL, { waitUntil: "networkidle" });
  const home = page.locator("#screen-home");
  const allText = (await home.allTextContents()).join(" ");
  expect(allText).not.toContain("—");
});
