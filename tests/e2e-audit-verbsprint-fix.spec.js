// Verb-sprint input layout fix audit (2026-05-18). Logs in, forces the
// verbsprint screen to render with a populated prompt + visible input,
// then screenshots desktop + mobile so the column layout can be verified.
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('verbsprint input layout', async ({ page }) => {
  test.setTimeout(120_000);

  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });

  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.locator('button:has-text("Kirjaudu sisään")').first().click(),
    ]);
    await page.waitForTimeout(2000);
  }

  await page.evaluate(() => {
    document.querySelectorAll('.screen.active').forEach(el => el.classList.remove('active'));
    const s = document.getElementById('screen-verbsprint');
    if (s) s.classList.add('active');
    const inf = document.getElementById('vs-infinitive');
    if (inf) inf.textContent = 'sentir';
    const tr = document.getElementById('vs-translation');
    if (tr) tr.textContent = 'tuntea';
    const p = document.getElementById('vs-person');
    if (p) p.textContent = 'vosotros';
    const cnt = document.getElementById('vs-counter');
    if (cnt) cnt.textContent = '3 / 10';
    const t = document.getElementById('vs-tense-badge');
    if (t) t.textContent = 'Preteriti';
    const par = document.getElementById('vs-paradigms-badge');
    if (par) par.textContent = '1';
  });
  await page.waitForTimeout(600);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(OUT_DIR, 'verbsprint-fix-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(OUT_DIR, 'verbsprint-fix-mobile.png'), fullPage: true });
});
