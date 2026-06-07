// L-V402 OSA B — onboarding V4 smoke. After removing V2/V3 onboarding, prove
// the surviving V4 flow still runs start-to-finish for a logged-out visitor
// at #/aloitus with zero uncaught JS errors. Walks the skip path (no backend
// account creation): intro → biography → (textbook) → summary → account → choice.
import { test, expect } from "@playwright/test";

const GATE = () => {
  // Pre-launch gate guard + force logged-out so #/aloitus routes to V4.
  localStorage.setItem("puheo_gate_ok_v1", "1");
  localStorage.removeItem("puheo_token");
  localStorage.removeItem("puheo_user");
};

// console messages that signal a real code fault (vs. expected network noise
// from logged-out POSTs that the app catches and logs as warnings).
const FATAL = /TypeError|ReferenceError|is not a function|Cannot read|is not defined|SyntaxError/;

async function activeId(page) {
  return page.evaluate(() => document.querySelector(".screen.active")?.id || null);
}

async function clickAndAdvance(page, buttonSel) {
  await page.locator(buttonSel).click();
}

test("V4 onboarding runs end-to-end logged out (#/aloitus → choice), 0 JS errors", async ({ page }) => {
  const pageErrors = [];
  const consoleFatals = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && FATAL.test(m.text())) consoleFatals.push(m.text());
  });

  await page.addInitScript(GATE);
  await page.goto("/app.html#/aloitus");

  // Step 1: intro renders.
  await expect(page.locator("#screen-ob-v4-intro.active")).toBeVisible({ timeout: 15000 });

  // Skip the diagnostic → biography.
  await clickAndAdvance(page, "#ob-v4-intro-skip");
  await expect(page.locator("#screen-ob-v4-biography.active")).toBeVisible({ timeout: 10000 });

  // Biography → continue (logged out skips the POST) → textbook or summary.
  await clickAndAdvance(page, "#ob-v4-bio-continue");
  await page.waitForFunction(() => {
    const id = document.querySelector(".screen.active")?.id;
    return id === "screen-ob-v4-textbook" || id === "screen-ob-v4-summary";
  }, { timeout: 10000 });

  // If textbook step shown, skip it → summary.
  if ((await activeId(page)) === "screen-ob-v4-textbook") {
    await clickAndAdvance(page, "#ob-v4-textbook-skip");
    await expect(page.locator("#screen-ob-v4-summary.active")).toBeVisible({ timeout: 10000 });
  }

  // Summary → start → account (logged out).
  await clickAndAdvance(page, "#ob-v4-summary-start");
  await expect(page.locator("#screen-ob-v4-account.active")).toBeVisible({ timeout: 10000 });

  // Account → skip → choice (the end of the flow).
  await clickAndAdvance(page, "#ob-v4-acct-skip");
  await expect(page.locator("#screen-ob-v4-choice.active")).toBeVisible({ timeout: 10000 });

  expect(pageErrors, `uncaught JS errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
  expect(consoleFatals, `fatal console errors:\n${consoleFatals.join("\n")}`).toHaveLength(0);
});
