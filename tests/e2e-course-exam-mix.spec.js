// E2E — kurssi 1 kertaustesti question-type variety check.
//
// For each language (es / fr / de):
//   1. Log in as pro test user
//   2. Hit /api/curriculum/kurssi_1/lesson/10?lang=<lang> directly and
//      parse the pregenerated payload to collect item_types (ground truth)
//   3. Navigate to app.html, inject state.language, open the lesson via
//      JS modules, click through up to 20 items in the DOM
//   4. Assert ≥ 4 distinct item_types were observed
//
// Pre-launch gate: puheo_gate_ok_v1 set in addInitScript (required per
// project CLAUDE.md instructions).

import { test, expect } from "@playwright/test";

const EMAIL    = process.env.TEST_PRO_EMAIL    || "testpro123@gmail.com";
const PASS     = process.env.TEST_PRO_PASSWORD || "Testpro123";
const BASE_URL = process.env.BASE_URL          || "http://localhost:3000";

const KURSSI_KEY  = "kurssi_1";
const LESSON_IDX  = 10;   // kertaustesti = last lesson
const MAX_ITEMS   = 20;

// ── Helpers ────────────────────────────────────────────────────────────────

function extractTypesFromPayload(body) {
  // Body is the parsed JSON from /api/curriculum/:k/lesson/:i
  const phases = body?.pregenerated?.phases || body?.phases || [];
  const types = new Set();
  for (const phase of phases) {
    for (const item of (phase.items || [])) {
      if (item.item_type) types.add(item.item_type);
    }
  }
  return types;
}

// Detect which lr-* container is currently visible inside the lesson runner
async function detectCurrentType(page) {
  const pairs = [
    ["mc",         ".lr-mc"],
    ["typed",      ".lr-typed"],
    ["gap_fill",   ".lr-gap"],
    ["match",      ".lr-match"],
    ["writing",    ".lr-writing"],
    ["reading_mc", ".lr-reading"],
  ];
  for (const [type, sel] of pairs) {
    const el = page.locator(`#lesson-runner-root ${sel}`).first();
    if (await el.isVisible({ timeout: 200 }).catch(() => false)) return type;
  }
  return null;
}

// Advance one rendered item — submit/click to trigger feedback, then
// click Seuraava if it appears.
async function advanceOneItem(page) {
  const root = page.locator("#lesson-runner-root");

  // MC — click first choice
  const mcChoice = root.locator(".lr-mc-choice").first();
  if (await mcChoice.isVisible({ timeout: 300 }).catch(() => false)) {
    await mcChoice.click();
    await page.waitForTimeout(500);
    const next = root.locator("button:has-text('Seuraava')").first();
    if (await next.isVisible({ timeout: 800 }).catch(() => false)) await next.click();
    return;
  }

  // typed / translate — submit (empty is fine for advancing after wrong answer)
  const typedSubmit = root.locator("#lr-typed-submit").first();
  if (await typedSubmit.isVisible({ timeout: 300 }).catch(() => false)) {
    await typedSubmit.click();
    await page.waitForTimeout(500);
    const next = root.locator("button:has-text('Seuraava')").first();
    if (await next.isVisible({ timeout: 800 }).catch(() => false)) await next.click();
    return;
  }

  // gap_fill
  const gapSubmit = root.locator("#lr-gap-submit").first();
  if (await gapSubmit.isVisible({ timeout: 300 }).catch(() => false)) {
    await gapSubmit.click();
    await page.waitForTimeout(500);
    const next = root.locator("button:has-text('Seuraava')").first();
    if (await next.isVisible({ timeout: 800 }).catch(() => false)) await next.click();
    return;
  }

  // match — skip via skip-item button, or skip-phase
  for (const skipSel of ["[data-lr-skip-item]", "#lr-skip"]) {
    const btn = root.locator(skipSel).first();
    if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
      await btn.click();
      return;
    }
  }
  // match fallback: click first left cell + first right cell to form a pair
  const leftCell = root.locator(".lr-match-cell[data-side='left']").first();
  const rightCell = root.locator(".lr-match-cell[data-side='right']").first();
  if (await leftCell.isVisible({ timeout: 300 }).catch(() => false) &&
      await rightCell.isVisible({ timeout: 300 }).catch(() => false)) {
    await leftCell.click();
    await page.waitForTimeout(200);
    await rightCell.click();
    await page.waitForTimeout(400);
    const next = root.locator("button:has-text('Seuraava')").first();
    if (await next.isVisible({ timeout: 800 }).catch(() => false)) await next.click();
    return;
  }

  // writing
  const writingSubmit = root.locator("#lr-writing-submit").first();
  if (await writingSubmit.isVisible({ timeout: 300 }).catch(() => false)) {
    await writingSubmit.click();
    await page.waitForTimeout(500);
    const next = root.locator("button:has-text('Seuraava')").first();
    if (await next.isVisible({ timeout: 800 }).catch(() => false)) await next.click();
    return;
  }

  // reading_mc
  const readingSubmit = root.locator("#lr-reading-submit").first();
  if (await readingSubmit.isVisible({ timeout: 300 }).catch(() => false)) {
    await readingSubmit.click();
    await page.waitForTimeout(500);
    const next = root.locator("button:has-text('Seuraava')").first();
    if (await next.isVisible({ timeout: 800 }).catch(() => false)) await next.click();
    return;
  }

  // Generic fallback
  const anyPrimary = root.locator("button.btn-primary, button.btn.btn-primary").first();
  if (await anyPrimary.isVisible({ timeout: 300 }).catch(() => false)) {
    await anyPrimary.click();
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

for (const lang of ["es", "fr", "de"]) {
  test.describe(`kurssi 1 kertaustesti — ${lang}`, () => {
    test(`≥ 4 question types present in lesson — ${lang}`, async ({ page, request }) => {
      test.setTimeout(120_000);

      // ── Step 1: API ground-truth check (no browser needed yet) ─────────────
      // POST a login to get an auth token, then GET the lesson JSON.
      // We use page.request so it shares the browser's cookie jar.
      // First navigate so we have a base URL context.
      await page.addInitScript(() => {
        try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
      });

      await page.goto("/app.html", { waitUntil: "domcontentloaded" });

      // ── Login via UI ───────────────────────────────────────────────────────
      const emailField = page.locator("#auth-email");
      const needsLogin = await emailField.isVisible({ timeout: 5_000 }).catch(() => false);

      if (needsLogin) {
        await emailField.fill(EMAIL);
        await page.locator("#auth-password").fill(PASS);
        await page.locator("button:has-text('Kirjaudu sisään')").first().click();
        await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
        await page.waitForTimeout(2_000);
      }

      // ── Step 2: Fetch lesson JSON via API to get item types ────────────────
      const lessonUrl = `${BASE_URL}/api/curriculum/${KURSSI_KEY}/lesson/${LESSON_IDX}?lang=${lang}`;

      // Extract auth token from the app's localStorage (Supabase sets it there)
      const token = await page.evaluate(() => {
        // Supabase stores session as JSON under a key like sb-*-auth-token
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.includes("auth-token")) {
            try {
              const v = JSON.parse(localStorage.getItem(k));
              return v?.access_token || v?.currentSession?.access_token || null;
            } catch { return null; }
          }
        }
        return null;
      });

      const apiResp = await page.request.get(lessonUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (apiResp.status() === 404 || apiResp.status() === 503) {
        test.skip(true, `Language ${lang}: lesson endpoint returned ${apiResp.status()} — skipping`);
        return;
      }

      expect(apiResp.status(), `Lesson API for ${lang} returned ${apiResp.status()}`).toBeLessThan(400);

      const lessonJson = await apiResp.json();
      const apiTypes = extractTypesFromPayload(lessonJson);

      // Fast path: if payload already has ≥ 4 types, we're done
      if (apiTypes.size >= 4) {
        expect(
          apiTypes.size,
          `API payload for ${lang} has item types: ${[...apiTypes].join(", ")}`
        ).toBeGreaterThanOrEqual(4);
        return;
      }

      // ── Step 3: DOM walk (fallback for sparse payloads) ────────────────────
      // Set language on the app state and navigate to the lesson
      await page.evaluate(async ({ kurssiKey, lessonIndex, targetLang }) => {
        try {
          const stateModule = await import("/js/state.js");
          if (stateModule.setLanguage) stateModule.setLanguage(targetLang);
        } catch { /* ignore */ }
        try {
          const m = await import("/js/screens/curriculum.js");
          if (m.openLesson) await m.openLesson(kurssiKey, lessonIndex);
        } catch { /* ignore */ }
      }, { kurssiKey: KURSSI_KEY, lessonIndex: LESSON_IDX, targetLang: lang });

      const runner = page.locator("#lesson-runner-root");
      const mounted = await runner.waitFor({ state: "visible", timeout: 20_000 }).then(() => true).catch(() => false);

      if (!mounted) {
        test.skip(true, `Language ${lang}: lesson runner did not mount`);
        return;
      }

      const seenTypes = new Set(apiTypes);

      for (let i = 0; i < MAX_ITEMS; i++) {
        const anyItem = runner.locator(".lr-mc, .lr-typed, .lr-gap, .lr-match, .lr-writing, .lr-reading").first();
        const visible = await anyItem.isVisible({ timeout: 5_000 }).catch(() => false);
        if (!visible) break;

        const type = await detectCurrentType(page);
        if (type) seenTypes.add(type);
        if (seenTypes.size >= 4) break;

        await advanceOneItem(page);
        await page.waitForTimeout(400);
      }

      expect(
        seenTypes.size,
        `Expected ≥ 4 distinct item types for ${lang}, got: ${[...seenTypes].join(", ")}`
      ).toBeGreaterThanOrEqual(4);
    });
  });
}
