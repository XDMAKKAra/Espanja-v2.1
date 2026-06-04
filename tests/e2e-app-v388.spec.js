// L-V388 — app: sidebar trimmed to the export's 4 destinations, MC feedback
// colours restored to clear green/red (the "correct shows muddy/ambiguous"
// bug), Oppimispolku index already matches the export.
//
// The token-colour check runs without auth (body.app exists on the login
// screen). The sidebar/path checks need a logged-in session, so they are
// gated on TEST_LOGIN_PASSWORD + an email being present (same pattern as
// e2e-bug-scan.spec.js) and skip cleanly when creds are absent.
import { test, expect } from '@playwright/test';

const bypassGate = (page) =>
  page.addInitScript(() => { try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {} });

const EMAIL = process.env.TEST_LOGIN_EMAIL || (process.env.TEST_PRO_EMAILS || '').split(',')[0].trim();
const PASS = process.env.TEST_LOGIN_PASSWORD || process.env.TEST_PRO_PASSWORD || '';
const LIVE = !!(EMAIL && PASS);

test.describe('L-V388 MC feedback colours (no auth)', () => {
  test('--success is clear green, --error is clear red on body.app', async ({ page }) => {
    await bypassGate(page);
    await page.goto('/app.html');
    await page.waitForLoadState('domcontentloaded');
    const tokens = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      const norm = (v) => v.trim();
      return { success: norm(cs.getPropertyValue('--success')), error: norm(cs.getPropertyValue('--error')) };
    });
    // #3C7A4E green and #B23B2E red (any equivalent rgb/hex form is fine).
    expect(tokens.success.toLowerCase()).toMatch(/#3c7a4e|rgb\(60,\s*122,\s*78\)/);
    expect(tokens.error.toLowerCase()).toMatch(/#b23b2e|rgb\(178,\s*59,\s*46\)/);
  });
});

test.describe('L-V388 sidebar (logged in)', () => {
  test.skip(!LIVE, 'set TEST_LOGIN_PASSWORD + a test email to run');

  test.beforeEach(async ({ page }) => {
    await bypassGate(page);
    await page.goto('/app.html');
    await page.locator('#tab-login').click();
    await page.locator('#auth-email').fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/') && r.request().method() === 'POST', { timeout: 15000 }),
      page.locator('#btn-auth-submit').click(),
    ]);
    await page.goto('/app.html#/oppimispolku');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
  });

  test('nav has exactly the 4 export destinations, no Mestari', async ({ page }) => {
    const items = page.locator('[data-mode-only="home"] .sidebar-item');
    await expect(items).toHaveCount(4);
    await expect(items).toHaveText([/Etusivu/, /Oppimispolku/, /Kirjoittaminen/, /Koesimulaatio/]);
    const sidebar = (await page.locator('.app-sidebar').textContent()) || '';
    expect(sidebar).not.toContain('Mestari');
  });

  test('active item uses the brick accent (not the old yellow pill)', async ({ page }) => {
    const active = page.locator('[data-mode-only="home"] .sidebar-item.active');
    await expect(active).toHaveText(/Oppimispolku/);
    const color = await active.evaluate((el) => getComputedStyle(el).color);
    // brick #9B2D2A ~ rgb(155,45,42); assert it is a warm red, not near-black ink.
    const m = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    expect(m).not.toBeNull();
    const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
    expect(r).toBeGreaterThan(g + 40);
    expect(r).toBeGreaterThan(b + 40);
  });

  test('Oppimispolku index renders the 8-course library', async ({ page }) => {
    await expect(page.locator('#op-root')).toBeVisible();
    await expect(page.locator('#op-root')).toContainText('Kurssi 1');
  });
});
