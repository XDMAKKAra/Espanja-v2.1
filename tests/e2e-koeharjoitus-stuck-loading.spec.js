// v270 — Koeharjoitus card on Aloitus opens the resume modal correctly
// instead of leaving the user stuck on "Tarkistetaan aktiivista koetta…".
//
// Root cause: css/app-old-spain.css `body.app > *` rule (specificity 0,1,1)
// downgraded `.confirm-dialog-root { position: fixed; z-index: 1000 }` to
// `position: relative; z-index: 1`, so the resume dialog only covered the
// lower half of the viewport behind the loading screen. User saw the
// spinner + "Tarkistetaan aktiivista koetta…" and couldn't reach the
// "Jatka kesken olevaa" / "Aloita uusi koe" buttons in the dialog.
//
// Defense-in-depth: a 12 s watchdog now flips startFullExam into a
// retryable error state if /api/exam/resume never resolves.
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

async function loginAndLandAloitus(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });

  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body.app')).toBeVisible();

  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await page.locator('button:has-text("Kirjaudu sisään")').first().click();
    await page.waitForFunction(
      () => {
        const auth = document.getElementById('screen-auth');
        return !auth || auth.classList.contains('hidden') || getComputedStyle(auth).display === 'none';
      },
      { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(2000);
  }
  return errors;
}

test.describe('Koeharjoitus card on Aloitus', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('does not strand user on "Tarkistetaan aktiivista koetta…" within 5 s', async ({ page }) => {
    test.setTimeout(60_000);
    await loginAndLandAloitus(page);

    const koeharjoitus = page.locator('[data-action="exam"]').first();
    await expect(koeharjoitus).toBeVisible();
    await koeharjoitus.click();

    // Within 5 s either the exam screen renders, the resume modal is visible
    // (with reachable buttons), or the loading-error retry state is shown.
    // What we MUST NOT see: the "Tarkistetaan aktiivista koetta…" loading
    // spinner without any reachable affordance.
    await page.waitForFunction(() => {
      const examScreen = document.getElementById('screen-full-exam');
      if (examScreen && examScreen.classList.contains('active')) return true;

      const resumeBtn = document.getElementById('exam-resume-confirm');
      if (resumeBtn) {
        const r = resumeBtn.getBoundingClientRect();
        const cs = getComputedStyle(resumeBtn);
        const reachable = r.width > 0 && r.height > 0
          && cs.visibility !== 'hidden' && cs.display !== 'none'
          && r.top >= 0 && r.bottom <= window.innerHeight;
        if (reachable) return true;
      }

      const loadingScreen = document.getElementById('screen-loading');
      // Loading-error variant exposes a retry button → recoverable, not stranded.
      if (loadingScreen && loadingScreen.querySelector('button')) return true;
      return false;
    }, { timeout: 5_000 });
  });

  test('L-EXAM-LOADER-1: screen-loading is dismissed before the resume modal opens', async ({ page }) => {
    test.setTimeout(60_000);
    await loginAndLandAloitus(page);

    // The Koeharjoitus entry point lives in the home footer (data-action="exam"),
    // not the legacy .home-mode tile — the older locator silently selected
    // nothing on current builds and the test passed for the wrong reason.
    const koeharjoitus = page.locator('[data-action="exam"]').first();
    await expect(koeharjoitus).toBeVisible();
    await koeharjoitus.click();

    // Wait until the resume modal is reachable, then assert the loading
    // screen is no longer the active screen. Pre-fix the modal opened while
    // #screen-loading kept .active and its spinner pumped behind the
    // 0.28-opacity backdrop, reading as "stuck loader".
    await expect(page.locator('#exam-resume-dialog-root.is-open')).toBeVisible({ timeout: 8_000 });

    const loadingActive = await page.evaluate(() => {
      const el = document.getElementById('screen-loading');
      return !!(el && el.classList.contains('active'));
    });
    expect(loadingActive, 'screen-loading.active while resume modal is open').toBe(false);

    // Belt + braces: the spinner element itself must not be rendering inside
    // the viewport. If layout ever changes so screen-loading is positioned
    // off-screen by other means, that's still fine.
    const spinnerVisible = await page.locator('#loading-spinner').isVisible().catch(() => false);
    const screenLoadingRect = await page.evaluate(() => {
      const el = document.getElementById('screen-loading');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { w: r.width, h: r.height, display: cs.display, visibility: cs.visibility };
    });
    const stillPainting =
      spinnerVisible &&
      screenLoadingRect &&
      screenLoadingRect.display !== 'none' &&
      screenLoadingRect.visibility !== 'hidden' &&
      screenLoadingRect.w > 0 &&
      screenLoadingRect.h > 0;
    expect(stillPainting, 'loader still painted behind resume modal').toBe(false);
  });

  test('resume dialog covers the viewport above screen-loading (CSS specificity fix)', async ({ page }) => {
    test.setTimeout(60_000);
    await loginAndLandAloitus(page);

    await page.locator('[data-action="exam"]').first().click();

    // Resume dialog must appear (testpro has an active session) AND must
    // cover the full viewport with z-index > the loading screen.
    const dialog = page.locator('#exam-resume-dialog-root.is-open');
    await expect(dialog).toBeVisible({ timeout: 8_000 });

    const rect = await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { x: r.x, y: r.y, w: r.width, h: r.height, position: cs.position, zIndex: cs.zIndex };
    });

    expect(rect.position, 'dialog-root position').toBe('fixed');
    expect(Number(rect.zIndex), 'dialog-root z-index').toBeGreaterThanOrEqual(1000);
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0);
    expect(rect.w).toBe(1440);
    expect(rect.h).toBe(900);

    // Primary CTA must be in the upper half of the viewport so the user
    // doesn't read it as a stuck loading screen.
    const ctaRect = await page.locator('#exam-resume-confirm').boundingBox();
    expect(ctaRect, 'resume CTA bounding box').not.toBeNull();
    expect(ctaRect.y).toBeLessThan(450);
  });
});
