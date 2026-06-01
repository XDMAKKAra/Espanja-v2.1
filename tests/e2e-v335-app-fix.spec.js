// L-V335 — app functional-fix regression contract.
//
// Locks the trust-breakers fixed in this loop:
//   1. Home has no category rows (Sanasto/Kielioppi/... linking to the same view)
//   2. The dead "(tulossa)" reader-topbar tool buttons are gone
//   3. The exercise score counter does not render as "0 / 0" before scoring
//   5. The reader shell uses the current .brand-wordmark logo
//
// NOTE: the match / yhdistämistehtävä "avautuu pian" placeholder is intentionally
// kept until L-V338 wires up the real renderer, so it is NOT asserted against here.
// (Bug 4, the stray brick box, was the home category-row block removed in #1.)
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || 'Testpro123';
const DEMO_PHASE = '#/oppitunti/es/kurssi_2/3/phase-0';

async function login(page) {
  await page.addInitScript(() => { try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {} });
  await page.goto('/app.html');
  await page.waitForLoadState('networkidle').catch(() => {});
  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await page.locator('button:has-text("Kirjaudu sisään")').first().click();
    await page.waitForTimeout(2600);
  }
}

test('home shows no category rows, only greeting + one primary CTA', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => { location.hash = '#/aloitus'; });
  await page.waitForTimeout(1500);

  const home = page.locator('#home-root');
  // The removed block: hairline category rows + their container.
  await expect(page.locator('#home-root .home-paths')).toHaveCount(0);
  await expect(page.locator('#home-root .home-path__row')).toHaveCount(0);

  // Exactly one primary CTA survives (the "Avaa oppimispolku" brick).
  await expect(page.locator('#screen-home [data-cta-primary]')).toHaveCount(1);

  // None of the old category labels render as their own list rows.
  const txt = (await home.allTextContents()).join(' ');
  expect(txt).not.toMatch(/Luetun ymmärtäminen/);
});

test('reader topbar has no dead "(tulossa)" tool buttons', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate((h) => { location.hash = h; }, DEMO_PHASE);
  await page.waitForTimeout(1600);

  const active = await page.evaluate(() => document.querySelector('.screen.active')?.id);
  expect(active).toBe('screen-digikirja');

  // The non-functional search + help buttons (title="… (tulossa)") were removed.
  await expect(page.locator('#dk-search')).toHaveCount(0);
  await expect(page.locator('#dk-help')).toHaveCount(0);
  const toolsText = (await page.locator('.dk__topbar .dk__tools').allTextContents()).join(' ');
  expect(toolsText.toLowerCase()).not.toContain('tulossa');
});

test('exercise score does not render as "0 / 0" before scoring', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate((h) => { location.hash = h; }, DEMO_PHASE);
  await page.waitForTimeout(1600);

  // On a fresh exercise (nothing answered) the score span is omitted.
  const head = page.locator('.dk__exercise .dk__exercise-head').first();
  await expect(head).toBeVisible();
  const headText = (await head.textContent()) || '';
  expect(headText).not.toMatch(/0\s*\/\s*0/);
  await expect(head.locator('.dk__exercise-score')).toHaveCount(0);
});

test('reader shell logo uses the current brand-wordmark', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate((h) => { location.hash = h; }, DEMO_PHASE);
  await page.waitForTimeout(1600);

  // The sidemenu logo is the lowercase wordmark span, not the old Puhe<span>o</span>.
  await expect(page.locator('.dk__sidemenu-logo .brand-wordmark')).toHaveCount(1);
  await expect(page.locator('.dk__sidemenu-logo .brand-wordmark')).toHaveText('puheo');
});
