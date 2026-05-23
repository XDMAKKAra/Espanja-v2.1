// L-V290-MICROCOPY-SWEEP-1 — multi-screen anti-slop contract.
//
// Locks four signatures across the user's first-five-minutes path:
//   1. no mono-uppercase run (5+ chars) outside a small acronym allowlist
//   2. no em-dash in user-facing copy
//   3. no underscore tech IDs (kurssi_3, jne) bleeding into copy
//   4. no italic on chrome elements (h1, h2, h3, p, span, a, button, label)

import { test, expect } from "@playwright/test";

const SCREENS = [
  "/app.html#/aloitus",
  "/app.html#/oppimispolku",
  "/app.html#/asetukset",
];

const ACCEPTED_UPPERCASE = new Set([
  "EDELLINEN", "SEURAAVA",
  "CEFR", "YTL", "OFL",
  "ESPANJA", "RANSKA", "SAKSA",
  "GDPR", "EULA",
]);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("puheo_gate_ok_v1", "1");
    localStorage.setItem("puheo_token", "test-token-v290");
    localStorage.setItem("puheo_email", "test@example.com");
  });
  await page.setViewportSize({ width: 1440, height: 900 });
});

for (const path of SCREENS) {
  test(`${path}: no mono-uppercase 5+ runs outside allowlist`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    // Scope to the active screen so other (hidden) SPA screens don't taint.
    const text = await page.evaluate(() => {
      const root = document.querySelector(".screen.active") || document.body;
      return root.innerText || "";
    });
    const suspect = text.match(/\b[A-ZÄÖÅ]{5,}\b/g) || [];
    const violations = suspect.filter((s) => !ACCEPTED_UPPERCASE.has(s));
    expect(violations, `uppercase: ${JSON.stringify(violations)}`).toEqual([]);
  });

  test(`${path}: no em-dash in active-screen copy`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    const text = await page.evaluate(() => {
      const root = document.querySelector(".screen.active") || document.body;
      return root.innerText || "";
    });
    expect(text, "em-dash present").not.toContain("—");
  });

  test(`${path}: no underscore tech IDs in copy`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    const text = await page.evaluate(() => {
      const root = document.querySelector(".screen.active") || document.body;
      return root.innerText || "";
    });
    expect(text).not.toMatch(/\bkurssi_\d+\b/i);
    expect(text).not.toMatch(/\boppitunti_\d+\b/i);
  });

  test(`${path}: no italic on chrome elements`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    const italics = await page.evaluate(() => {
      const screen = document.querySelector(".screen.active");
      if (!screen) return [];
      const out = [];
      screen.querySelectorAll("h1, h2, h3, p, span, a, button, label").forEach((el) => {
        if (window.getComputedStyle(el).fontStyle === "italic") {
          out.push({
            tag: el.tagName,
            cls: typeof el.className === "string" ? el.className.slice(0, 60) : "",
            text: (el.textContent || "").trim().slice(0, 30),
          });
        }
      });
      return out;
    });
    expect(italics, `italic chrome: ${JSON.stringify(italics)}`).toEqual([]);
  });
}
