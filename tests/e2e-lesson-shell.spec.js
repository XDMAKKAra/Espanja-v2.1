// L-V288-LESSON-SHELL-1: opetussivu (digikirja) must have exactly one
// sidebar visible. The v277 "global rail + lesson sidemenu" arkkitehtuuri
// produced literal overlap because both layers anchored at x=0 and the
// rail selectors were partially dead. Direction A: hide .app-sidebar
// entirely on the book screen, dk__sidemenu is sole navigation.
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

async function login(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('puheo_gate_ok_v1', '1');
      // Force dk__sidemenu open so visibility assertions pass; the
      // single-sidebar contract is about which sidebar paints, not the
      // collapsed-by-default UX.
      localStorage.setItem('puheo:dk:sidemenu', 'open');
    } catch {}
  });
  await page.goto('/app.html');
  await page.waitForLoadState('networkidle').catch(() => {});
  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await page.locator('button:has-text("Kirjaudu sisään")').first().click();
    await page.waitForTimeout(2200);
  }
}

const LESSONS_TO_TEST = [
  '#/oppitunti/es/kurssi_2/3/teoria',
  '#/oppitunti/es/kurssi_1/1/teoria',
];

// The single-sidebar invariant only makes sense at desktop widths where
// dk__sidemenu lives inline in the layout. On mobile the global sidebar
// is off-canvas anyway (off-canvas-nav.css) and the lesson sidemenu is
// collapsed-by-default — there is no double-sidebar surface to test.
test.beforeEach(async ({ viewport }) => {
  test.skip((viewport?.width || 0) < 1024, 'desktop-only invariant');
});

test('lesson page hides the global app-sidebar — only dk__sidemenu remains', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);

  await page.evaluate((h) => { location.hash = h; }, LESSONS_TO_TEST[0]);
  await page.waitForTimeout(1500);

  // dk__sidemenu is the live one (pref forced to 'open' in login())
  await expect(page.locator('.dk__sidemenu')).toBeVisible();

  // Global .app-sidebar exists in DOM but is display:none (data-mode="book")
  const appSidebarVisible = await page.locator('#app-sidebar').isVisible();
  expect(appSidebarVisible).toBe(false);

  // The shell mode-attribute reflects book state
  const mode = await page.locator('#app-sidebar').getAttribute('data-mode');
  expect(mode).toBe('book');
});

test('lesson title is not cropped at 1440px', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);

  await page.evaluate((h) => { location.hash = h; }, LESSONS_TO_TEST[0]);
  await page.waitForTimeout(1500);

  const title = page.locator('.dk__topbar .dk__title');
  await expect(title).toBeVisible();
  const overflowed = await title.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflowed).toBe(false);
});

test('TOC rows are fully visible (no horizontal truncation)', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);

  await page.evaluate((h) => { location.hash = h; }, LESSONS_TO_TEST[0]);
  await page.waitForTimeout(1500);

  // Ensure dk__sidemenu is actually open before measuring rows.
  await expect(page.locator('.dk__sidemenu')).toBeVisible();

  const rows = page.locator('.dk__sidemenu-list .dk__row');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const overflowed = await row.evaluate((el) => {
      const label = el.querySelector('.dk__row-label, .dk__row-title') || el;
      return label.scrollWidth > label.clientWidth + 1;
    });
    expect(overflowed, `row ${i} truncated`).toBe(false);
  }
});

test('multiple lessons render with exactly one sidebar (no per-lesson regression)', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);

  for (const hash of LESSONS_TO_TEST) {
    await page.evaluate((h) => { location.hash = h; }, hash);
    await page.waitForTimeout(1200);
    const dkVisible = await page.locator('.dk__sidemenu').isVisible();
    const shellVisible = await page.locator('#app-sidebar').isVisible();
    // Contract: never both visible. With the pref forced to 'open' the
    // expected state is dk__sidemenu=true, app-sidebar=false.
    expect(
      dkVisible && shellVisible,
      `${hash}: double sidebar (dk=${dkVisible}, shell=${shellVisible})`
    ).toBe(false);
    expect(shellVisible, `${hash}: global app-sidebar must be hidden in book mode`).toBe(false);
  }
});
