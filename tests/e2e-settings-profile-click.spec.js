// Repro for P0 #1: clicking Asetukset / sidebar-user does not open
// screen-settings / screen-profile. Captures console errors + final
// active-screen id.
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test('sidebar Asetukset + sidebar-user open their screens', async ({ page }) => {
  test.setTimeout(120_000);

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});

  // Log in if auth screen is showing.
  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await page.locator('button:has-text("Kirjaudu sisään")').first().click();
    await page.waitForTimeout(3000);
  }

  await page.setViewportSize({ width: 1440, height: 900 });

  // Snapshot the visible buttons + DOM state before click.
  const navState = await page.evaluate(() => ({
    hasNavSettings: !!document.getElementById('nav-settings'),
    navSettingsVisible: !!document.getElementById('nav-settings')?.offsetParent,
    hasSidebarUser: !!document.getElementById('sidebar-user'),
    sidebarUserText: document.getElementById('sidebar-user')?.textContent || '',
    hasScreenSettings: !!document.getElementById('screen-settings'),
    hasScreenProfile: !!document.getElementById('screen-profile'),
    activeScreenId: document.querySelector('.screen.active')?.id || null,
  }));
  console.log('NAV STATE PRE-CLICK:', JSON.stringify(navState));

  // Click Asetukset
  await page.locator('#nav-settings').click({ force: true });
  await page.waitForTimeout(1500);
  const afterSettings = await page.evaluate(() => document.querySelector('.screen.active')?.id || null);
  console.log('AFTER CLICK Asetukset, active screen =', afterSettings);

  // Click sidebar-user (profile)
  await page.locator('#sidebar-user').click({ force: true });
  await page.waitForTimeout(1500);
  const afterProfile = await page.evaluate(() => document.querySelector('.screen.active')?.id || null);
  console.log('AFTER CLICK sidebar-user, active screen =', afterProfile);

  console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors, null, 2));
  console.log('PAGE ERRORS:', JSON.stringify(pageErrors, null, 2));

  expect(afterSettings, 'Asetukset click should land on screen-settings').toBe('screen-settings');
  expect(afterProfile, 'sidebar-user click should land on screen-profile').toBe('screen-profile');
});
